import express from "express";
import mongoose from "mongoose";

import PackingHistory from "../models/PackingHistory.js";
import { protectManager } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   MANAGER AUTHENTICATION
   ========================================================= */

router.use(protectManager);

/* =========================================================
   HELPER
   ========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =========================================================
   GET TRACKING BY QUOTATION ID
   GET /api/tracking/quotation/:id
   ========================================================= */

router.get("/quotation/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const history = await PackingHistory.find({
      quotation: id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error(
      "Get quotation tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation tracking",
      error: error.message,
    });
  }
});

/* =========================================================
   GET TRACKING BY PACKING ORDER ID
   GET /api/tracking/packing/:id
   ========================================================= */

router.get("/packing/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid packing order ID",
      });
    }

    const history = await PackingHistory.find({
      packingOrder: id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error(
      "Get packing tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch packing tracking",
      error: error.message,
    });
  }
});

/* =========================================================
   SEARCH COMPLETE TRACKING

   GET /api/tracking/search?q=...

   Searches:
   - Quotation Number
   - Packing Number
   - Customer Name
   - Customer Phone
   ========================================================= */

router.get("/search", async (req, res) => {
  try {
    const search = String(
      req.query.q || ""
    ).trim();

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search value is required",
      });
    }

    const regex = new RegExp(
      search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      ),
      "i"
    );

    const history = await PackingHistory.find({
      $or: [
        {
          quotationNumber: regex,
        },
        {
          packingNumber: regex,
        },
        {
          customerName: regex,
        },
        {
          customerPhone: regex,
        },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error(
      "Tracking search error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to search tracking",
      error: error.message,
    });
  }
});

/* =========================================================
   GET COMPLETE TRACKING

   GET /api/tracking/:quotationNumber

   Example:
   /api/tracking/QTN-2026-00001
   ========================================================= */

router.get("/:quotationNumber", async (req, res) => {
  try {
    const { quotationNumber } =
      req.params;

    const history =
      await PackingHistory.find({
        quotationNumber,
      })
        .sort({ createdAt: 1 })
        .lean();

    if (history.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No tracking history found for this quotation",
      });
    }

    return res.status(200).json({
      success: true,
      quotationNumber,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error(
      "Get complete tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch complete tracking",
      error: error.message,
    });
  }
});

/* =========================================================
   EXPORT
   ========================================================= */

export default router;