import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import User from "../models/User.js";

dotenv.config();

const username = "packing";
const password = "Packing@123";

async function seedPackingUser() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const existingUser = await User.findOne({
      username,
    });

    if (existingUser) {
      console.log("Packing user already exists.");
      console.log(`Username: ${existingUser.username}`);
      console.log(`Employee ID: ${existingUser.employeeId}`);

      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      employeeId: "PACK-001",
      name: "Packing Department",
      username,
      password: hashedPassword,
      role: "PACKING",
      phone: "",
      email: "",
      active: true,
    });

    console.log("================================");
    console.log("Packing user created successfully");
    console.log("================================");
    console.log(`Employee ID: ${user.employeeId}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log("Password: Packing@123");
    console.log("================================");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Packing user seed failed:");
    console.error(error.message);

    try {
      await mongoose.connection.close();
    } catch {}

    process.exitCode = 1;
  }
}

seedPackingUser();