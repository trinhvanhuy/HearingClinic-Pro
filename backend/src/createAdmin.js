const Parse = require('parse/node');
require('dotenv').config();

// Parse Server Configuration
const APP_ID = process.env.PARSE_APP_ID || 'hearing-clinic-app-id';
const MASTER_KEY = process.env.PARSE_MASTER_KEY || 'your-master-key-change-this';
const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://mongo:27017/hearing-clinic-db';
const isInsideDocker = DATABASE_URI.includes('mongo:');
const SERVER_URL = process.env.PARSE_SERVER_URL || 
  (isInsideDocker ? 'http://localhost:1337/parse' : 'http://localhost:1338/parse');

// Initialize Parse
Parse.initialize(APP_ID);
Parse.serverURL = SERVER_URL;
Parse.masterKey = MASTER_KEY;

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    console.log(`📡 Connecting to Parse Server: ${SERVER_URL}`);

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hearingclinic.com';

    // Try to find existing admin user
    const AdminUser = Parse.Object.extend('_User');
    const query = new Parse.Query(AdminUser);
    query.equalTo('username', adminUsername);
    let existingAdmin = await query.first({ useMasterKey: true });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating email and isAdmin flag...');
      existingAdmin.set('email', adminEmail);
      existingAdmin.set('isAdmin', true);
      await existingAdmin.save(null, { useMasterKey: true });
      console.log('✅ Admin user updated successfully');
      console.log('   Note: Password cannot be changed via this script. Use Parse Dashboard to change password.');
    } else {
      // Try to create new admin user
      try {
        const admin = new Parse.User();
        admin.set('username', adminUsername);
        admin.set('password', adminPassword);
        admin.set('email', adminEmail);
        admin.set('isAdmin', true);
        await admin.signUp(null, { useMasterKey: true });
        console.log('✅ Admin user created successfully');
      } catch (signUpError) {
        // If signUp fails with "already exists", try to query again
        if (signUpError.code === 202) {
          console.log('⚠️  Admin user already exists (detected during signup). Fetching user...');
          existingAdmin = await query.first({ useMasterKey: true });
          if (existingAdmin) {
            existingAdmin.set('email', adminEmail);
            existingAdmin.set('isAdmin', true);
            await existingAdmin.save(null, { useMasterKey: true });
            console.log('✅ Admin user updated successfully');
          } else {
            throw signUpError;
          }
        } else {
          throw signUpError;
        }
      }
    }

    console.log(`\n🔐 Admin Login Credentials:`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`\n✅ Admin user setup completed!`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the function
createAdminUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

