#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = 'public';
const targetDir = 'dist';

// Files to copy to dist after build
const filesToCopy = [
  'robots.txt',
  'humans.txt',
  '.htaccess'
];

// Directories to copy recursively
const dirsToCopy = [
  '.well-known'
];

// Copy a file from source to target
function copyFile(filename) {
  const sourcePath = path.join(sourceDir, filename);
  const targetPath = path.join(targetDir, filename);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied ${filename}`);
    } else {
      console.log(`⚠️  Warning: ${filename} not found in ${sourceDir}`);
    }
  } catch (error) {
    console.error(`❌ Error copying ${filename}:`, error.message);
  }
}

// Copy a directory recursively
function copyDirectory(dirname) {
  const sourcePath = path.join(sourceDir, dirname);
  const targetPath = path.join(targetDir, dirname);
  
  try {
    if (fs.existsSync(sourcePath)) {
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      
      // Copy all files in the directory
      const files = fs.readdirSync(sourcePath);
      files.forEach(file => {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);
        
        if (fs.statSync(sourceFile).isDirectory()) {
          // Recursively copy subdirectories
          copyDirectory(path.join(dirname, file));
        } else {
          fs.copyFileSync(sourceFile, targetFile);
        }
      });
      
      console.log(`✅ Copied directory ${dirname}/`);
    } else {
      console.log(`⚠️  Warning: Directory ${dirname} not found in ${sourceDir}`);
    }
  } catch (error) {
    console.error(`❌ Error copying directory ${dirname}:`, error.message);
  }
}

// Main function
function copyAssets() {
  console.log('📁 Copying additional assets to dist...');
  
  // Ensure dist directory exists
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Error: ${targetDir} directory not found. Run 'npm run build' first.`);
    process.exit(1);
  }
  
  // Copy individual files
  filesToCopy.forEach(copyFile);
  
  // Copy directories
  dirsToCopy.forEach(copyDirectory);
  
  console.log('✅ Asset copying completed!');
}

// Run the script
if (require.main === module) {
  copyAssets();
}

module.exports = { copyAssets };