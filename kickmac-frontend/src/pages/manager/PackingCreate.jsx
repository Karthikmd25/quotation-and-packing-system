import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import "./PackingCreate.css";

// =========================================================
// PACKAGE TYPES
// =========================================================

const PACKAGE_TYPES = [
  "Bags",
  "Boxes",
  "Cartons",
  "Packages",
  "Other",
];

// =========================================================
// FORMAT DATE
// =========================================================

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

// =========================================================
// CUSTOMER NAME
// =========================================================

function getCustomerName(quotation) {
  return (
    quotation?.customerName ||
    quotation?.customer?.name ||
    "Unknown Customer"
  );
}

// =========================================================
// CUSTOMER PHONE
// =========================================================

function getCustomerPhone(quotation) {
  return (
    quotation?.customerPhone ||
    quotation?.customer?.phone ||
    ""
  );
}

// =========================================================
// CUSTOMER EMAIL
// =========================================================

function getCustomerEmail(quotation) {
  return (
    quotation?.customerEmail ||
    quotation?.customer?.email ||
    ""
  );
}

// =========================================================
// CUSTOMER ADDRESS
// =========================================================

function getCustomerAddress(quotation) {
  const customer = quotation?.customer || {};

  const directAddress =
    quotation?.customerAddress ||
    quotation?.deliveryAddress ||
    quotation?.address ||
    customer?.address ||
    customer?.deliveryAddress ||
    "";

  if (directAddress) {
    return directAddress;
  }

  const addressParts = [
    customer?.addressLine1,
    customer?.addressLine2,
    customer?.area,
    customer?.locality,
    customer?.city,
    customer?.district,
    customer?.state,
    customer?.pincode,
    customer?.postalCode,
  ].filter(Boolean);

  return addressParts.length > 0
    ? addressParts.join(", ")
    : "";
}

// =========================================================
// TOTAL ITEM QUANTITY
// =========================================================

function getTotalItems(quotation) {
  if (!Array.isArray(quotation?.items)) {
    return 0;
  }

  return quotation.items.reduce(
    (total, item) => total + Number(item?.quantity || 0),
    0
  );
}

// =========================================================
// TRANSPORT METHOD
// IMPORTANT:
// Read from confirmed quotation first.
// =========================================================

function getQuotationTransportMethod(quotation) {
  const method =
    quotation?.transportMethod ||
    quotation?.transport?.method ||
    quotation?.customerTransportMethod ||
    quotation?.deliveryMethod ||
    "";

  return String(method).trim();
}

// =========================================================
// TRANSPORT NAME
// IMPORTANT:
// Read from confirmed quotation first.
// =========================================================

function getQuotationTransportName(quotation) {
  const name =
    quotation?.transportName ||
    quotation?.transport?.name ||
    quotation?.customerTransportName ||
    quotation?.deliveryTransportName ||
    "";

  return String(name).trim();
}

// =========================================================
// GET LOGGED-IN MANAGER ID
// =========================================================

