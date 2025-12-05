const Parse = require('parse/node');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse Server Configuration
const APP_ID = process.env.PARSE_APP_ID || 'hearing-clinic-app-id';
const MASTER_KEY = process.env.PARSE_MASTER_KEY || 'your-master-key-change-this';
const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://mongo:27017/hearing-clinic-db';
// Check if we're actually running inside Docker container
const isInsideDocker = fs.existsSync('/.dockerenv');
// Default to external port 1338 if PARSE_SERVER_URL is not set
const SERVER_URL = process.env.PARSE_SERVER_URL || 
  (isInsideDocker ? 'http://localhost:1337/parse' : 'http://localhost:1338/parse');

console.log(`📡 Connecting to Parse Server: ${SERVER_URL}`);

// Initialize Parse
Parse.initialize(APP_ID);
Parse.serverURL = SERVER_URL;
Parse.masterKey = MASTER_KEY;

/**
 * Clear all clients from database
 */
async function clearAllClients() {
  console.log('\n🗑️  Starting to clear all clients from database...');
  
  const Client = Parse.Object.extend('Client');
  let totalDeleted = 0;
  let batchSize = 100;
  let hasMore = true;
  
  while (hasMore) {
    const query = new Parse.Query(Client);
    query.limit(batchSize);
    
    const clients = await query.find({ useMasterKey: true });
    
    if (clients.length === 0) {
      hasMore = false;
      break;
    }
    
    // Delete in batch
    await Parse.Object.destroyAll(clients, { useMasterKey: true });
    totalDeleted += clients.length;
    
    console.log(`   Deleted ${totalDeleted} clients...`);
    
    if (clients.length < batchSize) {
      hasMore = false;
    }
  }
  
  console.log(`✅ Successfully deleted ${totalDeleted} clients from database.\n`);
  return totalDeleted;
}

/**
 * Normalize name for comparison (remove accents, lowercase, trim)
 */
function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim()
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Normalize phone number (remove all non-digits)
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Parse date from various formats
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'number') {
    // Excel date serial number
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    return date;
  }
  
  if (typeof dateValue === 'string') {
    const trimmed = String(dateValue).trim();
    
    // Try standard Date parse first
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try Vietnamese date format: dd/mm/yyyy or dd-mm-yyyy
    const dateMatch = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return new Date(year, month - 1, day);
    }
    
    // Try format: yyyy-mm-dd
    const isoMatch = trimmed.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
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
  if (gender.includes('nam') || gender.includes('male') || gender === 'm' || gender === 'nam' || gender === 'n') {
    return 'male';
  }
  if (gender.includes('nữ') || gender.includes('female') || gender === 'f' || gender === 'nu' || gender === 'nữ') {
    return 'female';
  }
  return 'other';
}

/**
 * Check if two dates are the same (same day)
 */
function isSameDate(date1, date2) {
  if (!date1 && !date2) return true;
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Get cell value from Excel sheet by column letter (A, B, C, etc.)
 */
function getCellValue(sheet, row, col) {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[cellAddress];
  if (!cell) return null;
  
  // Return the value, handling different types
  if (cell.v !== undefined) {
    return cell.v;
  }
  if (cell.w) {
    return cell.w;
  }
  return null;
}

/**
 * Convert column letter to index (A=0, B=1, C=2, etc.)
 */
function columnToIndex(col) {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
}

// Cache for existing clients (loaded once at the start)
let existingClientsCache = null;

/**
 * Load all existing clients into cache for duplicate checking
 */
async function loadExistingClientsCache() {
  if (existingClientsCache !== null) {
    return existingClientsCache;
  }
  
  console.log('\n📦 Loading existing clients for duplicate checking...');
  const Client = Parse.Object.extend('Client');
  const query = new Parse.Query(Client);
  query.select('fullName', 'dateOfBirth', 'phone', 'phone2');
  
  let allClients = [];
  let batchSize = 1000;
  let skip = 0;
  let hasMore = true;
  
  while (hasMore) {
    query.limit(batchSize);
    query.skip(skip);
    
    const batch = await query.find({ useMasterKey: true });
    allClients = allClients.concat(batch);
    
    console.log(`   Loaded ${allClients.length} clients...`);
    
    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      skip += batchSize;
    }
  }
  
  existingClientsCache = allClients;
  console.log(`✅ Loaded ${allClients.length} existing clients into cache.\n`);
  
  return allClients;
}

