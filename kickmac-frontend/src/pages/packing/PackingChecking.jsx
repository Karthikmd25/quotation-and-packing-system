import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  PackageCheck,
  Check,
  X,
  ArrowLeft,
  RefreshCw,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import api from "../../services/api";
import "./PackingChecking.css";

function getMatchState(item) {
  const value = item.checkedQuantity;

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "pending";
  }

  return Number(value) === Number(item.requiredQuantity)
    ? "match"
    : "mismatch";
}

function getCustomerName(order) {
  return (
    order?.customerName ||
    order?.customer?.name ||
    "-"
  );
}

function getCustomerPhone(order) {
  return (
    order?.customerPhone ||
    order?.phone ||
    order?.customer?.phone ||
    "-"
  );
}

function getCustomerEmail(order) {
  return (
    order?.customerEmail ||
    order?.email ||
    order?.customer?.email ||
    "-"
  );
}

function getCustomerAddress(order) {
  return (
    order?.dispatchAddress ||
    order?.customerAddress ||
    order?.customer?.address ||
    "-"
  );
}

function getTotalItems(order) {
  if (!order?.items?.length) {
    return 0;
  }

  return order.items.reduce(
    (sum, item) =>
      sum +
      Number(
        item.requiredQuantity ??
          item.quantity ??
          0
      ),
    0
  );
}

function getPackageText(order) {
  return `${order?.numberOfPackages || 0} ${
    order?.packageType || "Packages"
  }`;
}

