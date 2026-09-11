import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Quotations.css";

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCustomerName(quotation) {
  if (quotation?.customer?.name) {
    return quotation.customer.name;
  }

  return quotation?.customerName || "Unknown Customer";
}

function getCustomerPhone(quotation) {
  if (quotation?.customer?.phone) {
    return quotation.customer.phone;
  }

  return quotation?.customerPhone || "";
}

function getCustomerEmail(quotation) {
  if (quotation?.customer?.email) {
    return quotation.customer.email;
  }

  return quotation?.customerEmail || "";
}

function getCustomerResponseLabel(response) {
  switch (response) {
    case "CONFIRMED":
      return "✅ CONFIRMED";

    case "CHANGES_REQUESTED":
      return "🔄 CHANGES REQUESTED";

    case "REJECTED":
      return "❌ REJECTED";

    default:
      return "⏳ PENDING";
  }
}

function getCustomerResponseClass(response) {
  switch (response) {
    case "CONFIRMED":
      return "response-confirmed";

    case "CHANGES_REQUESTED":
      return "response-changes";

    case "REJECTED":
      return "response-rejected";

    default:
      return "response-pending";
  }
}

function getResponseMethodLabel(method) {
  switch (method) {
    case "WEB":
      return "🌐 WEB";

    case "WHATSAPP":
      return "💬 WHATSAPP";

    case "MANAGER":
      return "👤 MANAGER";

    default:
      return "-";
  }
}

/* =========================================================
   VIEW QUOTATION MODAL
========================================================= */

