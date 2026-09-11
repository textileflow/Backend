const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");

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

  const adminRes = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });
  adminToken = adminRes.body.data.token;
});

describe("Upload Module API Tests (/api/upload)", () => {
  describe("POST /api/upload/single", () => {
    it("should upload single file and return path starting with upload-single/", async () => {
      const dummyBuffer = Buffer.from("dummy file content for single upload");

      const res = await request(app)
        .post("/api/upload/single")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", dummyBuffer, "gst_cert.jpg");

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("path");
      expect(res.body.data).toHaveProperty("fullUrl");

      // Verify exact path format: upload-single/<filename>
      expect(res.body.data.path).toMatch(/^upload-single\//);
      expect(res.body.data.fullUrl).toMatch(/\/upload-single\//);
    });

    it("should reject single upload if no file attached", async () => {
      const res = await request(app)
        .post("/api/upload/single")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/upload/multiple", () => {
    it("should upload multiple files and return paths starting with upload-multiple/", async () => {
      const dummyBuffer1 = Buffer.from("dummy file content 1");
      const dummyBuffer2 = Buffer.from("dummy file content 2");

      const res = await request(app)
        .post("/api/upload/multiple")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("files", dummyBuffer1, "doc1.jpg")
        .attach("files", dummyBuffer2, "doc2.png");

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);

      // Verify exact path format: upload-multiple/<filename>
      expect(res.body.data[0].path).toMatch(/^upload-multiple\//);
      expect(res.body.data[0].fullUrl).toMatch(/\/upload-multiple\//);
    });
  });
});
