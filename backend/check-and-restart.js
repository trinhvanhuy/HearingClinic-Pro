// Script to check Playwright installation and provide restart instructions
const fs = require('fs')
const path = require('path')

console.log('🔍 Checking Playwright installation...\n')

// Check if playwright is installed
const playwrightPath = path.join(__dirname, 'node_modules', 'playwright')
const playwrightCorePath = path.join(__dirname, 'node_modules', 'playwright-core')

let playwrightInstalled = false
let playwrightCoreInstalled = false

if (fs.existsSync(playwrightPath)) {
  console.log('✅ Playwright package found')
  playwrightInstalled = true
} else {
  console.log('❌ Playwright package NOT found')
}

if (fs.existsSync(playwrightCorePath)) {
  console.log('✅ Playwright-core package found')
  playwrightCoreInstalled = true
} else {
  console.log('❌ Playwright-core package NOT found')
}

// Check if module can be loaded
try {
  const { chromium } = require('playwright')
  console.log('✅ Playwright module can be loaded')
  console.log('\n🎉 Everything is ready!')
  console.log('\n📝 Next step:')
  console.log('   Restart your backend server to load Playwright')
  console.log('   - Stop current server (Ctrl+C)')
  console.log('   - Run: npm run dev')
} catch (error) {
  console.log('❌ Error loading Playwright:', error.message)
  console.log('\n⚠️  Please ensure Playwright is properly installed')
}

// Check for browser installation
const browserCachePath = path.join(__dirname, 'node_modules', '.cache', 'playwright')
if (fs.existsSync(browserCachePath)) {
  console.log('✅ Browser cache found (browsers may be installed)')
} else {
  console.log('⚠️  Browser cache not found (browsers may need installation)')
  console.log('   Run: node install-playwright-browsers.js')
}

console.log('\n' + '='.repeat(50))
console.log('✅ Setup check complete!')
console.log('='.repeat(50))

