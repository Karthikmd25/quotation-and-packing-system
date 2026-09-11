import express from "express";
import mongoose from "mongoose";

import Quotation from "../models/Quotation.js";
import PackingOrder from "../models/PackingOrder.js";
import PackingHistory from "../models/PackingHistory.js";

import { generateQuotationPDF } from "../services/quotationPdf.js";
import { protectManager } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   MANAGER AUTHENTICATION
   ========================================================= */

router.use(protectManager);

/* =========================================================
   HELPERS
   ========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =========================================================
   CREATE QUOTATION HISTORY
   ========================================================= */

const createQuotationHistory = async ({
  quotation,
  action,
  managerId = "",
  managerName = "",
  employeeId = "",
  note = "",
  details = {},
}) => {
  try {
    if (!quotation?._id) {
      console.error("Quotation history skipped: quotation ID missing");
      return;
    }

    await PackingHistory.create({
      packingOrder: quotation.packingOrder || null,
      quotation: quotation._id,

      customerName: quotation.customerName || "",
      customerPhone: quotation.customerPhone || "",

      quotationNumber: quotation.quotationNumber || "",
      packingNumber: quotation.packingNumber || "",

      action,

      employeeId: employeeId || "",
      managerId: managerId || "",
      managerName: managerName || "",

      note: note || "",
      details: details || {},
    });

    console.log(
      `Tracking history created: ${action} - ${quotation.quotationNumber}`
    );
  } catch (error) {
    /*
      Tracking failure must NOT break quotation operation.
    */
    console.error(
      `Quotation history error (${action}):`,
      error.message
    );
  }
};

/* =========================================================
   GENERATE QUOTATION NUMBER
   Example:
   QTN-2026-00001
   ========================================================= */

const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();

  const lastQuotation = await Quotation.findOne({
    quotationNumber: new RegExp(`^QTN-${year}-`),
  })
    .sort({ createdAt: -1 })
    .select("quotationNumber")
    .lean();

  let nextNumber = 1;

  if (lastQuotation?.quotationNumber) {
    const parts = lastQuotation.quotationNumber.split("-");
    const lastNumber = Number(parts[2]);

    if (Number.isFinite(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `QTN-${year}-${String(nextNumber).padStart(5, "0")}`;
};

/* =========================================================
   GENERATE PACKING NUMBER
   Example:
   PK-2026-00001
   ========================================================= */

const generatePackingNumber = async () => {
  const year = new Date().getFullYear();

  const lastPackingOrder = await PackingOrder.findOne({
    packingNumber: new RegExp(`^PK-${year}-`),
  })
    .sort({ createdAt: -1 })
    .select("packingNumber")
    .lean();

  let nextNumber = 1;

  if (lastPackingOrder?.packingNumber) {
    const parts = lastPackingOrder.packingNumber.split("-");
    const lastNumber = Number(parts[2]);

    if (Number.isFinite(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `PK-${year}-${String(nextNumber).padStart(5, "0")}`;
};

/* =========================================================
   GET ALL QUOTATIONS
   GET /api/quotations
   ========================================================= */

router.get("/", async (req, res) => {
  try {
    console.log(
      `GET /api/quotations - Manager: ${req.managerId}`
    );

    const quotations = await Quotation.find({})
      .populate({
        path: "customer",
        select: "name phone email address",
      })
      .populate({
        path: "packingOrder",
        select:
          "packingNumber status numberOfPackages packageType",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(
      `Quotations loaded successfully: ${quotations.length}`
    );

    return res.status(200).json({
      success: true,
      count: quotations.length,
      quotations,
    });
  } catch (error) {
    console.error("Get quotations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotations",
      error: error.message,
    });
  }
});

/* =========================================================
   GET QUOTATION PDF
   GET /api/quotations/:id/pdf

   IMPORTANT:
   This route must come before /:id
   ========================================================= */

router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Generate quotation PDF:", id);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const quotation = await Quotation.findById(id)
      .populate("customer")
      .populate("packingOrder");

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    const pdf = await generateQuotationPDF(quotation);

    return res.download(
      pdf.filePath,
      pdf.fileName,
      (error) => {
        if (error) {
          console.error(
            "Quotation PDF download error:",
            error
          );

          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message:
                "Failed to download quotation PDF",
              error: error.message,
            });
          }
        }
      }
    );
  } catch (error) {
    console.error(
      "Generate quotation PDF error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to generate quotation PDF",
      error: error.message,
    });
  }
});

