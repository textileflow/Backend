const jwt = require("jsonwebtoken");
const User = require("../../models/Auth/auth");
const CustomError = require("../../utils/Common/customError");

/**
 * Protect middleware: Verifies JWT & active status
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new CustomError("Access denied. Authorization token required.", 401)
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(
          new CustomError("Token has expired. Please log in again.", 401)
        );
      }
      return next(new CustomError("Invalid authorization token.", 401));
    }

    // Find user by custom numeric userId
    const currentUser = await User.findOne({ userId: decoded.id });
    if (!currentUser) {
      return next(
        new CustomError("The user belonging to this token no longer exists.", 401)
      );
    }

    if (!currentUser.isActive) {
      return next(
        new CustomError(
          "Account is deactivated. Please contact an administrator.",
          401
        )
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize roles middleware: Role-based authorization
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new CustomError("Authentication required.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError(
          `Access denied. You do not have permission to perform this action. Required role: ${roles.join(
            " or "
          )}`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
