import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Truck,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Printer,
  PackageCheck,
  Clock,
  Send,
  MapPin,
  Phone,
  User,
  FileCheck,
} from "lucide-react";

import api from "../../services/api";
import "./PackingDispatch.css";

/* =========================================================
   HELPERS
========================================================= */

function extractPackingOrders(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.packingOrders)) return data.packingOrders;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getItems(order) {
  if (Array.isArray(order?.packingItems)) {
    return order.packingItems;
  }

  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.quotation?.items)) {
    return order.quotation.items;
  }

  return [];
}

function getSlipStatus(order) {
  if (
    order?.transportSlipPhoto ||
    order?.transportSlip ||
    order?.transportSlipUploaded ||
    order?.transportSlipUploadedAt
  ) {
    return "Slip Uploaded";
  }

  return "Slip Missing";
}

function getTransportName(order) {
  return (
    order?.transportName ||
    order?.transportMethod ||
    order?.quotation?.transportName ||
    order?.quotation?.transportMethod ||
    "Transport Not Selected"
  );
}

function getCustomerName(order) {
  return (
    order?.customerName ||
    order?.customer?.name ||
    order?.quotation?.customerName ||
    order?.quotation?.customer?.name ||
    "Customer"
  );
}

function getCustomerPhone(order) {
  return (
    order?.customerPhone ||
    order?.customer?.phone ||
    order?.quotation?.customerPhone ||
    order?.quotation?.customer?.phone ||
    ""
  );
}

function getCustomerAddress(order) {
  return (
    order?.customerAddress ||
    order?.address ||
    order?.customer?.address ||
    order?.quotation?.customerAddress ||
    order?.quotation?.address ||
    order?.quotation?.customer?.address ||
    ""
  );
}

function getQuotationNumber(order) {
  return (
    order?.quotationNumber ||
    order?.quotation?.quotationNumber ||
    order?.quotationNo ||
    "-"
  );
}

function getPackingNumber(order) {
  return order?.packingNumber || order?.packingNo || "-";
}

function getOrderId(order) {
  return order?._id || order?.id;
}

function isPickingComplete(order) {
  return (
    order?.pickingCompleted === true ||
    order?.pickingStatus === "COMPLETED" ||
    order?.status === "PACKING"
  );
}

function isCheckingComplete(order) {
  return (
    order?.checkingCompleted === true ||
    order?.checkingStatus === "COMPLETED" ||
    order?.status === "PACKING"
  );
}

function isPackingComplete(order) {
  return (
    order?.packingCompleted === true ||
    order?.packingStatus === "COMPLETED" ||
    order?.status === "PACKED" ||
    order?.status === "READY_FOR_DISPATCH" ||
    order?.status === "DISPATCHED"
  );
}

function isDispatchLabelPrinted(order) {
  return (
    order?.dispatchLabelPrinted === true ||
    order?.dispatchLabelPrintedAt ||
    order?.labelPrinted === true
  );
}

function isDispatched(order) {
  return (
    order?.status === "DISPATCHED" ||
    order?.dispatchStatus === "DISPATCHED" ||
    Boolean(order?.dispatchedAt)
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "DISPATCHED":
      return "packing-status-dispatched";

    case "PACKED":
    case "READY_FOR_DISPATCH":
      return "packing-status-packed";

    case "PACKING":
      return "packing-status-packing";

    case "CHECKING":
      return "packing-status-checking";

    case "PICKING":
      return "packing-status-picking";

    default:
      return "packing-status-pending";
  }
}

