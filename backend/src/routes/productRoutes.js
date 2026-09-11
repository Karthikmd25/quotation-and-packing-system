import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

/*
====================================================
GET ALL PRODUCTS
GET /api/products
====================================================
*/
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({
      active: true,
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});


/*
====================================================
SEARCH PRODUCTS
GET /api/products/search?q=karate
====================================================
*/
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.json({
        success: true,
        count: 0,
        products: [],
      });
    }

    const products = await Product.find({
      active: true,
      $or: [
        {
          name: {
            $regex: q,
            $options: "i",
          },
        },
        {
          partNumber: {
            $regex: q,
            $options: "i",
          },
        },
        {
          category: {
            $regex: q,
            $options: "i",
          },
        },
      ],
    })
      .sort({ name: 1 })
      .limit(20);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Product search error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: error.message,
    });
  }
});


/*
====================================================
GET SINGLE PRODUCT
GET /api/products/:id
====================================================
*/
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});


/*
====================================================
CREATE PRODUCT
POST /api/products
====================================================
*/
router.post("/", async (req, res) => {
  try {
    const {
      partNumber,
      name,
      category = "",
      unit = "Piece",
      sizes = [],
      colours = [],
      price = 0,
      active = true,
    } = req.body;

    if (!partNumber || !partNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Part number is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const existingProduct = await Product.findOne({
      partNumber: partNumber.trim(),
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "A product with this part number already exists",
      });
    }

    const product = await Product.create({
      partNumber: partNumber.trim(),
      name: name.trim(),
      category,
      unit,
      sizes: Array.isArray(sizes) ? sizes : [],
      colours: Array.isArray(colours) ? colours : [],
      price: Number(price) || 0,
      active,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
});


/*
====================================================
UPDATE PRODUCT
PUT /api/products/:id
====================================================
*/
router.put("/:id", async (req, res) => {
  try {
    const {
      partNumber,
      name,
      category,
      unit,
      sizes,
      colours,
      price,
      active,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (partNumber !== undefined) {
      product.partNumber = partNumber.trim();
    }

    if (name !== undefined) {
      product.name = name.trim();
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (unit !== undefined) {
      product.unit = unit;
    }

    if (sizes !== undefined) {
      product.sizes = Array.isArray(sizes) ? sizes : [];
    }

    if (colours !== undefined) {
      product.colours = Array.isArray(colours) ? colours : [];
    }

    if (price !== undefined) {
      product.price = Number(price) || 0;
    }

    if (active !== undefined) {
      product.active = Boolean(active);
    }

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
});


/*
====================================================
DELETE / DEACTIVATE PRODUCT
DELETE /api/products/:id
====================================================
*/
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
      We don't permanently delete the product.
      We deactivate it so old quotations can still
      reference the product.
    */
    product.active = false;

    await product.save();

    res.json({
      success: true,
      message: "Product deactivated successfully",
      product,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to deactivate product",
      error: error.message,
    });
  }
});


export default router;