const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Vendor = require("../src/models/Purchase/Vendor/vendor");
const ThreadBrand = require("../src/models/Material/threadBrand");
const ThreadCatalog = require("../src/models/Material/threadCatalog");
const ThreadShade = require("../src/models/Material/threadShade");
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
  await Vendor.deleteMany({});
  await ThreadBrand.deleteMany({});
  await ThreadCatalog.deleteMany({});
  await ThreadShade.deleteMany({});
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

describe("Thread Catalog Chain API Tests (Vendor -> Brand -> Catalog -> Shade)", () => {
  it("should create complete Vendor to Thread Shade Catalog hierarchy", async () => {
    // 1. Create Vendor
    const vendorRes = await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Royal Embroidery",
        personName: "Rajesh Kumar",
        mobile: "9876543210",
        paymentTerm: "30 Days",
      });

    expect(vendorRes.statusCode).toEqual(201);
    const vendorId = vendorRes.body.data.id;
    expect(vendorRes.body.data.vendorCode).toBe("VEN-0001");

    // 2. Create Thread Brand
    const brandRes = await request(app)
      .post("/api/thread-brands")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        brandName: "Royal Embroidery",
        vendorId,
      });

    expect(brandRes.statusCode).toEqual(201);
    const brandId = brandRes.body.data.id;
    expect(brandRes.body.data.brandCode).toBe("BRD-0001");

    // 3. Create Thread Catalog
    const catalogRes = await request(app)
      .post("/api/thread-catalogs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        catalogName: "Royal Rayon Embroidery",
        brandId,
        threadType: "Rayon",
        threadSize: "120D",
      });

    expect(catalogRes.statusCode).toEqual(201);
    const catalogId = catalogRes.body.data.id;
    expect(catalogRes.body.data.catalogCode).toBe("CAT-0001");

    // 4. Create Individual Thread Shade (e.g. Shade 125 Maroon)
    const shadeRes = await request(app)
      .post("/api/thread-shades")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        shadeCode: "125",
        shadeName: "Maroon",
        catalogId,
        colorFamily: "Red",
        colorHex: "#800000",
      });

    expect(shadeRes.statusCode).toEqual(201);
    expect(shadeRes.body.data.shadeCode).toBe("125");
    expect(shadeRes.body.data.catalog.catalogName).toBe("Royal Rayon Embroidery");
  });

  it("should support bulk shade upload for a Catalog (Image shade card items)", async () => {
    const catalogRes = await request(app)
      .post("/api/thread-catalogs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        catalogName: "Royal Metallic Series",
        threadType: "Metallic",
      });

    const catalogId = catalogRes.body.data.id;

    const bulkRes = await request(app)
      .post("/api/thread-shades/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        catalogId,
        shades: [
          { shadeCode: "76", shadeName: "Dark Green", colorFamily: "Green" },
          { shadeCode: "78.L", shadeName: "Light Olive", colorFamily: "Green" },
          { shadeCode: "90.NL", shadeName: "Neon Lime", colorFamily: "Green" },
          { shadeCode: "111", shadeName: "Sky Blue", colorFamily: "Blue" },
          { shadeCode: "301", shadeName: "Pure Gold", colorFamily: "Gold" },
          { shadeCode: "302", shadeName: "Antique Gold", colorFamily: "Gold" },
        ],
      });

    expect(bulkRes.statusCode).toEqual(201);
    expect(bulkRes.body.success).toBe(true);
    expect(bulkRes.body.data.length).toBe(6);
    expect(bulkRes.body.data[0].shadeCode).toBe("76");
    expect(bulkRes.body.data[4].shadeCode).toBe("301");
  });
});
