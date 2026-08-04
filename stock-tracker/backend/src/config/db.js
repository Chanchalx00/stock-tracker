const mongoose = require('mongoose');
const dns = require("dns");
const logger = require('../utils/logger');

dns.setDefaultResultOrder("ipv4first");
const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`MongoDB connected: ${connect.connection.host}`, { tag: 'SYSTEM' });
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`, { tag: 'SYSTEM' });
    process.exit(1);
  }
};

const isConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isConnected = isConnected;