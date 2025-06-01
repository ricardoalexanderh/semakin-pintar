#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { copyAssets } = require('./copy-assets.js');
const { writeSitemap } = require('./generate-sitemap.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ Error during ${description.toLowerCase()}`, 'red');
    console.error(error.message);
    process.exit(1);
  }
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'cyan');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found. Are you in the project root?', 'red');
    process.exit(1);
  }
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    log('📦 node_modules not found. Installing dependencies...', 'yellow');
    runCommand('npm ci', 'Installing dependencies');
  }
  
  log('✅ Prerequisites check passed', 'green');
}

function validateBuild() {
  log('🔍 Validating build output...', 'cyan');
  
  const distDir = 'dist';
  const requiredFiles = ['index.html'];
  const requiredDirs = ['assets'];
  
  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    log('❌ dist directory not found', 'red');
    process.exit(1);
  }
  
  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      log(`❌ Required file ${file} not found in dist`, 'red');
      process.exit(1);
    }
  }
  
  // Check required directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(distDir, dir);
    if (!fs.existsSync(dirPath)) {
      log(`❌ Required directory ${dir} not found in dist`, 'red');
      process.exit(1);
    }
  }
  
  // Check build size
  const stats = fs.statSync(path.join(distDir, 'index.html'));
  if (stats.size < 100) {
    log('❌ index.html seems too small, build might be corrupted', 'red');
    process.exit(1);
  }
  
  log('✅ Build validation passed', 'green');
}

function showDeploymentInfo() {
  log('\n🎉 Deployment preparation completed successfully!', 'green');
  log('\n📤 Your files are ready in the \'dist\' directory', 'cyan');
  
  log('\n🌐 Next steps:', 'yellow');
  log('1. Upload the contents of \'dist\' folder to your web server');
  log('2. Configure your domain to point to the uploaded files');
  log('3. Set up SSL certificate (HTTPS)');
  log('4. Configure Google Analytics with your tracking ID');
  log('5. Verify your site with Google Search Console and Bing Webmaster Tools');
  
  log('\n📋 Don\'t forget to:', 'yellow');
  log('- Replace GA_MEASUREMENT_ID in index.html with your actual Google Analytics ID');
  log('- Add Google Search Console verification meta tag');
  log('- Add Bing verification meta tag if needed');
  log('- Update sitemap.xml lastmod dates');
  
  log('\n📊 Build summary:', 'magenta');
  try {
    const distSize = execSync('du -sh dist 2>/dev/null || echo "Size calculation not available"', { encoding: 'utf8' }).trim();
    log(`- Build size: ${distSize}`);
  } catch {
    log('- Build size: Calculation not available');
  }
  
  const fileCount = fs.readdirSync('dist', { recursive: true }).length;
  log(`- Total files: ${fileCount}`);
  
  log('\n🚀 Happy deploying!', 'green');
}

// Main deployment function
function deploy() {
  log('🚀 Starting deployment process...', 'cyan');
  
  try {
    // Step 1: Check prerequisites
    checkPrerequisites();
    
    // Step 2: Run linting
    runCommand('npm run lint', 'Running linter');
    
    // Step 3: Build the project
    runCommand('npm run build', 'Building project');
    
    // Step 4: Validate build
    validateBuild();
    
    // Step 5: Generate sitemap
    log('🗺️  Generating sitemap...', 'blue');
    writeSitemap();
    log('✅ Sitemap generation completed', 'green');
    
    // Step 6: Copy additional assets
    log('📁 Copying additional assets...', 'blue');
    copyAssets();
    log('✅ Asset copying completed', 'green');
    
    // Step 7: Show deployment info
    showDeploymentInfo();
    
  } catch (error) {
    log('❌ Deployment failed', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('Semakin Pintar Deployment Script', 'cyan');
  log('\nUsage:');
  log('  npm run deploy:full       Run full deployment process');
  log('  npm run deploy:build      Build and prepare files only');
  log('  npm run deploy:dry-run    Build without deployment info');
  log('\nThis script will:');
  log('1. Install dependencies (if needed)');
  log('2. Run linting');
  log('3. Build the project');
  log('4. Generate sitemap');
  log('5. Copy additional assets');
  log('6. Validate the build');
  process.exit(0);
}

// Run deployment
if (require.main === module) {
  deploy();
}