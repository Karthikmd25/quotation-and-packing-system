import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Package,
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
import "./PackingPicking.css";

/* =========================================
   MATCH STATE
========================================= */

function getMatchState(item) {
  const value = item.pickedQuantity;

  if (value === "" || value === null || value === undefined) {
    return "pending";
  }

  return Number(value) === Number(item.requiredQuantity)
    ? "match"
    : "mismatch";
}

/* =========================================
   CUSTOMER HELPERS
========================================= */

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
    order?.phone ||
    order?.customer?.phone ||
    order?.quotation?.customerPhone ||
    order?.quotation?.customer?.phone ||
    "-"
  );
}

function getCustomerAddress(order) {
  return (
    order?.customerAddress ||
    order?.dispatchAddress ||
    order?.deliveryAddress ||
    order?.customer?.address ||
    order?.quotation?.customerAddress ||
    order?.quotation?.customer?.address ||
    "-"
  );
}

/* =========================================
   TOTAL ITEMS
========================================= */

function getTotalItems(order) {
  const orderItems = order?.items || order?.packingItems || [];

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return 0;
  }

  return orderItems.reduce(
    (sum, item) =>
      sum +
      Number(
        item?.requiredQuantity ??
          item?.quantity ??
          0
      ),
    0
  );
}

/* =========================================
   PACKAGE TEXT
========================================= */

function getPackageText(order) {
  const numberOfPackages = Number(
    order?.numberOfPackages || 0
  );

  const packageType =
    order?.packageType || "Packages";

  return `${numberOfPackages} ${packageType}`;
}

/* =========================================
   NORMALIZE ORDER ITEMS
========================================= */

function normalizeItems(order) {
  const sourceItems =
    order?.items ||
    order?.packingItems ||
    [];

  if (!Array.isArray(sourceItems)) {
    return [];
  }

  return sourceItems.map((item, index) => {
    const requiredQuantity = Number(
      item?.requiredQuantity ??
        item?.quantity ??
        0
    );

    let pickedQuantity = "";

    if (
      item?.pickedQuantity !== null &&
      item?.pickedQuantity !== undefined &&
      item?.pickedQuantity !== ""
    ) {
      const savedPicked = Number(
        item.pickedQuantity
      );

      if (
        Number.isFinite(savedPicked) &&
        savedPicked >= 0 &&
        savedPicked <= requiredQuantity
      ) {
        pickedQuantity = savedPicked;
      }
    }

    return {
      itemId:
        item?._id ||
        item?.itemId ||
        `${item?.productId || "item"}-${
          item?.partNumber || index
        }`,

      productId:
        item?.productId ||
        item?.product?._id ||
        item?.product ||
        null,

      partNumber:
        item?.partNumber ||
        item?.product?.partNumber ||
        "-",

      productName:
        item?.productName ||
        item?.product?.name ||
        "-",

      size: item?.size || "",

      colour:
        item?.colour ||
        item?.color ||
        "",

      unit:
        item?.unit ||
        item?.product?.unit ||
        "Piece",

      requiredQuantity,

      pickedQuantity,

      checkedQuantity:
        item?.checkedQuantity === null ||
        item?.checkedQuantity === undefined ||
        item?.checkedQuantity === ""
          ? null
          : Number(item.checkedQuantity),

      packedQuantity:
        item?.packedQuantity === null ||
        item?.packedQuantity === undefined ||
        item?.packedQuantity === ""
          ? null
          : Number(item.packedQuantity),

      notes: item?.notes || "",
    };
  });
}

/* =========================================
   EXTRACT ORDERS FROM API RESPONSE
========================================= */

