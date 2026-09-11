const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Category = require("../src/models/Merchant/Category/category");
const SubCategory = require("../src/models/Merchant/SubCategory/subCategory");
const Merchant = require("../src/models/Merchant/merchant");

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

const Counter = require("../src/models/Common/counter");

beforeEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
  await SubCategory.deleteMany({});
  await Merchant.deleteMany({});
  await Counter.deleteMany({});

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;

  const cat = await Category.create({ name: "Garment Trader" });
  categoryId = cat.categoryId;
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
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.name).toBe("Ladies Wear");
      expect(res.body.data.category).toHaveProperty("id", categoryId);
      expect(res.body.data._id).toBeUndefined();
      expect(res.body.data.__v).toBeUndefined();
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
      const res = await request(app)
        .post("/api/subcategories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          categoryId: 9999,
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
      await SubCategory.create({ categoryId: cat2.categoryId, name: "Curtains" });

      const res = await request(app)
        .get(`/api/subcategories/category/${categoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]._id).toBeUndefined();
    });
  });

  describe("DELETE /api/subcategories/:id", () => {
    it("should delete sub-category if not in use by a Merchant", async () => {
      const subCat = await SubCategory.create({ categoryId, name: "Unused Sub" });

      const res = await request(app)
        .delete(`/api/subcategories/${subCat.subCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject deletion if sub-category is used by a Merchant", async () => {
      const subCat = await SubCategory.create({ categoryId, name: "Used Sub" });

      await Merchant.create({
        companyName: "ABC Garments",
        personName: "John",
        mobile: "9999999999",
        categoryId,
        subCategoryId: subCat.subCategoryId,
      });

      const res = await request(app)
        .delete(`/api/subcategories/${subCat.subCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/associated with merchants/i);
    });
  });
});
