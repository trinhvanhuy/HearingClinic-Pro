// @ts-ignore - Parse SDK types may not be available
import Parse from 'parse'

// Use type assertion for import.meta.env (Vite provides this)
const PARSE_APP_ID = (import.meta as any).env?.VITE_PARSE_APP_ID || 'hearing-clinic-app-id'
const PARSE_SERVER_URL = (import.meta as any).env?.VITE_PARSE_SERVER_URL || 'http://localhost:1338/parse'

// Simple initialization - only initialize if not already done
function initParse() {
  try {
    // Always set serverURL first (safe to do multiple times)
    Parse.serverURL = PARSE_SERVER_URL

    // Check if already initialized
    const coreManager = (Parse as any).CoreManager
    if (coreManager) {
      const appId = coreManager.get('APPLICATION_ID')
      if (appId && appId === PARSE_APP_ID) {
        // Already initialized with correct app ID, just ensure serverURL is set
        return
      }
    }

    // Initialize Parse
    Parse.initialize(PARSE_APP_ID)
    
    // Verify initialization
    console.log('Parse initialized:', {
      appId: PARSE_APP_ID,
      serverURL: PARSE_SERVER_URL
    })
  } catch (error: any) {
    // Handle "already initialized" errors gracefully
    if (
      error?.code === 1 ||
      error?.message?.includes('initialized') ||
      error?.message?.includes('Invalid server state')
    ) {
      // This is expected in development with hot reload
      // Just ensure serverURL is set
      Parse.serverURL = PARSE_SERVER_URL
    } else {
      // Log other errors
      console.error('Parse initialization error:', error)
      throw error
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

