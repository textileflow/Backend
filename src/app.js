const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/Auth/auth");
const categoryRoutes = require("./routes/Merchant/Category/category");
const subCategoryRoutes = require("./routes/Merchant/SubCategory/subCategory");
const merchantRoutes = require("./routes/Merchant/merchant");
const vendorRoutes = require("./routes/Purchase/Vendor/vendor");
const vendorTypeRoutes = require("./routes/Purchase/Vendor/Vendor-type/vendor-type");
const purchaseOrderRoutes = require("./routes/Purchase/Purchase-order/purchase-order");
const unitRoutes = require("./routes/Master/unit");
const machineTypeRoutes = require("./routes/Master/machineType");
const threadBrandRoutes = require("./routes/Material/threadBrand");
const threadCatalogRoutes = require("./routes/Material/threadCatalog");
const threadShadeRoutes = require("./routes/Material/threadShade");
const threadRoutes = require("./routes/Material/thread");
const fabricRoutes = require("./routes/Material/fabric");
const materialRoutes = require("./routes/Material/material");
const machineRoutes = require("./routes/Machine/machine");
const designRoutes = require("./routes/Design/design");
const uploadRoutes = require("./routes/Upload/upload");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/Common/error");

const app = express();

// 1. Security HTTP headers
app.use(helmet());

// 2. CORS configuration
app.use(cors());

// 3. Request body limit & JSON parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

const connectDB = require("./config/db");

// 4. Request logging (skip during tests)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// 5. Database connection middleware for Serverless (Vercel)
app.use(async (req, res, next) => {
  if (req.path === "/api/health" || process.env.NODE_ENV === "test") {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Database Connection Error: ${error.message}`,
    });
  }
});

// 6. Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Embroidery ERP API is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

// 7. Mount Module Routes
app.use("/api/auth", authRoutes);
app.use("/api/merchants/categories", categoryRoutes);
app.use("/api/merchants/subcategories", subCategoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/purchase/vendors/vendor-type", vendorTypeRoutes);
app.use("/api/purchase/vendors/vendor-types", vendorTypeRoutes);
app.use("/api/purchase/vendor-types", vendorTypeRoutes);
app.use("/api/vendor-types", vendorTypeRoutes);
app.use("/api/purchase/vendors", vendorRoutes);
app.use("/api/purchase/orders", purchaseOrderRoutes);
app.use("/api/purchase/purchase-orders", purchaseOrderRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/machine-types", machineTypeRoutes);
app.use("/api/thread-brands", threadBrandRoutes);
app.use("/api/thread-catalogs", threadCatalogRoutes);
app.use("/api/thread-shades", threadShadeRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/fabrics", fabricRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/upload", uploadRoutes);

// 8. Handle 404 routes
app.use(notFoundHandler);

// 9. Centralized error handling
app.use(errorHandler);

module.exports = app;
