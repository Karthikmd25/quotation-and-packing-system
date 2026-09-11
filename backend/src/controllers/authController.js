import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function managerLogin(req, res) {
  try {
    const { username, password } = req.body;

    // =========================================================
    // VALIDATE INPUT
    // =========================================================

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // =========================================================
    // FIND ACTIVE MANAGER
    // =========================================================

    const cleanUsername = username.trim().toLowerCase();

    const user = await User.findOne({
      username: cleanUsername,
      role: "MANAGER",
      active: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid manager username or password",
      });
    }

    // =========================================================
    // CHECK PASSWORD
    // =========================================================

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid manager username or password",
      });
    }

    // =========================================================
    // CHECK EMPLOYEE ID
    // =========================================================

    if (!user.employeeId) {
      return res.status(500).json({
        success: false,
        message: "Manager employee ID is missing in database",
      });
    }

    // =========================================================
    // CREATE JWT
    // =========================================================

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        employeeId: user.employeeId,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // =========================================================
    // SEND LOGIN RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,
      message: "Manager login successful",

      token,

      manager: {
        id: user._id.toString(),
        employeeId: user.employeeId,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Manager login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during manager login",
    });
  }
}
