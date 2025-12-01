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
        console.log('Data received in create:', {
          client: data.client,
          clientType: typeof data.client,
          clientIsObject: data.client instanceof Parse.Object,
          clientKeys: data.client && typeof data.client === 'object' ? Object.keys(data.client) : null
        })
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
        
        console.log('Extracted clientObjectId:', clientObjectId, 'from data.client:', data.client)
        
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
        
        // CRITICAL FIX: Parse SDK has a bug where setting a string for Pointer field
        // causes it to serialize objectId as className. We must create Pointer object
        // and manually set it in _serverData to bypass SDK serialization.
        const clientPointer = Parse.Object.createWithoutData('Client', clientObjectId)
        
        // Manually construct the Pointer JSON format
        const pointerJSON = {
          __type: 'Pointer',
          className: 'Client',
          objectId: clientObjectId
        }
        
        // Set using _set to bypass Parse SDK's default serialization
        const reportObj = report as any
        if (reportObj._set) {
          reportObj._set('client', pointerJSON, {})
        } else {
          report.set('client', clientPointer)
        }
        
        // CRITICAL: Also set directly in _serverData to ensure it's sent correctly
        // Parse SDK may override our _set during save(), so we need to set it directly
        if (!reportObj._serverData) {
          reportObj._serverData = {}
        }
        reportObj._serverData.client = pointerJSON
        
        console.log('Set client pointer manually:', {
          objectId: clientObjectId,
          pointerJSON: pointerJSON,
          _serverData: reportObj._serverData.client
        })
        
        // Set other fields
        Object.keys(data).forEach(key => {
          if (key === 'client') return // Already set above
          const value = (data as any)[key]
          if (value !== undefined && value !== null) {
            report.set(key, value)
          }
        })
        
        // CRITICAL: Override multiple serialization methods to ensure client pointer is correct
        // Parse SDK has multiple code paths that serialize data, we need to intercept all
        const originalToFullJSON = (reportObj as any)._toFullJSON
        const originalToJSON = (reportObj as any).toJSON
        
        // Override _toFullJSON (used by save())
        ;(reportObj as any)._toFullJSON = function() {
          const json = originalToFullJSON ? originalToFullJSON.call(this) : (originalToJSON ? originalToJSON.call(this) : {})
          // Force client to be correct Pointer format
          json.client = pointerJSON
          return json
        }
        
        // Override toJSON (used for debugging/logging)
        ;(reportObj as any).toJSON = function() {
          const json = originalToJSON ? originalToJSON.call(this) : {}
          // Force client to be correct Pointer format
          json.client = pointerJSON
          return json
        }
        
        // Override _getServerData (used internally by Parse SDK)
        const originalGetServerData = (reportObj as any)._getServerData
        ;(reportObj as any)._getServerData = function() {
          const data = originalGetServerData ? originalGetServerData.call(this) : (reportObj._serverData || {})
          // Force client to be correct Pointer format
          data.client = pointerJSON
          return data
        }
        
        // Before saving, verify what will be sent
        const finalServerData = (reportObj as any)._getServerData()
        console.log('Final server data before save:', {
          client: finalServerData.client,
          expected: clientObjectId,
          match: finalServerData.client?.objectId === clientObjectId
        })
        
        // Final verification
        if (!finalServerData.client || finalServerData.client.objectId !== clientObjectId) {
          console.error('CRITICAL: Client pointer verification failed!', {
            expected: clientObjectId,
            got: finalServerData.client?.objectId,
            full: finalServerData.client
          })
          throw new Error(`Failed to set client pointer correctly. Expected: ${clientObjectId}, got: ${finalServerData.client?.objectId || 'null'}`)
        }
        
        // FINAL SOLUTION: Use Cloud Function to bypass Parse SDK and schema validation bugs
        // Parse Server has bugs with Pointer serialization and schema validation
        // Cloud Function uses masterKey to bypass all validations
        console.log('Using Cloud Function to bypass Parse Server bugs at:', new Date().toISOString())
        
        try {
          // Get current user
          const currentUser = Parse.User.current()
          if (!currentUser) {
            throw new Error('User not authenticated')
          }
          
          // Prepare data for Cloud Function
          const cloudFunctionData: any = {
            client: clientObjectId, // Send as string - Cloud Function will convert to Pointer
            testDate: data.testDate ? new Date(data.testDate) : new Date(),
            typeOfTest: data.typeOfTest || 'pure tone audiometry',
            leftEarThresholds: data.leftEarThresholds || {},
            rightEarThresholds: data.rightEarThresholds || {},
            diagnosis: data.diagnosis || data.results || '',
            recommendations: data.recommendations || '',
            caseHistory: data.caseHistory || '',
            speechAudiometry: data.speechAudiometry || { points: [] },
            discriminationLoss: data.discriminationLoss || { rightCorrectPercent: 0, leftCorrectPercent: 0 },
            leftTympanogram: data.leftTympanogram || { points: [] },
            rightTympanogram: data.rightTympanogram || { points: [] },
            signature: data.signature || '',
            printName: data.printName || '',
            licenseNo: data.licenseNo || '',
          }
          
          if (data.signatureDate) {
            cloudFunctionData.signatureDate = new Date(data.signatureDate)
          }
          
          if (data.audiologist && typeof data.audiologist === 'string') {
            cloudFunctionData.audiologist = data.audiologist // Cloud Function will convert to Pointer
          }
          
          console.log('Cloud Function - Data to send:', JSON.stringify(cloudFunctionData, null, 2))
          console.log('Cloud Function - Client objectId:', clientObjectId)
          
          // Call Cloud Function
          const result = await Parse.Cloud.run('createHearingReport', cloudFunctionData)
          console.log('Cloud Function success, result:', result)
          
          return result as HearingReport
        } catch (error: any) {
          console.error('Cloud Function save error details:', {
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

