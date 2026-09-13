const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Unit = require("../src/models/Master/unit");
const MachineType = require("../src/models/Master/machineType");
const Thread = require("../src/models/Material/thread");
const Fabric = require("../src/models/Material/fabric");
const Machine = require("../src/models/Machine/machine");
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
  await Unit.deleteMany({});
  await MachineType.deleteMany({});
  await Thread.deleteMany({});
  await Fabric.deleteMany({});
  await Machine.deleteMany({});
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

describe("Master Pipeline Phase 1 Tests (/api/units, /api/machine-types, /api/threads, /api/fabrics)", () => {
  it("should create Unit Master record", async () => {
    const res = await request(app)
      .post("/api/units")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        unitName: "Meter",
        symbol: "m",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unitCode).toBe("UNT-001");
  });

  it("should create MachineType Master record", async () => {
    const res = await request(app)
      .post("/api/machine-types")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Multi Head",
        description: "Standard Multi Head Embroidery Machine",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe("MT-001");
  });

  it("should create Thread Master record linked to Unit", async () => {
    const unitRes = await request(app)
      .post("/api/units")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ unitName: "Meter", symbol: "m" });

    const unitId = unitRes.body.data.id;

    const res = await request(app)
      .post("/api/threads")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        threadName: "Rayon 120D",
        threadType: "Rayon",
        brand: "XYZ",
        colorName: "Golden",
        colorCode: "GD-001",
        threadSize: "120D",
        unitId,
        rate: 0.85,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.threadCode).toBe("TH-0001");
    expect(res.body.data.unit.unitName).toBe("Meter");
  });

  it("should create Fabric Master record linked to Unit", async () => {
    const unitRes = await request(app)
      .post("/api/units")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ unitName: "Meter", symbol: "m" });

    const unitId = unitRes.body.data.id;

    const res = await request(app)
      .post("/api/fabrics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fabricName: "Georgette",
        fabricType: "Woven",
        composition: "Polyester",
        gsm: 80,
        width: "44 inch",
        unitId,
        rate: 65.0,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fabricCode).toBe("FAB-0001");
    expect(res.body.data.unit.unitName).toBe("Meter");
  });
});
