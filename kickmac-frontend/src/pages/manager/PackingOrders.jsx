import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { Package, RefreshCw, ArrowRight } from "lucide-react";
import api from "../../services/api";
import "./ManagerPages.css";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "-";
  }
}

function getItems(order) {
  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.packingItems)) {
    return order.packingItems;
  }

  return [];
}

function getTotalItems(order) {
  const items = getItems(order);

  return items.reduce(
    (total, item) =>
      total +
      Number(
        item?.requiredQuantity ??
          item?.quantity ??
          0
      ),
    0
  );
}

function getQuotationNumber(order) {
  return (
    order?.quotationNumber ||
    order?.quotation?.quotationNumber ||
    "-"
  );
}

function getCustomerName(order) {
  return (
    order?.customerName ||
    order?.customer?.name ||
    order?.quotation?.customerName ||
    order?.quotation?.customer?.name ||
    "-"
  );
}

function getCustomerPhone(order) {
  return (
    order?.customerPhone ||
    order?.customer?.phone ||
    order?.quotation?.customerPhone ||
    order?.quotation?.customer?.phone ||
    "-"
  );
}

function getPackingNumber(order) {
  return (
    order?.packingNumber ||
    order?.packingNo ||
    "-"
  );
}

function getStatusClass(status) {
  return String(
    status || "CREATED"
  )
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/* =========================================================
   COMPONENT
========================================================= */

function PackingOrders() {
  const [searchParams] =
    useSearchParams();

  const statusFilter =
    searchParams.get("status");

  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD PACKING ORDERS
  ======================================================= */

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/packing");

      console.log(
        "Packing response:",
        response.data
      );

      if (
        response?.data?.success === false
      ) {
        throw new Error(
          response?.data?.message ||
            "Failed to load packing orders"
        );
      }

      const data =
        response?.data?.packingOrders ||
        response?.data?.orders ||
        response?.data?.data ||
        [];

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Load packing orders error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load packing orders"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredOrders =
    statusFilter
      ? orders.filter(
          (order) =>
            String(
              order?.status || ""
            ).toUpperCase() ===
            String(
              statusFilter
            ).toUpperCase()
        )
      : orders;

  /* =======================================================
     OPEN PACKING WORKFLOW
  ======================================================= */

  function openOrder(orderId) {
    if (!orderId) {
      return;
    }

    /*
      PackingWorkflow belongs to the
      Packing section, NOT Manager section.
    */

    navigate(
      `/packing/workflow?packingId=${orderId}`
    );
  }

  /* =======================================================
     OPEN PACKING DASHBOARD
  ======================================================= */

  function openPackingDashboard() {
    navigate("/packing");
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="manager-subpage">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="subpage-header">

        <div>
          <div className="subpage-logo">
            KICKMAC
          </div>

          <div className="subpage-title">
            Packing Orders
          </div>
        </div>

        <Link
          to="/manager"
          className="subpage-back-btn"
        >
          ← Manager
        </Link>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="subpage-main">

        {/* =================================================
            TITLE ROW
        ================================================= */}

        <div className="subpage-title-row">

          <div>
            <h2>
              {statusFilter
                ? `Packing Orders — ${statusFilter}`
                : "All Packing Orders"}
            </h2>

            <p>
              Quotations converted into
              packing orders.
            </p>
          </div>

          <div className="subpage-title-actions">

            <button
              type="button"
              className="subpage-action-btn"
              onClick={
                openPackingDashboard
              }
            >
              <Package size={17} />

              Packing Dashboard

              <ArrowRight
                size={17}
              />
            </button>

            <button
              type="button"
              className="subpage-refresh-btn"
              onClick={
                loadOrders
              }
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />

              Refresh
            </button>

            <div className="subpage-count">
              {loading
                ? "..."
                : filteredOrders.length}{" "}
              Orders
            </div>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="loading-box">
            Loading packing orders...
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="error-box">

            <strong>
              Error:
            </strong>{" "}
            {error}

            <button
              type="button"
              onClick={
                loadOrders
              }
            >
              Retry
            </button>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredOrders.length ===
            0 && (
            <div className="empty-box">

              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "10px",
                }}
              >
                📦
              </div>

              <h2>
                No Packing Orders Found
              </h2>

              <p>
                {statusFilter
                  ? `No orders with status ${statusFilter} yet.`
                  : "Packing orders will appear here once created."}
              </p>

              <button
                type="button"
                className="subpage-action-btn"
                onClick={
                  openPackingDashboard
                }
              >
                Open Packing Dashboard
                <ArrowRight
                  size={17}
                />
              </button>

            </div>
          )}

        {/* =================================================
            ORDERS TABLE
        ================================================= */}

        {!loading &&
          !error &&
          filteredOrders.length >
            0 && (
            <div className="subpage-table-wrapper">

              <table className="subpage-table">

                <thead>
                  <tr>

                    <th>
                      Packing No.
                    </th>

                    <th>
                      Quotation No.
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Total Items
                    </th>

                    <th>
                      Created
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredOrders.map(
                    (order) => {

                      const status =
                        order?.status ||
                        "CREATED";

                      return (
                        <tr
                          key={
                            order?._id
                          }
                        >

                          {/* Packing Number */}
                          <td>

                            <strong>
                              {getPackingNumber(
                                order
                              )}
                            </strong>

                          </td>

                          {/* Quotation */}
                          <td>

                            <strong>
                              {getQuotationNumber(
                                order
                              )}
                            </strong>

                          </td>

                          {/* Customer */}
                          <td>
                            {getCustomerName(
                              order
                            )}
                          </td>

                          {/* Phone */}
                          <td>
                            {getCustomerPhone(
                              order
                            )}
                          </td>

                          {/* Items */}
                          <td>
                            {getTotalItems(
                              order
                            )}
                          </td>

                          {/* Date */}
                          <td>
                            {formatDate(
                              order?.createdAt
                            )}
                          </td>

                          {/* Status */}
                          <td>

                            <span
                              className={`status-badge status-${getStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>

                          </td>

                          {/* Action */}
                          <td>

                            <button
                              type="button"
                              className="packing-open-btn"
                              onClick={() =>
                                openOrder(
                                  order?._id
                                )
                              }
                            >
                              <Package
                                size={16}
                              />

                              Open Packing

                              <ArrowRight
                                size={16}
                              />
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

      </main>

    </div>
  );
}

export default PackingOrders;