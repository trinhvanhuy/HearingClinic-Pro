import Parse from 'parse';
import { Client } from './client';

export type ReminderStatus = 'pending' | 'done' | 'overdue';

export interface ReminderFields {
  client: Client;
  title: string;
  description?: string;
  dueAt: Date;
  status: ReminderStatus;
  createdBy?: Parse.User;
  updatedBy?: Parse.User;
}

export class Reminder extends Parse.Object {
  constructor(attributes?: Partial<ReminderFields>) {
    super('Reminder', attributes);
  }

  get client(): Client {
    return this.get('client');
  }

  set client(value: Client) {
    this.set('client', value);
  }

  get title(): string {
    return this.get('title');
  }

  set title(value: string) {
    this.set('title', value);
  }

  get description(): string | undefined {
    return this.get('description');
  }

  set description(value: string | undefined) {
    this.set('description', value);
  }

  get dueAt(): Date {
    return this.get('dueAt');
  }

  set dueAt(value: Date) {
    this.set('dueAt', value);
  }

  get status(): ReminderStatus {
    return this.get('status') || 'pending';
  }

  set status(value: ReminderStatus) {
    this.set('status', value);
  }

  get createdBy(): Parse.User | undefined {
    return this.get('createdBy');
  }

  get updatedBy(): Parse.User | undefined {
    return this.get('updatedBy');
  }
}

Parse.Object.registerSubclass('Reminder', Reminder);

