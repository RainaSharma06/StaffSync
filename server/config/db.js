const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb+srv://rainasharma6002_db_user:L1d3GwYDudeQHRF3@cluster0.epzaeez.mongodb.net/staffsync?retryWrites=true&w=majority';
  
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri.replace(/:([^:@]+)@/, ':****@')}...`);
    // Connect with serverSelectionTimeoutMS suitable for cloud Atlas
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
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
