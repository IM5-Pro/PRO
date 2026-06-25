import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (typeof mongoUri !== "string" || !mongoUri.trim()) {
      throw new Error("MONGODB_URI is not set. Please define it in server/.env");
    }

    await mongoose.connect(mongoUri, {
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
