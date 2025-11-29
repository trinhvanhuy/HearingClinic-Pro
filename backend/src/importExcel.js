const Parse = require('parse/node');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse Server Configuration
const APP_ID = process.env.PARSE_APP_ID || 'hearing-clinic-app-id';
const MASTER_KEY = process.env.PARSE_MASTER_KEY || 'your-master-key-change-this';
const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://mongo:27017/hearing-clinic-db';
// When running inside Docker, use internal port 1337, otherwise use 1338
const isInsideDocker = DATABASE_URI.includes('mongo:');
const SERVER_URL = process.env.PARSE_SERVER_URL || 
  (isInsideDocker ? 'http://localhost:1337/parse' : 'http://localhost:1338/parse');

// Initialize Parse
Parse.initialize(APP_ID);
Parse.serverURL = SERVER_URL;
Parse.masterKey = MASTER_KEY;

/**
 * Parse date from various formats
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it's a number (Excel date serial number)
  if (typeof dateValue === 'number') {
    // Excel date serial number starts from 1900-01-01
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    return date;
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    // Try different date formats
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try Vietnamese date format: dd/mm/yyyy
    const vnDateMatch = dateValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (vnDateMatch) {
      const [, day, month, year] = vnDateMatch;
      return new Date(year, month - 1, day);
    }
  }
  
  return null;
}

/**
 * Parse gender from various formats
 */
function parseGender(genderValue) {
  if (!genderValue) return undefined;
  
  const gender = String(genderValue).toLowerCase().trim();
  if (gender.includes('nam') || gender.includes('male') || gender === 'm') {
    return 'male';
  }
  if (gender.includes('nữ') || gender.includes('female') || gender === 'f') {
    return 'female';
  }
  return 'other';
}

/**
 * Clean phone number
 */
function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, ''); // Remove non-digits
}

/**
 * Process a single sheet as one client
 */