/* =========================================================
   GET SINGLE QUOTATION
   GET /api/quotations/:id
   ========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const quotation = await Quotation.findById(id)
      .populate("customer")
      .populate("packingOrder")
      .lean();

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      quotation,
    });
  } catch (error) {
    console.error("Get quotation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation",
      error: error.message,
    });
  }
});

/* =========================================================
   CREATE QUOTATION
   POST /api/quotations
   ========================================================= */

router.post("/", async (req, res) => {
  try {
    const {
      customer,
      customerName,
      customerPhone,
      customerEmail,
      items,
      discount = 0,
      packingAndForwarding = 0,
      paymentMethod = "",
      transportMethod = "",
      quotationRemarks = "",
    } = req.body;

    const managerId = req.managerId;
    const managerName = req.managerName || "";

    console.log(
      `Create quotation request from manager: ${managerId}`
    );

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message:
          "Manager employee ID not found in authentication",
      });
    }

    /* ---------------- CUSTOMER VALIDATION ---------------- */

    if (
      !customerName ||
      typeof customerName !== "string" ||
      !customerName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    /* ---------------- ITEMS VALIDATION ---------------- */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one quotation item is required",
      });
    }

    /* ---------------- CUSTOMER ID ---------------- */

    if (customer && !isValidObjectId(customer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    /* ---------------- PREPARE ITEMS ---------------- */

    const quotationItems = items.map((item, index) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (!item.product) {
        throw new Error(
          `Product is required for quotation item ${
            index + 1
          }`
        );
      }

      if (!isValidObjectId(item.product)) {
        throw new Error(
          `Invalid product ID for quotation item ${
            index + 1
          }`
        );
      }

      if (
        !item.partNumber ||
        !String(item.partNumber).trim()
      ) {
        throw new Error(
          `Part number is required for quotation item ${
            index + 1
          }`
        );
      }

      if (
        !item.productName ||
        !String(item.productName).trim()
      ) {
        throw new Error(
          `Product name is required for quotation item ${
            index + 1
          }`
        );
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          `Invalid quantity for quotation item ${
            index + 1
          }`
        );
      }

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        throw new Error(
          `Invalid unit price for quotation item ${
            index + 1
          }`
        );
      }

      return {
        product: item.product,

        partNumber: String(
          item.partNumber
        ).trim(),

        productName: String(
          item.productName
        ).trim(),

        size: item.size
          ? String(item.size).trim()
          : "",

        colour: item.colour
          ? String(item.colour).trim()
          : item.variant
          ? String(item.variant).trim()
          : "",

        unit: item.unit
          ? String(item.unit).trim()
          : "Piece",

        quantity,

        unitPrice,

        total: quantity * unitPrice,
      };
    });

    /* ---------------- TOTALS ---------------- */

    const subtotal = quotationItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const discountAmount = Number(discount) || 0;

    const packingAmount =
      Number(packingAndForwarding) || 0;

    if (discountAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be negative",
      });
    }

    if (packingAmount < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Packing & Forwarding cannot be negative",
      });
    }

    const grandTotal = Math.max(
      0,
      subtotal - discountAmount + packingAmount
    );

    /* ---------------- QUOTATION NUMBER ---------------- */

    const quotationNumber =
      await generateQuotationNumber();

    /* ---------------- CREATE QUOTATION ---------------- */

    const quotation = await Quotation.create({
      quotationNumber,

      customer: customer || null,

      customerName:
        customerName.trim(),

      customerPhone: customerPhone
        ? String(customerPhone).trim()
        : "",

      customerEmail: customerEmail
        ? String(customerEmail)
            .trim()
            .toLowerCase()
        : "",

      items: quotationItems,

      subtotal,

      discount: discountAmount,

      packingAndForwarding:
        packingAmount,

      grandTotal,

      paymentMethod:
        paymentMethod || "",

      transportMethod:
        transportMethod || "",

      quotationRemarks:
        quotationRemarks || "",

      status: "DRAFT",

      customerResponse: "PENDING",
    });

    /* =====================================================
       TRACK QUOTATION CREATED
       ===================================================== */

    await createQuotationHistory({
      quotation,

      action: "QUOTATION_CREATED",

      managerId,

      managerName,

      note: "Quotation created",

      details: {
        subtotal,
        discount: discountAmount,
        packingAndForwarding:
          packingAmount,
        grandTotal,
        itemCount:
          quotationItems.length,
      },
    });

    console.log(
      `Quotation ${quotationNumber} created by manager ${managerId}`
    );

    return res.status(201).json({
      success: true,

      message:
        "Quotation created successfully",

      quotation,

      createdByManager: {
        employeeId: managerId,
        name: managerName,
      },
    });
  } catch (error) {
    console.error(
      "Create quotation error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create quotation",
    });
  }
});

