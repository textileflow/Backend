const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Material = require("../src/models/Material/material");
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
  await Material.deleteMany({});
  await Counter.deleteMany({});

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;

  const staffRes = await request(app).post("/api/auth/register").send({
    name: "Staff User",
    email: "staff@example.com",
    password: "password123",
    role: "staff",
  });
  staffToken = staffRes.body.data.token;
});

describe("Material Master API Tests (/api/materials)", () => {
  it("should create THREAD material record successfully", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        materialName: "Rayon 120D Gold",
        materialType: "Thread",
        threadType: "Rayon",
        brand: "Madera",
        color: "Gold",
        colorCode: "#FFD700",
        countSize: "120D/2",
        unit: "Cone",
        rate: 15.5,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.materialCode).toMatch(/^TH-\d{5}$/);
    expect(res.body.data.materialName).toBe("Rayon 120D Gold");
  });

  it("should create FABRIC material record successfully", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        materialName: "Georgette 60\"",
        materialType: "Fabric",
        fabricType: "Georgette",
        composition: "100% Polyester",
        gsm: 60,
        widthInch: 60,
        unit: "Meter",
        rate: 85.0,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.materialCode).toMatch(/^FB-\d{5}$/);
    expect(res.body.data.fabricType).toBe("Georgette");
  });

  it("should fetch paginated list of materials", async () => {
    await Material.create({ materialName: "Rayon Thread", materialType: "Thread" });
    await Material.create({ materialName: "Silk Fabric", materialType: "Fabric" });

    const res = await request(app)
      .get("/api/materials")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination).toBeDefined();
  });
});
