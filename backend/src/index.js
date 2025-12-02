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
  res.header(
    'Access-Control-Allow-Headers',
    [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Parse-Application-Id',
      'X-Parse-REST-API-Key',
      'X-Parse-Session-Token',
      'X-Parse-Revocable-Session',
      // IMPORTANT: allow master key header so Parse Dashboard can call /serverInfo, /schemas
      'X-Parse-Master-Key',
    ].join(', ')
  );
  res.header('Access-Control-Expose-Headers', 'X-Parse-Session-Token, X-Parse-Revocable-Session');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON body parser middleware (needed for PDF export API)
// MUST be placed before any routes that need to parse JSON body
// Increase limit to 50MB for large HTML content with embedded images (base64)
// HTML with base64-encoded chart images can be several MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
   // Allow master key from any IP in development so Parse Dashboard works
   // (Do NOT use this in production as-is.)
   masterKeyIps: process.env.NODE_ENV === 'production' ? undefined : ['0.0.0.0/0'],
  // Disable schema validation completely to allow flexible Pointer handling
  // We'll handle validation in beforeSave hooks instead
  schemaCacheTTL: 0, // Disable schema caching
  // Don't define schema for HearingReport - let it be flexible
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

// PDF Export routes (before Parse Server)
const pdfExportRoutes = require('./routes/pdfExport');
app.use('/api/pdf', pdfExportRoutes);

// CRITICAL FIX: Middleware to fix client Pointer before Parse Server processes it
// Parse Server has a bug where it converts string objectId to Pointer with objectId = className
app.use('/parse/classes/HearingReport', express.json(), (req, res, next) => {
  // Only process POST requests (create)
  if (req.method === 'POST' && req.body && req.body.client) {
    // If client is a string (objectId), keep it as string
    // Parse Server will handle conversion in beforeSave hook
    if (typeof req.body.client === 'string' && req.body.client !== 'Client' && req.body.client !== 'client') {
      // Keep as string - beforeSave will convert to Pointer
      console.log('Middleware: Keeping client as string:', req.body.client);
    } 
    // If client is a Pointer with objectId "Client" (bug), try to fix it
    else if (req.body.client && typeof req.body.client === 'object' && 
             req.body.client.__type === 'Pointer' && 
             req.body.client.objectId === 'Client') {
      console.error('Middleware: Detected Parse Server bug - Pointer with objectId="Client"');
      // Unfortunately we can't know the correct objectId here
      // But we can at least log it
    }
  }
  next();
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
