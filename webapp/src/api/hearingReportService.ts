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
        
        // FINAL SOLUTION: Create Parse.Object pointer and use _encode + _set to bypass SDK issues
        const clientPointer = Parse.Object.createWithoutData('Client', clientObjectId)
        
        // Get encoded format using _encode (internal Parse SDK method)
        const reportObj = report as any
        let encodedPointer: any = null
        
        try {
          // Try to get encoded format from Parse.Object
          if ((clientPointer as any)._encode) {
            encodedPointer = (clientPointer as any)._encode()
            console.log('Got encoded pointer from _encode():', encodedPointer)
          }
        } catch (e) {
          console.warn('_encode() failed, using manual format:', e)
        }
        
        // If _encode didn't work, use manual Pointer format
        if (!encodedPointer || !encodedPointer.__type) {
          encodedPointer = {
            __type: 'Pointer',
            className: 'Client',
            objectId: clientObjectId
          }
          console.log('Using manual Pointer format:', encodedPointer)
        }
        
        // Use _set to set the encoded pointer directly (bypasses Parse SDK serialization)
        // This is the ONLY way to ensure Parse SDK sends the correct format
        if (reportObj._set) {
          reportObj._set('client', encodedPointer, {})
          console.log('Set client using _set() with encoded pointer')
        } else {
          // Fallback: use set() with Parse.Object
          report.set('client', clientPointer)
          console.log('Set client using set() with Parse.Object (fallback)')
        }
        
        // Verify using _getServerData (what will actually be sent to server)
        const serverData = reportObj._getServerData ? reportObj._getServerData() : null
        const clientInServerData = serverData?.client
        console.log('Client in _getServerData (what will be sent):', {
          type: typeof clientInServerData,
          value: clientInServerData,
          isPointer: clientInServerData?.__type === 'Pointer',
          objectId: clientInServerData?.objectId
        })
        
        if (!clientInServerData || clientInServerData.__type !== 'Pointer' || clientInServerData.objectId !== clientObjectId) {
          console.error('CRITICAL: Client is NOT in Pointer format in _getServerData!', clientInServerData)
          // Last attempt: force set again
          if (reportObj._set) {
            reportObj._set('client', encodedPointer, {})
            console.log('Forced set again with encoded pointer')
          }
        }
        
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

