import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const managers = [
  {
    employeeId: "MGR-001",
    name: "Karthik",
    username: "manager001",
    password: "Manager@123",
    role: "MANAGER",
    phone: "",
    email: "",
  },

  {
    employeeId: "MGR-002",
    name: "Ravi",
    username: "manager002",
    password: "Manager@456",
    role: "MANAGER",
    phone: "",
    email: "",
  },

  {
    employeeId: "MGR-003",
    name: "Manju Sir",
    username: "manager003",
    password: "Manager@789",
    role: "MANAGER",
    phone: "",
    email: "",
  },
];

async function seedManagers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    for (const manager of managers) {
      const existingManager = await User.findOne({
        employeeId: manager.employeeId,
      });

      if (existingManager) {
        console.log(
          `Already exists: ${manager.employeeId} - ${manager.name}`
        );
        continue;
      }

      const hashedPassword = await bcrypt.hash(
        manager.password,
        10
      );

      await User.create({
        employeeId: manager.employeeId,
        name: manager.name,
        username: manager.username,
        password: hashedPassword,
        role: manager.role,
        phone: manager.phone,
        email: manager.email,
        active: true,
      });

      console.log(
        `Created: ${manager.employeeId} - ${manager.name}`
      );
    }

    console.log("Manager seed completed.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Manager seed error:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
}

seedManagers();