/**
 * Check for duplicate client based on fullName, dateOfBirth, and phone
 */
async function findDuplicateClient(fullName, dateOfBirth, phone1, phone2) {
  await loadExistingClientsCache();
  
  const normalizedName = normalizeName(fullName);
  const normalizedPhone1 = normalizePhone(phone1);
  const normalizedPhone2 = normalizePhone(phone2);
  
  // Check all cached clients
  for (const candidate of existingClientsCache) {
    const candidateName = normalizeName(candidate.get('fullName') || '');
    const candidateDOB = candidate.get('dateOfBirth');
    const candidatePhone1 = normalizePhone(candidate.get('phone') || '');
    const candidatePhone2 = normalizePhone(candidate.get('phone2') || '');
    
    // Check name match (normalized)
    if (candidateName !== normalizedName) {
      continue;
    }
    
    // Check date of birth match
    if (!isSameDate(dateOfBirth, candidateDOB)) {
      continue;
    }
    
    // Check phone match - either phone1 matches candidate's phone1 or phone2
    // or phone2 matches candidate's phone1 or phone2
    const phone1Match = normalizedPhone1 && (
      normalizedPhone1 === candidatePhone1 || 
      normalizedPhone1 === candidatePhone2
    );
    const phone2Match = normalizedPhone2 && (
      normalizedPhone2 === candidatePhone1 || 
      normalizedPhone2 === candidatePhone2
    );
    
    const phoneMatch = (!normalizedPhone1 && !normalizedPhone2 && !candidatePhone1 && !candidatePhone2) ||
                       phone1Match || phone2Match;
    
    if (phoneMatch) {
      return candidate;
    }
  }
  
  return null;
}

/**
 * Add a new client to the cache (after creation)
 */
function addToCache(client) {
  if (existingClientsCache !== null) {
    existingClientsCache.push(client);
  }
}

/**
 * Process Excel file - only first sheet, each row is one client
 * Column mapping:
 * B = First name (tên)
 * C = Last name (HỌ VÀ TÊN ĐỆM)
 * D = Giới tính
 * E = Ngày sinh
 * F = Điện thoại 1
 * G = Điện thoại 2
 * H = Ngày đăng ký
 * I = Thành phố
 * J = Địa chỉ
 * K = Email
 * L = Người giới thiệu
 */
