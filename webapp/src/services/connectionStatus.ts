// Connection Status Service
// Monitors online/offline status and server connectivity

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
    window.addEventListener('online', () => this.checkConnection())
    window.addEventListener('offline', () => this.setStatus('offline'))

    // Initial check
    this.checkConnection()

    // Periodic check every 30 seconds
    this.checkInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.checkConnection()
      }
    }, 30000)
  }

  private async checkConnection() {
    if (!navigator.onLine) {
      this.setStatus('offline')
      return
    }

    this.setStatus('checking')

    try {
      // Try to ping Parse Server health endpoint
      const healthUrl = this.serverURL.replace('/parse', '/health')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        this.setStatus('online')
      } else {
        this.setStatus('offline')
      }
    } catch (error) {
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

