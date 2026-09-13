const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const VendorType = require("../src/models/Purchase/Vendor/Vendor-type/vendor-type");
const Vendor = require("../src/models/Purchase/Vendor/vendor");
const Counter = require("../src/models/Common/counter");

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

beforeEach(async () => {
  await User.deleteMany({});
  await VendorType.deleteMany({});
  await Vendor.deleteMany({});
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

describe("VendorType Module API Tests (/api/vendor-types & /api/purchase/vendor-types)", () => {
  describe("POST /api/vendor-types", () => {
    it("should create a vendor type successfully when performed by Admin", async () => {
      const res = await request(app)
        .post("/api/vendor-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Yarn Supplier",
          note: "Supplies raw cotton yarn",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.name).toBe("Yarn Supplier");
      expect(res.body.data.note).toBe("Supplies raw cotton yarn");
      expect(res.body.data.status).toBe("Active");
      expect(res.body.data._id).toBeUndefined();
      expect(res.body.data.__v).toBeUndefined();
    });

    it("should create a vendor type via /api/purchase/vendors/vendor-type", async () => {
      const res = await request(app)
        .post("/api/purchase/vendors/vendor-type")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Fabric Manufacturer",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Fabric Manufacturer");
    });

    it("should reject creation by Staff (Forbidden 403)", async () => {
      const res = await request(app)
        .post("/api/vendor-types")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Yarn Supplier",
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject duplicate vendor type name", async () => {
      await VendorType.create({ name: "Yarn Supplier" });

      const res = await request(app)
        .post("/api/vendor-types")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Yarn Supplier",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe("GET /api/vendor-types & /api/vendor-types/:id", () => {
    let typeId;

    beforeEach(async () => {
      const vt = await VendorType.create({
        name: "Dyeing Unit",
        note: "Provides fabric dyeing services",
      });
      typeId = vt.vendorTypeId;
    });

    it("should fetch all vendor types for Staff user", async () => {
      const res = await request(app)
        .get("/api/vendor-types")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Dyeing Unit");
      expect(res.body.data[0]._id).toBeUndefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.totalCount).toBe(1);
    });

    it("should fetch single vendor type by numeric ID", async () => {
      const res = await request(app)
        .get(`/api/vendor-types/${typeId}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(typeId);
      expect(res.body.data.name).toBe("Dyeing Unit");
    });

    it("should return 404 for invalid/non-existent vendor type ID", async () => {
      const res = await request(app)
        .get(`/api/vendor-types/9999`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/vendor-types/:id", () => {
    it("should update vendor type details", async () => {
      const vt = await VendorType.create({ name: "Old Type", note: "Old note" });

      const res = await request(app)
        .put(`/api/vendor-types/${vt.vendorTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Type", note: "New note" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated Type");
      expect(res.body.data.note).toBe("New note");
    });
  });

  describe("PATCH /api/vendor-types/:id/status", () => {
    it("should update vendor type status (Active/Inactive)", async () => {
      const vt = await VendorType.create({ name: "Status Type" });

      const res = await request(app)
        .patch(`/api/vendor-types/${vt.vendorTypeId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Inactive" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Inactive");
    });
  });

  describe("DELETE /api/vendor-types/:id", () => {
    it("should soft delete vendor type if not in use", async () => {
      const vt = await VendorType.create({ name: "Unused Type" });

      const res = await request(app)
        .delete(`/api/vendor-types/${vt.vendorTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const getRes = await request(app)
        .get(`/api/vendor-types/${vt.vendorTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(getRes.statusCode).toEqual(404);

      const dbVendorType = await VendorType.findOne({ vendorTypeId: vt.vendorTypeId })
        .select("+isDeleted")
        .setOptions({ includeDeleted: true });
      expect(dbVendorType).not.toBeNull();
      expect(dbVendorType.isDeleted).toBe(true);
    });
  });
});