/* =========================================================
   UPDATE QUOTATION
   PUT /api/quotations/:id
   ========================================================= */

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const {
      customer,
      customerName,
      customerPhone,
      customerEmail,
      items,
      discount = 0,
      packingAndForwarding = 0,
      paymentMethod = "",
      transportMethod = "",
      quotationRemarks = "",
    } = req.body;

    if (
      !customerName ||
      typeof customerName !== "string" ||
      !customerName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one quotation item is required",
      });
    }

    if (customer && !isValidObjectId(customer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const quotation =
      await Quotation.findById(id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    /* Only drafts can be edited */

    if (quotation.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          `Quotation cannot be edited because its status is ${quotation.status}`,
      });
    }

    let subtotal = 0;

    const updatedItems = items.map(
      (item, index) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (!item.product) {
          throw new Error(
            `Product is required for quotation item ${
              index + 1
            }`
          );
        }

        if (!isValidObjectId(item.product)) {
          throw new Error(
            `Invalid product ID for quotation item ${
              index + 1
            }`
          );
        }

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          throw new Error(
            `Invalid quantity for quotation item ${
              index + 1
            }`
          );
        }

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {
          throw new Error(
            `Invalid unit price for quotation item ${
              index + 1
            }`
          );
        }

        if (
          !item.partNumber ||
          !String(item.partNumber).trim()
        ) {
          throw new Error(
            `Part number is required for quotation item ${
              index + 1
            }`
          );
        }

        if (
          !item.productName ||
          !String(item.productName).trim()
        ) {
          throw new Error(
            `Product name is required for quotation item ${
              index + 1
            }`
          );
        }

        const total =
          quantity * unitPrice;

        subtotal += total;

        return {
          product: item.product,

          partNumber:
            String(item.partNumber).trim(),

          productName:
            String(item.productName).trim(),

          size: item.size
            ? String(item.size).trim()
            : "",

          colour: item.colour
            ? String(item.colour).trim()
            : "",

          unit: item.unit
            ? String(item.unit).trim()
            : "Piece",

          quantity,

          unitPrice,

          total,
        };
      }
    );

    const discountAmount =
      Number(discount) || 0;

    const packingAmount =
      Number(packingAndForwarding) || 0;

    if (discountAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be negative",
      });
    }

    if (packingAmount < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Packing & Forwarding cannot be negative",
      });
    }

    const grandTotal = Math.max(
      0,
      subtotal -
        discountAmount +
        packingAmount
    );

    quotation.customer =
      customer || null;

    quotation.customerName =
      customerName.trim();

    quotation.customerPhone =
      customerPhone
        ? String(customerPhone).trim()
        : "";

    quotation.customerEmail =
      customerEmail
        ? String(customerEmail)
            .trim()
            .toLowerCase()
        : "";

    quotation.items =
      updatedItems;

    quotation.subtotal =
      subtotal;

    quotation.discount =
      discountAmount;

    quotation.packingAndForwarding =
      packingAmount;

    quotation.grandTotal =
      grandTotal;

    quotation.paymentMethod =
      paymentMethod || "";

    quotation.transportMethod =
      transportMethod || "";

    quotation.quotationRemarks =
      quotationRemarks || "";

    await quotation.save();

    /* =====================================================
       TRACK QUOTATION UPDATE

       NOTE:
       Your PackingHistory model must contain
       QUOTATION_UPDATED in its action enum.
       ===================================================== */

    await createQuotationHistory({
      quotation,

      action: "QUOTATION_UPDATED",

      managerId: req.managerId,

      managerName: req.managerName,

      note: "Quotation draft updated",

      details: {
        updated: true,
        subtotal,
        discount: discountAmount,
        packingAndForwarding:
          packingAmount,
        grandTotal,
        itemCount:
          updatedItems.length,
      },
    });

    const updatedQuotation =
      await Quotation.findById(id)
        .populate("customer")
        .populate("packingOrder");

    return res.status(200).json({
      success: true,

      message:
        "Quotation updated successfully",

      quotation:
        updatedQuotation,
    });
  } catch (error) {
    console.error(
      "Update quotation error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to update quotation",
    });
  }
});

