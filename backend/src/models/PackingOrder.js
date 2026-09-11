import mongoose from "mongoose";

/* =========================================================
   PACKING ITEM SCHEMA
   ========================================================= */

const packingItemSchema = new mongoose.Schema(
  {
    /* -------------------------------------------------------
       Product reference
       ------------------------------------------------------- */
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    /* -------------------------------------------------------
       Product information copied from quotation
       ------------------------------------------------------- */
    partNumber: {
      type: String,
      default: "",
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

    /* -------------------------------------------------------
       REQUIRED QUANTITY
       Quantity from confirmed/approved quotation
       ------------------------------------------------------- */
    requiredQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    /* -------------------------------------------------------
       PICKED QUANTITY
       Actual physical quantity picked
       ------------------------------------------------------- */
    pickedQuantity: {
      type: Number,
      default: null,
      min: 0,
    },

    /* -------------------------------------------------------
       CHECKED QUANTITY
       Actual physical quantity checked
       ------------------------------------------------------- */
    checkedQuantity: {
      type: Number,
      default: null,
      min: 0,
    },

    /* -------------------------------------------------------
       PACKED QUANTITY
       Actual physical quantity packed
       ------------------------------------------------------- */
    packedQuantity: {
      type: Number,
      default: null,
      min: 0,
    },

    /* -------------------------------------------------------
       ITEM-SPECIFIC NOTES
       ------------------------------------------------------- */
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

/* =========================================================
   PACKING ORDER SCHEMA
   ========================================================= */

const packingOrderSchema = new mongoose.Schema(
  {
    /* =======================================================
       PACKING IDENTIFICATION
       ======================================================= */

    packingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
    },

    /*
      Snapshot of quotation number.

      This is useful for:
      - Packing dashboard
      - Packing history
      - Search
      - Dispatch records
    */
    quotationNumber: {
      type: String,
      default: "",
      trim: true,
    },

    /* =======================================================
       CUSTOMER
       ======================================================= */

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

    /* -------------------------------------------------------
       Customer delivery address

       Initially copied from quotation.
       Packing staff can edit if required.
       ------------------------------------------------------- */
    customerAddress: {
      type: String,
      default: "",
      trim: true,
    },

    /* =======================================================
       ITEMS TO PACK
       ======================================================= */

    items: {
      type: [packingItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },

        message: "Packing order must contain at least one item.",
      },
    },

    /* =======================================================
       PACKAGE INFORMATION
       ======================================================= */

    numberOfPackages: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    packageType: {
      type: String,
      default: "Bags",
      trim: true,
    },

    /* =======================================================
       TRANSPORT INFORMATION
       ======================================================= */

    /*
      Examples:

      Transport
      Courier
      Porter
      Post
      Customer Transport
      Other

      Transport is OPTIONAL.
    */
    transportMethod: {
      type: String,
      default: "",
      trim: true,
    },

    /* -------------------------------------------------------
       Custom transport method

       Used when transportMethod = Other
       ------------------------------------------------------- */
    customTransportMethod: {
      type: String,
      default: "",
      trim: true,
    },

    /* -------------------------------------------------------
       Transport company / service name

       Examples:

       MSS
       VRL
       Seabird
       Sugama
       KPN
       Porter
       DTDC
       Professional Couriers
       Customer Transport
       Other
       ------------------------------------------------------- */
    transportName: {
      type: String,
      default: "",
      trim: true,
    },

    /* -------------------------------------------------------
       Custom transport name

       Used when transportName = Other
       ------------------------------------------------------- */
    customTransportName: {
      type: String,
      default: "",
      trim: true,
    },

    /* =======================================================
       PACKING WORKFLOW STATUS
       ======================================================= */

    status: {
      type: String,

      enum: [
        "PENDING",
        "PACKING",
        "PACKED",
        "DISPATCHED",
        "DELIVERED",
        "CANCELLED",
      ],

      default: "PENDING",
    },

    /* =======================================================
       WORKFLOW COMPLETION FLAGS
       ======================================================= */

    /*
      Picking:
      Required quantity == Picked quantity
    */
    pickingCompleted: {
      type: Boolean,
      default: false,
    },

    /*
      Checking:
      Required quantity == Checked quantity
    */
    checkingCompleted: {
      type: Boolean,
      default: false,
    },

    /*
      Packing:
      Required quantity == Packed quantity
    */
    packingCompleted: {
      type: Boolean,
      default: false,
    },

    /* =======================================================
       EMPLOYEE IDs

       There is NO employee login.

       Employee IDs are entered manually.

       pickedBy  = Picking employee
       checkedBy = Checking employee
       packedBy  = Packing employee

       These remain independent.
       ======================================================= */

    pickedBy: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    checkedBy: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    packedBy: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    /* =======================================================
       WORKFLOW TIMESTAMPS
       ======================================================= */

    pickedAt: {
      type: Date,
      default: null,
    },

    checkedAt: {
      type: Date,
      default: null,
    },

    packedAt: {
      type: Date,
      default: null,
    },

    /* =======================================================
       DISPATCH INFORMATION
       ======================================================= */

    /*
      Final delivery address.

      Initially copied from quotation/customer address.
      Packing staff can edit it if required.
    */
    dispatchAddress: {
      type: String,
      default: "",
      trim: true,
    },

    /* -------------------------------------------------------
       Dispatch label
       ------------------------------------------------------- */
    dispatchLabelPrinted: {
      type: Boolean,
      default: false,
    },

    dispatchLabelPrintedAt: {
      type: Date,
      default: null,
    },

    /* -------------------------------------------------------
       Dispatch date/time
       ------------------------------------------------------- */
    dispatchedAt: {
      type: Date,
      default: null,
    },

    /* -------------------------------------------------------
       Delivery date/time
       ------------------------------------------------------- */
    deliveryDate: {
      type: Date,
      default: null,
    },

    /* =======================================================
       TRANSPORT SLIP
       ======================================================= */

    /*
      Transport slip is OPTIONAL.

      It can be uploaded:
      - Before dispatch
      - After dispatch

      Dispatch does NOT depend on this field.
    */
    transportSlipPhoto: {
      type: String,
      default: "",
      trim: true,
    },

    transportSlipUploadedAt: {
      type: Date,
      default: null,
    },

    /* =======================================================
       NOTES / INSTRUCTIONS
       ======================================================= */

    instructions: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    /* =======================================================
       MANAGER INFORMATION
       ======================================================= */

    /*
      Manager who created the packing order.
    */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
      Manager who last updated the packing order.
    */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   INDEXES
   ========================================================= */

/*
  IMPORTANT:

  packingNumber already has:

  unique: true

  Therefore DO NOT add:

  packingOrderSchema.index({ packingNumber: 1 });

  Otherwise Mongoose reports:

  Duplicate schema index on {"packingNumber":1}
*/

packingOrderSchema.index({
  quotation: 1,
});

packingOrderSchema.index({
  customer: 1,
});

packingOrderSchema.index({
  status: 1,
});

packingOrderSchema.index({
  createdAt: -1,
});

packingOrderSchema.index({
  customerPhone: 1,
});

/* =========================================================
   MODEL
   ========================================================= */

const PackingOrder =
  mongoose.models.PackingOrder ||
  mongoose.model("PackingOrder", packingOrderSchema);

export default PackingOrder;