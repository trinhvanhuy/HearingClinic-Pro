import { useState, useEffect } from 'react'
import Parse, { ensureParseInitialized } from '../api/parseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offlineStorage } from '../services/offlineStorage'
import { clientService } from '../api/clientService'
import { hearingReportService } from '../api/hearingReportService'
import { reminderService } from '../api/reminderService'

// Shared user query - this will be cached and only fetched once
const fetchCurrentUser = async (): Promise<Parse.User | null> => {
  ensureParseInitialized()
  const currentUser = Parse.User.current()
  
  if (!currentUser) {
    return null
  }
  
  try {
    // Verify session by fetching current user data
    await currentUser.fetch()
    return currentUser
  } catch (error) {
    // Session is invalid, clear it
    await Parse.User.logOut()
    return null
  }
}

export function useAuth() {
  // Use React Query to cache the user fetch - this ensures it only happens once
  const { data: user, isLoading: loading, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: false,
  })
  
  const [userState, setUserState] = useState<Parse.User | null>(user || null)
  
  // Sync userState with query data
  useEffect(() => {
    setUserState(user || null)
  }, [user])

  const queryClient = useQueryClient()
  
  const loginMutation = useMutation({
    mutationFn: async ({ username, password, rememberMe = true }: { username: string; password: string; rememberMe?: boolean }) => {
      // Ensure Parse is initialized before login
      ensureParseInitialized()
      
      // If there's an initialization error, wait a bit and try again
      try {
        // Parse SDK automatically persists session in localStorage
        // The session token is stored automatically and will persist across page reloads
        const user = await Parse.User.logIn(username, password)
        setUserState(user)
        // Update React Query cache
        queryClient.setQueryData(['currentUser'], user)
        
        // Initialize offline storage and cache data
        try {
          await offlineStorage.init()
          
          // Cache all data for offline use
          const [clients, reports, reminders] = await Promise.all([
            clientService.getAll({ limit: 1000 }).catch(() => []),
            hearingReportService.getAll({ limit: 1000 }).catch(() => []),
            reminderService.getAll({ limit: 1000 }).catch(() => []),
          ])
          
          await Promise.all([
            offlineStorage.cacheData('clients', clients.map(c => c.toJSON())),
            offlineStorage.cacheData('hearingReports', reports.map(r => r.toJSON())),
            offlineStorage.cacheData('reminders', reminders.map(r => r.toJSON())),
            offlineStorage.cacheData('lastSync', Date.now()),
          ])
        } catch (error) {
          console.warn('Failed to cache data:', error)
        }
        
        return user
      } catch (error: any) {
        // If error is "Invalid server state: initialized", try to re-initialize and retry
        if (error?.code === 1 && error?.message?.includes('initialized')) {
          // Force re-initialization
          try {
            Parse.serverURL = (import.meta as any).env?.VITE_PARSE_SERVER_URL || 'http://localhost:1338/parse'
            // Retry login
            const user = await Parse.User.logIn(username, password)
            setUserState(user)
            queryClient.setQueryData(['currentUser'], user)
            return user
          } catch (retryError: any) {
            throw retryError
          }
        }
        throw error
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await Parse.User.logOut()
      setUserState(null)
      // Clear React Query cache
      queryClient.setQueryData(['currentUser'], null)
      // Clear remembered username when logging out
      localStorage.removeItem('hearing_clinic_remember_me')
      localStorage.removeItem('hearing_clinic_username')
    },
  })

  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      await Parse.User.requestPasswordReset(email)
    },
  })

  return {
    user: userState,
    loading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}

