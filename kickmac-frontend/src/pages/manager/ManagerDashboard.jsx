import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ManagerDashboard.css";

function ManagerDashboard() {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [packingOrders, setPackingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prevent duplicate dashboard loading in React development mode
  const hasLoadedRef = useRef(false);

  // =========================================
  // MANAGER LOGOUT
  // =========================================
  const handleLogout = () => {
    localStorage.removeItem("managerToken");
    localStorage.removeItem("manager");

    navigate("/manager/login", { replace: true });
  };

  // =========================================
  // LOAD DASHBOARD DATA
  // =========================================
  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        console.log("Loading dashboard data...");

        // Load quotations and packing orders at the same time
        const [quotationResult, packingResult] =
          await Promise.allSettled([
            api.get("/quotations", {
              timeout: 8000,
            }),

            api.get("/packing", {
              timeout: 8000,
            }),
          ]);

        if (!mounted) {
          return;
        }

        // =========================================
        // QUOTATIONS
        // =========================================

        if (quotationResult.status === "fulfilled") {
          const response = quotationResult.value;

          console.log("Quotation dashboard data loaded");

          const quotationData =
            response.data?.quotations ||
            response.data?.data ||
            [];

          setQuotations(
            Array.isArray(quotationData)
              ? quotationData
              : []
          );
        } else {
          console.error(
            "Quotation API error:",
            quotationResult.reason
          );

          setQuotations([]);
        }

        // =========================================
        // PACKING ORDERS
        // =========================================

        if (packingResult.status === "fulfilled") {
          const response = packingResult.value;

          console.log("Packing dashboard data loaded");

          const packingData =
            response.data?.packingOrders ||
            response.data?.orders ||
            response.data?.data ||
            [];

          setPackingOrders(
            Array.isArray(packingData)
              ? packingData
              : []
          );
        } else {
          console.error(
            "Packing API error:",
            packingResult.reason
          );

          setPackingOrders([]);
        }

        // =========================================
        // CHECK IF BOTH FAILED
        // =========================================

        const quotationFailed =
          quotationResult.status === "rejected";

        const packingFailed =
          packingResult.status === "rejected";

        if (quotationFailed && packingFailed) {
          const quotationError =
            quotationResult.reason;

          const message =
            quotationError?.response?.data?.message ||
            quotationError?.message ||
            "Failed to load dashboard data";

          setError(message);
        } else if (quotationFailed) {
          setError(
            "Quotation data could not be loaded."
          );
        } else if (packingFailed) {
          setError(
            "Packing order data could not be loaded."
          );
        }
      } catch (err) {
        console.error(
          "Dashboard API error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dashboard"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================
  // CUSTOMER COUNT
  // =========================================

  const customerIds = new Set();

  quotations.forEach((quotation) => {
    const customerId =
      quotation.customer?._id ||
      quotation.customer ||
      quotation.customerPhone ||
      quotation.customerName;

    if (customerId) {
      customerIds.add(String(customerId));
    }
  });

  const customerCount = customerIds.size;

  // =========================================
  // QUOTATION COUNT
  // =========================================

  const quotationCount = quotations.length;

  // =========================================
  // PACKING COUNT
  // =========================================

  const packingCount = packingOrders.length;

  // =========================================
  // DISPATCHED COUNT
  // =========================================

  const dispatchedCount = packingOrders.filter(
    (order) =>
      String(order.status || "").toUpperCase() ===
      "DISPATCHED"
  ).length;

  // =========================================
  // RECENT QUOTATIONS
  // =========================================

  const recentQuotations = quotations
    .slice()
    .sort((a, b) => {
      const dateA = new Date(
        a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="manager-page">
      {/* =====================================
          HEADER
      ====================================== */}

      <header className="manager-header">
        <div>
          <div className="manager-logo">
            KICKMAC
          </div>

          <div className="manager-title">
            Manager Panel
          </div>
        </div>

        <div className="manager-header-actions">
          <Link
            to="/"
            className="manager-home-btn"
          >
            ← Home
          </Link>

          <button
            type="button"
            className="manager-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* =====================================
          MAIN
      ====================================== */}

      <main className="manager-main">
        {/* =====================================
            WELCOME
        ====================================== */}

        <section className="manager-welcome">
          <div>
            <p className="welcome-label">
              WELCOME BACK
            </p>

            <h1>
              KICKMAC Manager
            </h1>

            <p>
              Manage customers, products,
              quotations and approved packing
              orders from one place.
            </p>
          </div>

          <Link
            to="/manager/quotations/new"
            className="new-quotation-btn"
          >
            + New Quotation
          </Link>
        </section>

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div className="dashboard-error">
            ⚠️ {error}
          </div>
        )}

        {/* =====================================
            STATS
        ====================================== */}

        <section className="manager-stats">
          {/* CUSTOMERS */}

          <Link
            to="/manager/customers"
            className="stat-card stat-link"
          >
            <div className="stat-icon">
              👥
            </div>

            <div>
              <span>
                Customers
              </span>

              <strong>
                {loading
                  ? "..."
                  : customerCount}
              </strong>
            </div>
          </Link>

          {/* QUOTATIONS */}

          <Link
            to="/manager/quotations"
            className="stat-card stat-link"
          >
            <div className="stat-icon">
              📄
            </div>

            <div>
              <span>
                Quotations
              </span>

              <strong>
                {loading
                  ? "..."
                  : quotationCount}
              </strong>
            </div>
          </Link>

          {/* PACKING ORDERS */}

          <Link
            to="/manager/packing-orders"
            className="stat-card stat-link"
          >
            <div className="stat-icon">
              📦
            </div>

            <div>
              <span>
                Packing Orders
              </span>

              <strong>
                {loading
                  ? "..."
                  : packingCount}
              </strong>
            </div>
          </Link>

          {/* DISPATCHED */}

          <Link
            to="/manager/packing-orders?status=DISPATCHED"
            className="stat-card stat-link"
          >
            <div className="stat-icon">
              🚚
            </div>

            <div>
              <span>
                Dispatched
              </span>

              <strong>
                {loading
                  ? "..."
                  : dispatchedCount}
              </strong>
            </div>
          </Link>
        </section>

        {/* =====================================
            RECENT QUOTATIONS
        ====================================== */}

        <section className="recent-section">
          <div className="section-heading">
            <div>
              <h2>
                Recent Quotations
              </h2>

              <p>
                Latest quotations created
                by the manager.
              </p>
            </div>

            <Link
              to="/manager/quotations"
              className="view-all-btn"
            >
              View All →
            </Link>
          </div>

          {/* LOADING */}

          {loading &&
          quotations.length === 0 ? (
            <div className="empty-dashboard-card">
              <div className="empty-icon">
                ⏳
              </div>

              <h3>
                Loading...
              </h3>

              <p>
                Getting your latest quotations.
              </p>
            </div>
          ) : quotations.length === 0 ? (
            /* NO QUOTATIONS */

            <div className="empty-dashboard-card">
              <div className="empty-icon">
                📄
              </div>

              <h3>
                No quotations yet
              </h3>

              <p>
                Create your first quotation
                to see it here.
              </p>

              <Link
                to="/manager/quotations/new"
                className="empty-action-btn"
              >
                + Create Quotation
              </Link>
            </div>
          ) : (
            /* QUOTATION TABLE */

            <div className="quotation-table-wrapper">
              <table className="quotation-table">
                <thead>
                  <tr>
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
                      Grand Total
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentQuotations.map(
                    (quotation) => (
                      <tr
                        key={quotation._id}
                      >
                        <td>
                          <strong>
                            {
                              quotation.quotationNumber
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            quotation.customerName
                          }
                        </td>

                        <td>
                          {
                            quotation.customerPhone ||
                            "-"
                          }
                        </td>

                        <td>
                          ₹
                          {Number(
                            quotation.grandTotal ||
                              0
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${String(
                              quotation.status ||
                                "DRAFT"
                            ).toLowerCase()}`}
                          >
                            {quotation.status ||
                              "DRAFT"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

{/* =====================================
    MANAGER MODULES
====================================== */}

<section className="manager-modules">

  <h2>
    Manager Modules
  </h2>

  <div className="manager-module-grid">

    {/* CUSTOMERS */}

    <Link
      to="/manager/customers"
      className="manager-module"
    >
      <div className="module-icon">
        👥
      </div>

      <h3>
        Customers
      </h3>

      <p>
        Search, add and manage
        customer information.
      </p>

      <span>
        Open →
      </span>
    </Link>


    {/* PRODUCTS */}

    <Link
      to="/manager/products"
      className="manager-module"
    >
      <div className="module-icon">
        🥋
      </div>

      <h3>
        Products
      </h3>

      <p>
        View karate products,
        sizes, colours and prices.
      </p>

      <span>
        Open →
      </span>
    </Link>


    {/* QUOTATIONS */}

    <Link
      to="/manager/quotations"
      className="manager-module"
    >
      <div className="module-icon">
        📄
      </div>

      <h3>
        Quotations
      </h3>

      <p>
        Create, review, send
        and approve quotations.
      </p>

      <span>
        Open →
      </span>
    </Link>


    {/* PACKING */}

    <Link
      to="/manager/packing-orders"
      className="manager-module"
    >
      <div className="module-icon">
        📦
      </div>

      <h3>
        Packing Orders
      </h3>

      <p>
        View quotations converted
        into packing orders.
      </p>

      <span>
        Open →
      </span>
    </Link>


    {/* TRACKING */}

    <Link
      to="/manager/tracking"
      className="manager-module"
    >
      <div className="module-icon">
        🔎
      </div>

      <h3>
        Tracking
      </h3>

      <p>
        Track quotations, packing,
        dispatch and delivery history.
      </p>

      <span>
        Open →
      </span>
    </Link>

  </div>

</section>
        {/* =====================================
            LOGOUT
        ====================================== */}

        <section className="manager-logout-section">
          <div>
            <h2>
              Manager Session
            </h2>

            <p>
              Finished your work? Logout from
              the manager panel securely.
            </p>
          </div>

          <button
            type="button"
            className="manager-logout-main-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </section>
      </main>
    </div>
  );
}

export default ManagerDashboard;