const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/staffsync';
  
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}...`);
    // Attempt standard connection with a short serverSelectionTimeoutMS
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected successfully to MongoDB: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB (${err.message}).`);
    console.log('[Database] Starting embedded MongoMemoryServer for instant zero-config operation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        binary: {
          version: '7.0.14',
        },
        instance: {
          dbName: 'staffsync',
        },
      });
      const inMemoryUri = mongodInstance.getUri();
      console.log(`[Database] Embedded MongoDB instance created at: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('[Database] Connected successfully to embedded in-memory MongoDB!');
      return mongoose.connection;
    } catch (memErr) {
      console.error('[Database] Fatal error: Failed to start both local and in-memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('[Database] MongoDB disconnected.');
  } catch (err) {
    console.error('[Database] Disconnect error:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
