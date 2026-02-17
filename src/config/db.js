const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);

  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
