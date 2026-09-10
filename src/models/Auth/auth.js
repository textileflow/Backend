const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Internal Counter schema for numeric auto-increment sequence starting from 1
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "manager", "staff"],
        message:
          "{VALUE} is not a valid role. Allowed roles: admin, manager, staff",
      },
      default: "staff",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Generate numeric userId (1, 2, 3...) & Hash password
userSchema.pre("save", async function () {
  if (this.isNew && (this.userId === undefined || this.userId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "userId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.userId = counter.seq;
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare entered password with stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform toJSON: exposes id as number (1, 2, 3...), hides _id, userId, password, __v
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  userObject.id = userObject.userId;
  delete userObject._id;
  delete userObject.userId;
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model("User", userSchema);

User.Counter = Counter;

module.exports = User;
