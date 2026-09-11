import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`You successfully connected to MongoDB!`);
    console.log(`MongoDB Host: ${conn.connection.host}`);
    console.log(`MongoDB Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    throw error;
  }
};

export default connectDB;