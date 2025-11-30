// Sync Service
// Handles syncing offline changes when connection is restored

import { offlineStorage } from './offlineStorage'
import { connectionStatus } from './connectionStatus'
import { clientService } from '../api/clientService'
import { hearingReportService } from '../api/hearingReportService'
import { reminderService } from '../api/reminderService'
import { Client } from '@hearing-clinic/shared/src/models/client'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'
import { Reminder } from '@hearing-clinic/shared/src/models/reminder'

interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'Client' | 'HearingReport' | 'Reminder'
  entityId?: string
  data: any
  timestamp: number
  retryCount?: number
}

const MAX_RETRY_COUNT = 3

class SyncService {
  private isSyncing = false
  private syncListeners: Set<(syncing: boolean) => void> = new Set()

  constructor() {
    // Listen to connection status changes
    connectionStatus.subscribe((status) => {
      if (status === 'online' && !this.isSyncing) {
        // Auto-sync when connection is restored
        // Small delay to ensure connection is stable
        setTimeout(() => {
          this.sync()
        }, 1000)
      }
    })
    
    // Also check for sync queue periodically when online
    setInterval(() => {
      if (connectionStatus.getStatus() === 'online' && !this.isSyncing) {
        offlineStorage.getSyncQueue().then(queue => {
          if (queue.length > 0) {
            this.sync()
          }
        })
      }
    }, 30000) // Check every 30 seconds
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return
    if (connectionStatus.getStatus() !== 'online') return

    this.isSyncing = true
    this.notifyListeners(true)

    try {
      const queue = await offlineStorage.getSyncQueue()
      
      for (const item of queue) {
        try {
          await this.processSyncItem(item)
          await offlineStorage.removeFromSyncQueue(item.id)
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
          
          // Increment retry count
          const retryCount = (item.retryCount || 0) + 1
          
          if (retryCount >= MAX_RETRY_COUNT) {
            // Max retries reached, remove from queue
            console.error(`Max retries (${MAX_RETRY_COUNT}) reached for item ${item.id}, removing from queue`)
            await offlineStorage.removeFromSyncQueue(item.id)
          } else {
            // Update retry count in queue
            await offlineStorage.updateSyncQueueItem(item.id, { retryCount })
          }
        }
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      this.isSyncing = false
      this.notifyListeners(false)
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.entityType) {
      case 'Client':
        await this.syncClient(item)
        break
      case 'HearingReport':
        await this.syncHearingReport(item)
        break
      case 'Reminder':
        await this.syncReminder(item)
        break
    }
  }

  private async syncClient(item: SyncQueueItem): Promise<void> {
    if (item.type === 'create') {
      await clientService.create(item.data)
    } else if (item.type === 'update' && item.entityId) {
      await clientService.update(item.entityId, item.data)
    } else if (item.type === 'delete' && item.entityId) {
      await clientService.delete(item.entityId)
    }
  }

  private async syncHearingReport(item: SyncQueueItem): Promise<void> {
    if (item.type === 'create') {
      await hearingReportService.create(item.data)
    } else if (item.type === 'update' && item.entityId) {
      await hearingReportService.update(item.entityId, item.data)
    } else if (item.type === 'delete' && item.entityId) {
      await hearingReportService.delete(item.entityId)
    }
  }

  private async syncReminder(item: SyncQueueItem): Promise<void> {
    if (item.type === 'create') {
      await reminderService.create(item.data)
    } else if (item.type === 'update' && item.entityId) {
      await reminderService.update(item.entityId, item.data)
    } else if (item.type === 'delete' && item.entityId) {
      await reminderService.delete(item.entityId)
    }
  }

  subscribe(listener: (syncing: boolean) => void): () => void {
    this.syncListeners.add(listener)
    listener(this.isSyncing)
    return () => {
      this.syncListeners.delete(listener)
    }
  }

  private notifyListeners(syncing: boolean) {
    this.syncListeners.forEach(listener => listener(syncing))
  }

  isCurrentlySyncing(): boolean {
    return this.isSyncing
  }
}

export const syncService = new SyncService()

