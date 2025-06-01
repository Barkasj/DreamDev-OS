// Test API endpoints DreamDev OS
const axios = require('axios');

const BASE_URL = 'http://localhost:12000';

async function testHealthAPI() {
  console.log('🏥 Testing Health API...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health API Response:', response.data);
  } catch (error) {
    console.error('❌ Health API Error:', error.message);
  }
}

async function testPRDProcessing() {
  console.log('\n📝 Testing PRD Processing API...');
  
  const testPRD = `
# Sistem Manajemen Perpustakaan Digital

## Deskripsi Proyek
Aplikasi web untuk mengelola perpustakaan digital dengan fitur peminjaman buku online.

## Fitur Utama
### Manajemen Buku
- Tambah buku baru
- Edit informasi buku
- Hapus buku
- Pencarian buku

### Manajemen Anggota
- Registrasi anggota baru
- Edit profil anggota
- Lihat riwayat peminjaman

### Sistem Peminjaman
- Pinjam buku online
- Perpanjang masa pinjam
- Kembalikan buku
- Notifikasi jatuh tempo
  `;

  try {
    const response = await axios.post(`${BASE_URL}/api/prd/process`, {
      prdText: testPRD,
      globalContext: 'Aplikasi web menggunakan React.js dan Node.js dengan database MongoDB'
    });
    
    console.log('✅ PRD Processing berhasil!');
    console.log('📊 Project ID:', response.data.data.projectId);
    console.log('🌳 Task Tree:', JSON.stringify(response.data.data.taskTree, null, 2));
    console.log('📈 Statistics:', response.data.data.statistics);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ PRD Processing Error:', error.response?.data || error.message);
  }
}

async function testPromptGeneration(projectData) {
  if (!projectData) return;
  
  console.log('\n🎯 Testing Prompt Generation API...');
  
  const firstTask = projectData.taskTree[0];
  if (!firstTask) {
    console.log('⚠️ No tasks found to test prompt generation');
    return;
  }
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/project/${projectData.projectId}/task/${firstTask.id}/prompt`
    );
    
    console.log('✅ Prompt Generation berhasil!');
    console.log('📝 Generated Prompt Preview:');
    if (response.data.prompt) {
      console.log(response.data.prompt.substring(0, 500) + '...');
    } else {
      console.log('Full Response:', JSON.stringify(response.data, null, 2));
    }
    console.log('🏷️ Metadata:', response.data.metadata);
    
  } catch (error) {
    console.error('❌ Prompt Generation Error:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Memulai testing semua API endpoints DreamDev OS...\n');
  
  await testHealthAPI();
  const projectData = await testPRDProcessing();
  await testPromptGeneration(projectData);
  
  console.log('\n✅ Semua testing selesai!');
}

runAllTests();