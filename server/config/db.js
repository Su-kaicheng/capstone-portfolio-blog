const mongoose = require('mongoose');
const config = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 20000,
    appName: 'portfolio-blog-api'
  });
  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);
}

async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

module.exports = { connectDB, closeDB };
