const Parse = require('parse/node');
require('dotenv').config();

// Parse Server Configuration - same as in index.js
const APP_ID = process.env.PARSE_APP_ID || 'hearing-clinic-app-id';
const MASTER_KEY = process.env.PARSE_MASTER_KEY || 'your-master-key-change-this';
// When running inside Docker, use internal port 1337, otherwise use 1338
const SERVER_URL = process.env.PARSE_SERVER_URL || (process.env.INSIDE_DOCKER ? 'http://localhost:1337/parse' : 'http://localhost:1338/parse');
const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://mongo:27017/hearing-clinic-db';

// Initialize Parse
Parse.initialize(APP_ID);
Parse.serverURL = SERVER_URL;
Parse.masterKey = MASTER_KEY;

// Sample patients data
const samplePatients = [
  {
    firstName: 'Nguyễn',
    lastName: 'Văn An',
    phone: '0901234567',
    email: 'nguyenvanan@example.com',
    dateOfBirth: new Date('1980-05-15'),
    gender: 'male',
    address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
    notes: 'Bệnh nhân thường xuyên khám định kỳ',
    isActive: true,
  },
  {
    firstName: 'Trần',
    lastName: 'Thị Bình',
    phone: '0902345678',
    email: 'tranthibinh@example.com',
    dateOfBirth: new Date('1975-08-22'),
    gender: 'female',
    address: '456 Đường Lê Lợi, Quận 1, TP.HCM',
    notes: 'Cần theo dõi thường xuyên',
    isActive: true,
  },
  {
    firstName: 'Lê',
    lastName: 'Văn Cường',
    phone: '0903456789',
    email: 'levancuong@example.com',
    dateOfBirth: new Date('1990-03-10'),
    gender: 'male',
    address: '789 Đường Pasteur, Quận 3, TP.HCM',
    notes: 'Bệnh nhân mới',
    isActive: true,
  },
  {
    firstName: 'Phạm',
    lastName: 'Thị Dung',
    phone: '0904567890',
    email: 'phamthidung@example.com',
    dateOfBirth: new Date('1985-11-30'),
    gender: 'female',
    address: '321 Đường Võ Văn Tần, Quận 3, TP.HCM',
    notes: 'Đã phẫu thuật năm 2020',
    isActive: true,
  },
  {
    firstName: 'Hoàng',
    lastName: 'Văn Em',
    phone: '0905678901',
    email: 'hoangvanem@example.com',
    dateOfBirth: new Date('1978-07-18'),
    gender: 'male',
    address: '654 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
    notes: 'Sử dụng máy trợ thính',
    isActive: true,
  },
  {
    firstName: 'Võ',
    lastName: 'Thị Phượng',
    phone: '0906789012',
    email: 'vothiphuong@example.com',
    dateOfBirth: new Date('1992-02-25'),
    gender: 'female',
    address: '987 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM',
    notes: '',
    isActive: true,
  },
  {
    firstName: 'Đặng',
    lastName: 'Văn Giang',
    phone: '0907890123',
    email: 'dangvangiang@example.com',
    dateOfBirth: new Date('1982-09-12'),
    gender: 'male',
    address: '147 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
    notes: 'Bệnh nhân VIP',
    isActive: true,
  },
  {
    firstName: 'Bùi',
    lastName: 'Thị Hoa',
    phone: '0908901234',
    email: 'buithihoa@example.com',
    dateOfBirth: new Date('1987-04-05'),
    gender: 'female',
    address: '258 Đường Nguyễn Thái Học, Quận 1, TP.HCM',
    notes: 'Cần tư vấn về máy trợ thính',
    isActive: true,
  },
];

async function seedData() {
  try {
    console.log('🚀 Starting seed process...');
    console.log(`📡 Connecting to Parse Server: ${SERVER_URL}`);

    // 1. Create Admin User
    console.log('\n👤 Creating admin user...');
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const adminEmail = 'admin@hearingclinic.com';

    // Check if admin user already exists
    const AdminUser = Parse.Object.extend('_User');
    const query = new Parse.Query(AdminUser);
    query.equalTo('username', adminUsername);
    const existingAdmin = await query.first({ useMasterKey: true });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password...');
      existingAdmin.set('password', adminPassword);
      existingAdmin.set('email', adminEmail);
      await existingAdmin.save(null, { useMasterKey: true });
      console.log('✅ Admin user password updated');
    } else {
      const admin = new Parse.User();
      admin.set('username', adminUsername);
      admin.set('password', adminPassword);
      admin.set('email', adminEmail);
      admin.set('isAdmin', true);
      await admin.signUp(null, { useMasterKey: true });
      console.log('✅ Admin user created successfully');
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Email: ${adminEmail}`);
    }

    // 2. Create Sample Patients
    console.log('\n👥 Creating sample patients...');
    const Client = Parse.Object.extend('Client');
    let createdCount = 0;
    let skippedCount = 0;

    for (const patientData of samplePatients) {
      // Check if patient with same phone already exists
      const patientQuery = new Parse.Query(Client);
      patientQuery.equalTo('phone', patientData.phone);
      const existingPatient = await patientQuery.first({ useMasterKey: true });

      if (existingPatient) {
        console.log(`⏭️  Patient with phone ${patientData.phone} already exists, skipping...`);
        skippedCount++;
        continue;
      }

      const patient = new Client();
      patient.set('firstName', patientData.firstName);
      patient.set('lastName', patientData.lastName);
      patient.set('phone', patientData.phone);
      patient.set('email', patientData.email);
      patient.set('dateOfBirth', patientData.dateOfBirth);
      patient.set('gender', patientData.gender);
      patient.set('address', patientData.address);
      patient.set('notes', patientData.notes);
      patient.set('isActive', patientData.isActive);
      
      // Set createdBy to admin if we can find it
      if (existingAdmin || query) {
        const adminUser = existingAdmin || await query.first({ useMasterKey: true });
        if (adminUser) {
          patient.set('createdBy', adminUser);
          patient.set('updatedBy', adminUser);
        }
      }

      await patient.save(null, { useMasterKey: true });
      console.log(`✅ Created patient: ${patientData.lastName} ${patientData.firstName} (${patientData.phone})`);
      createdCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Created: ${createdCount} patients`);
    console.log(`   - Skipped: ${skippedCount} patients (already exist)`);
    console.log(`\n✅ Seed process completed successfully!`);
    console.log(`\n🔐 Admin Login Credentials:`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`\n🌐 You can now login at: http://localhost:5173 (or your webapp URL)`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

