import { useState, useEffect } from 'react'
import Parse, { ensureParseInitialized } from '../api/parseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offlineStorage } from '../services/offlineStorage'
import { clientService } from '../api/clientService'
import { hearingReportService } from '../api/hearingReportService'
import { reminderService } from '../api/reminderService'

export function useAuth() {
  const [user, setUser] = useState<Parse.User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ensure Parse is initialized before checking current user
    ensureParseInitialized()
    
    // Check if there's a current user (from persisted session)
    // Parse SDK automatically restores session from localStorage
    const checkCurrentUser = async () => {
      try {
        const currentUser = Parse.User.current()
        
        // If there's a current user, verify the session is still valid
        if (currentUser) {
          try {
            // Verify session by fetching current user data
            await currentUser.fetch()
            setUser(currentUser)
          } catch (error) {
            // Session is invalid, clear it
            await Parse.User.logOut()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        // Error checking user, assume not logged in
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkCurrentUser()
  }, [])

  const loginMutation = useMutation({
    mutationFn: async ({ username, password, rememberMe = true }: { username: string; password: string; rememberMe?: boolean }) => {
      // Ensure Parse is initialized before login
      ensureParseInitialized()
      
      // If there's an initialization error, wait a bit and try again
      try {
        // Parse SDK automatically persists session in localStorage
        // The session token is stored automatically and will persist across page reloads
        const user = await Parse.User.logIn(username, password)
        setUser(user)
        
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
            setUser(user)
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
      setUser(null)
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
    user,
    loading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}

