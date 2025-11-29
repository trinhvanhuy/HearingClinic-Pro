import Parse from 'parse'

const PARSE_APP_ID = process.env.EXPO_PUBLIC_PARSE_APP_ID || 'hearing-clinic-app-id'
const PARSE_SERVER_URL = process.env.EXPO_PUBLIC_PARSE_SERVER_URL || 'http://localhost:1337/parse'

// Initialize Parse - use a flag to prevent multiple initializations
let isInitialized = false

if (!isInitialized) {
  try {
    Parse.initialize(PARSE_APP_ID)
    isInitialized = true
  } catch (error: any) {
    // If already initialized (error code 1 or message contains "initialized"), that's fine
    if (error?.code === 1 || error?.message?.includes('initialized')) {
      isInitialized = true
    } else {
      // Some other error, re-throw it
      throw error
    }
  }
}

// Always set serverURL (safe to set multiple times)
Parse.serverURL = PARSE_SERVER_URL

export default Parse

