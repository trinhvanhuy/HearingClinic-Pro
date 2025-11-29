const https = require('https');
const http = require('http');

const APP_ID = 'hearing-clinic-app-id';
const MASTER_KEY = 'your-master-key-change-this';
const SERVER_URL = process.env.PARSE_SERVER_URL || 'http://localhost:1338/parse';

function makeRequest(method, path, data = null, useMasterKey = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(SERVER_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'X-Parse-Application-Id': APP_ID,
        'Content-Type': 'application/json',
      }
    };
    
    if (useMasterKey) {
      options.headers['X-Parse-Master-Key'] = MASTER_KEY;
    }
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }
    
    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
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

const samplePatients = [
  {
    firstName: 'Nguyễn',
    lastName: 'Văn An',
    phone: '0901234567',
    email: 'nguyenvanan@example.com',
    dateOfBirth: { __type: 'Date', iso: '1980-05-15T00:00:00.000Z' },
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
    dateOfBirth: { __type: 'Date', iso: '1975-08-22T00:00:00.000Z' },
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
    dateOfBirth: { __type: 'Date', iso: '1990-03-10T00:00:00.000Z' },
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
    dateOfBirth: { __type: 'Date', iso: '1985-11-30T00:00:00.000Z' },
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
    dateOfBirth: { __type: 'Date', iso: '1978-07-18T00:00:00.000Z' },
    gender: 'male',
    address: '654 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
    notes: 'Sử dụng máy trợ thính',
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

    try {
      const admin = await makeRequest('POST', '/users', {
        username: adminUsername,
        password: adminPassword,
        email: adminEmail,
        isAdmin: true
      }, true);
      console.log('✅ Admin user created successfully');
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Email: ${adminEmail}`);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('101')) {
        console.log('⚠️  Admin user already exists, skipping...');
      } else {
        throw error;
      }
    }

    // 2. Create Sample Patients
    console.log('\n👥 Creating sample patients...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const patientData of samplePatients) {
      try {
        await makeRequest('POST', '/classes/Client', patientData, true);
        console.log(`✅ Created patient: ${patientData.lastName} ${patientData.firstName} (${patientData.phone})`);
        createdCount++;
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('already')) {
          console.log(`⏭️  Patient with phone ${patientData.phone} already exists, skipping...`);
          skippedCount++;
        } else {
          console.log(`❌ Error creating patient ${patientData.lastName} ${patientData.firstName}: ${error.message}`);
        }
      }
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
    process.exit(1);
  }
}

seedData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

