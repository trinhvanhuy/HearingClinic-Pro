import Parse from 'parse'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'

export interface HearingReportSearchParams {
  clientId?: string
  limit?: number
  skip?: number
}

export const hearingReportService = {
  async getAll(params: HearingReportSearchParams = {}): Promise<HearingReport[]> {
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
  },

  async getById(id: string): Promise<HearingReport> {
    const query = new Parse.Query(HearingReport)
    query.include('client')
    query.include('audiologist')
    return query.get(id)
  },

  async create(data: Partial<HearingReport>): Promise<HearingReport> {
    const report = new HearingReport(data)
    return report.save()
  },

  async update(id: string, data: Partial<HearingReport>): Promise<HearingReport> {
    const report = await this.getById(id)
    Object.keys(data).forEach(key => {
      report.set(key, (data as any)[key])
    })
    return report.save()
  },

  async delete(id: string): Promise<void> {
    const report = await this.getById(id)
    return report.destroy()
  },
}

