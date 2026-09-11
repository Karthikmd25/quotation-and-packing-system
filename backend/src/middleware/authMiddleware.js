import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =========================================================
// MANAGER PROTECTION
// =========================================================

export async function protectManager(req, res, next) {
  try {
    // =======================================================
    // GET AUTHORIZATION HEADER
    // =======================================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // =======================================================
    // GET TOKEN
    // =======================================================

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // =======================================================
    // VERIFY JWT
    // =======================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =======================================================
    // VALIDATE TOKEN
    // =======================================================

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid manager authentication data",
      });
    }

    if (!decoded.employeeId) {
      return res.status(401).json({
        success: false,
        message:
          "Manager employee ID not found in authentication",
      });
    }

    if (decoded.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        message: "Manager access required",
      });
    }

    // =======================================================
    // FIND ACTIVE MANAGER
    // =======================================================

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

    // =======================================================
    // ATTACH MANAGER TO REQUEST
    // =======================================================

    req.manager = manager;
    req.managerId = manager.employeeId;
    req.managerName = manager.name;
    req.managerMongoId = manager._id.toString();

    // =======================================================
    // CONTINUE
    // =======================================================

    next();
  } catch (error) {
    console.error(
      "Manager authentication error:",
      error
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

// =========================================================
// PACKING PROTECTION
// =========================================================

export async function protectPacking(req, res, next) {
  try {
    // =======================================================
    // GET AUTHORIZATION HEADER
    // =======================================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Packing authentication required",
      });
    }

    // =======================================================
    // GET TOKEN
    // =======================================================

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Packing authentication token missing",
      });
    }

    // =======================================================
    // VERIFY JWT
    // =======================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =======================================================
    // VALIDATE TOKEN DATA
    // =======================================================

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid packing authentication data",
      });
    }

    if (!decoded.employeeId) {
      return res.status(401).json({
        success: false,
        message:
          "Packing employee ID not found in authentication",
      });
    }

    if (decoded.role !== "PACKING") {
      return res.status(403).json({
        success: false,
        message: "Packing access required",
      });
    }

    // =======================================================
    // FIND ACTIVE PACKING USER
    // =======================================================

    const packingUser = await User.findOne({
      _id: decoded.userId,
      employeeId: decoded.employeeId,
      role: "PACKING",
      active: true,
    }).select("-password");

    if (!packingUser) {
      return res.status(401).json({
        success: false,
        message:
          "Packing account not found or inactive",
      });
    }

    // =======================================================
    // ATTACH PACKING USER TO REQUEST
    // =======================================================

    req.packingUser = packingUser;
    req.packingEmployeeId = packingUser.employeeId;
    req.packingUserName = packingUser.name;
    req.packingUserMongoId =
      packingUser._id.toString();

    // =======================================================
    // CONTINUE
    // =======================================================

    next();
  } catch (error) {
    console.error(
      "Packing authentication error:",
      error
    );

    // =======================================================
    // TOKEN EXPIRED
    // =======================================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Packing session expired. Please login again.",
      });
    }

    // =======================================================
    // INVALID TOKEN
    // =======================================================

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid packing authentication token",
      });
    }

    // =======================================================
    // OTHER ERROR
    // =======================================================

    return res.status(500).json({
      success: false,
      message: "Packing authentication failed",
    });
  }
}