// @ts-ignore - Parse SDK types may not be available
import Parse from 'parse'

// Use type assertion for import.meta.env (Vite provides this)
const PARSE_APP_ID = (import.meta as any).env?.VITE_PARSE_APP_ID || 'hearing-clinic-app-id'
const PARSE_SERVER_URL = (import.meta as any).env?.VITE_PARSE_SERVER_URL || 'http://localhost:1338/parse'

// Simple initialization - only initialize if not already done
function initParse() {
  // Always set serverURL (safe to do multiple times)
  Parse.serverURL = PARSE_SERVER_URL

  // Check if already initialized
  try {
    const coreManager = (Parse as any).CoreManager
    if (coreManager) {
      const appId = coreManager.get('APPLICATION_ID')
      if (appId) {
        // Already initialized, just return
        return
      }
    }
  } catch (e) {
    // Can't check, try to initialize
  }

  // Try to initialize - catch and ignore "already initialized" errors
  try {
    Parse.initialize(PARSE_APP_ID)
  } catch (error: any) {
    // Silently ignore "already initialized" errors
    // This is expected in development with hot reload
    if (
      error?.code !== 1 &&
      !error?.message?.includes('initialized') &&
      !error?.message?.includes('Invalid server state')
    ) {
      // Only log non-initialization errors
      console.warn('Parse initialization warning:', error)
    }
  }
}

// Initialize immediately
initParse()

// Export function to ensure initialization (can be called multiple times safely)
export function ensureParseInitialized() {
  initParse()
}

export default Parse

