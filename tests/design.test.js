const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Design = require("../src/models/Design/design");
const Counter = require("../src/models/Common/counter");

let mongoServer;
let adminToken;

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
  await Counter.deleteMany({});

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;
});

describe("Design Module API Tests (/api/designs & /designs)", () => {
  const sampleDesign = {
    designName: "Floral Border Design",
    designCode: "EMB-000001",
    image: "/uploads/designs/floral-border.png",
    stitch: 45000,
    area: 120.5,
    needle: 9,
    type: "Border",
    file: "/uploads/designs/EMB-000001.dst",
    status: "Active",
  };

  describe("POST /designs (Create Design)", () => {
    it("should create design successfully with valid payload", async () => {
      const res = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sampleDesign);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Design created successfully");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.designName).toBe("Floral Border Design");
      expect(res.body.data.designCode).toBe("EMB-000001");
      expect(res.body.data.stitch).toBe(45000);
      expect(res.body.data.area).toBe(120.5);
      expect(res.body.data.needle).toBe(9);
      expect(res.body.data.type).toBe("Border");
      expect(res.body.data.status).toBe("Active");
    });

    it("should reject creation if designCode already exists", async () => {
      await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sampleDesign);

      const duplicateRes = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleDesign,
          designName: "Another Design",
        });

      expect(duplicateRes.statusCode).toEqual(400);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toMatch(/Design Code already exists/i);
    });

    it("should reject creation if stitch, area, or needle is negative", async () => {
      const res = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleDesign,
          designCode: "EMB-000002",
          stitch: -100,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toMatch(/cannot be negative/i);
    });

    it("should reject creation if required fields are missing", async () => {
      const res = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("should support file upload via multipart/form-data", async () => {
      const res = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("designName", "Patch Logo")
        .field("designCode", "EMB-000003")
        .field("stitch", "12000")
        .field("area", "50")
        .field("needle", "6")
        .field("type", "Logo")
        .attach("image", Buffer.from("fake image content"), "logo.png")
        .attach("file", Buffer.from("fake dst content"), "logo.dst");

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.designName).toBe("Patch Logo");
      expect(res.body.data.image).toBeDefined();
      expect(res.body.data.file).toBeDefined();
    });
  });

  describe("GET /designs (List & Search)", () => {
    beforeEach(async () => {
      await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sampleDesign);

      await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleDesign,
          designName: "All Over Floral",
          designCode: "EMB-000002",
          type: "All Over",
        });
    });

    it("should fetch all designs in descending order", async () => {
      const res = await request(app)
        .get("/designs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].id).toBe(2);
      expect(res.body.data[1].id).toBe(1);
    });

    it("should filter designs by search keyword", async () => {
      const res = await request(app)
        .get("/designs?search=EMB-000002")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].designCode).toBe("EMB-000002");
    });
  });

  describe("GET /designs/:id (Get Single)", () => {
    it("should return design details by numeric ID", async () => {
      const createRes = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sampleDesign);

      const id = createRes.body.data.id;

      const res = await request(app)
        .get(`/designs/${id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(id);
      expect(res.body.data.designName).toBe("Floral Border Design");
    });

    it("should return 404 for non-existent design ID", async () => {
      const res = await request(app)
        .get("/designs/99999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Design not found/i);
    });
  });

  describe("PUT /designs/:id (Update Design)", () => {
    it("should update design fields and keep existing file/image if not replaced", async () => {
      const createRes = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sampleDesign);

      const id = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/designs/${id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          designName: "Updated Floral Border",
          stitch: 50000,
        });

      expect(updateRes.statusCode).toEqual(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.designName).toBe("Updated Floral Border");
      expect(updateRes.body.data.stitch).toBe(50000);
      expect(updateRes.body.data.image).toBe(sampleDesign.image);
      expect(updateRes.body.data.file).toBe(sampleDesign.file);
    });
  });

  describe("PATCH /designs/:id/status (Update Status)", () => {
    it("should update design status to Inactive", async () => {
      const createRes = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sampleDesign);

      const id = createRes.body.data.id;

      const patchRes = await request(app)
        .patch(`/designs/${id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Inactive" });

      expect(patchRes.statusCode).toEqual(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.message).toBe("Design status updated successfully");
      expect(patchRes.body.data.id).toBe(id);
      expect(patchRes.body.data.status).toBe("Inactive");
    });
  });

  describe("DELETE /designs/:id (Delete Design)", () => {
    it("should soft delete design and exclude it from GET listing", async () => {
      const createRes = await request(app)
        .post("/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sampleDesign);

      const id = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/designs/${id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body.success).toBe(true);

      const getRes = await request(app)
        .get(`/designs/${id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getRes.statusCode).toEqual(404);

      const dbDesign = await Design.findOne({ designId: id })
        .select("+isDeleted")
        .setOptions({ includeDeleted: true });

      expect(dbDesign).not.toBeNull();
      expect(dbDesign.isDeleted).toBe(true);
    });
  });
});
