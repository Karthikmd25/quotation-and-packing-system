import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  ArrowLeft,
  RefreshCw,
  Package,
  CheckCircle2,
  Clock3,
  XCircle,
  Truck,
  FileText,
  UserCheck,
} from "lucide-react";

import api from "../../services/api";
import "./Tracking.css";

const ACTION_DETAILS = {
  QUOTATION_CREATED: {
    title: "Quotation Created",
    description: "Quotation was created by the manager.",
    icon: FileText,
  },

  QUOTATION_UPDATED: {
    title: "Quotation Updated",
    description: "Quotation details were updated.",
    icon: FileText,
  },

  QUOTATION_SENT: {
    title: "Sent to Customer",
    description: "Quotation was sent to the customer.",
    icon: FileText,
  },

  CUSTOMER_CONFIRMED: {
    title: "Customer Confirmed",
    description: "Customer confirmed the quotation.",
    icon: CheckCircle2,
  },

  CUSTOMER_CHANGES_REQUESTED: {
    title: "Changes Requested",
    description: "Customer requested changes to the quotation.",
    icon: Clock3,
  },

  CUSTOMER_REJECTED: {
    title: "Customer Rejected",
    description: "Customer rejected the quotation.",
    icon: XCircle,
  },

  MANAGER_APPROVED: {
    title: "Manager Approved",
    description: "Manager approved the confirmed quotation.",
    icon: UserCheck,
  },

  QUOTATION_CANCELLED: {
    title: "Quotation Cancelled",
    description: "Quotation was cancelled.",
    icon: XCircle,
  },

  PACKING_ORDER_CREATED: {
    title: "Packing Order Created",
    description: "Packing order was created.",
    icon: Package,
  },

  PICKING_STARTED: {
    title: "Picking Started",
    description: "Picking process started.",
    icon: Package,
  },

  PICKING_COMPLETED: {
    title: "Picking Completed",
    description: "Required quantities were picked.",
    icon: CheckCircle2,
  },

  CHECKING_STARTED: {
    title: "Checking Started",
    description: "Quantity checking started.",
    icon: Clock3,
  },

  CHECKING_COMPLETED: {
    title: "Checking Completed",
    description: "Picked quantities were checked.",
    icon: CheckCircle2,
  },

  PACKING_STARTED: {
    title: "Packing Started",
    description: "Packing process started.",
    icon: Package,
  },

  PACKING_COMPLETED: {
    title: "Packing Completed",
    description: "Packing was completed successfully.",
    icon: CheckCircle2,
  },

  DISPATCH_LABEL_PRINTED: {
    title: "Dispatch Label Printed",
    description: "Dispatch label was printed.",
    icon: FileText,
  },

  TRANSPORT_SLIP_SAVED: {
    title: "Transport Slip Saved",
    description: "Transport slip was saved.",
    icon: Truck,
  },

  DISPATCHED: {
    title: "Dispatched",
    description: "Order was dispatched to the customer.",
    icon: Truck,
  },

  DELIVERED: {
    title: "Delivered",
    description: "Order was delivered to the customer.",
    icon: CheckCircle2,
  },

  CANCELLED: {
    title: "Cancelled",
    description: "Order was cancelled.",
    icon: XCircle,
  },
};