/* =========================================================
   SEND QUOTATION
   POST /api/quotations/:id/send
   ========================================================= */

router.post("/:id/send", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const quotation =
      await Quotation.findById(id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (
      quotation.status !== "DRAFT" &&
      quotation.status !== "SENT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only DRAFT or SENT quotations can be sent",
      });
    }

    const wasAlreadySent =
      quotation.status === "SENT";

    quotation.status = "SENT";

    await quotation.save();

    /* Only create history the first time */

    if (!wasAlreadySent) {
      await createQuotationHistory({
        quotation,

        action: "QUOTATION_SENT",

        managerId: req.managerId,

        managerName:
          req.managerName,

        note:
          "Quotation sent to customer",

        details: {
          sentAt: new Date(),
        },
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Quotation marked as SENT",

      quotation,
    });
  } catch (error) {
    console.error(
      "Send quotation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to send quotation",
      error: error.message,
    });
  }
});

/* =========================================================
   CUSTOMER RESPONSE
   POST /api/quotations/:id/customer-response
   ========================================================= */

router.post(
  "/:id/customer-response",
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        response,
        note = "",
        method,
      } = req.body;

      const allowedResponses = [
        "CONFIRMED",
        "CHANGES_REQUESTED",
        "REJECTED",
      ];

      const allowedMethods = [
        "WEB",
        "WHATSAPP",
        "MANAGER",
      ];

      /* ---------------- VALIDATE RESPONSE ---------------- */

      if (!allowedResponses.includes(response)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer response",
        });
      }

      /* ---------------- VALIDATE METHOD ---------------- */

      if (!allowedMethods.includes(method)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer response method",
        });
      }

      /* ---------------- VALIDATE ID ---------------- */

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quotation ID",
        });
      }

      /* ---------------- FIND QUOTATION ---------------- */

      const quotation =
        await Quotation.findById(id);

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      /* ---------------- SAVE RESPONSE ---------------- */

      quotation.customerResponse =
        response;

      quotation.customerResponseNote =
        note || "";

      quotation.customerRespondedAt =
        new Date();

      quotation.customerResponseMethod =
        method;

      /* ---------------- CONFIRMED ---------------- */

      if (response === "CONFIRMED") {
        quotation.status =
          "CUSTOMER_CONFIRMED";

        quotation.customerConfirmedAt =
          new Date();
      }

      /* ---------------- REJECTED ---------------- */

      if (response === "REJECTED") {
        quotation.status =
          "CANCELLED";
      }

      await quotation.save();

      /* =====================================================
         TRACK CUSTOMER RESPONSE
         ===================================================== */

      let historyAction =
        "CUSTOMER_CHANGES_REQUESTED";

      if (response === "CONFIRMED") {
        historyAction =
          "CUSTOMER_CONFIRMED";
      }

      if (response === "REJECTED") {
        historyAction =
          "CUSTOMER_REJECTED";
      }

      await createQuotationHistory({
        quotation,

        action: historyAction,

        managerId:
          req.managerId,

        managerName:
          req.managerName,

        note:
          note ||
          `Customer response: ${response}`,

        details: {
          response,
          method,
          respondedAt:
            quotation.customerRespondedAt,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Customer response saved successfully",

        quotation,
      });
    } catch (error) {
      console.error(
        "Customer response error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save customer response",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   MANAGER APPROVAL + CREATE PACKING ORDER

   POST /api/quotations/:id/approve

   FLOW:

   CUSTOMER_CONFIRMED
          ↓
   MANAGER APPROVES
          ↓
   PACKING ORDER CREATED
          ↓
   PACKING DEPARTMENT
   ========================================================= */

router.post("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const managerId =
      req.managerId;

    const managerName =
      req.managerName || "";

    console.log(
      `Quotation approval request from manager: ${managerId}`
    );

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message:
          "Manager employee ID not found in authentication",
      });
    }

    /* ---------------- VALIDATE ID ---------------- */

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    /* ---------------- FIND QUOTATION ---------------- */

    const quotation =
      await Quotation.findById(id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    /* ---------------- CUSTOMER MUST CONFIRM ---------------- */

    if (
      quotation.status !==
      "CUSTOMER_CONFIRMED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer must confirm the quotation before manager approval",
      });
    }

    /* ---------------- PREVENT DUPLICATE PACKING ---------------- */

    if (quotation.packingOrder) {
      return res.status(400).json({
        success: false,
        message:
          "Packing order already exists for this quotation",

        packingOrder:
          quotation.packingOrder,
      });
    }

    /* ---------------- GENERATE PACKING NUMBER ---------------- */

    const packingNumber =
      await generatePackingNumber();

    /* ---------------- CREATE PACKING ITEMS ---------------- */

    const packingItems =
      quotation.items.map((item) => ({
        productId:
          item.product,

        partNumber:
          item.partNumber,

        productName:
          item.productName,

        size:
          item.size || "",

        colour:
          item.colour || "",

        unit:
          item.unit || "Piece",

        requiredQuantity:
          item.quantity,

        pickedQuantity: 0,

        checkedQuantity: 0,

        packedQuantity: 0,

        notes: "",
      }));

    /* ---------------- CREATE PACKING ORDER ---------------- */

    const packingOrder =
      await PackingOrder.create({
        packingNumber,

        quotation:
          quotation._id,

        customer:
          quotation.customer || null,

        customerName:
          quotation.customerName,

        customerPhone:
          quotation.customerPhone,

        customerEmail:
          quotation.customerEmail,

        items:
          packingItems,

        numberOfPackages: 0,

        packageType: "",

        /*
          Transport method selected in quotation
          automatically carries to packing.
        */

        transportMethod:
          quotation.transportMethod || "",

        customTransportMethod:
          "",

        /*
          Transport name is not stored in
          quotation schema, so leave blank.
        */

        transportName: "",

        customTransportName:
          "",

        status: "PENDING",

        pickingCompleted:
          false,

        checkingCompleted:
          false,

        packingCompleted:
          false,

        dispatchLabelPrinted:
          false,

        notes: "",
      });

    /* ---------------- UPDATE QUOTATION ---------------- */

    quotation.status =
      "PACKING_CREATED";

    quotation.approvedAt =
      new Date();

    quotation.approvedBy =
      managerId;

    quotation.packingOrder =
      packingOrder._id;

    quotation.packingNumber =
      packingNumber;

    await quotation.save();

    /* =====================================================
       TRACK MANAGER APPROVAL
       ===================================================== */

    await createQuotationHistory({
      quotation,

      action: "MANAGER_APPROVED",

      managerId,

      managerName,

      note:
        "Quotation approved by manager",

      details: {
        approvedAt:
          quotation.approvedAt,

        approvedBy:
          managerId,

        approvedByName:
          managerName,
      },
    });

    /* =====================================================
       TRACK PACKING ORDER CREATION
       ===================================================== */

    await createQuotationHistory({
      quotation,

      action:
        "PACKING_ORDER_CREATED",

      managerId,

      managerName,

      note:
        "Packing order created after manager approval",

      details: {
        packingNumber,

        itemCount:
          packingItems.length,
      },
    });

    console.log(
      `Quotation ${quotation.quotationNumber} approved by manager ${managerId}`
    );

    /* ---------------- RETURN POPULATED QUOTATION ---------------- */

    const populatedQuotation =
      await Quotation.findById(
        quotation._id
      )
        .populate("customer")
        .populate("packingOrder");

    return res.status(200).json({
      success: true,

      message:
        "Quotation approved and packing order created successfully",

      quotation:
        populatedQuotation,

      packingOrder,

      approvedByManager: {
        employeeId:
          managerId,

        name:
          managerName,
      },
    });
  } catch (error) {
    console.error(
      "Quotation approval error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to approve quotation and create packing order",

      error: error.message,
    });
  }
});

/* =========================================================
   EXPORT ROUTER
   ========================================================= */

export default router;