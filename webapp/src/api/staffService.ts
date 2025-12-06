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
        // Ensure objectId is set (Parse.User.fromJSON requires it)
        if (!userData.objectId && userData.id) {
          userData.objectId = userData.id
        }
        // Ensure className is set
        if (!userData.className) {
          userData.className = '_User'
        }
        const user = Parse.User.fromJSON(userData, false) // false = don't mark as dirty
        // Ensure objectId is set on the user object
        if (userData.objectId && !(user as any).objectId) {
          (user as any).objectId = userData.objectId
        }
        // Ensure id getter works (Parse.User.id is a getter that returns objectId)
        if (!user.id && userData.objectId) {
          Object.defineProperty(user, 'id', {
            get: () => userData.objectId,
            enumerable: true,
            configurable: true
          })
        }
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
      
      // Ensure objectId is set (Parse.User.fromJSON requires it)
      if (!result.objectId && result.id) {
        result.objectId = result.id
      }
      // Ensure className is set
      if (!result.className) {
        result.className = '_User'
      }
      // Convert JSON data back to Parse.User object
      const user = Parse.User.fromJSON(result, false) // false = don't mark as dirty
      // Ensure objectId is set on the user object
      if (result.objectId && !(user as any).objectId) {
        (user as any).objectId = result.objectId
      }
      // Ensure id getter works (Parse.User.id is a getter that returns objectId)
      if (!user.id && result.objectId) {
        Object.defineProperty(user, 'id', {
          get: () => result.objectId,
          enumerable: true,
          configurable: true
        })
      }
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

