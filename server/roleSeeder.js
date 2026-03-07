import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Roles from './src/constants/roles.js';

// Load environment variables
dotenv.config();

const roles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrator with full system access',
  },
  {
    name: 'HR',
    description: 'HR Administrator can manage employees and managers',
  },
  {
    name: 'MANAGER',
    description: 'Manager can view employees but cannot create users',
  },
  {
    name: 'EMPLOYEE',
    description: 'Employee with basic access',
  },
];

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');

    console.log('Connected to MongoDB');

    // Clear existing roles
    await Roles.deleteMany({});
    console.log('Cleared existing roles');

    // Insert new roles one by one to handle any potential issues
    for (const roleData of roles) {
      try {
        const role = new Role(roleData);
        await role.save();
        console.log(`Role ${roleData.name} created successfully`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`Role ${roleData.name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log('Role seeding completed successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeder
seedRoles();