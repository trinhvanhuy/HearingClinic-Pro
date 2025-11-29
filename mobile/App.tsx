import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RootNavigator from './src/navigation/RootNavigator'
import './src/api/parseClient'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  )
}

