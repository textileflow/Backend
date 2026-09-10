const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/Auth/auth");
const categoryRoutes = require("./routes/Category/category");
const subCategoryRoutes = require("./routes/SubCategory/subCategory");
const traderRoutes = require("./routes/Trader/trader");
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

// 4. Request logging (skip during tests)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// 5. Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Embroidery ERP API is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

// 6. Mount Module Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/traders", traderRoutes);

// 7. Handle 404 routes
app.use(notFoundHandler);

// 8. Centralized error handling
app.use(errorHandler);

module.exports = app;
