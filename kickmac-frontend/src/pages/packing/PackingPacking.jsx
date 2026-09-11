import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  PackageCheck,
  RefreshCw,
  Save,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

import api from "../../services/api";
import "./PackingPacking.css";

export default function PackingPacking() {
  const [searchParams, setSearchParams] = useSearchParams();

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [orders, setOrders] = useState([]);

  const [selectedId, setSelectedId] = useState(
    searchParams.get("packingId") ||
      searchParams.get("id") ||
      ""
  );

  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [items, setItems] = useState([]);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const extractPackingOrders = (response) => {
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
  };

  const getCustomerName = (order) => {
    return (
      order?.customerName ||
      order?.quotation?.customerName ||
      order?.customer?.name ||
      "Customer"
    );
  };

  const getCustomerPhone = (order) => {
    return (
      order?.customerPhone ||
      order?.quotation?.customerPhone ||
      order?.customer?.phone ||
      ""
    );
  };

  const getCustomerEmail = (order) => {
    return (
      order?.customerEmail ||
      order?.quotation?.customerEmail ||
      order?.customer?.email ||
      ""
    );
  };

  const getCustomerAddress = (order) => {
    return (
      order?.customerAddress ||
      order?.deliveryAddress ||
      order?.quotation?.customerAddress ||
      order?.customer?.address ||
      ""
    );
  };

  const getQuotationNumber = (order) => {
    return (
      order?.quotationNumber ||
      order?.quotation?.quotationNumber ||
      ""
    );
  };

  const getSlipStatus = (order) => {
    if (
      order?.transportSlipPhoto ||
      order?.transportSlip ||
      order?.transportSlipUploaded ||
      order?.transportSlipUploadedAt
    ) {
      return "UPLOADED";
    }

    return "MISSING";
  };

  const getOrderItems = (order) => {
    if (Array.isArray(order?.packingItems)) {
      return order.packingItems;
    }

    if (Array.isArray(order?.items)) {
      return order.items;
    }

    return [];
  };

  // --------------------------------------------------
  // SELECTED ORDER
  // --------------------------------------------------

  const selectedOrder = useMemo(() => {
    return orders.find(
      (order) =>
        String(order?._id) === String(selectedId)
    );
  }, [orders, selectedId]);

  // --------------------------------------------------
  // SEARCH ORDERS
  // --------------------------------------------------

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return orders.filter((order) => {
      const packingNumber =
        String(order?.packingNumber || "").toLowerCase();

      const customerName =
        String(getCustomerName(order) || "").toLowerCase();

      const customerPhone =
        String(getCustomerPhone(order) || "").toLowerCase();

      const quotationNumber =
        String(getQuotationNumber(order) || "").toLowerCase();

      return (
        packingNumber.includes(query) ||
        customerName.includes(query) ||
        customerPhone.includes(query) ||
        quotationNumber.includes(query)
      );
    });
  }, [orders, searchText]);

  // --------------------------------------------------
  // LOAD ORDERS
  // --------------------------------------------------

  useEffect(() => {
    loadOrders();
  }, []);

  // --------------------------------------------------
  // LOAD ITEMS WHEN ORDER CHANGES
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedOrder) {
      setItems([]);
      return;
    }

    const packingItems = getOrderItems(selectedOrder);

    const formattedItems = packingItems.map((item) => ({
      ...item,

      requiredQuantity: Number(
        item?.requiredQuantity ?? item?.quantity ?? 0
      ),

      pickedQuantity: Number(
        item?.pickedQuantity ?? 0
      ),

      checkedQuantity: Number(
        item?.checkedQuantity ?? 0
      ),

      packedQuantity:
        item?.packedQuantity !== null &&
        item?.packedQuantity !== undefined
          ? Number(item.packedQuantity)
          : 0,
    }));

    setItems(formattedItems);
  }, [selectedOrder]);

  // --------------------------------------------------
  // LOAD PACKING ORDERS
  // --------------------------------------------------

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.get("/packing");

      console.log(
        "Packing API response:",
        response.data
      );

      const packingOrders =
        extractPackingOrders(response);

      if (!Array.isArray(packingOrders)) {
        throw new Error(
          "Invalid packing orders response from server."
        );
      }

      setOrders(packingOrders);

      // Keep selected order if it still exists
      if (selectedId) {
        const existingOrder =
          packingOrders.find(
            (order) =>
              String(order?._id) ===
              String(selectedId)
          );

        if (!existingOrder) {
          setSelectedId("");
          setSearchParams({});
          setItems([]);
        }
      }
    } catch (err) {
      if (
        err?.code === "ERR_CANCELED" ||
        err?.name === "CanceledError" ||
        err?.message === "Request aborted"
      ) {
        return;
      }

      console.error(
        "Packing orders load error:",
        err
      );

      console.error(
        "Packing API error:",
        err?.response?.data
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load packing orders."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SELECT ORDER
  // --------------------------------------------------

  const selectOrder = (order) => {
    if (!order?._id) {
      return;
    }

    setSelectedId(order._id);

    setSearchParams({
      packingId: String(order._id),
    });

    setSearchText("");

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // PACKED QUANTITY CHANGE
  // --------------------------------------------------

  const handleQuantityChange = (
    index,
    value
  ) => {
    const item = items[index];

    if (!item) {
      return;
    }

    const requiredQuantity = Number(
      item.requiredQuantity || 0
    );

    let numericValue =
      value === ""
        ? ""
        : Number(value);

    if (numericValue !== "") {
      if (Number.isNaN(numericValue)) {
        numericValue = 0;
      }

      numericValue = Math.max(
        0,
        numericValue
      );

      if (
        numericValue >
        requiredQuantity
      ) {
        numericValue =
          requiredQuantity;
      }
    }

    setItems((previousItems) =>
      previousItems.map(
        (currentItem, itemIndex) =>
          itemIndex === index
            ? {
                ...currentItem,
                packedQuantity:
                  numericValue,
              }
            : currentItem
      )
    );

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // ITEM VERIFICATION
  // --------------------------------------------------

  const getItemVerification = (item) => {
    const required = Number(
      item?.requiredQuantity || 0
    );

    const picked = Number(
      item?.pickedQuantity || 0
    );

    const checked = Number(
      item?.checkedQuantity || 0
    );

    const packed = Number(
      item?.packedQuantity || 0
    );

    if (picked !== required) {
      return {
        type: "MISMATCH",
        text: "Picking mismatch",
      };
    }

    if (checked !== required) {
      return {
        type: "MISMATCH",
        text: "Checking mismatch",
      };
    }

    if (packed !== required) {
      return {
        type: "PENDING",
        text: "Packing pending",
      };
    }

    return {
      type: "MATCH",
      text: "Ready",
    };
  };

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------

  const totalRequired = items.reduce(
    (sum, item) =>
      sum +
      Number(
        item?.requiredQuantity || 0
      ),
    0
  );

  const totalPicked = items.reduce(
    (sum, item) =>
      sum +
      Number(
        item?.pickedQuantity || 0
      ),
    0
  );

  const totalChecked = items.reduce(
    (sum, item) =>
      sum +
      Number(
        item?.checkedQuantity || 0
      ),
    0
  );

  const totalPacked = items.reduce(
    (sum, item) =>
      sum +
      Number(
        item?.packedQuantity || 0
      ),
    0
  );

  // --------------------------------------------------
  // VERIFICATION
  // --------------------------------------------------

  const allPickingMatch =
    items.length > 0 &&
    items.every(
      (item) =>
        Number(
          item?.pickedQuantity || 0
        ) ===
        Number(
          item?.requiredQuantity || 0
        )
    );

  const allCheckingMatch =
    items.length > 0 &&
    items.every(
      (item) =>
        Number(
          item?.checkedQuantity || 0
        ) ===
        Number(
          item?.requiredQuantity || 0
        )
    );

  const allPackedMatch =
    items.length > 0 &&
    items.every(
      (item) =>
        Number(
          item?.packedQuantity || 0
        ) ===
        Number(
          item?.requiredQuantity || 0
        )
    );

  // --------------------------------------------------
  // STAGE STATUS
  // --------------------------------------------------

  const isPickingComplete =
    selectedOrder?.pickingCompleted === true ||
    allPickingMatch;

  const isCheckingComplete =
    selectedOrder?.checkingCompleted === true ||
    allCheckingMatch;

  const isPackingComplete =
    selectedOrder?.packingCompleted === true ||
    (
      selectedOrder?.status === "PACKED" &&
      allPackedMatch
    );

  const isTransportSlipUploaded =
    getSlipStatus(selectedOrder) ===
    "UPLOADED";

  const isDispatched =
    selectedOrder?.status ===
    "DISPATCHED";

  // --------------------------------------------------
  // SAVE / COMPLETE PACKING
  // --------------------------------------------------

  const savePacking = async () => {
    if (!selectedOrder) {
      setError(
        "Please search and select a packing order."
      );
      return;
    }

    if (
      selectedOrder.status ===
      "DISPATCHED"
    ) {
      setError(
        "This packing order has already been dispatched."
      );
      return;
    }

    if (
      selectedOrder.status ===
      "DELIVERED"
    ) {
      setError(
        "This packing order has already been delivered."
      );
      return;
    }

    if (!items.length) {
      setError(
        "This packing order does not contain any items."
      );
      return;
    }

    if (!allPickingMatch) {
      setError(
        "Picking quantity must match the required quantity before packing."
      );
      return;
    }

    if (!allCheckingMatch) {
      setError(
        "Checked quantity must match the required quantity before packing."
      );
      return;
    }

    if (!allPackedMatch) {
      setError(
        "Packed quantity must match the required quantity for every item."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        items: items.map((item) => ({
          productId:
            item?.productId ||
            item?.product?._id ||
            null,

          partNumber:
            item?.partNumber || "",

          productName:
            item?.productName ||
            item?.product?.name ||
            "",

          size:
            item?.size || "",

          colour:
            item?.colour ||
            item?.color ||
            "",

          unit:
            item?.unit || "Piece",

          requiredQuantity:
            Number(
              item?.requiredQuantity || 0
            ),

          pickedQuantity:
            Number(
              item?.pickedQuantity || 0
            ),

          checkedQuantity:
            Number(
              item?.checkedQuantity || 0
            ),

          packedQuantity:
            Number(
              item?.packedQuantity || 0
            ),

          notes:
            item?.notes || "",
        })),
      };

      console.log(
        "Saving packing workflow:",
        payload
      );

      const response =
        await api.put(
          `/packing/${selectedOrder._id}/workflow`,
          payload
        );

      console.log(
        "Packing save response:",
        response.data
      );

      const updatedOrder =
        response?.data?.packingOrder ||
        response?.data?.order ||
        null;

      if (updatedOrder) {
        setOrders(
          (previousOrders) =>
            previousOrders.map(
              (order) =>
                String(order?._id) ===
                String(selectedOrder?._id)
                  ? updatedOrder
                  : order
            )
        );
      } else {
        await loadOrders();
      }

      setSuccess(
        "Packing completed successfully."
      );
    } catch (err) {
      console.error(
        "Packing save error:",
        err
      );

      console.error(
        "Packing save API response:",
        err?.response?.data
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to complete packing."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // STATUS CLASS
  // --------------------------------------------------

  const getStatusClass = (status) => {
    switch (status) {
      case "PACKED":
        return "status-packed";

      case "PACKING":
        return "status-packing";

      case "DISPATCHED":
        return "status-dispatched";

      case "DELIVERED":
        return "status-delivered";

      case "VERIFIED":
        return "status-verified";

      case "CHECKING":
        return "status-checking";

      case "PICKED":
        return "status-picked";

      default:
        return "status-pending";
    }
  };

  // --------------------------------------------------
  // STAGE COMPONENT
  // --------------------------------------------------

  const Stage = ({
    title,
    complete,
    warning,
    icon,
  }) => {
    return (
      <div
        className={`packing-stage ${
          complete
            ? "stage-complete"
            : warning
            ? "stage-warning"
            : "stage-pending"
        }`}
      >
        <div className="packing-stage-icon">
          {complete ? (
            <CheckCircle2 size={20} />
          ) : warning ? (
            <CircleAlert size={20} />
          ) : (
            icon
          )}
        </div>

        <div className="packing-stage-info">
          <strong>{title}</strong>

          <span>
            {complete
              ? "Completed"
              : warning
              ? "Action required"
              : "Pending"}
          </span>
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="packing-picking-page">

      {/* HEADER */}
      <header className="packing-picking-header">
        <div>
          <div className="packing-brand">
            KICKMAC
          </div>

          <h1>
            <PackageCheck size={28} />
            Packing Verification
          </h1>

          <p>
            Search the packing order and verify
            picking, checking, packing and dispatch
            status.
          </p>
        </div>

        <div className="packing-header-actions">
          <button
            type="button"
            className="packing-refresh-button"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw size={17} />

            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

          <Link
            to="/packing"
            className="packing-back-button"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="packing-picking-content">

        {/* SEARCH */}
        <section className="packing-search-card">
          <div className="packing-search-heading">
            <div>
              <h2>
                Search Packing Order
              </h2>

              <p>
                Search by customer name, phone,
                quotation number or packing number.
              </p>
            </div>

            <Search size={22} />
          </div>

          <div className="packing-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search customer / phone / quotation / PKG number..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />

            {searchText && (
              <button
                type="button"
                className="packing-search-clear"
                onClick={() =>
                  setSearchText("")
                }
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          {/* SEARCH RESULTS */}
          {searchText.trim() && (
            <div className="packing-search-results">
              {filteredOrders.length === 0 ? (
                <div className="packing-search-empty">
                  <Search size={22} />

                  <strong>
                    No packing order found
                  </strong>

                  <span>
                    Try customer name, phone,
                    quotation number or PKG number.
                  </span>
                </div>
              ) : (
                filteredOrders.map(
                  (order) => (
                    <button
                      type="button"
                      key={order._id}
                      className={`packing-search-result ${
                        String(
                          selectedId
                        ) ===
                        String(order._id)
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        selectOrder(order)
                      }
                    >
                      <div className="packing-result-main">
                        <strong>
                          {order.packingNumber ||
                            "PKG"}
                        </strong>

                        <span>
                          {getCustomerName(
                            order
                          )}
                        </span>
                      </div>

                      <div className="packing-result-details">
                        <span>
                          {getCustomerPhone(
                            order
                          ) || "No phone"}
                        </span>

                        <span>
                          {getQuotationNumber(
                            order
                          ) ||
                            "No quotation"}
                        </span>
                      </div>

                      <span
                        className={`packing-status ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status ||
                          "PENDING"}
                      </span>
                    </button>
                  )
                )
              )}
            </div>
          )}

          {!searchText.trim() && (
            <div className="packing-search-hint">
              <Search size={18} />

              <span>
                Start typing to find a packing
                order.
              </span>
            </div>
          )}
        </section>

        {/* ERROR */}
        {error && (
          <div className="packing-error">
            <CircleAlert size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="packing-success">
            <CheckCircle2 size={19} />
            <span>{success}</span>
          </div>
        )}

        {/* SELECTED ORDER */}
        {selectedOrder && (
          <section className="packing-work-card">

            {/* ORDER HEADER */}
            <div className="packing-order-header">
              <div>
                <span className="packing-label">
                  Packing Number
                </span>

                <h2>
                  {selectedOrder.packingNumber ||
                    "-"}
                </h2>

                <div className="packing-order-subinfo">
                  Quotation:{" "}
                  <strong>
                    {getQuotationNumber(
                      selectedOrder
                    ) || "-"}
                  </strong>
                </div>
              </div>

              <span
                className={`packing-status large-status ${getStatusClass(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status ||
                  "PENDING"}
              </span>
            </div>

            {/* CUSTOMER DETAILS */}
            <div className="packing-customer-card">

              <div>
                <span>
                  Customer
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
                  ) || "-"}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {getCustomerEmail(
                    selectedOrder
                  ) || "-"}
                </strong>
              </div>

              <div>
                <span>
                  Packages
                </span>

                <strong>
                  {selectedOrder.numberOfPackages ||
                    0}{" "}
                  {selectedOrder.packageType ||
                    ""}
                </strong>
              </div>

              <div className="packing-customer-address">
                <span>
                  Address
                </span>

                <strong>
                  {getCustomerAddress(
                    selectedOrder
                  ) || "-"}
                </strong>
              </div>
            </div>

            {/* WORKFLOW VERIFICATION */}
            <section className="packing-verification-section">

              <div className="packing-section-title">
                <div>
                  <h2>
                    Order Verification
                  </h2>

                  <p>
                    Check every stage before
                    dispatch.
                  </p>
                </div>

                <Truck size={22} />
              </div>

              <div className="packing-stage-grid">

                <Stage
                  title="Picking"
                  complete={
                    isPickingComplete
                  }
                  warning={
                    items.length > 0 &&
                    !allPickingMatch
                  }
                  icon={
                    <PackageCheck size={20} />
                  }
                />

                <Stage
                  title="Checking"
                  complete={
                    isCheckingComplete
                  }
                  warning={
                    allPickingMatch &&
                    !allCheckingMatch
                  }
                  icon={
                    <CheckCircle2 size={20} />
                  }
                />

                <Stage
                  title="Packing"
                  complete={
                    isPackingComplete
                  }
                  warning={
                    allCheckingMatch &&
                    !allPackedMatch
                  }
                  icon={
                    <PackageCheck size={20} />
                  }
                />

                <Stage
                  title="Transport Slip"
                  complete={
                    isTransportSlipUploaded
                  }
                  warning={
                    isPackingComplete &&
                    !isTransportSlipUploaded
                  }
                  icon={
                    <Truck size={20} />
                  }
                />

                <Stage
                  title="Dispatch"
                  complete={
                    isDispatched
                  }
                  warning={
                    isTransportSlipUploaded &&
                    !isDispatched
                  }
                  icon={
                    <Truck size={20} />
                  }
                />

              </div>
            </section>

            {/* ITEMS */}
            <div className="packing-items-section">

              <div className="packing-section-title">
                <div>
                  <h2>
                    Product Verification
                  </h2>

                  <p>
                    Required → Picked →
                    Checked → Packed
                  </p>
                </div>

                <span>
                  {items.length} Items
                </span>
              </div>

              {items.length === 0 ? (
                <div className="packing-empty">
                  No items found in this
                  packing order.
                </div>
              ) : (
                <div className="packing-items-table-wrapper">

                  <table className="packing-items-table">

                    <thead>
                      <tr>
                        <th>#</th>
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
                          Required
                        </th>
                        <th>
                          Picked
                        </th>
                        <th>
                          Checked
                        </th>
                        <th>
                          Packed
                        </th>
                        <th>
                          Verification
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map(
                        (item, index) => {
                          const verification =
                            getItemVerification(
                              item
                            );

                          const required =
                            Number(
                              item?.requiredQuantity ||
                                0
                            );

                          const packed =
                            Number(
                              item?.packedQuantity ||
                                0
                            );

                          return (
                            <tr
                              key={
                                item?._id ||
                                index
                              }
                              className={
                                verification.type ===
                                "MATCH"
                                  ? "packing-row-match"
                                  : verification.type ===
                                    "MISMATCH"
                                  ? "packing-row-mismatch"
                                  : "packing-row-pending"
                              }
                            >
                              <td>
                                {index + 1}
                              </td>

                              <td>
                                <strong>
                                  {item?.partNumber ||
                                    "-"}
                                </strong>
                              </td>

                              <td>
                                {item?.productName ||
                                  item?.product?.name ||
                                  "-"}
                              </td>

                              <td>
                                {item?.size ||
                                  "-"}
                              </td>

                              <td>
                                {item?.colour ||
                                  item?.color ||
                                  "-"}
                              </td>

                              <td>
                                <strong>
                                  {required}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={
                                    Number(
                                      item?.pickedQuantity ||
                                        0
                                    ) ===
                                    required
                                      ? "quantity-match"
                                      : "quantity-mismatch"
                                  }
                                >
                                  {Number(
                                    item?.pickedQuantity ||
                                      0
                                  )}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={
                                    Number(
                                      item?.checkedQuantity ||
                                        0
                                    ) ===
                                    required
                                      ? "quantity-match"
                                      : "quantity-mismatch"
                                  }
                                >
                                  {Number(
                                    item?.checkedQuantity ||
                                      0
                                  )}
                                </span>
                              </td>

                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={required}
                                  value={
                                    item?.packedQuantity ??
                                    ""
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleQuantityChange(
                                      index,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  disabled={
                                    selectedOrder.status ===
                                      "DISPATCHED" ||
                                    selectedOrder.status ===
                                      "DELIVERED"
                                  }
                                  className={
                                    packed ===
                                    required
                                      ? "quantity-input complete"
                                      : "quantity-input"
                                  }
                                />
                              </td>

                              <td>
                                <span
                                  className={`item-verification ${
                                    verification.type ===
                                    "MATCH"
                                      ? "item-verification-match"
                                      : verification.type ===
                                        "MISMATCH"
                                      ? "item-verification-mismatch"
                                      : "item-verification-pending"
                                  }`}
                                >
                                  {verification.type ===
                                  "MATCH" ? (
                                    <CheckCircle2
                                      size={16}
                                    />
                                  ) : verification.type ===
                                    "MISMATCH" ? (
                                    <XCircle
                                      size={16}
                                    />
                                  ) : (
                                    <CircleAlert
                                      size={16}
                                    />
                                  )}

                                  {
                                    verification.text
                                  }
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* SUMMARY */}
            <div className="packing-summary-grid">

              <div>
                <span>
                  Total Items
                </span>

                <strong>
                  {items.length}
                </strong>
              </div>

              <div>
                <span>
                  Total Required
                </span>

                <strong>
                  {totalRequired}
                </strong>
              </div>

              <div>
                <span>
                  Total Picked
                </span>

                <strong>
                  {totalPicked}
                </strong>
              </div>

              <div>
                <span>
                  Total Checked
                </span>

                <strong>
                  {totalChecked}
                </strong>
              </div>

              <div>
                <span>
                  Total Packed
                </span>

                <strong>
                  {totalPacked}
                </strong>
              </div>

              <div>
                <span>
                  Package Count
                </span>

                <strong>
                  {selectedOrder.numberOfPackages ||
                    0}
                </strong>
              </div>

            </div>

            {/* NOTES */}
            {selectedOrder.notes && (
              <div className="packing-notes-card">
                <strong>
                  Notes
                </strong>

                <p>
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* FINAL CHECK */}
            <div className="packing-final-verification">

              <div>
                <h3>
                  Final Packing Check
                </h3>

                <p>
                  All required quantities must
                  match before completing packing.
                </p>
              </div>

              <div className="packing-final-check-list">

                <div
                  className={
                    allPickingMatch
                      ? "check-ok"
                      : "check-error"
                  }
                >
                  {allPickingMatch ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}

                  Picking quantities
                </div>

                <div
                  className={
                    allCheckingMatch
                      ? "check-ok"
                      : "check-error"
                  }
                >
                  {allCheckingMatch ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}

                  Checking quantities
                </div>

                <div
                  className={
                    allPackedMatch
                      ? "check-ok"
                      : "check-error"
                  }
                >
                  {allPackedMatch ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}

                  Packed quantities
                </div>

              </div>

            </div>

            {/* ACTION BAR */}
            <div className="packing-action-bar">

              <div>
                {allPackedMatch &&
                allPickingMatch &&
                allCheckingMatch ? (
                  <span className="packing-ready-text">
                    ✓ All quantities match.
                    Packing can be completed.
                  </span>
                ) : (
                  <span className="packing-warning-text">
                    ⚠ Complete all quantity
                    verification before saving.
                  </span>
                )}
              </div>

              <button
                type="button"
                className="packing-save-button"
                onClick={savePacking}
                disabled={
                  saving ||
                  !allPackedMatch ||
                  !allPickingMatch ||
                  !allCheckingMatch ||
                  selectedOrder.status ===
                    "DISPATCHED" ||
                  selectedOrder.status ===
                    "DELIVERED"
                }
              >
                <Save size={18} />

                {saving
                  ? "Saving..."
                  : isPackingComplete
                  ? "Packing Completed"
                  : "Complete Packing"}
              </button>

            </div>

          </section>
        )}

        {/* NO SELECTED ORDER */}
        {!selectedOrder &&
          !loading && (
            <section className="packing-empty large packing-no-order-card">
              <PackageCheck size={40} />

              <strong>
                No packing order selected
              </strong>

              <p>
                Search for a customer, phone
                number, quotation number or
                PKG number above.
              </p>
            </section>
          )}

      </main>
    </div>
  );
}