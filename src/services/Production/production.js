const Production = require("../../models/Production/production");

const createProductionJob = async (data) => {
  const existing = await Production.findOne({ jobCardNo: data.jobCardNo });
  if (existing) {
    const error = new Error("Job Card with this number already exists");
    error.statusCode = 400;
    throw error;
  }
  const job = new Production(data);
  return await job.save();
};

const getAllProductionJobs = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.perPage || query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search) {
    filter.$or = [
      { jobCardNo: { $regex: query.search, $options: "i" } },
      { designName: { $regex: query.search, $options: "i" } },
      { machineName: { $regex: query.search, $options: "i" } },
      { operatorName: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.shift && query.shift !== "all") {
    filter.shift = query.shift;
  }

  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  const [jobs, total] = await Promise.all([
    Production.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Production.countDocuments(filter),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getProductionById = async (id) => {
  const job = await Production.findById(id);
  if (!job) {
    const error = new Error("Production job card not found");
    error.statusCode = 404;
    throw error;
  }
  return job;
};

const updateProductionJob = async (id, data) => {
  const updated = await Production.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    const error = new Error("Production job card not found");
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

const deleteProductionJob = async (id) => {
  const job = await Production.findByIdAndDelete(id);
  if (!job) {
    const error = new Error("Production job card not found");
    error.statusCode = 404;
    throw error;
  }
  return job;
};

module.exports = {
  createProductionJob,
  getAllProductionJobs,
  getProductionById,
  updateProductionJob,
  deleteProductionJob,
};
