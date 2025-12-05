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
    // Use Cloud Function to query staff members (bypasses _User query restrictions)
    try {
      const result = await Parse.Cloud.run('getStaffMembers', {
        search: params.search,
        role: params.role,
        limit: params.limit,
        skip: params.skip,
      }) as any[]
      
      // Convert JSON data back to Parse.User objects
      return result.map((userData: any) => {
        const user = Parse.User.fromJSON(userData)
        // Mark as clean (not dirty) since this is fetched data
        ;(user as any)._isDirty = false
        return user
      })
    } catch (error: any) {
      console.error('Error fetching staff members via Cloud Function:', error)
      throw error
    }
  },

  /**
   * Get staff by ID
   */
  async getById(id: string): Promise<Parse.User> {
    // Use Cloud Function to get staff member (bypasses _User query restrictions)
    try {
      const result = await Parse.Cloud.run('getStaffById', { id }) as any
      
      // Convert JSON data back to Parse.User object
      const user = Parse.User.fromJSON(result)
      ;(user as any)._isDirty = false
      return user
    } catch (error: any) {
      console.error('Error fetching staff by ID via Cloud Function:', error)
      throw error
    }
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

