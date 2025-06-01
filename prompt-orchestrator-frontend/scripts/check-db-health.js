"use strict";
/**
 * Database Health Check Script
 * Script untuk mengecek kesehatan database MongoDB Atlas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseHealth = checkDatabaseHealth;
const mongodb_1 = require("mongodb");
const fs_1 = require("fs");
const path_1 = require("path");
// Load environment variables from .env.local
function loadEnvVars() {
    try {
        const envPath = (0, path_1.join)(process.cwd(), '.env.local');
        const envContent = (0, fs_1.readFileSync)(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0 && !key.startsWith('#')) {
                const value = valueParts.join('=').trim();
                process.env[key.trim()] = value;
            }
        });
    }
    catch (error) {
        console.error('❌ Could not load .env.local file');
    }
}
loadEnvVars();
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;
if (!MONGODB_URI || !MONGODB_DB_NAME) {
    console.error('❌ MONGODB_URI dan MONGODB_DB_NAME harus didefinisikan di .env.local');
    process.exit(1);
}
async function checkDatabaseHealth() {
    console.log('🏥 Checking DreamDev OS Database Health...');
    console.log('📍 Database:', MONGODB_DB_NAME);
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    const client = new mongodb_1.MongoClient(MONGODB_URI);
    try {
        // Test connection
        console.log('\n🔗 Testing connection...');
        await client.connect();
        console.log('✅ Connection successful');
        const db = client.db(MONGODB_DB_NAME);
        // Test ping
        console.log('\n🏓 Testing ping...');
        await db.admin().ping();
        console.log('✅ Ping successful');
        // Check collections
        console.log('\n📦 Checking collections...');
        const collections = await db.listCollections().toArray();
        console.log(`✅ Found ${collections.length} collections:`);
        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`   📄 ${collection.name}: ${count} documents`);
        }
        // Check indexes
        console.log('\n🔍 Checking indexes...');
        for (const collection of collections) {
            const indexes = await db.collection(collection.name).listIndexes().toArray();
            console.log(`   📄 ${collection.name}: ${indexes.length} indexes`);
        }
        // Database stats
        console.log('\n📊 Database statistics...');
        const stats = await db.stats();
        console.log(`   💾 Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📄 Total documents: ${stats.objects}`);
        console.log(`   📦 Total collections: ${stats.collections}`);
        console.log(`   🔍 Total indexes: ${stats.indexes}`);
        // Connection info
        console.log('\n🔗 Connection information...');
        const admin = db.admin();
        const serverStatus = await admin.serverStatus();
        console.log(`   🖥️ MongoDB version: ${serverStatus.version}`);
        console.log(`   ⏰ Server uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
        console.log(`   🔗 Current connections: ${serverStatus.connections.current}`);
        console.log('\n🎉 Database health check completed successfully!');
        console.log('✅ All systems operational');
    }
    catch (error) {
        console.error('\n❌ Database health check failed:', error);
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
// Performance test
async function performanceTest() {
    console.log('\n⚡ Running performance test...');
    const client = new mongodb_1.MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(MONGODB_DB_NAME);
        // Test write performance
        const startWrite = Date.now();
        const testDoc = {
            testId: 'health-check-test',
            timestamp: new Date(),
            data: 'test data for performance check'
        };
        await db.collection('health_check').insertOne(testDoc);
        const writeTime = Date.now() - startWrite;
        console.log(`   ✍️ Write test: ${writeTime}ms`);
        // Test read performance
        const startRead = Date.now();
        await db.collection('health_check').findOne({ testId: 'health-check-test' });
        const readTime = Date.now() - startRead;
        console.log(`   📖 Read test: ${readTime}ms`);
        // Cleanup
        await db.collection('health_check').deleteOne({ testId: 'health-check-test' });
        console.log('✅ Performance test completed');
    }
    catch (error) {
        console.error('❌ Performance test failed:', error);
    }
    finally {
        await client.close();
    }
}
// Run health check
if (require.main === module) {
    checkDatabaseHealth()
        .then(() => performanceTest())
        .catch(console.error);
}
