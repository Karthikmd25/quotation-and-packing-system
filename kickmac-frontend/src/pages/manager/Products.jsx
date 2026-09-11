import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./ManagerPages.css";

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      console.log("Products response:", response.data);

      const data =
        response.data?.products ||
        response.data?.data ||
        [];

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message || "Failed to load products"
        );
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load products error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="manager-subpage">
      <header className="subpage-header">
        <div>
          <div className="subpage-logo">KICKMAC</div>
          <div className="subpage-title">Products</div>
        </div>

        <Link to="/manager" className="subpage-back-btn">
          ← Manager
        </Link>
      </header>

      <main className="subpage-main">
        <div className="subpage-title-row">
          <div>
            <h2>All Products</h2>
            <p>Karate products, sizes, colours and prices.</p>
          </div>

          <div className="subpage-count">
            {loading ? "..." : products.length} Products
          </div>
        </div>

        {loading && <div className="loading-box">Loading products...</div>}

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
            <button type="button" onClick={loadProducts}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-box">
            <div>🥋</div>
            <h2>No Products Found</h2>
            <p>Products will appear here once added.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="subpage-table-wrapper">
            <table className="subpage-table">
              <thead>
                <tr>
                  <th>Part No.</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Colour</th>
                  <th>Unit</th>
                  <th>Price</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <strong>{product.partNumber || "-"}</strong>
                    </td>
                    <td>{product.name || product.productName || "-"}</td>
                    <td>{product.size || "-"}</td>
                    <td>{product.colour || "-"}</td>
                    <td>{product.unit || "Piece"}</td>
                    <td>{formatCurrency(product.price)}</td>
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

export default Products;
