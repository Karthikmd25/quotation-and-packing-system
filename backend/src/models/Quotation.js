import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    partNumber: {
      type: String,
      required: true,
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: String,
      default: "",
      trim: true,
    },

    colour: {
      type: String,
      default: "",
      trim: true,
    },

    unit: {
      type: String,
      default: "Piece",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const quotationSchema = new mongoose.Schema(
  {
    // =======================================================
    // QUOTATION
    // =======================================================

    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // =======================================================
    // CUSTOMER
    // =======================================================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    customerAddress: {
      type: String,
      default: "",
      trim: true,
    },

    customerCity: {
      type: String,
      default: "",
      trim: true,
    },

    customerState: {
      type: String,
      default: "",
      trim: true,
    },

    customerPincode: {
      type: String,
      default: "",
      trim: true,
    },

    // =======================================================
    // ITEMS
    // =======================================================

    items: {
      type: [quotationItemSchema],

      required: true,

      validate: {
        validator: function (items) {
          return items.length > 0;
        },

        message:
          "Quotation must contain at least one item",
      },
    },

    // =======================================================
    // AMOUNTS
    // =======================================================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    packingAndForwarding: {
      type: Number,
      default: 0,
      min: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // =======================================================
    // PAYMENT
    // =======================================================

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    // =======================================================
    // TRANSPORT
    // =======================================================

    // Actual company/service selected by manager.
    // Example: VRL, DTDC, Porter, India Post
    transportName: {
      type: String,
      default: "",
      trim: true,
    },

    // Automatically determined type.
    // Example: Transport, Courier, Porter, Post
    transportMethod: {
      type: String,
      default: "",
      trim: true,
    },

    // =======================================================
    // STATUS
    // =======================================================

    status: {
      type: String,

      enum: [
        "DRAFT",
        "SENT",
        "CUSTOMER_CONFIRMED",
        "APPROVED",
        "PACKING_CREATED",
        "DISPATCHED",
        "CANCELLED",
      ],

      default: "DRAFT",
    },

    // =======================================================
    // CUSTOMER RESPONSE
    // =======================================================

    customerResponse: {
      type: String,

      enum: [
        "PENDING",
        "CONFIRMED",
        "CHANGES_REQUESTED",
        "REJECTED",
      ],

      default: "PENDING",
    },

    customerResponseNote: {
      type: String,
      default: "",
      trim: true,
    },

    customerRespondedAt: {
      type: Date,
      default: null,
    },

    customerResponseMethod: {
      type: String,

      enum: [
        "WEB",
        "WHATSAPP",
        "MANAGER",
      ],

      default: null,
    },

    customerConfirmedAt: {
      type: Date,
      default: null,
    },

    // =======================================================
    // APPROVAL
    // =======================================================

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: String,
      default: "",
      trim: true,
    },

    // =======================================================
    // PACKING
    // =======================================================

    packingOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackingOrder",
      default: null,
    },

    packingNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // =======================================================
    // REMARKS
    // =======================================================

    quotationRemarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Quotation =
  mongoose.models.Quotation ||
  mongoose.model(
    "Quotation",
    quotationSchema
  );

export default Quotation;