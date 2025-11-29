import { useState, useEffect } from 'react'
import Parse from 'parse'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useAuth() {
  const [user, setUser] = useState<Parse.User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = Parse.User.current()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const user = await Parse.User.logIn(username, password)
      setUser(user)
      return user
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await Parse.User.logOut()
      setUser(null)
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

