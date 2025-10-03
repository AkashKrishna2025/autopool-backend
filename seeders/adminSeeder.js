require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const db = require('../models');
const Users = db.users;

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

const adminUser = {
  name: 'Admin',
  email: 'admin@autopool.com',
  password: bcrypt.hashSync('admin@123', salt),
  role: 'admin',
  status: 'active',
};

const seedAdmin = async () => {
  try {
    // Connect to the database with increased timeout
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
    });
    console.log('MongoDB connected successfully');

    // Check if admin already exists
    const existingAdmin = await Users.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create new admin user
      const newAdmin = new Users(adminUser);
      await newAdmin.save();
      console.log('Admin user created successfully');
    }

    // Disconnect from the database
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

// Run the seeder
seedAdmin(); 