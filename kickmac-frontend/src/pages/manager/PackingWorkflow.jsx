import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  X,
  Printer,
  Camera,
  ArrowRight,
  PackageCheck,
  Truck,
  CheckCircle2,
  Save,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";
import "./PackingWorkflow.css";

/* =========================================================
   OPTIONS
========================================================= */

const TRANSPORT_METHODS = [
  "Courier",
  "Own Vehicle",
  "Customer Pickup",
  "Transport",
  "Other",
];

const TRANSPORT_NAMES = [
  "MSS",
  "VRL",
  " SLV","A1",
  "Seabird",
  "Porter",
  "Other",
];

const PACKAGE_TYPES = [
  "Bags",
  "Boxes",
  "Covers",
  "Packages",
  "Other",
];

/* =========================================================
   HELPERS
========================================================= */

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getCustomerName(quotation) {
  return (
    quotation?.customerName ||
    quotation?.customer?.name ||
    "Unknown Customer"
  );
}

function getCustomerPhone(quotation) {
  return (
    quotation?.customerPhone ||
    quotation?.customer?.phone ||
    ""
  );
}

function getCustomerEmail(quotation) {
  return (
    quotation?.customerEmail ||
    quotation?.customer?.email ||
    ""
  );
}

function getCustomerAddress(quotation) {
  return (
    quotation?.customerAddress ||
    quotation?.customer?.address ||
    quotation?.deliveryAddress ||
    ""
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
      {ok ? <Check size={14} /> : null}
      {label}
    </span>
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

  return isMatch ? (
    <span className="pw-quantity-match">
      <Check size={14} />
      MATCH
    </span>
  ) : (
    <span className="pw-quantity-mismatch">
      <X size={14} />
      MISMATCH
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
          <React.Fragment key={step.key}>
            <div
              className={[
                "pw-step",
                active ? "pw-step-active" : "",
                done ? "pw-step-done" : "",
              ].join(" ")}
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
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function PackingWorkflow() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const packingId =
    searchParams.get("packingId");

  const quotationId =
    searchParams.get("quotationId");

  const [packingOrder, setPackingOrder] =
    useState(null);

  const [quotation, setQuotation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [dispatching, setDispatching] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [stage, setStage] =
    useState("pack");

  const [items, setItems] =
    useState([]);

  const [staff, setStaff] =
    useState({
      pickedBy: "",
      checkedBy: "",
      packedBy: "",
    });

  const [dispatchAddress, setDispatchAddress] =
    useState("");

  const [transportMethod, setTransportMethod] =
    useState("");

  const [customTransportMethod, setCustomTransportMethod] =
    useState("");

  const [transportName, setTransportName] =
    useState("");

  const [customTransportName, setCustomTransportName] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [transportPhoto, setTransportPhoto] =
    useState("");

  const [transportPhotoFile, setTransportPhotoFile] =
    useState(null);

  const fileInputRef =
    useRef(null);

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    loadPackingOrder();
  }, [packingId, quotationId]);

  async function loadPackingOrder() {
    try {
      setLoading(true);
      setError("");

      let loadedPackingOrder = null;

      /* Existing packing order */

      if (packingId) {
        const response = await api.get(
          `/packing/${packingId}`
        );

        loadedPackingOrder =
          response.data?.packingOrder ||
          response.data?.data ||
          response.data;
      }

      /* If no packingId, load quotation */

      else if (quotationId) {
        const response = await api.get(
          `/quotations/${quotationId}`
        );

        const loadedQuotation =
          response.data?.quotation ||
          response.data?.data ||
          response.data;

        setQuotation(loadedQuotation);
      }

      /* Loaded packing order */

      if (loadedPackingOrder) {
        setPackingOrder(
          loadedPackingOrder
        );

        const loadedQuotation =
          loadedPackingOrder.quotation;

        if (
          loadedQuotation &&
          typeof loadedQuotation === "object"
        ) {
          setQuotation(
            loadedQuotation
          );
        }

        /* ============================
           ITEMS
        ============================ */

        const loadedItems =
          loadedPackingOrder.items || [];

        setItems(
          loadedItems.map((item) => ({
            itemId: item._id,

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
              item.pickedQuantity ??
              "",

            checkedQuantity:
              item.checkedQuantity ??
              "",

            packedQuantity:
              item.packedQuantity ??
              "",

            notes:
              item.notes || "",
          }))
        );

        /* ============================
           STAFF
        ============================ */

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

        /* ============================
           OTHER DETAILS
        ============================ */

        setDispatchAddress(
          loadedPackingOrder.dispatchAddress ||
            ""
        );

        setTransportMethod(
          loadedPackingOrder.transportMethod ||
            ""
        );

        setCustomTransportMethod(
          loadedPackingOrder.customTransportMethod ||
            ""
        );

        setTransportName(
          loadedPackingOrder.transportName ||
            ""
        );

        setCustomTransportName(
          loadedPackingOrder.customTransportName ||
            ""
        );

        setNotes(
          loadedPackingOrder.notes ||
            ""
        );

        setTransportPhoto(
          loadedPackingOrder.transportSlipPhoto ||
            ""
        );

        /* ============================
           CURRENT STAGE
        ============================ */

        if (
          loadedPackingOrder.dispatchLabelPrinted
        ) {
          setStage("transport");
        } else {
          setStage("pack");
        }
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
     ITEM UPDATE
  ======================================================= */

  function updateQuantity(
    itemId,
    field,
    value
  ) {
    setItems((previous) =>
      previous.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              [field]:
                value === ""
                  ? ""
                  : Math.max(
                      0,
                      Number(value)
                    ),
            }
          : item
      )
    );
  }

  /* =======================================================
     MATCH
  ======================================================= */

  function rowMatch(item, field) {
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
     TOTAL ITEMS
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
     TRANSPORT DISPLAY
  ======================================================= */

  const finalTransportMethod =
    transportMethod === "Other"
      ? customTransportMethod.trim()
      : transportMethod;

  const finalTransportName =
    transportName === "Other"
      ? customTransportName.trim()
      : transportName;

  /* =======================================================
     SAVE WORKFLOW
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

      if (!pickingOk) {
        setError(
          "All Picked quantities must match the Required quantities."
        );
        return;
      }

      if (!checkingOk) {
        setError(
          "All Checked quantities must match the Required quantities."
        );
        return;
      }

      if (!packingOk) {
        setError(
          "All Packed quantities must match the Required quantities."
        );
        return;
      }

      if (!staffComplete) {
        setError(
          "Please enter Picked By, Checked By and Packed By."
        );
        return;
      }

      const response =
        await api.put(
          `/packing/${packingOrder._id}/workflow`,
          {
            items,

            pickedBy:
              staff.pickedBy.trim(),

            checkedBy:
              staff.checkedBy.trim(),

            packedBy:
              staff.packedBy.trim(),

            dispatchAddress:
              dispatchAddress.trim(),

            transportMethod,

            customTransportMethod:
              transportMethod === "Other"
                ? customTransportMethod.trim()
                : "",

            transportName,

            customTransportName:
              transportName === "Other"
                ? customTransportName.trim()
                : "",

            notes: notes.trim(),
          }
        );

      const updated =
        response.data?.packingOrder;

      if (updated) {
        setPackingOrder(updated);
      }

      setSuccess(
        "Packing quantities saved successfully."
      );

      setStage("label");
    } catch (err) {
      console.error(
        "Save packing workflow error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save packing workflow."
      );
    } finally {
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

      if (!dispatchAddress.trim()) {
        setError(
          "Please enter the customer delivery address before printing."
        );
        return;
      }

      window.print();

      if (packingOrder?._id) {
        await api.patch(
          `/packing/${packingOrder._id}/dispatch-label`
        );

        setPackingOrder(
          (previous) =>
            previous
              ? {
                  ...previous,
                  dispatchLabelPrinted:
                    true,

                  dispatchLabelPrintedAt:
                    new Date().toISOString(),
                }
              : previous
        );
      }

      setSuccess(
        "Dispatch label printed successfully."
      );
    } catch (err) {
      console.error(
        "Print label error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Label was printed, but the print status could not be saved."
      );
    }
  }

  /* =======================================================
     CONTINUE TO TRANSPORT
  ======================================================= */

  async function continueToTransport() {
    if (
      !packingOrder?.dispatchLabelPrinted
    ) {
      setError(
        "Please print the dispatch label first."
      );
      return;
    }

    try {
      setDispatching(true);
      setError("");
      setSuccess("");

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
        "Bag marked as dispatched."
      );

      setStage("transport");
    } catch (err) {
      console.error(
        "Mark dispatched error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to mark the order as dispatched."
      );
    } finally {
      setDispatching(false);
    }
  }

  /* =======================================================
     PHOTO
  ======================================================= */

  function onPhotoChosen(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
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

    setTransportPhotoFile(file);

    const reader =
      new FileReader();

    reader.onload = () => {
      setTransportPhoto(
        reader.result
      );
    };

    reader.readAsDataURL(file);
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
          "Please take or upload the transport slip photo."
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
      }

      setSuccess(
        "Transport slip saved successfully."
      );

      setStage("done");
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

  function skipTransportSlipForNow() {
    setError("");

    navigate("/manager/packing");
  }

  /* =======================================================
     BACK
  ======================================================= */

  function handleBack() {
    navigate(
      "/manager/packing"
    );
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
            size={32}
          />

          <p>
            Loading packing order...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR WITHOUT DATA
  ======================================================= */

  if (!packingOrder) {
    return (
      <div className="pw-page">
        <div className="pw-container">

          <div className="pw-header">
            <div>
              <h1>
                Packing Workflow
              </h1>

              <p>
                Packing order could not
                be loaded.
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
            <AlertTriangle
              size={18}
            />

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
     CUSTOMER
  ======================================================= */

  const customerName =
    packingOrder.customerName ||
    getCustomerName(quotation);

  const customerPhone =
    packingOrder.customerPhone ||
    getCustomerPhone(quotation);

  const customerEmail =
    packingOrder.customerEmail ||
    getCustomerEmail(quotation);

  const customerAddress =
    getCustomerAddress(quotation);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="pw-page">

      <div className="pw-container">

        {/* HEADER */}

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
                {packingOrder.quotation?.quotationNumber ||
                  quotation?.quotationNumber ||
                  "-"}
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

        {/* STEPPER */}

        <Stepper
          stage={
            stage === "done"
              ? "transport"
              : stage
          }
        />

        {/* ALERT */}

        {error && (
          <div className="pw-alert pw-alert-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="pw-alert pw-alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* =================================================
            ORDER SUMMARY
        ================================================= */}

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
                {packingOrder.packingNumber}
              </strong>
            </div>

            <div className="pw-summary-item">
              <span>
                Quotation
              </span>

              <strong>
                {packingOrder.quotation?.quotationNumber ||
                  quotation?.quotationNumber ||
                  "-"}
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
                Email
              </span>

              <strong>
                {customerEmail || "-"}
              </strong>
            </div>

            <div className="pw-summary-item">
              <span>
                Created
              </span>

              <strong>
                {formatDateTime(
                  packingOrder.createdAt
                )}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            STAGE 1
        ================================================= */}

        {stage === "pack" && (

          <div className="pw-stage">

            {/* =================================================
                ITEMS TO PACK
            ================================================= */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Items to Pack
                  </h2>

                  <p>
                    Enter the actual picked,
                    checked and packed quantities.
                  </p>

                </div>

                <div className="pw-total-items">

                  <span>
                    Total Items
                  </span>

                  <strong>
                    {totalRequiredItems}
                  </strong>

                </div>

              </div>

              <div className="pw-table-wrapper">

                <table className="pw-table pw-items-table">

                  <thead>

                    <tr>

                      <th>
                        Part No
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        Size
                      </th>

                      <th>
                        Colour
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Unit
                      </th>

                      <th>
                        Picked
                      </th>

                      <th>
                        Checked
                      </th>

                      <th>
                        Packed
                      </th>

                      <th>
                        Result
                      </th>

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
                        item.pickedQuantity !== "" &&
                        item.pickedQuantity !== null &&
                        item.pickedQuantity !== undefined;

                      const checkedEntered =
                        item.checkedQuantity !== "" &&
                        item.checkedQuantity !== null &&
                        item.checkedQuantity !== undefined;

                      const packedEntered =
                        item.packedQuantity !== "" &&
                        item.packedQuantity !== null &&
                        item.packedQuantity !== undefined;

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

                          {/* PART NUMBER */}

                          <td className="pw-part-number-cell">

                            <strong>
                              {item.partNumber || "-"}
                            </strong>

                          </td>

                          {/* PRODUCT */}

                          <td className="pw-product-cell">

                            <strong>
                              {item.productName || "-"}
                            </strong>

                          </td>

                          {/* SIZE */}

                          <td className="pw-size-cell">

                            {item.size || "-"}

                          </td>

                          {/* COLOUR */}

                          <td className="pw-colour-cell">

                            {item.colour || "-"}

                          </td>

                          {/* REQUIRED QTY */}

                          <td className="pw-required-cell">

                            <strong className="pw-required-qty">
                              {item.requiredQuantity}
                            </strong>

                          </td>

                          {/* UNIT */}

                          <td className="pw-unit-cell">

                            {item.unit || "Piece"}

                          </td>

                          {/* PICKED */}

                          <td className="pw-stage-quantity-cell">

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

                          <td className="pw-stage-quantity-cell">

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

                          <td className="pw-stage-quantity-cell">

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

                          {/* FINAL RESULT */}

                          <td className="pw-final-result-cell">

                            {!rowComplete ? (

                              <span className="pw-result-pending">
                                PENDING
                              </span>

                            ) : rowOk ? (

                              <span className="pw-result-match">

                                <Check
                                  size={15}
                                />

                                MATCH

                              </span>

                            ) : (

                              <span className="pw-result-mismatch">

                                <X
                                  size={15}
                                />

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

              {/* QUANTITY VERIFICATION */}

              <div className="pw-info-box">

                <strong>
                  Quantity Verification
                </strong>

                <p>
                  Required Qty must exactly
                  match Picked, Checked and
                  Packed quantity.
                </p>

                <div className="pw-verification-rules">

                  <span>
                    <Check size={14} />
                    Correct quantity = MATCH
                  </span>

                  <span>
                    <X size={14} />
                    Wrong quantity = MISMATCH
                  </span>

                </div>

              </div>

            </section>

            {/* =================================================
                STAFF
            ================================================= */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Staff Sign-off
                  </h2>

                  <p>
                    Enter the employee responsible
                    for each stage.
                  </p>

                </div>

              </div>

              <div className="pw-form-grid">

                <div className="pw-form-group">

                  <label>
                    Picked By
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Employee name"
                    value={
                      staff.pickedBy
                    }
                    onChange={(event) =>
                      setStaff(
                        (previous) => ({
                          ...previous,
                          pickedBy:
                            event.target.value,
                        })
                      )
                    }
                  />

                </div>

                <div className="pw-form-group">

                  <label>
                    Checked By
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Employee name"
                    value={
                      staff.checkedBy
                    }
                    onChange={(event) =>
                      setStaff(
                        (previous) => ({
                          ...previous,
                          checkedBy:
                            event.target.value,
                        })
                      )
                    }
                  />

                </div>

                <div className="pw-form-group">

                  <label>
                    Packed By
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Employee name"
                    value={
                      staff.packedBy
                    }
                    onChange={(event) =>
                      setStaff(
                        (previous) => ({
                          ...previous,
                          packedBy:
                            event.target.value,
                        })
                      )
                    }
                  />

                </div>

              </div>

              <div className="pw-status-row">

                <StatusPill
                  ok={pickingOk}
                  label={
                    pickingOk
                      ? "Picking MATCH"
                      : "Picking Pending"
                  }
                />

                <StatusPill
                  ok={checkingOk}
                  label={
                    checkingOk
                      ? "Checking MATCH"
                      : "Checking Pending"
                  }
                />

                <StatusPill
                  ok={packingOk}
                  label={
                    packingOk
                      ? "Packing MATCH"
                      : "Packing Pending"
                  }
                />

              </div>

            </section>

            {/* =================================================
                TRANSPORT
            ================================================= */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Transport & Delivery
                  </h2>

                  <p>
                    Enter transport information
                    for the dispatch label.
                  </p>

                </div>

              </div>

              <div className="pw-form-grid">

                {/* METHOD */}

                <div className="pw-form-group">

                  <label>
                    Transport Method
                    <span></span>
                  </label>

                  <select
                    value={
                      transportMethod
                    }
                    onChange={(event) =>
                      setTransportMethod(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Select transport method
                    </option>

                    {TRANSPORT_METHODS.map(
                      (method) => (
                        <option
                          key={method}
                          value={method}
                        >
                          {method}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* CUSTOM METHOD */}

                {transportMethod ===
                  "Other" && (

                  <div className="pw-form-group">

                    <label>
                      Custom Transport Method
                      <span></span>
                    </label>

                    <input
                      type="text"
                      placeholder="Enter transport method"
                      value={
                        customTransportMethod
                      }
                      onChange={(event) =>
                        setCustomTransportMethod(
                          event.target.value
                        )
                      }
                    />

                  </div>

                )}

                {/* TRANSPORT NAME */}

                <div className="pw-form-group">

                  <label>
                    Transport Name
                  </label>

                  <select
                    value={
                      transportName
                    }
                    onChange={(event) =>
                      setTransportName(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Select transport name
                    </option>

                    {TRANSPORT_NAMES.map(
                      (name) => (
                        <option
                          key={name}
                          value={name}
                        >
                          {name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* CUSTOM TRANSPORT NAME */}

                {transportName ===
                  "Other" && (

                  <div className="pw-form-group">

                    <label>
                      Custom Transport Name
                      <span></span>
                    </label>

                    <input
                      type="text"
                      placeholder="Enter transport name"
                      value={
                        customTransportName
                      }
                      onChange={(event) =>
                        setCustomTransportName(
                          event.target.value
                        )
                      }
                    />

                  </div>

                )}

                {/* ADDRESS */}

                <div className="pw-form-group pw-full">

                  <label>
                    Customer Delivery Address
                    <span></span>
                  </label>

                  <textarea
                    rows="3"
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

              {/* TRANSPORT PREVIEW */}

              <div className="pw-transport-preview">

                <div>

                  <span>
                    Transport Method
                  </span>

                  <strong>
                    {finalTransportMethod ||
                      "-"}
                  </strong>

                </div>

                <div>

                  <span>
                    Transport Name
                  </span>

                  <strong>
                    {finalTransportName ||
                      "-"}
                  </strong>

                </div>

                <div>

                  <span>
                    Packages
                  </span>

                  <strong>
                    {packingOrder.numberOfPackages}{" "}
                    {packingOrder.packageType}
                  </strong>

                </div>

              </div>

            </section>

            {/* =================================================
                NOTES
            ================================================= */}

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

            {/* =================================================
                SAVE
            ================================================= */}

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
                onClick={
                  saveWorkflow
                }
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

                    Save / Complete Packing
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
                    Confirm the address and
                    print the label.
                  </p>

                </div>

              </div>

              <div className="pw-form-group">

                <label>
                  Customer Address
                  <span></span> //give manually entry for it  
                </label>

                <textarea
                  rows="4"
                  value={
                    dispatchAddress
                  }
                  onChange={(event) =>
                    setDispatchAddress(
                      event.target.value
                    )
                  }
                  placeholder={
                    customerAddress ||
                    "Enter delivery address"
                  }
                />

              </div>

              {/* PRINTABLE LABEL */}

              <div
                id="dispatch-label"
                className="pw-dispatch-label"
              >

                <div className="pw-label-subtitle">
                  DISPATCH LABEL
                </div>

                <div className="pw-label-line" />

                <div className="pw-label-row">

                  <span>
                    Packing No:
                  </span>

                  <strong>
                    {packingOrder.packingNumber}
                  </strong>

                </div>

                <div className="pw-label-row">

                  <span>
                    Quotation:
                  </span>

                  <strong>
                    {packingOrder.quotation?.quotationNumber ||
                      quotation?.quotationNumber ||
                      "-"}
                  </strong>

                </div>

                <div className="pw-label-row">

                  <span>
                    Customer:
                  </span>

                  <strong>
                    {customerName}
                  </strong>

                </div>

                <div className="pw-label-row">

                  <span>
                    Phone:
                  </span>

                  <strong>
                    {customerPhone ||
                      "-"}
                  </strong>

                </div>

                <div className="pw-label-address">

                  <span>
                    DELIVERY ADDRESS   //big//
                  </span>

                  <strong>
                    {dispatchAddress ||
                      customerAddress ||
                      "Customer address"}
                  </strong>

                </div>

                <div className="pw-label-row">

                  <span>
                    Transport Method:
                  </span>

                  <strong>
                    {finalTransportMethod ||
                      "-"}
                  </strong>

                </div>

                <div className="pw-label-row">

                  <span>
                    Transport Name:  // here i need like transport name in center and very bigin size for it with bold letter
                  </span>

                  <strong>
                    {finalTransportName ||
                      "-"}
                  </strong>

                </div>

                <div className="pw-label-row">

                  <span>
                    Packages:
                  </span>

                  <strong>
                    {packingOrder.numberOfPackages}{" "}
                    {packingOrder.packageType}
                  </strong>

                </div>

                <div className="pw-label-line" />

                <div className="pw-label-footer">

                  KICKMAC SOLUTIONS - BENGALURU - 560057
<br />
                  PHONE: 9900400452  //here i need like phone number in center and very bigin size for it with bold letter


                </div>

              </div>

            </section>

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
                className="pw-secondary-button"
                onClick={
                  printLabel
                }
              >

                <Printer
                  size={17}
                />

                Print Label

              </button>

              <button
                type="button"
                className="pw-primary-button"
                onClick={
                  continueToTransport
                }
                disabled={
                  dispatching
                }
              >

                {dispatching ? (

                  <>
                    <Loader2
                      size={17}
                      className="pw-button-spinner"
                    />

                    Marking Dispatched...
                  </>

                ) : (

                  <>
                    Bag Dispatched — Continue

                    <ArrowRight
                      size={17}
                    />
                  </>

                )}

              </button>

            </div>

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
                    Transport Slip
                  </h2>

                  <p>
                    Optional right now — the order is
                    already dispatched. Add this once
                    the transporter gives you the slip
                    after billing, either now or by
                    reopening this order later from
                    Packing Orders.
                  </p>

                </div>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={
                  onPhotoChosen
                }
                className="pw-hidden-input"
              />

              {!transportPhoto ? (

                <button
                  type="button"
                  className="pw-photo-upload"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >

                  <Camera
                    size={30}
                  />

                  <strong>
                    Take / Upload Transport Slip
                  </strong>

                  <span>
                    JPG, PNG or other image
                    up to 10 MB
                  </span>

                </button>

              ) : (

                <div className="pw-photo-preview">

                  <img
                    src={
                      transportPhoto
                    }
                    alt="Transport slip"
                  />

                  <button
                    type="button"
                    className="pw-secondary-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >

                    <Camera
                      size={16}
                    />

                    Replace Photo

                  </button>

                </div>

              )}

            </section>

            {/* TRANSPORT SUMMARY */}

            <section className="pw-card">

              <div className="pw-card-header">

                <div>

                  <h2>
                    Dispatch Summary
                  </h2>

                </div>

              </div>

              <div className="pw-summary-grid">

                <div className="pw-summary-item">

                  <span>
                    Packing No
                  </span>

                  <strong>
                    {packingOrder.packingNumber}
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
                    Transport Method
                  </span>

                  <strong>
                    {finalTransportMethod ||
                      "-"}
                  </strong>

                </div>

                <div className="pw-summary-item">

                  <span>
                    Transport Name
                  </span>

                  <strong>
                    {finalTransportName ||
                      "-"}
                  </strong>

                </div>

                <div className="pw-summary-item">

                  <span>
                    Packages
                  </span>

                  <strong>
                    {packingOrder.numberOfPackages}{" "}
                    {packingOrder.packageType}
                  </strong>

                </div>

                <div className="pw-summary-item">

                  <span>
                    Total Items
                  </span>

                  <strong>
                    {totalRequiredItems}
                  </strong>

                </div>

              </div>

            </section>

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

              <button
                type="button"
                className="pw-secondary-button"
                onClick={
                  skipTransportSlipForNow
                }
              >
                Skip — Add Slip Later
              </button>

              <button
                type="button"
                className="pw-primary-button"
                disabled={
                  uploading ||
                  !transportPhoto
                }
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
                    <Truck
                      size={17}
                    />

                    Save Transport Slip
                  </>

                )}

              </button>

            </div>

          </div>
        )}

        {/* =================================================
            DONE
        ================================================= */}

        {stage === "done" && (

          <section className="pw-complete-screen">

            <CheckCircle2
              size={54}
            />

            <h2>
              Packing Complete
            </h2>

            <p>
              {packingOrder.packingNumber}{" "}
              has been packed,
              labelled and dispatched.
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
                  {packingOrder.numberOfPackages}{" "}
                  {packingOrder.packageType}
                </strong>

              </div>

            </div>

            <button
              type="button"
              className="pw-primary-button"
              onClick={
                handleBack
              }
            >
              Back to Packing Orders
            </button>

          </section>
        )}

      </div>

      {/* ===================================================
          PRINT CSS
      =================================================== */}

      <style>{`
        @media print {

          body * {
            visibility: hidden !important;
          }

          #dispatch-label,
          #dispatch-label * {
            visibility: visible !important;
          }

          #dispatch-label {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: 0 auto !important;
            width: 90mm !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

    </div>
  );
}