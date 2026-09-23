const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Design = require("../src/models/Design/design");
const DesignCosting = require("../src/models/Design/Costing/costing");
const Counter = require("../src/models/Common/counter");

let mongoServer;
let adminToken;
let designId;

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
  await Design.deleteMany({});
  await DesignCosting.deleteMany({});
  await Counter.deleteMany({});

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;

  const designRes = await request(app)
    .post("/designs")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      designName: "Floral Embroidery",
      designCode: "DES-001",
      image: "/uploads/designs/floral.png",
      stitch: 25000,
      area: 400,
      needle: 9,
      type: "Border",
      file: "/uploads/designs/DES-001.dst",
      status: "Active",
    });

  designId = designRes.body.data.id;
});

describe("Design Costing Module API Tests (/api/design-costings & /design-costings)", () => {
  describe("POST /design-costings (Create Costing)", () => {
    it("should calculate and create costing correctly matching prompt example", async () => {
      const res = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 8,
          meterConversionFactor: 400,
          headAdjustmentEnabled: true,
          headAdjustmentFactor: 1.5,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Design costing created successfully");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.designId).toBe(designId);
      expect(res.body.data.designCode).toBe("DES-001");
      expect(res.body.data.designName).toBe("Floral Embroidery");
      expect(res.body.data.stitch).toBe(25000);
      expect(res.body.data.area).toBe(400);
      expect(res.body.data.pricePer1000).toBe(8);
      expect(res.body.data.stitchCost).toBe(200);
      expect(res.body.data.meterConversionFactor).toBe(400);
      expect(res.body.data.meterValue).toBe(1);
      expect(res.body.data.meterCost).toBe(200);
      expect(res.body.data.headAdjustmentEnabled).toBe(true);
      expect(res.body.data.headAdjustmentFactor).toBe(1.5);
      expect(res.body.data.headAdjustedCost).toBe(300);
      expect(res.body.data.finalCost).toBe(300);
      expect(res.body.data.status).toBe("Active");
    });

    it("should calculate correctly when Head Adjustment is disabled", async () => {
      const res = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 8,
          meterConversionFactor: 400,
          headAdjustmentEnabled: false,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stitchCost).toBe(200);
      expect(res.body.data.meterCost).toBe(200);
      expect(res.body.data.headAdjustmentEnabled).toBe(false);
      expect(res.body.data.headAdjustmentFactor).toBe(1);
      expect(res.body.data.headAdjustedCost).toBe(200);
      expect(res.body.data.finalCost).toBe(200);
    });

    it("should reject creation if costing already exists for the design", async () => {
      await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 8,
        });

      const duplicateRes = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 10,
        });

      expect(duplicateRes.statusCode).toEqual(400);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toMatch(
        /Costing already exists for this design/i,
      );
    });

    it("should reject creation if design does not exist", async () => {
      const res = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId: 9999,
          pricePer1000: 8,
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Design not found/i);
    });

    it("should reject creation if pricePer1000 is negative", async () => {
      const res = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: -5,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toMatch(/cannot be negative/i);
    });
  });

  describe("GET /design-costings (List & Search)", () => {
    beforeEach(async () => {
      await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 8,
          meterConversionFactor: 400,
          headAdjustmentEnabled: true,
          headAdjustmentFactor: 1.5,
        });
    });

    it("should fetch list of costings", async () => {
      const res = await request(app)
        .get("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].designCode).toBe("DES-001");
    });

    it("should fetch costing by designId route GET /design-costings/design/:designId", async () => {
      const res = await request(app)
        .get(`/design-costings/design/${designId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.designId).toBe(designId);
    });
  });

  describe("PUT /design-costings/:id (Update Costing)", () => {
    it("should recalculate costing immediately when price is updated (matching prompt example)", async () => {
      const createRes = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 8,
          meterConversionFactor: 400,
          headAdjustmentEnabled: true,
          headAdjustmentFactor: 1.5,
        });

      const costingId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/design-costings/${costingId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          pricePer1000: 10,
        });

      expect(updateRes.statusCode).toEqual(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.pricePer1000).toBe(10);
      expect(updateRes.body.data.stitchCost).toBe(250);
      expect(updateRes.body.data.meterCost).toBe(250);
      expect(updateRes.body.data.headAdjustedCost).toBe(375);
      expect(updateRes.body.data.finalCost).toBe(375);
    });
  });

  describe("PATCH /design-costings/:id/status (Update Status)", () => {
    it("should update costing status to Inactive", async () => {
      const createRes = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 8,
        });

      const costingId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/design-costings/${costingId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Inactive" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Inactive");
    });
  });

  describe("DELETE /design-costings/:id (Delete Costing)", () => {
    it("should soft delete costing record", async () => {
      const createRes = await request(app)
        .post("/design-costings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designId,
          pricePer1000: 8,
        });

      const costingId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/design-costings/${costingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toEqual(200);

      const getRes = await request(app)
        .get(`/design-costings/${costingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getRes.statusCode).toEqual(404);

      const dbCosting = await DesignCosting.findOne({ costingId })
        .select("+isDeleted")
        .setOptions({ includeDeleted: true });

      expect(dbCosting).not.toBeNull();
      expect(dbCosting.isDeleted).toBe(true);
    });
  });
});
