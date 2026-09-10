const User = require("../../models/Auth/auth");
const generateToken = require("../../utils/Auth/generateToken");
const CustomError = require("../../utils/Common/customError");

class AuthService {
  /**
   * Register a new user
   */
  async registerUser({ name, email, password, role }) {
    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new CustomError("Email address is already registered", 400);
    }

    // Create user (userId is auto-generated in pre-save hook as 1, 2, 3...)
    const user = await User.create({
      name,
      email,
      password,
      role: role || "staff",
    });

    // Generate JWT using custom numeric userId
    const token = generateToken(user.userId, user.role);

    return {
      user,
      token,
    };
  }

  /**
   * Authenticate user & generate JWT
   */
  async loginUser({ email, password }) {
    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new CustomError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new CustomError("Invalid email or password", 401);
    }

    // Check isActive status
    if (!user.isActive) {
      throw new CustomError(
        "Account is deactivated. Please contact an administrator.",
        401
      );
    }

    // Generate JWT using custom numeric userId
    const token = generateToken(user.userId, user.role);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Get user profile by numeric ID or _id
   */
  async getUserProfile(id) {
    const numericId = Number(id);
    let query = {};
    if (!isNaN(numericId)) {
      query = { userId: numericId };
    } else {
      query = { _id: id };
    }

    const user = await User.findOne(query);
    if (!user) {
      throw new CustomError("User not found", 404);
    }
    if (!user.isActive) {
      throw new CustomError("Account is deactivated", 401);
    }
    return user;
  }
}

module.exports = new AuthService();
