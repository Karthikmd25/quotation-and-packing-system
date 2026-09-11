import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

async function resetManagerPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    const hashedPassword = await bcrypt.hash(
      "Manager@123",
      10
    );

    const manager = await User.findOneAndUpdate(
      {
        employeeId: "MGR-001",
        role: "MANAGER",
      },
      {
        $set: {
          password: hashedPassword,
          active: true,
        },
      },
      {
        new: true,
      }
    );

    if (!manager) {
      console.log("MGR-001 manager not found");
      process.exit(1);
    }

    console.log("Password reset successfully");
    console.log("Manager ID:", manager.employeeId);
    console.log("Username:", manager.username);
    console.log("Name:", manager.name);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Password reset error:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
}

resetManagerPassword();