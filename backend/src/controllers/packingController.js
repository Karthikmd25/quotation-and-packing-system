import mongoose from "mongoose";

import Quotation from "../models/Quotation.js";
import PackingOrder from "../models/PackingOrder.js";
import PackingHistory from "../models/PackingHistory.js";

/* =========================================================
   GENERATE PACKING NUMBER
   Example:
   PKG-0001
   PKG-0002
   PKG-0003
========================================================= */

async function generatePackingNumber() {
  const lastPackingOrder = await PackingOrder.findOne({})
    .sort({ createdAt: -1 })
    .select("packingNumber")
    .lean();

  if (!lastPackingOrder?.packingNumber) {
    return "PKG-0001";
  }

  const match = String(lastPackingOrder.packingNumber).match(
    /(\d+)$/
  );

  if (!match) {
    return "PKG-0001";
  }

  const nextNumber = Number(match[1]) + 1;

  return `PKG-${String(nextNumber).padStart(4, "0")}`;
}

/* =========================================================
   CREATE PACKING HISTORY

   History failure must NEVER break the main workflow.
========================================================= */

async function createPackingHistory({
  packingOrder,
  quotation = null,
  customerName = "",
  customerPhone = "",
  packingNumber = "",
  quotationNumber = "",
  action,
  employeeId = "",
  managerId = "",
  managerName = "",
  requiredQuantity = 0,
  actualQuantity = 0,
  result = "",
  note = "",
  details = {},
}) {
  try {
    await PackingHistory.create({
      packingOrder,
      quotation,
      customerName,
      customerPhone,
      packingNumber,
      quotationNumber,
      action,
      employeeId,
      managerId,
      managerName,
      requiredQuantity,
      actualQuantity,
      result,
      note,
      details,
    });
  } catch (error) {
    console.error("Packing history save error:", error);
  }
}

/* =========================================================
   HISTORY BASE
========================================================= */

async function getHistoryBase(packingOrder) {
  let quotationNumber =
    packingOrder.quotationNumber ||
    packingOrder.quotation?.quotationNumber ||
    "";

  /*
    If quotationNumber is not stored directly on PackingOrder,
    get it from the quotation.
  */

  if (!quotationNumber && packingOrder.quotation) {
    const quotationId =
      packingOrder.quotation?._id ||
      packingOrder.quotation;

    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      const quotation = await Quotation.findById(
        quotationId
      )
        .select("quotationNumber")
        .lean();

      quotationNumber =
        quotation?.quotationNumber || "";
    }
  }

  return {
    packingOrder: packingOrder._id,

    quotation:
      packingOrder.quotation?._id ||
      packingOrder.quotation ||
      null,

    customerName:
      packingOrder.customerName || "",

    customerPhone:
      packingOrder.customerPhone || "",

    packingNumber:
      packingOrder.packingNumber || "",

    quotationNumber,
  };
}

/* =========================================================
   BUILD CUSTOMER ADDRESS
========================================================= */

