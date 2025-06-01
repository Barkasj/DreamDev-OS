// Test koneksi MongoDB lokal
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('🔗 Testing MongoDB connection...');
  
  const uri = 'mongodb://localhost:27017';
  const dbName = 'dreamdev_os';
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = client.db(dbName);
    
    // Test ping
    await db.admin().ping();
    console.log('✅ Database ping successful!');
    
    // Test insert
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Test dari DreamDev OS' 
    });
    console.log('✅ Test insert successful:', result.insertedId);
    
    // Test find
    const doc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ Test find successful:', doc);
    
    // Cleanup
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Test cleanup successful');
    
    await client.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
}

testConnection();