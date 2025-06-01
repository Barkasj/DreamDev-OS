// MongoDB initialization script for Docker
db = db.getSiblingDB('dreamdev_os');

// Create collections
db.createCollection('projects');
db.createCollection('tasks');
db.createCollection('prompts');

// Create indexes for better performance
db.projects.createIndex({ "name": 1 });
db.projects.createIndex({ "createdAt": -1 });

db.tasks.createIndex({ "projectId": 1 });
db.tasks.createIndex({ "parentId": 1 });
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "priority": 1 });

db.prompts.createIndex({ "taskId": 1 });
db.prompts.createIndex({ "createdAt": -1 });

// Insert sample data
db.projects.insertOne({
  _id: ObjectId(),
  name: "Sample Project",
  description: "A sample project for testing",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ MongoDB initialized successfully with collections and indexes");
print("📊 Collections created: projects, tasks, prompts");
print("🔍 Indexes created for optimal performance");
print("📝 Sample data inserted");