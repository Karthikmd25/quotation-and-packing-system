import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();


// ========================================
// GET CUSTOMERS
// Search by name or phone
// ========================================

router.get("/", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    let customers;

    if (search) {
      customers = await Customer.find({
        active: true,
        $or: [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      })
        .sort({ name: 1 })
        .limit(20);
    } else {
      customers = await Customer.find({
        active: true,
      })
        .sort({ name: 1 })
        .limit(20);
    }

    res.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Customer search error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search customers",
      error: error.message,
    });
  }
});


// ========================================
// GET SINGLE CUSTOMER
// ========================================

router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customer",
      error: error.message,
    });
  }
});


// ========================================
// ADD NEW CUSTOMER
// ========================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
    } = req.body;

    // Name required
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    // Phone duplicate check
    if (phone && phone.trim()) {
      const existingCustomer =
        await Customer.findOne({
          phone: phone.trim(),
          active: true,
        });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "A customer with this phone number already exists",
          customer: existingCustomer,
        });
      }
    }

    const customer =
      await Customer.create({
        name: name.trim(),
        phone: phone?.trim() || "",
        email: email?.trim() || "",
        address: address?.trim() || "",
        city: city?.trim() || "",
        state: state?.trim() || "",
        pincode: pincode?.trim() || "",
        active: true,
      });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
});


// ========================================
// UPDATE CUSTOMER
// ========================================

router.put("/:id", async (req, res) => {
  try {
    const customer =
      await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
});


// ========================================
// DELETE / DEACTIVATE CUSTOMER
// ========================================

router.delete("/:id", async (req, res) => {
  try {
    const customer =
      await Customer.findByIdAndUpdate(
        req.params.id,
        {
          active: false,
        },
        {
          new: true,
        }
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer deactivated successfully",
      customer,
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to deactivate customer",
      error: error.message,
    });
  }
});


export default router;