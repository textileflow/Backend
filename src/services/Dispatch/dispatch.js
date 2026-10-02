const Dispatch = require("../../models/Dispatch/dispatch");

const createDispatchRecord = async (data) => {
  const existing = await Dispatch.findOne({ gatePassNo: data.gatePassNo });
  if (existing) {
    const error = new Error("Dispatch Gate Pass with this number already exists");
    error.statusCode = 400;
    throw error;
  }
  const record = new Dispatch(data);
  return await record.save();
};

const getAllDispatchRecords = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.perPage || query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search) {
    filter.$or = [
      { gatePassNo: { $regex: query.search, $options: "i" } },
      { merchantName: { $regex: query.search, $options: "i" } },
      { destinationCity: { $regex: query.search, $options: "i" } },
      { transporterName: { $regex: query.search, $options: "i" } },
      { lrNumber: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  const [dispatches, total] = await Promise.all([
    Dispatch.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Dispatch.countDocuments(filter),
  ]);

  return {
    dispatches,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getDispatchById = async (id) => {
  const record = await Dispatch.findById(id);
  if (!record) {
    const error = new Error("Dispatch record not found");
    error.statusCode = 404;
    throw error;
  }
  return record;
};

const updateDispatchRecord = async (id, data) => {
  const updated = await Dispatch.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    const error = new Error("Dispatch record not found");
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

const deleteDispatchRecord = async (id) => {
  const record = await Dispatch.findByIdAndDelete(id);
  if (!record) {
    const error = new Error("Dispatch record not found");
    error.statusCode = 404;
    throw error;
  }
  return record;
};

module.exports = {
  createDispatchRecord,
  getAllDispatchRecords,
  getDispatchById,
  updateDispatchRecord,
  deleteDispatchRecord,
};
