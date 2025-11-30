const express = require('express');
const { ParseServer } = require('parse-server');
const ParseDashboard = require('parse-dashboard');
require('dotenv').config();

const app = express();

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins in production, or all in development
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'])
    : '*';
  
  if (allowedOrigins === '*' || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', allowedOrigins === '*' ? '*' : origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Parse-Application-Id, X-Parse-REST-API-Key, X-Parse-Session-Token, X-Parse-Revocable-Session');
  res.header('Access-Control-Expose-Headers', 'X-Parse-Session-Token, X-Parse-Revocable-Session');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse Server Configuration
const api = new ParseServer({
  databaseURI: process.env.DATABASE_URI || 'mongodb://mongo:27017/hearing-clinic-db',
  cloud: process.env.PARSE_SERVER_CLOUD || __dirname + '/cloud/main.js',
  appId: process.env.PARSE_APP_ID || 'hearing-clinic-app-id',
  masterKey: process.env.PARSE_MASTER_KEY || 'your-master-key-change-this',
  serverURL: process.env.PARSE_SERVER_URL || 'http://localhost:1338/parse',
  publicServerURL: process.env.PARSE_SERVER_URL || 'http://localhost:1338/parse',
  allowClientClassCreation: true,
  enableAnonymousUsers: false,
  // Security: Only authenticated users can read/write
  classLevelPermissions: {
    Client: {
      find: { requiresAuthentication: true },
      get: { requiresAuthentication: true },
      create: { requiresAuthentication: true },
      update: { requiresAuthentication: true },
      delete: { requiresAuthentication: true }
    },
    HearingReport: {
      find: { requiresAuthentication: true },
      get: { requiresAuthentication: true },
      create: { requiresAuthentication: true },
      update: { requiresAuthentication: true },
      delete: { requiresAuthentication: true }
    },
    Reminder: {
      find: { requiresAuthentication: true },
      get: { requiresAuthentication: true },
      create: { requiresAuthentication: true },
      update: { requiresAuthentication: true },
      delete: { requiresAuthentication: true }
    },
    ContactLog: {
      find: { requiresAuthentication: true },
      get: { requiresAuthentication: true },
      create: { requiresAuthentication: true },
      update: { requiresAuthentication: true },
      delete: { requiresAuthentication: true }
    },
    Appointment: {
      find: { requiresAuthentication: true },
      get: { requiresAuthentication: true },
      create: { requiresAuthentication: true },
      update: { requiresAuthentication: true },
      delete: { requiresAuthentication: true }
    },
    Config: {
      find: { requiresAuthentication: true },
      get: { requiresAuthentication: true },
      create: { requiresAuthentication: true },
      update: { requiresAuthentication: true },
      delete: { requiresAuthentication: true }
    }
  }
});

// Health check endpoint (before Parse Server)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the Parse API server
// Parse Server v6: the instance should be mountable directly
// Access the internal Express app if available
const parseApp = api.app || api.expressApp || api;
app.use('/parse', parseApp);

// Parse Dashboard (optional, for development)
if (process.env.NODE_ENV !== 'production') {
  const dashboard = new ParseDashboard({
    apps: [
      {
        serverURL: process.env.PARSE_SERVER_URL || 'http://localhost:1338/parse',
        appId: process.env.PARSE_APP_ID || 'hearing-clinic-app-id',
        masterKey: process.env.PARSE_MASTER_KEY || 'your-master-key-change-this',
        appName: 'Hearing Clinic System'
      }
    ],
    users: [
      {
        user: process.env.PARSE_DASHBOARD_USER || 'admin',
        pass: process.env.PARSE_DASHBOARD_PASSWORD || 'admin'
      }
    ],
    trustProxy: 1
  }, { allowInsecureHTTP: true });

  app.use('/dashboard', dashboard);
}

const port = process.env.PORT || 1337;
const httpServer = require('http').createServer(app);

// Start Parse Server before listening (required for Parse Server v6+)
api.start().then(() => {
  httpServer.listen(port, process.env.HOST || '0.0.0.0', () => {
    console.log(`Parse Server running on port ${port}`);
    console.log(`Parse Dashboard: http://localhost:1338/dashboard`);
  });

  // This will enable the Live Query real-time server
  ParseServer.createLiveQueryServer(httpServer);
}).catch((error) => {
  console.error('Error starting Parse Server:', error);
  process.exit(1);
});
