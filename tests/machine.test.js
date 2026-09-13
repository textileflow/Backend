const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
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

describe("Machine Master API Tests (/api/machines)", () => {
  it("should create MACHINE record successfully", async () => {
    const res = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        machineName: "20 Head Tajima Embroidery Machine",
        machineType: "Multi Head",
        brand: "Tajima",
        model: "TMAR",
        noOfHeads: 20,
        needleCount: 9,
        maxRpm: 800,
        headSpacingMm: 400,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.machineCode).toMatch(/^(EMB-M|MACH-)\d{3,4}$/);
    expect(res.body.data.headCount).toBe(20);
  });

  it("should fetch paginated list of machines", async () => {
    await Machine.create({ machineName: "Tajima 20 Head", machineType: "Multi Head", headCount: 20 });
    await Machine.create({ machineName: "Barudan 15 Head", machineType: "Multi Head", headCount: 15 });

    const res = await request(app)
      .get("/api/machines")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination).toBeDefined();
  });
});