async function processSheetAsClient(worksheet, sheetName, adminUser) {
  const Client = Parse.Object.extend('Client');
  
  // Convert sheet to JSON - treat each row as a key-value pair
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: ['key', 'value'], // Two columns: key and value
    defval: null,
    range: 1 // Start from first row
  });
  
  // If that doesn't work, try as object (key-value pairs)
  let clientData = {};
  
  // Try to parse as key-value pairs
  for (const row of data) {
    if (row.key && row.value) {
      const key = String(row.key).toLowerCase().trim();
      const value = row.value;
      clientData[key] = value;
    }
  }
  
  // If no key-value pairs found, try first row as headers, second row as values
  if (Object.keys(clientData).length === 0) {
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    if (rows.length >= 2) {
      const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
      const values = rows[1];
      headers.forEach((header, idx) => {
        if (header && values[idx] !== null && values[idx] !== undefined) {
          clientData[header] = values[idx];
        }
      });
    }
  }
  
  if (Object.keys(clientData).length === 0) {
    console.log(`   ⚠️  Sheet "${sheetName}": No data found, skipping...`);
    return { created: false, skipped: true };
  }
  
  // Extract client information
  const getValue = (keys) => {
    for (const key of keys) {
      const found = Object.keys(clientData).find(k => k.includes(key));
      if (found && clientData[found]) {
        return clientData[found];
      }
    }
    return null;
  };
  
  let firstName = getValue(['first', 'tên', 'ten', 'ho']) || '';
  let lastName = getValue(['last', 'họ', 'ho']) || '';
  let fullName = getValue(['full', 'tên đầy đủ', 'ten day du', 'họ tên', 'ho ten', 'name']) || '';
  
  // If we have fullName, try to split it
  if (fullName && !firstName && !lastName) {
    const nameParts = String(fullName).trim().split(/\s+/);
    if (nameParts.length > 1) {
      lastName = nameParts[0];
      firstName = nameParts.slice(1).join(' ');
    } else {
      firstName = fullName;
    }
  }
  
  if (!fullName) {
    fullName = `${lastName} ${firstName}`.trim() || firstName || lastName || sheetName;
  }
  
  const phone = cleanPhone(getValue(['phone', 'sđt', 'sdt', 'điện thoại', 'dien thoai', 'tel']));
  // Phone is optional now, but we still need fullName
  if (!fullName || fullName.trim() === '') {
    console.log(`   ⏭️  Sheet "${sheetName}": No name found, skipping...`);
    return { created: false, skipped: true };
  }
  
  const email = getValue(['email', 'mail']);
  const dateOfBirth = parseDate(getValue(['dob', 'birth', 'ngày sinh', 'ngay sinh', 'sinh', 'date']));
  const gender = parseGender(getValue(['gender', 'giới tính', 'gioi tinh', 'sex']));
  const address = getValue(['address', 'địa chỉ', 'dia chi', 'address']);
  const notes = getValue(['note', 'ghi chú', 'ghi chu', 'mô tả', 'mo ta', 'description', 'desc']);
  
  // Check for duplicate based on fullName, dateOfBirth, and phone
  // Logic: same fullName AND same dateOfBirth AND (same phone OR both phones are empty)
  const existingQuery = new Parse.Query(Client);
  existingQuery.equalTo('fullName', fullName.trim());
  
  // If dateOfBirth exists, add it to query
  if (dateOfBirth) {
    // Parse dates are stored as Date objects, so we need to compare dates
    // We'll query and then filter in memory for exact date match
    const startOfDay = new Date(dateOfBirth);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateOfBirth);
    endOfDay.setHours(23, 59, 59, 999);
    existingQuery.greaterThanOrEqualTo('dateOfBirth', startOfDay);
    existingQuery.lessThanOrEqualTo('dateOfBirth', endOfDay);
  } else {
    // If no dateOfBirth, only match clients without dateOfBirth
    existingQuery.doesNotExist('dateOfBirth');
  }
  
  const candidates = await existingQuery.find({ useMasterKey: true });
  
  // Filter candidates by exact date match and phone match
  const existing = candidates.find(candidate => {
    const candidateDateOfBirth = candidate.get('dateOfBirth');
    const candidatePhone = candidate.get('phone') || '';
    
    // Check dateOfBirth match (both null or same date)
    const dateMatch = (!dateOfBirth && !candidateDateOfBirth) || 
                      (dateOfBirth && candidateDateOfBirth && 
                       dateOfBirth.getTime() === candidateDateOfBirth.getTime());
    
    // Check phone match (both empty or same phone)
    const phoneMatch = (!phone && !candidatePhone) || 
                       (phone && candidatePhone && phone === candidatePhone);
    
    return dateMatch && phoneMatch;
  });
  
  if (existing) {
    const matchInfo = [
      fullName,
      dateOfBirth ? dateOfBirth.toLocaleDateString('vi-VN') : 'no DOB',
      phone || 'no phone'
    ].join(', ');
    console.log(`   ⏭️  Sheet "${sheetName}": Duplicate client found (${matchInfo}), skipping...`);
    return { created: false, skipped: true };
  }
  
  // Create client
  const client = new Client();
  client.set('firstName', firstName || '');
  client.set('lastName', lastName || '');
  client.set('fullName', fullName.trim());
  client.set('phone', phone || ''); // Allow empty phone
  if (email) client.set('email', String(email).trim());
  if (dateOfBirth) client.set('dateOfBirth', dateOfBirth);
  if (gender) client.set('gender', gender);
  if (address) client.set('address', String(address).trim());
  if (notes) client.set('notes', String(notes).trim());
  client.set('isActive', true);
  
  if (adminUser) {
    client.set('createdBy', adminUser);
    client.set('updatedBy', adminUser);
  }
  
  await client.save(null, { useMasterKey: true });
  const phoneDisplay = phone || 'no phone';
  console.log(`   ✅ Sheet "${sheetName}": Created client - ${fullName} (${phoneDisplay})`);
  return { created: true, skipped: false };
}