function buildCustomerAddress(quotation) {
  const parts = [
    quotation.customerAddress,
    quotation.customerCity,
    quotation.customerState,
    quotation.customerPincode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return parts.join(", ");
}

/* =========================================================
   GET ALL PACKING ORDERS

   GET /api/packing
========================================================= */

export const getPackingOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    /* STATUS FILTER */

    if (status && status !== "ALL") {
      filter.status = status;
    }

    /* SEARCH FILTER */

    if (search?.trim()) {
      const searchText = search.trim();

      filter.$or = [
        {
          packingNumber: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          customerPhone: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          quotationNumber: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    console.log("Loading packing orders...");
    console.log("Packing filter:", filter);

    const packingOrders = await PackingOrder.find(filter)
      .populate({
        path: "quotation",
        select:
          "quotationNumber status customerName customerPhone customerEmail customerAddress customerCity customerState customerPincode transportName transportMethod",
      })
      .populate({
        path: "customer",
        select: "name phone email address city state pincode",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(
      `Packing orders loaded successfully: ${packingOrders.length}`
    );

    return res.status(200).json({
      success: true,
      packingOrders,
      count: packingOrders.length,
    });
  } catch (error) {
    console.error(
      "Get packing orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load packing orders.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE PACKING ORDER

   GET /api/packing/:id
========================================================= */

export const getPackingOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid packing order ID.",
      });
    }

    const packingOrder = await PackingOrder.findById(id)
      .populate({
        path: "quotation",
      })
      .populate({
        path: "customer",
        select:
          "name phone email address city state pincode",
      })
      .lean();

    if (!packingOrder) {
      return res.status(404).json({
        success: false,
        message: "Packing order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      packingOrder,
    });
  } catch (error) {
    console.error(
      "Get packing order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load packing order.",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE PACKING ORDER

   POST /api/packing
========================================================= */

export const createPackingOrder = async (req, res) => {
  try {
    const {
      quotationId,
      numberOfPackages,
      packageType,
      instructions,
      transportMethod,
      customTransportMethod,
      transportName,
      customTransportName,
      dispatchAddress,
      notes,
    } = req.body;

    console.log(
      "Create packing order request received."
    );

    console.log("Quotation ID:", quotationId);

    console.log(
      "Manager:",
      req.managerId || "Unknown"
    );

    /* VALIDATE QUOTATION ID */

    if (!quotationId) {
      return res.status(400).json({
        success: false,
        message: "Quotation ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(quotationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID.",
      });
    }

    /* FIND QUOTATION */

    const quotation = await Quotation.findById(
      quotationId
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found.",
      });
    }

    /* CHECK QUOTATION STATUS */

    const allowedStatuses = [
      "APPROVED",
      "CUSTOMER_CONFIRMED",
    ];

    if (!allowedStatuses.includes(quotation.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Packing order can only be created for an approved quotation.",
        quotationStatus: quotation.status,
      });
    }

    /* PREVENT DUPLICATE */

    if (quotation.packingOrder) {
      return res.status(400).json({
        success: false,
        message:
          "A packing order already exists for this quotation.",
        packingOrderId:
          quotation.packingOrder,
        packingNumber:
          quotation.packingNumber || "",
      });
    }

    const existingPackingOrder =
      await PackingOrder.findOne({
        quotation: quotation._id,
      }).lean();

    if (existingPackingOrder) {
      return res.status(400).json({
        success: false,
        message:
          "A packing order already exists for this quotation.",
        packingOrderId:
          existingPackingOrder._id,
        packingNumber:
          existingPackingOrder.packingNumber || "",
      });
    }

    /* VALIDATE ITEMS */

    if (
      !Array.isArray(quotation.items) ||
      quotation.items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quotation does not contain any items.",
      });
    }

    /* PACKAGE INFORMATION */

    const packageCount = Number(
      numberOfPackages || 1
    );

    if (
      !Number.isInteger(packageCount) ||
      packageCount < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Number of packages must be at least 1.",
      });
    }

    const finalPackageType =
      String(packageType || "Bags").trim() ||
      "Bags";

    /* TRANSPORT */

    const quotationTransportMethod =
      String(
        quotation.transportMethod || ""
      ).trim();

    const quotationTransportName =
      String(
        quotation.transportName || ""
      ).trim();

    const requestTransportMethod =
      String(
        transportMethod || ""
      ).trim();

    const requestTransportName =
      String(
        transportName || ""
      ).trim();

    const requestCustomTransportMethod =
      String(
        customTransportMethod || ""
      ).trim();

    const requestCustomTransportName =
      String(
        customTransportName || ""
      ).trim();

    const quotationCustomTransportMethod =
      String(
        quotation.customTransportMethod || ""
      ).trim();

    const quotationCustomTransportName =
      String(
        quotation.customTransportName || ""
      ).trim();

    const finalTransportMethod =
      requestTransportMethod ||
      quotationTransportMethod;

    const finalTransportName =
      requestTransportName ||
      quotationTransportName;

    const finalCustomTransportMethod =
      requestCustomTransportMethod ||
      quotationCustomTransportMethod;

    const finalCustomTransportName =
      requestCustomTransportName ||
      quotationCustomTransportName;

    /* OTHER TRANSPORT VALIDATION */

    if (
      finalTransportMethod.toLowerCase() ===
        "other" &&
      !finalCustomTransportMethod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter the custom transport method when selecting Other.",
      });
    }

    if (
      finalTransportName.toLowerCase() ===
        "other" &&
      !finalCustomTransportName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter the custom transport name when selecting Other.",
      });
    }

    /* ADDRESS */

    const quotationAddress =
      buildCustomerAddress(quotation);

    const finalDispatchAddress =
      String(dispatchAddress || "").trim() ||
      quotationAddress;

    /* CREATE PACKING ITEMS */

    const packingItems = quotation.items.map(
      (item) => {
        const requiredQuantity = Number(
          item.quantity
        );

        return {
          productId:
            item.product || null,

          partNumber:
            String(
              item.partNumber || ""
            ).trim(),

          productName:
            String(
              item.productName || ""
            ).trim(),

          size:
            String(item.size || "").trim(),

          colour:
            String(
              item.colour || ""
            ).trim(),

          unit:
            String(
              item.unit || "Piece"
            ).trim(),

          requiredQuantity,

          pickedQuantity: null,

          checkedQuantity: null,

          packedQuantity: null,

          notes: "",
        };
      }
    );

    /* VALIDATE REQUIRED QUANTITY */

    const invalidItem =
      packingItems.find(
        (item) =>
          !Number.isFinite(
            item.requiredQuantity
          ) ||
          item.requiredQuantity < 1
      );

    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid required quantity for ${
            invalidItem.productName ||
            "product"
          }.`,
      });
    }

    /* GENERATE NUMBER */

    const packingNumber =
      await generatePackingNumber();

    /* CREATE ORDER DATA */

    const packingOrderData = {
      packingNumber,

      quotation:
        quotation._id,

      /*
        Snapshot quotation number.
        If PackingOrder schema has this field,
        it will be stored directly.
      */
      quotationNumber:
        quotation.quotationNumber || "",

      customer:
        quotation.customer || null,

      customerName:
        quotation.customerName || "",

      customerPhone:
        quotation.customerPhone || "",

      customerEmail:
        quotation.customerEmail || "",

      customerAddress:
        quotation.customerAddress || "",

      items: packingItems,

      numberOfPackages:
        packageCount,

      packageType:
        finalPackageType,

      instructions:
        String(
          instructions || ""
        ).trim(),

      transportMethod:
        finalTransportMethod,

      customTransportMethod:
        finalCustomTransportMethod,

      transportName:
        finalTransportName,

      customTransportName:
        finalCustomTransportName,

      dispatchAddress:
        finalDispatchAddress,

      notes:
        String(notes || "").trim(),

      status: "PENDING",
    };

    /* MANAGER INFORMATION */

    if (req.managerMongoId) {
      packingOrderData.createdBy =
        req.managerMongoId;

      packingOrderData.updatedBy =
        req.managerMongoId;
    }

    /* CREATE */

    let packingOrder;

    try {
      packingOrder =
        await PackingOrder.create(
          packingOrderData
        );
    } catch (error) {
      if (error.code === 11000) {
        console.error(
          "Duplicate packing order key:",
          error.keyValue
        );

        return res.status(409).json({
          success: false,
          message:
            "A packing order with this number already exists. Please try again.",
        });
      }

      throw error;
    }

    /* UPDATE QUOTATION */

    quotation.status =
      "PACKING_CREATED";

    quotation.packingOrder =
      packingOrder._id;

    quotation.packingNumber =
      packingOrder.packingNumber;

    await quotation.save();

    /* HISTORY */

    await createPackingHistory({
      packingOrder:
        packingOrder._id,

      quotation:
        quotation._id,

      customerName:
        packingOrder.customerName,

      customerPhone:
        packingOrder.customerPhone,

      packingNumber:
        packingOrder.packingNumber,

      quotationNumber:
        quotation.quotationNumber,

      action:
        "PACKING_ORDER_CREATED",

      managerId:
        req.managerId || "",

      managerName:
        req.managerName || "",

      note:
        "Packing order created by manager.",

      details: {
        numberOfPackages:
          packageCount,

        packageType:
          finalPackageType,

        transportMethod:
          finalTransportMethod,

        transportName:
          finalTransportName,

        dispatchAddress:
          finalDispatchAddress,
      },
    });

    /* POPULATED RESPONSE */

    const populatedPackingOrder =
      await PackingOrder.findById(
        packingOrder._id
      )
        .populate({
          path: "quotation",
          select:
            "quotationNumber status customerName customerPhone customerEmail customerAddress customerCity customerState customerPincode transportName transportMethod",
        })
        .populate({
          path: "customer",
          select:
            "name phone email address city state pincode",
        })
        .lean();

    return res.status(201).json({
      success: true,
      message:
        "Packing order created successfully.",
      packingOrder:
        populatedPackingOrder,
    });
  } catch (error) {
    console.error(
      "Create packing order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create packing order.",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE PACKING WORKFLOW

   PUT /api/packing/:id/workflow

   Required quantity is preserved from the database.

   IMPORTANT:
   If an old PackingOrder has a missing requiredQuantity,
   this function can repair it using the submitted
   requiredQuantity ONCE.
========================================================= */

export const updatePackingWorkflow = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    /* -----------------------------------------------------
       1. VALIDATE PACKING ORDER ID
    ----------------------------------------------------- */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid packing order ID.",
      });
    }

    /* -----------------------------------------------------
       2. FIND PACKING ORDER
    ----------------------------------------------------- */

    const packingOrder =
      await PackingOrder.findById(id);

    if (!packingOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Packing order not found.",
      });
    }

    /* -----------------------------------------------------
       3. PREVENT EDIT AFTER DISPATCH
    ----------------------------------------------------- */

    if (
      packingOrder.status ===
        "DISPATCHED" ||
      packingOrder.status ===
        "DELIVERED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Packing order cannot be edited because current status is ${packingOrder.status}.`,
      });
    }

    /* -----------------------------------------------------
       4. REQUEST DATA
    ----------------------------------------------------- */

    const {
      items,
      pickedBy,
      checkedBy,
      packedBy,
      dispatchAddress,
      transportMethod,
      customTransportMethod,
      transportName,
      customTransportName,
      notes,
    } = req.body;

    /* -----------------------------------------------------
       5. VALIDATE ITEMS ARRAY
    ----------------------------------------------------- */

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message:
          "Items must be an array.",
      });
    }

    if (
      items.length !==
      packingOrder.items.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Expected ${packingOrder.items.length} items but received ${items.length}.`,
      });
    }

    /* -----------------------------------------------------
       6. SAVE PREVIOUS COMPLETION STATES
    ----------------------------------------------------- */

    const wasPickingCompleted =
      Boolean(
        packingOrder.pickingCompleted
      );

    const wasCheckingCompleted =
      Boolean(
        packingOrder.checkingCompleted
      );

    const wasPackingCompleted =
      Boolean(
        packingOrder.packingCompleted
      );

    /* -----------------------------------------------------
       7. CREATE SUBMITTED ITEM LOOKUP
    ----------------------------------------------------- */

    const submittedById = new Map();

    for (const submittedItem of items) {
      if (submittedItem?.itemId) {
        submittedById.set(
          String(
            submittedItem.itemId
          ),
          submittedItem
        );
      }
    }

    /* -----------------------------------------------------
       8. UPDATE EACH EXISTING ITEM
    ----------------------------------------------------- */

    for (
      let index = 0;
      index < packingOrder.items.length;
      index++
    ) {
      const existingItem =
        packingOrder.items[index];

      let submittedItem = null;

      /* Match using item ID */

      if (existingItem?._id) {
        submittedItem =
          submittedById.get(
            String(existingItem._id)
          );
      }

      /* Fallback to array position */

      if (!submittedItem) {
        submittedItem = items[index];
      }

      if (!submittedItem) {
        return res.status(400).json({
          success: false,
          message:
            `Item ${index + 1} was not found.`,
        });
      }

      /* ---------------------------------------------------
         REQUIRED QUANTITY

         Database value is the source of truth.

         BUT:
         This repairs old PackingOrders created before
         requiredQuantity was saved correctly.
      --------------------------------------------------- */

      let requiredQuantity =
        Number(
          existingItem.requiredQuantity
        );

      if (
        !Number.isFinite(
          requiredQuantity
        ) ||
        requiredQuantity < 1
      ) {
        const submittedRequiredQuantity =
          Number(
            submittedItem.requiredQuantity
          );

        if (
          Number.isFinite(
            submittedRequiredQuantity
          ) &&
          submittedRequiredQuantity >= 1
        ) {
          console.log(
            `Repairing required quantity for ${existingItem.productName}: ` +
              `${existingItem.requiredQuantity} -> ${submittedRequiredQuantity}`
          );

          requiredQuantity =
            submittedRequiredQuantity;

          /*
            Save repaired value to the
            existing MongoDB subdocument.
          */
          existingItem.requiredQuantity =
            requiredQuantity;
        } else {
          console.error(
            "Cannot repair required quantity:",
            {
              packingOrderId:
                packingOrder._id,

              itemId:
                existingItem._id,

              productName:
                existingItem.productName,

              databaseRequiredQuantity:
                existingItem.requiredQuantity,

              submittedRequiredQuantity:
                submittedItem.requiredQuantity,
            }
          );

          return res.status(400).json({
            success: false,
            message:
              `Invalid required quantity for ${existingItem.productName}. Both database and submitted quantity are invalid.`,
          });
        }
      }

      /* ---------------------------------------------------
         QUANTITY PARSER
      --------------------------------------------------- */

      const parseQuantity = (
        value,
        oldValue
      ) => {
        /*
          Field not sent:
          preserve old value.
        */

        if (value === undefined) {
          return oldValue ?? null;
        }

        /*
          Blank:
          set null.
        */

        if (
          value === null ||
          value === ""
        ) {
          return null;
        }

        const quantity =
          Number(value);

        if (
          !Number.isFinite(
            quantity
          )
        ) {
          throw new Error(
            `Invalid quantity for ${existingItem.productName}.`
          );
        }

        if (quantity < 0) {
          throw new Error(
            `Quantity cannot be negative for ${existingItem.productName}.`
          );
        }

        return quantity;
      };

      /* ---------------------------------------------------
         PHYSICAL QUANTITIES
      --------------------------------------------------- */

      const pickedQuantity =
        parseQuantity(
          submittedItem.pickedQuantity,
          existingItem.pickedQuantity
        );

      const checkedQuantity =
        parseQuantity(
          submittedItem.checkedQuantity,
          existingItem.checkedQuantity
        );

      const packedQuantity =
        parseQuantity(
          submittedItem.packedQuantity,
          existingItem.packedQuantity
        );

      /* ---------------------------------------------------
         PICKED VALIDATION
      --------------------------------------------------- */

      if (
        pickedQuantity !== null &&
        pickedQuantity >
          requiredQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Picked quantity cannot exceed required quantity for ${existingItem.productName}. Required: ${requiredQuantity}.`,
        });
      }

      /* ---------------------------------------------------
         CHECKED VALIDATION
      --------------------------------------------------- */

      if (
        checkedQuantity !== null &&
        checkedQuantity >
          requiredQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Checked quantity cannot exceed required quantity for ${existingItem.productName}. Required: ${requiredQuantity}.`,
        });
      }

      /* ---------------------------------------------------
         PACKED VALIDATION
      --------------------------------------------------- */

      if (
        packedQuantity !== null &&
        packedQuantity >
          requiredQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Packed quantity cannot exceed required quantity for ${existingItem.productName}. Required: ${requiredQuantity}.`,
        });
      }

      /* ---------------------------------------------------
         CHECKED CANNOT EXCEED PICKED
      --------------------------------------------------- */

      if (
        checkedQuantity !== null &&
        pickedQuantity !== null &&
        checkedQuantity >
          pickedQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Checked quantity cannot exceed picked quantity for ${existingItem.productName}.`,
        });
      }

      /* ---------------------------------------------------
         PACKED CANNOT EXCEED CHECKED
      --------------------------------------------------- */

      if (
        packedQuantity !== null &&
        checkedQuantity !== null &&
        packedQuantity >
          checkedQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Packed quantity cannot exceed checked quantity for ${existingItem.productName}.`,
        });
      }

      /* ---------------------------------------------------
         UPDATE ONLY PHYSICAL QUANTITIES
      --------------------------------------------------- */

      existingItem.pickedQuantity =
        pickedQuantity;

      existingItem.checkedQuantity =
        checkedQuantity;

      existingItem.packedQuantity =
        packedQuantity;

      /* NOTES */

      if (
        submittedItem.notes !==
        undefined
      ) {
        existingItem.notes =
          String(
            submittedItem.notes ?? ""
          ).trim();
      }
    }

    /* -----------------------------------------------------
       9. DETERMINE PICKING COMPLETION
    ----------------------------------------------------- */

    const pickingComplete =
      packingOrder.items.every(
        (item) => {
          const required =
            Number(
              item.requiredQuantity
            );

          const picked =
            Number(
              item.pickedQuantity
            );

          return (
            Number.isFinite(
              required
            ) &&
            item.pickedQuantity !==
              null &&
            Number.isFinite(
              picked
            ) &&
            picked === required
          );
        }
      );

    /* -----------------------------------------------------
       10. DETERMINE CHECKING COMPLETION
    ----------------------------------------------------- */

    const checkingComplete =
      packingOrder.items.every(
        (item) => {
          const required =
            Number(
              item.requiredQuantity
            );

          const checked =
            Number(
              item.checkedQuantity
            );

          return (
            Number.isFinite(
              required
            ) &&
            item.checkedQuantity !==
              null &&
            Number.isFinite(
              checked
            ) &&
            checked === required
          );
        }
      );

    /* -----------------------------------------------------
       11. DETERMINE PACKING COMPLETION
    ----------------------------------------------------- */

    const packingComplete =
      packingOrder.items.every(
        (item) => {
          const required =
            Number(
              item.requiredQuantity
            );

          const packed =
            Number(
              item.packedQuantity
            );

          return (
            Number.isFinite(
              required
            ) &&
            item.packedQuantity !==
              null &&
            Number.isFinite(
              packed
            ) &&
            packed === required
          );
        }
      );

    /* -----------------------------------------------------
       12. EMPLOYEE IDs
    ----------------------------------------------------- */

    const finalPickedBy =
      pickedBy !== undefined
        ? String(
            pickedBy ?? ""
          )
            .trim()
            .toUpperCase()
        : String(
            packingOrder.pickedBy ??
              ""
          )
            .trim()
            .toUpperCase();

    const finalCheckedBy =
      checkedBy !== undefined
        ? String(
            checkedBy ?? ""
          )
            .trim()
            .toUpperCase()
        : String(
            packingOrder.checkedBy ??
              ""
          )
            .trim()
            .toUpperCase();

    const finalPackedBy =
      packedBy !== undefined
        ? String(
            packedBy ?? ""
          )
            .trim()
            .toUpperCase()
        : String(
            packingOrder.packedBy ??
              ""
          )
            .trim()
            .toUpperCase();

    /* -----------------------------------------------------
       13. EMPLOYEE ID REQUIRED FOR COMPLETION
    ----------------------------------------------------- */

    if (
      pickingComplete &&
      !finalPickedBy
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID is required to complete picking.",
      });
    }

    if (
      checkingComplete &&
      !finalCheckedBy
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID is required to complete checking.",
      });
    }

    if (
      packingComplete &&
      !finalPackedBy
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID is required to complete packing.",
      });
    }

    /* -----------------------------------------------------
       14. SAVE EMPLOYEE IDs
    ----------------------------------------------------- */

    packingOrder.pickedBy =
      finalPickedBy;

    packingOrder.checkedBy =
      finalCheckedBy;

    packingOrder.packedBy =
      finalPackedBy;

    /* -----------------------------------------------------
       15. COMPLETION FLAGS
    ----------------------------------------------------- */

    packingOrder.pickingCompleted =
      pickingComplete;

    packingOrder.checkingCompleted =
      checkingComplete;

    packingOrder.packingCompleted =
      packingComplete;

    /* -----------------------------------------------------
       16. COMPLETION TIMESTAMPS
    ----------------------------------------------------- */

    if (
      pickingComplete &&
      !wasPickingCompleted
    ) {
      packingOrder.pickedAt =
        new Date();
    }

    if (
      checkingComplete &&
      !wasCheckingCompleted
    ) {
      packingOrder.checkedAt =
        new Date();
    }

    if (
      packingComplete &&
      !wasPackingCompleted
    ) {
      packingOrder.packedAt =
        new Date();
    }

    /* -----------------------------------------------------
       17. EDITABLE PACKING INFORMATION
    ----------------------------------------------------- */

    if (
      dispatchAddress !==
      undefined
    ) {
      packingOrder.dispatchAddress =
        String(
          dispatchAddress ?? ""
        ).trim();
    }

    if (
      transportMethod !==
      undefined
    ) {
      packingOrder.transportMethod =
        String(
          transportMethod ?? ""
        ).trim();
    }

    if (
      customTransportMethod !==
      undefined
    ) {
      packingOrder.customTransportMethod =
        String(
          customTransportMethod ?? ""
        ).trim();
    }

    if (
      transportName !==
      undefined
    ) {
      packingOrder.transportName =
        String(
          transportName ?? ""
        ).trim();
    }

    if (
      customTransportName !==
      undefined
    ) {
      packingOrder.customTransportName =
        String(
          customTransportName ?? ""
        ).trim();
    }

    if (notes !== undefined) {
      packingOrder.notes =
        String(
          notes ?? ""
        ).trim();
    }

    /* -----------------------------------------------------
       18. STATUS
    ----------------------------------------------------- */

    if (packingComplete) {
      packingOrder.status =
        "PACKED";
    } else if (
      pickingComplete ||
      checkingComplete
    ) {
      packingOrder.status =
        "PACKING";
    } else {
      packingOrder.status =
        "PENDING";
    }

    /* -----------------------------------------------------
       19. UPDATED BY MANAGER
    ----------------------------------------------------- */

    if (req.managerMongoId) {
      packingOrder.updatedBy =
        req.managerMongoId;
    }

    /* -----------------------------------------------------
       20. SAVE TO DATABASE
    ----------------------------------------------------- */

    await packingOrder.save();

    /* -----------------------------------------------------
       21. SAVE HISTORY
    ----------------------------------------------------- */

    try {
      const historyBase =
        await getHistoryBase(
          packingOrder
        );

      /* PICKING */

      if (
        pickingComplete &&
        !wasPickingCompleted
      ) {
        await createPackingHistory({
          ...historyBase,

          action:
            "PICKING_COMPLETED",

          employeeId:
            finalPickedBy,

          details: {
            employeeId:
              finalPickedBy,

            items:
              packingOrder.items.map(
                (item) => ({
                  itemId:
                    item._id,

                  productName:
                    item.productName,

                  requiredQuantity:
                    item.requiredQuantity,

                  pickedQuantity:
                    item.pickedQuantity,
                })
              ),
          },
        });
      }

      /* CHECKING */

      if (
        checkingComplete &&
        !wasCheckingCompleted
      ) {
        await createPackingHistory({
          ...historyBase,

          action:
            "CHECKING_COMPLETED",

          employeeId:
            finalCheckedBy,

          details: {
            employeeId:
              finalCheckedBy,

            items:
              packingOrder.items.map(
                (item) => ({
                  itemId:
                    item._id,

                  productName:
                    item.productName,

                  requiredQuantity:
                    item.requiredQuantity,

                  checkedQuantity:
                    item.checkedQuantity,
                })
              ),
          },
        });
      }

      /* PACKING */

      if (
        packingComplete &&
        !wasPackingCompleted
      ) {
        await createPackingHistory({
          ...historyBase,

          action:
            "PACKING_COMPLETED",

          employeeId:
            finalPackedBy,

          details: {
            employeeId:
              finalPackedBy,

            items:
              packingOrder.items.map(
                (item) => ({
                  itemId:
                    item._id,

                  productName:
                    item.productName,

                  requiredQuantity:
                    item.requiredQuantity,

                  packedQuantity:
                    item.packedQuantity,
                })
              ),
          },
        });
      }
    } catch (historyError) {
      console.error(
        "Packing history error:",
        historyError
      );
    }

    /* -----------------------------------------------------
       22. POPULATED RESPONSE
    ----------------------------------------------------- */

    const populatedPackingOrder =
      await PackingOrder.findById(
        packingOrder._id
      )
        .populate(
          "quotation",
          "quotationNumber status customerName customerPhone customerEmail customerAddress customerCity customerState customerPincode transportMethod transportName"
        )
        .populate(
          "customer",
          "name phone email address city state pincode"
        );

    /* -----------------------------------------------------
       23. RESPONSE
    ----------------------------------------------------- */

    return res.status(200).json({
      success: true,

      message: packingComplete
        ? "Packing completed successfully."
        : checkingComplete
        ? "Checking completed successfully."
        : pickingComplete
        ? "Picking completed successfully."
        : "Packing workflow saved successfully.",

      packingOrder:
        populatedPackingOrder,

      workflow: {
        pickingCompleted:
          pickingComplete,

        checkingCompleted:
          checkingComplete,

        packingCompleted:
          packingComplete,
      },
    });
  } catch (error) {
    console.error(
      "Update packing workflow error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update packing workflow.",
    });
  }
};

