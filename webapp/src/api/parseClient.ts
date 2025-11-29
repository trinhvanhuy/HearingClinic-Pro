import Parse from 'parse'

const PARSE_APP_ID = import.meta.env.VITE_PARSE_APP_ID || 'hearing-clinic-app-id'
const PARSE_SERVER_URL = import.meta.env.VITE_PARSE_SERVER_URL || 'http://localhost:1337/parse'

Parse.initialize(PARSE_APP_ID)
Parse.serverURL = PARSE_SERVER_URL

export default Parse

