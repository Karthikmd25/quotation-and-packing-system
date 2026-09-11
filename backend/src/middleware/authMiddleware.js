import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protectManager(req, res, next) {
  try {
    // =========================================================
    // GET AUTHORIZATION HEADER
    // =========================================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // =========================================================
    // GET TOKEN
    // =========================================================

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // =========================================================
    // VERIFY JWT
    // =========================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =========================================================
    // VALIDATE TOKEN
    // =========================================================

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid manager authentication data",
      });
    }

    if (!decoded.employeeId) {
      return res.status(401).json({
        success: false,
        message: "Manager employee ID not found in authentication",
      });
    }

    if (decoded.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        message: "Manager access required",
      });
    }

    // =========================================================
    // FIND ACTIVE MANAGER
    // =========================================================

    const manager = await User.findOne({
      _id: decoded.userId,
      employeeId: decoded.employeeId,
      role: "MANAGER",
      active: true,
    }).select("-password");

    if (!manager) {
      return res.status(401).json({
        success: false,
        message: "Manager account not found or inactive",
      });
    }

    // =========================================================
    // ATTACH MANAGER TO REQUEST
    // =========================================================

    req.manager = manager;

    // Manager employee ID
    req.managerId = manager.employeeId;

    // Manager name
    req.managerName = manager.name;

    // Manager MongoDB ID
    req.managerMongoId = manager._id.toString();

    // =========================================================
    // CONTINUE
    // =========================================================

    next();
  } catch (error) {
    console.error("Manager authentication error:", error);

    // =========================================================
    // TOKEN EXPIRED
    // =========================================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // =========================================================
    // INVALID TOKEN
    // =========================================================

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // =========================================================
    // OTHER ERROR
    // =========================================================

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

