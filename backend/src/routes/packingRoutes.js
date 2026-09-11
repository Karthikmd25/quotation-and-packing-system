import express from "express";

import {
  protectManager,
  protectPacking,
} from "../middleware/authMiddleware.js";

import {
  createPackingOrder,
  getPackingOrders,
  getPackingOrderById,
  updatePackingWorkflow,
  markDispatchLabelPrinted,
  markBagDispatched,
  saveTransportSlip,
  markDelivered,
} from "../controllers/packingController.js";

const router = express.Router();

// =========================================================
// CREATE PACKING ORDER
// POST /api/packing
//
// Manager creates the packing order after quotation approval.
// =========================================================

router.post(
  "/",
  protectManager,
  createPackingOrder
);

// =========================================================
// GET ALL PACKING ORDERS
// GET /api/packing
//
// Packing department sees available packing orders.
// =========================================================

router.get(
  "/",
  protectPacking,
  getPackingOrders
);

// =========================================================
// GET SINGLE PACKING ORDER
// GET /api/packing/:id
//
// Packing department works on the order.
// =========================================================

router.get(
  "/:id",
  protectPacking,
  getPackingOrderById
);

// =========================================================
// UPDATE PACKING WORKFLOW
// PUT /api/packing/:id/workflow
//
// Used for:
// - Picking
// - Checking
// - Packing
// =========================================================

router.put(
  "/:id/workflow",
  protectPacking,
  updatePackingWorkflow
);

// =========================================================
// MARK DISPATCH LABEL PRINTED
// PATCH /api/packing/:id/dispatch-label
// =========================================================

router.patch(
  "/:id/dispatch-label",
  protectPacking,
  markDispatchLabelPrinted
);

// =========================================================
// MARK BAG DISPATCHED
// PATCH /api/packing/:id/dispatch
// =========================================================

router.patch(
  "/:id/dispatch",
  protectPacking,
  markBagDispatched
);

// =========================================================
// SAVE TRANSPORT SLIP
// POST /api/packing/:id/transport-slip
// =========================================================

router.post(
  "/:id/transport-slip",
  protectPacking,
  saveTransportSlip
);

// =========================================================
// MARK DELIVERED
// PATCH /api/packing/:id/delivered
// =========================================================

router.patch(
  "/:id/delivered",
  protectPacking,
  markDelivered
);

export default router;