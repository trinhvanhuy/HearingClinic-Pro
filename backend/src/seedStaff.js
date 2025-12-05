const Parse = require('parse/node');
require('dotenv').config();

// Parse Server Configuration
const APP_ID = process.env.PARSE_APP_ID || 'hearing-clinic-app-id';
const MASTER_KEY = process.env.PARSE_MASTER_KEY || 'your-master-key-change-this';
const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://mongo:27017/hearing-clinic-db';
const isInsideDocker = DATABASE_URI.includes('mongo:');
const SERVER_URL = isInsideDocker 
  ? 'http://127.0.0.1:1337/parse'
  : (process.env.PARSE_SERVER_URL || 'http://localhost:1338/parse');

// Initialize Parse
Parse.initialize(APP_ID);
Parse.serverURL = SERVER_URL;
Parse.masterKey = MASTER_KEY;

// Common password for all staff members
const COMMON_PASSWORD = '123456';

// Staff roles
const STAFF_ROLES = {
  technical_specialist: 'technical_specialist', // Chuyên viên kĩ thuật
  consultant: 'consultant', // Nhân viên Tư vấn
  audiologist: 'audiologist', // Chuyên gia thính học
  hearing_doctor: 'hearing_doctor', // Bác sĩ thính học
};

// Sample staff data - multiple staff members for each role
const sampleStaff = [
  // Technical Specialists (Chuyên viên kĩ thuật)
  {
    username: 'tech001',
    fullName: 'Nguyễn Văn Kỹ Thuật',
    email: 'tech001@hearingclinic.com',
    staffRole: STAFF_ROLES.technical_specialist,
  },
  {
    username: 'tech002',
    fullName: 'Trần Thị Công Nghệ',
    email: 'tech002@hearingclinic.com',
    staffRole: STAFF_ROLES.technical_specialist,
  },
  {
    username: 'tech003',
    fullName: 'Lê Văn Máy Móc',
    email: 'tech003@hearingclinic.com',
    staffRole: STAFF_ROLES.technical_specialist,
  },

  // Consultants (Nhân viên Tư vấn)
  {
    username: 'consultant001',
    fullName: 'Phạm Thị Tư Vấn',
    email: 'consultant001@hearingclinic.com',
    staffRole: STAFF_ROLES.consultant,
  },
  {
    username: 'consultant002',
    fullName: 'Hoàng Văn Hỗ Trợ',
    email: 'consultant002@hearingclinic.com',
    staffRole: STAFF_ROLES.consultant,
  },
  {
    username: 'consultant003',
    fullName: 'Võ Thị Chăm Sóc',
    email: 'consultant003@hearingclinic.com',
    staffRole: STAFF_ROLES.consultant,
  },
  {
    username: 'consultant004',
    fullName: 'Đặng Văn Hướng Dẫn',
    email: 'consultant004@hearingclinic.com',
    staffRole: STAFF_ROLES.consultant,
  },

  // Audiologists (Chuyên gia thính học)
  {
    username: 'audiologist001',
    fullName: 'Bùi Thị Thính Học',
    email: 'audiologist001@hearingclinic.com',
    staffRole: STAFF_ROLES.audiologist,
  },
  {
    username: 'audiologist002',
    fullName: 'Nguyễn Văn Đo Thính',
    email: 'audiologist002@hearingclinic.com',
    staffRole: STAFF_ROLES.audiologist,
  },
  {
    username: 'audiologist003',
    fullName: 'Trần Thị Phân Tích',
    email: 'audiologist003@hearingclinic.com',
    staffRole: STAFF_ROLES.audiologist,
  },

  // Hearing Doctors (Bác sĩ thính học)
  {
    username: 'doctor001',
    fullName: 'Lê Văn Bác Sĩ',
    email: 'doctor001@hearingclinic.com',
    staffRole: STAFF_ROLES.hearing_doctor,
  },
  {
    username: 'doctor002',
    fullName: 'Phạm Thị Chuyên Khoa',
    email: 'doctor002@hearingclinic.com',
    staffRole: STAFF_ROLES.hearing_doctor,
  },
  {
    username: 'doctor003',
    fullName: 'Hoàng Văn Khám Bệnh',
    email: 'doctor003@hearingclinic.com',
    staffRole: STAFF_ROLES.hearing_doctor,
  },
];

