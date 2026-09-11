import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./PackingLogin.css";

function PackingLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setError("");

    // =========================================================
    // VALIDATE INPUT
    // =========================================================

    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      // =======================================================
      // PACKING LOGIN
      // =======================================================
      //
      // Current packing login credentials:
      // Username: packing
      // Password: Packing@123
      //
      // =======================================================

      if (
        username.trim().toLowerCase() === "packing" &&
        password === "Packing@123"
      ) {
        sessionStorage.setItem(
          "kickmac_packing_login",
          "true"
        );

        console.log("Packing login successful");

        // =====================================================
        // GO TO PACKING DASHBOARD
        // =====================================================

        navigate("/packing", {
          replace: true,
        });

        return;
      }

      throw new Error("Invalid username or password.");
    } catch (err) {
      console.error("Packing login error:", err);

      setError(
        err.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="packing-login-page">
      <div className="packing-login-card">

        {/* =====================================================
            BRAND
        ===================================================== */}

        <div className="packing-login-brand">
          KICKMAC
        </div>

        <h1>
          Packing Login
        </h1>

        <p className="packing-login-subtitle">
          Sign in to access the Packing Dashboard
        </p>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="packing-login-error">
            {error}
          </div>
        )}

        {/* =====================================================
            LOGIN FORM
        ===================================================== */}

        <form onSubmit={handleLogin}>

          {/* USERNAME */}

          <div className="packing-login-field">

            <label htmlFor="packing-username">
              Username
            </label>

            <input
              id="packing-username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              autoComplete="username"
              disabled={loading}
            />

          </div>

          {/* PASSWORD */}

          <div className="packing-login-field">

            <label htmlFor="packing-password">
              Password
            </label>

            <input
              id="packing-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="current-password"
              disabled={loading}
            />

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="packing-login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Login"}
          </button>

        </form>

        {/* =====================================================
            BACK TO HOME
        ===================================================== */}

        <button
          type="button"
          className="packing-login-back"
          onClick={() => navigate("/home")}
          disabled={loading}
        >
          ← Back to Home
        </button>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="packing-login-footer">
          KICKMAC SOLUTIONS
        </div>

      </div>
    </div>
  );
}

export default PackingLogin;