async function processExcelFile(filePath, adminUser) {
  console.log(`\n📖 Processing file: ${path.basename(filePath)}`);
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    if (sheetNames.length === 0) {
      console.log(`   ⚠️  No sheets found, skipping...`);
      return { createdCount: 0, skippedCount: 0, errorCount: 0 };
    }
    
    // Only process first sheet
    const firstSheetName = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    console.log(`   Processing sheet "${firstSheetName}" (first sheet only)`);
    
    // Get the range of the sheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    if (range.e.r < 1) {
      console.log(`   ⚠️  No data rows found (only header row), skipping...`);
      return { createdCount: 0, skippedCount: 0, errorCount: 0 };
    }
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Column indices (0-based): A=0, B=1, C=2, etc.
    const COL_B = 1; // First name
    const COL_C = 2; // Last name
    const COL_D = 3; // Gender
    const COL_E = 4; // Date of birth
    const COL_F = 5; // Phone 1
    const COL_G = 6; // Phone 2
    const COL_H = 7; // Registration date
    const COL_I = 8; // City
    const COL_J = 9; // Address
    const COL_K = 10; // Email
    const COL_L = 11; // Referral source
    
    // Process each row (start from row 1, row 0 might be header or empty)
    // Skip first row if it looks like header (contains "Menu" or similar)
    let startRow = 1;
    const firstRowValue = getCellValue(worksheet, 0, 0);
    if (firstRowValue && String(firstRowValue).toLowerCase().includes('menu')) {
      startRow = 1; // Skip header row
    }
    
    for (let row = startRow; row <= range.e.r; row++) {
      try {
        // Get values from each column
        const firstName = getCellValue(worksheet, row, COL_B);
        const lastName = getCellValue(worksheet, row, COL_C);
        const genderValue = getCellValue(worksheet, row, COL_D);
        const dobValue = getCellValue(worksheet, row, COL_E);
        const phone1Value = getCellValue(worksheet, row, COL_F);
        const phone2Value = getCellValue(worksheet, row, COL_G);
        const regDateValue = getCellValue(worksheet, row, COL_H);
        const city = getCellValue(worksheet, row, COL_I);
        const address = getCellValue(worksheet, row, COL_J);
        const email = getCellValue(worksheet, row, COL_K);
        const referralSource = getCellValue(worksheet, row, COL_L);
        
        // Skip if no name data
        const firstNameStr = firstName ? String(firstName).trim() : '';
        const lastNameStr = lastName ? String(lastName).trim() : '';
        const fullName = `${lastNameStr} ${firstNameStr}`.trim();
        
        if (!fullName || fullName === '') {
          skippedCount++;
          continue;
        }
        
        // Parse data
        const dateOfBirth = parseDate(dobValue);
        const gender = parseGender(genderValue);
        const phone1 = normalizePhone(phone1Value);
        const phone2 = normalizePhone(phone2Value);
        const registrationDate = parseDate(regDateValue);
        const cityStr = city ? String(city).trim() : null;
        const addressStr = address ? String(address).trim() : null;
        const emailStr = email ? String(email).trim() : null;
        const referralSourceStr = referralSource ? String(referralSource).trim() : null;
        
        // Check for duplicate
        const duplicate = await findDuplicateClient(fullName, dateOfBirth, phone1, phone2);
        
        if (duplicate) {
          const matchInfo = [
            fullName,
            dateOfBirth ? dateOfBirth.toLocaleDateString('vi-VN') : 'no DOB',
            phone1 || phone2 || 'no phone'
          ].join(', ');
          console.log(`   ⏭️  Row ${row + 1}: Duplicate found (${matchInfo}), skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create client
        const Client = Parse.Object.extend('Client');
        const client = new Client();
        
        client.set('firstName', firstNameStr);
        client.set('lastName', lastNameStr);
        client.set('fullName', fullName);
        
        // Use phone1 as primary phone, store phone2 separately
        client.set('phone', phone1 || phone2 || ''); // Primary phone
        if (phone2 && phone2 !== phone1) {
          client.set('phone2', phone2); // Secondary phone
        }
        
        client.set('isActive', true);
        
        if (emailStr) client.set('email', emailStr);
        if (dateOfBirth) client.set('dateOfBirth', dateOfBirth);
        if (gender) client.set('gender', gender);
        if (addressStr) client.set('address', addressStr);
        if (cityStr) client.set('city', cityStr);
        if (registrationDate) client.set('registrationDate', registrationDate);
        if (referralSourceStr) client.set('referralSource', referralSourceStr);
        
        if (adminUser) {
          client.set('createdBy', adminUser);
          client.set('updatedBy', adminUser);
        }
        
        await client.save(null, { useMasterKey: true });
        addToCache(client);
        
        createdCount++;
        
        const phoneDisplay = phone1 || phone2 || 'no phone';
        if (phone2 && phone2 !== phone1) {
          console.log(`   ✅ Row ${row + 1}: Created - ${fullName} (${phoneDisplay}, ${phone2})`);
        } else {
          console.log(`   ✅ Row ${row + 1}: Created - ${fullName} (${phoneDisplay})`);
        }
        
      } catch (error) {
        console.error(`   ❌ Row ${row + 1}: Error -`, error.message);
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
 * Find all Excel files in a directory recursively
 */
function findExcelFiles(dirPath, fileList = []) {
  if (!fs.existsSync(dirPath)) {
    return fileList;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findExcelFiles(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.xlsx' || ext === '.xls') {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Import clients from multiple folders
 */
async function importFromFolders(folderPaths, clearBeforeImport = false) {
  console.log('\n🚀 Starting import process...\n');
  
  // Step 1: Clear all clients if requested
  if (clearBeforeImport) {
    await clearAllClients();
    existingClientsCache = []; // Reset cache after clearing
  }
  
  // Step 2: Load existing clients cache (if not clearing)
  if (!clearBeforeImport) {
    await loadExistingClientsCache();
  }
  
  // Step 3: Get admin user
  const AdminUser = Parse.Object.extend('_User');
  const adminQuery = new Parse.Query(AdminUser);
  adminQuery.equalTo('username', 'admin');
  const adminUser = await adminQuery.first({ useMasterKey: true });
  
  if (!adminUser) {
    console.warn('⚠️  Admin user not found, clients will be created without createdBy');
  }
  
  // Step 4: Find all Excel files in all folders
  let allFiles = [];
  
  for (const folderPath of folderPaths) {
    console.log(`📂 Scanning folder: ${folderPath}`);
    
    if (!fs.existsSync(folderPath)) {
      console.warn(`   ⚠️  Folder not found: ${folderPath}, skipping...`);
      continue;
    }
    
    const files = findExcelFiles(folderPath).sort();
    console.log(`   Found ${files.length} Excel file(s)`);
    allFiles = allFiles.concat(files);
  }
  
  if (allFiles.length === 0) {
    console.error('❌ No Excel files found in any folder!');
    process.exit(1);
  }
  
  console.log(`\n📋 Total ${allFiles.length} Excel file(s) to process:\n`);
  allFiles.forEach((file, idx) => {
    console.log(`   ${idx + 1}. ${file}`);
  });
  
  // Step 5: Process each file
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const filePath of allFiles) {
    try {
      const result = await processExcelFile(filePath, adminUser);
      totalCreated += result.createdCount;
      totalSkipped += result.skippedCount;
      totalErrors += result.errorCount;
    } catch (error) {
      console.error(`❌ Failed to process ${path.basename(filePath)}:`, error.message);
      totalErrors++;
    }
  }
  
  // Step 6: Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`   ✅ Created: ${totalCreated} clients`);
  console.log(`   ⏭️  Skipped: ${totalSkipped} clients (duplicates or missing data)`);
  console.log(`   ❌ Errors: ${totalErrors} files/rows`);
  console.log('='.repeat(60));
  console.log('\n✨ Import process completed!\n');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Please provide folder paths');
  console.log('\nUsage:');
  console.log('  node src/importClientsFromFolders.js <folder1> [folder2] [folder3] ...');
  console.log('\nOptions:');
  console.log('  --clear    Clear all existing clients before importing');
  console.log('\nExamples:');
  console.log('  # Import from multiple folders:');
  console.log('  node src/importClientsFromFolders.js ./@_NL ./@_TR');
  console.log('  # Clear and import:');
  console.log('  node src/importClientsFromFolders.js --clear ./@_NL ./@_TR');
  console.log('  # Import from absolute paths:');
  console.log('  node src/importClientsFromFolders.js /path/to/@_NL /path/to/@_TR');
  process.exit(1);
}

const clearBeforeImport = args.includes('--clear');
const folderPaths = args.filter(arg => arg !== '--clear');

if (folderPaths.length === 0) {
  console.error('❌ No folder paths provided');
  process.exit(1);
}

importFromFolders(folderPaths, clearBeforeImport)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
