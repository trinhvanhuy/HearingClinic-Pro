// Script to install Playwright browsers
const { execSync } = require('child_process')
const path = require('path')

console.log('Installing Playwright Chromium browser...')

try {
  // Try to use the playwright from node_modules
  const playwrightPath = path.join(__dirname, 'node_modules', 'playwright')
  const playwrightCorePath = path.join(__dirname, 'node_modules', 'playwright-core')
  
  // Check if playwright or playwright-core exists
  let playwrightExecutable = null
  try {
    playwrightExecutable = require.resolve('playwright-core/lib/cli/program')
  } catch (e) {
    console.log('Playwright-core CLI not found, trying alternative method...')
  }
  
  // Use node to run playwright install
  const installCommand = `node ${path.join(playwrightCorePath, 'lib', 'cli', 'program.js')} install chromium`
  
  console.log('Running:', installCommand)
  execSync(installCommand, { stdio: 'inherit', cwd: __dirname })
  
  console.log('✅ Playwright Chromium installed successfully!')
} catch (error) {
  console.error('❌ Error installing Playwright browsers:', error.message)
  console.log('\nYou may need to install browsers manually:')
  console.log('  cd backend')
  console.log('  npx playwright install chromium')
  process.exit(1)
}

