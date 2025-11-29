import Parse from './parseClient'
import { Reminder, ReminderStatus } from '@hearing-clinic/shared/src/models/reminder'

export interface ReminderSearchParams {
  clientId?: string
  status?: ReminderStatus
  dueFrom?: Date
  dueTo?: Date
  limit?: number
  skip?: number
}

export const reminderService = {
  async getAll(params: ReminderSearchParams = {}): Promise<Reminder[]> {
    const query = new Parse.Query(Reminder)
    
    if (params.clientId) {
      const client = Parse.Object.createWithoutData('Client', params.clientId)
      query.equalTo('client', client)
    }
    
    if (params.status) {
      query.equalTo('status', params.status)
    }
    
    if (params.dueFrom) {
      query.greaterThanOrEqualTo('dueAt', params.dueFrom)
    }
    
    if (params.dueTo) {
      query.lessThanOrEqualTo('dueAt', params.dueTo)
    }
    
    query.ascending('dueAt')
    query.include('client')
    query.limit(params.limit || 50)
    query.skip(params.skip || 0)
    
    return query.find()
  },

  async getById(id: string): Promise<Reminder> {
    const query = new Parse.Query(Reminder)
    query.include('client')
    return query.get(id)
  },

  async create(data: Partial<Reminder>): Promise<Reminder> {
    const reminder = new Reminder(data)
    return reminder.save()
  },

  async update(id: string, data: Partial<Reminder>): Promise<Reminder> {
    const reminder = await this.getById(id)
    Object.keys(data).forEach(key => {
      reminder.set(key, (data as any)[key])
    })
    return reminder.save()
  },

  async delete(id: string): Promise<void> {
    const reminder = await this.getById(id)
    return reminder.destroy()
  },
}

