import Parse from './parseClient'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'
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
        // Validate clientId is a valid string ID
        const clientIdStr = String(params.clientId).trim()
        if (clientIdStr === '' || clientIdStr === 'Client' || clientIdStr.length < 10) {
          console.error('hearingReportService.getAll - Invalid clientId:', {
            clientId: params.clientId,
            type: typeof params.clientId,
            trimmed: clientIdStr,
          })
          // Don't add filter if clientId is invalid - will return all reports
        } else {
          console.log('hearingReportService.getAll - Filtering by clientId:', clientIdStr)
          // Create pointer using Parse pointer format directly
          query.equalTo('client', {
            __type: 'Pointer',
            className: 'Client',
            objectId: clientIdStr,
          } as any)
        }
      }
      
      // Sort by updatedAt first (most recently updated), then by testDate
      query.descending('updatedAt')
      query.addDescending('testDate')
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
    return handleOfflineOperation<HearingReport>(
      'HearingReport',
      'create',
      async () => {
        console.log('hearingReportService.create - input data:', {
          client: (data as any).client,
          clientType: typeof (data as any).client,
          clientIsParseObject: (data as any).client instanceof Parse.Object,
          clientClassName: (data as any).client?.className,
          clientId: (data as any).client?.id,
          clientObjectId: (data as any).client?.objectId,
        })

        const report = new HearingReport() as any

        // Simply set all provided fields on the report.
        // Expect caller to pass a proper Client pointer for `client`.
        Object.keys(data).forEach(key => {
          const value = (data as any)[key]
          if (value !== undefined && value !== null) {
            report.set(key, value)
          }
        })

        // Debug: log exactly what Parse SDK will serialize
        const jsonBeforeSave = report.toJSON()
        console.log(
          'HearingReport before save (toJSON):',
          JSON.stringify(jsonBeforeSave, null, 2)
        )
        const clientField: any = (jsonBeforeSave as any).client
        console.log('HearingReport client field before save:', {
          raw: clientField,
          type: typeof clientField,
          className: clientField?.className,
          objectId: clientField?.objectId,
        })

        return report.save()
      },
      data
    )
  },

  async update(id: string, data: Partial<HearingReport>): Promise<HearingReport> {
    return handleOfflineOperation<HearingReport>(
      'HearingReport',
      'update',
      async () => {
        const report = (await this.getById(id)) as any
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
        const report = (await this.getById(id)) as any
        await report.destroy()
        return report
      },
      {},
      id
    )
  },
}