/* =========================================================
   MARK DISPATCH LABEL PRINTED

   PATCH /api/packing/:id/dispatch-label
========================================================= */

export const markDispatchLabelPrinted =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid packing order ID.",
        });
      }

      const packingOrder =
        await PackingOrder.findById(id);

      if (!packingOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Packing order not found.",
        });
      }

      /* REQUIRE ALL WORKFLOW STAGES */

      if (
        !packingOrder.pickingCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Picking must be completed before printing the dispatch label.",
        });
      }

      if (
        !packingOrder.checkingCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Checking must be completed before printing the dispatch label.",
        });
      }

      if (
        !packingOrder.packingCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Packing must be completed before printing the dispatch label.",
        });
      }

      /* ALREADY PRINTED */

      if (
        packingOrder.dispatchLabelPrinted
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Dispatch label is already marked as printed.",
          packingOrder,
        });
      }

      /* MARK PRINTED */

      packingOrder.dispatchLabelPrinted =
        true;

      packingOrder.dispatchLabelPrintedAt =
        new Date();

      if (req.managerMongoId) {
        packingOrder.updatedBy =
          req.managerMongoId;
      }

      await packingOrder.save();

      /* HISTORY */

      const historyBase =
        await getHistoryBase(
          packingOrder
        );

      const existingHistory =
        await PackingHistory.findOne({
          packingOrder:
            packingOrder._id,

          action:
            "DISPATCH_LABEL_PRINTED",
        }).lean();

      if (!existingHistory) {
        await createPackingHistory({
          ...historyBase,

          action:
            "DISPATCH_LABEL_PRINTED",

          managerId:
            req.managerId || "",

          managerName:
            req.managerName || "",

          note:
            "Dispatch label printed.",

          details: {
            printedAt:
              packingOrder.dispatchLabelPrintedAt,
          },
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Dispatch label marked as printed.",

        packingOrder,
      });
    } catch (error) {
      console.error(
        "Mark dispatch label error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to mark dispatch label as printed.",

        error: error.message,
      });
    }
  };

