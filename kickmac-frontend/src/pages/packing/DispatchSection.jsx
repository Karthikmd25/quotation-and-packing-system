import React, { useRef } from "react";
import {
  CheckCircle2,
  Printer,
  Upload,
  Truck,
  Package,
} from "lucide-react";

import "./DispatchSection.css";

const TRANSPORT_OPTIONS = [
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

function getTransportType(name = "") {
  const value = String(name).trim().toLowerCase();

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

  return "Transport";
}

export default function DispatchSection({
  packingOrder,
  quotation,

  dispatchAddress,
  setDispatchAddress,

  transportName,
  setTransportName,

  customTransportName,
  setCustomTransportName,

  finalTransportMethod,
  finalTransportName,

  printing,
  uploading,
  dispatching,

  transportPhoto,
  transportSlipUploaded,

  onSelectSlip,
  onPrintLabel,
  onUploadSlip,
  onSkipSlip,
  onDispatch,
}) {
  const fileInputRef = useRef(null);

  const customerName =
    packingOrder?.customerName ||
    quotation?.customerName ||
    "Customer";

  const customerPhone =
    packingOrder?.customerPhone ||
    quotation?.customerPhone ||
    "";

  const quotationNumber =
    packingOrder?.quotationNumber ||
    quotation?.quotationNumber ||
    quotation?.quotation?.quotationNumber ||
    "";

  const packingNumber =
    packingOrder?.packingNumber ||
    "";

  const numberOfPackages =
    Number(packingOrder?.numberOfPackages || 1);

  const packageType =
    packingOrder?.packageType ||
    "Bags";

  const displayTransportName =
    finalTransportName ||
    transportName ||
    customTransportName ||
    "Transport";

  const displayTransportMethod =
    finalTransportMethod ||
    getTransportType(displayTransportName);

  const address =
    dispatchAddress ||
    packingOrder?.customerAddress ||
    quotation?.customerAddress ||
    "Customer address";

  const handleTransportChange = (value) => {
    setTransportName(value);

    if (value !== "Other") {
      setCustomTransportName("");
    }
  };

  const handleSlipButton = () => {
    if (transportPhoto) {
      onUploadSlip();
      return;
    }

    fileInputRef.current?.click();
  };

  return (
    <div className="dispatch-section">

      {/* =========================
          DISPATCH HEADER
      ========================= */}
      <div className="dispatch-section-header">
        <div>
          <div className="dispatch-section-eyebrow">
            FINAL DISPATCH
          </div>

          <h2>
            Dispatch Label &amp; Dispatch
          </h2>

          <p>
            Print the 6 × 4 inch dispatch label,
            optionally upload the transport slip,
            then dispatch the package.
          </p>
        </div>

        <div className="dispatch-header-icon">
          <Truck size={28} />
        </div>
      </div>


      {/* =========================
          DISPATCH LABEL PREVIEW
      ========================= */}
      <div className="dispatch-preview-wrapper">

        <div
          id="dispatch-label"
          className="dispatch-label"
        >

          {/* TOP AREA */}
          <div className="dispatch-label-top">

            <div className="dispatch-title-wrap">
              <div className="dispatch-title">
                DISPATCH LABEL
              </div>
            </div>

            <div className="dispatch-transport-method">
              <div className="dispatch-method-caption">
                Transport Method:
              </div>

              <div className="dispatch-method-value">
                {displayTransportMethod}
              </div>
            </div>

          </div>


          {/* INFORMATION + TRANSPORT */}
          <div className="dispatch-info-row">

            <div className="dispatch-basic-info">

              <div className="dispatch-info-line">
                <span className="dispatch-info-label">
                  Packing No
                </span>

                <span className="dispatch-colon">
                  :
                </span>

                <strong>
                  {packingNumber || "—"}
                </strong>
              </div>


              <div className="dispatch-info-line">
                <span className="dispatch-info-label">
                  Quotation No
                </span>

                <span className="dispatch-colon">
                  :
                </span>

                <strong>
                  {quotationNumber || "—"}
                </strong>
              </div>


              <div className="dispatch-info-line">
                <span className="dispatch-info-label">
                  Bags
                </span>

                <span className="dispatch-colon">
                  :
                </span>

                <strong>
                  {numberOfPackages}{" "}
                  {String(packageType)
                    .replace(/s$/i, "")
                    .toUpperCase()}
                </strong>
              </div>

            </div>


            {/* TRANSPORT NAME */}
            <div className="dispatch-transport-box">

              <div className="dispatch-transport-small">
                TRANSPORT
              </div>

              <div className="dispatch-transport-name">
                {displayTransportName}
              </div>

            </div>

          </div>


          {/* DIVIDER */}
          <div className="dispatch-divider" />


          {/* CUSTOMER */}
          <div className="dispatch-customer-section">

            <div className="dispatch-to-title">
              To,
            </div>

            <div className="dispatch-customer-line">
              <span>
                Customer Name
              </span>

              <span className="dispatch-colon">
                :
              </span>

              <strong>
                {customerName}
              </strong>
            </div>


            <div className="dispatch-customer-line">
              <span>
                Phone
              </span>

              <span className="dispatch-colon">
                :
              </span>

              <strong>
                {customerPhone || "—"}
              </strong>
            </div>

          </div>


          {/* DELIVERY ADDRESS */}
          <div className="dispatch-address-section">

            <div className="dispatch-address-title">
              DELIVERY ADDRESS
            </div>

            <div className="dispatch-address-value">
              {address}
            </div>

          </div>


          {/* DIVIDER */}
          <div className="dispatch-divider dispatch-divider-bottom" />


          {/* FROM */}
          <div className="dispatch-from-section">

            <div className="dispatch-from-title">
              From,
            </div>

            <div className="dispatch-company">
              KICKMAC SOLUTIONS
            </div>

            <div className="dispatch-company-location">
              Bengaluru - 560057
            </div>

            <div className="dispatch-company-phone">
              Phone No : 9900400452
            </div>

          </div>

        </div>

      </div>


      {/* =========================
          EDIT DETAILS
      ========================= */}
      <div className="dispatch-edit-card">

        <div className="dispatch-edit-title">
          <Package size={20} />
          Dispatch Details
        </div>


        <div className="dispatch-edit-grid">

          <div className="dispatch-field">

            <label>
              Delivery Address
            </label>

            <textarea
              value={dispatchAddress}
              onChange={(e) =>
                setDispatchAddress(e.target.value)
              }
              placeholder="Enter delivery address"
              rows={3}
            />

          </div>


          <div className="dispatch-field">

            <label>
              Transport
            </label>

            <select
              value={transportName}
              onChange={(e) =>
                handleTransportChange(e.target.value)
              }
            >
              <option value="">
                Select Transport
              </option>

              {TRANSPORT_OPTIONS.map((transport) => (
                <option
                  key={transport}
                  value={transport}
                >
                  {transport}
                </option>
              ))}
            </select>

          </div>


          {transportName === "Other" && (
            <div className="dispatch-field">

              <label>
                Custom Transport Name
              </label>

              <input
                type="text"
                value={customTransportName}
                onChange={(e) =>
                  setCustomTransportName(
                    e.target.value
                  )
                }
                placeholder="Enter transport name"
              />

            </div>
          )}

        </div>

      </div>


      {/* =========================
          TRANSPORT SLIP
      ========================= */}
      <div className="dispatch-slip-card">

        <div className="dispatch-slip-title">
          Transport Slip
        </div>

        <p>
          Transport slip is optional.
          You can upload it now or skip it.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={onSelectSlip}
        />

        <div className="dispatch-slip-actions">

          <button
            type="button"
            className="dispatch-btn dispatch-btn-secondary"
            onClick={handleSlipButton}
            disabled={uploading}
          >
            <Upload size={18} />

            {uploading
              ? "Uploading..."
              : transportPhoto
              ? "Save Transport Slip"
              : "Upload Transport Slip"}
          </button>


          <button
            type="button"
            className="dispatch-btn dispatch-btn-light"
            onClick={onSkipSlip}
            disabled={uploading}
          >
            Skip Slip
          </button>

        </div>


        {transportSlipUploaded && (
          <div className="dispatch-slip-success">
            <CheckCircle2 size={18} />

            Transport slip saved successfully.
          </div>
        )}

      </div>


      {/* =========================
          FINAL ACTIONS
      ========================= */}
      <div className="dispatch-final-actions">

        <button
          type="button"
          className="dispatch-btn dispatch-print-btn"
          onClick={onPrintLabel}
          disabled={printing}
        >
          <Printer size={19} />

          {printing
            ? "Printing..."
            : "Print Dispatch Label"}
        </button>


        <button
          type="button"
          className="dispatch-btn dispatch-dispatch-btn"
          onClick={onDispatch}
          disabled={dispatching}
        >
          <Truck size={19} />

          {dispatching
            ? "Dispatching..."
            : "Dispatch Order"}
        </button>

      </div>

    </div>
  );
}