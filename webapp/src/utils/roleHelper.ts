import Parse from '../api/parseClient'

/**
 * Check if user is admin
 * Admin is determined by:
 * 1. User has 'role' field set to 'admin'
 * 2. Or username is 'admin'
 */
export async function isAdmin(user: Parse.User | null): Promise<boolean> {
  if (!user) return false
  
  try {
    // Check if user has role field
    const role = user.get('role')
    if (role === 'admin') return true
    
    // Fallback: check username
    const username = user.get('username')
    if (username === 'admin') return true
    
    // Check Parse Role (if using Parse Roles)
    try {
      const roles = await user.getRoles()
      for (const role of roles) {
        if (role.getName() === 'admin') {
          return true
        }
      }
    } catch (error) {
      // Roles not configured, ignore
    }
    
    return false
  } catch (error) {
    console.warn('Error checking admin role:', error)
    return false
  }
}

/**
 * Check if user is admin (synchronous version)
 * Uses cached role value
 */
export function isAdminSync(user: Parse.User | null): boolean {
  if (!user) return false
  
  const role = user.get('role')
  if (role === 'admin') return true
  
  const username = user.get('username')
  if (username === 'admin') return true
  
  return false
}

