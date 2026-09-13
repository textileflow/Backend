const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Vendor = require("../src/models/Purchase/Vendor/vendor");
const ThreadBrand = require("../src/models/Material/threadBrand");
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

describe("Vendor Master API Comprehensive Tests (/api/purchase/vendors)", () => {
  it("should create Vendor record with valid Mobile, Email, GST, and PAN", async () => {
    const res = await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("companyName", "Royal Embroidery Threads")
      .field("personName", "Rajesh Patel")
      .field("mobile", "9876543210")
      .field("email", "rajesh@royalthreads.com")
      .field("gstNo", "24ABCDE1234F1Z5")
      .field("panNo", "ABCDE1234F")
      .field("paymentTerm", "30 Days")
      .field("address", "Ring Road, Surat, Gujarat");

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vendorCode).toBe("VEN-0001");
    expect(res.body.data.companyName).toBe("Royal Embroidery Threads");
    expect(res.body.data.mobile).toBe("9876543210");
  });

  it("should reject creation when required fields or Mobile format are invalid", async () => {
    const res = await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "",
        personName: "Rajesh",
        mobile: "12345", // Invalid Indian mobile
        paymentTerm: "30 Days",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it("should support numeric paymentTerm (e.g. 30) and omit paymentDays & paymentTerms from response JSON", async () => {
    const passRes = await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Surat Yarn Co",
        personName: "Suresh",
        mobile: "9123456789",
        paymentTerm: 30,
      });

    expect(passRes.statusCode).toEqual(201);
    expect(passRes.body.data.paymentTerm).toBe("30 Days");
    expect(passRes.body.data.paymentDays).toBeUndefined();
    expect(passRes.body.data.paymentTerms).toBeUndefined();
  });

  it("should support search by Company Name, Person Name, Mobile & GST Number", async () => {
    await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Royal Threads",
        personName: "Rajesh Patel",
        mobile: "9876543210",
        gstNo: "24ABCDE1234F1Z5",
        paymentTerm: "15 Days",
      });

    await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Vardhman Yarns",
        personName: "Anil Kumar",
        mobile: "9111122222",
        paymentTerm: "30 Days",
      });

    const searchRes = await request(app)
      .get("/api/purchase/vendors?search=Royal")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(searchRes.statusCode).toEqual(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].companyName).toBe("Royal Threads");

    const filterRes = await request(app)
      .get("/api/purchase/vendors?paymentTerm=30 Days")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(filterRes.statusCode).toEqual(200);
    expect(filterRes.body.data.length).toBe(1);
    expect(filterRes.body.data[0].companyName).toBe("Vardhman Yarns");

    const statusRes = await request(app)
      .get("/api/purchase/vendors?status=active")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(statusRes.statusCode).toEqual(200);
    expect(statusRes.body.data.length).toBe(2);
  });

  it("should update Vendor information successfully", async () => {
    const createRes = await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Old Supplier",
        personName: "Old Person",
        mobile: "9999988888",
        paymentTerm: "Immediate",
      });

    const vendorId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/purchase/vendors/${vendorId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Updated Supplier",
        personName: "Updated Person",
        mobile: "9999988888",
        paymentTerm: "30 Days",
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.data.companyName).toBe("Updated Supplier");
  });

  it("should update Vendor status (Active/Inactive)", async () => {
    const createRes = await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Status Test Vendor",
        personName: "Status Person",
        mobile: "9988776655",
        paymentTerm: "30 Days",
      });

    const vendorId = createRes.body.data.id;

    const patchRes = await request(app)
      .patch(`/api/purchase/vendors/${vendorId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Inactive" });

    expect(patchRes.statusCode).toEqual(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.status).toBe("Inactive");
  });

  it("should prevent deletion when Vendor is referenced by Thread Brands", async () => {
    const createRes = await request(app)
      .post("/api/purchase/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        companyName: "Referenced Vendor",
        personName: "Referenced Person",
        mobile: "9888877777",
        paymentTerm: "30 Days",
      });

    const vendorId = createRes.body.data.id;

    // Link a Thread Brand to this Vendor
    await ThreadBrand.create({
      brandName: "Royal Brand",
      vendorId: vendorId,
    });

    const deleteRes = await request(app)
      .delete(`/api/purchase/vendors/${vendorId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.statusCode).toEqual(400);
    expect(deleteRes.body.message).toMatch(/referenced/i);

    const checkVendor = await Vendor.findOne({ vendorId })
      .select("+isDeleted")
      .setOptions({ includeDeleted: true });
    expect(checkVendor.status).toBe("Inactive");
    expect(checkVendor.isDeleted).toBe(true);

    const getRes = await request(app)
      .get(`/api/purchase/vendors/${vendorId}`)
      .set("Authorization", `Bearer ${staffToken}`);
    expect(getRes.statusCode).toEqual(404);
  });
});
