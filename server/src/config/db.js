import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      family: 4,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