function getManagerId() {
  try {
    const managerData = localStorage.getItem("manager");

    if (!managerData) {
      return "";
    }

    const manager = JSON.parse(managerData);

    return (
      manager?.employeeId ||
      manager?.managerId ||
      manager?.id ||
      ""
    );
  } catch (error) {
    console.error(
      "Failed to read manager information:",
      error
    );

    return "";
  }
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function PackingCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const quotationId = searchParams.get("quotationId");

  // =======================================================
  // STATE
  // =======================================================

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =======================================================
  // MANAGER ID
  // =======================================================

  const [managerId, setManagerId] = useState("");

  // =======================================================
  // FORM DATA
  // =======================================================

  const [formData, setFormData] = useState({
    numberOfPackages: "",
    packageType: "",
    customPackageType: "",

    // These are automatically populated from quotation.
    transportMethod: "",
    customTransportMethod: "",
    transportName: "",
    customTransportName: "",

    notes: "",
  });

  // =======================================================
  // LOAD MANAGER
  // =======================================================

  useEffect(() => {
    const id = getManagerId();

    setManagerId(id);

    console.log(
      "Logged-in Manager ID:",
      id
    );
  }, []);

  // =======================================================
  // LOAD QUOTATION
  // =======================================================

  useEffect(() => {
    loadQuotation();
  }, [quotationId]);

  async function loadQuotation() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!quotationId) {
        setError("Quotation ID is missing.");
        setLoading(false);
        return;
      }

      const response = await api.get(
        `/quotations/${quotationId}`
      );

      console.log(
        "========== QUOTATION RESPONSE =========="
      );

      console.log(response.data);

      console.log(
        "========================================="
      );

      if (response?.data?.success === false) {
        throw new Error(
          response?.data?.message ||
            "Failed to load quotation."
        );
      }

      const data = response.data;

      const loadedQuotation =
        data?.quotation ||
        data?.data ||
        data;

      if (!loadedQuotation?._id) {
        throw new Error(
          "Quotation data was not found."
        );
      }

      // ===================================================
      // STORE QUOTATION
      // ===================================================

      setQuotation(loadedQuotation);

      // ===================================================
      // READ TRANSPORT DIRECTLY FROM QUOTATION
      // ===================================================

      const quotationTransportMethod =
        getQuotationTransportMethod(
          loadedQuotation
        );

      const quotationTransportName =
        getQuotationTransportName(
          loadedQuotation
        );

      // ===================================================
      // DEBUG TRANSPORT
      // ===================================================

      console.log(
        "========== TRANSPORT FROM QUOTATION =========="
      );

      console.log(
        "Quotation Number:",
        loadedQuotation?.quotationNumber
      );

      console.log(
        "Transport Method:",
        quotationTransportMethod
      );

      console.log(
        "Transport Name:",
        quotationTransportName
      );

      console.log(
        "Direct transportMethod:",
        loadedQuotation?.transportMethod
      );

      console.log(
        "Direct transportName:",
        loadedQuotation?.transportName
      );

      console.log(
        "Nested transport:",
        loadedQuotation?.transport
      );

      console.log(
        "==============================================="
      );

      // ===================================================
      // PUT QUOTATION TRANSPORT INTO FORM STATE
      // ===================================================

      setFormData((previous) => ({
        ...previous,

        transportMethod:
          quotationTransportMethod,

        transportName:
          quotationTransportName,
      }));
    } catch (err) {
      console.error(
        "Load quotation error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load quotation."
      );
    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // HANDLE FORM CHANGE
  // =======================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =======================================================
  // PACKAGE COUNT
  // =======================================================

  function handlePackageCountChange(event) {
    const value = event.target.value;

    setFormData((previous) => ({
      ...previous,
      numberOfPackages: value,
    }));
  }

  // =======================================================
  // CREATE PACKING ORDER
  // =======================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    // =====================================================
    // MANAGER VALIDATION
    // =====================================================

    if (!managerId) {
      setError(
        "Manager ID is not available. Please login again."
      );

      return;
    }

    // =====================================================
    // QUOTATION VALIDATION
    // =====================================================

    if (!quotation?._id) {
      setError(
        "Quotation information is not available."
      );

      return;
    }

    // =====================================================
    // CUSTOMER CONFIRMATION VALIDATION
    // =====================================================

    const quotationConfirmed =
      quotation.status === "CUSTOMER_CONFIRMED" ||
      quotation.customerResponse === "CONFIRMED" ||
      quotation.status === "APPROVED";

    if (!quotationConfirmed) {
      setError(
        "Only customer-confirmed or approved quotations can be sent to packing."
      );

      return;
    }

    // =====================================================
    // PACKAGE COUNT
    // =====================================================

    let packageCount = 1;

    if (
      formData.numberOfPackages !== "" &&
      formData.numberOfPackages !== null &&
      formData.numberOfPackages !== undefined
    ) {
      const parsedPackageCount = Number(
        formData.numberOfPackages
      );

      if (
        Number.isInteger(parsedPackageCount) &&
        parsedPackageCount > 0
      ) {
        packageCount = parsedPackageCount;
      }
    }

    // =====================================================
    // PACKAGE TYPE
    // =====================================================

    let finalPackageType = "";

    if (formData.packageType === "Other") {
      finalPackageType =
        formData.customPackageType.trim();
    } else if (formData.packageType) {
      finalPackageType = formData.packageType;
    }

    // =====================================================
    // TRANSPORT
    //
    // ALWAYS TAKE TRANSPORT FROM CONFIRMED QUOTATION.
    // =====================================================

    const quotationTransportMethod =
      getQuotationTransportMethod(
        quotation
      );

    const quotationTransportName =
      getQuotationTransportName(
        quotation
      );

    const finalTransportMethod =
      quotationTransportMethod ||
      formData.transportMethod ||
      "";

    const finalTransportName =
      quotationTransportName ||
      formData.transportName ||
      "";

    // =====================================================
    // CREATE PAYLOAD
    // =====================================================

    const payload = {
      quotationId: quotation._id,

      numberOfPackages: packageCount,

      packageType: finalPackageType,

      instructions: "",

      // Transport from quotation
      transportMethod:
        finalTransportMethod,

      customTransportMethod: "",

      transportName:
        finalTransportName,

      customTransportName: "",

      notes: formData.notes.trim(),
    };

    // =====================================================
    // DEBUG PAYLOAD
    // =====================================================

    console.log(
      "========== CREATING PACKING ORDER =========="
    );

    console.log(payload);

    console.log(
      "Quotation Transport Method:",
      quotationTransportMethod
    );

    console.log(
      "Quotation Transport Name:",
      quotationTransportName
    );

    console.log(
      "Final Transport Method:",
      finalTransportMethod
    );

    console.log(
      "Final Transport Name:",
      finalTransportName
    );

    console.log(
      "============================================"
    );

    // =====================================================
    // API CALL
    // =====================================================

    try {
      setSaving(true);

      const response = await api.post(
        "/packing",
        payload
      );

      console.log(
        "Create packing response:",
        response.data
      );

      // ===================================================
      // CHECK SUCCESS
      // ===================================================

      if (response?.data?.success === false) {
        throw new Error(
          response?.data?.message ||
            "Failed to create packing order."
        );
      }

      const createdPackingOrder =
        response?.data?.packingOrder ||
        response?.data?.order ||
        response?.data?.data ||
        null;

      const packingNumber =
        createdPackingOrder?.packingNumber ||
        "Packing order";

      setSuccess(
        `${packingNumber} created successfully.`
      );

      // ===================================================
      // MANAGER → PACKING DASHBOARD
      // ===================================================

      setTimeout(() => {
        navigate("/packing");
      }, 800);
    } catch (err) {
      console.error(
        "Create packing error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create packing order."
      );
    } finally {
      setSaving(false);
    }
  }

  // =======================================================
  // CANCEL
  // =======================================================

  function handleCancel() {
    navigate("/manager/quotations");
  }

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="packing-page">
        <div className="packing-loading">
          <div className="packing-spinner"></div>

          <p>
            Loading quotation...
          </p>
        </div>
      </div>
    );
  }

  // =======================================================
  // QUOTATION NOT FOUND
  // =======================================================

  if (!quotation) {
    return (
      <div className="packing-page">
        <div className="packing-container">

          <div className="packing-header">
            <div>
              <h1>
                Create Packing Order
              </h1>

              <p>
                Create a packing order
                from a customer-confirmed
                quotation.
              </p>
            </div>

            <button
              type="button"
              className="packing-back-button"
              onClick={handleCancel}
            >
              ← Back to Quotations
            </button>
          </div>

          <div className="packing-alert packing-alert-error">
            <span>⚠️</span>

            <span>
              {error ||
                "Quotation not found."}
            </span>
          </div>

        </div>
      </div>
    );
  }

  // =======================================================
  // CUSTOMER DETAILS
  // =======================================================

  const customerName =
    getCustomerName(quotation);

  const customerPhone =
    getCustomerPhone(quotation);

  const customerEmail =
    getCustomerEmail(quotation);

  const customerAddress =
    getCustomerAddress(quotation);

  // =======================================================
  // TOTAL ITEMS
  // =======================================================

  const totalItems =
    getTotalItems(quotation);

  // =======================================================
  // TRANSPORT
  //
  // QUOTATION IS THE PRIMARY SOURCE.
  // =======================================================

  const displayTransportMethod =
    getQuotationTransportMethod(
      quotation
    ) ||
    formData.transportMethod ||
    "";

  const displayTransportName =
    getQuotationTransportName(
      quotation
    ) ||
    formData.transportName ||
    "";

  // =======================================================
  // PACKAGE DISPLAY
  // =======================================================

  const displayPackageCount =
    formData.numberOfPackages ||
    "Not specified";

  const displayPackageType =
    formData.packageType === "Other"
      ? formData.customPackageType ||
        "Not specified"
      : formData.packageType ||
        "Not specified";

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <div className="packing-page">

      <div className="packing-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="packing-header">

          <div>

            <div className="packing-title-row">

              <h1>
                Create Packing Order
              </h1>

              <span className="packing-status-badge">
                {quotation.status ||
                  "CUSTOMER_CONFIRMED"}
              </span>

            </div>

            <p>
              Create a packing order for quotation{" "}
              <strong>
                {quotation.quotationNumber ||
                  "-"}
              </strong>
            </p>

          </div>

          <button
            type="button"
            className="packing-back-button"
            onClick={handleCancel}
          >
            ← Back
          </button>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="packing-alert packing-alert-error">

            <span>⚠️</span>

            <span>
              {error}
            </span>

          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="packing-alert packing-alert-success">

            <span>✅</span>

            <span>
              {success}
            </span>

          </div>
        )}

        {/* =================================================
            QUOTATION DETAILS
        ================================================= */}

        <section className="packing-card">

          <div className="packing-card-header">

            <div>

              <h2>
                Quotation Details
              </h2>

              <p>
                Information from the
                confirmed quotation
              </p>

            </div>

          </div>

          <div className="quotation-summary-grid">

            {/* MANAGER ID */}

            <div className="summary-item manager-id-summary">

              <span className="summary-label">
                Manager ID
              </span>

              <strong className="summary-value manager-id-value">
                {managerId ||
                  "Not available"}
              </strong>

            </div>

            {/* QUOTATION NUMBER */}

            <div className="summary-item">

              <span className="summary-label">
                Quotation Number
              </span>

              <strong className="summary-value">
                {quotation.quotationNumber ||
                  "-"}
              </strong>

            </div>

            {/* QUOTATION DATE */}

            <div className="summary-item">

              <span className="summary-label">
                Quotation Date
              </span>

              <strong className="summary-value">
                {formatDateTime(
                  quotation.createdAt
                )}
              </strong>

            </div>

            {/* CUSTOMER */}

            <div className="summary-item">

              <span className="summary-label">
                Customer
              </span>

              <strong className="summary-value">
                {customerName}
              </strong>

            </div>

            {/* PHONE */}

            <div className="summary-item">

              <span className="summary-label">
                Phone
              </span>

              <strong className="summary-value">
                {customerPhone || "-"}
              </strong>

            </div>

            {/* EMAIL */}

            <div className="summary-item">

              <span className="summary-label">
                Email
              </span>

              <strong className="summary-value">
                {customerEmail || "-"}
              </strong>

            </div>

            {/* ADDRESS */}

            <div className="summary-item summary-address-item">

              <span className="summary-label">
                Customer Address
              </span>

              <strong className="summary-value">
                {customerAddress ||
                  "Address not available"}
              </strong>

            </div>

            {/* TOTAL ITEMS */}

            <div className="summary-item">

              <span className="summary-label">
                Total Items
              </span>

              <strong className="summary-value summary-total">
                {totalItems}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            CUSTOMER CONFIRMATION
        ================================================= */}

        {quotation.customerResponse && (
          <section className="packing-card">

            <div className="packing-card-header">

              <div>

                <h2>
                  Customer Confirmation
                </h2>

                <p>
                  Customer response
                  received for this
                  quotation
                </p>

              </div>

            </div>

            <div className="customer-confirmation">

              <div>

                <span className="summary-label">
                  Response
                </span>

                <strong>
                  {quotation.customerResponse}
                </strong>

              </div>

              <div>

                <span className="summary-label">
                  Responded At
                </span>

                <strong>
                  {formatDateTime(
                    quotation.customerRespondedAt
                  )}
                </strong>

              </div>

              {quotation.customerResponseNote && (
                <div className="confirmation-note">

                  <span className="summary-label">
                    Customer Note
                  </span>

                  <p>
                    {quotation.customerResponseNote}
                  </p>

                </div>
              )}

            </div>

          </section>
        )}

        {/* =================================================
            ITEMS TO PACK
        ================================================= */}

        <section className="packing-card">

          <div className="packing-card-header">

            <div>

              <h2>
                Items to Pack
              </h2>

              <p>
                Products and quantities
                from the quotation
              </p>

            </div>

          </div>

          <div className="packing-items-table-wrapper">

            <table className="packing-items-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>
                    Part Number
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
                    Unit
                  </th>

                  <th>
                    Quantity
                  </th>

                </tr>

              </thead>

              <tbody>

                {quotation.items?.map(
                  (item, index) => (
                    <tr
                      key={
                        item._id ||
                        index
                      }
                    >

                      <td>
                        {index + 1}
                      </td>

                      <td>

                        <strong>
                          {item.partNumber ||
                            "-"}
                        </strong>

                      </td>

                      <td>
                        {item.productName ||
                          "-"}
                      </td>

                      <td>
                        {item.size ||
                          "-"}
                      </td>

                      <td>
                        {item.colour ||
                          "-"}
                      </td>

                      <td>
                        {item.unit ||
                          "Piece"}
                      </td>

                      <td>

                        <strong>
                          {item.quantity ||
                            0}
                        </strong>

                      </td>

                    </tr>
                  )
                )}

                {!quotation.items?.length && (
                  <tr>

                    <td
                      colSpan="7"
                      className="empty-items"
                    >
                      No items found in
                      this quotation.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <div className="items-total">

            <span>
              Total Items
            </span>

            <strong>
              {totalItems}
            </strong>

          </div>

        </section>

        {/* =================================================
            PACKING FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>

          {/* =================================================
              PACKING INFORMATION
          ================================================= */}

          <section className="packing-card">

            <div className="packing-card-header">

              <div>

                <h2>
                  Packing Information
                </h2>

                <p>
                  Enter how the
                  physical order
                  will be packed.
                </p>

              </div>

            </div>

            <div className="form-grid">

              {/* NUMBER OF PACKAGES */}

              <div className="form-group">

                <label htmlFor="numberOfPackages">
                  Number of Packages
                </label>

                <input
                  id="numberOfPackages"
                  name="numberOfPackages"
                  type="number"
                  min="1"
                  step="1"
                  value={
                    formData.numberOfPackages
                  }
                  onChange={
                    handlePackageCountChange
                  }
                  placeholder="Optional"
                />

                <small>
                  Optional. Example:
                  2 Bags = two
                  physical bags.
                </small>

              </div>

              {/* PACKAGE TYPE */}

              <div className="form-group">

                <label htmlFor="packageType">
                  Package Type
                </label>

                <select
                  id="packageType"
                  name="packageType"
                  value={
                    formData.packageType
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="">
                    Not specified
                  </option>

                  {PACKAGE_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}

                </select>

                <small>
                  Optional.
                </small>

              </div>

              {/* CUSTOM PACKAGE TYPE */}

              {formData.packageType ===
                "Other" && (
                <div className="form-group">

                  <label htmlFor="customPackageType">
                    Custom Package Type
                  </label>

                  <input
                    id="customPackageType"
                    name="customPackageType"
                    type="text"
                    placeholder="Optional custom package type"
                    value={
                      formData.customPackageType
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>
              )}

            </div>

            {/* PACKAGE PREVIEW */}

            <div className="package-preview">

              <div className="package-preview-icon">
                📦
              </div>

              <div>

                <span>
                  Physical Package
                </span>

                <strong>
                  {displayPackageCount}{" "}
                  {displayPackageType}
                </strong>

              </div>

            </div>

          </section>

          {/* =================================================
              TRANSPORT & DELIVERY
          ================================================= */}

          <section className="packing-card">

            <div className="packing-card-header">

              <div>

                <h2>
                  Transport & Delivery
                </h2>

                <p>
                  Transport information
                  from the confirmed
                  quotation.
                </p>

              </div>

            </div>

            <div className="form-grid">

              {/* TRANSPORT METHOD */}

              <div className="form-group">

                <label>
                  Transport Method
                </label>

                <div className="readonly-transport-box">

                  {displayTransportMethod ||
                    "Not specified"}

                </div>

                <small>
                  Taken automatically
                  from the confirmed
                  quotation.
                </small>

              </div>

              {/* TRANSPORT NAME */}

              <div className="form-group">

                <label>
                  Transport Name
                </label>

                <div className="readonly-transport-box">

                  {displayTransportName ||
                    "Not specified"}

                </div>

                <small>
                  Taken automatically
                  from the confirmed
                  quotation when
                  available.
                </small>

              </div>

            </div>

            {/* CONFIRMED TRANSPORT */}

            <div className="transport-example">

              <strong>
                Confirmed Transport:
              </strong>

              <span>
                Method:{" "}
                {displayTransportMethod ||
                  "Not specified"}
              </span>

              <span>
                Name:{" "}
                {displayTransportName ||
                  "Not specified"}
              </span>

            </div>

          </section>

          {/* =================================================
              NOTES
          ================================================= */}

          <section className="packing-card">

            <div className="packing-card-header">

              <div>

                <h2>
                  Notes
                </h2>

                <p>
                  Add any additional
                  packing or delivery
                  notes.
                </p>

              </div>

            </div>

            <div className="form-group full-width">

              <label htmlFor="notes">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                rows="4"
                placeholder="Enter packing or delivery notes..."
                value={
                  formData.notes
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </section>

          {/* =================================================
              FINAL SUMMARY
          ================================================= */}

          <section className="packing-card packing-final-card">

            <div className="packing-final-header">

              <div className="final-summary-title">

                <h2>
                  Ready to Create
                  Packing Order?
                </h2>

                <p>
                  The packing order
                  will start with
                  status{" "}
                  <strong>
                    PENDING
                  </strong>.
                </p>

              </div>

              <div className="final-summary-right">

                {/* PACKAGE SUMMARY */}

                <div className="final-package-summary">

                  <span>
                    Packages
                  </span>

                  <strong>
                    {displayPackageCount}{" "}
                    {displayPackageType}
                  </strong>

                </div>

                {/* TRANSPORT SUMMARY */}

                <div className="final-transport-summary">

                  <div className="final-transport-item">

                    <span className="final-transport-label">
                      Transport Method
                    </span>

                    <strong className="final-transport-value">
                      {displayTransportMethod ||
                        "-"}
                    </strong>

                  </div>

                  <div className="final-transport-item">

                    <span className="final-transport-label">
                      Transport Name
                    </span>

                    <strong className="final-transport-value">
                      {displayTransportName ||
                        "-"}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                WORKFLOW INFORMATION
            ================================================= */}

            <div className="packing-create-workflow">

              <div className="workflow-step">

                <span className="workflow-step-number">
                  1
                </span>

                <div>

                  <strong>
                    Packing Dashboard
                  </strong>

                  <small>
                    Order appears for
                    the packing team
                  </small>

                </div>

              </div>

              <div className="workflow-arrow">
                →
              </div>

              <div className="workflow-step">

                <span className="workflow-step-number">
                  2
                </span>

                <div>

                  <strong>
                    Picking & Checking
                  </strong>

                  <small>
                    Quantity is
                    compared with
                    quotation
                  </small>

                </div>

              </div>

              <div className="workflow-arrow">
                →
              </div>

              <div className="workflow-step">

                <span className="workflow-step-number">
                  3
                </span>

                <div>

                  <strong>
                    Complete Packing
                  </strong>

                  <small>
                    Required and
                    packed quantity
                    must match
                  </small>

                </div>

              </div>

              <div className="workflow-arrow">
                →
              </div>

              <div className="workflow-step">

                <span className="workflow-step-number">
                  4
                </span>

                <div>

                  <strong>
                    Dispatch
                  </strong>

                  <small>
                    Label → Transport
                    Slip → Dispatch
                  </small>

                </div>

              </div>

            </div>

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <div className="packing-actions">

              <button
                type="button"
                className="packing-cancel-button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="packing-create-button"
                disabled={saving}
              >

                {saving ? (
                  <>
                    <span className="button-spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    📦 Create Packing Order
                  </>
                )}

              </button>

            </div>

          </section>

        </form>

      </div>

    </div>
  );
}
