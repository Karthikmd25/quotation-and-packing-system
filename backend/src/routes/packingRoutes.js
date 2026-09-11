import express from "express";

import { protectPacking } from "../middleware/authMiddleware.js";

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

/* =========================================================
   Protect all packing routes
========================================================= */

router.use(protectPacking);
/* =========================================================
   CREATE PACKING ORDER
   POST /api/packing
========================================================= */

router.post("/", createPackingOrder);

/* =========================================================
   GET ALL PACKING ORDERS
   GET /api/packing
========================================================= */

router.get("/", getPackingOrders);

/* =========================================================
   GET SINGLE PACKING ORDER
   GET /api/packing/:id
========================================================= */

router.get("/:id", getPackingOrderById);

/* =========================================================
   UPDATE PACKING WORKFLOW
   PUT /api/packing/:id/workflow

   Used for:
   - Picking
   - Checking
   - Packing
========================================================= */

router.put(
  "/:id/workflow",
  updatePackingWorkflow
);

/* =========================================================
   MARK DISPATCH LABEL PRINTED
   PATCH /api/packing/:id/dispatch-label
========================================================= */

router.patch(
  "/:id/dispatch-label",
  markDispatchLabelPrinted
);

/* =========================================================
   MARK BAG DISPATCHED
   PATCH /api/packing/:id/dispatch

   The bag can be dispatched before the transport
   slip is uploaded.
========================================================= */

router.patch(
  "/:id/dispatch",
  markBagDispatched
);

/* =========================================================
   SAVE TRANSPORT SLIP
   POST /api/packing/:id/transport-slip

   Transport slip can be uploaded later.
========================================================= */

router.post(
  "/:id/transport-slip",
  saveTransportSlip
);

/* =========================================================
   MARK DELIVERED
   PATCH /api/packing/:id/delivered
========================================================= */

router.patch(
  "/:id/delivered",
  markDelivered
);

export default router;