const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Vendor = require("../src/models/Purchase/Vendor/vendor");
const VendorType = require("../src/models/Purchase/Vendor/Vendor-type/vendor-type");
const PurchaseOrder = require("../src/models/Purchase/Purchase-order/purchase-order");
const Counter = require("../src/models/Common/counter");

let mongoServer;
let adminToken;
let staffToken;
let activeVendor;

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
  await VendorType.deleteMany({});
  await PurchaseOrder.deleteMany({});
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

  const vt = await VendorType.create({ name: "Yarn Manufacturer" });

  const vendorRes = await request(app)
    .post("/api/purchase/vendors")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      companyName: "Royal Embroidery Yarns",
      personName: "Rajesh Patel",
      mobile: "9876543210",
      vendorType: [vt.vendorTypeId],
      paymentTerm: "30 Days",
    });

  activeVendor = vendorRes.body.data;
});

describe("Purchase Order API Comprehensive Tests (/api/purchase/orders)", () => {
  it("should create Purchase Order with auto-calculated amounts & populated vendor", async () => {
    const poPayload = {
      vendorId: activeVendor.id,
      poDate: "2026-09-15",
      dueDate: "2026-09-30",
      expDeliveryDate: "2026-09-25",
      discountType: "Percentage",
      discountValue: 10, // 10%
      gstRate: 18, // 18%
      shippingCharge: 100,
      status: "Pending",
      notes: "Urgent shipment required",
      termsAndConditions: "Payment within 30 days of delivery",
      items: [
        {
          materialType: "Thread",
          name: "Rayon Thread 120D",
          color: "Royal Blue",
          qty: 50,
          unit: "CONES",
          rate: 100, // Amount = 5000
        },
        {
          materialType: "Fabric",
          name: "Cotton Base Fabric",
          color: "White",
          qty: 20,
          unit: "METERS",
          rate: 250, // Amount = 5000
        },
      ],
    };

    const res = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(poPayload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.poNumber).toBe("PO-0001");
    expect(res.body.data.vendor.companyName).toBe("Royal Embroidery Yarns");
    expect(res.body.data.items.length).toBe(2);

    // Calculation assertions
    // SubTotal = 5000 + 5000 = 10000
    expect(res.body.data.subTotal).toBe(10000);
    // DiscountAmount = 10% of 10000 = 1000
    expect(res.body.data.discountAmount).toBe(1000);
    // Amount after discount = 9000
    // GST = 18% of 9000 = 1620
    expect(res.body.data.gstAmount).toBe(1620);
    // TotalAmount = 9000 + 1620 + 100 (shipping) = 10720
    expect(res.body.data.totalAmount).toBe(10720);
  });

  it("should create Purchase Order with Fixed discount", async () => {
    const res = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        discountType: "Fixed",
        discountValue: 500,
        gstRate: 12,
        shippingCharge: 50,
        items: [
          {
            materialType: "Thread",
            name: "Metallic Thread",
            color: "Gold",
            qty: 10,
            unit: "PCS",
            rate: 200, // 2000
          },
        ],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.subTotal).toBe(2000);
    expect(res.body.data.discountAmount).toBe(500);
    // Amount after discount = 1500
    // GST 12% of 1500 = 180
    expect(res.body.data.gstAmount).toBe(180);
    // Total = 1500 + 180 + 50 = 1730
    expect(res.body.data.totalAmount).toBe(1730);
  });

  it("should reject creation when items are empty or vendorId is invalid", async () => {
    const resEmptyItems = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        items: [],
      });

    expect(resEmptyItems.statusCode).toEqual(400);

    const resInvalidVendor = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: 99999,
        items: [{ name: "Thread", qty: 10, rate: 50 }],
      });

    expect(resInvalidVendor.statusCode).toEqual(404);
    expect(resInvalidVendor.body.message).toMatch(/Selected Vendor does not exist/i);
  });

  it("should get all Purchase Orders with search, pagination & status filter", async () => {
    await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        status: "Pending",
        items: [{ name: "Viscose Thread", qty: 10, rate: 100 }],
      });

    await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        status: "Approved",
        items: [{ name: "Zari Thread", qty: 5, rate: 300 }],
      });

    const searchRes = await request(app)
      .get("/api/purchase/orders?search=Viscose")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(searchRes.statusCode).toEqual(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].items[0].name).toBe("Viscose Thread");

    const statusRes = await request(app)
      .get("/api/purchase/orders?status=Approved")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(statusRes.statusCode).toEqual(200);
    expect(statusRes.body.data.length).toBe(1);
    expect(statusRes.body.data[0].status).toBe("Approved");
  });

  it("should retrieve single Purchase Order by numeric ID or PO code", async () => {
    const createRes = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        items: [{ name: "Sample Material", qty: 10, rate: 50 }],
      });

    const poId = createRes.body.data.id;
    const poNumber = createRes.body.data.poNumber;

    const getByIdRes = await request(app)
      .get(`/api/purchase/orders/${poId}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(getByIdRes.statusCode).toEqual(200);
    expect(getByIdRes.body.data.id).toBe(poId);

    const getByCodeRes = await request(app)
      .get(`/api/purchase/orders/${poNumber}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(getByCodeRes.statusCode).toEqual(200);
    expect(getByCodeRes.body.data.poNumber).toBe(poNumber);
  });

  it("should update Purchase Order details and recalculate totals", async () => {
    const createRes = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        discountType: "Percentage",
        discountValue: 0,
        items: [{ name: "Initial Item", qty: 10, rate: 100 }], // Total = 1000
      });

    const poId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/purchase/orders/${poId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        discountValue: 10, // 10%
        gstRate: 18,
        items: [{ name: "Updated Item", qty: 20, rate: 100 }], // 2000
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.data.subTotal).toBe(2000);
    expect(updateRes.body.data.discountAmount).toBe(200);
    // Amount after discount = 1800
    // GST 18% of 1800 = 324
    expect(updateRes.body.data.gstAmount).toBe(324);
    // Total = 1800 + 324 = 2124
    expect(updateRes.body.data.totalAmount).toBe(2124);
  });

  it("should update Purchase Order status using PATCH", async () => {
    const createRes = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        items: [{ name: "Status Test Item", qty: 1, rate: 100 }],
      });

    const poId = createRes.body.data.id;

    const statusRes = await request(app)
      .patch(`/api/purchase/orders/${poId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Approved" });

    expect(statusRes.statusCode).toEqual(200);
    expect(statusRes.body.data.status).toBe("Approved");
  });

  it("should soft delete Purchase Order", async () => {
    const createRes = await request(app)
      .post("/api/purchase/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vendorId: activeVendor.id,
        items: [{ name: "Delete Test Item", qty: 1, rate: 100 }],
      });

    const poId = createRes.body.data.id;

    const deleteRes = await request(app)
      .delete(`/api/purchase/orders/${poId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.statusCode).toEqual(200);
    expect(deleteRes.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/purchase/orders/${poId}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(getRes.statusCode).toEqual(404);
  });
});
