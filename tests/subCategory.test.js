const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Category = require("../src/models/Category/category");
const SubCategory = require("../src/models/SubCategory/subCategory");
const Trader = require("../src/models/Trader/trader");

let mongoServer;
let adminToken;
let categoryId;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret_key_12345";
  process.env.JWT_EXPIRES_IN = "1d";
  process.env.NODE_ENV = "test";

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
  await SubCategory.deleteMany({});
  await Trader.deleteMany({});

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;

  const cat = await Category.create({ name: "Garment Trader" });
  categoryId = cat._id.toString();
});

describe("SubCategory Module API Tests (/api/subcategories)", () => {
  describe("POST /api/subcategories", () => {
    it("should create sub-category successfully under existing category", async () => {
      const res = await request(app)
        .post("/api/subcategories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          categoryId,
          name: "Ladies Wear",
          note: "Ladies garment traders",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Ladies Wear");
      expect(res.body.data.categoryId).toHaveProperty("_id", categoryId);
    });

    it("should reject duplicate sub-category name under same category", async () => {
      await SubCategory.create({ categoryId, name: "Ladies Wear" });

      const res = await request(app)
        .post("/api/subcategories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          categoryId,
          name: "Ladies Wear",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject sub-category creation for non-existent category ID", async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post("/api/subcategories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          categoryId: fakeCatId,
          name: "Mens Wear",
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/subcategories/category/:categoryId", () => {
    it("should fetch all sub-categories belonging to a specific category", async () => {
      await SubCategory.create({ categoryId, name: "Ladies Wear" });
      await SubCategory.create({ categoryId, name: "Kids Wear" });

      const cat2 = await Category.create({ name: "Home Textile" });
      await SubCategory.create({ categoryId: cat2._id, name: "Curtains" });

      const res = await request(app)
        .get(`/api/subcategories/category/${categoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe("DELETE /api/subcategories/:id", () => {
    it("should delete sub-category if not in use by a Trader", async () => {
      const subCat = await SubCategory.create({ categoryId, name: "Unused Sub" });

      const res = await request(app)
        .delete(`/api/subcategories/${subCat._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject deletion if sub-category is used by a Trader", async () => {
      const subCat = await SubCategory.create({ categoryId, name: "Used Sub" });

      await Trader.create({
        companyName: "ABC Garments",
        personName: "John",
        mobile: "9999999999",
        categoryId,
        subCategoryId: subCat._id,
      });

      const res = await request(app)
        .delete(`/api/subcategories/${subCat._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/associated with traders/i);
    });
  });
});
