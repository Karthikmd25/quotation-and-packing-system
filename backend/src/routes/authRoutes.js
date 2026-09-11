import express from "express";

import {
  managerLogin,
  packingLogin,
} from "../controllers/authController.js";

const router = express.Router();

// =========================================================
// MANAGER LOGIN
// POST /api/auth/manager/login
// =========================================================

router.post(
  "/manager/login",
  managerLogin
);

// =========================================================
// PACKING LOGIN
// POST /api/auth/packing/login
// =========================================================

router.post(
  "/packing/login",
  packingLogin
);

export default router;