import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import packingRoutes from "./routes/packingRoutes.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js"; 
import "./models/Customer.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ================================
// Middleware
// ================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================================
// Routes
// ================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KICKMAC Manager & Packing API is running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API working",
  });
});

// Packing
app.use("/api/packing", packingRoutes);

// Quotations
app.use("/api/quotations", quotationRoutes);

// Products
app.use("/api/products", productRoutes);

// Customers
app.use("/api/customers", customerRoutes);

// Authentication
app.use("/api/auth", authRoutes);

app.use("/api/tracking", trackingRoutes);
// ================================
// Start Server
// ================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Server could not start because MongoDB connection failed."
    );

    process.exit(1);
  }
};

startServer();