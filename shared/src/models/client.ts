import Parse from 'parse';

export interface ClientFields {
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  lastVisitDate?: Date;
  createdBy?: Parse.User;
  updatedBy?: Parse.User;
}

export class Client extends Parse.Object {
  constructor(attributes?: Partial<ClientFields>) {
    super('Client', attributes);
  }

  get firstName(): string {
    return this.get('firstName');
  }

  set firstName(value: string) {
    this.set('firstName', value);
  }

  get lastName(): string {
    return this.get('lastName');
  }

  set lastName(value: string) {
    this.set('lastName', value);
  }

  get fullName(): string {
    return this.get('fullName');
  }

  get dateOfBirth(): Date | undefined {
    return this.get('dateOfBirth');
  }

  set dateOfBirth(value: Date | undefined) {
    this.set('dateOfBirth', value);
  }

  get gender(): 'male' | 'female' | 'other' | undefined {
    return this.get('gender');
  }

  set gender(value: 'male' | 'female' | 'other' | undefined) {
    this.set('gender', value);
  }

  get phone(): string {
    return this.get('phone');
  }

  set phone(value: string) {
    this.set('phone', value);
  }

  get email(): string | undefined {
    return this.get('email');
  }

  set email(value: string | undefined) {
    this.set('email', value);
  }

  get address(): string | undefined {
    return this.get('address');
  }

  set address(value: string | undefined) {
    this.set('address', value);
  }

  get notes(): string | undefined {
    return this.get('notes');
  }

  set notes(value: string | undefined) {
    this.set('notes', value);
  }

  get isActive(): boolean {
    return this.get('isActive') ?? true;
  }

  set isActive(value: boolean) {
    this.set('isActive', value);
  }

  get lastVisitDate(): Date | undefined {
    return this.get('lastVisitDate');
  }

  get createdBy(): Parse.User | undefined {
    return this.get('createdBy');
  }

  get updatedBy(): Parse.User | undefined {
    return this.get('updatedBy');
  }
}

Parse.Object.registerSubclass('Client', Client);

