// Script to fix HearingReport schema - change client field from Object to Pointer
// Uses REST API directly to update schema
require('dotenv').config();
const http = require('http');
const https = require('https');
const url = require('url');

const SERVER_URL = process.env.PARSE_SERVER_URL || 'http://localhost:1338/parse';
const APP_ID = process.env.PARSE_APP_ID || 'hearing-clinic-app-id';
const MASTER_KEY = process.env.PARSE_MASTER_KEY || 'your-master-key-change-this';

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(SERVER_URL);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'X-Parse-Application-Id': APP_ID,
        'X-Parse-Master-Key': MASTER_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function fixSchema() {
  try {
    console.log('Fetching current schema for HearingReport...');
    
    // Get current schema
    const currentSchema = await makeRequest({
      path: '/parse/schemas/HearingReport',
      method: 'GET'
    });
    
    console.log('Current schema:', JSON.stringify(currentSchema, null, 2));
    
    const clientField = currentSchema.fields?.client;
    console.log('Current client field type:', clientField?.type);
    
    if (clientField && clientField.type === 'Object') {
      console.log('Client field is Object, changing to Pointer...');
      
      // Delete the Object field first
      await makeRequest({
        path: '/parse/schemas/HearingReport',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        fields: {
          client: { __op: 'Delete' }
        }
      });
      
      console.log('Deleted client field');
      
      // Wait a bit for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add it back as Pointer
      await makeRequest({
        path: '/parse/schemas/HearingReport',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        fields: {
          client: {
            type: 'Pointer',
            targetClass: 'Client'
          }
        }
      });
      
      console.log('Added client field as Pointer');
    } else if (!clientField || clientField.type !== 'Pointer') {
      console.log('Adding/updating client field as Pointer...');
      
      // Delete if exists
      if (clientField) {
        await makeRequest({
          path: '/parse/schemas/HearingReport',
          method: 'PUT'
        }, {
          fields: {
            client: { __op: 'Delete' }
          }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Add as Pointer
      await makeRequest({
        path: '/parse/schemas/HearingReport',
        method: 'PUT'
      }, {
        fields: {
          client: {
            type: 'Pointer',
            targetClass: 'Client'
          }
        }
      });
      
      console.log('Schema updated: client is now a Pointer');
    } else {
      console.log('Client field is already a Pointer, no changes needed');
    }
    
    // Verify the update
    const updatedSchema = await makeRequest({
      path: '/parse/schemas/HearingReport',
      method: 'GET'
    });
    
    console.log('Updated schema:', JSON.stringify(updatedSchema, null, 2));
    console.log('Client field type:', updatedSchema.fields?.client?.type);
    
  } catch (error) {
    console.error('Error fixing schema:', error.message);
    if (error.message.includes('HTTP')) {
      console.error('Full error:', error);
    }
    throw error;
  }
}

fixSchema()
  .then(() => {
    console.log('Schema fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema fix failed:', error);
    process.exit(1);
  });

