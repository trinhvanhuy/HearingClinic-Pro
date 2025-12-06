import Parse from './parseClient'
import { Client } from '@hearing-clinic/shared/src/models/client'
import { offlineStorage } from '../services/offlineStorage'
import { connectionStatus } from '../services/connectionStatus'

export interface ClientSearchParams {
  search?: string
  isActive?: boolean
  limit?: number
  skip?: number
}

export const clientService = {
  async getAll(params: ClientSearchParams = {}): Promise<Client[]> {
    const isOnline = connectionStatus.getStatus() === 'online'
    
    try {
      const query = new Parse.Query(Client)
      
      let finalQuery = query
      
      if (params.search) {
        const searchTerm = params.search.trim()
        if (searchTerm) {
          // Use regex for case-insensitive search
          // Escape special regex characters and create case-insensitive pattern
          const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // Create regex pattern that matches anywhere in the string (case-insensitive)
          // Add .* at start and end to match substring anywhere in the field
          const searchRegex = new RegExp(`.*${escapedSearch}.*`, 'i')
          
          // Create separate queries for each field with base filters
          const createBaseQuery = () => {
            const q = new Parse.Query(Client)
            if (params.isActive !== undefined) {
              q.equalTo('isActive', params.isActive)
            }
            return q
          }
          
          // Parse Server matches() accepts RegExp object
          const fullNameQuery = createBaseQuery().matches('fullName', searchRegex)
          const firstNameQuery = createBaseQuery().matches('firstName', searchRegex)
          const lastNameQuery = createBaseQuery().matches('lastName', searchRegex)
          const phoneQuery = createBaseQuery().matches('phone', searchRegex)
          const emailQuery = createBaseQuery().matches('email', searchRegex)
          
          // Also try exact match for phone (without regex) in case it's a number
          const phoneExactQuery = createBaseQuery().equalTo('phone', searchTerm)
          
          // Combine all queries with OR
          finalQuery = Parse.Query.or(
            fullNameQuery,
            firstNameQuery,
            lastNameQuery,
            phoneQuery,
            emailQuery,
            phoneExactQuery
          )
        }
      } else {
        // If no search, apply filters to base query
        if (params.isActive !== undefined) {
          finalQuery.equalTo('isActive', params.isActive)
        }
      }
      
      // Apply sorting and pagination to final query
      finalQuery.descending('updatedAt')
      finalQuery.limit(params.limit || 50)
      finalQuery.skip(params.skip || 0)
      
      const clients = await finalQuery.find()
      
      // Cache the results
      if (isOnline) {
        await offlineStorage.cacheData('clients', clients.map(c => c.toJSON()))
      }
      
      return clients
    } catch (error) {
      // If offline or error, try to get from cache
      const cached = await offlineStorage.getCachedData('clients')
      if (cached) {
        return cached.map((data: any) => {
          const client = Parse.Object.fromJSON(data, false)
          return client as Client
        })
      }
      throw error
    }
  },

  async getById(id: string): Promise<Client> {
    const isOnline = connectionStatus.getStatus() === 'online'
    
    try {
      const query = new Parse.Query(Client)
      const client = await query.get(id)
      
      // Cache individual client
      if (isOnline) {
        const cached = await offlineStorage.getCachedData('clients') || []
        const index = cached.findIndex((c: any) => c.objectId === id)
        if (index >= 0) {
          cached[index] = client.toJSON()
        } else {
          cached.push(client.toJSON())
        }
        await offlineStorage.cacheData('clients', cached)
      }
      
      return client
    } catch (error) {
      // Try cache
      const cached = await offlineStorage.getCachedData('clients')
      if (cached) {
        const clientData = cached.find((c: any) => c.objectId === id)
        if (clientData) {
          return Parse.Object.fromJSON(clientData, false) as Client
        }
      }
      throw error
    }
  },

  async create(data: Partial<Client>): Promise<Client> {
    const isOnline = connectionStatus.getStatus() === 'online'
    
    if (isOnline) {
      try {
        const client = new Client(data)
        const saved = await client.save()
        
        // Update cache
        const cached = await offlineStorage.getCachedData('clients') || []
        cached.push(saved.toJSON())
        await offlineStorage.cacheData('clients', cached)
        
        return saved
      } catch (error) {
        // If save fails, add to sync queue
        await offlineStorage.addToSyncQueue({
          type: 'create',
          entityType: 'Client',
          data,
        })
        throw error
      }
    } else {
      // Offline: create local object and add to sync queue
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const client = new Client({ ...data, objectId: tempId })
      
      await offlineStorage.addToSyncQueue({
        type: 'create',
        entityType: 'Client',
        entityId: tempId,
        data,
      })
      
      // Update cache
      const cached = await offlineStorage.getCachedData('clients') || []
      cached.push(client.toJSON())
      await offlineStorage.cacheData('clients', cached)
      
      return client
    }
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const isOnline = connectionStatus.getStatus() === 'online'
    
    if (isOnline) {
      try {
        const client = await this.getById(id)
        Object.keys(data).forEach(key => {
          client.set(key, (data as any)[key])
        })
        const saved = await client.save()
        
        // Update cache
        const cached = await offlineStorage.getCachedData('clients') || []
        const index = cached.findIndex((c: any) => c.objectId === id)
        if (index >= 0) {
          cached[index] = saved.toJSON()
          await offlineStorage.cacheData('clients', cached)
        }
        
        return saved
      } catch (error) {
        await offlineStorage.addToSyncQueue({
          type: 'update',
          entityType: 'Client',
          entityId: id,
          data,
        })
        throw error
      }
    } else {
      // Offline: update cache and add to sync queue
      await offlineStorage.addToSyncQueue({
        type: 'update',
        entityType: 'Client',
        entityId: id,
        data,
      })
      
      // Update cache
      const cached = await offlineStorage.getCachedData('clients') || []
      const index = cached.findIndex((c: any) => c.objectId === id)
      if (index >= 0) {
        Object.assign(cached[index], data)
        await offlineStorage.cacheData('clients', cached)
      }
      
      // Return updated client from cache
      if (index >= 0) {
        return Parse.Object.fromJSON(cached[index], false) as Client
      }
      throw new Error('Client not found in cache')
    }
  },

  async delete(id: string): Promise<void> {
    const isOnline = connectionStatus.getStatus() === 'online'
    
    if (isOnline) {
      try {
        const client = await this.getById(id)
        await client.destroy()
        
        // Update cache
        const cached = await offlineStorage.getCachedData('clients') || []
        const filtered = cached.filter((c: any) => c.objectId !== id)
        await offlineStorage.cacheData('clients', filtered)
      } catch (error) {
        await offlineStorage.addToSyncQueue({
          type: 'delete',
          entityType: 'Client',
          entityId: id,
          data: {},
        })
        throw error
      }
    } else {
      // Offline: remove from cache and add to sync queue
      await offlineStorage.addToSyncQueue({
        type: 'delete',
        entityType: 'Client',
        entityId: id,
        data: {},
      })
      
      // Update cache
      const cached = await offlineStorage.getCachedData('clients') || []
      const filtered = cached.filter((c: any) => c.objectId !== id)
      await offlineStorage.cacheData('clients', filtered)
    }
  },
}

