import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ManagerLogin.css";

function ManagerLogin() {
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
      // REMOVE OLD AUTHENTICATION DATA
      // =======================================================

      localStorage.removeItem("managerToken");
      localStorage.removeItem("manager");

      // Remove older authentication keys if they exist
      localStorage.removeItem("token");
      localStorage.removeItem("kickmac_token");

      // =======================================================
      // MANAGER LOGIN
      // =======================================================

      const response = await api.post("/auth/manager/login", {
        username: username.trim(),
        password,
      });

      // =======================================================
      // CHECK RESPONSE
      // =======================================================

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Login failed"
        );
      }

      const { token, manager } = response.data;

      // =======================================================
      // VALIDATE TOKEN
      // =======================================================

      if (!token) {
        throw new Error(
          "Login successful, but authentication token was not received."
        );
      }

      // =======================================================
      // VALIDATE MANAGER DATA
      // =======================================================

      if (!manager) {
        throw new Error(
          "Login successful, but manager information was not received."
        );
      }

      if (!manager.employeeId) {
        throw new Error(
          "Manager employee ID was not received from the server."
        );
      }

      // =======================================================
      // SAVE NEW AUTHENTICATION
      // =======================================================

      localStorage.setItem("managerToken", token);

      localStorage.setItem(
        "manager",
        JSON.stringify({
          id: manager.id,
          employeeId: manager.employeeId,
          name: manager.name,
          username: manager.username,
          role: manager.role,
        })
      );

      // =======================================================
      // DEBUG INFORMATION
      // =======================================================

      console.log("Manager login successful");
      console.log("Manager:", manager);
      console.log("Manager Employee ID:", manager.employeeId);

      // =======================================================
      // GO TO MANAGER DASHBOARD
      // =======================================================

      navigate("/manager", {
        replace: true,
      });
    } catch (err) {
      console.error("Manager login error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="manager-login-page">
      <div className="manager-login-card">

        {/* =====================================================
            BRAND
        ===================================================== */}

        <div className="manager-login-brand">
          KICKMAC
        </div>

        <h1>Manager Login</h1>

        <p className="manager-login-subtitle">
          Sign in to access the Manager Dashboard
        </p>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="manager-login-error">
            {error}
          </div>
        )}

        {/* =====================================================
            LOGIN FORM
        ===================================================== */}

        <form onSubmit={handleLogin}>

          {/* USERNAME */}

          <div className="manager-login-field">
            <label htmlFor="manager-username">
              Username
            </label>

            <input
              id="manager-username"
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

          <div className="manager-login-field">
            <label htmlFor="manager-password">
              Password
            </label>

            <input
              id="manager-password"
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
            className="manager-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="manager-login-footer">
          KICKMAC SOLUTIONS
        </div>
      </div>
    </div>
  );
}

export default ManagerLogin;

