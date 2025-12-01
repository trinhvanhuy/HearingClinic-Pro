// Helper functions for offline mode operations

import { offlineStorage } from './offlineStorage'
import { connectionStatus } from './connectionStatus'
import Parse from 'parse'

/**
 * Normalize data before storing in sync queue
 * Converts Parse Objects (like client pointer) to just their objectId
 */
function normalizeDataForQueue(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const normalized: any = {}
  
  for (const key in data) {
    const value = data[key]
    
    if (value instanceof Parse.Object) {
      // Convert Parse Object to just its objectId
      normalized[key] = value.id || value._id || value.objectId
    } else if (value && typeof value === 'object' && value.__type === 'Pointer') {
      // Already a Pointer JSON, extract objectId
      normalized[key] = value.objectId
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Recursively normalize nested objects
      normalized[key] = normalizeDataForQueue(value)
    } else {
      // Primitive values, arrays, dates - keep as is
      normalized[key] = value
    }
  }
  
  return normalized
}

export async function handleOfflineOperation<T extends Parse.Object>(
  entityType: 'Client' | 'HearingReport' | 'Reminder',
  operation: 'create' | 'update' | 'delete',
  onlineOperation: () => Promise<T>,
  data?: any,
  entityId?: string
): Promise<T> {
  const isOnline = connectionStatus.getStatus() === 'online'

  if (isOnline) {
    try {
      // Call online operation with original data (Parse Objects preserved)
      const result = await onlineOperation()
      
      // Only update cache for read operations or when explicitly needed
      // Don't cache every write operation - only cache when offline or on error
      // Cache is mainly for reading data when offline
      
      return result
    } catch (error: any) {
      // Only add to sync queue if it's a network error or connection issue
      // Don't add validation errors or other non-retryable errors
      const isNetworkError = error.code === 100 || error.code === 107 || 
                            error.message?.includes('network') || 
                            error.message?.includes('timeout') ||
                            error.message?.includes('ECONNREFUSED')
      
      // Only queue if it's a network error that might be retryable
      // Validation errors (like invalid pointer) should NOT be queued
      if (isNetworkError) {
        console.log('Network error detected, adding to sync queue for retry')
        await offlineStorage.addToSyncQueue({
          type: operation,
          entityType,
          entityId,
          data: normalizeDataForQueue(data || {}),
        })
      } else {
        console.log('Non-network error, NOT adding to sync queue:', error.message || error)
      }
      
      throw error
    }
  } else {
    // Offline mode
    await offlineStorage.addToSyncQueue({
      type: operation,
      entityType,
      entityId,
      data: normalizeDataForQueue(data || {}),
    })

    // Update cache
    await updateCacheForOfflineOperation(entityType, operation, data, entityId)

    // Return a temporary object
    if (operation === 'create') {
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const EntityClass = Parse.Object.extend(entityType)
      const entity = new EntityClass({ ...data, objectId: tempId })
      return entity as T
    } else if (operation === 'update' && entityId) {
      const cached = await offlineStorage.getCachedData(entityType.toLowerCase() + 's') || []
      const index = cached.findIndex((item: any) => item.objectId === entityId)
      if (index >= 0) {
        Object.assign(cached[index], data)
        await offlineStorage.cacheData(entityType.toLowerCase() + 's', cached)
        return Parse.Object.fromJSON(cached[index], false) as T
      }
    } else if (operation === 'delete' && entityId) {
      const cached = await offlineStorage.getCachedData(entityType.toLowerCase() + 's') || []
      const filtered = cached.filter((item: any) => item.objectId !== entityId)
      await offlineStorage.cacheData(entityType.toLowerCase() + 's', filtered)
    }

    throw new Error('Operation queued for sync')
  }
}

async function updateCacheAfterOperation(
  entityType: 'Client' | 'HearingReport' | 'Reminder',
  operation: 'create' | 'update' | 'delete',
  result: Parse.Object,
  entityId?: string
): Promise<void> {
  const cacheKey = entityType.toLowerCase() + 's'
  const cached = await offlineStorage.getCachedData(cacheKey) || []

  if (operation === 'create') {
    cached.push(result.toJSON())
  } else if (operation === 'update') {
    const index = cached.findIndex((item: any) => item.objectId === result.id)
    if (index >= 0) {
      cached[index] = result.toJSON()
    }
  } else if (operation === 'delete') {
    const filtered = cached.filter((item: any) => item.objectId !== entityId)
    await offlineStorage.cacheData(cacheKey, filtered)
    return
  }

  await offlineStorage.cacheData(cacheKey, cached)
}

async function updateCacheForOfflineOperation(
  entityType: 'Client' | 'HearingReport' | 'Reminder',
  operation: 'create' | 'update' | 'delete',
  data: any,
  entityId?: string
): Promise<void> {
  const cacheKey = entityType.toLowerCase() + 's'
  const cached = await offlineStorage.getCachedData(cacheKey) || []

  if (operation === 'create') {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    cached.push({ ...data, objectId: tempId, createdAt: new Date().toISOString() })
  } else if (operation === 'update' && entityId) {
    const index = cached.findIndex((item: any) => item.objectId === entityId)
    if (index >= 0) {
      Object.assign(cached[index], data)
    }
  } else if (operation === 'delete' && entityId) {
    const filtered = cached.filter((item: any) => item.objectId !== entityId)
    await offlineStorage.cacheData(cacheKey, filtered)
    return
  }

  await offlineStorage.cacheData(cacheKey, cached)
}

export async function getCachedEntities<T extends Parse.Object>(
  entityType: 'Client' | 'HearingReport' | 'Reminder',
  onlineOperation: () => Promise<T[]>
): Promise<T[]> {
  const isOnline = connectionStatus.getStatus() === 'online'

  try {
    const entities = await onlineOperation()
    
    // Cache the results
    if (isOnline) {
      await offlineStorage.cacheData(
        entityType.toLowerCase() + 's',
        entities.map(e => e.toJSON())
      )
    }
    
    return entities
  } catch (error) {
    // If offline or error, try to get from cache
    const cached = await offlineStorage.getCachedData(entityType.toLowerCase() + 's')
    if (cached) {
      return cached.map((data: any) => {
        return Parse.Object.fromJSON(data, false) as T
      })
    }
    throw error
  }
}

export async function getCachedEntity<T extends Parse.Object>(
  entityType: 'Client' | 'HearingReport' | 'Reminder',
  id: string,
  onlineOperation: () => Promise<T>
): Promise<T> {
  const isOnline = connectionStatus.getStatus() === 'online'

  try {
    const entity = await onlineOperation()
    
    // Update cache
    if (isOnline) {
      const cacheKey = entityType.toLowerCase() + 's'
      const cached = await offlineStorage.getCachedData(cacheKey) || []
      const index = cached.findIndex((item: any) => item.objectId === id)
      if (index >= 0) {
        cached[index] = entity.toJSON()
      } else {
        cached.push(entity.toJSON())
      }
      await offlineStorage.cacheData(cacheKey, cached)
    }
    
    return entity
  } catch (error) {
    // Try cache
    const cached = await offlineStorage.getCachedData(entityType.toLowerCase() + 's')
    if (cached) {
      const entityData = cached.find((item: any) => item.objectId === id)
      if (entityData) {
        return Parse.Object.fromJSON(entityData, false) as T
      }
    }
    throw error
  }
}