/* =========================================================
   MARK BAG DISPATCHED

   PATCH /api/packing/:id/dispatch

   Transport slip is OPTIONAL.
========================================================= */

export const markBagDispatched =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid packing order ID.",
        });
      }

      const packingOrder =
        await PackingOrder.findById(id);

      if (!packingOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Packing order not found.",
        });
      }

      /* PICKING */

      if (
        !packingOrder.pickingCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Picking must be completed before dispatch.",
        });
      }

      /* CHECKING */

      if (
        !packingOrder.checkingCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Checking must be completed before dispatch.",
        });
      }

      /* PACKING */

      if (
        !packingOrder.packingCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Packing must be completed before dispatch.",
        });
      }

      /* DISPATCH LABEL */

      if (
        !packingOrder.dispatchLabelPrinted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please print the dispatch label before dispatching the order.",
        });
      }

      /* ALREADY DISPATCHED */

      if (
        packingOrder.status ===
        "DISPATCHED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This packing order is already dispatched.",
        });
      }

      /* ALREADY DELIVERED */

      if (
        packingOrder.status ===
        "DELIVERED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This packing order has already been delivered.",
        });
      }

      const previousStatus =
        packingOrder.status;

      /* DISPATCH */

      packingOrder.status =
        "DISPATCHED";

      if (!packingOrder.dispatchedAt) {
        packingOrder.dispatchedAt =
          new Date();
      }

      if (req.managerMongoId) {
        packingOrder.updatedBy =
          req.managerMongoId;
      }

      await packingOrder.save();

      /* HISTORY */

      const historyBase =
        await getHistoryBase(
          packingOrder
        );

      const existingHistory =
        await PackingHistory.findOne({
          packingOrder:
            packingOrder._id,

          action:
            "DISPATCHED",
        }).lean();

      if (!existingHistory) {
        await createPackingHistory({
          ...historyBase,

          action:
            "DISPATCHED",

          managerId:
            req.managerId || "",

          managerName:
            req.managerName || "",

          note:
            "Packing order dispatched.",

          details: {
            previousStatus,

            transportMethod:
              packingOrder.transportMethod ||
              "",

            transportName:
              packingOrder.transportName ||
              "",

            transportSlipUploaded:
              Boolean(
                packingOrder.transportSlipPhoto
              ),

            dispatchedAt:
              packingOrder.dispatchedAt,
          },
        });
      }

      /* POPULATED RESPONSE */

      const populatedOrder =
        await PackingOrder.findById(
          packingOrder._id
        )
          .populate(
            "quotation",
            "quotationNumber status customerName customerPhone customerEmail customerAddress customerCity customerState customerPincode transportMethod transportName"
          )
          .populate(
            "customer",
            "name phone email address city state pincode"
          );

      return res.status(200).json({
        success: true,

        message:
          "Packing order dispatched successfully.",

        packingOrder:
          populatedOrder,
      });
    } catch (error) {
      console.error(
        "Mark bag dispatched error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to dispatch packing order.",
      });
    }
  };