async function seedStaff() {
  try {
    console.log('🚀 Starting staff seed process...');
    console.log(`📡 Connecting to Parse Server: ${SERVER_URL}`);
    console.log(`🔐 Common password for all staff: ${COMMON_PASSWORD}`);

    const User = Parse.Object.extend('_User');
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const staffData of sampleStaff) {
      try {
        // Check if staff member already exists
        const query = new Parse.Query(User);
        query.equalTo('username', staffData.username);
        const existingUser = await query.first({ useMasterKey: true });

        if (existingUser) {
          console.log(`⏭️  Staff ${staffData.username} already exists, updating...`);
          
          // Update existing user
          existingUser.set('fullName', staffData.fullName);
          existingUser.set('email', staffData.email);
          existingUser.set('staffRole', staffData.staffRole);
          existingUser.set('role', 'staff');
          existingUser.set('password', COMMON_PASSWORD); // Update password to common password
          
          await existingUser.save(null, { useMasterKey: true });
          console.log(`✅ Updated staff: ${staffData.fullName} (${staffData.username}) - Role: ${staffData.staffRole}`);
          updatedCount++;
          continue;
        }

        // Create new staff member
        const user = new Parse.User();
        user.set('username', staffData.username);
        user.set('password', COMMON_PASSWORD);
        user.set('email', staffData.email);
        user.set('fullName', staffData.fullName);
        user.set('staffRole', staffData.staffRole);
        user.set('role', 'staff'); // Set role to staff (not admin)

        await user.signUp(null, { useMasterKey: true });
        console.log(`✅ Created staff: ${staffData.fullName} (${staffData.username}) - Role: ${staffData.staffRole}`);
        createdCount++;
      } catch (error) {
        if (error.code === 202) {
          // User already exists
          console.log(`⚠️  Staff ${staffData.username} already exists (duplicate username), skipping...`);
          skippedCount++;
        } else {
          console.error(`❌ Error creating/updating staff ${staffData.username}:`, error.message);
        }
      }
    }

    // Print summary by role
    console.log(`\n📊 Summary by Role:`);
    const roleCounts = {};
    sampleStaff.forEach((staff) => {
      roleCounts[staff.staffRole] = (roleCounts[staff.staffRole] || 0) + 1;
    });
    
    Object.keys(roleCounts).forEach((role) => {
      const roleLabel = {
        technical_specialist: 'Chuyên viên kĩ thuật',
        consultant: 'Nhân viên Tư vấn',
        audiologist: 'Chuyên gia thính học',
        hearing_doctor: 'Bác sĩ thính học',
      }[role] || role;
      console.log(`   - ${roleLabel}: ${roleCounts[role]} staff members`);
    });

    console.log(`\n📊 Overall Summary:`);
    console.log(`   - Created: ${createdCount} staff members`);
    console.log(`   - Updated: ${updatedCount} staff members`);
    console.log(`   - Skipped: ${skippedCount} staff members`);
    console.log(`\n✅ Staff seed process completed successfully!`);
    console.log(`\n🔐 All staff login with password: ${COMMON_PASSWORD}`);
    console.log(`\n📋 Staff Accounts Created:`);
    sampleStaff.forEach((staff) => {
      const roleLabel = {
        technical_specialist: 'Chuyên viên kĩ thuật',
        consultant: 'Nhân viên Tư vấn',
        audiologist: 'Chuyên gia thính học',
        hearing_doctor: 'Bác sĩ thính học',
      }[staff.staffRole] || staff.staffRole;
      console.log(`   - ${staff.username}: ${staff.fullName} (${roleLabel})`);
    });

  } catch (error) {
    console.error('❌ Error seeding staff:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedStaff()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

