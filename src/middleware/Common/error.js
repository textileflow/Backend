const CustomError = require("../../utils/Common/customError");

const notFoundHandler = (req, res, next) => {
  const error = new CustomError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || undefined;

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate field value entered. A record with that ${field} already exists.`;
    if (field === "email") {
      message = "Email address is already registered";
    }
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired. Please log in again.";
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    console.error("SERVER ERROR Stack:", err.stack);
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
