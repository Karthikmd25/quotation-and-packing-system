import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./ManagerPages.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");

      console.log("Customers response:", response.data);

      const data =
        response.data?.customers ||
        response.data?.data ||
        [];

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message || "Failed to load customers"
        );
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load customers error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="manager-subpage">
      <header className="subpage-header">
        <div>
          <div className="subpage-logo">KICKMAC</div>
          <div className="subpage-title">Customers</div>
        </div>

        <Link to="/manager" className="subpage-back-btn">
          ← Manager
        </Link>
      </header>

      <main className="subpage-main">
        <div className="subpage-title-row">
          <div>
            <h2>All Customers</h2>
            <p>Customers stored in your database.</p>
          </div>

          <div className="subpage-count">
            {loading ? "..." : customers.length} Customers
          </div>
        </div>

        {loading && <div className="loading-box">Loading customers...</div>}

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
            <button type="button" onClick={loadCustomers}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && customers.length === 0 && (
          <div className="empty-box">
            <div>👥</div>
            <h2>No Customers Found</h2>
            <p>Customers will appear here once created.</p>
          </div>
        )}

        {!loading && !error && customers.length > 0 && (
          <div className="subpage-table-wrapper">
            <table className="subpage-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <strong>{customer.name || "-"}</strong>
                    </td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.address || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default Customers;
