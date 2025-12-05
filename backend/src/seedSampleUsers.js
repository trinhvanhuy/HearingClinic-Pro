const Parse = require('parse/node');
require('dotenv').config();

// Parse Server Configuration
const APP_ID = process.env.PARSE_APP_ID || 'hearing-clinic-app-id';
const MASTER_KEY = process.env.PARSE_MASTER_KEY || 'your-master-key-change-this';
const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://mongo:27017/hearing-clinic-db';
const isInsideDocker = require('fs').existsSync('/.dockerenv');
const SERVER_URL = process.env.PARSE_SERVER_URL || 
  (isInsideDocker ? 'http://localhost:1337/parse' : 'http://localhost:1338/parse');

// Initialize Parse
Parse.initialize(APP_ID);
Parse.serverURL = SERVER_URL;
Parse.masterKey = MASTER_KEY;

// Sample users data
const SAMPLE_USERS = [
  {
    firstName: 'An',
    lastName: 'Mẫu',
    phone: '0901000001',
    email: 'mau.an@example.com',
    dateOfBirth: new Date('1980-01-15'),
    gender: 'male',
    address: '123 Đường Mẫu, Quận 1, TP.HCM',
    notes: 'Khách hàng mẫu số 1',
  },
  {
    firstName: 'Bình',
    lastName: 'Mẫu',
    phone: '0901000002',
    email: 'mau.binh@example.com',
    dateOfBirth: new Date('1985-03-20'),
    gender: 'female',
    address: '456 Đường Mẫu, Quận 2, TP.HCM',
    notes: 'Khách hàng mẫu số 2',
  },
  {
    firstName: 'Cường',
    lastName: 'Mẫu',
    phone: '0901000003',
    email: 'mau.cuong@example.com',
    dateOfBirth: new Date('1990-05-25'),
    gender: 'male',
    address: '789 Đường Mẫu, Quận 3, TP.HCM',
    notes: 'Khách hàng mẫu số 3',
  },
  {
    firstName: 'Dung',
    lastName: 'Mẫu',
    phone: '0901000004',
    email: 'mau.dung@example.com',
    dateOfBirth: new Date('1988-07-10'),
    gender: 'female',
    address: '321 Đường Mẫu, Quận 4, TP.HCM',
    notes: 'Khách hàng mẫu số 4',
  },
  {
    firstName: 'Em',
    lastName: 'Mẫu',
    phone: '0901000005',
    email: 'mau.em@example.com',
    dateOfBirth: new Date('1992-09-30'),
    gender: 'male',
    address: '654 Đường Mẫu, Quận 5, TP.HCM',
    notes: 'Khách hàng mẫu số 5',
  },
];

