import Parse from 'parse'

export type AppointmentType = 'REPAIR' | 'PURCHASE' | 'AUDIOGRAM' | 'COUNSELING'
export type AppointmentStatus = 'COMPLETED' | 'CANCELED' | 'SCHEDULED'

export interface AppointmentData {
  client: Parse.Pointer | Parse.Object
  type: AppointmentType
  date: Date
  status: AppointmentStatus
  note?: string
  hearingReport?: Parse.Pointer | Parse.Object
  staffName?: string
  createdBy?: Parse.Pointer | Parse.Object
  updatedBy?: Parse.Pointer | Parse.Object
}

export class Appointment extends Parse.Object {
  constructor(data?: AppointmentData) {
    super('Appointment', data)
  }

  get client(): Parse.Pointer {
    return this.get('client')
  }

  get type(): AppointmentType {
    return this.get('type')
  }

  get date(): Date {
    return this.get('date')
  }

  get status(): AppointmentStatus {
    return this.get('status')
  }

  get note(): string | undefined {
    return this.get('note')
  }

  get hearingReport(): Parse.Pointer | undefined {
    return this.get('hearingReport')
  }

  get staffName(): string | undefined {
    return this.get('staffName')
  }

  get createdBy(): Parse.Pointer | undefined {
    return this.get('createdBy')
  }

  get updatedBy(): Parse.Pointer | undefined {
    return this.get('updatedBy')
  }
}

Parse.Object.registerSubclass('Appointment', Appointment)