function normalizeOrder(order) {
  return {
    ...order,
    items: getItems(order),
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function PackingDispatch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedPackingId =
    searchParams.get("packingId") || searchParams.get("id") || "";

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newSlipFile, setNewSlipFile] = useState(null);
  const [newSlipPreview, setNewSlipPreview] = useState("");

  const [showSlipModal, setShowSlipModal] = useState(false);

  const fileInputRef = useRef(null);

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/packing");

      const extracted = extractPackingOrders(response);
      const normalized = extracted.map(normalizeOrder);

      setOrders(normalized);

      if (requestedPackingId) {
        const found = normalized.find(
          (order) => getOrderId(order) === requestedPackingId
        );

        if (found) {
          setSelectedOrder(found);
        }
      } else if (selectedOrder) {
        const refreshedSelected = normalized.find(
          (order) => getOrderId(order) === getOrderId(selectedOrder)
        );

        if (refreshedSelected) {
          setSelectedOrder(refreshedSelected);
        }
      }
    } catch (err) {
      console.error("Load packing orders error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load packing orders."
      );
    } finally {
      setLoading(false);
    }
  }, [requestedPackingId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* =======================================================
     AUTO CLEAR MESSAGES
  ======================================================= */

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [success]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return orders;
    }

    return orders.filter((order) => {
      const values = [
        getPackingNumber(order),
        getQuotationNumber(order),
        getCustomerName(order),
        getCustomerPhone(order),
        getTransportName(order),
        order?.status,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [orders, searchText]);

  /* =======================================================
     SELECT ORDER
  ======================================================= */

  const handleSelectOrder = (order) => {
    const id = getOrderId(order);

    setSelectedOrder(order);
    setError("");
    setSuccess("");

    if (id) {
      setSearchParams({ packingId: id });
    }
  };

  /* =======================================================
     FILE SELECT
  ======================================================= */

  const handleSlipFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file for the transport slip.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Transport slip image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setNewSlipFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setNewSlipPreview(reader.result);
    };

    reader.onerror = () => {
      setError("Unable to read the selected transport slip image.");
      setNewSlipFile(null);
      setNewSlipPreview("");
    };

    reader.readAsDataURL(file);
  };

  /* =======================================================
     REMOVE NEW FILE
  ======================================================= */

  const handleRemoveNewSlip = () => {
    setNewSlipFile(null);
    setNewSlipPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =======================================================
     SAVE TRANSPORT SLIP
  ======================================================= */

  const handleSaveTransportSlip = async () => {
    if (!selectedOrder) {
      setError("Please select a packing order.");
      return;
    }

    if (!newSlipFile || !newSlipPreview) {
      setError("Please select a transport slip image first.");
      return;
    }

    if (!isPackingComplete(selectedOrder)) {
      setError(
        "Packing must be completed before uploading the transport slip."
      );
      return;
    }

    const id = getOrderId(selectedOrder);

    if (!id) {
      setError("Packing order ID is missing.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/packing/${id}/transport-slip`,
        {
          transportSlipPhoto: newSlipPreview,
        }
      );

      const updatedOrder =
        response?.data?.packingOrder ||
        response?.data?.order ||
        response?.data?.data ||
        null;

      if (updatedOrder) {
        const normalized = normalizeOrder(updatedOrder);

        setSelectedOrder(normalized);

        setOrders((previous) =>
          previous.map((order) =>
            getOrderId(order) === id ? normalized : order
          )
        );
      } else {
        await loadOrders();
      }

      handleRemoveNewSlip();

      setSuccess("Transport slip uploaded successfully.");
    } catch (err) {
      console.error("Save transport slip error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to save transport slip."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     PRINT DISPATCH LABEL
  ======================================================= */

  const handlePrintDispatchLabel = async () => {
    if (!selectedOrder) {
      setError("Please select a packing order.");
      return;
    }

    if (!isPackingComplete(selectedOrder)) {
      setError(
        "Packing must be completed before printing the dispatch label."
      );
      return;
    }

    const id = getOrderId(selectedOrder);

    if (!id) {
      setError("Packing order ID is missing.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      let orderForPrint = selectedOrder;

      /*
       * If label is not already marked as printed,
       * tell backend that the label is being printed.
       */
      if (!isDispatchLabelPrinted(selectedOrder)) {
        const response = await api.patch(
          `/packing/${id}/dispatch-label`
        );

        const updatedOrder =
          response?.data?.packingOrder ||
          response?.data?.order ||
          response?.data?.data ||
          null;

        if (updatedOrder) {
          orderForPrint = normalizeOrder(updatedOrder);

          setSelectedOrder(orderForPrint);

          setOrders((previous) =>
            previous.map((order) =>
              getOrderId(order) === id ? orderForPrint : order
            )
          );
        } else {
          await loadOrders();
        }

        setSuccess("Dispatch label marked as printed.");
      }

      /*
       * Give React time to update the print label.
       */
      setTimeout(() => {
        window.print();
      }, 150);
    } catch (err) {
      console.error("Print dispatch label error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to print dispatch label."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     DISPATCH BAG
  ======================================================= */

  const handleDispatch = async () => {
    if (!selectedOrder) {
      setError("Please select a packing order.");
      return;
    }

    if (!isPickingComplete(selectedOrder)) {
      setError("Picking must be completed before dispatching.");
      return;
    }

    if (!isCheckingComplete(selectedOrder)) {
      setError("Checking must be completed before dispatching.");
      return;
    }

    if (!isPackingComplete(selectedOrder)) {
      setError("Packing must be completed before dispatching.");
      return;
    }

    if (!isDispatchLabelPrinted(selectedOrder)) {
      setError(
        "Dispatch label must be printed before dispatching."
      );
      return;
    }

    const id = getOrderId(selectedOrder);

    if (!id) {
      setError("Packing order ID is missing.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await api.patch(`/packing/${id}/dispatch`);

      const updatedOrder =
        response?.data?.packingOrder ||
        response?.data?.order ||
        response?.data?.data ||
        null;

      if (updatedOrder) {
        const normalized = normalizeOrder(updatedOrder);

        setSelectedOrder(normalized);

        setOrders((previous) =>
          previous.map((order) =>
            getOrderId(order) === id ? normalized : order
          )
        );
      } else {
        await loadOrders();
      }

      setSuccess("Bag dispatched successfully.");
    } catch (err) {
      console.error("Dispatch error:", err);

      /*
       * Show the exact backend validation message.
       */
      setError(
        err?.response?.data?.message ||
          "Failed to dispatch the packing order."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     MARK DELIVERED
  ======================================================= */

  const handleDelivered = async () => {
    if (!selectedOrder) {
      setError("Please select a packing order.");
      return;
    }

    if (!isDispatched(selectedOrder)) {
      setError(
        "The order must be dispatched before marking it delivered."
      );
      return;
    }

    const id = getOrderId(selectedOrder);

    if (!id) {
      setError("Packing order ID is missing.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response = await api.patch(`/packing/${id}/delivered`);

      const updatedOrder =
        response?.data?.packingOrder ||
        response?.data?.order ||
        response?.data?.data ||
        null;

      if (updatedOrder) {
        const normalized = normalizeOrder(updatedOrder);

        setSelectedOrder(normalized);

        setOrders((previous) =>
          previous.map((order) =>
            getOrderId(order) === id ? normalized : order
          )
        );
      } else {
        await loadOrders();
      }

      setSuccess("Order marked as delivered.");
    } catch (err) {
      console.error("Delivered error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to mark order as delivered."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     SLIP PREVIEW
  ======================================================= */

  const existingSlip =
    selectedOrder?.transportSlipPhoto ||
    selectedOrder?.transportSlip ||
    "";

  /* =======================================================
     WORKFLOW STATUS
  ======================================================= */

  const workflow = useMemo(() => {
    if (!selectedOrder) return [];

    return [
      {
        key: "picking",
        label: "Picking",
        icon: PackageCheck,
        complete: isPickingComplete(selectedOrder),
      },
      {
        key: "checking",
        label: "Checking",
        icon: FileCheck,
        complete: isCheckingComplete(selectedOrder),
      },
      {
        key: "packing",
        label: "Packing",
        icon: PackageCheck,
        complete: isPackingComplete(selectedOrder),
      },
      {
        key: "transportSlip",
        label: "Transport Slip",
        icon: Camera,
        complete: getSlipStatus(selectedOrder) === "Slip Uploaded",
      },
      {
        key: "dispatchLabel",
        label: "Dispatch Label",
        icon: Printer,
        complete: isDispatchLabelPrinted(selectedOrder),
      },
      {
        key: "dispatch",
        label: "Dispatched",
        icon: Send,
        complete: isDispatched(selectedOrder),
      },
    ];
  }, [selectedOrder]);

  /* =======================================================
     PRODUCT ITEMS
  ======================================================= */

  const selectedItems = useMemo(() => {
    return selectedOrder?.items || [];
  }, [selectedOrder]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="packing-dispatch-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="packing-dispatch-header">
        <div className="packing-dispatch-header-left">
          <Link
            to="/packing"
            className="packing-back-button"
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          <div>
            <div className="packing-brand">KICKMAC</div>

            <h1>Dispatch</h1>

            <p>
              Complete transport slip, dispatch label and final
              dispatch process.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="packing-refresh-button"
          onClick={loadOrders}
          disabled={loading || actionLoading}
        >
          <RefreshCw
            size={17}
            className={loading ? "packing-spin" : ""}
          />

          Refresh
        </button>
      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="packing-dispatch-content">

        {/* ALERTS */}

        {error && (
          <div className="packing-alert packing-alert-error">
            <AlertCircle size={20} />

            <div>
              <strong>Error</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="packing-alert packing-alert-success">
            <CheckCircle2 size={20} />

            <div>
              <strong>Success</strong>
              <p>{success}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* =================================================
            MAIN LAYOUT
        ================================================= */}

        <div className="packing-dispatch-layout">

          {/* =================================================
              LEFT - ORDER SEARCH/LIST
          ================================================= */}

          <section className="packing-order-list-card">

            <div className="packing-order-list-header">
              <div>
                <h2>Orders</h2>
                <span>
                  {filteredOrders.length} order
                  {filteredOrders.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* SEARCH */}

            <div className="packing-dispatch-search">
              <input
                type="text"
                placeholder="Search packing no, customer, phone or quotation..."
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
              />
            </div>

            {/* ORDER LIST */}

            <div className="packing-order-list">

              {loading && orders.length === 0 ? (
                <div className="packing-empty-state">
                  <RefreshCw
                    size={24}
                    className="packing-spin"
                  />
                  <p>Loading packing orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="packing-empty-state">
                  <PackageCheck size={28} />
                  <p>No packing orders found.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const orderId = getOrderId(order);
                  const active =
                    selectedOrder &&
                    getOrderId(selectedOrder) === orderId;

                  const slipStatus = getSlipStatus(order);

                  return (
                    <button
                      type="button"
                      key={orderId}
                      className={`packing-order-list-item ${
                        active
                          ? "packing-order-list-item-active"
                          : ""
                      }`}
                      onClick={() => handleSelectOrder(order)}
                    >
                      <div className="packing-order-item-top">
                        <strong>
                          {getPackingNumber(order)}
                        </strong>

                        <span
                          className={`packing-status-badge ${getStatusClass(
                            order?.status
                          )}`}
                        >
                          {order?.status || "PENDING"}
                        </span>
                      </div>

                      <div className="packing-order-item-customer">
                        {getCustomerName(order)}
                      </div>

                      <div className="packing-order-item-bottom">
                        <span>
                          QTN: {getQuotationNumber(order)}
                        </span>

                        <span
                          className={
                            slipStatus === "Slip Uploaded"
                              ? "slip-mini-uploaded"
                              : "slip-mini-missing"
                          }
                        >
                          {slipStatus}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}

            </div>
          </section>

          {/* =================================================
              RIGHT - SELECTED ORDER
          ================================================= */}

          {!selectedOrder ? (
            <section className="packing-select-order-state">
              <PackageCheck size={50} />

              <h2>Select a packing order</h2>

              <p>
                Search and select a packing order from the left
                side to continue dispatch processing.
              </p>
            </section>
          ) : (
            <section className="packing-dispatch-details">

              {/* =================================================
                  ORDER HEADER
              ================================================= */}

              <div className="packing-dispatch-order-header">

                <div>
                  <div className="packing-section-label">
                    PACKING ORDER
                  </div>

                  <h2>
                    {getPackingNumber(selectedOrder)}
                  </h2>

                  <p>
                    Quotation: {getQuotationNumber(selectedOrder)}
                  </p>
                </div>

                <div
                  className={`packing-main-status ${getStatusClass(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status || "PENDING"}
                </div>

              </div>

              {/* =================================================
                  CUSTOMER + TRANSPORT INFO
              ================================================= */}

              <div className="packing-dispatch-info-grid">

                <div className="packing-info-box">
                  <div className="packing-section-label">
                    CUSTOMER
                  </div>

                  <div className="packing-info-row">
                    <User size={17} />

                    <strong>
                      {getCustomerName(selectedOrder)}
                    </strong>
                  </div>

                  {getCustomerPhone(selectedOrder) && (
                    <div className="packing-info-row">
                      <Phone size={17} />

                      <span>
                        {getCustomerPhone(selectedOrder)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="packing-info-box">
                  <div className="packing-section-label">
                    TRANSPORT
                  </div>

                  <div className="packing-info-row">
                    <Truck size={18} />

                    <strong>
                      {getTransportName(selectedOrder)}
                    </strong>
                  </div>
                </div>

                {getCustomerAddress(selectedOrder) && (
                  <div className="packing-info-box packing-info-box-wide">
                    <div className="packing-section-label">
                      DELIVERY ADDRESS
                    </div>

                    <div className="packing-info-row">
                      <MapPin size={18} />

                      <span>
                        {getCustomerAddress(selectedOrder)}
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* =================================================
                  WORKFLOW
              ================================================= */}

              <div className="packing-workflow-card">

                <div className="packing-workflow-header">
                  <div>
                    <h3>Dispatch Workflow</h3>
                    <p>
                      Complete each stage before moving to
                      the next stage.
                    </p>
                  </div>
                </div>

                <div className="packing-workflow-grid">

                  {workflow.map((stage) => {
                    const Icon = stage.icon;

                    return (
                      <div
                        key={stage.key}
                        className={`packing-workflow-item ${
                          stage.complete
                            ? "workflow-complete"
                            : "workflow-pending"
                        }`}
                      >
                        <div className="workflow-icon">
                          {stage.complete ? (
                            <CheckCircle2 size={21} />
                          ) : (
                            <Icon size={21} />
                          )}
                        </div>

                        <div>
                          <strong>{stage.label}</strong>

                          <span>
                            {stage.complete
                              ? "Completed"
                              : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>

              {/* =================================================
                  ITEMS
              ================================================= */}

              <div className="packing-workflow-card">

                <div className="packing-workflow-header">
                  <div>
                    <h3>Order Items</h3>
                    <p>
                      {selectedItems.length} item
                      {selectedItems.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="packing-dispatch-items-table-wrapper">
                  <table className="packing-dispatch-items-table">
                    <thead>
                      <tr>
                        <th>PART NO.</th>
                        <th>PRODUCT</th>
                        <th>SIZE</th>
                        <th>COLOUR</th>
                        <th>REQUIRED</th>
                        <th>PICKED</th>
                        <th>CHECKED</th>
                        <th>PACKED</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="packing-table-empty"
                          >
                            No items found.
                          </td>
                        </tr>
                      ) : (
                        selectedItems.map((item, index) => (
                          <tr
                            key={
                              item?._id ||
                              item?.id ||
                              `${getOrderId(
                                selectedOrder
                              )}-${index}`
                            }
                          >
                            <td>
                              {item?.partNumber ||
                                item?.partNo ||
                                "-"}
                            </td>

                            <td>
                              {item?.productName ||
                                item?.product?.name ||
                                item?.name ||
                                "-"}
                            </td>

                            <td>
                              {item?.size || "-"}
                            </td>

                            <td>
                              {item?.colour ||
                                item?.color ||
                                "-"}
                            </td>

                            <td>
                              {item?.requiredQuantity ??
                                item?.quantity ??
                                "-"}
                            </td>

                            <td>
                              {item?.pickedQuantity ?? "-"}
                            </td>

                            <td>
                              {item?.checkedQuantity ?? "-"}
                            </td>

                            <td>
                              {item?.packedQuantity ?? "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* =================================================
                  TRANSPORT SLIP
              ================================================= */}

              <div className="transport-slip-card">

                <div className="transport-slip-header">

                  <div className="transport-slip-title">
                    <div className="transport-slip-title-icon">
                      <Camera size={22} />
                    </div>

                    <div>
                      <h3>Transport Slip</h3>

                      <p>
                        Upload the transport slip photo after
                        packing is completed.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`transport-slip-status ${
                      getSlipStatus(selectedOrder) ===
                      "Slip Uploaded"
                        ? "transport-slip-status-uploaded"
                        : "transport-slip-status-missing"
                    }`}
                  >
                    {getSlipStatus(selectedOrder) ===
                    "Slip Uploaded" ? (
                      <>
                        <CheckCircle2 size={17} />
                        Slip Uploaded
                      </>
                    ) : (
                      <>
                        <Clock size={17} />
                        Slip Missing
                      </>
                    )}
                  </div>

                </div>

                {/* EXISTING SLIP */}

                {existingSlip && (
                  <div className="transport-slip-uploaded-area">

                    <div className="transport-slip-preview">

                      {existingSlip.startsWith("data:image") ||
                      existingSlip.startsWith("http") ? (
                        <img
                          src={existingSlip}
                          alt="Transport Slip"
                        />
                      ) : (
                        <div className="transport-slip-no-preview">
                          <Camera size={30} />
                          <span>
                            Transport slip uploaded
                          </span>
                        </div>
                      )}

                    </div>

                    <div className="transport-slip-uploaded-info">

                      <div className="transport-slip-confirmation">
                        <CheckCircle2 size={18} />

                        <span>
                          Transport slip is available.
                        </span>
                      </div>

                      {selectedOrder?.transportSlipUploadedAt && (
                        <p>
                          Uploaded:{" "}
                          {formatDate(
                            selectedOrder.transportSlipUploadedAt
                          )}
                        </p>
                      )}

                      <div className="transport-slip-actions">

                        <button
                          type="button"
                          className="transport-slip-view-button"
                          onClick={() =>
                            setShowSlipModal(true)
                          }
                        >
                          <Eye size={17} />
                          View Slip
                        </button>

                        <button
                          type="button"
                          className="transport-slip-replace-button"
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                        >
                          <Upload size={17} />
                          Replace
                        </button>

                      </div>

                    </div>

                  </div>
                )}

                {/* NEW SLIP */}

                {!existingSlip && !newSlipPreview && (
                  <div className="transport-slip-upload-area">

                    <div className="transport-slip-upload-icon">
                      <Camera size={34} />
                    </div>

                    <div className="transport-slip-upload-content">
                      <strong>
                        Upload Transport Slip
                      </strong>

                      <span>
                        JPG, JPEG, PNG up to 5 MB
                      </span>
                    </div>

                    <button
                      type="button"
                      className="transport-slip-upload-button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={
                        !isPackingComplete(selectedOrder) ||
                        actionLoading
                      }
                    >
                      <Upload size={18} />
                      Choose Photo
                    </button>

                  </div>
                )}

                {/* REPLACEMENT / NEW PREVIEW */}

                {newSlipPreview && (
                  <div className="transport-slip-new-preview">

                    <img
                      src={newSlipPreview}
                      alt="New transport slip"
                      className="transport-slip-new-preview-image"
                    />

                    <div className="transport-slip-new-preview-details">

                      <strong>
                        {newSlipFile?.name ||
                          "Transport slip image"}
                      </strong>

                      <span>
                        {newSlipFile
                          ? `${(
                              newSlipFile.size /
                              1024 /
                              1024
                            ).toFixed(2)} MB`
                          : ""}
                      </span>

                      <div className="transport-slip-actions">

                        <button
                          type="button"
                          className="transport-slip-save-button"
                          onClick={handleSaveTransportSlip}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <RefreshCw
                              size={17}
                              className="packing-spin"
                            />
                          ) : (
                            <CheckCircle2 size={17} />
                          )}

                          Save Slip
                        </button>

                        <button
                          type="button"
                          className="transport-slip-remove-button"
                          onClick={handleRemoveNewSlip}
                          disabled={actionLoading}
                        >
                          <X size={17} />
                          Remove
                        </button>

                      </div>

                    </div>

                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSlipFileChange}
                  style={{ display: "none" }}
                />

                <div className="transport-slip-limit">
                  <AlertCircle size={15} />
                  Transport slip image must be 5 MB or smaller.
                </div>

              </div>

              {/* =================================================
                  FINAL DISPATCH
              ================================================= */}

              <div className="packing-final-dispatch-card">

                <div className="packing-final-dispatch-icon">
                  <Truck size={30} />
                </div>

                <div>
                  <h3>Final Dispatch</h3>

                  <p>
                    Print the dispatch label and dispatch the
                    bag after all packing checks are completed.
                  </p>

                  {isDispatched(selectedOrder) && (
                    <div className="packing-final-dispatched-message">
                      <CheckCircle2 size={18} />
                      This order has already been dispatched.
                    </div>
                  )}
                </div>

                <div className="packing-final-dispatch-actions">

                  <button
                    type="button"
                    className="packing-dispatch-label-button"
                    onClick={handlePrintDispatchLabel}
                    disabled={
                      actionLoading ||
                      !isPackingComplete(selectedOrder)
                    }
                  >
                    {actionLoading ? (
                      <RefreshCw
                        size={18}
                        className="packing-spin"
                      />
                    ) : (
                      <Printer size={18} />
                    )}

                    {isDispatchLabelPrinted(selectedOrder)
                      ? "Print Label Again"
                      : "Print Dispatch Label"}
                  </button>

                  <button
                    type="button"
                    className="packing-dispatch-final-button"
                    onClick={handleDispatch}
                    disabled={
                      actionLoading ||
                      isDispatched(selectedOrder) ||
                      !isPickingComplete(selectedOrder) ||
                      !isCheckingComplete(selectedOrder) ||
                      !isPackingComplete(selectedOrder) ||
                      !isDispatchLabelPrinted(selectedOrder)
                    }
                  >
                    {actionLoading ? (
                      <RefreshCw
                        size={18}
                        className="packing-spin"
                      />
                    ) : (
                      <Send size={18} />
                    )}

                    {isDispatched(selectedOrder)
                      ? "Already Dispatched"
                      : "Dispatch Bag"}
                  </button>

                  {isDispatched(selectedOrder) && (
                    <button
                      type="button"
                      className="packing-delivered-button"
                      onClick={handleDelivered}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <RefreshCw
                          size={18}
                          className="packing-spin"
                        />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}

                      Mark Delivered
                    </button>
                  )}

                </div>

              </div>

              {/* =================================================
                  DATE INFORMATION
              ================================================= */}

              <div className="packing-dispatch-date-info">

                <div>
                  <Clock size={16} />

                  <span>
                    Created:{" "}
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>

                {selectedOrder.packedAt && (
                  <div>
                    <PackageCheck size={16} />

                    <span>
                      Packed:{" "}
                      {formatDate(selectedOrder.packedAt)}
                    </span>
                  </div>
                )}

                {selectedOrder.dispatchedAt && (
                  <div>
                    <Send size={16} />

                    <span>
                      Dispatched:{" "}
                      {formatDate(
                        selectedOrder.dispatchedAt
                      )}
                    </span>
                  </div>
                )}

                {selectedOrder.deliveryDate && (
                  <div>
                    <CheckCircle2 size={16} />

                    <span>
                      Delivered:{" "}
                      {formatDate(
                        selectedOrder.deliveryDate
                      )}
                    </span>
                  </div>
                )}

              </div>

            </section>
          )}

        </div>
      </main>

      {/* =====================================================
          TRANSPORT SLIP MODAL
      ===================================================== */}

      {showSlipModal && (
        <div
          className="transport-slip-modal-overlay"
          onClick={() => setShowSlipModal(false)}
        >
          <div
            className="transport-slip-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="transport-slip-modal-header">

              <div>
                <h3>Transport Slip</h3>

                <span>
                  {getPackingNumber(selectedOrder)}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSlipModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="transport-slip-modal-body">

              {existingSlip ? (
                existingSlip.startsWith("data:image") ||
                existingSlip.startsWith("http") ? (
                  <img
                    src={existingSlip}
                    alt="Transport Slip"
                  />
                ) : (
                  <div className="transport-slip-modal-empty">
                    <Camera size={40} />

                    <p>
                      Transport slip has been uploaded,
                      but preview is not available.
                    </p>
                  </div>
                )
              ) : (
                <div className="transport-slip-modal-empty">
                  <Camera size={40} />

                  <p>
                    No transport slip uploaded.
                  </p>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          PRINT LABEL
      ===================================================== */}

      {selectedOrder && (
        <div className="dispatch-label-print">

          <div className="dispatch-label-transport">
            {getTransportName(selectedOrder)}
          </div>

          <div className="dispatch-label-customer">
            {getCustomerName(selectedOrder)}
          </div>

          {getCustomerPhone(selectedOrder) && (
            <div className="dispatch-label-phone">
              {getCustomerPhone(selectedOrder)}
            </div>
          )}

          {getCustomerAddress(selectedOrder) && (
            <div className="dispatch-label-address">
              {getCustomerAddress(selectedOrder)}
            </div>
          )}

          <div className="dispatch-label-footer">
            <strong>KICKMAC SOLUTIONS</strong>

            <span>BENGALURU - 560057</span>

            <span>PHONE: 9900400452</span>
          </div>

        </div>
      )}

    </div>
  );
}