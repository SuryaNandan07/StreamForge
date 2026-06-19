const mongoose = require('mongoose');

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.log('MongoDB runtime error:', error.message);
});

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.log('MongoDB connection failed');

    if (error.name === 'MongoServerSelectionError') {
      console.log('Reason: MongoDB server is not reachable.');
      console.log('Fix: make sure MongoDB is running, or check your MONGO_URI host/port.');
    } else if (error.name === 'MongoParseError') {
      console.log('Reason: MONGO_URI format is invalid.');
      console.log('Fix: check the MongoDB connection string in backend/.env.');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.log('Reason: MongoDB username or password is wrong.');
      console.log('Fix: update the credentials in MONGO_URI.');
    }

    throw new Error(error.message);
  }
};

module.exports = connectDB;