function extractPackingOrders(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.packingOrders)) {
    return data.packingOrders;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/* =========================================
   COMPONENT
========================================= */

export default function PackingPicking() {
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

  /* =========================================
     LOAD ORDERS
  ========================================= */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Loading packing orders..."
      );

      const response =
        await api.get("/packing");

      console.log(
        "Packing API response:",
        response.data
      );

      const data =
        extractPackingOrders(response);

      console.log(
        "Extracted packing orders:",
        data
      );

      setOrders(data);

      if (packingId) {
        const found = data.find(
          (order) =>
            String(order?._id) ===
            String(packingId)
        );

        if (found) {
          setSelectedOrder(found);
          setItems(
            normalizeItems(found)
          );
        }
      }
    } catch (err) {
      /*
        React development StrictMode can cause
        duplicate requests. If one request is
        aborted/cancelled, do not show an error.
      */

      const isAborted =
        err?.code === "ERR_CANCELED" ||
        err?.name === "CanceledError" ||
        err?.message
          ?.toLowerCase()
          ?.includes("aborted") ||
        err?.message
          ?.toLowerCase()
          ?.includes("canceled");

      if (isAborted) {
        console.warn(
          "Packing orders request was cancelled."
        );
        return;
      }

      console.error(
        "Packing picking load error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load packing orders."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     INITIAL LOAD
  ========================================= */

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) return;
      await loadOrders();
    };

    run();

    return () => {
      active = false;
    };
  }, [packingId]);

  /* =========================================
     OPEN ORDER
  ========================================= */

  const openOrder = (order) => {
    if (!order) {
      return;
    }

    setSelectedOrder(order);
    setError("");
    setSuccess("");

    const mappedItems =
      normalizeItems(order);

    setItems(mappedItems);
  };

  /* =========================================
     UPDATE PICKED QUANTITY
  ========================================= */

  const updatePickedQuantity = (
    itemId,
    value
  ) => {
    setError("");
    setSuccess("");

    /* Allow empty input */

    if (value === "") {
      setItems((previous) =>
        previous.map((item) =>
          String(item.itemId) ===
          String(itemId)
            ? {
                ...item,
                pickedQuantity: "",
              }
            : item
        )
      );

      return;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return;
    }

    if (numberValue < 0) {
      return;
    }

    const currentItem = items.find(
      (item) =>
        String(item.itemId) ===
        String(itemId)
    );

    if (!currentItem) {
      return;
    }

    const requiredQuantity = Number(
      currentItem.requiredQuantity
    );

    /* =========================================
       PICKED CANNOT EXCEED REQUIRED
    ========================================= */

    if (
      numberValue >
      requiredQuantity
    ) {
      setError(
        `Picked quantity cannot exceed required quantity for ${currentItem.productName}. Required quantity: ${requiredQuantity}.`
      );

      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        String(item.itemId) ===
        String(itemId)
          ? {
              ...item,
              pickedQuantity:
                numberValue,
            }
          : item
      )
    );
  };

  /* =========================================
     CHECK ALL PICKED QUANTITIES
  ========================================= */

  const allPickedMatch = () => {
    return (
      items.length > 0 &&
      items.every(
        (item) =>
          item.pickedQuantity !== "" &&
          item.pickedQuantity !== null &&
          item.pickedQuantity !==
            undefined &&
          Number(
            item.pickedQuantity
          ) ===
            Number(
              item.requiredQuantity
            )
      )
    );
  };

  /* =========================================
     CHECK MISMATCH
  ========================================= */

  const hasMismatch = () => {
    return items.some(
      (item) =>
        getMatchState(item) ===
        "mismatch"
    );
  };

  /* =========================================
     VALIDATE PICKING
  ========================================= */

  const validatePicking = () => {
    if (!items.length) {
      setError(
        "This packing order has no items."
      );

      return false;
    }

    for (const item of items) {
      const required = Number(
        item.requiredQuantity
      );

      const picked =
        item.pickedQuantity === "" ||
        item.pickedQuantity === null ||
        item.pickedQuantity ===
          undefined
          ? null
          : Number(
              item.pickedQuantity
            );

      if (picked === null) {
        setError(
          `Please enter picked quantity for ${item.productName}.`
        );

        return false;
      }

      if (!Number.isFinite(picked)) {
        setError(
          `Invalid picked quantity for ${item.productName}.`
        );

        return false;
      }

      if (picked < 0) {
        setError(
          `Picked quantity cannot be negative for ${item.productName}.`
        );

        return false;
      }

      if (picked > required) {
        setError(
          `Picked quantity cannot exceed required quantity for ${item.productName}. Required: ${required}, Picked: ${picked}.`
        );

        return false;
      }

      if (picked !== required) {
        setError(
          `Picked quantity must match required quantity for ${item.productName}. Required: ${required}, Picked: ${picked}.`
        );

        return false;
      }
    }

    return true;
  };

  /* =========================================
     SAVE PICKING
  ========================================= */

  const savePicking = async () => {
    if (!selectedOrder?._id) {
      setError(
        "Please select a packing order."
      );

      return;
    }

    if (!validatePicking()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /* =========================================
         CLEAN PAYLOAD
      ========================================= */

      const payloadItems =
        items.map((item) => ({
          itemId: item.itemId,

          productId:
            item.productId,

          partNumber:
            item.partNumber,

          productName:
            item.productName,

          size:
            item.size || "",

          colour:
            item.colour || "",

          unit:
            item.unit || "Piece",

          requiredQuantity:
            Number(
              item.requiredQuantity
            ),

          pickedQuantity:
            Number(
              item.pickedQuantity
            ),

          /*
            Keep checking quantity unchanged.
            null means not checked yet.
          */

          checkedQuantity:
            item.checkedQuantity ===
              null ||
            item.checkedQuantity ===
              undefined ||
            item.checkedQuantity === ""
              ? null
              : Number(
                  item.checkedQuantity
                ),

          /*
            Keep packing quantity unchanged.
            null means not packed yet.
          */

          packedQuantity:
            item.packedQuantity ===
              null ||
            item.packedQuantity ===
              undefined ||
            item.packedQuantity === ""
              ? null
              : Number(
                  item.packedQuantity
                ),

          notes:
            item.notes || "",
        }));

      console.log(
        "Saving picking:",
        payloadItems
      );

      /* =========================================
         API REQUEST
      ========================================= */

      const response =
        await api.put(
          `/packing/${selectedOrder._id}/workflow`,
          {
            items: payloadItems,
          }
        );

      console.log(
        "Picking save response:",
        response.data
      );

      const updatedOrder =
        response.data?.order ||
        response.data?.packingOrder ||
        response.data?.data ||
        response.data;

      /* =========================================
         UPDATE SCREEN
      ========================================= */

      if (updatedOrder?._id) {
        setSelectedOrder(
          updatedOrder
        );

        setOrders((previous) =>
          previous.map((order) =>
            String(order?._id) ===
            String(updatedOrder?._id)
              ? updatedOrder
              : order
          )
        );

        setItems(
          normalizeItems(
            updatedOrder
          )
        );
      }

      setSuccess(
        "Picking quantities saved successfully."
      );
    } catch (err) {
      console.error(
        "Save picking error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save picking quantities."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     REFRESH
  ========================================= */

  const refresh = () => {
    setSelectedOrder(null);
    setItems([]);
    setError("");
    setSuccess("");

    loadOrders();
  };

  /* =========================================
     BACK TO ORDERS
  ========================================= */

  const backToOrders = () => {
    setSelectedOrder(null);
    setItems([]);
    setError("");
    setSuccess("");
  };

  /* =========================================
     LOADING SCREEN
  ========================================= */

  if (loading) {
    return (
      <div className="packing-picking-page">
        <header className="packing-picking-header">
          <div>
            <div className="packing-picking-brand">
              KICKMAC
            </div>

            <h1>Picking</h1>

            <p>
              Pick required quantities
            </p>
          </div>

          <Link
            to="/packing"
            className="pp-home-button"
          >
            <ArrowLeft size={16} />
            Packing Dashboard
          </Link>
        </header>

        <main className="packing-picking-content">
          <div className="pp-loading-card">
            <Loader2
              size={30}
              className="pp-spin"
            />

            <p>
              Loading packing orders...
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* =========================================
     MAIN PAGE
  ========================================= */

  return (
    <div className="packing-picking-page">
      {/* HEADER */}

      <header className="packing-picking-header">
        <div>
          <div className="packing-picking-brand">
            KICKMAC
          </div>

          <h1>Picking</h1>

          <p>
            Pick the required quantities
            for each packing order
          </p>
        </div>

        <div className="pp-header-actions">
          <button
            type="button"
            className="pp-refresh-button"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <Link
            to="/packing"
            className="pp-home-button"
          >
            <ArrowLeft size={16} />
            Packing Dashboard
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <main className="packing-picking-content">
        {/* ERROR */}

        {error && (
          <div className="pp-alert pp-alert-error">
            <AlertTriangle size={18} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="pp-alert pp-alert-success">
            <CheckCircle2 size={18} />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =========================================
            ORDER SELECTION
        ========================================= */}

        {!selectedOrder && (
          <section className="pp-orders-card">
            <div className="pp-section-header">
              <div>
                <h2>
                  Select Packing Order
                </h2>

                <p>
                  Select an order to begin
                  picking.
                </p>
              </div>

              <div className="pp-order-count">
                {orders.length} Orders
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="pp-empty">
                <Package size={42} />

                <h3>
                  No Packing Orders
                </h3>

                <p>
                  No packing orders are
                  currently available.
                </p>

                <button
                  type="button"
                  className="pp-refresh-button"
                  onClick={refresh}
                >
                  <RefreshCw size={16} />
                  Refresh Orders
                </button>
              </div>
            ) : (
              <div className="pp-orders-list">
                {orders.map((order) => (
                  <button
                    type="button"
                    key={order?._id}
                    className="pp-order-row"
                    onClick={() =>
                      openOrder(order)
                    }
                  >
                    <div className="pp-order-main">
                      <div className="pp-order-icon">
                        <Package
                          size={21}
                        />
                      </div>

                      <div>
                        <strong>
                          {order?.packingNumber ||
                            "Packing Order"}
                        </strong>

                        <span>
                          {getCustomerName(
                            order
                          )}
                        </span>

                        <small>
                          Quotation:{" "}
                          {order?.quotation
                            ?.quotationNumber ||
                            order?.quotationNumber ||
                            "-"}
                        </small>
                      </div>
                    </div>

                    <div className="pp-order-info">
                      <span>
                        <b>
                          Total Items
                        </b>

                        {getTotalItems(
                          order
                        )}
                      </span>

                      <span>
                        <b>
                          Packages
                        </b>

                        {getPackageText(
                          order
                        )}
                      </span>
                    </div>

                    <div className="pp-order-status">
                      <span className="pp-status">
                        {order?.status ||
                          "PENDING"}
                      </span>

                      <span className="pp-open">
                        Open →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================================
            SELECTED ORDER
        ========================================= */}

        {selectedOrder && (
          <>
            {/* BACK */}

            <button
              type="button"
              className="pp-back-button"
              onClick={
                backToOrders
              }
            >
              <ArrowLeft size={16} />
              Back to Packing Orders
            </button>

            {/* =========================================
                ORDER SUMMARY
            ========================================= */}

            <section className="pp-summary-card">
              <div className="pp-summary-top">
                <div>
                  <div className="pp-label">
                    PACKING ORDER
                  </div>

                  <h2>
                    {selectedOrder?.packingNumber ||
                      "-"}
                  </h2>
                </div>

                <span className="pp-status">
                  {selectedOrder?.status ||
                    "PENDING"}
                </span>
              </div>

              <div className="pp-summary-grid">
                <div className="pp-summary-item">
                  <span>
                    Customer
                  </span>

                  <strong>
                    {getCustomerName(
                      selectedOrder
                    )}
                  </strong>
                </div>

                <div className="pp-summary-item">
                  <span>
                    Phone
                  </span>

                  <strong>
                    {getCustomerPhone(
                      selectedOrder
                    )}
                  </strong>
                </div>

                <div className="pp-summary-item">
                  <span>
                    Total Items
                  </span>

                  <strong>
                    {getTotalItems(
                      selectedOrder
                    )}
                  </strong>
                </div>

                <div className="pp-summary-item">
                  <span>
                    Packages
                  </span>

                  <strong>
                    {getPackageText(
                      selectedOrder
                    )}
                  </strong>
                </div>

                <div className="pp-summary-item pp-address">
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

            {/* =========================================
                PICKING TABLE
            ========================================= */}

            <section className="pp-picking-card">
              <div className="pp-table-header">
                <div>
                  <h2>
                    Picking Quantities
                  </h2>

                  <p>
                    Enter the quantity physically
                    picked for each item.
                  </p>
                </div>

                <div className="pp-overall-result">
                  {allPickedMatch() ? (
                    <>
                      <Check size={15} />
                      ALL MATCH
                    </>
                  ) : hasMismatch() ? (
                    <>
                      <X size={15} />
                      MISMATCH
                    </>
                  ) : (
                    <>PENDING</>
                  )}
                </div>
              </div>

              <div className="pp-table-wrapper">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>
                        Part No
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
                        Required Qty
                      </th>

                      <th>
                        Unit
                      </th>

                      <th>
                        Picked Qty
                      </th>

                      <th>
                        Result
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => {
                      const state =
                        getMatchState(
                          item
                        );

                      return (
                        <tr
                          key={
                            item.itemId
                          }
                          className={`pp-row-${state}`}
                        >
                          <td>
                            <strong>
                              {
                                item.partNumber
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              item.productName
                            }
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
                            <strong>
                              {
                                item.requiredQuantity
                              }
                            </strong>
                          </td>

                          <td>
                            {item.unit}
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              max={
                                item.requiredQuantity
                              }
                              step="1"
                              value={
                                item.pickedQuantity
                              }
                              onChange={(
                                event
                              ) =>
                                updatePickedQuantity(
                                  item.itemId,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className={`pp-qty-input pp-${state}`}
                            />
                          </td>

                          <td>
                            <span
                              className={`pp-result pp-result-${state}`}
                            >
                              {state ===
                                "match" && (
                                <Check
                                  size={
                                    14
                                  }
                                />
                              )}

                              {state ===
                                "mismatch" && (
                                <X
                                  size={
                                    14
                                  }
                                />
                              )}

                              {state ===
                              "match"
                                ? "MATCH"
                                : state ===
                                  "mismatch"
                                ? "MISMATCH"
                                : "PENDING"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* =========================================
                SAVE PICKING
            ========================================= */}

            <section className="pp-save-card">
              <div className="pp-save-info">
                <Package size={21} />

                <div>
                  <strong>
                    Picking Completion
                  </strong>

                  <p>
                    All picked quantities
                    must match the required
                    quantity before saving.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="pp-save-button"
                onClick={
                  savePicking
                }
                disabled={
                  saving ||
                  !allPickedMatch()
                }
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="pp-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Picking
                  </>
                )}
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
