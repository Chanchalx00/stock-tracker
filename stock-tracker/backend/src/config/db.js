const mongoose = require('mongoose');
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");
const connectDB = async () => {
  try {
    
    const connect = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${connect.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;