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
          // Client is just an objectId string
          clientObjectId = data.client
        } else if (data.client && typeof data.client === 'object') {
          // Client is a plain object (from offline sync or serialized)
          const clientObj = data.client as any
          // Try multiple possible property names
          clientObjectId = clientObj.objectId || clientObj._id || clientObj.id
          
          // If it's a Pointer JSON format
          if (!clientObjectId && clientObj.__type === 'Pointer') {
            clientObjectId = clientObj.objectId
          }
        }
        
        // Validate objectId
        if (!clientObjectId || typeof clientObjectId !== 'string' || 
            clientObjectId === 'Client' || clientObjectId === 'client' || 
            clientObjectId.length < 5) {
          console.error('Invalid client objectId:', clientObjectId, 'client:', data.client)
          throw new Error(`Invalid client ID: ${clientObjectId || 'missing'}`)
        }
        
        // Create a fresh Parse Object pointer using createWithoutData
        // This creates an unfetched pointer that should serialize correctly
        const clientPointer = Parse.Object.createWithoutData('Client', clientObjectId)
        
        // Verify the pointer was created correctly
        if (!clientPointer || !clientPointer.id || clientPointer.id !== clientObjectId) {
          console.error('Failed to create client pointer:', {
            requestedId: clientObjectId,
            actualId: clientPointer?.id,
            className: clientPointer?.className
          })
          throw new Error(`Failed to create valid client pointer for ID: ${clientObjectId}`)
        }
        
        // Use _encode to check how Parse SDK will encode this pointer
        const pointerObj = clientPointer as any
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
        
        // Check how the report will serialize the client before save
        // Use _getServerData to see what will be sent to server
        const reportServerData = (report as any)._getServerData ? (report as any)._getServerData() : null
        const clientInServerData = reportServerData?.client
        console.log('Client in report _getServerData:', {
          type: typeof clientInServerData,
          value: clientInServerData,
          isPointer: clientInServerData?.__type === 'Pointer',
          className: clientInServerData?.className,
          objectId: clientInServerData?.objectId
        })
        
        // If client is not in Pointer format, try to fix it
        if (clientInServerData && typeof clientInServerData === 'object' && clientInServerData.__type !== 'Pointer') {
          console.error('Client is NOT serialized as Pointer! Attempting to fix...', clientInServerData)
          // Try setting it again with a fresh pointer
          const freshPointer = Parse.Object.createWithoutData('Client', clientObjectId)
          report.set('client', freshPointer)
          console.log('Re-set client pointer, checking again...')
          
          // Check again
          const newServerData = (report as any)._getServerData ? (report as any)._getServerData() : null
          const newClientInServerData = newServerData?.client
          console.log('Client after re-set:', {
            isPointer: newClientInServerData?.__type === 'Pointer',
            objectId: newClientInServerData?.objectId
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
        
        // Before saving, check what Parse SDK will serialize
        const reportJSON = report.toJSON()
        const clientInJSON = reportJSON.client
        console.log('Report JSON before save:', {
          clientType: typeof clientInJSON,
          clientValue: clientInJSON,
          isPointer: clientInJSON?.__type === 'Pointer',
          objectId: clientInJSON?.objectId || clientInJSON?.id || clientInJSON?._id
        })
        
        // If client is not in Pointer format in JSON, there's a problem
        if (clientInJSON && typeof clientInJSON === 'object' && clientInJSON.__type !== 'Pointer') {
          console.error('Client is not serialized as Pointer!', clientInJSON)
          // Try to force it by recreating the pointer
          const freshPointer = Parse.Object.createWithoutData('Client', clientObjectId)
          report.set('client', freshPointer)
          console.log('Recreated pointer and set again')
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

