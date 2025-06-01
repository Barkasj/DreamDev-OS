/**
 * Script untuk menjalankan demo Smart Chunking dan Context Compression
 */

const { execSync } = require('child_process');
const path = require('path');

// Compile TypeScript dan jalankan demo
try {
  console.log('🔧 Compiling TypeScript demo...');
  
  // Compile demo file
  execSync('npx tsc src/demo/chunking-demo.ts --outDir dist --target es2020 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --resolveJsonModule', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('✅ Compilation successful!');
  console.log('🚀 Running Smart Chunking Demo...\n');
  
  // Import dan jalankan demo
  const { runChunkingDemo } = require('./dist/demo/chunking-demo.js');
  runChunkingDemo();
  
} catch (error) {
  console.error('❌ Error running demo:', error.message);
  
  // Fallback: jalankan dengan ts-node jika tersedia
  try {
    console.log('🔄 Trying with ts-node...');
    execSync('npx ts-node src/demo/chunking-demo.ts', {
      cwd: __dirname,
      stdio: 'inherit'
    });
  } catch (tsNodeError) {
    console.error('❌ ts-node also failed:', tsNodeError.message);
    console.log('\n💡 To run the demo manually:');
    console.log('1. npm install -g ts-node');
    console.log('2. npx ts-node src/demo/chunking-demo.ts');
  }
}