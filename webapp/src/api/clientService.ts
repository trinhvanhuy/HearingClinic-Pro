import Parse from './parseClient'
import { Client } from '@hearing-clinic/shared/src/models/client'

export interface ClientSearchParams {
  search?: string
  isActive?: boolean
  limit?: number
  skip?: number
}

export const clientService = {
  async getAll(params: ClientSearchParams = {}): Promise<Client[]> {
    const query = new Parse.Query(Client)
    
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      query.or([
        new Parse.Query(Client).contains('fullName', searchLower),
        new Parse.Query(Client).contains('firstName', searchLower),
        new Parse.Query(Client).contains('lastName', searchLower),
        new Parse.Query(Client).contains('phone', params.search),
        new Parse.Query(Client).contains('email', searchLower),
      ])
    }
    
    if (params.isActive !== undefined) {
      query.equalTo('isActive', params.isActive)
    }
    
    query.descending('updatedAt')
    query.limit(params.limit || 50)
    query.skip(params.skip || 0)
    
    return query.find()
  },

  async getById(id: string): Promise<Client> {
    const query = new Parse.Query(Client)
    return query.get(id)
  },

  async create(data: Partial<Client>): Promise<Client> {
    const client = new Client(data)
    return client.save()
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const client = await this.getById(id)
    Object.keys(data).forEach(key => {
      client.set(key, (data as any)[key])
    })
    return client.save()
  },

  async delete(id: string): Promise<void> {
    const client = await this.getById(id)
    return client.destroy()
  },
}

