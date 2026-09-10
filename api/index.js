const dotenv = require("dotenv");
dotenv.config();

const app = require("../src/app");
const connectDB = require("../src/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection failed on serverless invocation:", err);
  }
  return app(req, res);
};