function QuotationViewModal({
  quotation,
  onClose,
  onEdit,
  onCreatePacking,
}) {
  if (!quotation) return null;

  function handleEdit() {
    onEdit(quotation);
  }

  function handleCreatePacking() {
    onCreatePacking(quotation);
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="view-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}

        <div className="modal-header">
          <div>
            <div className="modal-brand">
              KICKMAC • SALES
            </div>

            <h2>
              {quotation.quotationNumber}
            </h2>

            <span
              className={`status-badge status-${String(
                quotation.status || ""
              ).toLowerCase()}`}
            >
              {quotation.status || "UNKNOWN"}
            </span>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* CUSTOMER INFORMATION */}

        <div className="quotation-info-grid">
          <div>
            <span>Customer</span>

            <strong>
              {getCustomerName(quotation)}
            </strong>
          </div>

          <div>
            <span>Phone</span>

            <strong>
              {getCustomerPhone(quotation) || "-"}
            </strong>
          </div>

          <div>
            <span>Email</span>

            <strong>
              {getCustomerEmail(quotation) || "-"}
            </strong>
          </div>

          <div>
            <span>Created</span>

            <strong>
              {formatDate(quotation.createdAt)}
            </strong>
          </div>
        </div>

        {/* CUSTOMER RESPONSE */}

        <div className="modal-section">
          <h3>Customer Response</h3>

          <div
            className={`customer-response-card ${getCustomerResponseClass(
              quotation.customerResponse
            )}`}
          >
            <div>
              <span className="response-label">
                Response
              </span>

              <strong>
                {getCustomerResponseLabel(
                  quotation.customerResponse
                )}
              </strong>
            </div>

            <div>
              <span className="response-label">
                Method
              </span>

              <strong>
                {getResponseMethodLabel(
                  quotation.customerResponseMethod
                )}
              </strong>
            </div>

            <div>
              <span className="response-label">
                Responded
              </span>

              <strong>
                {formatDateTime(
                  quotation.customerRespondedAt
                )}
              </strong>
            </div>

            {quotation.customerResponseNote && (
              <div className="response-note-display">
                <span className="response-label">
                  Note
                </span>

                <p>
                  {quotation.customerResponseNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PRODUCTS */}

        <div className="modal-section">
          <h3>Products</h3>

          <div className="view-table-wrapper">
            <table className="quotation-table">
              <thead>
                <tr>
                  <th>Part No.</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Colour</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {quotation.items?.map(
                  (item, index) => (
                    <tr
                      key={
                        item._id || index
                      }
                    >
                      <td>
                        {item.partNumber || "-"}
                      </td>

                      <td>
                        {item.productName || "-"}
                      </td>

                      <td>
                        {item.size || "-"}
                      </td>

                      <td>
                        {item.colour || "-"}
                      </td>

                      <td>
                        {item.quantity || 0}
                      </td>

                      <td>
                        {item.unit || "Piece"}
                      </td>

                      <td>
                        {formatCurrency(
                          item.unitPrice
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.total ||
                            Number(item.quantity || 0) *
                              Number(item.unitPrice || 0)
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENT + TOTAL */}

        <div className="view-bottom-grid">
          <div className="payment-box">
            <h3>
              Payment & Transport
            </h3>

            <p>
              <span>Payment</span>

              <strong>
                {quotation.paymentMethod || "-"}
              </strong>
            </p>

            <p>
              <span>Transport</span>

              <strong>
                {quotation.transportMethod || "-"}
              </strong>
            </p>
          </div>

          <div className="total-box">
            <div>
              <span>Subtotal</span>

              <strong>
                {formatCurrency(
                  quotation.subtotal
                )}
              </strong>
            </div>

            <div>
              <span>Discount</span>

              <strong>
                -{" "}
                {formatCurrency(
                  quotation.discount
                )}
              </strong>
            </div>

            <div>
              <span>
                Packing & Forwarding
              </span>

              <strong>
                {formatCurrency(
                  quotation.packingAndForwarding
                )}
              </strong>
            </div>

            <div className="grand-total">
              <span>Grand Total</span>

              <strong>
                {formatCurrency(
                  quotation.grandTotal
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          {quotation.status === "DRAFT" && (
            <button
              type="button"
              className="primary-button"
              onClick={handleEdit}
            >
              ✏ Edit Quotation
            </button>
          )}

          {quotation.status ===
            "CUSTOMER_CONFIRMED" &&
            !quotation.packingOrder && (
              <button
                type="button"
                className="primary-button create-packing-button"
                onClick={handleCreatePacking}
              >
                📦 Create Packing
              </button>
            )}

          {quotation.packingOrder && (
            <button
              type="button"
              className="secondary-button"
              disabled
            >
              📦 Packing Created
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMER RESPONSE MODAL
========================================================= */

function CustomerResponseModal({
  quotation,
  onClose,
  onSaved,
}) {
  const [response, setResponse] =
    useState("");

  const [note, setNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!quotation) return;

    setResponse(
      quotation.customerResponse || ""
    );

    setNote(
      quotation.customerResponseNote || ""
    );

    setError("");
    setSaving(false);
  }, [quotation]);

  if (!quotation) return null;

  async function handleSave() {
    if (!response) {
      setError(
        "Please select a customer response."
      );
      return;
    }

    if (!quotation._id) {
      setError(
        "Quotation ID is missing."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const apiResponse =
        await api.post(
          `/quotations/${quotation._id}/customer-response`,
          {
            response,
            note: note.trim(),
            method: "MANAGER",
          }
        );

      if (!apiResponse.data?.success) {
        throw new Error(
          apiResponse.data?.message ||
            "Failed to save customer response"
        );
      }

      onSaved(
        apiResponse.data.quotation
      );

      onClose();
    } catch (err) {
      console.error(
        "Customer response error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save customer response"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay customer-response-overlay"
      onClick={
        saving ? undefined : onClose
      }
    >
      <div
        className="customer-response-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="modal-header customer-response-header">
          <div>
            <div className="modal-brand">
              KICKMAC • CUSTOMER RESPONSE
            </div>

            <h2>
              {quotation.quotationNumber}
            </h2>

            <p>
              Customer:{" "}
              <strong>
                {getCustomerName(quotation)}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="customer-response-error">
            ⚠️ {error}
          </div>
        )}

        {/* RESPONSE */}

        <div className="response-section">
          <h3>
            Customer Response
          </h3>

          <div className="response-options">
            {/* CONFIRMED */}

            <button
              type="button"
              className={`response-option ${
                response === "CONFIRMED"
                  ? "selected confirmed"
                  : ""
              }`}
              onClick={() => {
                setResponse("CONFIRMED");
                setError("");
              }}
              disabled={saving}
            >
              <span className="response-icon">
                ✅
              </span>

              <div>
                <strong>
                  Confirmed
                </strong>

                <small>
                  Customer wants to place the
                  order.
                </small>
              </div>
            </button>

            {/* CHANGES */}

            <button
              type="button"
              className={`response-option ${
                response ===
                "CHANGES_REQUESTED"
                  ? "selected changes"
                  : ""
              }`}
              onClick={() => {
                setResponse(
                  "CHANGES_REQUESTED"
                );
                setError("");
              }}
              disabled={saving}
            >
              <span className="response-icon">
                🔄
              </span>

              <div>
                <strong>
                  Changes Requested
                </strong>

                <small>
                  Customer wants changes in
                  the quotation.
                </small>
              </div>
            </button>

            {/* REJECTED */}

            <button
              type="button"
              className={`response-option ${
                response === "REJECTED"
                  ? "selected rejected"
                  : ""
              }`}
              onClick={() => {
                setResponse("REJECTED");
                setError("");
              }}
              disabled={saving}
            >
              <span className="response-icon">
                ❌
              </span>

              <div>
                <strong>
                  Rejected
                </strong>

                <small>
                  Customer does not want the
                  quotation.
                </small>
              </div>
            </button>
          </div>

          {/* SELECTED RESPONSE */}

          {response && (
            <div className="selected-response-box">
              <span>
                Selected Response
              </span>

              <strong>
                {getCustomerResponseLabel(
                  response
                )}
              </strong>
            </div>
          )}

          {/* NOTE */}

          <label className="response-note-label">
            Manager Note

            <textarea
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              placeholder={
                response ===
                "CHANGES_REQUESTED"
                  ? "Enter the changes requested by the customer..."
                  : response === "REJECTED"
                  ? "Enter the reason for rejection..."
                  : "Enter customer feedback or any important note..."
              }
              disabled={saving}
            />
          </label>

          {/* METHOD */}

          <div className="response-method-box">
            <span>
              Response Method
            </span>

            <strong>
              👤 MANAGER
            </strong>
          </div>
        </div>

        {/* FOOTER */}

        <div className="customer-response-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button customer-response-save-button"
            onClick={handleSave}
            disabled={
              saving || !response
            }
          >
            {saving
              ? "Saving..."
              : "💾 Save Customer Response"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EDIT QUOTATION MODAL
========================================================= */

function EditQuotationModal({
  quotation,
  onClose,
  onSaved,
}) {
  const [form, setForm] =
    useState({
      customer: null,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      items: [],
      discount: 0,
      packingAndForwarding: 0,
      paymentMethod: "",
      transportMethod: "",
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* LOAD QUOTATION */

  useEffect(() => {
    if (!quotation) return;

    setForm({
      customer:
        quotation.customer?._id ||
        quotation.customer ||
        null,

      customerName:
        quotation.customerName || "",

      customerPhone:
        quotation.customerPhone || "",

      customerEmail:
        quotation.customerEmail || "",

      items: (quotation.items || []).map(
        (item) => ({
          ...item,

          product:
            item.product?._id ||
            item.product ||
            null,

          quantity:
            Number(item.quantity || 1),

          unitPrice:
            Number(item.unitPrice || 0),
        })
      ),

      discount:
        Number(quotation.discount || 0),

      packingAndForwarding:
        Number(
          quotation.packingAndForwarding || 0
        ),

      paymentMethod:
        quotation.paymentMethod || "",

      transportMethod:
        quotation.transportMethod || "",
    });

    setError("");
  }, [quotation]);

  /* SUBTOTAL */

  const subtotal = useMemo(() => {
    return form.items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );
  }, [form.items]);

  /* GRAND TOTAL */

  const grandTotal =
    Math.max(
      0,
      subtotal -
        Number(form.discount || 0)
    ) +
    Number(
      form.packingAndForwarding || 0
    );

  /* UPDATE FORM */

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* UPDATE ITEM */

  function updateItem(
    index,
    field,
    value
  ) {
    setForm((previous) => {
      const items = [
        ...previous.items,
      ];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...previous,
        items,
      };
    });
  }

  /* ADD ITEM */

  function addItem() {
    setForm((previous) => ({
      ...previous,

      items: [
        ...previous.items,

        {
          partNumber: "",
          productName: "",
          size: "",
          colour: "",
          unit: "Piece",
          quantity: 1,
          unitPrice: 0,
          product: null,
        },
      ],
    }));
  }

  /* REMOVE ITEM */

  function removeItem(index) {
    setForm((previous) => ({
      ...previous,

      items: previous.items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));
  }

  /* SAVE */

  async function handleSave() {
    if (!quotation?._id) {
      setError(
        "Quotation ID is missing."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (!form.customerName.trim()) {
        setError(
          "Customer name is required."
        );
        return;
      }

      if (form.items.length === 0) {
        setError(
          "At least one product is required."
        );
        return;
      }

      for (const item of form.items) {
        if (Number(item.quantity) < 1) {
          setError(
            "Quantity must be at least 1."
          );
          return;
        }

        if (Number(item.unitPrice) < 0) {
          setError(
            "Price cannot be negative."
          );
          return;
        }

        if (!item.productName?.trim()) {
          setError(
            "Product name is required."
          );
          return;
        }
      }

      const payload = {
        customer: form.customer,

        customerName:
          form.customerName.trim(),

        customerPhone:
          form.customerPhone.trim(),

        customerEmail:
          form.customerEmail.trim(),

        items: form.items.map(
          (item) => ({
            product:
              item.product?._id ||
              item.product ||
              null,

            partNumber:
              item.partNumber || "",

            productName:
              item.productName || "",

            size:
              item.size || "",

            colour:
              item.colour || "",

            unit:
              item.unit || "Piece",

            quantity:
              Number(item.quantity),

            unitPrice:
              Number(item.unitPrice),
          })
        ),

        discount:
          Number(form.discount || 0),

        packingAndForwarding:
          Number(
            form.packingAndForwarding || 0
          ),

        paymentMethod:
          form.paymentMethod,

        transportMethod:
          form.transportMethod,
      };

      console.log(
        "Updating quotation:",
        payload
      );

      const response =
        await api.put(
          `/quotations/${quotation._id}`,
          payload
        );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to update quotation"
        );
      }

      alert(
        "Quotation updated successfully."
      );

      onSaved(
        response.data.quotation
      );
    } catch (err) {
      console.error(
        "Quotation update error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update quotation"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!quotation) return null;

  return (
    <div
      className="modal-overlay"
      onClick={
        saving ? undefined : onClose
      }
    >
      <div
        className="edit-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="modal-header">
          <div>
            <div className="modal-brand">
              KICKMAC • EDIT
            </div>

            <h2>
              {quotation.quotationNumber}
            </h2>

            <span className="status-badge status-draft">
              DRAFT
            </span>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* CUSTOMER */}

        <div className="edit-section">
          <h3>Customer</h3>

          <div className="form-grid">
            <label>
              Customer Name

              <input
                type="text"
                value={form.customerName}
                onChange={(event) =>
                  updateForm(
                    "customerName",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Phone

              <input
                type="text"
                value={form.customerPhone}
                onChange={(event) =>
                  updateForm(
                    "customerPhone",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Email

              <input
                type="email"
                value={form.customerEmail}
                onChange={(event) =>
                  updateForm(
                    "customerEmail",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        {/* PRODUCTS */}

        <div className="edit-section">
          <h3>Products</h3>

          <div className="edit-products">
            {form.items.map(
              (item, index) => (
                <div
                  className="edit-product-row"
                  key={
                    item._id || index
                  }
                >
                  <div>
                    <small>
                      Part No.
                    </small>

                    <input
                      type="text"
                      value={
                        item.partNumber || ""
                      }
                      onChange={(event) =>
                        updateItem(
                          index,
                          "partNumber",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <small>
                      Product
                    </small>

                    <input
                      type="text"
                      value={
                        item.productName || ""
                      }
                      onChange={(event) =>
                        updateItem(
                          index,
                          "productName",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <small>
                      Size
                    </small>

                    <input
                      type="text"
                      value={
                        item.size || ""
                      }
                      onChange={(event) =>
                        updateItem(
                          index,
                          "size",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <small>
                      Colour
                    </small>

                    <input
                      type="text"
                      value={
                        item.colour || ""
                      }
                      onChange={(event) =>
                        updateItem(
                          index,
                          "colour",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <small>
                      Qty
                    </small>

                    <input
                      type="number"
                      min="1"
                      value={
                        item.quantity
                      }
                      onChange={(event) =>
                        updateItem(
                          index,
                          "quantity",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <small>
                      Price
                    </small>

                    <input
                      type="number"
                      min="0"
                      value={
                        item.unitPrice
                      }
                      onChange={(event) =>
                        updateItem(
                          index,
                          "unitPrice",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="line-total">
                    <small>
                      Total
                    </small>

                    <strong>
                      {formatCurrency(
                        Number(
                          item.quantity || 0
                        ) *
                          Number(
                            item.unitPrice || 0
                          )
                      )}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() =>
                      removeItem(index)
                    }
                  >
                    Remove
                  </button>
                </div>
              )
            )}

            <button
              type="button"
              className="add-item-button"
              onClick={addItem}
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* CHARGES */}

        <div className="edit-section">
          <h3>
            Quotation Charges
          </h3>

          <div className="charges-grid">
            <label>
              Discount

              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(event) =>
                  updateForm(
                    "discount",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Packing & Forwarding

              <input
                type="number"
                min="0"
                value={
                  form.packingAndForwarding
                }
                onChange={(event) =>
                  updateForm(
                    "packingAndForwarding",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        {/* PAYMENT */}

        <div className="edit-section">
          <h3>
            Payment & Transport
          </h3>

          <div className="form-grid two">
            <label>
              Payment Method

              <select
                value={
                  form.paymentMethod
                }
                onChange={(event) =>
                  updateForm(
                    "paymentMethod",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select Payment Method
                </option>

                <option value="50% Advance, 50% Before Dispatch">
                  50% Advance, 50% Before
                  Dispatch
                </option>

                <option value="100% Advance">
                  100% Advance
                </option>

                <option value="100% Before Dispatch">
                  100% Before Dispatch
                </option>

                <option value="Cash">
                  Cash
                </option>

                <option value="UPI">
                  UPI
                </option>

                <option value="Bank Transfer">
                  Bank Transfer
                </option>
              </select>
            </label>

            <label>
              Transport Method

              <select
                value={
                  form.transportMethod
                }
                onChange={(event) =>
                  updateForm(
                    "transportMethod",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select Transport Method
                </option>

                <option value="Customer Transport">
                  Customer Transport
                </option>

                <option value="KICKMAC Transport">
                  KICKMAC Transport
                </option>

                <option value="Courier">
                  Courier
                </option>

                <option value="Bus Parcel">
                  Bus Parcel
                </option>

                <option value="VRL Logistics">
                  VRL Logistics
                </option>
              </select>
            </label>
          </div>
        </div>

        {/* TOTAL */}

        <div className="edit-total">
          <div>
            <span>Subtotal</span>

            <strong>
              {formatCurrency(subtotal)}
            </strong>
          </div>

          <div>
            <span>Discount</span>

            <strong>
              -{" "}
              {formatCurrency(
                form.discount
              )}
            </strong>
          </div>

          <div>
            <span>
              Packing & Forwarding
            </span>

            <strong>
              {formatCurrency(
                form.packingAndForwarding
              )}
            </strong>
          </div>

          <div className="grand-total">
            <span>
              Grand Total
            </span>

            <strong>
              {formatCurrency(grandTotal)}
            </strong>
          </div>
        </div>

        {/* SAVE */}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   QUOTATION CARD
========================================================= */

function QuotationCard({
  quotation,
  onView,
  onEdit,
  onSend,
  onWhatsApp,
  onDownloadPDF,
  onCustomerResponse,
  onCreatePacking,
}) {
  const hasPacking =
    Boolean(quotation.packingOrder);

  const canCreatePacking =
    quotation.status ===
      "CUSTOMER_CONFIRMED" &&
    !hasPacking;

  return (
    <div className="quotation-card">
      {/* HEADER */}

      <div className="quotation-card-header">
        <div>
          <h2>
            {quotation.quotationNumber}
          </h2>

          <p>
            Created{" "}
            {formatDate(
              quotation.createdAt
            )}
          </p>
        </div>

        <span
          className={`status-badge status-${String(
            quotation.status || ""
          ).toLowerCase()}`}
        >
          {quotation.status ||
            "UNKNOWN"}
        </span>
      </div>

      {/* CUSTOMER */}

      <div className="customer-row">
        <div className="customer-icon">
          👤
        </div>

        <div>
          <strong>
            {getCustomerName(
              quotation
            )}
          </strong>

          <span>
            {getCustomerPhone(
              quotation
            ) || "No phone"}
          </span>
        </div>
      </div>

      {/* CUSTOMER RESPONSE */}

      <div className="card-customer-response">
        <div className="card-response-header">
          <span>
            CUSTOMER RESPONSE
          </span>

          <span
            className={`response-status-pill ${getCustomerResponseClass(
              quotation.customerResponse
            )}`}
          >
            {getCustomerResponseLabel(
              quotation.customerResponse
            )}
          </span>
        </div>

        {quotation.customerResponse &&
          quotation.customerResponse !==
            "PENDING" && (
            <>
              <div className="card-response-meta">
                <span>
                  {getResponseMethodLabel(
                    quotation.customerResponseMethod
                  )}
                </span>

                <span>
                  {formatDateTime(
                    quotation.customerRespondedAt
                  )}
                </span>
              </div>

              {quotation.customerResponseNote && (
                <p className="card-response-note">
                  {
                    quotation.customerResponseNote
                  }
                </p>
              )}
            </>
          )}
      </div>

      {/* PACKING STATUS */}

      {hasPacking && (
        <div className="packing-created-info">
          <span>
            📦 Packing
          </span>

          <strong>
            {quotation.packingNumber ||
              "Created"}
          </strong>
        </div>
      )}

      {/* PRODUCTS */}

      <div className="products-section">
  <div className="products-heading">
    PRODUCTS
  </div>

  <div className="products-list">
    {/* TABLE HEADER */}
    <div className="product-row product-header">
      <span>PART NO.</span>
      <span>PRODUCT NAME</span>
      <span>SIZE</span>
      <span>COLOUR</span>
      <span>QTY</span>
      <span>UNIT PRICE</span>
      <span>TOTAL</span>
    </div>

    {/* PRODUCT ROWS */}
    {quotation.items?.map((item) => (
      <div
        className="product-row"
        key={item._id}
      >
        <span className="part-number">
          {item.partNumber || "-"}
        </span>

        <span className="product-name">
          {item.productName || "-"}
        </span>

        <span>
          {item.size || "-"}
        </span>

        <span>
          {item.colour || "-"}
        </span>

        <span>
          {item.quantity || 0}
        </span>

        <span>
          ₹{Number(item.unitPrice || 0).toLocaleString("en-IN")}
        </span>

        <strong>
          ₹{Number(item.total || 0).toLocaleString("en-IN")}
        </strong>
      </div>
    ))}
  </div>
</div>

      {/* DETAILS */}

      <div className="quotation-details">
        <div>
          <span>
            Payment
          </span>

          <strong>
            {quotation.paymentMethod ||
              "-"}
          </strong>
        </div>

        <div>
          <span>
            Transport
          </span>

          <strong>
            {quotation.transportMethod ||
              "-"}
          </strong>
        </div>
      </div>

      {/* FOOTER */}

      <div className="quotation-footer">
        <div>
          <span>
            Grand Total
          </span>

          <strong>
            {formatCurrency(
              quotation.grandTotal
            )}
          </strong>
        </div>

        <div className="card-actions">
          {/* VIEW */}

          <button
            type="button"
            className="view-button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              onView(quotation);
            }}
          >
            View Quotation
          </button>

          {/* PDF */}

          <button
  type="button"
  className="pdf-button"
  onClick={(event) => {
    event.preventDefault();
    event.stopPropagation();

    onDownloadPDF(quotation);
  }}
>
  👁 View PDF
</button>
          {/* WHATSAPP */}

          <button
            type="button"
            className="whatsapp-button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              onWhatsApp(quotation);
            }}
          >
            💬 WhatsApp
          </button>

          {/* CUSTOMER RESPONSE */}

          <button
            type="button"
            className="customer-response-button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              onCustomerResponse(
                quotation
              );
            }}
          >
            👤 Customer Response
          </button>

          {/* CREATE PACKING */}

          {canCreatePacking && (
            <button
              type="button"
              className="create-packing-button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                onCreatePacking(
                  quotation
                );
              }}
            >
              📦 Create Packing
            </button>
          )}

          {/* PACKING CREATED */}

          {hasPacking && (
            <button
              type="button"
              className="packing-created-button"
              disabled
            >
              📦 Packing Created
            </button>
          )}

          {/* EDIT */}

          {quotation.status ===
            "DRAFT" && (
            <button
              type="button"
              className="edit-button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                onEdit(quotation);
              }}
            >
              ✏ Edit
            </button>
          )}

          {/* SEND */}

          {quotation.status ===
            "DRAFT" && (
            <button
              type="button"
              className="send-button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                onSend(quotation);
              }}
            >
              Send Quotation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN QUOTATIONS PAGE
========================================================= */

function Quotations() {
  const navigate =
    useNavigate();

  const [quotations, setQuotations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedQuotation, setSelectedQuotation] =
    useState(null);

  const [editingQuotation, setEditingQuotation] =
    useState(null);

  const [responseQuotation, setResponseQuotation] =
    useState(null);

  /* =======================================================
     LOAD QUOTATIONS
  ======================================================= */

  /* =======================================================
   LOAD QUOTATIONS
======================================================= */

async function loadQuotations() {
  console.log("========== LOAD QUOTATIONS START ==========");

  setLoading(true);
  setError("");

  try {
    console.log("Calling /api/quotations...");

    const response = await api.get("/quotations");

    console.log("Axios quotation response:", response);
    console.log("Axios quotation data:", response.data);

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Failed to load quotations"
      );
    }

    const quotationList = Array.isArray(
      response.data.quotations
    )
      ? response.data.quotations
      : [];

    console.log(
      "QUOTATIONS RECEIVED:",
      quotationList.length
    );

    setQuotations(quotationList);

    console.log(
      "Quotation state updated with:",
      quotationList.length
    );
  } catch (err) {
    console.error(
      "LOAD QUOTATIONS ERROR:",
      err
    );

    setQuotations([]);

    setError(
      err.response?.data?.message ||
        err.message ||
        "Failed to load quotations"
    );
  } finally {
    console.log(
      "========== LOAD QUOTATIONS FINISHED =========="
    );

    setLoading(false);
  }
}

useEffect(() => {
  console.log(
    "QUOTATIONS PAGE MOUNTED"
  );

  loadQuotations();
}, []);

  /* =======================================================
     VIEW
  ======================================================= */

  function handleView(quotation) {
    console.log(
      "Opening quotation:",
      quotation.quotationNumber
    );

    setEditingQuotation(null);

    setSelectedQuotation(
      quotation
    );
  }

  /* =======================================================
     EDIT
  ======================================================= */

  function handleEdit(quotation) {
    setSelectedQuotation(null);

    setEditingQuotation(
      quotation
    );
  }

  /* =======================================================
     CUSTOMER RESPONSE
  ======================================================= */

  function handleCustomerResponse(
    quotation
  ) {
    if (!quotation?._id) {
      alert(
        "Quotation ID is missing."
      );

      return;
    }

    setResponseQuotation(
      quotation
    );
  }

  function handleCustomerResponseSaved(
    updatedQuotation
  ) {
    if (!updatedQuotation?._id) {
      return;
    }

    setQuotations(
      (previous) =>
        previous.map(
          (item) =>
            item._id ===
            updatedQuotation._id
              ? updatedQuotation
              : item
        )
    );

    setResponseQuotation(null);
  }

  /* =======================================================
     AFTER EDIT SAVE
  ======================================================= */

  function handleQuotationSaved(
    updatedQuotation
  ) {
    if (!updatedQuotation?._id) {
      return;
    }

    setQuotations(
      (previous) =>
        previous.map(
          (item) =>
            item._id ===
            updatedQuotation._id
              ? updatedQuotation
              : item
        )
    );

    setEditingQuotation(null);
  }

  /* =======================================================
     SEND QUOTATION
  ======================================================= */

  async function handleSendQuotation(
    quotation
  ) {
    if (!quotation?._id) {
      alert(
        "Quotation ID is missing."
      );

      return;
    }

    try {
      const confirmed =
        window.confirm(
          `Send quotation ${quotation.quotationNumber}?`
        );

      if (!confirmed) {
        return;
      }

      const response =
        await api.post(
          `/quotations/${quotation._id}/send`
        );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to send quotation"
        );
      }

      alert(
        "Quotation sent successfully."
      );

      await loadQuotations();
    } catch (err) {
      console.error(
        "Send quotation error:",
        err
      );

      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to send quotation"
      );
    }
  }

  /* =======================================================
     DOWNLOAD / OPEN PDF
  ======================================================= */

 function handleDownloadPDF(quotation) {
  const quotationId = quotation?._id;

  if (
    !quotationId ||
    !/^[0-9a-fA-F]{24}$/.test(
      String(quotationId)
    )
  ) {
    alert(
      "Quotation ID is missing or invalid."
    );

    return;
  }

  console.log(
    "Opening quotation PDF preview:",
    quotationId
  );

  navigate(
    `/manager/quotations/${quotationId}/pdf`
  );
}


  /* =======================================================
     WHATSAPP
  ======================================================= */

  function handleWhatsApp(
    quotation
  ) {
    if (!quotation) {
      return;
    }

    const rawPhone =
      getCustomerPhone(
        quotation
      );

    if (!rawPhone) {
      alert(
        "Customer WhatsApp number is missing."
      );

      return;
    }

    let phone = String(
      rawPhone
    ).replace(/\D/g, "");

    /* Remove leading zero */

    if (phone.startsWith("0")) {
      phone = phone.substring(1);
    }

    /* Add India country code */

    if (phone.length === 10) {
      phone = `91${phone}`;
    }

    if (phone.length < 12) {
      alert(
        "Please enter a valid Indian customer phone number."
      );

      return;
    }

    const customerName =
      getCustomerName(
        quotation
      );

    const message = `Hello ${customerName} 👋

Thank you for choosing KICKMAC SOLUTIONS.

Your quotation ${quotation.quotationNumber} is ready.

Grand Total: ₹${Number(
      quotation.grandTotal || 0
    ).toLocaleString("en-IN")}

Please review the quotation and confirm your order.

Thank you,

KICKMAC SOLUTIONS`;

    const whatsappUrl =
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`;

    console.log(
      "Opening WhatsApp:",
      whatsappUrl
    );

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =======================================================
     CREATE PACKING
  ======================================================= */

  function handleCreatePacking(
    quotation
  ) {
    if (!quotation?._id) {
      alert(
        "Quotation ID is missing."
      );

      return;
    }

    if (
      quotation.status !==
      "CUSTOMER_CONFIRMED"
    ) {
      alert(
        "Only customer-confirmed quotations can create a packing order."
      );

      return;
    }

    if (quotation.packingOrder) {
      alert(
        `Packing order already exists${
          quotation.packingNumber
            ? `: ${quotation.packingNumber}`
            : "."
        }`
      );

      return;
    }

    const quotationId =
      quotation._id;

    console.log(
      "Creating packing for quotation:",
      quotationId
    );

    navigate(
      `/manager/packing/new?quotationId=${quotationId}`
    );
  }

  /* =======================================================
     CLOSE MODALS
  ======================================================= */

  function closeViewModal() {
    setSelectedQuotation(null);
  }

  function closeEditModal() {
    setEditingQuotation(null);
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="quotations-page">
      {/* HEADER */}

      <header className="quotations-header">
        <div>
          <div className="sales-brand">
            KICKMAC • SALES
          </div>

          <h1>
            Quotations
          </h1>

          <p>
            View and manage all saved
            customer quotations.
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/manager"
            className="manager-back-button"
          >
            ← Manager
          </Link>

          <Link
            to="/manager/quotations/new"
            className="new-quotation-btn"
          >
            + New Quotation
          </Link>
        </div>
      </header>

      {/* MAIN */}

      <main className="quotations-main">
        <div className="page-title-row">
          <div>
            <h2>
              Saved Quotations
            </h2>

            <p>
              All quotations stored in
              MongoDB
            </p>
          </div>

          <div className="quotation-count">
            {loading
              ? "Loading..."
              : `${quotations.length} Quotations`}
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="loading-box">
            Loading quotations from server...
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="error-box">
            <strong>
              Error:
            </strong>{" "}
            {error}

            <button
              type="button"
              onClick={
                loadQuotations
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          quotations.length === 0 && (
            <div className="empty-box">
              <div>📄</div>

              <h2>
                No Quotations Found
              </h2>

              <p>
                Create your first
                quotation from the
                Manager dashboard.
              </p>

              <Link
                to="/manager/quotations/new"
                className="new-quotation-button"
              >
                + New Quotation
              </Link>
            </div>
          )}

        {/* QUOTATION LIST */}

        {!loading &&
          !error &&
          quotations.length > 0 && (
            <div className="quotation-list">
              {quotations.map(
                (quotation) => (
                  <QuotationCard
                    key={
                      quotation._id
                    }
                    quotation={
                      quotation
                    }
                    onView={
                      handleView
                    }
                    onEdit={
                      handleEdit
                    }
                    onSend={
                      handleSendQuotation
                    }
                    onWhatsApp={
                      handleWhatsApp
                    }
                    onDownloadPDF={
                      handleDownloadPDF
                    }
                    onCustomerResponse={
                      handleCustomerResponse
                    }
                    onCreatePacking={
                      handleCreatePacking
                    }
                  />
                )
              )}
            </div>
          )}
      </main>

      {/* VIEW MODAL */}

      <QuotationViewModal
        quotation={
          selectedQuotation
        }
        onClose={
          closeViewModal
        }
        onEdit={
          handleEdit
        }
        onCreatePacking={
          handleCreatePacking
        }
      />

      {/* CUSTOMER RESPONSE MODAL */}

      <CustomerResponseModal
        quotation={
          responseQuotation
        }
        onClose={() =>
          setResponseQuotation(
            null
          )
        }
        onSaved={
          handleCustomerResponseSaved
        }
      />

      {/* EDIT MODAL */}

      <EditQuotationModal
        quotation={
          editingQuotation
        }
        onClose={
          closeEditModal
        }
        onSaved={
          handleQuotationSaved
        }
      />
    </div>
  );
}

export default Quotations;