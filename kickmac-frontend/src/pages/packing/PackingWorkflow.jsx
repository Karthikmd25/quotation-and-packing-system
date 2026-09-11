import React, {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Loader2,
  PackageCheck,
  Printer,
  RefreshCw,
  Save,
  Truck,
  X,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";
import "./PackingWorkflow.css";
import DispatchSection from "./DispatchSection";

/* =========================================================
   HELPERS
========================================================= */

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hour = date.getHours();

  const minute = String(date.getMinutes()).padStart(2, "0");

  const ampm = hour >= 12 ? "pm" : "am";

  hour = hour % 12 || 12;

  return `${day} ${month} ${year}, ${hour}:${minute} ${ampm}`;
}

/* =========================================================
   CUSTOMER
========================================================= */

function getCustomerName(quotation, packingOrder) {
  return (
    packingOrder?.customerName ||
    quotation?.customerName ||
    quotation?.customer?.name ||
    "Unknown Customer"
  );
}

function getCustomerPhone(quotation, packingOrder) {
  return (
    packingOrder?.customerPhone ||
    quotation?.customerPhone ||
    quotation?.customer?.phone ||
    ""
  );
}

function getCustomerEmail(quotation, packingOrder) {
  return (
    packingOrder?.customerEmail ||
    quotation?.customerEmail ||
    quotation?.customer?.email ||
    ""
  );
}

function getCustomerAddress(quotation, packingOrder) {
  return (
    packingOrder?.dispatchAddress ||
    packingOrder?.customerAddress ||
    packingOrder?.deliveryAddress ||
    packingOrder?.address ||
    quotation?.customerAddress ||
    quotation?.deliveryAddress ||
    quotation?.address ||
    quotation?.customer?.address ||
    quotation?.customer?.deliveryAddress ||
    ""
  );
}

/* =========================================================
   MANAGER ID
========================================================= */

function getManagerId(order) {
  const candidates = [
    order?.managerEmployeeId,
    order?.createdByEmployeeId,
    order?.manager?.employeeId,
    order?.quotation?.managerEmployeeId,
    order?.quotation?.createdByEmployeeId,
    order?.quotation?.approvedBy,
    order?.managerId,
  ];

  const value = candidates.find(
    (item) =>
      item !== null &&
      item !== undefined &&
      String(item).trim()
  );

  if (!value) {
    return "MGR-001";
  }

  const clean = String(value).trim();

  if (/^MGR-\d+$/i.test(clean)) {
    return clean.toUpperCase();
  }

  if (/^[a-f0-9]{24}$/i.test(clean)) {
    return "MGR-001";
  }

  return clean;
}

/* =========================================================
   ORDER DATE
========================================================= */

function getOrderDateTime(order) {
  return (
    order?.createdAt ||
    order?.createdDate ||
    order?.quotation?.createdAt ||
    null
  );
}

/* =========================================================
   TRANSPORT
========================================================= */

function getTransportMethod(order, quotation) {
  return (
    order?.transportMethod ||
    quotation?.transportMethod ||
    ""
  );
}

function getTransportName(order, quotation) {
  return (
    order?.transportName ||
    quotation?.transportName ||
    ""
  );
}

/* =========================================================
   TRANSPORT OPTIONS
========================================================= */

const TRANSPORT_NAME_OPTIONS = [
  "Seabird",
  "Sugama",
  "Navadurga",
  "Nagashree",
  "MSS",
  "KPN",
  "VRL",
  "Navata Transport",
  "A1 Sharma",
  "Professional Couriers",
  "DTDC",
  "Porter",
  "India Post",
  "Customer Transport",
  "Other",
];

function getTransportType(name) {
  const value = String(name || "")
    .trim()
    .toLowerCase();

  if (
    [
      "professional couriers",
      "dtdc",
    ].includes(value)
  ) {
    return "Courier";
  }

  if (value === "porter") {
    return "Porter";
  }

  if (value === "india post") {
    return "Post";
  }

  if (value === "customer transport") {
    return "Customer Transport";
  }

  if (value === "other") {
    return "Other";
  }

  if (value) {
    return "Transport";
  }

  return "";
}

/* =========================================================
   TRANSPORT SLIP
========================================================= */

function getSlipPhoto(order) {
  return (
    order?.transportSlipPhoto ||
    order?.transportSlip?.photo ||
    order?.transportSlip?.image ||
    order?.slipPhoto ||
    ""
  );
}

/* =========================================================
   QUANTITY STATUS
========================================================= */

function QuantityStatus({ item, field }) {
  const value = item[field];

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return (
      <span className="pw-quantity-pending">
        PENDING
      </span>
    );
  }

  const isMatch =
    Number(value) ===
    Number(item.requiredQuantity);

  if (isMatch) {
    return (
      <span className="pw-quantity-match">
        <Check size={14} />
        MATCH
      </span>
    );
  }

  return (
    <span className="pw-quantity-mismatch">
      <X size={14} />
      MISMATCH
    </span>
  );
}

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({ ok, label }) {
  return (
    <span
      className={
        ok
          ? "pw-status pw-status-success"
          : "pw-status pw-status-pending"
      }
    >
      {ok ? (
        <Check size={14} />
      ) : (
        <X size={14} />
      )}

      {label}
    </span>
  );
}

/* =========================================================
   STEPPER
========================================================= */