/* =========================================================
   SAVE TRANSPORT SLIP

   POST /api/packing/:id/transport-slip

   Optional.
========================================================= */

export const saveTransportSlip =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid packing order ID.",
        });
      }

      const packingOrder =
        await PackingOrder.findById(id);

      if (!packingOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Packing order not found.",
        });
      }

      if (
        !packingOrder.packingCompleted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complete packing before uploading the transport slip.",
        });
      }

      const photo =
        req.body?.transportSlipPhoto ||
        "";

      if (!photo) {
        return res.status(400).json({
          success: false,
          message:
            "Transport slip photo is required.",
        });
      }

      const previousStatus =
        packingOrder.status;

      const uploadedAfterDispatch =
        previousStatus ===
          "DISPATCHED" ||
        previousStatus ===
          "DELIVERED";

      /* SAVE SLIP */

      packingOrder.transportSlipPhoto =
        photo;

      packingOrder.transportSlipUploadedAt =
        new Date();

      /*
        Do not move DISPATCHED or DELIVERED
        backwards.
      */

      if (
        previousStatus !==
          "DISPATCHED" &&
        previousStatus !==
          "DELIVERED"
      ) {
        packingOrder.status =
          "PACKED";
      }

      if (req.managerMongoId) {
        packingOrder.updatedBy =
          req.managerMongoId;
      }

      await packingOrder.save();

      /* HISTORY */

      const historyBase =
        await getHistoryBase(
          packingOrder
        );

      await createPackingHistory({
        ...historyBase,

        action:
          "TRANSPORT_SLIP_SAVED",

        managerId:
          req.managerId || "",

        managerName:
          req.managerName || "",

        note:
          "Transport slip uploaded.",

        details: {
          uploadedAfterDispatch,

          previousStatus,

          statusAtUpload:
            packingOrder.status,

          uploadedAt:
            packingOrder.transportSlipUploadedAt,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Transport slip saved successfully.",

        packingOrder,
      });
    } catch (error) {
      console.error(
        "Save transport slip error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to save transport slip.",

        error: error.message,
      });
    }
  };

