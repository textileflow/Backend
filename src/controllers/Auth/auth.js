const authService = require("../../services/Auth/auth");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * Helper to safely extract clean JSON object from user document
 */
const formatUser = (user) => {
  if (!user) return {};
  return typeof user.toJSON === "function" ? user.toJSON() : user;
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.registerUser({
      name,
      email,
      password,
      role,
    });

    return sendSuccess(res, 201, "User registered successfully", {
      ...formatUser(result.user),
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return sendSuccess(res, 200, "Login successful", {
      ...formatUser(result.user),
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile by ID (from params) or logged-in user profile
 * @route   GET /api/auth/profile/:id or GET /api/auth/profile
 * @access  Private (Protected - Token Required)
 */
const profile = async (req, res, next) => {
  try {
    const targetId = req.params.id || (req.user && req.user.userId) || (req.user && req.user.id);
    const user = await authService.getUserProfile(targetId);

    return sendSuccess(
      res,
      200,
      "User profile retrieved successfully",
      formatUser(user)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear token response
 * @route   POST /api/auth/logout
 * @access  Private (Protected - Token Required)
 */
const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  profile,
};