function Stepper({ stage }) {
  const steps = [
    {
      key: "pack",
      label: "Items to Pack",
      icon: PackageCheck,
    },
    {
      key: "label",
      label: "Dispatch Label",
      icon: Printer,
    },
    {
      key: "transport",
      label: "Transport Slip",
      icon: Truck,
    },
    {
      key: "dispatch",
      label: "Dispatch",
      icon: Truck,
    },
  ];

  const index = steps.findIndex(
    (step) => step.key === stage
  );

  return (
    <div className="pw-stepper">
      {steps.map((step, i) => {
        const Icon = step.icon;

        const active = i === index;
        const done = i < index;

        return (
          <Fragment key={step.key}>
            <div
              className={[
                "pw-step",
                active ? "pw-step-active" : "",
                done ? "pw-step-done" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {done ? (
                <CheckCircle2 size={16} />
              ) : (
                <Icon size={16} />
              )}

              <span>{step.label}</span>
            </div>

            {i < steps.length - 1 && (
              <ArrowRight
                size={16}
                className="pw-step-arrow"
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PackingWorkflow() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const packingId =
    searchParams.get("packingId") ||
    searchParams.get("id");

  const quotationId =
    searchParams.get("quotationId");

  /* =======================================================
     STATE
  ======================================================= */

  const [packingOrder, setPackingOrder] =
    useState(null);

  const [quotation, setQuotation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [printing, setPrinting] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [dispatching, setDispatching] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [stage, setStage] =
    useState("pack");

  const [items, setItems] =
    useState([]);

  const [staff, setStaff] = useState({
    pickedBy: "",
    checkedBy: "",
    packedBy: "",
  });

  const [dispatchAddress, setDispatchAddress] =
    useState("");

  const [transportMethod, setTransportMethod] =
    useState("");

  const [
    customTransportMethod,
    setCustomTransportMethod,
  ] = useState("");

  const [transportName, setTransportName] =
    useState("");

  const [
    customTransportName,
    setCustomTransportName,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [transportPhoto, setTransportPhoto] =
    useState("");

  const [
    transportSlipUploaded,
    setTransportSlipUploaded,
  ] = useState(false);

  const fileInputRef = useRef(null);

  /* =======================================================
     STAFF
  ======================================================= */

  function handleStaffChange(field, value) {
    setStaff((previous) => ({
      ...previous,
      [field]: String(value || "").toUpperCase(),
    }));
  }

  /* =======================================================
     TRANSPORT CHANGE
  ======================================================= */

  function handleTransportNameChange(value) {
    const cleanValue = String(value || "").trim();

    setTransportName(cleanValue);

    if (cleanValue !== "Other") {
      setCustomTransportName("");
    }

    const detectedMethod =
      getTransportType(cleanValue);

    if (
      detectedMethod &&
      detectedMethod !== "Other"
    ) {
      setTransportMethod(detectedMethod);
      setCustomTransportMethod("");
    } else if (cleanValue === "Other") {
      setTransportMethod("Other");
    } else {
      setTransportMethod("");
    }
  }

  /* =======================================================
     LOAD ORDER
  ======================================================= */

  useEffect(() => {
    if (packingId || quotationId) {
      loadPackingOrder();
    } else {
      setLoading(false);

      setError(
        "Packing order ID is missing."
      );
    }
  }, [packingId, quotationId]);

  async function loadPackingOrder() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let loadedPackingOrder = null;
      let loadedQuotation = null;

      /* ---------------------------------------------------
         LOAD PACKING ORDER
      --------------------------------------------------- */

      if (packingId) {
        const response = await api.get(
          `/packing/${packingId}`
        );

        loadedPackingOrder =
          response.data?.packingOrder ||
          response.data?.data ||
          response.data;

        if (
          loadedPackingOrder?.quotation &&
          typeof loadedPackingOrder.quotation ===
            "object"
        ) {
          loadedQuotation =
            loadedPackingOrder.quotation;
        }
      }

      /* ---------------------------------------------------
         LOAD QUOTATION IF NEEDED
      --------------------------------------------------- */

      if (
        quotationId &&
        !loadedQuotation
      ) {
        const response = await api.get(
          `/quotations/${quotationId}`
        );

        loadedQuotation =
          response.data?.quotation ||
          response.data?.data ||
          response.data;
      }

      if (loadedQuotation) {
        setQuotation(loadedQuotation);
      }

      if (!loadedPackingOrder) {
        setError(
          "Packing order could not be found."
        );
        return;
      }

      setPackingOrder(loadedPackingOrder);

      /* ---------------------------------------------------
         ITEMS
      --------------------------------------------------- */

      const loadedItems =
        Array.isArray(loadedPackingOrder.items)
          ? loadedPackingOrder.items
          : [];

      setItems(
        loadedItems.map((item) => ({
          itemId:
            item._id ||
            item.itemId ||
            `${item.partNumber}-${Math.random()}`,

          partNumber:
            item.partNumber || "",

          productName:
            item.productName || "",

          size:
            item.size || "",

          colour:
            item.colour || "",

          unit:
            item.unit || "Piece",

          requiredQuantity:
            Number(
              item.requiredQuantity ??
                item.quantity ??
                0
            ),

          pickedQuantity:
            item.pickedQuantity ?? "",

          checkedQuantity:
            item.checkedQuantity ?? "",

          packedQuantity:
            item.packedQuantity ?? "",

          notes:
            item.notes || "",
        }))
      );

      /* ---------------------------------------------------
         STAFF
      --------------------------------------------------- */

      setStaff({
        pickedBy:
          loadedPackingOrder.pickedBy ||
          "",

        checkedBy:
          loadedPackingOrder.checkedBy ||
          "",

        packedBy:
          loadedPackingOrder.packedBy ||
          "",
      });

      /* ---------------------------------------------------
         ADDRESS
      --------------------------------------------------- */

      const address =
        getCustomerAddress(
          loadedQuotation,
          loadedPackingOrder
        );

      setDispatchAddress(
        loadedPackingOrder.dispatchAddress ||
          address ||
          ""
      );

      /* ---------------------------------------------------
         TRANSPORT
      --------------------------------------------------- */

      const loadedMethod =
        getTransportMethod(
          loadedPackingOrder,
          loadedQuotation
        );

      const loadedName =
        getTransportName(
          loadedPackingOrder,
          loadedQuotation
        );

      setTransportName(
        loadedName || ""
      );

      if (
        loadedName &&
        loadedName !== "Other"
      ) {
        const detectedMethod =
          getTransportType(loadedName);

        setTransportMethod(
          detectedMethod ||
            loadedMethod ||
            ""
        );
      } else {
        setTransportMethod(
          loadedMethod || ""
        );
      }

      setCustomTransportMethod(
        loadedPackingOrder.customTransportMethod ||
          ""
      );

      setCustomTransportName(
        loadedPackingOrder.customTransportName ||
          ""
      );

      /* ---------------------------------------------------
         NOTES
      --------------------------------------------------- */

      setNotes(
        loadedPackingOrder.notes || ""
      );

      /* ---------------------------------------------------
         TRANSPORT SLIP
      --------------------------------------------------- */

      const slipPhoto =
        getSlipPhoto(
          loadedPackingOrder
        );

      setTransportPhoto(
        slipPhoto || ""
      );

      setTransportSlipUploaded(
        Boolean(slipPhoto)
      );

      /* ---------------------------------------------------
         CURRENT STAGE
      --------------------------------------------------- */

      if (
        loadedPackingOrder.status ===
          "DISPATCHED" ||
        loadedPackingOrder.status ===
          "DELIVERED" ||
        loadedPackingOrder.dispatchedAt
      ) {
        setStage("done");
      } else if (
        loadedPackingOrder.dispatchLabelPrinted
      ) {
        setStage("transport");
      } else if (
        loadedPackingOrder.packingCompleted ||
        loadedPackingOrder.status === "PACKED"
      ) {
        setStage("label");
      } else {
        setStage("pack");
      }
    } catch (err) {
      console.error(
        "Load packing workflow error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load packing order."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     QUANTITY
  ======================================================= */

  function updateQuantity(
    itemId,
    field,
    value
  ) {
    setItems((previous) =>
      previous.map((item) => {
        if (item.itemId !== itemId) {
          return item;
        }

        /* -----------------------------------------------
           Allow empty input while typing
        ------------------------------------------------ */

        if (value === "") {
          return {
            ...item,
            [field]: "",
          };
        }

        const required =
          Number(item.requiredQuantity);

        let quantity = Number(value);

        /* -----------------------------------------------
           Invalid number
        ------------------------------------------------ */

        if (!Number.isFinite(quantity)) {
          quantity = 0;
        }

        /* -----------------------------------------------
           Whole numbers only
        ------------------------------------------------ */

        quantity = Math.floor(quantity);

        /* -----------------------------------------------
           Never allow negative
        ------------------------------------------------ */

        quantity = Math.max(
          0,
          quantity
        );

        /* -----------------------------------------------
           NEVER exceed required quantity
        ------------------------------------------------ */

        quantity = Math.min(
          quantity,
          required
        );

        /* -----------------------------------------------
           Checked cannot exceed picked
        ------------------------------------------------ */

        if (
          field === "checkedQuantity" &&
          item.pickedQuantity !== "" &&
          item.pickedQuantity !== null &&
          item.pickedQuantity !== undefined
        ) {
          const picked =
            Number(item.pickedQuantity);

          if (Number.isFinite(picked)) {
            quantity = Math.min(
              quantity,
              picked
            );
          }
        }

        /* -----------------------------------------------
           Packed cannot exceed checked
        ------------------------------------------------ */

        if (
          field === "packedQuantity" &&
          item.checkedQuantity !== "" &&
          item.checkedQuantity !== null &&
          item.checkedQuantity !== undefined
        ) {
          const checked =
            Number(item.checkedQuantity);

          if (Number.isFinite(checked)) {
            quantity = Math.min(
              quantity,
              checked
            );
          }
        }

        return {
          ...item,
          [field]: quantity,
        };
      })
    );
  }

  /* =======================================================
     QUANTITY VALIDATION
  ======================================================= */

  function validateQuantities() {
    for (const item of items) {
      const required =
        Number(item.requiredQuantity);

      const picked =
        item.pickedQuantity === "" ||
        item.pickedQuantity === null ||
        item.pickedQuantity === undefined
          ? null
          : Number(item.pickedQuantity);

      const checked =
        item.checkedQuantity === "" ||
        item.checkedQuantity === null ||
        item.checkedQuantity === undefined
          ? null
          : Number(item.checkedQuantity);

      const packed =
        item.packedQuantity === "" ||
        item.packedQuantity === null ||
        item.packedQuantity === undefined
          ? null
          : Number(item.packedQuantity);

      /* -----------------------------------------------
         Required
      ------------------------------------------------ */

      if (
        !Number.isFinite(required) ||
        required < 0
      ) {
        return `Invalid required quantity for ${item.productName || "item"}.`;
      }

      /* -----------------------------------------------
         Picked
      ------------------------------------------------ */

      if (
        picked !== null &&
        (!Number.isFinite(picked) ||
          picked < 0)
      ) {
        return `Invalid picked quantity for ${item.productName || "item"}.`;
      }

      if (
        picked !== null &&
        picked > required
      ) {
        return `Picked quantity cannot exceed required quantity for ${item.productName || "item"}.`;
      }

      /* -----------------------------------------------
         Checked
      ------------------------------------------------ */

      if (
        checked !== null &&
        (!Number.isFinite(checked) ||
          checked < 0)
      ) {
        return `Invalid checked quantity for ${item.productName || "item"}.`;
      }

      if (
        checked !== null &&
        checked > required
      ) {
        return `Checked quantity cannot exceed required quantity for ${item.productName || "item"}.`;
      }

      if (
        checked !== null &&
        picked !== null &&
        checked > picked
      ) {
        return `Checked quantity cannot exceed picked quantity for ${item.productName || "item"}.`;
      }

      /* -----------------------------------------------
         Packed
      ------------------------------------------------ */

      if (
        packed !== null &&
        (!Number.isFinite(packed) ||
          packed < 0)
      ) {
        return `Invalid packed quantity for ${item.productName || "item"}.`;
      }

      if (
        packed !== null &&
        packed > required
      ) {
        return `Packed quantity cannot exceed required quantity for ${item.productName || "item"}.`;
      }

      if (
        packed !== null &&
        checked !== null &&
        packed > checked
      ) {
        return `Packed quantity cannot exceed checked quantity for ${item.productName || "item"}.`;
      }
    }

    return "";
  }

  function rowMatch(
    item,
    field
  ) {
    const value = item[field];

    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return false;
    }

    return (
      Number(value) ===
      Number(item.requiredQuantity)
    );
  }

  function allMatch(field) {
    return (
      items.length > 0 &&
      items.every((item) =>
        rowMatch(item, field)
      )
    );
  }

  const pickingOk =
    allMatch("pickedQuantity");

  const checkingOk =
    allMatch("checkedQuantity");

  const packingOk =
    allMatch("packedQuantity");

  /* =======================================================
     STAFF COMPLETE
  ======================================================= */

  const staffComplete =
    Boolean(
      staff.pickedBy.trim() &&
        staff.checkedBy.trim() &&
        staff.packedBy.trim()
    );

  const overallOk =
    pickingOk &&
    checkingOk &&
    packingOk &&
    staffComplete;

  /* =======================================================
     TOTAL
  ======================================================= */

  const totalRequiredItems =
    useMemo(
      () =>
        items.reduce(
          (total, item) =>
            total +
            Number(
              item.requiredQuantity || 0
            ),
          0
        ),
      [items]
    );

  /* =======================================================
     FINAL TRANSPORT
  ======================================================= */

  const finalTransportMethod =
    transportMethod === "Other"
      ? customTransportMethod.trim()
      : transportMethod.trim();

  const finalTransportName =
    transportName === "Other"
      ? customTransportName.trim()
      : transportName.trim();

  /* =======================================================
     COMPLETE PACKING
  ======================================================= */

  async function saveWorkflow() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!packingOrder?._id) {
        setError(
          "Packing order ID is missing."
        );
        return;
      }

      if (!items.length) {
        setError(
          "No packing items found."
        );
        return;
      }

      /* -----------------------------------------------
         FINAL QUANTITY SAFETY CHECK
      ------------------------------------------------ */

      const quantityError =
        validateQuantities();

      if (quantityError) {
        setError(quantityError);
        return;
      }

      if (!pickingOk) {
        setError(
          "All Picked quantities must exactly match Required quantities."
        );
        return;
      }

      if (!checkingOk) {
        setError(
          "All Checked quantities must exactly match Required quantities."
        );
        return;
      }

      if (!packingOk) {
        setError(
          "All Packed quantities must exactly match Required quantities."
        );
        return;
      }

      if (!staffComplete) {
        setError(
          "Please enter all Employee IDs."
        );
        return;
      }

      if (
        transportName === "Other" &&
        !customTransportName.trim()
      ) {
        setError(
          "Please enter the custom transport name."
        );
        return;
      }

      if (
        transportMethod === "Other" &&
        !customTransportMethod.trim()
      ) {
        setError(
          "Please enter the custom transport method."
        );
        return;
      }

      /* -----------------------------------------------
         SEND CLEAN ITEMS TO BACKEND
      ------------------------------------------------ */

      const cleanItems = items.map((item) => ({
        itemId: item.itemId,

        partNumber: item.partNumber,

        productName: item.productName,

        size: item.size,

        colour: item.colour,

        unit: item.unit,

        requiredQuantity:
          Number(item.requiredQuantity),

        pickedQuantity:
          item.pickedQuantity === ""
            ? null
            : Number(item.pickedQuantity),

        checkedQuantity:
          item.checkedQuantity === ""
            ? null
            : Number(item.checkedQuantity),

        packedQuantity:
          item.packedQuantity === ""
            ? null
            : Number(item.packedQuantity),

        notes: item.notes || "",
      }));

      const response = await api.put(
        `/packing/${packingOrder._id}/workflow`,
        {
          items: cleanItems,

          pickedBy:
            staff.pickedBy.trim(),

          checkedBy:
            staff.checkedBy.trim(),

          packedBy:
            staff.packedBy.trim(),

          dispatchAddress:
            dispatchAddress.trim(),

          transportMethod:
            transportMethod.trim(),

          customTransportMethod:
            transportMethod === "Other"
              ? customTransportMethod.trim()
              : "",

          transportName:
            transportName.trim(),

          customTransportName:
            transportName === "Other"
              ? customTransportName.trim()
              : "",

          notes:
            notes.trim(),
        }
      );

      const updated =
        response.data?.packingOrder;

      if (updated) {
        setPackingOrder(updated);

        /* ---------------------------------------------
           Refresh local item values from backend
        ---------------------------------------------- */

        if (Array.isArray(updated.items)) {
          setItems(
            updated.items.map((item) => ({
              itemId:
                item._id ||
                item.itemId,

              partNumber:
                item.partNumber || "",

              productName:
                item.productName || "",

              size:
                item.size || "",

              colour:
                item.colour || "",

              unit:
                item.unit || "Piece",

              requiredQuantity:
                Number(
                  item.requiredQuantity ?? 0
                ),

              pickedQuantity:
                item.pickedQuantity ?? "",

              checkedQuantity:
                item.checkedQuantity ?? "",

              packedQuantity:
                item.packedQuantity ?? "",

              notes:
                item.notes || "",
            }))
          );
        }
      }

      setSuccess(
        "Packing completed successfully."
      );

      setStage("label");
    } 
    catch (err) {
  console.error("Save packing workflow error:", err);

  console.error(
    "Backend response:",
    err.response?.data
  );

  console.error(
    "Status:",
    err.response?.status
  );

  console.error(
    "Sent request data:",
    err.config?.data
  );

  setError(
    err.response?.data?.message ||
      "Failed to save packing workflow"
  );
}
    
    finally {
      setSaving(false);
    }
  }

  /* =======================================================
     PRINT DISPATCH LABEL
  ======================================================= */

  async function printLabel() {
    try {
      setError("");
      setSuccess("");
      setPrinting(true);

      if (!dispatchAddress?.trim()) {
        setError(
          "Please enter the delivery address."
        );
        return;
      }

      if (!finalTransportName?.trim()) {
        setError(
          "Please select a transport."
        );
        return;
      }

      const quantityError =
        validateQuantities();

      if (quantityError) {
        setError(quantityError);
        return;
      }

      if (
        !pickingOk ||
        !checkingOk ||
        !packingOk
      ) {
        setError(
          "All quantities must match before printing the dispatch label."
        );
        return;
      }

      const label =
        document.getElementById(
          "dispatch-label"
        );

      if (!label) {
        setError(
          "Dispatch label was not found."
        );
        return;
      }

      label.classList.add(
        "dispatch-print-active"
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      window.print();

      setTimeout(() => {
        label.classList.remove(
          "dispatch-print-active"
        );
      }, 500);

      await api.patch(
        `/packing/${packingOrder._id}/dispatch-label`
      );

      setPackingOrder((previous) => ({
        ...previous,

        dispatchLabelPrinted: true,

        dispatchLabelPrintedAt:
          new Date().toISOString(),
      }));

      setSuccess(
        "Dispatch label printed successfully."
      );
    } catch (err) {
      console.error(
        "Dispatch label print error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to print dispatch label."
      );
    } finally {
      setPrinting(false);
    }
  }

  /* =======================================================
     CONTINUE TO TRANSPORT
  ======================================================= */

  function continueToTransport() {
    setError("");
    setSuccess("");

    if (
      !packingOrder?.dispatchLabelPrinted
    ) {
      setError(
        "Please print the dispatch label first."
      );
      return;
    }

    setStage("transport");
  }

  /* =======================================================
     TRANSPORT SLIP PHOTO
  ======================================================= */

  function onPhotoChosen(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (
      !file.type.startsWith("image/")
    ) {
      setError(
        "Please select an image file."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Transport slip photo must be smaller than 5 MB."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setTransportPhoto(
        reader.result
      );

      setTransportSlipUploaded(
        false
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  /* =======================================================
     SAVE TRANSPORT SLIP
  ======================================================= */

  async function saveTransportSlip() {
    try {
      setUploading(true);
      setError("");
      setSuccess("");

      if (!transportPhoto) {
        setError(
          "Please select a transport slip first."
        );

        return;
      }

      if (!packingOrder?._id) {
        setError(
          "Packing order ID is missing."
        );

        return;
      }

      const response =
        await api.post(
          `/packing/${packingOrder._id}/transport-slip`,
          {
            transportSlipPhoto:
              transportPhoto,
          }
        );

      const updated =
        response.data?.packingOrder;

      if (updated) {
        setPackingOrder(updated);

        const savedPhoto =
          getSlipPhoto(updated);

        setTransportPhoto(
          savedPhoto ||
            transportPhoto
        );

        setTransportSlipUploaded(
          Boolean(
            savedPhoto ||
              transportPhoto
          )
        );
      } else {
        setTransportSlipUploaded(
          true
        );
      }

      setSuccess(
        "Transport slip uploaded successfully."
      );

      setStage("dispatch");
    } catch (err) {
      console.error(
        "Save transport slip error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save transport slip."
      );
    } finally {
      setUploading(false);
    }
  }

  /* =======================================================
     SKIP TRANSPORT SLIP
  ======================================================= */

  function skipTransportSlip() {
    setError("");

    setSuccess(
      "Transport slip skipped. You can upload it later."
    );

    setStage("dispatch");
  }

  /* =======================================================
     DISPATCH
  ======================================================= */

  async function dispatchOrder() {
    try {
      setDispatching(true);
      setError("");
      setSuccess("");

      if (!packingOrder?._id) {
        setError(
          "Packing order ID is missing."
        );
        return;
      }

      const quantityError =
        validateQuantities();

      if (quantityError) {
        setError(quantityError);
        return;
      }

      if (!pickingOk) {
        setError(
          "Picking quantities must exactly match required quantities."
        );
        return;
      }

      if (!checkingOk) {
        setError(
          "Checking quantities must exactly match required quantities."
        );
        return;
      }

      if (!packingOk) {
        setError(
          "Packing quantities must exactly match required quantities."
        );
        return;
      }

      if (
        !packingOrder.dispatchLabelPrinted
      ) {
        setError(
          "Please print the dispatch label first."
        );
        return;
      }

      if (!finalTransportName?.trim()) {
        setError(
          "Please select a transport before dispatch."
        );
        return;
      }

      const response =
        await api.patch(
          `/packing/${packingOrder._id}/dispatch`
        );

      const updated =
        response.data?.packingOrder;

      if (updated) {
        setPackingOrder(updated);
      }

      setSuccess(
        "Order dispatched successfully."
      );

      setStage("done");
    } catch (err) {
      console.error(
        "Dispatch order error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to dispatch the order."
      );
    } finally {
      setDispatching(false);
    }
  }

  /* =======================================================
     BACK
  ======================================================= */

  function handleBack() {
    navigate("/packing");
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="pw-page">
        <div className="pw-loading">
          <Loader2
            className="pw-spinner"
            size={34}
          />

          <p>
            Loading packing order...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (!packingOrder) {
    return (
      <div className="pw-page">
        <div className="pw-container">

          <div className="pw-header">

            <div>

              <div className="pw-small-title">
                KICKMAC PACKING
              </div>

              <h1>
                Packing Workflow
              </h1>

              <p>
                Packing order could not be loaded.
              </p>

            </div>

            <button
              type="button"
              className="pw-back-button"
              onClick={handleBack}
            >
              ← Back
            </button>

          </div>

          <div className="pw-alert pw-alert-error">

            <AlertTriangle size={18} />

            <span>
              {error ||
                "Packing order not found."}
            </span>

          </div>

          <button
            type="button"
            className="pw-secondary-button"
            onClick={loadPackingOrder}
          >
            <RefreshCw size={16} />
            Retry
          </button>

        </div>
      </div>
    );
  }

  /* =======================================================
     CUSTOMER INFORMATION
  ======================================================= */

  const customerName =
    getCustomerName(
      quotation,
      packingOrder
    );

  const customerPhone =
    getCustomerPhone(
      quotation,
      packingOrder
    );

  const customerEmail =
    getCustomerEmail(
      quotation,
      packingOrder
    );

  const customerAddress =
    getCustomerAddress(
      quotation,
      packingOrder
    );

  const quotationNumber =
    packingOrder?.quotation
      ?.quotationNumber ||
    quotation?.quotationNumber ||
    packingOrder?.quotationNumber ||
    "-";

  const managerId =
    getManagerId(
      packingOrder
    );

  const orderDateTime =
    getOrderDateTime(
      packingOrder
    );

  const packageCount =
    Number(
      packingOrder.numberOfPackages || 0
    );

  /* =======================================================
     FINAL RENDER
  ======================================================= */

  return (
    <div className="pw-page">

      <div className="pw-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="pw-header">

          <div>

            <div className="pw-small-title">
              {packingOrder.packingNumber}
            </div>

            <div className="pw-title-row">

              <h1>
                Packing Workflow
              </h1>

              <span className="pw-main-status">
                {packingOrder.status}
              </span>

            </div>

            <p>
              Quotation{" "}
              <strong>
                {quotationNumber}
              </strong>
            </p>

          </div>

          <button
            type="button"
            className="pw-back-button"
            onClick={handleBack}
          >
            ← Back to Packing Orders
          </button>

        </div>

        {/* =================================================
            STEPPER
        ================================================= */}

        <Stepper
          stage={
            stage === "done"
              ? "dispatch"
              : stage
          }
        />

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="pw-alert pw-alert-error">

            <AlertTriangle size={18} />

            <span>
              {error}
            </span>

          </div>
        )}

        {success && (
          <div className="pw-alert pw-alert-success">

            <CheckCircle2 size={18} />

            <span>
              {success}
            </span>

          </div>
        )}

        {/* =================================================
            PACKING ORDER SUMMARY
        ================================================= */}

        {stage !== "done" && (
          <section className="pw-card">

            <div className="pw-card-header">

              <div>

                <h2>
                  Packing Order
                </h2>

                <p>
                  Order and customer information
                </p>

              </div>

            </div>

            <div className="pw-summary-grid">

              <div className="pw-summary-item">

                <span>
                  Packing Number
                </span>

                <strong>
                  {packingOrder.packingNumber || "-"}
                </strong>

              </div>

              <div className="pw-summary-item">

                <span>
                  Quotation
                </span>

                <strong>
                  {quotationNumber}
                </strong>

              </div>

              <div className="pw-summary-item">

                <span>
                  Customer
                </span>

                <strong>
                  {customerName}
                </strong>

              </div>

              <div className="pw-summary-item">

                <span>
                  Phone
                </span>

                <strong>
                  {customerPhone || "-"}
                </strong>

              </div>

              <div className="pw-summary-item">

                <span>
                  Email ID
                </span>

                <strong>
                  {customerEmail || "-"}
                </strong>

              </div>

              <div className="pw-summary-item">

                <span>
                  Manager ID
                </span>

                <strong>
                  {managerId}
                </strong>

              </div>

              <div className="pw-summary-item">

                <span>
                  Date & Time
                </span>

                <strong>
                  {formatDateTime(
                    orderDateTime
                  )}
                </strong>

              </div>

              <div className="pw-summary-item pw-summary-address">

                <span>
                  Customer Address
                </span>

                <strong>
                  {customerAddress ||
                    "Address not available"}
                </strong>

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            STAGE 1 — ITEMS / PACKING
        ================================================= */}

        {stage === "pack" && (

          <div className="pw-stage">

            {/* ITEMS */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Items to Pack
                  </h2>

                  <p>
                    Required quantity must exactly
                    match Picked, Checked and Packed.
                  </p>

                </div>

                <div className="pw-total-items">

                  <span>
                    Total Required
                  </span>

                  <strong>
                    {totalRequiredItems}
                  </strong>

                </div>

              </div>

              <div className="pw-table-wrapper">

                <table className="pw-table">

                  <thead>

                    <tr>
                      <th>Part No</th>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Colour</th>
                      <th>Required</th>
                      <th>Unit</th>
                      <th>Picked</th>
                      <th>Checked</th>
                      <th>Packed</th>
                      <th>Result</th>
                    </tr>

                  </thead>

                  <tbody>

                    {items.map((item) => {

                      const pickedMatch =
                        rowMatch(
                          item,
                          "pickedQuantity"
                        );

                      const checkedMatch =
                        rowMatch(
                          item,
                          "checkedQuantity"
                        );

                      const packedMatch =
                        rowMatch(
                          item,
                          "packedQuantity"
                        );

                      const pickedEntered =
                        item.pickedQuantity !== "";

                      const checkedEntered =
                        item.checkedQuantity !== "";

                      const packedEntered =
                        item.packedQuantity !== "";

                      const rowComplete =
                        pickedEntered &&
                        checkedEntered &&
                        packedEntered;

                      const rowOk =
                        pickedMatch &&
                        checkedMatch &&
                        packedMatch;

                      return (

                        <tr
                          key={item.itemId}
                          className={
                            rowOk
                              ? "pw-item-row-match"
                              : ""
                          }
                        >

                          <td className="pw-part-number-cell">

                            <strong>
                              {item.partNumber || "-"}
                            </strong>

                          </td>

                          <td className="pw-product-cell">

                            <strong>
                              {item.productName || "-"}
                            </strong>

                          </td>

                          <td>
                            {item.size || "-"}
                          </td>

                          <td>
                            {item.colour || "-"}
                          </td>

                          <td className="pw-required-cell">

                            <strong>
                              {item.requiredQuantity}
                            </strong>

                          </td>

                          <td>
                            {item.unit || "Piece"}
                          </td>

                          {/* PICKED */}

                          <td>

                            <div className="pw-quantity-control">

                              <input
                                className={
                                  pickedMatch
                                    ? "pw-qty-input pw-match"
                                    : pickedEntered
                                    ? "pw-qty-input pw-mismatch"
                                    : "pw-qty-input"
                                }
                                type="number"
                                min="0"
                                max={item.requiredQuantity}
                                step="1"
                                value={
                                  item.pickedQuantity
                                }
                                onChange={(event) =>
                                  updateQuantity(
                                    item.itemId,
                                    "pickedQuantity",
                                    event.target.value
                                  )
                                }
                              />

                              <QuantityStatus
                                item={item}
                                field="pickedQuantity"
                              />

                            </div>

                          </td>

                          {/* CHECKED */}

                          <td>

                            <div className="pw-quantity-control">

                              <input
                                className={
                                  checkedMatch
                                    ? "pw-qty-input pw-match"
                                    : checkedEntered
                                    ? "pw-qty-input pw-mismatch"
                                    : "pw-qty-input"
                                }
                                type="number"
                                min="0"
                                max={item.requiredQuantity}
                                step="1"
                                value={
                                  item.checkedQuantity
                                }
                                onChange={(event) =>
                                  updateQuantity(
                                    item.itemId,
                                    "checkedQuantity",
                                    event.target.value
                                  )
                                }
                              />

                              <QuantityStatus
                                item={item}
                                field="checkedQuantity"
                              />

                            </div>

                          </td>

                          {/* PACKED */}

                          <td>

                            <div className="pw-quantity-control">

                              <input
                                className={
                                  packedMatch
                                    ? "pw-qty-input pw-match"
                                    : packedEntered
                                    ? "pw-qty-input pw-mismatch"
                                    : "pw-qty-input"
                                }
                                type="number"
                                min="0"
                                max={item.requiredQuantity}
                                step="1"
                                value={
                                  item.packedQuantity
                                }
                                onChange={(event) =>
                                  updateQuantity(
                                    item.itemId,
                                    "packedQuantity",
                                    event.target.value
                                  )
                                }
                              />

                              <QuantityStatus
                                item={item}
                                field="packedQuantity"
                              />

                            </div>

                          </td>

                          {/* RESULT */}

                          <td>

                            {!rowComplete ? (

                              <span className="pw-result-pending">
                                PENDING
                              </span>

                            ) : rowOk ? (

                              <span className="pw-result-match">
                                <Check size={15} />
                                MATCH
                              </span>

                            ) : (

                              <span className="pw-result-mismatch">
                                <X size={15} />
                                MISMATCH
                              </span>

                            )}

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

            </section>

            {/* EMPLOYEE SIGN-OFF */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Employee Sign-off
                  </h2>

                  <p>
                    Enter a separate employee ID for
                    each packing stage.
                  </p>

                </div>

              </div>

              <div className="pw-form-grid">

                <div className="pw-form-group">

                  <label>
                    Picked By Employee ID
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Example: EMP001"
                    value={staff.pickedBy}
                    className={
                      staff.pickedBy.trim()
                        ? "pw-employee-input pw-employee-green"
                        : "pw-employee-input pw-employee-red"
                    }
                    onChange={(event) =>
                      handleStaffChange(
                        "pickedBy",
                        event.target.value
                      )
                    }
                  />

                  <small className="pw-employee-help">
                    Employee responsible for picking.
                  </small>

                </div>

                <div className="pw-form-group">

                  <label>
                    Checked By Employee ID
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Example: EMP002"
                    value={staff.checkedBy}
                    className={
                      staff.checkedBy.trim()
                        ? "pw-employee-input pw-employee-green"
                        : "pw-employee-input pw-employee-red"
                    }
                    onChange={(event) =>
                      handleStaffChange(
                        "checkedBy",
                        event.target.value
                      )
                    }
                  />

                  <small className="pw-employee-help">
                    Employee responsible for checking.
                  </small>

                </div>

                <div className="pw-form-group">

                  <label>
                    Packed By Employee ID
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Example: EMP003"
                    value={staff.packedBy}
                    className={
                      staff.packedBy.trim()
                        ? "pw-employee-input pw-employee-green"
                        : "pw-employee-input pw-employee-red"
                    }
                    onChange={(event) =>
                      handleStaffChange(
                        "packedBy",
                        event.target.value
                      )
                    }
                  />

                  <small className="pw-employee-help">
                    Employee responsible for packing.
                  </small>

                </div>

              </div>

              <div className="pw-status-row">

                <StatusPill
                  ok={Boolean(
                    staff.pickedBy.trim()
                  )}
                  label={
                    staff.pickedBy.trim()
                      ? `Picking: ${staff.pickedBy}`
                      : "Picking Employee Required"
                  }
                />

                <StatusPill
                  ok={Boolean(
                    staff.checkedBy.trim()
                  )}
                  label={
                    staff.checkedBy.trim()
                      ? `Checking: ${staff.checkedBy}`
                      : "Checking Employee Required"
                  }
                />

                <StatusPill
                  ok={Boolean(
                    staff.packedBy.trim()
                  )}
                  label={
                    staff.packedBy.trim()
                      ? `Packing: ${staff.packedBy}`
                      : "Packing Employee Required"
                  }
                />

              </div>

              <div className="pw-status-row">

                <StatusPill
                  ok={pickingOk}
                  label={
                    pickingOk
                      ? "Picking Quantity MATCH"
                      : "Picking Quantity Pending"
                  }
                />

                <StatusPill
                  ok={checkingOk}
                  label={
                    checkingOk
                      ? "Checking Quantity MATCH"
                      : "Checking Quantity Pending"
                  }
                />

                <StatusPill
                  ok={packingOk}
                  label={
                    packingOk
                      ? "Packing Quantity MATCH"
                      : "Packing Quantity Pending"
                  }
                />

              </div>

            </section>

            {/* TRANSPORT */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Transport & Delivery
                  </h2>

                  <p>
                    Transport information selected
                    for this quotation.
                  </p>

                </div>

              </div>

              <div className="pw-form-grid">

                <div className="pw-form-group">

                  <label>
                    Transport Method
                  </label>

                  <input
                    type="text"
                    value={
                      finalTransportMethod
                    }
                    placeholder="Transport method"
                    readOnly={
                      Boolean(
                        transportName &&
                        transportName !== "Other"
                      )
                    }
                    onChange={(event) =>
                      setTransportMethod(
                        event.target.value
                      )
                    }
                  />

                  {transportName === "Other" && (
                    <input
                      type="text"
                      value={
                        customTransportMethod
                      }
                      placeholder="Enter transport method"
                      onChange={(event) =>
                        setCustomTransportMethod(
                          event.target.value
                        )
                      }
                    />
                  )}

                </div>

                <div className="pw-form-group">

                  <label>
                    Transport Name
                  </label>

                  <select
                    value={transportName}
                    onChange={(event) =>
                      handleTransportNameChange(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Select Transport
                    </option>

                    {TRANSPORT_NAME_OPTIONS.map(
                      (transport) => (
                        <option
                          key={transport}
                          value={transport}
                        >
                          {transport}
                        </option>
                      )
                    )}

                  </select>

                  {transportName === "Other" && (
                    <input
                      type="text"
                      value={
                        customTransportName
                      }
                      placeholder="Enter transport name manually"
                      onChange={(event) =>
                        setCustomTransportName(
                          event.target.value
                        )
                      }
                    />
                  )}

                </div>

                <div className="pw-form-group pw-full">

                  <label>
                    Customer Delivery Address
                  </label>

                  <textarea
                    rows="4"
                    placeholder={
                      customerAddress ||
                      "Enter customer delivery address"
                    }
                    value={
                      dispatchAddress
                    }
                    onChange={(event) =>
                      setDispatchAddress(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              <div className="pw-transport-preview">

                <div>

                  <span>
                    Transport Method
                  </span>

                  <strong>
                    {finalTransportMethod || "-"}
                  </strong>

                </div>

                <div>

                  <span>
                    Transport Name
                  </span>

                  <strong>
                    {finalTransportName || "-"}
                  </strong>

                </div>

                <div>

                  <span>
                    Packages
                  </span>

                  <strong>
                    {packageCount}{" "}
                    {packingOrder.packageType ||
                      "Packages"}
                  </strong>

                </div>

              </div>

            </section>

            {/* NOTES */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Note
                  </h2>

                  <p>
                    Add any packing or dispatch note.
                  </p>

                </div>

              </div>

              <div className="pw-form-group">

                <textarea
                  rows="4"
                  placeholder="Enter note..."
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                />

              </div>

            </section>

            {/* COMPLETE */}

            <section className="pw-complete-card">

              <div>

                <span>
                  Overall Status
                </span>

                <strong
                  className={
                    overallOk
                      ? "pw-ready"
                      : "pw-not-ready"
                  }
                >
                  {overallOk
                    ? "READY TO COMPLETE"
                    : "INCOMPLETE"}
                </strong>

              </div>

              <button
                type="button"
                onClick={saveWorkflow}
                disabled={
                  saving ||
                  !overallOk
                }
                className="pw-primary-button"
              >

                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="pw-button-spinner"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Complete Packing
                    <ArrowRight size={17} />
                  </>
                )}

              </button>

            </section>

          </div>
        )}

        {/* =================================================
            STAGE 2 — DISPATCH LABEL
        ================================================= */}

        {stage === "label" && (

          <div className="pw-stage">

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Dispatch Label
                  </h2>

                  <p>
                    Confirm the delivery address,
                    transport and print the 6 × 4
                    dispatch label.
                  </p>

                </div>

              </div>

              {/* ADDRESS */}

              <div className="pw-form-group">

                <label>
                  Customer Delivery Address
                  <span>*</span>
                </label>

                <textarea
                  rows="4"
                  value={dispatchAddress}
                  onChange={(event) =>
                    setDispatchAddress(
                      event.target.value
                    )
                  }
                  placeholder={
                    customerAddress ||
                    "Enter delivery address manually"
                  }
                />

              </div>

              {/* TRANSPORT */}

              <div className="pw-form-group pw-label-transport-selector">

                <label>
                  Transport Name
                  <span>*</span>
                </label>

                <select
                  value={transportName}
                  onChange={(event) =>
                    handleTransportNameChange(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select Transport
                  </option>

                  {TRANSPORT_NAME_OPTIONS.map(
                    (transport) => (
                      <option
                        key={transport}
                        value={transport}
                      >
                        {transport}
                      </option>
                    )
                  )}

                </select>

                {transportName === "Other" && (
                  <input
                    type="text"
                    value={
                      customTransportName
                    }
                    placeholder="Enter transport name manually"
                    onChange={(event) =>
                      setCustomTransportName(
                        event.target.value
                      )
                    }
                  />
                )}

                <div className="pw-label-transport-info">

                  <span>
                    Transport Method
                  </span>

                  <strong>
                    {finalTransportMethod || "-"}
                  </strong>

                </div>

              </div>

              {/* =================================================
                  6 × 4 DISPATCH LABEL
              ================================================= */}

              <div
                id="dispatch-label"
                className="pw-dispatch-label"
              >

                {/* TITLE */}

                <div className="pw-label-title">
                  DISPATCH LABEL
                </div>

                {/* TOP RIGHT TRANSPORT */}

                <div className="pw-label-transport-top">

                  <span>
                    TRANSPORT METHOD:
                  </span>

                  <strong>
                    {finalTransportMethod || "-"}
                  </strong>

                </div>

                {/* TRANSPORT NAME */}

                <div className="pw-label-transport-main">

                  {finalTransportName || "-"}

                </div>

                {/* REFERENCE ROW */}

                <div className="pw-label-reference">

                  <div>

                    <span>
                      PACKING NO
                    </span>

                    <strong>
                      {packingOrder.packingNumber ||
                        "-"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      QUOTATION NO
                    </span>

                    <strong>
                      {quotationNumber}
                    </strong>

                  </div>

                  <div>

                    <span>
                      BAGS
                    </span>

                    <strong>
                      {packageCount}
                    </strong>

                  </div>

                </div>

                {/* TO */}

                <div className="pw-label-to-section">

                  <div className="pw-label-caption">
                    TO
                  </div>

                  <div className="pw-label-customer-name">
                    {customerName || "-"}
                  </div>

                  <div className="pw-label-phone">
                    {customerPhone || "-"}
                  </div>

                </div>

                {/* DELIVERY ADDRESS */}

                <div className="pw-label-address-box">

                  <div className="pw-label-caption">
                    DELIVERY ADDRESS
                  </div>

                  <div className="pw-label-address-value">

                    {dispatchAddress ||
                      customerAddress ||
                      "Customer address"}

                  </div>

                </div>

                {/* FROM */}

                <div className="pw-label-from-box">

                  <div className="pw-label-caption">
                    FROM
                  </div>

                  <div className="pw-label-from-company">
                    KICKMAC SOLUTIONS
                  </div>

                  <div className="pw-label-from-location">
                    BENGALURU - 560057
                  </div>

                  <div className="pw-label-from-phone">
                    PHONE: 9900400452
                  </div>

                </div>

              </div>

            </section>

            {/* ACTIONS */}

            <div className="pw-actions">

              <button
                type="button"
                className="pw-secondary-button"
                onClick={() =>
                  setStage("pack")
                }
              >
                ← Back
              </button>

              <button
                type="button"
                className="pw-primary-button"
                onClick={printLabel}
                disabled={
                  printing
                }
              >

                {printing ? (
                  <>
                    <Loader2
                      size={17}
                      className="pw-button-spinner"
                    />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer size={17} />
                    Print Label
                  </>
                )}

              </button>

              <button
                type="button"
                className="pw-primary-button"
                onClick={
                  continueToTransport
                }
                disabled={
                  !packingOrder.dispatchLabelPrinted
                }
              >
                Transport Slip
                <ArrowRight size={17} />
              </button>

            </div>

            {!packingOrder.dispatchLabelPrinted && (
              <div className="pw-label-warning">

                <AlertTriangle size={17} />

                <span>
                  Print the dispatch label before
                  continuing to the transport slip.
                </span>

              </div>
            )}

          </div>
        )}

        {/* =================================================
            STAGE 3 — TRANSPORT SLIP
        ================================================= */}

        {stage === "transport" && (

          <div className="pw-stage">

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Add Transport Slip
                  </h2>

                  <p>
                    Upload the transporter slip now
                    or skip and upload it later.
                  </p>

                </div>

              </div>

              <div
                className={
                  transportSlipUploaded
                    ? "transport-slip-status uploaded"
                    : "transport-slip-status pending"
                }
              >

                <span className="transport-slip-status-icon">

                  {transportSlipUploaded
                    ? "✓"
                    : "!"}

                </span>

                <div>

                  <strong>
                    {transportSlipUploaded
                      ? "Transport Slip Uploaded"
                      : "Transport Slip Not Uploaded"}
                  </strong>

                  <small>
                    {transportSlipUploaded
                      ? "Slip has been uploaded successfully."
                      : "Transporter can provide the slip later."}
                  </small>

                </div>

              </div>

              {/* FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPhotoChosen}
                className="pw-hidden-input"
              />

              {/* PHOTO */}

              {!transportPhoto ? (

                <button
                  type="button"
                  className="pw-photo-upload"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >

                  <Camera size={30} />

                  <strong>
                    Take / Upload Transport Slip
                  </strong>

                  <span>
                    JPG, PNG or other image up to 5 MB
                  </span>

                </button>

              ) : (

                <div className="pw-photo-preview">

                  <img
                    src={transportPhoto}
                    alt="Transport slip"
                  />

                  {!transportSlipUploaded && (
                    <button
                      type="button"
                      className="pw-secondary-button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >

                      <Camera size={16} />

                      Replace Photo

                    </button>
                  )}

                </div>

              )}

            </section>

            {/* ACTIONS */}

            <div className="pw-actions">

              <button
                type="button"
                className="pw-secondary-button"
                onClick={() =>
                  setStage("label")
                }
              >
                ← Back
              </button>

              {!transportSlipUploaded &&
                transportPhoto && (

                  <button
                    type="button"
                    className="pw-primary-button"
                    disabled={uploading}
                    onClick={
                      saveTransportSlip
                    }
                  >

                    {uploading ? (
                      <>
                        <Loader2
                          size={17}
                          className="pw-button-spinner"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Upload Transport Slip
                      </>
                    )}

                  </button>

                )}

              {!transportSlipUploaded && (

                <button
                  type="button"
                  className="pw-secondary-button"
                  onClick={
                    skipTransportSlip
                  }
                >
                  Skip / Upload Later
                  <ArrowRight size={17} />
                </button>

              )}

              {transportSlipUploaded && (

                <button
                  type="button"
                  className="pw-primary-button"
                  onClick={() =>
                    setStage("dispatch")
                  }
                >
                  Continue to Dispatch
                  <ArrowRight size={17} />
                </button>

              )}

            </div>

          </div>

        )}

        {/* =================================================
            STAGE 4 — DISPATCH
        ================================================= */}

        {stage === "dispatch" && (

          <DispatchSection
            packingOrder={packingOrder}
            quotation={quotation}
            dispatchAddress={dispatchAddress}
            setDispatchAddress={
              setDispatchAddress
            }
            transportName={transportName}
            setTransportName={
              setTransportName
            }
            customTransportName={
              customTransportName
            }
            setCustomTransportName={
              setCustomTransportName
            }
            finalTransportMethod={
              finalTransportMethod
            }
            finalTransportName={
              finalTransportName
            }
            printing={printing}
            uploading={uploading}
            dispatching={dispatching}
            transportPhoto={
              transportPhoto
            }
            transportSlipUploaded={
              transportSlipUploaded
            }
            onSelectSlip={
              onPhotoChosen
            }
            onPrintLabel={
              printLabel
            }
            onUploadSlip={() => {

              if (transportPhoto) {
                saveTransportSlip();
              } else {
                setError(
                  "Please select a transport slip first."
                );
              }

            }}
            onSkipSlip={
              skipTransportSlip
            }
            onDispatch={
              dispatchOrder
            }
          />

        )}

        {/* =================================================
            DONE
        ================================================= */}

        {stage === "done" && (

          <section className="pw-complete-screen">

            <CheckCircle2 size={54} />

            <h2>
              Packing & Dispatch Complete
            </h2>

            <p>
              {packingOrder.packingNumber} has
              been packed, labelled and dispatched.
            </p>

            <div className="pw-done-details">

              <div>

                <span>
                  Status
                </span>

                <strong>
                  DISPATCHED
                </strong>

              </div>

              <div>

                <span>
                  Packing No
                </span>

                <strong>
                  {packingOrder.packingNumber || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Quotation No
                </span>

                <strong>
                  {quotationNumber}
                </strong>

              </div>

              <div>

                <span>
                  Customer
                </span>

                <strong>
                  {customerName}
                </strong>

              </div>

              <div>

                <span>
                  Phone
                </span>

                <strong>
                  {customerPhone || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Picking Employee
                </span>

                <strong>
                  {staff.pickedBy || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Checking Employee
                </span>

                <strong>
                  {staff.checkedBy || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Packing Employee
                </span>

                <strong>
                  {staff.packedBy || "-"}
                </strong>

              </div>

              <div>

                <span>
                  Transport
                </span>

                <strong>
                  {finalTransportName ||
                    finalTransportMethod ||
                    "-"}
                </strong>

              </div>

              <div>

                <span>
                  Packages
                </span>

                <strong>
                  {packageCount}{" "}
                  {packingOrder.packageType ||
                    "Packages"}
                </strong>

              </div>

              <div>

                <span>
                  Transport Slip
                </span>

                <strong
                  className={
                    transportSlipUploaded
                      ? "pw-slip-green"
                      : "pw-slip-red"
                  }
                >
                  {transportSlipUploaded
                    ? "✓ UPLOADED"
                    : "! NOT UPLOADED"}
                </strong>

              </div>

              <div>

                <span>
                  Dispatched At
                </span>

                <strong>
                  {formatDateTime(
                    packingOrder.dispatchedAt
                  )}
                </strong>

              </div>

            </div>

            <button
              type="button"
              className="pw-primary-button"
              onClick={handleBack}
            >
              Back to Packing Orders
              <ArrowRight size={17} />
            </button>

          </section>

        )}

      </div>

    </div>
  );
}
