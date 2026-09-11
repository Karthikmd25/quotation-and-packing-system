import mongoose from "mongoose";

const packingHistorySchema = new mongoose.Schema(
  {
    /* =====================================================
       PACKING ORDER
       Not available during early quotation stages
       ===================================================== */

    packingOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackingOrder",
      default: null,
      index: true,
    },

    /* =====================================================
       QUOTATION
       ===================================================== */

    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
      index: true,
    },

    /* =====================================================
       CUSTOMER INFORMATION
       ===================================================== */

    customerName: {
      type: String,
      default: "",
      trim: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       QUOTATION / PACKING NUMBERS
       ===================================================== */

    quotationNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    packingNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    /* =====================================================
       TRACKING ACTION
       ===================================================== */

    action: {
      type: String,
      required: true,

      enum: [
        /* =========================
           QUOTATION TRACKING
           ========================= */

        "QUOTATION_CREATED",
        "QUOTATION_UPDATED",
        "QUOTATION_SENT",

        "CUSTOMER_CONFIRMED",
        "CUSTOMER_CHANGES_REQUESTED",
        "CUSTOMER_REJECTED",

        "MANAGER_APPROVED",
        "QUOTATION_CANCELLED",

        /* =========================
           PACKING TRACKING
           ========================= */

        "PACKING_ORDER_CREATED",

        "PICKING_STARTED",
        "PICKING_COMPLETED",

        "CHECKING_STARTED",
        "CHECKING_COMPLETED",

        "PACKING_STARTED",
        "PACKING_COMPLETED",

        "DISPATCH_LABEL_PRINTED",

        "TRANSPORT_SLIP_SAVED",

        "DISPATCHED",

        "DELIVERED",

        "CANCELLED",
      ],

      index: true,
    },

    /* =====================================================
       PACKING EMPLOYEE
       ===================================================== */

    employeeId: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    /* =====================================================
       MANAGER INFORMATION
       ===================================================== */

    managerId: {
      type: String,
      default: "",
      trim: true,
    },

    managerName: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       QUANTITY TRACKING
       ===================================================== */

    requiredQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    actualQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       QUANTITY RESULT
       ===================================================== */

    result: {
      type: String,
      enum: [
        "MATCH",
        "MISMATCH",
        "PENDING",
        "",
      ],
      default: "",
    },

    /* =====================================================
       TRACKING NOTE
       ===================================================== */

    note: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       EXTRA EVENT INFORMATION
       ===================================================== */

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },

  {
    timestamps: true,
  }
);

/* =========================================================
   MODEL
   ========================================================= */

const PackingHistory =
  mongoose.models.PackingHistory ||
  mongoose.model(
    "PackingHistory",
    packingHistorySchema
  );

export default PackingHistory;