const formatAction = (action) => {
  return String(action || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/*
|--------------------------------------------------------------------------
| EMPLOYEE / MANAGER DISPLAY
|--------------------------------------------------------------------------
|
| Employee event:
|   Handled By: EMP001
|
| Manager event:
|   Handled By: MGR-001
|
| Manager NAME is intentionally NOT displayed.
|--------------------------------------------------------------------------
*/
const getEmployeeText = (item) => {
  if (item.employeeId) {
    return `Employee: ${item.employeeId}`;
  }

  if (item.managerId) {
    return `Manager: ${item.managerId}`;
  }

  return "";
};

function Tracking() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [history, setHistory] = useState([]);
  const [searchedValue, setSearchedValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | SEARCH TRACKING
  |--------------------------------------------------------------------------
  */
  const handleSearch = async (event) => {
    event?.preventDefault();

    const value = search.trim();

    if (!value) {
      setError(
        "Enter quotation number, packing number, customer name or phone number."
      );

      setHistory([]);
      setSearched(false);
      setSearchedValue("");

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(true);
      setSearchedValue(value);

      const response = await api.get(
        `/tracking/search?q=${encodeURIComponent(value)}`
      );

      const trackingHistory = response.data?.history || [];

      setHistory(trackingHistory);

      if (trackingHistory.length === 0) {
        setError("No tracking history found for this search.");
      }
    } catch (err) {
      console.error("Tracking search error:", err);

      setHistory([]);

      setError(
        err.response?.data?.message ||
          "Failed to load tracking history."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR SEARCH
  |--------------------------------------------------------------------------
  */
  const handleClear = () => {
    setSearch("");
    setSearchedValue("");
    setHistory([]);
    setError("");
    setSearched(false);
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */
  const handleRefresh = () => {
    if (search.trim()) {
      handleSearch();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SUMMARY DATA
  |--------------------------------------------------------------------------
  */
  const firstRecord = history.length > 0 ? history[0] : null;

  const lastRecord =
    history.length > 0
      ? history[history.length - 1]
      : null;

  const quotationNumber =
    firstRecord?.quotationNumber ||
    lastRecord?.quotationNumber ||
    "";

  const packingNumber =
    firstRecord?.packingNumber ||
    lastRecord?.packingNumber ||
    "";

  const customerName =
    firstRecord?.customerName ||
    lastRecord?.customerName ||
    "";

  const customerPhone =
    firstRecord?.customerPhone ||
    lastRecord?.customerPhone ||
    "";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */
  return (
    <div className="tracking-page">

      {/* HEADER */}
      <header className="tracking-header">
        <div className="tracking-header-inner">

          <div className="tracking-brand">
            <div className="tracking-brand-name">
              KICKMAC
            </div>

            <div className="tracking-brand-line">
              SOLUTIONS
            </div>
          </div>

          <div className="tracking-header-title">
            <span>Manager</span>
            <strong>Tracking</strong>
          </div>

          <button
            type="button"
            className="tracking-back-btn"
            onClick={() => navigate("/manager")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

        </div>
      </header>

      {/* MAIN */}
      <main className="tracking-main">

        {/* WELCOME */}
        <section className="tracking-welcome">

          <div className="tracking-welcome-icon">
            <Search size={27} />
          </div>

          <div>
            <div className="tracking-small-label">
              ORDER TRACKING
            </div>

            <h1>
              Track Quotation &amp; Packing
            </h1>

            <p>
              Search the complete order history
              from quotation creation to final
              delivery.
            </p>
          </div>

        </section>

        {/* SEARCH */}
        <section className="tracking-search-card">

          <form
            className="tracking-search-form"
            onSubmit={handleSearch}
          >

            <div className="tracking-search-input-wrap">

              <Search size={20} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search quotation number, packing number, customer name or phone"
              />

              {search && (
                <button
                  type="button"
                  className="tracking-clear-btn"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

            </div>

            <button
              type="submit"
              className="tracking-search-btn"
              disabled={loading}
            >
              <Search size={18} />

              {loading
                ? "Searching..."
                : "Search"}
            </button>

          </form>

          <div className="tracking-search-help">
            Examples:

            <span>QTN-2026-00001</span>
            <span>PK-2026-00001</span>
            <span>Customer Name</span>
            <span>Phone Number</span>
          </div>

        </section>

        {/* ERROR */}
        {error && (
          <div className="tracking-error">
            <XCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* SEARCHED RESULT */}
        {searched && history.length > 0 && (
          <>
            {/* SUMMARY */}
            <section className="tracking-summary">

              <div className="tracking-summary-top">

                <div>
                  <div className="tracking-result-label">
                    TRACKING RESULT
                  </div>

                  <h2>
                    {customerName || "Customer"}
                  </h2>

                  {customerPhone && (
                    <p>{customerPhone}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="tracking-refresh-btn"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw
                    size={17}
                    className={
                      loading
                        ? "tracking-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

              </div>

              <div className="tracking-summary-grid">

                <div className="tracking-summary-item">
                  <span>QUOTATION</span>

                  <strong>
                    {quotationNumber || "—"}
                  </strong>
                </div>

                <div className="tracking-summary-item">
                  <span>PACKING ORDER</span>

                  <strong>
                    {packingNumber || "Not created"}
                  </strong>
                </div>

                <div className="tracking-summary-item">
                  <span>TOTAL EVENTS</span>

                  <strong>
                    {history.length}
                  </strong>
                </div>

                <div className="tracking-summary-item">
                  <span>CURRENT STAGE</span>

                  <strong>
                    {formatAction(lastRecord?.action)}
                  </strong>
                </div>

              </div>

            </section>

            {/* TIMELINE */}
            <section className="tracking-timeline-card">

              <div className="tracking-section-heading">

                <div>
                  <div className="tracking-result-label">
                    COMPLETE HISTORY
                  </div>

                  <h2>
                    Order Timeline
                  </h2>
                </div>

                <div className="tracking-event-count">
                  {history.length} Events
                </div>

              </div>

              <div className="tracking-timeline">

                {history.map((item, index) => {

                  const details =
                    ACTION_DETAILS[item.action] || {
                      title: formatAction(item.action),
                      description:
                        "Tracking event recorded.",
                      icon: Clock3,
                    };

                  const Icon = details.icon;

                  const employeeText =
                    getEmployeeText(item);

                  const isLast =
                    index === history.length - 1;

                  return (
                    <div
                      className={`tracking-event ${
                        isLast
                          ? "tracking-event-last"
                          : ""
                      }`}
                      key={
                        item._id ||
                        `${item.action}-${index}`
                      }
                    >

                      {/* TIMELINE LINE */}
                      <div className="tracking-event-line">
                        {!isLast && (
                          <div className="tracking-event-connector" />
                        )}
                      </div>

                      {/* ICON */}
                      <div className="tracking-event-icon">
                        <Icon size={18} />
                      </div>

                      {/* CONTENT */}
                      <div className="tracking-event-content">

                        <div className="tracking-event-top">

                          <div>
                            <h3>
                              {details.title}
                            </h3>

                            <p>
                              {details.description}
                            </p>
                          </div>

                          <time>
                            {formatDate(item.createdAt)}
                          </time>

                        </div>

                        {/* DETAILS */}
                        <div className="tracking-event-details">

                          {item.note && (
                            <div className="tracking-detail">
                              <span>Note</span>

                              <strong>
                                {item.note}
                              </strong>
                            </div>
                          )}

                          {employeeText && (
                            <div className="tracking-detail">
                              <span>Handled By</span>

                              <strong>
                                {employeeText}
                              </strong>
                            </div>
                          )}

                          {item.result && (
                            <div className="tracking-detail">

                              <span>Result</span>

                              <strong
                                className={
                                  item.result === "MATCH"
                                    ? "tracking-match"
                                    : item.result === "MISMATCH"
                                    ? "tracking-mismatch"
                                    : ""
                                }
                              >
                                {item.result}
                              </strong>

                            </div>
                          )}

                          {item.requiredQuantity > 0 && (
                            <div className="tracking-detail">

                              <span>
                                Required Qty
                              </span>

                              <strong>
                                {item.requiredQuantity}
                              </strong>

                            </div>
                          )}

                          {item.actualQuantity > 0 && (
                            <div className="tracking-detail">

                              <span>
                                Actual Qty
                              </span>

                              <strong>
                                {item.actualQuantity}
                              </strong>

                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            </section>
          </>
        )}

        {/* INITIAL STATE */}
        {!searched && (
          <section className="tracking-empty">

            <div className="tracking-empty-icon">
              <Package size={30} />
            </div>

            <h2>
              Search an Order
            </h2>

            <p>
              Enter a quotation number,
              packing number, customer name
              or phone number to view the
              complete tracking timeline.
            </p>

          </section>
        )}

      </main>
    </div>
  );
}

export default Tracking;