const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");
const Category = require("../src/models/Merchant/Category/category");
const SubCategory = require("../src/models/Merchant/SubCategory/subCategory");
const Merchant = require("../src/models/Merchant/merchant");
const Design = require("../src/models/Design/design");
const DesignVersion = require("../src/models/Design/designVersion");
const Counter = require("../src/models/Common/counter");

let mongoServer;
let adminToken;
let staffToken;
let categoryId;
let subCategoryId;
let merchantId;

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
  await Category.deleteMany({});
  await SubCategory.deleteMany({});
  await Merchant.deleteMany({});
  await Design.deleteMany({});
  await DesignVersion.deleteMany({});
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

  const cat = await Category.create({ name: "Garment Merchant" });
  categoryId = cat.categoryId;

  const subCat = await SubCategory.create({
    categoryId: cat.categoryId,
    name: "Ladies Wear",
  });
  subCategoryId = subCat.subCategoryId;

  const merchant = await Merchant.create({
    companyName: "ABC Textiles",
    personName: "Ramesh Bhai",
    mobile: "9898989898",
    categoryId,
    subCategoryId,
  });
  merchantId = merchant.merchantId;
});

describe("Design Master Relational & Versioning API Tests (/api/designs)", () => {
  const sampleDesign = {
    designName: "Floral Border",
    category: "Border",
    designType: "Embroidery",
    stitchCount: 16800,
    width: 12.5,
    height: 8.2,
    repeatX: 10.0,
    repeatY: 8.2,
    headSpacing: 40,
    machineRpm: 750,
    efficiencyPercent: 85,
    pieceRatePer1kStitches: 2.0,
    colors: [
      { sequenceNo: 1, threadCode: "TH-001", colorName: "Gold", hexCode: "#FFD700", consumptionMeters: 125 },
      { sequenceNo: 2, threadCode: "TH-025", colorName: "Black", hexCode: "#000000", consumptionMeters: 80 },
    ],
    materials: [
      { materialName: "Thread - Gold", itemType: "Thread", consumption: 125, unit: "Meter" },
      { materialName: "Backing", itemType: "Backing", consumption: 0.25, unit: "Meter" },
      { materialName: "Water Soluble Film", itemType: "Film", consumption: 0.1, unit: "Meter" },
      { materialName: "Needle 75/11", itemType: "Needle", consumption: 2, unit: "Nos" },
    ],
    machines: [
      { machineName: "20 Head Tajima", machineType: "Multi Head", isCompatible: true },
      { machineName: "15 Head Barudan", machineType: "Multi Head", isCompatible: true },
    ],
    status: "Draft",
    note: "Initial sampling version for ABC Textiles",
  };

  describe("POST /api/designs (Create Main Record & V1 Version)", () => {
    it("should create Design Master & V1 Version with accurate production time calculation", async () => {
      const res = await request(app)
        .post("/api/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleDesign,
          merchantId,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.designCode).toMatch(/^EMB-\d{6}$/);
      expect(res.body.data.customer.companyName).toBe("ABC Textiles");
      expect(res.body.data.currentVersion).toBe("V1");
      expect(res.body.data.currentVersionDetails.versionNumber).toBe("V1");
      expect(res.body.data.currentVersionDetails.technicalSpecs.stitchCount).toBe(16800);
      // Production time: 16800 / 750 = 22.4 min theoretical -> 22.4 / 0.85 = 26.35 min estimated
      expect(res.body.data.currentVersionDetails.technicalSpecs.estimatedTimeMinutes).toBeCloseTo(26.35, 1);
      expect(res.body.data.currentVersionDetails.colors.length).toBe(2);
      expect(res.body.data.currentVersionDetails.materials.length).toBe(4);
    });
  });

  describe("POST /api/designs/:id/versions (Mandatory Versioning V1 -> V2 -> V3)", () => {
    let designId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post("/api/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleDesign,
          merchantId,
        });
      designId = createRes.body.data.id;
    });

    it("should create V2 version without overwriting V1 version", async () => {
      const res = await request(app)
        .post(`/api/designs/${designId}/versions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          stitchCount: 18450,
          changeSummary: "Added 2 new thread colors for V2 revision",
          status: "Sampling",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentVersion).toBe("V2");
      expect(res.body.data.availableVersions.length).toBe(2);
      expect(res.body.data.availableVersions[0].versionNumber).toBe("V1");
      expect(res.body.data.availableVersions[0].stitchCount).toBe(16800);
      expect(res.body.data.availableVersions[1].versionNumber).toBe("V2");
      expect(res.body.data.availableVersions[1].stitchCount).toBe(18450);
    });
  });

  describe("PATCH /api/designs/:id/status (Approval Workflow & Version Locking)", () => {
    let designId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post("/api/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleDesign,
          merchantId,
        });
      designId = createRes.body.data.id;
    });

    it("should approve version V1, lock it as Read-Only, and record audit log", async () => {
      const res = await request(app)
        .patch(`/api/designs/${designId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          versionNumber: "V1",
          status: "Approved",
          comments: "Customer approved sampling V1",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Approved");
      expect(res.body.data.approvedVersion).toBe("V1");
      expect(res.body.data.currentVersionDetails.isReadonly).toBe(true);
      expect(res.body.data.currentVersionDetails.approvals.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/designs/dashboard & GET /api/designs/:id/job-card", () => {
    let designId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post("/api/designs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...sampleDesign,
          merchantId,
          status: "Approved",
        });
      designId = createRes.body.data.id;
    });

    it("should fetch dashboard metrics aggregation summary", async () => {
      const res = await request(app)
        .get("/api/designs/dashboard")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("totalDesigns");
      expect(res.body.data).toHaveProperty("approvedCount");
      expect(res.body.data.totalDesigns).toBeGreaterThan(0);
    });

    it("should extract ready-to-use Job Card payload for downstream production planning", async () => {
      const res = await request(app)
        .get(`/api/designs/${designId}/job-card`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      const payload = res.body.data.jobCardDesignPayload;
      expect(payload).toHaveProperty("designCode");
      expect(payload).toHaveProperty("customer");
      expect(payload.customer.companyName).toBe("ABC Textiles");
      expect(payload).toHaveProperty("technicalSpecs");
      expect(payload).toHaveProperty("threadRequirements");
      expect(payload).toHaveProperty("materialsBOM");
      expect(payload).toHaveProperty("compatibleMachines");
    });
  });
});
