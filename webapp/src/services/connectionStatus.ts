// Connection Status Service
// Monitors online/offline status and server connectivity

import Parse from '../api/parseClient'

export type ConnectionStatus = 'online' | 'offline' | 'checking'

class ConnectionStatusService {
  private status: ConnectionStatus = 'checking'
  private listeners: Set<(status: ConnectionStatus) => void> = new Set()
  private checkInterval: number | null = null
  private serverURL: string

  constructor() {
    // Get server URL from environment or use default
    this.serverURL = (import.meta as any).env?.VITE_PARSE_SERVER_URL || 'http://localhost:1338/parse'
    this.init()
  }

  private init() {
    // Listen to browser online/offline events
    const handleOnline = () => {
      // When browser reports online, check connection immediately
      this.checkConnection()
    }
    
    const handleOffline = () => {
      // When browser reports offline, set offline immediately
      this.setStatus('offline')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    this.checkConnection()

    // Periodic check every 30 seconds to verify backend connectivity
    this.checkInterval = window.setInterval(() => {
      // Only check if browser reports online
      // This ensures we're checking actual backend connectivity, not just network
      if (navigator.onLine) {
        this.checkConnection()
      }
    }, 30000) // 30 seconds
  }

  private async checkConnection() {
    // If browser reports offline, set offline immediately
    if (!navigator.onLine) {
      this.setStatus('offline')
      return
    }

    // Only show checking if we're currently offline (to avoid flickering when already online)
    if (this.status === 'offline') {
      this.setStatus('checking')
    }

    try {
      // Check health endpoint (fast, no auth needed, confirms backend is running)
      const healthUrl = this.serverURL.replace('/parse', '/health')
      const healthController = new AbortController()
      const healthTimeout = setTimeout(() => healthController.abort(), 5000)

      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        signal: healthController.signal,
        cache: 'no-cache',
        mode: 'cors', // Explicitly request CORS
      })

      clearTimeout(healthTimeout)

      if (healthResponse.ok) {
        // Health endpoint is accessible - backend is online
        this.setStatus('online')
      } else {
        // Health endpoint returned non-OK status
        console.warn('Health endpoint returned non-OK status:', healthResponse.status)
        this.setStatus('offline')
      }
    } catch (error: any) {
      // Network error, timeout, or CORS issue - consider offline
      if (error.name === 'AbortError') {
        console.warn('Health check timed out')
      } else {
        console.warn('Health check failed:', error.message)
      }
      this.setStatus('offline')
    }
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus
      this.listeners.forEach(listener => listener(newStatus))
    }
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current status
    listener(this.status)
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    window.removeEventListener('online', () => this.checkConnection())
    window.removeEventListener('offline', () => this.setStatus('offline'))
  }
}

export const connectionStatus = new ConnectionStatusService()

