const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Category = require("../src/models/Category/category");
const SubCategory = require("../src/models/SubCategory/subCategory");
const Merchant = require("../src/models/Merchant/merchant");

let mongoServer;
let adminToken;
let categoryId;
let subCategoryId;

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
  await Merchant.deleteMany({});

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;

  const cat = await Category.create({ name: "Garment Merchant" });
  categoryId = cat.categoryId;

  const subCat = await SubCategory.create({
    categoryId: cat.categoryId,
    name: "Ladies Wear",
  });
  subCategoryId = subCat.subCategoryId;
});

describe("Merchant Module API Tests (/api/merchants)", () => {
  const sampleMerchant = {
    companyName: "ABC Garments",
    personName: "John",
    mobile: "9999999999",
    email: "john@example.com",
    address: "Surat",
    paymentTerm: "30 Days",
    gstName: "ABC Garments Pvt Ltd",
    panCard: "ABCDE1234F",
    note: "Regular job work customer",
  };

  describe("POST /api/merchants", () => {
    it("should create merchant successfully when subCategoryId belongs to categoryId", async () => {
      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId,
          subCategoryId,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Merchant created successfully");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.companyName).toBe("ABC Garments");
      expect(res.body.data.category.id).toBe(categoryId);
      expect(res.body.data.subCategory.id).toBe(subCategoryId);
      expect(res.body.data._id).toBeUndefined();
      expect(res.body.data.__v).toBeUndefined();
    });

    it("should REJECT merchant creation if subCategoryId belongs to a DIFFERENT categoryId", async () => {
      // Create second category and second subcategory under cat2
      const cat2 = await Category.create({ name: "Home Textile" });
      const subCat2 = await SubCategory.create({
        categoryId: cat2.categoryId,
        name: "Curtains",
      });

      // Mismatch: Sending categoryId (Garment Merchant) with subCat2.subCategoryId (Curtains)
      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId, // Garment Merchant
          subCategoryId: subCat2.subCategoryId, // Curtains (under Home Textile)
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        "Sub category does not belong to selected category"
      );
    });
  });

  describe("GET /api/merchants (List & Search)", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          companyName: "ABC Garments",
          personName: "John",
          mobile: "9876543210",
          categoryId,
          subCategoryId,
        });

      await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          companyName: "XYZ Textiles",
          personName: "Mike",
          mobile: "9123456789",
          categoryId,
          subCategoryId,
        });
    });

    it("should fetch all merchants populated with category and subCategory info", async () => {
      const res = await request(app)
        .get("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toHaveProperty("category");
      expect(res.body.data[0]).toHaveProperty("subCategory");
      expect(res.body.data[0]._id).toBeUndefined();
    });

    it("should filter merchants using search query parameter", async () => {
      const res = await request(app)
        .get("/api/merchants?search=XYZ")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].companyName).toBe("XYZ Textiles");
    });
  });
});
