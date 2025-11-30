import Parse from './parseClient'
import { Appointment, AppointmentType, AppointmentStatus } from '@hearing-clinic/shared/src/models/appointment'

export interface AppointmentSearchParams {
  clientId?: string
  type?: AppointmentType
  status?: AppointmentStatus
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  skip?: number
}

export const appointmentService = {
  /**
   * Get all appointments
   */
  async getAll(params: AppointmentSearchParams = {}): Promise<Appointment[]> {
    const query = new Parse.Query(Appointment)
    
    if (params.clientId) {
      const client = Parse.Object.extend('Client')
      const clientPointer = new client()
      clientPointer.id = params.clientId
      query.equalTo('client', clientPointer)
    }
    
    if (params.type) {
      query.equalTo('type', params.type)
    }
    
    if (params.status) {
      query.equalTo('status', params.status)
    }
    
    if (params.dateFrom) {
      query.greaterThanOrEqualTo('date', params.dateFrom)
    }
    
    if (params.dateTo) {
      query.lessThanOrEqualTo('date', params.dateTo)
    }
    
    query.descending('date')
    
    if (params.limit) {
      query.limit(params.limit)
    }
    if (params.skip) {
      query.skip(params.skip)
    }
    
    return query.find()
  },

  /**
   * Get appointment by ID
   */
  async getById(id: string): Promise<Appointment> {
    const query = new Parse.Query(Appointment)
    return query.get(id)
  },

  /**
   * Create new appointment
   */
  async create(data: {
    clientId: string
    type: AppointmentType
    date: Date
    status: AppointmentStatus
    note?: string
    hearingReportId?: string
    staffName?: string
  }): Promise<Appointment> {
    const appointment = new Appointment()
    
    const client = Parse.Object.extend('Client')
    const clientPointer = new client()
    clientPointer.id = data.clientId
    appointment.set('client', clientPointer)
    
    appointment.set('type', data.type)
    appointment.set('date', data.date)
    appointment.set('status', data.status)
    
    if (data.note) {
      appointment.set('note', data.note)
    }
    
    if (data.hearingReportId) {
      const hearingReport = Parse.Object.extend('HearingReport')
      const reportPointer = new hearingReport()
      reportPointer.id = data.hearingReportId
      appointment.set('hearingReport', reportPointer)
    }
    
    if (data.staffName) {
      appointment.set('staffName', data.staffName)
    }
    
    const currentUser = Parse.User.current()
    if (currentUser) {
      appointment.set('createdBy', currentUser)
      appointment.set('updatedBy', currentUser)
    }
    
    return appointment.save()
  },

  /**
   * Update appointment
   */
  async update(id: string, data: {
    type?: AppointmentType
    date?: Date
    status?: AppointmentStatus
    note?: string
    hearingReportId?: string
    staffName?: string
  }): Promise<Appointment> {
    const appointment = await this.getById(id)
    
    if (data.type !== undefined) {
      appointment.set('type', data.type)
    }
    
    if (data.date !== undefined) {
      appointment.set('date', data.date)
    }
    
    if (data.status !== undefined) {
      appointment.set('status', data.status)
    }
    
    if (data.note !== undefined) {
      appointment.set('note', data.note)
    }
    
    if (data.hearingReportId !== undefined) {
      if (data.hearingReportId) {
        const hearingReport = Parse.Object.extend('HearingReport')
        const reportPointer = new hearingReport()
        reportPointer.id = data.hearingReportId
        appointment.set('hearingReport', reportPointer)
      } else {
        appointment.unset('hearingReport')
      }
    }
    
    if (data.staffName !== undefined) {
      appointment.set('staffName', data.staffName)
    }
    
    const currentUser = Parse.User.current()
    if (currentUser) {
      appointment.set('updatedBy', currentUser)
    }
    
    return appointment.save()
  },

  /**
   * Delete appointment
   */
  async delete(id: string): Promise<void> {
    const appointment = await this.getById(id)
    return appointment.destroy()
  },

  /**
   * Get count of appointments for a client
   */
  async getCount(clientId: string): Promise<number> {
    const query = new Parse.Query(Appointment)
    const client = Parse.Object.extend('Client')
    const clientPointer = new client()
    clientPointer.id = clientId
    query.equalTo('client', clientPointer)
    return query.count()
  },
}

