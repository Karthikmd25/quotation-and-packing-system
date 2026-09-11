import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, User, LogIn } from "lucide-react";
import "./MainLogin.css";

function MainLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    // Main login credentials
    if (
      username.trim() === "kickmac" &&
      password === "Kickmac@123"
    ) {
      sessionStorage.setItem(
        "kickmac_main_login",
        "true"
      );

      navigate("/home");
      return;
    }

    setError("Invalid username or password.");
  };

  return (
    <div className="main-login-page">

      <div className="main-login-card">

        {/* BRAND */}
        <div className="main-login-brand">
          <div className="main-login-logo">
            KICKMAC
          </div>

          <div className="main-login-company">
            SOLUTIONS
          </div>

          <div className="main-login-line"></div>
        </div>

        {/* TITLE */}
        <div className="main-login-heading">
          <h1>Welcome Back</h1>

          <p>
            Sign in to access the KICKMAC system
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="main-login-error">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          className="main-login-form"
          onSubmit={handleLogin}
        >

          {/* USERNAME */}
          <div className="main-login-field">

            <label>
              Username
            </label>

            <div className="main-login-input">

              <User size={19} />

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter username"
                autoComplete="username"
              />

            </div>

          </div>

          {/* PASSWORD */}
          <div className="main-login-field">

            <label>
              Password
            </label>

            <div className="main-login-input">

              <LockKeyhole size={19} />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
              />

            </div>

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="main-login-button"
          >
            <LogIn size={19} />

            Login
          </button>

        </form>

        {/* FOOTER */}
        <div className="main-login-footer">
          <span>
            KICKMAC SOLUTIONS
          </span>

          <small>
            Manager &amp; Packing Management System
          </small>
        </div>

      </div>

    </div>
  );
}

export default MainLogin;