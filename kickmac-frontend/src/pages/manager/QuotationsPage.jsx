import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./QuotationsPage.css";

function QuotationsPage() {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuotations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/quotations");

      console.log("Quotations API response:", response.data);

      if (response.data.success) {
        setQuotations(response.data.quotations || []);
      } else {
        setError(
          response.data.message || "Failed to load quotations"
        );
      }
    } catch (err) {
      console.error("Load quotations error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load quotations. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMoney = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const getStatusClass = (status) => {
    return `status-badge status-${String(status || "")
      .toLowerCase()
      .replaceAll("_", "-")}`;
  };

  return (
    <div className="quotations-page">

      {/* HEADER */}
      <header className="quotations-header">

        <div>
          <div className="quotations-logo">
            KICKMAC
          </div>

          <div className="quotations-title">
            Manager Panel
          </div>
        </div>

        <div className="header-actions">

          <Link
            to="/manager"
            className="back-manager-btn"
          >
            ← Manager
          </Link>

          <Link
            to="/manager/quotations/new"
            className="new-quotation-btn"
          >
            + New Quotation
          </Link>

        </div>

      </header>


      {/* MAIN */}
      <main className="quotations-main">

        {/* TITLE */}
        <section className="quotations-heading">

          <div>
            <p className="section-label">
              KICKMAC • SALES
            </p>

            <h1>
              Quotations
            </h1>

            <p>
              View and manage all saved customer quotations.
            </p>
          </div>

          <div className="quotation-count">
            {loading ? "..." : quotations.length}
            <span> Quotations</span>
          </div>

        </section>


        {/* ERROR */}
        {error && (
          <div className="quotation-error">
            <strong>Error:</strong> {error}

            <button
              onClick={loadQuotations}
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        )}


        {/* LOADING */}
        {loading && (
          <div className="quotation-loading">
            Loading quotations...
          </div>
        )}


        {/* EMPTY */}
        {!loading &&
          !error &&
          quotations.length === 0 && (
            <div className="quotation-empty">

              <div className="empty-icon">
                📄
              </div>

              <h2>
                No Quotations Found
              </h2>

              <p>
                Create your first quotation to see it here.
              </p>

              <Link
                to="/manager/quotations/new"
                className="new-quotation-btn"
              >
                + Create Quotation
              </Link>

            </div>
          )}


        {/* QUOTATION LIST */}
        {!loading &&
          quotations.length > 0 && (

            <section className="quotation-list">

              {quotations.map((quotation) => (

                <article
                  className="quotation-card"
                  key={quotation._id}
                >

                  {/* CARD HEADER */}
                  <div className="quotation-card-header">

                    <div>
                      <div className="quotation-number">
                        {quotation.quotationNumber}
                      </div>

                      <div className="quotation-date">
                        Created{" "}
                        {formatDate(
                          quotation.createdAt
                        )}
                      </div>
                    </div>

                    <span
                      className={getStatusClass(
                        quotation.status
                      )}
                    >
                      {quotation.status ||
                        "DRAFT"}
                    </span>

                  </div>


                  {/* CUSTOMER */}
                  <div className="quotation-customer">

                    <div className="customer-icon">
                      👤
                    </div>

                    <div>

                      <strong>
                        {quotation.customerName ||
                          quotation.customer?.name ||
                          "Unknown Customer"}
                      </strong>

                      <span>
                        {quotation.customerPhone ||
                          quotation.customer?.phone ||
                          "No phone"}
                      </span>

                    </div>

                  </div>


                  {/* ITEMS */}
                  <div className="quotation-items">

                    <div className="items-title">
                      Products
                    </div>

                    {quotation.items?.map(
                      (item, index) => (

                        <div
                          className="quotation-item"
                          key={
                            item._id || index
                          }
                        >

                          <div className="item-part">
                            <strong>
                              {item.partNumber}
                            </strong>

                            <span>
                              {item.productName}
                            </span>
                          </div>


                          <div className="item-detail">
                            <span>Size</span>
                            <strong>
                              {item.size || "-"}
                            </strong>
                          </div>


                          <div className="item-detail">
                            <span>Colour</span>
                            <strong>
                              {item.colour || "-"}
                            </strong>
                          </div>


                          <div className="item-detail">
                            <span>Qty</span>
                            <strong>
                              {item.quantity}
                            </strong>
                          </div>


                          <div className="item-detail">
                            <span>Price</span>
                            <strong>
                              {formatMoney(
                                item.unitPrice
                              )}
                            </strong>
                          </div>


                          <div className="item-total">
                            {formatMoney(
                              item.total
                            )}
                          </div>

                        </div>

                      )
                    )}

                  </div>


                  {/* TOTALS */}
                  <div className="quotation-bottom">

                    <div className="quotation-info">

                      <div>
                        <span>
                          Payment
                        </span>

                        <strong>
                          {quotation.paymentMethod ||
                            "-"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Transport
                        </span>

                        <strong>
                          {quotation.transportMethod ||
                            "-"}
                        </strong>
                      </div>

                    </div>


                    <div className="quotation-total">

                      <span>
                        Grand Total
                      </span>

                      <strong>
                        {formatMoney(
                          quotation.grandTotal
                        )}
                      </strong>

                    </div>

                  </div>


                  {/* ACTIONS */}
                  <div className="quotation-actions">

                    <button
                      type="button"
                      className="view-btn"
                      onClick={() =>
                        navigate(
                          `/manager/quotations/${quotation._id}`
                        )
                      }
                    >
                      View Quotation
                    </button>

                    {quotation.status ===
                      "DRAFT" && (
                      <button
                        type="button"
                        className="send-btn"
                        onClick={() =>
                          alert(
                            "Send quotation will be connected next."
                          )
                        }
                      >
                        Send Quotation
                      </button>
                    )}

                  </div>

                </article>

              ))}

            </section>

          )}

      </main>

    </div>
  );
}

export default QuotationsPage;