/* =========================================================
   MARK DELIVERED

   PATCH /api/packing/:id/delivered
========================================================= */

export const markDelivered =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid packing order ID.",
        });
      }

      const packingOrder =
        await PackingOrder.findById(id);

      if (!packingOrder) {
        return res.status(404).json({
          success: false,
          message:
            "Packing order not found.",
        });
      }

      /* ONLY DISPATCHED */

      if (
        packingOrder.status !==
        "DISPATCHED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only dispatched orders can be marked as delivered.",
        });
      }

      /* DELIVER */

      packingOrder.status =
        "DELIVERED";

      packingOrder.deliveryDate =
        new Date();

      if (req.managerMongoId) {
        packingOrder.updatedBy =
          req.managerMongoId;
      }

      await packingOrder.save();

      /* HISTORY */

      const historyBase =
        await getHistoryBase(
          packingOrder
        );

      const existingHistory =
        await PackingHistory.findOne({
          packingOrder:
            packingOrder._id,

          action:
            "DELIVERED",
        }).lean();

      if (!existingHistory) {
        await createPackingHistory({
          ...historyBase,

          action:
            "DELIVERED",

          managerId:
            req.managerId || "",

          managerName:
            req.managerName || "",

          note:
            "Order delivered.",

          details: {
            deliveryDate:
              packingOrder.deliveryDate,
          },
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Packing order marked as delivered.",

        packingOrder,
      });
    } catch (error) {
      console.error(
        "Mark delivered error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to mark order as delivered.",

        error: error.message,
      });
    }
  };