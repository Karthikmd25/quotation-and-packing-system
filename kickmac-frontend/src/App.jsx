import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import "./App.css";

import MainLogin from "./pages/MainLogin";

/* ========================================
   MANAGER PAGES
======================================== */

import ManagerDashboard from "./pages/manager/ManagerDashboard";
import NewQuotation from "./pages/manager/NewQuotation";
import Quotations from "./pages/manager/Quotations";
import Customers from "./pages/manager/Customers";
import Products from "./pages/manager/Products";
import PackingOrders from "./pages/manager/PackingOrders";
import PackingCreate from "./pages/manager/PackingCreate";
import QuotationPdfPreview from "./pages/manager/QuotationPdfPreview";
import ManagerLogin from "./pages/manager/ManagerLogin";
import ManagerProtectedRoute from "./components/ManagerProtectedRoute";
import Tracking from "./pages/manager/Tracking";

/* ========================================
   PACKING DEPARTMENT
======================================== */

import PackingLogin from "./pages/packing/PackingLogin";
import PackingDashboard from "./pages/packing/PackingDashboard";
import PackingPicking from "./pages/packing/PackingPicking";
import PackingChecking from "./pages/packing/PackingChecking";
import PackingPacking from "./pages/packing/PackingPacking";
import PackingDispatch from "./pages/packing/PackingDispatch";
import PackingWorkflow from "./pages/packing/PackingWorkflow";

/* ========================================
   HOME PAGE
======================================== */

function Home() {
  return (
    <div className="portal-page">
      <div className="portal-container">

        {/* ================= HEADER ================= */}
        <header className="portal-header">

          <div className="portal-logo">
            <div className="portal-logo-mark">
              K
            </div>

            <div className="portal-logo-text">
              <div className="portal-logo-name">
                KICKMAC
              </div>

              <div className="portal-logo-subtitle">
                SOLUTIONS
              </div>
            </div>
          </div>

          <div className="portal-top-links">
            <span>SMART SYSTEMS</span>
            <b>/</b>
            <span>BETTER OPERATIONS</span>
            <b>/</b>
            <span>GROW TOGETHER</span>
          </div>

        </header>

        {/* ================= HERO ================= */}
        <section className="portal-hero">

          <div className="portal-hero-line"></div>

          <div className="portal-eyebrow">
            KICKMAC BUSINESS PORTAL
          </div>

          <h1>
            KICKMAC
            <span>SOLUTIONS</span>
          </h1>

          <h2>
            Manager &amp; Packing System
          </h2>

          <p>
            Quotation management, customer confirmation,
            packing verification and dispatch — all in one system.
          </p>

          <div className="portal-accent-line"></div>

        </section>

        {/* ================= ROLE CARDS ================= */}
        <section className="portal-roles">

          {/* MANAGER */}
          <Link
            to="/manager/login"
            className="portal-role-card manager-role"
          >
            <div className="portal-card-glow"></div>

            <div className="portal-card-content">

              <div className="portal-icon">
                📊
              </div>

              <div className="portal-card-title">
                <span>KICKMAC</span>
                <strong>MANAGER</strong>
              </div>

              <p>
                Customers, Products, Quotations,
                Approvals &amp; Reports
              </p>

              <div className="portal-login-button">
                Manager Login
                <span>→</span>
              </div>

            </div>
          </Link>

          {/* PACKING */}
          <Link
            to="/packing/login"
            className="portal-role-card packing-role"
          >
            <div className="portal-card-glow"></div>

            <div className="portal-card-content">

              <div className="portal-icon">
                📦
              </div>

              <div className="portal-card-title">
                <span>KICKMAC</span>
                <strong>PACKING</strong>
              </div>

              <p>
                Picking, Checking, Packing
                &amp; Dispatch
              </p>

              <div className="portal-login-button">
                Packing Login
                <span>→</span>
              </div>

            </div>
          </Link>

        </section>

        {/* ================= FOOTER ================= */}
        <footer className="portal-footer">

          <div className="portal-footer-line"></div>

          <span>
            © 2026 KICKMAC SOLUTIONS
          </span>

          <div className="portal-footer-line"></div>

        </footer>

      </div>
    </div>
  );
}
/* ========================================
   APP ROUTER
======================================== */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================================
            MAIN LOGIN
        ======================================== */}

        <Route
          path="/"
          element={<MainLogin />}
        />

        {/* ========================================
            MAIN HOME PAGE
            Opens after Main Login
        ======================================== */}

        <Route
          path="/home"
          element={<Home />}
        />

        {/* ========================================
            MANAGER LOGIN
        ======================================== */}

        <Route
          path="/manager/login"
          element={<ManagerLogin />}
        />

        {/* ========================================
            PROTECTED MANAGER ROUTES
        ======================================== */}

        <Route
          element={<ManagerProtectedRoute />}
        >

          {/* MANAGER DASHBOARD */}
          <Route
            path="/manager"
            element={<ManagerDashboard />}
          />

          {/* NEW QUOTATION */}
          <Route
            path="/manager/quotations/new"
            element={<NewQuotation />}
          />

          {/* QUOTATION PDF */}
          <Route
            path="/manager/quotations/:id/pdf"
            element={<QuotationPdfPreview />}
          />

          {/* QUOTATIONS */}
          <Route
            path="/manager/quotations"
            element={<Quotations />}
          />

          {/* CUSTOMERS */}
          <Route
            path="/manager/customers"
            element={<Customers />}
          />

          {/* PRODUCTS */}
          <Route
            path="/manager/products"
            element={<Products />}
          />

          {/* TRACKING */}
          <Route
            path="/manager/tracking"
            element={<Tracking />}
          />

          {/* MANAGER PACKING ORDERS */}
          <Route
            path="/manager/packing"
            element={<PackingOrders />}
          />

          {/* CREATE PACKING ORDER */}
          <Route
            path="/manager/packing/new"
            element={<PackingCreate />}
          />

        </Route>

        {/* ========================================
            PACKING LOGIN
        ======================================== */}

        <Route
          path="/packing/login"
          element={<PackingLogin />}
        />

        {/* ========================================
            PACKING DEPARTMENT DASHBOARD
        ======================================== */}

        <Route
          path="/packing"
          element={<PackingDashboard />}
        />

        {/* ========================================
            PACKING WORKFLOW
        ======================================== */}

        <Route
          path="/packing/workflow"
          element={<PackingWorkflow />}
        />

        {/* ========================================
            OLD PICKING PAGE
        ======================================== */}

        <Route
          path="/packing/picking"
          element={<PackingPicking />}
        />

        {/* ========================================
            OLD CHECKING PAGE
        ======================================== */}

        <Route
          path="/packing/checking"
          element={<PackingChecking />}
        />

        {/* ========================================
            OLD PACKING PAGE
        ======================================== */}

        <Route
          path="/packing/packing"
          element={<PackingPacking />}
        />

        {/* ========================================
            OLD DISPATCH PAGE
        ======================================== */}

        <Route
          path="/packing/dispatch"
          element={<PackingDispatch />}
        />

        {/* ========================================
            UNKNOWN URL
        ======================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;