export default function PackingChecking() {
  const [searchParams] = useSearchParams();

  const packingId =
    searchParams.get("packingId");

  const [orders, setOrders] = useState([]);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [items, setItems] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =====================================================
     LOAD PACKING ORDERS
  ===================================================== */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/packing");

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : response.data?.packingOrders ||
          response.data?.orders ||
          response.data?.data ||
          [];

      setOrders(data);

      if (packingId) {
        const found = data.find(
          (order) =>
            String(order._id) ===
            String(packingId)
        );

        if (found) {
          openOrder(found);
        }
      }
    } catch (err) {
      console.error(
        "Packing checking load error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load packing orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [packingId]);

  /* =====================================================
     OPEN ORDER
  ===================================================== */

  const openOrder = (order) => {
    setSelectedOrder(order);

    setError("");

    setSuccess("");

    const mappedItems =
      (order.items || []).map((item) => ({
        itemId:
          item._id ||
          item.itemId ||
          `${item.productId || "item"}-${
            item.partNumber || ""
          }`,

        productId:
          item.productId ||
          item.product ||
          null,

        partNumber:
          item.partNumber || "-",

        productName:
          item.productName ||
          item.product?.name ||
          "-",

        size:
          item.size || "",

        colour:
          item.colour ||
          item.color ||
          "",

        unit:
          item.unit ||
          "Piece",

        requiredQuantity:
          Number(
            item.requiredQuantity ??
              item.quantity ??
              0
          ),

        pickedQuantity:
          item.pickedQuantity === null ||
          item.pickedQuantity === undefined
            ? ""
            : Number(
                item.pickedQuantity
              ),

        checkedQuantity:
          item.checkedQuantity === null ||
          item.checkedQuantity === undefined
            ? ""
            : Number(
                item.checkedQuantity
              ),

        packedQuantity:
          item.packedQuantity === null ||
          item.packedQuantity === undefined
            ? ""
            : Number(
                item.packedQuantity
              ),

        notes:
          item.notes || "",
      }));

    setItems(mappedItems);
  };

  /* =====================================================
     UPDATE CHECKED QUANTITY
  ===================================================== */

  const updateCheckedQuantity = (
    itemId,
    value
  ) => {
    if (value === "") {
      setItems((previous) =>
        previous.map((item) =>
          String(item.itemId) ===
          String(itemId)
            ? {
                ...item,
                checkedQuantity: "",
              }
            : item
        )
      );

      return;
    }

    const numberValue =
      Number(value);

    if (
      Number.isNaN(numberValue) ||
      numberValue < 0
    ) {
      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        String(item.itemId) ===
        String(itemId)
          ? {
              ...item,
              checkedQuantity:
                numberValue,
            }
          : item
      )
    );
  };

  /* =====================================================
     CHECK STATUS
  ===================================================== */

  const allCheckingMatch = () => {
    return (
      items.length > 0 &&
      items.every(
        (item) =>
          getMatchState(item) ===
          "match"
      )
    );
  };

  const hasMismatch = () => {
    return items.some(
      (item) =>
        getMatchState(item) ===
        "mismatch"
    );
  };

  const hasPending = () => {
    return items.some(
      (item) =>
        getMatchState(item) ===
        "pending"
    );
  };

  /* =====================================================
     SAVE CHECKING
  ===================================================== */

  const saveChecking = async () => {
    if (!selectedOrder?._id) {
      setError(
        "Please select a packing order."
      );

      return;
    }

    if (!items.length) {
      setError(
        "This packing order has no items."
      );

      return;
    }

    if (!allCheckingMatch()) {
      setError(
        "All checked quantities must MATCH the required quantities."
      );

      return;
    }

    /*
      Picking must already be completed.
    */

    const pickingNotComplete =
      items.some(
        (item) =>
          item.pickedQuantity === "" ||
          item.pickedQuantity === null ||
          item.pickedQuantity === undefined ||
          Number(item.pickedQuantity) !==
            Number(item.requiredQuantity)
      );

    if (pickingNotComplete) {
      setError(
        "Picking must be completed before checking the order."
      );

      return;
    }

    try {
      setSaving(true);

      setError("");

      setSuccess("");

      const payloadItems =
        items.map((item) => ({
          itemId:
            item.itemId,

          productId:
            item.productId,

          partNumber:
            item.partNumber,

          productName:
            item.productName,

          size:
            item.size,

          colour:
            item.colour,

          unit:
            item.unit,

          requiredQuantity:
            item.requiredQuantity,

          /*
            Preserve picked quantity.
          */

          pickedQuantity:
            item.pickedQuantity,

          /*
            Checking page updates this.
          */

          checkedQuantity:
            item.checkedQuantity,

          /*
            Preserve packed quantity
            if already present.
          */

          packedQuantity:
            item.packedQuantity,

          notes:
            item.notes,
        }));

      const response =
        await api.put(
          `/packing/${selectedOrder._id}/workflow`,
          {
            items: payloadItems,
          }
        );

      const updatedOrder =
        response.data?.packingOrder ||
        response.data?.order ||
        response.data?.data ||
        response.data;

      if (updatedOrder?._id) {
        setSelectedOrder(
          updatedOrder
        );

        setOrders((previous) =>
          previous.map((order) =>
            String(order._id) ===
            String(updatedOrder._id)
              ? updatedOrder
              : order
          )
        );

        /*
          Refresh local item data from
          updated backend response.
        */

        const refreshedItems =
          (updatedOrder.items || []).map(
            (item) => ({
              itemId:
                item._id ||
                item.itemId,

              productId:
                item.productId ||
                item.product ||
                null,

              partNumber:
                item.partNumber || "-",

              productName:
                item.productName || "-",

              size:
                item.size || "",

              colour:
                item.colour || "",

              unit:
                item.unit ||
                "Piece",

              requiredQuantity:
                Number(
                  item.requiredQuantity || 0
                ),

              pickedQuantity:
                item.pickedQuantity ===
                  null ||
                item.pickedQuantity ===
                  undefined
                  ? ""
                  : Number(
                      item.pickedQuantity
                    ),

              checkedQuantity:
                item.checkedQuantity ===
                  null ||
                item.checkedQuantity ===
                  undefined
                  ? ""
                  : Number(
                      item.checkedQuantity
                    ),

              packedQuantity:
                item.packedQuantity ===
                  null ||
                item.packedQuantity ===
                  undefined
                  ? ""
                  : Number(
                      item.packedQuantity
                    ),

              notes:
                item.notes || "",
            })
          );

        setItems(refreshedItems);
      }

      setSuccess(
        "Checking quantities saved successfully."
      );
    } catch (err) {
      console.error(
        "Save checking error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save checking quantities."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     REFRESH
  ===================================================== */

  const refresh = () => {
    setSelectedOrder(null);

    setItems([]);

    setError("");

    setSuccess("");

    loadOrders();
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="packing-checking-page">
        <div className="packing-checking-loading">
          <Loader2
            size={32}
            className="packing-spin"
          />

          <p>
            Loading checking orders...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="packing-checking-page">
      <header className="packing-checking-header">
        <div>
          <div className="packing-checking-brand">
            KICKMAC
          </div>

          <h1>
            Checking
          </h1>

          <p>
            Verify picked quantities before packing.
          </p>
        </div>

        <div className="packing-checking-header-actions">
          <button
            type="button"
            className="packing-checking-refresh"
            onClick={refresh}
          >
            <RefreshCw size={17} />

            Refresh
          </button>

          <Link
            to="/packing"
            className="packing-checking-home"
          >
            <ArrowLeft size={17} />

            Dashboard
          </Link>
        </div>
      </header>

      <main className="packing-checking-content">
        {/* =================================================
            MESSAGES
        ================================================= */}

        {error && (
          <div className="packing-checking-alert error">
            <AlertTriangle
              size={20}
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="packing-checking-alert success">
            <CheckCircle2
              size={20}
            />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* =================================================
            ORDER LIST
        ================================================= */}

        {!selectedOrder && (
          <section className="packing-checking-orders-card">
            <div className="packing-checking-section-title">
              <div>
                <h2>
                  Packing Orders
                </h2>

                <p>
                  Select an order to start checking.
                </p>
              </div>

              <span className="packing-checking-count">
                {orders.length} Orders
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="packing-checking-empty">
                <PackageCheck
                  size={42}
                />

                <h3>
                  No packing orders found
                </h3>

                <p>
                  Create a packing order from the manager system first.
                </p>
              </div>
            ) : (
              <div className="packing-checking-order-list">
                {orders.map((order) => (
                  <button
                    type="button"
                    key={order._id}
                    className="packing-checking-order-card"
                    onClick={() =>
                      openOrder(order)
                    }
                  >
                    <div className="packing-checking-order-icon">
                      <PackageCheck
                        size={24}
                      />
                    </div>

                    <div className="packing-checking-order-main">
                      <strong>
                        {order.packingNumber ||
                          "Packing Order"}
                      </strong>

                      <span>
                        {getCustomerName(
                          order
                        )}
                      </span>

                      <small>
                        {getTotalItems(
                          order
                        )}{" "}
                        Items
                      </small>
                    </div>

                    <div className="packing-checking-order-status">
                      <span>
                        {order.status ||
                          "PENDING"}
                      </span>

                      <small>
                        {getPackageText(
                          order
                        )}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =================================================
            SELECTED ORDER
        ================================================= */}

        {selectedOrder && (
          <>
            <button
              type="button"
              className="packing-checking-back"
              onClick={() => {
                setSelectedOrder(
                  null
                );

                setItems([]);

                setError("");

                setSuccess("");
              }}
            >
              <ArrowLeft size={17} />

              Back to Orders
            </button>

            {/* =============================================
                ORDER INFORMATION
            ============================================= */}

            <section className="packing-checking-info-grid">
              <div className="packing-checking-info-card">
                <span>
                  Packing Number
                </span>

                <strong>
                  {selectedOrder.packingNumber ||
                    "-"}
                </strong>
              </div>

              <div className="packing-checking-info-card">
                <span>
                  Customer
                </span>

                <strong>
                  {getCustomerName(
                    selectedOrder
                  )}
                </strong>
              </div>

              <div className="packing-checking-info-card">
                <span>
                  Total Items
                </span>

                <strong>
                  {getTotalItems(
                    selectedOrder
                  )}
                </strong>
              </div>

              <div className="packing-checking-info-card">
                <span>
                  Packages
                </span>

                <strong>
                  {getPackageText(
                    selectedOrder
                  )}
                </strong>
              </div>
            </section>

            {/* =============================================
                CUSTOMER DETAILS
            ============================================= */}

            <section className="packing-checking-customer-card">
              <div className="packing-checking-card-heading">
                <h2>
                  Customer Details
                </h2>
              </div>

              <div className="packing-checking-customer-grid">
                <div>
                  <span>
                    Customer Name
                  </span>

                  <strong>
                    {getCustomerName(
                      selectedOrder
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {getCustomerPhone(
                      selectedOrder
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {getCustomerEmail(
                      selectedOrder
                    )}
                  </strong>
                </div>

                <div className="full-width">
                  <span>
                    Delivery Address
                  </span>

                  <strong>
                    {getCustomerAddress(
                      selectedOrder
                    )}
                  </strong>
                </div>
              </div>
            </section>

            {/* =============================================
                CHECKING TABLE
            ============================================= */}

            <section className="packing-checking-items-card">
              <div className="packing-checking-card-heading">
                <div>
                  <h2>
                    Product Checking
                  </h2>

                  <p>
                    Verify every item against the required quantity.
                  </p>
                </div>

                <div className="packing-checking-summary">
                  <span>
                    {items.length} Products
                  </span>
                </div>
              </div>

              <div className="packing-checking-table-wrapper">
                <table className="packing-checking-table">
                  <thead>
                    <tr>
                      <th>
                        #
                      </th>

                      <th>
                        Part Number
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        Size
                      </th>

                      <th>
                        Colour
                      </th>

                      <th>
                        Unit
                      </th>

                      <th>
                        Required
                      </th>

                      <th>
                        Picked
                      </th>

                      <th>
                        Checked
                      </th>

                      <th>
                        Result
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map(
                      (item, index) => {
                        const matchState =
                          getMatchState(
                            item
                          );

                        return (
                          <tr
                            key={
                              item.itemId
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              <strong>
                                {
                                  item.partNumber
                                }
                              </strong>
                            </td>

                            <td>
                              <div className="packing-checking-product-name">
                                {
                                  item.productName
                                }
                              </div>
                            </td>

                            <td>
                              {item.size ||
                                "-"}
                            </td>

                            <td>
                              {item.colour ||
                                "-"}
                            </td>

                            <td>
                              {item.unit}
                            </td>

                            <td>
                              <strong>
                                {
                                  item.requiredQuantity
                                }
                              </strong>
                            </td>

                            <td>
                              <span className="packing-checking-picked-value">
                                {item.pickedQuantity ===
                                ""
                                  ? "-"
                                  : item.pickedQuantity}
                              </span>
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  item.checkedQuantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateCheckedQuantity(
                                    item.itemId,
                                    event.target
                                      .value
                                  )
                                }
                                className={`packing-checking-quantity-input ${
                                  matchState ===
                                  "match"
                                    ? "match"
                                    : matchState ===
                                      "mismatch"
                                    ? "mismatch"
                                    : ""
                                }`}
                              />
                            </td>

                            <td>
                              {matchState ===
                                "match" && (
                                <span className="packing-checking-result match">
                                  <Check
                                    size={16}
                                  />

                                  MATCH
                                </span>
                              )}

                              {matchState ===
                                "mismatch" && (
                                <span className="packing-checking-result mismatch">
                                  <X
                                    size={16}
                                  />

                                  MISMATCH
                                </span>
                              )}

                              {matchState ===
                                "pending" && (
                                <span className="packing-checking-result pending">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* ===========================================
                  CHECKING STATUS
              =========================================== */}

              <div className="packing-checking-validation">
                {allCheckingMatch() ? (
                  <div className="packing-checking-validation-success">
                    <CheckCircle2
                      size={22}
                    />

                    <div>
                      <strong>
                        All quantities MATCH
                      </strong>

                      <span>
                        The order is ready for the packing stage.
                      </span>
                    </div>
                  </div>
                ) : hasMismatch() ? (
                  <div className="packing-checking-validation-error">
                    <AlertTriangle
                      size={22}
                    />

                    <div>
                      <strong>
                        Quantity mismatch detected
                      </strong>

                      <span>
                        Correct the checked quantities before saving.
                      </span>
                    </div>
                  </div>
                ) : hasPending() ? (
                  <div className="packing-checking-validation-warning">
                    <AlertTriangle
                      size={22}
                    />

                    <div>
                      <strong>
                        Checking is incomplete
                      </strong>

                      <span>
                        Enter the checked quantity for every product.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ===========================================
                  ACTIONS
              =========================================== */}

              <div className="packing-checking-actions">
                <button
                  type="button"
                  className="packing-checking-save-button"
                  onClick={
                    saveChecking
                  }
                  disabled={
                    saving ||
                    !allCheckingMatch()
                  }
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={18}
                        className="packing-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save
                        size={18}
                      />

                      Save Checking
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* =============================================
                TRANSPORT INFORMATION - READ ONLY
            ============================================= */}

            <section className="packing-checking-transport-card">
              <div className="packing-checking-card-heading">
                <h2>
                  Dispatch Information
                </h2>

                <span>
                  Manager Controlled
                </span>
              </div>

              <div className="packing-checking-transport-grid">
                <div>
                  <span>
                    Transport Method
                  </span>

                  <strong>
                    {selectedOrder.transportMethod ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Transport Name
                  </span>

                  <strong>
                    {selectedOrder.transportName ||
                      selectedOrder.customTransportName ||
                      "-"}
                  </strong>
                </div>

                <div className="full-width">
                  <span>
                    Dispatch Address
                  </span>

                  <strong>
                    {selectedOrder.dispatchAddress ||
                      "-"}
                  </strong>
                </div>

                <div className="full-width">
                  <span>
                    Notes
                  </span>

                  <strong>
                    {selectedOrder.notes ||
                      "-"}
                  </strong>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}