import Parse from './parseClient'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'
import { Client } from '@hearing-clinic/shared/src/models/client'
import { getCachedEntities, getCachedEntity, handleOfflineOperation } from '../services/offlineHelper'

export interface HearingReportSearchParams {
  clientId?: string
  limit?: number
  skip?: number
}

export const hearingReportService = {
  async getAll(params: HearingReportSearchParams = {}): Promise<HearingReport[]> {
    return getCachedEntities<HearingReport>('HearingReport', async () => {
      const query = new Parse.Query(HearingReport)
      
      if (params.clientId) {
        const client = Parse.Object.createWithoutData('Client', params.clientId)
        query.equalTo('client', client)
      }
      
      query.descending('testDate')
      query.include('client')
      query.include('audiologist')
      query.limit(params.limit || 50)
      query.skip(params.skip || 0)
      
      return query.find()
    })
  },

  async getById(id: string): Promise<HearingReport> {
    return getCachedEntity<HearingReport>('HearingReport', id, async () => {
      const query = new Parse.Query(HearingReport)
      query.include('client')
      query.include('audiologist')
      return query.get(id)
    })
  },

  async create(data: Partial<HearingReport>): Promise<HearingReport> {
    console.log('hearingReportService.create called at:', new Date().toISOString())
    return handleOfflineOperation<HearingReport>(
      'HearingReport',
      'create',
      async () => {
        console.log('Online operation (create) started at:', new Date().toISOString())
        const report = new HearingReport()
        
        // Extract client objectId from various possible formats
        let clientObjectId: string | null = null
        
        if (data.client instanceof Parse.Object) {
          // Client is a Parse Object - extract its ID
          const client = data.client as any
          clientObjectId = client.id || client._id || client.objectId
        } else if (typeof data.client === 'string') {
          // Client is just an objectId string (from sync queue or direct input)
          clientObjectId = data.client.trim()
        } else if (data.client && typeof data.client === 'object') {
          // Client is a plain object (from offline sync or serialized)
          const clientObj = data.client as any
          // Try multiple possible property names
          clientObjectId = clientObj.objectId || clientObj._id || clientObj.id
          
          // If it's a Pointer JSON format
          if (!clientObjectId && clientObj.__type === 'Pointer') {
            clientObjectId = clientObj.objectId
          }
          
          // Convert to string if it's a number or other type
          if (clientObjectId && typeof clientObjectId !== 'string') {
            clientObjectId = String(clientObjectId)
          }
        }
        
        // Validate objectId - be more lenient for sync operations
        if (!clientObjectId || typeof clientObjectId !== 'string') {
          console.error('Invalid client objectId:', clientObjectId, 'client:', data.client, 'data:', data)
          throw new Error(`Invalid client ID: ${clientObjectId || 'missing'}`)
        }
        
        // Trim and validate length (Parse objectIds are typically 10 characters)
        clientObjectId = clientObjectId.trim()
        
        // Check for invalid values
        if (clientObjectId === 'Client' || clientObjectId === 'client' || clientObjectId.length < 5) {
          console.error('Invalid client objectId (validation failed):', {
            objectId: clientObjectId,
            length: clientObjectId.length,
            client: data.client,
            fullData: data
          })
          throw new Error(`Invalid client ID: ${clientObjectId} (too short or invalid value)`)
        }
        
        // Create a fresh Parse Object pointer using createWithoutData
        // This creates an unfetched pointer that should serialize correctly
        console.log('Creating pointer with:', {
          className: 'Client',
          objectId: clientObjectId,
          objectIdType: typeof clientObjectId,
          objectIdLength: clientObjectId.length
        })
        
        let clientPointer: Parse.Object
        try {
          // Parse SDK's createWithoutData takes (className, objectId)
          // But it may not set the id property correctly, so we need to manually ensure it
          clientPointer = Parse.Object.createWithoutData('Client', clientObjectId)
          
          // Parse SDK stores objectId in _localId or _id for unfetched objects
          // We need to manually set id to ensure it's correct
          const pointerObj = clientPointer as any
          
          // Force set the objectId in all possible properties
          // Parse SDK may use different internal properties
          pointerObj.id = clientObjectId
          pointerObj._id = clientObjectId
          pointerObj.objectId = clientObjectId
          pointerObj._localId = clientObjectId
          
          // Ensure className is set
          pointerObj.className = 'Client'
          
          // Verify it was set correctly
          if (pointerObj.id !== clientObjectId && pointerObj._id !== clientObjectId) {
            console.warn('Pointer ID may not be set correctly, but continuing...', {
              id: pointerObj.id,
              _id: pointerObj._id,
              objectId: pointerObj.objectId,
              _localId: pointerObj._localId
            })
          }
        } catch (error: any) {
          console.error('createWithoutData threw error:', error)
          throw new Error(`Failed to create pointer: ${error.message || error}`)
        }
        
        // Verify the pointer was created
        if (!clientPointer) {
          console.error('clientPointer is null/undefined')
          throw new Error(`Failed to create client pointer: pointer is null`)
        }
        
        const pointerObj = clientPointer as any
        console.log('Pointer created and configured:', {
          requestedId: clientObjectId,
          id: pointerObj.id,
          _id: pointerObj._id,
          objectId: pointerObj.objectId,
          className: pointerObj.className,
          isParseObject: clientPointer instanceof Parse.Object
        })
        
        // Use _encode to check how Parse SDK will encode this pointer
        let encodedPointer = null
        if (pointerObj._encode) {
          encodedPointer = pointerObj._encode()
          console.log('Pointer _encode result:', encodedPointer)
        }
        
        // Set the client pointer using set() method
        // Parse SDK should automatically serialize unfetched pointers correctly
        report.set('client', clientPointer)
        
        // Verify the pointer is set correctly
        const setClient = report.get('client')
        if (!setClient) {
          throw new Error('Failed to set client pointer in report')
        }
        
        // Force Parse SDK to recognize this as a pointer by using _set directly
        // Sometimes set() doesn't work correctly for pointers
        const reportObj = report as any
        if (reportObj._set) {
          // Use internal _set method which may work better for pointers
          reportObj._set('client', clientPointer, {})
        }
        
        // Also try using the pointer's toPointer() method if available
        if ((clientPointer as any).toPointer) {
          const pointerJSON = (clientPointer as any).toPointer()
          console.log('Pointer toPointer() result:', pointerJSON)
          // Set it as a plain object with Pointer format
          if (pointerJSON && pointerJSON.__type === 'Pointer') {
            report.set('client', pointerJSON)
          }
        }
        
        // Check how the report will serialize the client before save
        // Use toJSON() to see what will be sent
        const reportJSON = report.toJSON()
        const clientInJSON = reportJSON.client
        console.log('Client in report toJSON():', {
          type: typeof clientInJSON,
          value: clientInJSON,
          isPointer: clientInJSON?.__type === 'Pointer',
          className: clientInJSON?.className,
          objectId: clientInJSON?.objectId
        })
        
        // If client is not in Pointer format in JSON, we have a problem
        if (!clientInJSON || (typeof clientInJSON === 'object' && clientInJSON.__type !== 'Pointer')) {
          console.error('Client is NOT serialized as Pointer in toJSON()!', clientInJSON)
          
          // Last resort: set it as a Pointer JSON object directly
          const pointerJSON = {
            __type: 'Pointer',
            className: 'Client',
            objectId: clientObjectId
          }
          console.log('Setting client as Pointer JSON directly:', pointerJSON)
          report.set('client', pointerJSON)
          
          // Verify it's now correct
          const finalJSON = report.toJSON()
          const finalClient = finalJSON.client
          console.log('Client after setting Pointer JSON:', {
            isPointer: finalClient?.__type === 'Pointer',
            objectId: finalClient?.objectId
          })
        }
        
        // Debug log
        console.log('Setting client pointer in report:', {
          objectId: clientObjectId,
          pointerId: clientPointer.id,
          pointerClassName: clientPointer.className,
          originalClientType: data.client instanceof Parse.Object ? 'Parse.Object' : typeof data.client,
          encodedPointer: encodedPointer
        })
        
        // Set other fields
        Object.keys(data).forEach(key => {
          if (key === 'client') return // Already set above
          const value = (data as any)[key]
          if (value !== undefined && value !== null) {
            report.set(key, value)
          }
        })
        
        // Before saving, check what Parse SDK will serialize (final check)
        const finalReportJSON = report.toJSON()
        const finalClientInJSON = finalReportJSON.client
        console.log('Report JSON before save (final check):', {
          clientType: typeof finalClientInJSON,
          clientValue: finalClientInJSON,
          isPointer: finalClientInJSON?.__type === 'Pointer',
          objectId: finalClientInJSON?.objectId || finalClientInJSON?.id || finalClientInJSON?._id
        })
        
        // If client is still not in Pointer format, log warning but continue
        if (finalClientInJSON && typeof finalClientInJSON === 'object' && finalClientInJSON.__type !== 'Pointer') {
          console.warn('Warning: Client may not be serialized as Pointer in final check:', finalClientInJSON)
          // Don't throw error here - let Parse server handle validation
        }
        
        console.log('About to call report.save() at:', new Date().toISOString())
        try {
          const result = await report.save()
          console.log('report.save() completed at:', new Date().toISOString())
          return result
        } catch (error: any) {
          console.error('Save error details:', {
            code: error.code,
            message: error.message,
            error: error
          })
          throw error
        }
      },
      data
    )
  },

  async update(id: string, data: Partial<HearingReport>): Promise<HearingReport> {
    return handleOfflineOperation<HearingReport>(
      'HearingReport',
      'update',
      async () => {
        const report = await this.getById(id)
        Object.keys(data).forEach(key => {
          report.set(key, (data as any)[key])
        })
        return report.save()
      },
      data,
      id
    )
  },

  async delete(id: string): Promise<void> {
    await handleOfflineOperation<HearingReport>(
      'HearingReport',
      'delete',
      async () => {
        const report = await this.getById(id)
        await report.destroy()
        return report
      },
      {},
      id
    )
  },
}

