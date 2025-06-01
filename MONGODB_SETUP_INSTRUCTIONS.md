# 🔧 **INSTRUKSI SETUP MONGODB - DreamDev OS**

## 📋 **Konfigurasi MongoDB Atlas**

### **🎯 Connection String yang Dikonfigurasi**

```
mongodb+srv://kooetimu1999:<db_password>@cluster0.f2bdrfx.mongodb.net/
```

### **📝 Langkah Setup**

#### **1. Update Environment Variables**

Edit file `prompt-orchestrator-frontend/.env.local`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://kooetimu1999:YOUR_ACTUAL_PASSWORD@cluster0.f2bdrfx.mongodb.net/dreamdev_os?retryWrites=true&w=majority
MONGODB_DB_NAME=dreamdev_os
```

**⚠️ PENTING**: Ganti `YOUR_ACTUAL_PASSWORD` dengan password yang sebenarnya untuk user `kooetimu1999`.

#### **2. Test Koneksi**

```bash
cd prompt-orchestrator-frontend
node scripts/check-db-health.js
```

**Expected Output (jika berhasil):**
```
🏥 Checking DreamDev OS Database Health...
📍 Database: dreamdev_os
📍 Environment: development

🔗 Testing connection...
✅ Connection successful

🏓 Testing ping...
✅ Ping successful

📦 Checking collections...
✅ Found 0 collections:

🎉 Database health check completed successfully!
✅ All systems operational
```

#### **3. Test Aplikasi**

```bash
# Start development server
npm run dev

# Open browser
http://localhost:3000

# Test health endpoint
curl http://localhost:3000/api/health
```

### **🔍 Troubleshooting**

#### **Error: SSL/TLS Issues**
```
MongoServerSelectionError: F0AE0200:error:0A000438:SSL routines
```

**Solusi:**
1. Pastikan password benar di connection string
2. Check network connectivity
3. Pastikan IP address di-whitelist di MongoDB Atlas

#### **Error: Authentication Failed**
```
MongoServerError: Authentication failed
```

**Solusi:**
1. Verifikasi username: `kooetimu1999`
2. Verifikasi password di connection string
3. Check user permissions di MongoDB Atlas

#### **Error: Network Timeout**
```
MongoServerSelectionError: connection timed out
```

**Solusi:**
1. Check internet connection
2. Verifikasi network access settings di MongoDB Atlas
3. Try different network (jika di corporate firewall)

### **📊 Database Schema**

**Collections yang akan dibuat:**
- `projects` - Project documents dengan task trees
- `users` - User data (future)
- `sessions` - Session data (future)

**Sample Project Document:**
```json
{
  "_id": "uuid-project-id",
  "originalPrdText": "PRD content...",
  "taskTree": [...],
  "globalContext": "project context",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "totalTasks": 10,
    "rootTasks": 3,
    "levelDistribution": {...},
    "entityStats": {...}
  }
}
```

### **🚀 Next Steps**

1. **Setup Password**: Update `.env.local` dengan password yang benar
2. **Test Connection**: Run health check script
3. **Start Application**: Run `npm run dev`
4. **Upload PRD**: Test dengan upload PRD file
5. **Verify Data**: Check MongoDB untuk project documents

### **📞 Support**

Jika masih ada masalah:
1. Check MongoDB Atlas dashboard untuk connection logs
2. Verify user permissions dan network access
3. Test connection dengan MongoDB Compass
4. Check application logs di Next.js console

---

**Status**: ⚠️ **Membutuhkan password untuk connection string**
**Action Required**: Update `<db_password>` di `.env.local` dengan password yang sebenarnya
