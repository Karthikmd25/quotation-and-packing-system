import express from "express";
import { managerLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/manager/login", managerLogin);

export default router;