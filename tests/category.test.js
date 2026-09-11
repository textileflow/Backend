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
let staffToken;

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

  // Create Admin
  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;

  // Create Staff
  const staffRes = await request(app).post("/api/auth/register").send({
    name: "Staff User",
    email: "staff@example.com",
    password: "password123",
    role: "staff",
  });
  staffToken = staffRes.body.data.token;
});

describe("Category Module API Tests (/api/categories)", () => {
  describe("POST /api/categories", () => {
    it("should create a category successfully when performed by Admin", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Garment Trader",
          note: "Garment related traders",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.name).toBe("Garment Trader");
      expect(res.body.data.note).toBe("Garment related traders");
      expect(res.body.data._id).toBeUndefined();
      expect(res.body.data.__v).toBeUndefined();
    });

    it("should reject creation by Staff (Forbidden 403)", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Garment Trader",
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject duplicate category name", async () => {
      await Category.create({ name: "Garment Trader" });

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Garment Trader",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe("GET /api/categories & /api/categories/:id", () => {
    let catId;

    beforeEach(async () => {
      const cat = await Category.create({
        name: "Textile Trader",
        note: "Textile items",
      });
      catId = cat.categoryId;
    });

    it("should fetch all categories for Staff user", async () => {
      const res = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Textile Trader");
      expect(res.body.data[0]._id).toBeUndefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.totalCount).toBe(1);
    });

    it("should fetch single category by numeric ID", async () => {
      const res = await request(app)
        .get(`/api/categories/${catId}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(catId);
    });

    it("should return 404 for invalid/non-existent category ID", async () => {
      const res = await request(app)
        .get(`/api/categories/9999`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("should delete category if not in use", async () => {
      const cat = await Category.create({ name: "Unused Category" });

      const res = await request(app)
        .delete(`/api/categories/${cat.categoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const check = await Category.findOne({ categoryId: cat.categoryId });
      expect(check).toBeNull();
    });

    it("should reject deletion if category is used by a SubCategory", async () => {
      const cat = await Category.create({ name: "Used Category" });
      await SubCategory.create({
        categoryId: cat.categoryId,
        name: "Ladies Wear",
      });

      const res = await request(app)
        .delete(`/api/categories/${cat.categoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/associated with sub-categories/i);
    });
  });
});
