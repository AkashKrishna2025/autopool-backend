require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

// Define User schema directly
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: false },
    password: { type: String, required: false },
    isAdmin: { type: Boolean, default: true },
    role: { type: String, default: "admin" },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

const adminUser = {
  name: 'Admin',
  email: 'admin@autopool.com',
  password: bcrypt.hashSync('admin@123', salt),
  role: 'admin',
  status: 'active',
};

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');

    // Create User model directly
    const UserModel = mongoose.model('users', UserSchema);
    
    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create new admin user
      const newAdmin = new UserModel(adminUser);
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