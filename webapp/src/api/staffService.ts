import Parse from './parseClient'

export type StaffRole = 
  | 'technical_specialist' // Chuyên viên kĩ thuật
  | 'consultant' // Nhân viên Tư vấn
  | 'audiologist' // Chuyên gia thính học
  | 'hearing_doctor' // Bác sĩ thính học

export interface StaffSearchParams {
  role?: StaffRole
  search?: string
  limit?: number
  skip?: number
}

export const staffService = {
  /**
   * Get all staff members
   */
  async getAll(params: StaffSearchParams = {}): Promise<Parse.User[]> {
    let query: Parse.Query<Parse.User>
    
    // Search by username, email, or fullName
    if (params.search) {
      const searchTerm = params.search.toLowerCase()
      const usernameQuery = new Parse.Query(Parse.User).contains('username', searchTerm)
      const emailQuery = new Parse.Query(Parse.User).contains('email', searchTerm)
      const fullNameQuery = new Parse.Query(Parse.User).contains('fullName', searchTerm)
      query = Parse.Query.or(usernameQuery, emailQuery, fullNameQuery)
    } else {
      query = new Parse.Query(Parse.User)
    }
    
    // Filter by role if provided
    if (params.role) {
      query.equalTo('staffRole', params.role)
    }
    
    // Exclude admin users from staff list
    query.notEqualTo('role', 'admin')
    
    if (params.limit) {
      query.limit(params.limit)
    }
    if (params.skip) {
      query.skip(params.skip)
    }
    
    query.addAscending('username')
    
    return query.find()
  },

  /**
   * Get staff by ID
   */
  async getById(id: string): Promise<Parse.User> {
    const query = new Parse.Query(Parse.User)
    return query.get(id)
  },

  /**
   * Create new staff member
   */
  async create(data: {
    username: string
    password: string
    email?: string
    staffRole: StaffRole
    fullName?: string
  }): Promise<Parse.User> {
    const user = new Parse.User()
    user.set('username', data.username)
    user.set('password', data.password)
    
    if (data.email) {
      user.set('email', data.email)
    }
    
    user.set('staffRole', data.staffRole)
    user.set('role', 'staff') // Set role to staff
    
    if (data.fullName) {
      user.set('fullName', data.fullName)
    }
    
    return user.signUp()
  },

  /**
   * Update staff member
   */
  async update(id: string, data: {
    email?: string
    staffRole?: StaffRole
    fullName?: string
    password?: string
  }): Promise<Parse.User> {
    const user = await this.getById(id)
    
    if (data.email !== undefined) {
      user.set('email', data.email)
    }
    
    if (data.staffRole !== undefined) {
      user.set('staffRole', data.staffRole)
    }
    
    if (data.fullName !== undefined) {
      user.set('fullName', data.fullName)
    }
    
    if (data.password) {
      user.set('password', data.password)
    }
    
    return user.save()
  },

  /**
   * Delete staff member
   */
  async delete(id: string): Promise<void> {
    const user = await this.getById(id)
    return user.destroy()
  },
}

