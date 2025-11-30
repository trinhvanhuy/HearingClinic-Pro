// Offline Storage Service using IndexedDB
// Stores cached data and sync queue

const DB_NAME = 'hearing-clinic-offline'
const DB_VERSION = 1

interface OfflineData {
  clients: any[]
  hearingReports: any[]
  reminders: any[]
  lastSync: number
}

interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'Client' | 'HearingReport' | 'Reminder'
  entityId?: string
  data: any
  timestamp: number
  retryCount?: number
}

class OfflineStorageService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache')
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
          queueStore.createIndex('entityType', 'entityType', { unique: false })
        }
      }
    })
  }

  // Cache operations
  async cacheData(key: string, data: any): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.put(data, key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async clearCache(): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const queueItem: SyncQueueItem = {
        ...item,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }
      const request = store.add(queueItem)
      request.onsuccess = () => resolve(queueItem.id)
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly')
      const store = transaction.objectStore('syncQueue')
      const index = store.index('timestamp')
      const request = index.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (!item) {
          reject(new Error(`Sync queue item ${id} not found`))
          return
        }
        
        const updatedItem = { ...item, ...updates }
        const putRequest = store.put(updatedItem)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineStorage = new OfflineStorageService()

