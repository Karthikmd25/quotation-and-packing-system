import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  RefreshCw,
  ChevronRight,
  Search,
  X,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PackingDashboard.css";

/* =========================================================
   RESPONSE HELPER
========================================================= */

function extractPackingOrders(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.packingOrders)) {
    return data.packingOrders;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/* =========================================================
   CUSTOMER HELPERS
========================================================= */

function getCustomerName(order) {
  return (
    order?.customerName ||
    order?.quotation?.customerName ||
    order?.customer?.name ||
    "Unknown Customer"
  );
}

function getCustomerPhone(order) {
  return (
    order?.customerPhone ||
    order?.quotation?.customerPhone ||
    order?.customer?.phone ||
    ""
  );
}

/* =========================================================
   QUOTATION
========================================================= */

function getQuotationNumber(order) {
  return (
    order?.quotationNumber ||
    order?.quotation?.quotationNumber ||
    ""
  );
}

/* =========================================================
   PACKING NUMBER
========================================================= */

function getPackingNumber(order) {
  return (
    order?.packingNumber ||
    order?.packingNo ||
    "PACKING ORDER"
  );
}

/* =========================================================
   ITEM COUNT
========================================================= */

function getItemCount(order) {
  if (Array.isArray(order?.packingItems)) {
    return order.packingItems.length;
  }

  if (Array.isArray(order?.items)) {
    return order.items.length;
  }

  return 0;
}

/* =========================================================
   STATUS
========================================================= */

function getStatus(order) {
  const status = String(order?.status || "READY").toUpperCase();

  if (
    status === "DRAFT" ||
    status === "PACKING_CREATED" ||
    status === "PENDING"
  ) {
    return "READY";
  }

  if (
    status === "PACKED" ||
    status === "PACKING_COMPLETED"
  ) {
    return "PACKED";
  }

  return status;
}

/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {
  const cleanStatus = String(status)
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  return `packing-order-status packing-order-status-${cleanStatus}`;
}

/* =========================================================
   TRANSPORT SLIP
========================================================= */

function hasTransportSlip(order) {
  return Boolean(
    order?.transportSlipPhoto ||
      order?.transportSlip?.photo ||
      order?.transportSlip?.image ||
      order?.transportSlip?.fileData ||
      order?.transportSlip?.photoBase64
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function PackingDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/packing");

      console.log(
        "Packing Dashboard API response:",
        response.data
      );

      const packingOrders =
        extractPackingOrders(response);

      const sortedOrders = [...packingOrders].sort(
        (a, b) => {
          const dateA = new Date(
            a?.createdAt ||
              a?.updatedAt ||
              0
          ).getTime();

          const dateB = new Date(
            b?.createdAt ||
              b?.updatedAt ||
              0
          ).getTime();

          return dateB - dateA;
        }
      );

      setOrders(sortedOrders);
    } catch (err) {
      console.error(
        "Packing Dashboard loading error:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      if (
        err.code === "ERR_CANCELED" ||
        err.name === "CanceledError" ||
        err.message === "canceled"
      ) {
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load packing orders."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     AUTO LOAD
  ======================================================= */

  useEffect(() => {
    loadOrders();
  }, []);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return orders;
    }

    return orders.filter((order) => {
      const customerName =
        getCustomerName(order).toLowerCase();

      const phone =
        getCustomerPhone(order).toLowerCase();

      const quotation =
        getQuotationNumber(order).toLowerCase();

      const packingNumber =
        getPackingNumber(order).toLowerCase();

      return (
        customerName.includes(value) ||
        phone.includes(value) ||
        quotation.includes(value) ||
        packingNumber.includes(value)
      );
    });
  }, [orders, search]);

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  function clearSearch() {
    setSearch("");
  }

  /* =======================================================
     OPEN PACKING WORKFLOW
  ======================================================= */

  function openPacking(order) {
    if (!order?._id) {
      console.error(
        "Packing order ID is missing:",
        order
      );
      return;
    }

    navigate(
      `/packing/workflow?packingId=${order._id}`
    );
  }

  /* =======================================================
     BACK HOME
  ======================================================= */

  function backHome() {
    navigate("/");
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="packing-dashboard-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="packing-dashboard-header">
        <div className="packing-header-left">

          <div className="packing-brand">
            KICKMAC
          </div>

          <h1>
            Packing Dashboard
          </h1>

          <div className="packing-header-line" />
        </div>

        <button
          type="button"
          className="packing-home-button"
          onClick={backHome}
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="packing-dashboard-content">

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="packing-welcome-card">

          <div className="packing-section-line">
            <span />
            <span />
          </div>

          <div className="packing-welcome-content">

            <div className="packing-welcome-icon">
              <Package size={28} />
            </div>

            <div>
              <h2>
                Welcome to KICKMAC Packing Dashboard
              </h2>

              <p>
                Manage picking, checking, packing and
                dispatch orders from one place.
              </p>
            </div>

          </div>

          <div className="packing-welcome-bottom-line" />
        </section>

        {/* =================================================
            ORDERS SECTION
        ================================================= */}

        <section className="packing-orders-section">

          {/* =================================================
              SECTION HEADING
          ================================================= */}

          <div className="packing-orders-heading">

            <div>

              <div className="packing-heading-label">
                PACKING
              </div>

              <h2>
                Packing Orders
              </h2>

              <p>
                Search customer name, phone number,
                quotation or packing number.
              </p>

            </div>

            <button
              type="button"
              className="packing-dashboard-refresh"
              onClick={loadOrders}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "packing-spin"
                    : ""
                }
              />

              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>

          {/* =================================================
              HEADING LINE
          ================================================= */}

          <div className="packing-section-divider">
            <span />
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="packing-search-wrapper">

            <Search
              size={20}
              className="packing-search-icon"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customer name, phone, quotation or packing number..."
            />

            {search && (
              <button
                type="button"
                className="packing-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}

          </div>

          {/* =================================================
              SEARCH RESULT COUNT
          ================================================= */}

          {!loading &&
            !error &&
            orders.length > 0 && (
              <div className="packing-search-count">

                {search ? (
                  <>
                    Showing{" "}
                    <strong>
                      {filteredOrders.length}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {orders.length}
                    </strong>{" "}
                    packing orders
                  </>
                ) : (
                  <>
                    <strong>
                      {orders.length}
                    </strong>{" "}
                    packing order
                    {orders.length !== 1
                      ? "s"
                      : ""}{" "}
                    available
                  </>
                )}

              </div>
            )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="packing-dashboard-error">
              {error}
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="packing-empty-state">

              <RefreshCw
                size={38}
                className="packing-spin"
              />

              <h3 className="packing-empty-state-title">
                Loading Packing Orders...
              </h3>

              <p className="packing-empty-state-text">
                Please wait.
              </p>

            </div>
          )}

          {/* =================================================
              NO ORDERS
          ================================================= */}

          {!loading &&
            !error &&
            orders.length === 0 && (
              <div className="packing-empty-state">

                <Package size={44} />

                <h3 className="packing-empty-state-title">
                  No Packing Orders
                </h3>

                <p className="packing-empty-state-text">
                  Packing orders created by the manager
                  will appear here.
                </p>

              </div>
            )}

          {/* =================================================
              NO SEARCH RESULTS
          ================================================= */}

          {!loading &&
            !error &&
            orders.length > 0 &&
            filteredOrders.length === 0 && (
              <div className="packing-empty-state">

                <Search size={42} />

                <h3 className="packing-empty-state-title">
                  No Matching Orders
                </h3>

                <p className="packing-empty-state-text">
                  Try another customer name,
                  phone number or quotation number.
                </p>

                <button
                  type="button"
                  className="packing-clear-search-button"
                  onClick={clearSearch}
                >
                  Clear Search
                </button>

              </div>
            )}

          {/* =================================================
              ORDERS
          ================================================= */}

          {!loading &&
            !error &&
            filteredOrders.length > 0 && (

              <div className="packing-orders-grid">

                {filteredOrders.map((order) => {

                  const status =
                    getStatus(order);

                  const slipUploaded =
                    hasTransportSlip(order);

                  return (
                    <article
                      className="packing-order-card"
                      key={order?._id}
                    >

                      {/* =================================================
                          CARD TOP
                      ================================================= */}

                      <div className="packing-order-card-top">

                        <div className="packing-order-number">

                          <div className="packing-order-icon">
                            <Package size={20} />
                          </div>

                          <strong>
                            {getPackingNumber(order)}
                          </strong>

                        </div>

                        <span
                          className={getStatusClass(
                            status
                          )}
                        >
                          {status}
                        </span>

                      </div>

                      {/* =================================================
                          SMALL LINE
                      ================================================= */}

                      <div className="packing-card-line" />

                      {/* =================================================
                          DETAILS
                      ================================================= */}

                      <div className="packing-order-details">

                        <div className="packing-order-detail-row">

                          <span className="packing-order-detail-label">
                            Customer
                          </span>

                          <strong className="packing-order-detail-value">
                            {getCustomerName(order)}
                          </strong>

                        </div>

                        <div className="packing-order-detail-row">

                          <span className="packing-order-detail-label">
                            Phone
                          </span>

                          <strong className="packing-order-detail-value">
                            {getCustomerPhone(order) || "—"}
                          </strong>

                        </div>

                        <div className="packing-order-detail-row">

                          <span className="packing-order-detail-label">
                            Quotation
                          </span>

                          <strong className="packing-order-detail-value">
                            {getQuotationNumber(order) || "—"}
                          </strong>

                        </div>

                        <div className="packing-order-detail-row">

                          <span className="packing-order-detail-label">
                            Items
                          </span>

                          <strong className="packing-order-detail-value">
                            {getItemCount(order)}
                          </strong>

                        </div>

                      </div>

                      {/* =================================================
                          TRANSPORT SLIP STATUS
                      ================================================= */}

                      <div
                        className={
                          slipUploaded
                            ? "packing-slip-status uploaded"
                            : "packing-slip-status not-uploaded"
                        }
                      >

                        <span>
                          {slipUploaded
                            ? "✓"
                            : "✕"}
                        </span>

                        {slipUploaded
                          ? "Transport Slip Uploaded"
                          : "Transport Slip Not Uploaded"}

                      </div>

                      {/* =================================================
                          CARD FOOTER
                      ================================================= */}

                      <div className="packing-order-card-footer">

                        <div className="packing-order-items">

                          <span>
                            Items
                          </span>

                          <strong>
                            {getItemCount(order)}
                          </strong>

                        </div>

                        <button
                          type="button"
                          className="packing-open-btn"
                          onClick={() =>
                            openPacking(order)
                          }
                        >
                          Open Packing

                          <ChevronRight size={17} />
                        </button>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

        </section>
      </main>
    </div>
  );
}