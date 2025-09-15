const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/ProductModel");
const Category = require("../models/CategoryModel");

const router = express.Router();

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "public/images/product_images";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * ➕ Add Product
 */
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, stock, status, ml, discount, category } = req.body;

    // Validation
    if (!name || !price || !stock || !category) {
      return res.status(400).json({ error: "Name, price, stock, and category are required" });
    }

    // Check if category exists and is active
    const categoryExists = await Category.findOne({ 
      _id: category, 
      categoryStatus: "Active" 
    });
    
    if (!categoryExists) {
      return res.status(400).json({ error: "Invalid or inactive category" });
    }

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ error: "Product with this name already exists" });
    }

    // Create new product
    const newProduct = new Product({
      name,
      description: description || "",
      price: parseFloat(price),
      stock: parseInt(stock),
      status: status || "active",
      ml: ml || "",
      discount: discount ? parseInt(discount) : 0,
      category,
      image: req.file ? req.file.filename : "",
    });

    await newProduct.save();
    
    // Populate category details in response
    await newProduct.populate("category");

    res.status(201).json({ 
      message: "Product added successfully", 
      product: newProduct 
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * 📥 Get All Products
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✏️ Update Product
 */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, stock, status, ml, discount, category } = req.body;
    
    // Find the product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if category exists and is active if being updated
    if (category) {
      const categoryExists = await Category.findOne({ 
        _id: category, 
        categoryStatus: "Active" 
      });
      
      if (!categoryExists) {
        return res.status(400).json({ error: "Invalid or inactive category" });
      }
    }

    // Check if another product with the same name exists
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({ error: "Another product with this name already exists" });
      }
    }

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ? parseFloat(price) : product.price;
    product.stock = stock ? parseInt(stock) : product.stock;
    product.status = status || product.status;
    product.ml = ml || product.ml;
    product.discount = discount ? parseInt(discount) : product.discount;
    product.category = category || product.category;
    
    // Update image if provided
    if (req.file) {
      // Delete old image if it exists
      if (product.image) {
        const oldImagePath = path.join("public/images/product_images", product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = req.file.filename;
    }

    await product.save();
    await product.populate("category");

    res.status(200).json({ 
      message: "Product updated successfully", 
      product 
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * ❌ Delete Product
 */
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete associated image
    if (product.image) {
      const imagePath = path.join("public/images/product_images", product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * 🔍 Get Product by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;