import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./NewQuotation.css";

function NewQuotation() {
  const navigate = useNavigate();

  // =========================================================
  // CUSTOMER
  // =========================================================

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // =========================================================
  // PRODUCTS
  // =========================================================

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [productSearch, setProductSearch] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  const [productForm, setProductForm] = useState({
    partNumber: "",
    name: "",
    category: "",
    unit: "Piece",
    sizes: "",
    colours: "",
    price: "",
    singlePiecePrice: "",
  });

  // =========================================================
  // QUOTATION ITEMS
  // =========================================================

  const createEmptyItem = () => ({
    id: `${Date.now()}-${Math.random()}`,
    product: "",
    partNumber: "",
    productName: "",
    size: "",
    colour: "",
    quantity: 1,
    unit: "Piece",
    price: 0,
  });

  const [items, setItems] = useState([createEmptyItem()]);

  // =========================================================
  // CHARGES
  // =========================================================

  const [discount, setDiscount] = useState(0);
  const [packingAndForwarding, setPackingAndForwarding] =
    useState(0);

  // =========================================================
  // PAYMENT
  // =========================================================

  const [paymentMethod, setPaymentMethod] = useState(
    "50% Advance, 50% Before Dispatch"
  );

  // =========================================================
  // TRANSPORT
  // =========================================================

  const [transportMethod, setTransportMethod] = useState(
    "Customer Transport"
  );

  // Transport name is kept separately.
  // This will be useful later in Packing / Dispatch.
  const [transportName, setTransportName] = useState(
    "Customer Transport"
  );

  // =========================================================
  // SAVE STATE
  // =========================================================

  const [saving, setSaving] = useState(false);

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await api.get("/products");

      console.log("Products response:", response.data);

      const productList =
        response.data?.products ||
        response.data?.data ||
        response.data ||
        [];

      if (Array.isArray(productList)) {
        setProducts(
          productList.filter(
            (product) => product.active !== false
          )
        );
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to load products:", error);

      setProducts([]);

      alert(
        error.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // =========================================================
  // CLOSE PRODUCT SEARCH WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(
          ".product-search-section"
        )
      ) {
        setShowProductResults(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================================
  // CUSTOMER SEARCH
  // =========================================================

  const searchCustomers = async (value) => {
    setCustomerSearch(value);

    if (!value.trim()) {
      setCustomers([]);
      return;
    }

    try {
      setCustomerLoading(true);

      const response = await api.get(
        `/customers?search=${encodeURIComponent(
          value.trim()
        )}`
      );

      console.log(
        "Customer search response:",
        response.data
      );

      const customerList =
        response.data?.customers ||
        response.data?.data ||
        response.data ||
        [];

      setCustomers(
        Array.isArray(customerList)
          ? customerList
          : []
      );
    } catch (error) {
      console.error(
        "Customer search error:",
        error
      );

      setCustomers([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  // =========================================================
  // SELECT CUSTOMER
  // =========================================================

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);

    setCustomerSearch(
      customer.name || ""
    );

    setCustomers([]);
  };

  // =========================================================
  // CLEAR CUSTOMER
  // =========================================================

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomers([]);
  };

  // =========================================================
  // CUSTOMER FORM CHANGE
  // =========================================================

  const handleCustomerFormChange = (
    field,
    value
  ) => {
    setCustomerForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // ADD CUSTOMER
  // =========================================================

  const handleAddCustomer = async (event) => {
    event.preventDefault();

    if (!customerForm.name.trim()) {
      alert("Customer name is required.");
      return;
    }

    try {
      setCustomerLoading(true);

      const payload = {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim(),
        address: customerForm.address.trim(),
        city: customerForm.city.trim(),
        state: customerForm.state.trim(),
        pincode: customerForm.pincode.trim(),
      };

      console.log("Adding customer:", payload);

      const response = await api.post(
        "/customers",
        payload
      );

      console.log(
        "New customer response:",
        response.data
      );

      const newCustomer =
        response.data?.customer ||
        response.data?.data;

      if (!newCustomer) {
        throw new Error(
          "Customer was created but no customer data was returned."
        );
      }

      setSelectedCustomer(newCustomer);

      setCustomerSearch(
        newCustomer.name || ""
      );

      setCustomers([]);
      setShowCustomerForm(false);

      setCustomerForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      });

      alert("Customer added successfully.");
    } catch (error) {
      console.error(
        "Add customer error:",
        error
      );

      if (
        error.response?.status === 409 &&
        error.response?.data?.customer
      ) {
        const existingCustomer =
          error.response.data.customer;

        const useExisting =
          window.confirm(
            `${
              error.response.data.message ||
              "Customer already exists."
            }\n\nDo you want to use the existing customer?`
          );

        if (useExisting) {
          selectCustomer(existingCustomer);
          setShowCustomerForm(false);
        }

        return;
      }

      alert(
        error.response?.data?.message ||
          "Failed to add customer."
      );
    } finally {
      setCustomerLoading(false);
    }
  };

  // =========================================================
  // PRODUCT SEARCH FILTER
  // =========================================================

  const filteredProducts = useMemo(() => {
    const search = productSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return [];
    }

    return products
      .filter((product) => {
        const partNumber = String(
          product.partNumber || ""
        ).toLowerCase();

        const name = String(
          product.name || ""
        ).toLowerCase();

        const category = String(
          product.category || ""
        ).toLowerCase();

        return (
          partNumber.includes(search) ||
          name.includes(search) ||
          category.includes(search)
        );
      })
      .slice(0, 20);
  }, [products, productSearch]);

  // =========================================================
  // PRODUCT SEARCH INPUT
  // =========================================================

  const handleProductSearch = (value) => {
    setProductSearch(value);

    setShowProductResults(
      value.trim().length > 0
    );
  };

  // =========================================================
  // UPDATE ITEM
  // =========================================================

  const updateItem = (
    itemId,
    field,
    value
  ) => {
    setItems((previousItems) =>
      previousItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (field === "quantity") {
          return {
            ...item,
            quantity: Math.max(
              Number(value) || 0,
              0
            ),
          };
        }

        if (field === "price") {
          return {
            ...item,
            price: Math.max(
              Number(value) || 0,
              0
            ),
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  // =========================================================
  // SELECT PRODUCT
  // =========================================================

  const selectProduct = (
    itemId,
    productId
  ) => {
    if (!productId) {
      setItems((previousItems) =>
        previousItems.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          return {
            ...item,
            product: "",
            partNumber: "",
            productName: "",
            size: "",
            colour: "",
            unit: "Piece",
            price: 0,
          };
        })
      );

      return;
    }

    const product = products.find(
      (item) =>
        String(item._id) ===
        String(productId)
    );

    if (!product) {
      return;
    }

    setItems((previousItems) =>
      previousItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          product: product._id,
          partNumber:
            product.partNumber || "",
          productName:
            product.name || "",
          size: "",
          colour: "",
          unit:
            product.unit || "Piece",
          price:
            Number(product.price) || 0,
        };
      })
    );
  };

  // =========================================================
  // SELECT PRODUCT FROM SEARCH
  // =========================================================

  const selectProductFromSearch = (
    product
  ) => {
    if (!product) {
      return;
    }

    const emptyItem = items.find(
      (item) => !item.product
    );

    const targetItem =
      emptyItem ||
      items[items.length - 1];

    if (!targetItem) {
      return;
    }

    selectProduct(
      targetItem.id,
      product._id
    );

    setProductSearch("");
    setShowProductResults(false);
  };

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addItem = () => {
    setItems((previousItems) => [
      ...previousItems,
      createEmptyItem(),
    ]);
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeItem = (itemId) => {
    if (items.length === 1) {
      alert(
        "At least one product is required."
      );
      return;
    }

    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.id !== itemId
      )
    );
  };

  // =========================================================
  // NEW PRODUCT FORM CHANGE
  // =========================================================

  const handleProductFormChange = (
    field,
    value
  ) => {
    setProductForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // RESET PRODUCT FORM
  // =========================================================

  const resetProductForm = () => {
    setProductForm({
      partNumber: "",
      name: "",
      category: "",
      unit: "Piece",
      sizes: "",
      colours: "",
      price: "",
      singlePiecePrice: "",
    });
  };

  // =========================================================
  // ADD NEW PRODUCT
  // =========================================================

  const handleAddProduct = async (event) => {
    event.preventDefault();

    if (!productForm.partNumber.trim()) {
      alert("Part Number is required.");
      return;
    }

    if (!productForm.name.trim()) {
      alert("Product Name is required.");
      return;
    }

    if (
      productForm.price === "" ||
      Number(productForm.price) < 0
    ) {
      alert("Please enter a valid price.");
      return;
    }

    if (
      productForm.singlePiecePrice !== "" &&
      Number(productForm.singlePiecePrice) < 0
    ) {
      alert(
        "Single Piece Price cannot be negative."
      );
      return;
    }

    try {
      setSavingProduct(true);

      const payload = {
        partNumber:
          productForm.partNumber.trim(),

        name:
          productForm.name.trim(),

        category:
          productForm.category.trim(),

        unit:
          productForm.unit.trim() ||
          "Piece",

        sizes: productForm.sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean),

        colours: productForm.colours
          .split(",")
          .map((colour) =>
            colour.trim()
          )
          .filter(Boolean),

        price:
          Number(productForm.price) || 0,

        singlePiecePrice:
          productForm.singlePiecePrice === ""
            ? null
            : Number(
                productForm.singlePiecePrice
              ),
      };

      console.log(
        "Adding product:",
        payload
      );

      const response = await api.post(
        "/products",
        payload
      );

      console.log(
        "New product response:",
        response.data
      );

      const newProduct =
        response.data?.product ||
        response.data?.data;

      if (!newProduct) {
        throw new Error(
          "Product was created but no product data was returned."
        );
      }

      // Add product to current product list
      setProducts((previousProducts) => [
        newProduct,
        ...previousProducts,
      ]);

      // Automatically select new product
      const emptyItem = items.find(
        (item) => !item.product
      );

      const targetItem =
        emptyItem ||
        items[items.length - 1];

      if (targetItem) {
        setItems((previousItems) =>
          previousItems.map((item) => {
            if (
              item.id !==
              targetItem.id
            ) {
              return item;
            }

            return {
              ...item,
              product:
                newProduct._id,
              partNumber:
                newProduct.partNumber ||
                "",
              productName:
                newProduct.name ||
                "",
              size: "",
              colour: "",
              unit:
                newProduct.unit ||
                "Piece",
              price:
                Number(
                  newProduct.price
                ) || 0,
            };
          })
        );
      }

      setProductSearch("");
      setShowProductResults(false);
      setShowProductForm(false);

      resetProductForm();

      alert(
        "New product added successfully."
      );
    } catch (error) {
      console.error(
        "Add product error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to add product."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  // =========================================================
  // SUBTOTAL
  // =========================================================

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => {
        const quantity =
          Number(item.quantity) || 0;

        const price =
          Number(item.price) || 0;

        return (
          total +
          quantity * price
        );
      },
      0
    );
  }, [items]);

  // =========================================================
  // SAFE DISCOUNT
  // =========================================================

  const safeDiscount = Math.min(
    Math.max(
      Number(discount) || 0,
      0
    ),
    subtotal
  );

  // =========================================================
  // AMOUNT AFTER DISCOUNT
  // =========================================================

  const amountAfterDiscount =
    Math.max(
      subtotal - safeDiscount,
      0
    );

  // =========================================================
  // SAFE PACKING CHARGE
  // =========================================================

  const safePackingAndForwarding =
    Math.max(
      Number(
        packingAndForwarding
      ) || 0,
      0
    );

  // =========================================================
  // GRAND TOTAL
  // =========================================================

  const grandTotal =
    amountAfterDiscount +
    safePackingAndForwarding;

  // =========================================================
  // CURRENCY
  // =========================================================

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // =========================================================
  // QUOTATION NUMBER
  // =========================================================

  const generateQuotationNumber = () => {
    const year =
      new Date().getFullYear();

    const randomPart =
      String(Date.now()).slice(-6);

    return `QTN-${year}-${randomPart}`;
  };

  // =========================================================
  // PAYMENT OPTIONS
  // =========================================================

  const PAYMENT_OPTIONS = [
    "Google Pay",
    "PhonePe",
    "Cash",
    "UPI ID",
    "Advance Payment",
    "50% Advance, 50% Before Dispatch",
    "100% Advance",
    "100% Before Dispatch",
    "Credit",
    "Cash on Delivery",
    "Bank Transfer",
    "Other",
  ];

  // =========================================================
  // TRANSPORT OPTIONS
  // =========================================================

  const TRANSPORT_OPTIONS = [
    {
      name: "Seabird",
      method: "Transport",
    },
    {
      name: "Sugama",
      method: "Transport",
    },
    {
      name: "Navadurga",
      method: "Transport",
    },
    {
      name: "Nagashree",
      method: "Transport",
    },
    {
      name: "MSS",
      method: "Transport",
    },
    {
      name: "KPN",
      method: "Transport",
    },
    {
      name: "VRL",
      method: "Transport",
    },
    {
      name: "Navata Transport",
      method: "Transport",
    },
    {
      name: "A1 Sharma",
      method: "Transport",
    },
    {
      name: "Professional Couriers",
      method: "Courier",
    },
    {
      name: "DTDC",
      method: "Courier",
    },
    {
      name: "Porter",
      method: "Porter",
    },
    {
      name: "India Post",
      method: "Post",
    },
    {
      name: "Customer Transport",
      method: "Customer Transport",
    },
    {
      name: "Other",
      method: "Other",
    },
  ];

  // =========================================================
  // TRANSPORT CHANGE
  // =========================================================

  const handleTransportChange = (
    value
  ) => {
    setTransportName(value);

    const selectedTransport =
      TRANSPORT_OPTIONS.find(
        (transport) =>
          transport.name === value
      );

    if (selectedTransport) {
      setTransportMethod(
        selectedTransport.method
      );
    } else {
      setTransportMethod(value);
    }
  };

  // =========================================================
  // SAVE QUOTATION
  // =========================================================

  const handleSave = async () => {
    // -------------------------------------------------------
    // CUSTOMER VALIDATION
    // -------------------------------------------------------

    if (!selectedCustomer) {
      alert(
        "Please search and select a customer."
      );
      return;
    }

    // -------------------------------------------------------
    // PRODUCT VALIDATION
    // -------------------------------------------------------

    if (items.length === 0) {
      alert(
        "Please add at least one product."
      );
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !item.product ||
        !item.partNumber ||
        !item.productName ||
        Number(item.quantity) <= 0 ||
        Number(item.price) < 0
    );

    if (invalidItem) {
      alert(
        "Please select a product and enter a valid quantity and price for every item."
      );
      return;
    }

    // -------------------------------------------------------
    // TRANSPORT VALIDATION
    // -------------------------------------------------------

    if (!transportName.trim()) {
      alert(
        "Please select a transport method."
      );
      return;
    }

    try {
      setSaving(true);

      const quotationNumber =
        generateQuotationNumber();

      // -----------------------------------------------------
      // BUILD QUOTATION ITEMS
      // -----------------------------------------------------

      const quotationItems =
        items.map((item) => ({
          product: item.product,

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

          quantity:
            Number(item.quantity),

          unitPrice:
            Number(item.price),

          total:
            Number(item.quantity) *
            Number(item.price),
        }));

      // -----------------------------------------------------
      // BUILD PAYLOAD
      // -----------------------------------------------------

      const payload = {
        quotationNumber,

        // Customer
        customer:
          selectedCustomer._id,

        customerName:
          selectedCustomer.name || "",

        customerPhone:
          selectedCustomer.phone || "",

        customerEmail:
          selectedCustomer.email || "",

        // Customer address
        customerAddress:
          selectedCustomer.address || "",

        customerCity:
          selectedCustomer.city || "",

        customerState:
          selectedCustomer.state || "",

        customerPincode:
          selectedCustomer.pincode || "",

        // Items
        items: quotationItems,

        // Charges
        subtotal:
          Number(subtotal),

        discount:
          Number(safeDiscount),

        packingAndForwarding:
          Number(
            safePackingAndForwarding
          ),

        grandTotal:
          Number(grandTotal),

        // Payment
        paymentMethod:
          paymentMethod || "",

        // Transport
        transportMethod:
          transportMethod || "",

        transportName:
          transportName || "",

        // Status
        status: "DRAFT",
      };

      console.log(
        "Saving quotation:",
        payload
      );

      // -----------------------------------------------------
      // API REQUEST
      // -----------------------------------------------------

      const response =
        await api.post(
          "/quotations",
          payload
        );

      console.log(
        "Quotation saved:",
        response.data
      );

      alert(
        response.data?.message ||
          "Quotation saved successfully."
      );

      // -----------------------------------------------------
      // GO TO MANAGER DASHBOARD
      // -----------------------------------------------------

      navigate("/manager");
    } catch (error) {
      console.error(
        "Quotation save error:",
        error
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to save quotation."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="quotation-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="quotation-header">

        <div className="quotation-brand-block">

          <div className="quotation-brand">
            KICKMAC
          </div>

          <div className="quotation-brand-subtitle">
            SOLUTIONS
          </div>

        </div>

        <div className="quotation-heading">

          <div className="quotation-label">
            KICKMAC • SALES
          </div>

          <h1>
            New Quotation
          </h1>

          <p>
            Create a quotation for your
            customer
          </p>

        </div>

      </header>

      <main className="quotation-container">

        {/* =====================================================
            CUSTOMER
        ===================================================== */}

        <section className="quotation-section-card">

          <div className="section-heading">

            <div className="section-number">
              01
            </div>

            <div>
              <h2>
                Customer
              </h2>

              <p>
                Search and select your
                customer
              </p>
            </div>

          </div>

          <label>
            Customer
          </label>

          {/* CUSTOMER SEARCH */}

          <div className="search-box">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search customer name or phone number..."
              value={customerSearch}
              onChange={(event) =>
                searchCustomers(
                  event.target.value
                )
              }
            />

            {customerSearch && (
              <button
                type="button"
                className="search-clear"
                onClick={
                  clearCustomer
                }
              >
                ×
              </button>
            )}

          </div>

          {/* CUSTOMER LOADING */}

          {customerLoading &&
            !showCustomerForm && (
              <div className="customer-loading">
                Searching customers...
              </div>
            )}

          {/* CUSTOMER RESULTS */}

          {customers.length > 0 &&
            !selectedCustomer && (
              <div className="customer-results">

                {customers.map(
                  (customer) => (
                    <button
                      type="button"
                      key={
                        customer._id
                      }
                      className="customer-result"
                      onClick={() =>
                        selectCustomer(
                          customer
                        )
                      }
                    >

                      <div>

                        <strong>
                          {
                            customer.name
                          }
                        </strong>

                        <span>
                          {
                            customer.phone ||
                            "No phone number"
                          }
                        </span>

                        {customer.city && (
                          <small>
                            {
                              customer.city
                            }

                            {customer.state &&
                              `, ${customer.state}`}
                          </small>
                        )}

                      </div>

                      <span className="select-customer-text">
                        Select →
                      </span>

                    </button>
                  )
                )}

              </div>
            )}

          {/* NO CUSTOMER */}

          {customerSearch.trim() &&
            !customerLoading &&
            customers.length === 0 &&
            !selectedCustomer &&
            !showCustomerForm && (
              <div className="no-customer-result">
                No customer found.
              </div>
            )}

          {/* SELECTED CUSTOMER */}

          {selectedCustomer && (
            <div className="selected-customer">

              <div>

                <strong>
                  {
                    selectedCustomer.name
                  }
                </strong>

                {selectedCustomer.phone && (
                  <p>
                    📞{" "}
                    {
                      selectedCustomer.phone
                    }
                  </p>
                )}

                {selectedCustomer.email && (
                  <p>
                    ✉️{" "}
                    {
                      selectedCustomer.email
                    }
                  </p>
                )}

                {(selectedCustomer.address ||
                  selectedCustomer.city ||
                  selectedCustomer.state ||
                  selectedCustomer.pincode) && (
                  <p>
                    📍{" "}
                    {
                      selectedCustomer.address ||
                      ""
                    }

                    {selectedCustomer.city &&
                      `, ${selectedCustomer.city}`}

                    {selectedCustomer.state &&
                      `, ${selectedCustomer.state}`}

                    {selectedCustomer.pincode &&
                      ` - ${selectedCustomer.pincode}`}
                  </p>
                )}

              </div>

              <button
                type="button"
                onClick={
                  clearCustomer
                }
              >
                Change
              </button>

            </div>
          )}

          {/* ADD CUSTOMER */}

          {!showCustomerForm && (
            <button
              type="button"
              className="add-customer-button"
              onClick={() => {
                setShowCustomerForm(
                  true
                );
                setCustomers([]);
              }}
            >
              + Add New Customer
            </button>
          )}

          {/* NEW CUSTOMER FORM */}

          {showCustomerForm && (
            <form
              className="customer-form"
              onSubmit={
                handleAddCustomer
              }
            >

              <div className="customer-form-header">

                <div>

                  <h3>
                    Add New Customer
                  </h3>

                  <p>
                    Enter customer details
                  </p>

                </div>

                <button
                  type="button"
                  className="customer-form-close"
                  onClick={() =>
                    setShowCustomerForm(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <div className="customer-form-grid">

                {/* NAME */}

                <div className="form-group">

                  <label>
                    Customer Name *
                  </label>

                  <input
                    type="text"
                    value={
                      customerForm.name
                    }
                    onChange={(event) =>
                      handleCustomerFormChange(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Enter customer name"
                    required
                  />

                </div>

                {/* PHONE */}

                <div className="form-group">

                  <label>
                    Phone Number
                  </label>

                  <input
                    type="text"
                    value={
                      customerForm.phone
                    }
                    onChange={(event) =>
                      handleCustomerFormChange(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="Enter phone number"
                  />

                </div>

                {/* EMAIL */}

                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      customerForm.email
                    }
                    onChange={(event) =>
                      handleCustomerFormChange(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="Enter email"
                  />

                </div>

                {/* CITY */}

                <div className="form-group">

                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    value={
                      customerForm.city
                    }
                    onChange={(event) =>
                      handleCustomerFormChange(
                        "city",
                        event.target.value
                      )
                    }
                    placeholder="City"
                  />

                </div>

                {/* STATE */}

                <div className="form-group">

                  <label>
                    State
                  </label>

                  <input
                    type="text"
                    value={
                      customerForm.state
                    }
                    onChange={(event) =>
                      handleCustomerFormChange(
                        "state",
                        event.target.value
                      )
                    }
                    placeholder="State"
                  />

                </div>

                {/* PINCODE */}

                <div className="form-group">

                  <label>
                    Pincode
                  </label>

                  <input
                    type="text"
                    value={
                      customerForm.pincode
                    }
                    onChange={(event) =>
                      handleCustomerFormChange(
                        "pincode",
                        event.target.value
                      )
                    }
                    placeholder="Pincode"
                  />

                </div>

                {/* ADDRESS */}

                <div className="form-group full-width">

                  <label>
                    Address
                  </label>

                  <textarea
                    rows="3"
                    value={
                      customerForm.address
                    }
                    onChange={(event) =>
                      handleCustomerFormChange(
                        "address",
                        event.target.value
                      )
                    }
                    placeholder="Enter customer address"
                  />

                </div>

              </div>

              <div className="customer-form-actions">

                <button
                  type="button"
                  className="customer-cancel-button"
                  onClick={() =>
                    setShowCustomerForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-save-button"
                  disabled={
                    customerLoading
                  }
                >
                  {customerLoading
                    ? "Saving..."
                    : "Save Customer"}
                </button>

              </div>

            </form>
          )}

        </section>

        {/* =====================================================
            PRODUCTS
        ===================================================== */}

        <section className="quotation-section-card">

          <div className="section-heading">

            <div className="section-number">
              02
            </div>

            <div>

              <h2>
                Products
              </h2>

              <p>
                Search and add products to
                this quotation
              </p>

            </div>

            <div className="item-count">

              {items.length}{" "}

              {items.length === 1
                ? "item"
                : "items"}

            </div>

          </div>

          {/* PRODUCT SEARCH */}

          <div className="product-search-section">

            <label>
              Search Product
            </label>

            <div className="product-search-box">

              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Search product name, part number or category..."
                value={
                  productSearch
                }
                onChange={(event) =>
                  handleProductSearch(
                    event.target.value
                  )
                }
                onFocus={() => {
                  if (
                    productSearch.trim()
                  ) {
                    setShowProductResults(
                      true
                    );
                  }
                }}
              />

              {productSearch && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    setProductSearch(
                      ""
                    );
                    setShowProductResults(
                      false
                    );
                  }}
                >
                  ×
                </button>
              )}

            </div>

            {/* PRODUCT SEARCH RESULTS */}

            {showProductResults &&
              productSearch.trim() && (
                <div className="product-search-results">

                  {filteredProducts.length >
                  0 ? (
                    filteredProducts.map(
                      (product) => (
                        <button
                          key={
                            product._id
                          }
                          type="button"
                          className="product-search-result"
                          onClick={() =>
                            selectProductFromSearch(
                              product
                            )
                          }
                        >

                          <div>

                            <strong>
                              {
                                product.partNumber
                              }
                            </strong>

                            <span>
                              {
                                product.name
                              }

                              {product.category &&
                                ` • ${product.category}`}
                            </span>

                          </div>

                          <strong>
                            {formatCurrency(
                              product.price
                            )}
                          </strong>

                        </button>
                      )
                    )
                  ) : (
                    <div className="customer-loading">
                      No products found.
                    </div>
                  )}

                </div>
              )}

          </div>

          {/* ADD NEW PRODUCT */}

          <button
            type="button"
            className="add-item-button"
            onClick={() => {
              setShowProductForm(
                true
              );

              setShowProductResults(
                false
              );
            }}
            style={{
              marginBottom: "18px",
            }}
          >
            + Add New Product
          </button>

          {/* NEW PRODUCT FORM */}

          {showProductForm && (
            <form
              onSubmit={
                handleAddProduct
              }
              className="add-product-form"
            >

              <div className="customer-form-header">

                <div>

                  <h3>
                    Add New Product
                  </h3>

                  <p>
                    Add a product to the
                    KICKMAC product master.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(
                      false
                    );
                    resetProductForm();
                  }}
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    fontSize: "24px",
                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>

              </div>

              <div className="form-grid">

                {/* PART NUMBER */}

                <div className="form-group">

                  <label>
                    Part Number *
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.partNumber
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "partNumber",
                        event.target.value
                      )
                    }
                    placeholder="Example: KGV2"
                    required
                  />

                </div>

                {/* PRODUCT NAME */}

                <div className="form-group">

                  <label>
                    Product Name *
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.name
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Example: Karate Gloves"
                    required
                  />

                </div>

                {/* CATEGORY */}

                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.category
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "category",
                        event.target.value
                      )
                    }
                    placeholder="Example: Karate"
                  />

                </div>

                {/* UNIT */}

                <div className="form-group">

                  <label>
                    Unit
                  </label>

                  <select
                    value={
                      productForm.unit
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "unit",
                        event.target.value
                      )
                    }
                  >

                    <option value="Piece">
                      Piece
                    </option>

                    <option value="Pair">
                      Pair
                    </option>

                    <option value="Set">
                      Set
                    </option>

                    <option value="Box">
                      Box
                    </option>

                    <option value="Pack">
                      Pack
                    </option>

                  </select>

                </div>

                {/* SIZES */}

                <div className="form-group">

                  <label>
                    Sizes
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.sizes
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "sizes",
                        event.target.value
                      )
                    }
                    placeholder="Example: S, M, L, XL"
                  />

                  <small>
                    Separate sizes with
                    commas.
                  </small>

                </div>

                {/* COLOURS */}

                <div className="form-group">

                  <label>
                    Colours
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.colours
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "colours",
                        event.target.value
                      )
                    }
                    placeholder="Example: Red, Blue, Black"
                  />

                  <small>
                    Separate colours with
                    commas.
                  </small>

                </div>

                {/* PRICE */}

                <div className="form-group">

                  <label>
                    Price *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      productForm.price
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="Example: 740"
                    required
                  />

                </div>

                {/* SINGLE PIECE PRICE */}

                <div className="form-group">

                  <label>
                    Single Piece Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      productForm.singlePiecePrice
                    }
                    onChange={(event) =>
                      handleProductFormChange(
                        "singlePiecePrice",
                        event.target.value
                      )
                    }
                    placeholder="Example: 370"
                  />

                </div>

              </div>

              <div className="add-product-actions">

                <button
                  type="button"
                  className="add-product-cancel"
                  onClick={() => {
                    setShowProductForm(
                      false
                    );
                    resetProductForm();
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-product-save"
                  disabled={
                    savingProduct
                  }
                >
                  {savingProduct
                    ? "Saving Product..."
                    : "Save Product"}
                </button>

              </div>

            </form>
          )}

          {/* PRODUCT LOADING */}

          {loadingProducts && (
            <div className="product-loading">
              Loading products from
              database...
            </div>
          )}

          {/* NO PRODUCTS */}

          {!loadingProducts &&
            products.length === 0 && (
              <div className="product-error">
                No products found. Please
                check your backend product
                API.
              </div>
            )}

          {/* =================================================
              QUOTATION TABLE
          ================================================= */}

          <div className="product-table-wrapper">

            <table className="product-table">

              <thead>

                <tr>

                  <th>
                    PART NO.
                  </th>

                  <th>
                    PRODUCT
                  </th>

                  <th>
                    SIZE
                  </th>

                  <th>
                    COLOUR
                  </th>

                  <th>
                    QTY
                  </th>

                  <th>
                    UNIT
                  </th>

                  <th>
                    PRICE
                  </th>

                  <th>
                    TOTAL
                  </th>

                  <th></th>

                </tr>

              </thead>

              <tbody>

                {items.map((item) => {

                  const selectedProduct =
                    products.find(
                      (product) =>
                        String(
                          product._id
                        ) ===
                        String(
                          item.product
                        )
                    );

                  const itemTotal =
                    Number(
                      item.quantity || 0
                    ) *
                    Number(
                      item.price || 0
                    );

                  const sizes =
                    selectedProduct?.sizes ||
                    [];

                  const colours =
                    selectedProduct?.colours ||
                    [];

                  return (
                    <tr
                      key={item.id}
                    >

                      {/* PART NUMBER */}

                      <td>

                        <input
                          type="text"
                          value={
                            item.partNumber
                          }
                          readOnly
                          placeholder="Part No."
                        />

                      </td>

                      {/* PRODUCT */}

                      <td>

                        <select
                          value={
                            item.product
                          }
                          onChange={(event) =>
                            selectProduct(
                              item.id,
                              event.target
                                .value
                            )
                          }
                        >

                          <option value="">
                            {loadingProducts
                              ? "Loading..."
                              : "Select Product"}
                          </option>

                          {products.map(
                            (product) => (
                              <option
                                key={
                                  product._id
                                }
                                value={
                                  product._id
                                }
                              >
                                {
                                  product.name
                                }
                              </option>
                            )
                          )}

                        </select>

                      </td>

                      {/* SIZE */}

                      <td>

                        <select
                          value={
                            item.size
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "size",
                              event.target
                                .value
                            )
                          }
                          disabled={
                            !selectedProduct
                          }
                        >

                          <option value="">
                            Size
                          </option>

                          {sizes.map(
                            (size) => (
                              <option
                                key={size}
                                value={size}
                              >
                                {size}
                              </option>
                            )
                          )}

                        </select>

                      </td>

                      {/* COLOUR */}

                      <td>

                        <select
                          value={
                            item.colour
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "colour",
                              event.target
                                .value
                            )
                          }
                          disabled={
                            !selectedProduct
                          }
                        >

                          <option value="">
                            Colour
                          </option>

                          {colours.map(
                            (colour) => (
                              <option
                                key={
                                  colour
                                }
                                value={
                                  colour
                                }
                              >
                                {colour}
                              </option>
                            )
                          )}

                        </select>

                      </td>

                      {/* QTY */}

                      <td>

                        <input
                          type="number"
                          min="1"
                          value={
                            item.quantity
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "quantity",
                              event.target
                                .value
                            )
                          }
                        />

                      </td>

                      {/* UNIT */}

                      <td>

                        <input
                          type="text"
                          value={
                            item.unit
                          }
                          readOnly
                        />

                      </td>

                      {/* PRICE */}

                      <td>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.price
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "price",
                              event.target
                                .value
                            )
                          }
                        />

                      </td>

                      {/* TOTAL */}

                      <td className="item-total">

                        {formatCurrency(
                          itemTotal
                        )}

                      </td>

                      {/* DELETE */}

                      <td>

                        <button
                          type="button"
                          className="delete-item"
                          onClick={() =>
                            removeItem(
                              item.id
                            )
                          }
                        >
                          ×
                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

          {/* ADD ITEM */}

          <button
            type="button"
            className="add-item-button"
            onClick={addItem}
          >
            + Add Item
          </button>

        </section>

        {/* =====================================================
            CHARGES
        ===================================================== */}

        <section className="quotation-section-card">

          <div className="section-heading">

            <div className="section-number">
              03
            </div>

            <div>

              <h2>
                Quotation Charges
              </h2>

              <p>
                Review discount and packing
                charges
              </p>

            </div>

          </div>

          <div className="charges-layout">

            <div className="charge-note">

              <h3>
                Quotation Total
              </h3>

              <p>
                The final amount is
                calculated automatically
                from the products, discount
                and packing charges.
              </p>

            </div>

            <div className="totals-box">

              {/* SUBTOTAL */}

              <div className="total-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  {formatCurrency(
                    subtotal
                  )}
                </strong>

              </div>

              {/* DISCOUNT */}

              <div className="total-row">

                <span>
                  Discount
                </span>

                <div className="money-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      discount
                    }
                    onChange={(event) =>
                      setDiscount(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* PACKING */}

              <div className="total-row">

                <span>
                  Packing &amp;
                  Forwarding
                </span>

                <div className="money-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      packingAndForwarding
                    }
                    onChange={(event) =>
                      setPackingAndForwarding(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* AFTER DISCOUNT */}

              <div className="total-row after-discount">

                <span>
                  Amount After Discount
                </span>

                <strong>
                  {formatCurrency(
                    amountAfterDiscount
                  )}
                </strong>

              </div>

              {/* GRAND TOTAL */}

              <div className="grand-total">

                <span>
                  Grand Total
                </span>

                <strong>
                  {formatCurrency(
                    grandTotal
                  )}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            PAYMENT + TRANSPORT
        ===================================================== */}

        <section className="quotation-section-card">

          <div className="section-heading">

            <div className="section-number">
              04
            </div>

            <div>

              <h2>
                Payment &amp; Transport
              </h2>

              <p>
                Record the customer's
                terms
              </p>

            </div>

          </div>

          <div className="form-grid">

            {/* PAYMENT */}

            <div className="form-group">

              <label>
                Payment Method
              </label>

              <select
                value={
                  paymentMethod
                }
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Select Payment Method
                </option>

                {PAYMENT_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* TRANSPORT */}

            <div className="form-group">

              <label>
                Transport
              </label>

              <select
                value={
                  transportName
                }
                onChange={(event) =>
                  handleTransportChange(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Select Transport
                </option>

                {TRANSPORT_OPTIONS.map(
                  (transport) => (
                    <option
                      key={
                        transport.name
                      }
                      value={
                        transport.name
                      }
                    >
                      {
                        transport.name
                      }
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          {/* SELECTED TRANSPORT DETAILS */}

          {transportName && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#f6f7f9",
                fontSize: "14px",
                color: "#555",
              }}
            >
              <strong>
                Transport:
              </strong>{" "}
              {transportName}

              {transportMethod && (
                <>
                  {" "}
                  •{" "}
                  <strong>
                    Type:
                  </strong>{" "}
                  {transportMethod}
                </>
              )}
            </div>
          )}

        </section>

        {/* =====================================================
            ACTION BUTTONS
        ===================================================== */}

        <div className="quotation-actions">

          <Link
            to="/manager"
            className="cancel-button"
          >
            Cancel
          </Link>

          <button
            type="button"
            className="save-button"
            onClick={
              handleSave
            }
            disabled={
              saving
            }
          >
            {saving
              ? "Saving..."
              : "Save as Draft →"}
          </button>

        </div>

      </main>

    </div>
  );
}

export default NewQuotation;