// Helper functions
function randomDateInRange(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate ear thresholds for audiogram
function generateEarThresholds() {
  const frequencies = [250, 500, 1000, 2000, 4000, 8000];
  const thresholds = {};
  
  frequencies.forEach(freq => {
    // Random threshold between -10 and 80 dB
    thresholds[freq] = randomInt(-10, 80);
  });
  
  return thresholds;
}

// Staff names for appointments
const STAFF_NAMES = [
  'BS. Nguyễn Văn A',
  'BS. Trần Thị B',
  'KTV. Lê Văn C',
  'KTV. Phạm Thị D',
  'Tư vấn viên Hoàng Văn E',
];

// Appointment notes
const REPAIR_NOTES = [
  'Sửa máy trợ thính bên phải, tiếng bị rè',
  'Thay pin và vệ sinh máy',
  'Điều chỉnh volume và tần số',
  'Thay ống tai và kiểm tra độ kín',
  'Bảo dưỡng định kỳ máy trợ thính',
  'Khắc phục lỗi kết nối Bluetooth',
];

const COUNSELING_NOTES = [
  'Tư vấn về cách sử dụng máy trợ thính mới',
  'Hướng dẫn bảo quản và vệ sinh máy',
  'Tư vấn chọn máy trợ thính phù hợp',
  'Giải đáp thắc mắc về thính lực',
  'Tư vấn chăm sóc tai định kỳ',
];

const AUDIOGRAM_NOTES = [
  'Đo thính lực định kỳ 6 tháng',
  'Kiểm tra lại sau điều trị',
  'Đo thính lực ban đầu',
  'Theo dõi thay đổi thính lực',
];

/**
 * Create a client
 */
async function createClient(clientData, adminUser) {
  const Client = Parse.Object.extend('Client');
  
  // Check if client already exists
  const query = new Parse.Query(Client);
  query.equalTo('phone', clientData.phone);
  const existing = await query.first({ useMasterKey: true });
  
  if (existing) {
    console.log(`   ⏭️  Client with phone ${clientData.phone} already exists, using existing...`);
    return existing;
  }
  
  const client = new Client();
  client.set('firstName', clientData.firstName);
  client.set('lastName', clientData.lastName);
  client.set('fullName', `${clientData.lastName} ${clientData.firstName}`);
  client.set('phone', clientData.phone);
  client.set('email', clientData.email);
  client.set('dateOfBirth', clientData.dateOfBirth);
  client.set('gender', clientData.gender);
  client.set('address', clientData.address);
  client.set('notes', clientData.notes);
  client.set('isActive', true);
  
  if (adminUser) {
    client.set('createdBy', adminUser);
    client.set('updatedBy', adminUser);
  }
  
  await client.save(null, { useMasterKey: true });
  return client;
}

/**
 * Create hearing reports for a client
 */
async function createHearingReports(client, adminUser, count = 3) {
  const HearingReport = Parse.Object.extend('HearingReport');
  const reports = [];
  
  // Get a random audiologist from staff
  const StaffQuery = new Parse.Query(Parse.User);
  StaffQuery.equalTo('staffRole', 'audiologist');
  StaffQuery.limit(10);
  const audiologists = await StaffQuery.find({ useMasterKey: true });
  
  for (let i = 0; i < count; i++) {
    const report = new HearingReport();
    
    // Generate test date (spread over last 2 years)
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    const testDate = randomDateInRange(twoYearsAgo, now);
    
    // Generate thresholds
    const leftThresholds = generateEarThresholds();
    const rightThresholds = generateEarThresholds();
    
    // Set fields
    report.set('client', client);
    if (audiologists.length > 0) {
      report.set('audiologist', pickRandom(audiologists));
    }
    report.set('testDate', testDate);
    report.set('leftEarThresholds', leftThresholds);
    report.set('rightEarThresholds', rightThresholds);
    report.set('typeOfTest', 'pure tone audiometry');
    
    // Add diagnosis and recommendations
    report.set('diagnosis', 'Giảm thính lực mức độ trung bình. Khuyến nghị sử dụng máy trợ thính phù hợp.');
    report.set('recommendations', 'Nên đeo máy trợ thính thường xuyên. Tái khám định kỳ 6 tháng một lần.');
    report.set('hearingAidSuggested', 'Máy trợ thính kỹ thuật số RIC');
    
    if (adminUser) {
      report.set('createdBy', adminUser);
      report.set('updatedBy', adminUser);
    }
    
    await report.save(null, { useMasterKey: true });
    reports.push(report);
    
    console.log(`   ✅ Created hearing report ${i + 1}/${count} - Date: ${testDate.toLocaleDateString('vi-VN')}`);
  }
  
  return reports;
}

/**
 * Create appointments for a client
 */
async function createAppointments(client, hearingReports, adminUser) {
  const Appointment = Parse.Object.extend('Appointment');
  const appointments = [];
  
  // Create repair appointments (3-5)
  const repairCount = randomInt(3, 5);
  for (let i = 0; i < repairCount; i++) {
    const appointment = new Appointment();
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const date = randomDateInRange(oneYearAgo, now);
    
    appointment.set('client', client);
    appointment.set('type', 'REPAIR');
    appointment.set('date', date);
    appointment.set('status', 'COMPLETED');
    appointment.set('note', pickRandom(REPAIR_NOTES));
    appointment.set('staffName', pickRandom(STAFF_NAMES));
    
    if (adminUser) {
      appointment.set('createdBy', adminUser);
      appointment.set('updatedBy', adminUser);
    }
    
    await appointment.save(null, { useMasterKey: true });
    appointments.push(appointment);
  }
  
  console.log(`   ✅ Created ${repairCount} repair appointments`);
  
  // Create audiogram appointments (2-3)
  const audiogramCount = randomInt(2, 3);
  for (let i = 0; i < audiogramCount; i++) {
    const appointment = new Appointment();
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    const date = randomDateInRange(twoYearsAgo, now);
    
    // Link to a hearing report if available
    let linkedReport = null;
    if (hearingReports.length > 0) {
      // Find report with closest date
      const sortedReports = [...hearingReports].sort((a, b) => {
        const dateA = new Date(a.get('testDate')).getTime();
        const dateB = new Date(b.get('testDate')).getTime();
        const appointmentTime = date.getTime();
        return Math.abs(dateA - appointmentTime) - Math.abs(dateB - appointmentTime);
      });
      linkedReport = sortedReports[0];
    }
    
    appointment.set('client', client);
    appointment.set('type', 'AUDIOGRAM');
    appointment.set('date', date);
    appointment.set('status', 'COMPLETED');
    appointment.set('note', pickRandom(AUDIOGRAM_NOTES));
    appointment.set('staffName', pickRandom(STAFF_NAMES));
    if (linkedReport) {
      appointment.set('hearingReport', linkedReport);
    }
    
    if (adminUser) {
      appointment.set('createdBy', adminUser);
      appointment.set('updatedBy', adminUser);
    }
    
    await appointment.save(null, { useMasterKey: true });
    appointments.push(appointment);
  }
  
  console.log(`   ✅ Created ${audiogramCount} audiogram appointments`);
  
  // Create counseling appointments (2-4)
  const counselingCount = randomInt(2, 4);
  for (let i = 0; i < counselingCount; i++) {
    const appointment = new Appointment();
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const date = randomDateInRange(oneYearAgo, now);
    
    appointment.set('client', client);
    appointment.set('type', 'COUNSELING');
    appointment.set('date', date);
    appointment.set('status', pickRandom(['COMPLETED', 'SCHEDULED']));
    appointment.set('note', pickRandom(COUNSELING_NOTES));
    appointment.set('staffName', pickRandom(STAFF_NAMES));
    
    if (adminUser) {
      appointment.set('createdBy', adminUser);
      appointment.set('updatedBy', adminUser);
    }
    
    await appointment.save(null, { useMasterKey: true });
    appointments.push(appointment);
  }
  
  console.log(`   ✅ Created ${counselingCount} counseling appointments`);
  
  return appointments;
}

/**
 * Main seed function
 */
async function seedSampleUsers() {
  console.log('\n🚀 Starting to seed sample users...');
  console.log(`📡 Connecting to Parse Server: ${SERVER_URL}\n`);
  
  // Get admin user
  const AdminUser = Parse.Object.extend('_User');
  const adminQuery = new Parse.Query(AdminUser);
  adminQuery.equalTo('username', 'admin');
  const adminUser = await adminQuery.first({ useMasterKey: true });
  
  if (!adminUser) {
    console.warn('⚠️  Admin user not found, data will be created without createdBy');
  }
  
  let totalClients = 0;
  let totalReports = 0;
  let totalAppointments = 0;
  
  // Process each sample user
  for (const userData of SAMPLE_USERS) {
    console.log(`\n📋 Processing: ${userData.lastName} ${userData.firstName} (${userData.phone})`);
    
    try {
      // 1. Create client
      console.log('   Creating client...');
      const client = await createClient(userData, adminUser);
      totalClients++;
      console.log(`   ✅ Client created/loaded`);
      
      // 2. Create hearing reports
      console.log('   Creating hearing reports...');
      const reports = await createHearingReports(client, adminUser, 3);
      totalReports += reports.length;
      
      // 3. Create appointments (repair, audiogram, counseling)
      console.log('   Creating appointments...');
      const appointments = await createAppointments(client, reports, adminUser);
      totalAppointments += appointments.length;
      
      // Update client's lastVisitDate to the latest report date
      if (reports.length > 0) {
        const sortedReports = [...reports].sort((a, b) => {
          return new Date(b.get('testDate')).getTime() - new Date(a.get('testDate')).getTime();
        });
        const latestReport = sortedReports[0];
        client.set('lastVisitDate', latestReport.get('testDate'));
        await client.save(null, { useMasterKey: true });
      }
      
      console.log(`   ✅ Completed: ${appointments.length} appointments created`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${userData.firstName}:`, error.message);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEED SUMMARY');
  console.log('='.repeat(60));
  console.log(`   ✅ Clients: ${totalClients}`);
  console.log(`   ✅ Hearing Reports: ${totalReports}`);
  console.log(`   ✅ Appointments: ${totalAppointments}`);
  console.log('='.repeat(60));
  console.log('\n✨ Sample users seed completed successfully!\n');
}

// Run the seed function
seedSampleUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });

