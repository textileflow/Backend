const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Category = require("../src/models/Merchant/Category/category");
const SubCategory = require("../src/models/Merchant/SubCategory/subCategory");
const Merchant = require("../src/models/Merchant/merchant");
const Counter = require("../src/models/Common/counter");

let mongoServer;
let adminToken;
let categoryId;
let subCategoryId;
let subCategoryId2;

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
  await Counter.deleteMany({});

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;

  const cat = await Category.create({ name: "Garment Merchant" });
  categoryId = cat.categoryId;

  const subCat1 = await SubCategory.create({
    categoryId: cat.categoryId,
    name: "Ladies Wear",
  });
  subCategoryId = subCat1.subCategoryId;

  const subCat2 = await SubCategory.create({
    categoryId: cat.categoryId,
    name: "Gowns",
  });
  subCategoryId2 = subCat2.subCategoryId;
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
    gstNumber: "24ABCDE1234F1Z5",
    panCard: "ABCDE1234F",
    note: "Regular job work customer",
  };

  describe("POST /api/merchants", () => {
    it("should create merchant successfully with SINGLE subCategoryId & valid PAN / GST", async () => {
      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId,
          subCategoryId,
          gstCertificate: "upload-single/sample123.jpg",
          panCardImage: "upload-single/sample456.jpg",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Merchant created successfully");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.companyName).toBe("ABC Garments");
      expect(res.body.data.category.id).toBe(categoryId);
      expect(res.body.data.subCategory.id).toBe(subCategoryId);
    });

    it("should create merchant successfully with MULTIPLE subCategoryIds [1, 2]", async () => {
      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId,
          subCategoryId: [subCategoryId, subCategoryId2],
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.subCategory)).toBe(true);
      expect(res.body.data.subCategory.length).toBe(2);
    });

    it("should REJECT merchant creation if invalid PAN Card format", async () => {
      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId,
          subCategoryId,
          panCard: "INVALID1234",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toMatch(/Invalid PAN Card format/i);
    });

    it("should REJECT merchant creation if invalid GST Number format", async () => {
      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId,
          subCategoryId,
          gstNumber: "INVALIDGST123",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toMatch(/Invalid GST Number format/i);
    });

    it("should REJECT merchant creation if subCategoryId belongs to a DIFFERENT categoryId", async () => {
      const cat2 = await Category.create({ name: "Home Textile" });
      const subCat2 = await SubCategory.create({
        categoryId: cat2.categoryId,
        name: "Curtains",
      });

      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId: categoryId,
          subCategoryId: subCat2.subCategoryId,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        /Sub category does not belong to selected category/i
      );
    });

    it("should REJECT merchant creation if Category is Inactive", async () => {
      const inactiveCat = await Category.create({ name: "Inactive Textile", status: "Inactive" });
      const sub = await SubCategory.create({ categoryId: inactiveCat.categoryId, name: "Sub Inactive" });

      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId: inactiveCat.categoryId,
          subCategoryId: sub.subCategoryId,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inactive Category/i);
    });

    it("should REJECT merchant creation if any SubCategory is Inactive", async () => {
      const inactiveSub = await SubCategory.create({
        categoryId,
        name: "Inactive Sub",
        status: "Inactive",
      });

      const res = await request(app)
        .post("/api/merchants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleMerchant,
          categoryId,
          subCategoryId: inactiveSub.subCategoryId,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inactive Sub Category/i);
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
          subCategoryId: [subCategoryId, subCategoryId2],
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
      expect(res.body.pagination).toBeDefined();
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

    it("should update merchant status to Active or Inactive", async () => {
      const patchRes = await request(app)
        .patch("/api/merchants/1/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Inactive" });

      expect(patchRes.statusCode).toEqual(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.status).toBe("Inactive");
    });

    it("should soft delete merchant and exclude it from GET requests while keeping record in database", async () => {
      const deleteRes = await request(app)
        .delete("/api/merchants/1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body.data).toBeUndefined();

      const getRes = await request(app)
        .get("/api/merchants/1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getRes.statusCode).toEqual(404);

      const dbMerchant = await Merchant.findOne({ merchantId: 1 })
        .select("+isDeleted")
        .setOptions({ includeDeleted: true });
      expect(dbMerchant).not.toBeNull();
      expect(dbMerchant.isDeleted).toBe(true);
    });
  });
});
