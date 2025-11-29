import Parse from 'parse';
import { Client } from './client';

export interface EarThresholds {
  250?: number;
  500?: number;
  1000?: number;
  2000?: number;
  4000?: number;
  8000?: number;
}

export interface HearingReportFields {
  client: Client;
  audiologist?: Parse.User | string;
  testDate: Date;
  leftEarThresholds?: EarThresholds;
  rightEarThresholds?: EarThresholds;
  typeOfTest?: string;
  diagnosis?: string;
  recommendations?: string;
  hearingAidSuggested?: string;
  attachments?: Parse.File[];
  createdBy?: Parse.User;
  updatedBy?: Parse.User;
}

export class HearingReport extends Parse.Object {
  constructor(attributes?: Partial<HearingReportFields>) {
    super('HearingReport', attributes);
  }

  get client(): Client {
    return this.get('client');
  }

  set client(value: Client) {
    this.set('client', value);
  }

  get audiologist(): Parse.User | string | undefined {
    return this.get('audiologist');
  }

  set audiologist(value: Parse.User | string | undefined) {
    this.set('audiologist', value);
  }

  get testDate(): Date {
    return this.get('testDate');
  }

  set testDate(value: Date) {
    this.set('testDate', value);
  }

  get leftEarThresholds(): EarThresholds | undefined {
    return this.get('leftEarThresholds');
  }

  set leftEarThresholds(value: EarThresholds | undefined) {
    this.set('leftEarThresholds', value);
  }

  get rightEarThresholds(): EarThresholds | undefined {
    return this.get('rightEarThresholds');
  }

  set rightEarThresholds(value: EarThresholds | undefined) {
    this.set('rightEarThresholds', value);
  }

  get typeOfTest(): string | undefined {
    return this.get('typeOfTest');
  }

  set typeOfTest(value: string | undefined) {
    this.set('typeOfTest', value);
  }

  get diagnosis(): string | undefined {
    return this.get('diagnosis');
  }

  set diagnosis(value: string | undefined) {
    this.set('diagnosis', value);
  }

  get recommendations(): string | undefined {
    return this.get('recommendations');
  }

  set recommendations(value: string | undefined) {
    this.set('recommendations', value);
  }

  get hearingAidSuggested(): string | undefined {
    return this.get('hearingAidSuggested');
  }

  set hearingAidSuggested(value: string | undefined) {
    this.set('hearingAidSuggested', value);
  }

  get attachments(): Parse.File[] | undefined {
    return this.get('attachments');
  }

  set attachments(value: Parse.File[] | undefined) {
    this.set('attachments', value);
  }

  get createdBy(): Parse.User | undefined {
    return this.get('createdBy');
  }

  get updatedBy(): Parse.User | undefined {
    return this.get('updatedBy');
  }
}

Parse.Object.registerSubclass('HearingReport', HearingReport);