/**
 * Import clients from Excel file (each sheet = one client)
 */
async function importClientsFromExcelFile(filePath, adminUser) {
  try {
    console.log(`\n📖 Processing file: ${path.basename(filePath)}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`   Found ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each sheet as one client
    for (const sheetName of sheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const result = await processSheetAsClient(worksheet, sheetName, adminUser);
        
        if (result.created) {
          createdCount++;
        } else if (result.skipped) {
          skippedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Sheet "${sheetName}": Error -`, error.message);
        errorCount++;
      }
    }
    
    return { createdCount, skippedCount, errorCount };
    
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Recursively find all Excel files in a directory
 */
function findExcelFiles(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search in subdirectories
      findExcelFiles(filePath, fileList);
    } else {
      // Check if it's an Excel file
      const ext = path.extname(file).toLowerCase();
      if (ext === '.xlsx' || ext === '.xls') {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Import clients from directory (all Excel files recursively, sorted alphabetically)
 */
async function importClientsFromDirectory(dirPath) {
  try {
    console.log('📂 Scanning directory (recursively):', dirPath);
    
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    
    // Find all Excel files recursively
    const files = findExcelFiles(dirPath).sort(); // Sort alphabetically
    
    if (files.length === 0) {
      throw new Error(`No Excel files found in directory: ${dirPath}`);
    }
    
    console.log(`\n📋 Found ${files.length} Excel file(s), sorted alphabetically:`);
    files.forEach((file, idx) => {
      console.log(`   ${idx + 1}. ${path.basename(file)}`);
    });
    
    // Get admin user for createdBy
    const AdminUser = Parse.Object.extend('_User');
    const adminQuery = new Parse.Query(AdminUser);
    adminQuery.equalTo('username', 'admin');
    const adminUser = await adminQuery.first({ useMasterKey: true });
    
    if (!adminUser) {
      console.warn('⚠️  Admin user not found, clients will be created without createdBy');
    }
    
    // Process each file
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const filePath of files) {
      try {
        const result = await importClientsFromExcelFile(filePath, adminUser);
        totalCreated += result.createdCount;
        totalSkipped += result.skippedCount;
        totalErrors += result.errorCount;
      } catch (error) {
        console.error(`❌ Failed to process ${path.basename(filePath)}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log('\n📊 Overall Import Summary:');
    console.log(`   ✅ Created: ${totalCreated} clients`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} clients (already exist or missing data)`);
    console.log(`   ❌ Errors: ${totalErrors} files/sheets`);
    console.log('\n✨ Import completed!');
    
  } catch (error) {
    console.error('❌ Error importing from directory:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Get path from command line argument
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Please provide the Excel file path or directory path');
  console.log('\nUsage:');
  console.log('  node src/importExcel.js <path-to-excel-file-or-directory>');
  console.log('\nExamples:');
  console.log('  # Import from a single file:');
  console.log('  node src/importExcel.js ./Drive/clients.xlsx');
  console.log('  # Import from a directory (all Excel files, sorted alphabetically):');
  console.log('  node src/importExcel.js ./Drive');
  console.log('  node src/importExcel.js /path/to/excel/files');
  console.log('\nNote: Each sheet in each file will be treated as one client.');
  process.exit(1);
}

// Check if path is a directory or file
const stats = fs.statSync(inputPath);
const isDirectory = stats.isDirectory();

// Run import
if (isDirectory) {
  importClientsFromDirectory(inputPath)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} else {
  // Single file - treat each sheet as one client
  const AdminUser = Parse.Object.extend('_User');
  const adminQuery = new Parse.Query(AdminUser);
  adminQuery.equalTo('username', 'admin');
  adminQuery.first({ useMasterKey: true })
    .then((adminUser) => {
      return importClientsFromExcelFile(inputPath, adminUser);
    })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

