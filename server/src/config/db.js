import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (typeof mongoUri !== "string" || !mongoUri.trim()) {
      throw new Error("MONGODB_URI is not set. Please define it in server/.env");
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      family: 4,
    });
    console.log("MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      throw error;
    }
    process.exit(1);
  }
};

export default connectDB;
