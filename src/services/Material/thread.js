const Thread = require("../../models/Material/thread");
const Unit = require("../../models/Master/unit");
const CustomError = require("../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

const formatThreadRecord = async (thread) => {
  if (!thread) return {};
  const obj = typeof thread.toJSON === "function" ? thread.toJSON() : { ...thread };

  if (obj.unitId) {
    const unit = await Unit.findOne({ unitId: obj.unitId });
    if (unit) {
      obj.unit = {
        id: unit.unitId,
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        symbol: unit.symbol,
      };
    }
  }

  delete obj.unitId;
  return obj;
};

class ThreadService {
  async createThread(data) {
    if (data.threadCode) {
      const existing = await Thread.findOne({
        threadCode: data.threadCode.trim().toUpperCase(),
      });
      if (existing) throw new CustomError("Thread code already exists", 400);
    }

    let numUnitId = null;
    if (data.unitId) {
      numUnitId = Number(data.unitId);
      const unitExists = await Unit.findOne({ unitId: numUnitId });
      if (!unitExists) throw new CustomError("Selected Unit does not exist", 404);
    }

    const thread = await Thread.create({
      threadCode: data.threadCode ? data.threadCode.trim().toUpperCase() : undefined,
      threadName: data.threadName.trim(),
      threadType: data.threadType ? data.threadType.trim() : "Rayon",
      brand: data.brand ? data.brand.trim() : "XYZ",
      colorName: data.colorName ? data.colorName.trim() : "",
      colorCode: data.colorCode ? data.colorCode.trim() : "",
      threadSize: data.threadSize ? data.threadSize.trim() : "120D",
      unitId: numUnitId,
      rate: data.rate ? Number(data.rate) : 0,
      status: data.status || "Active",
    });

    return await formatThreadRecord(thread);
  }

  async getAllThreads(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const { status, threadType } = queryParams;
    const query = {};

    if (status) query.status = status;
    if (threadType) query.threadType = new RegExp(threadType, "i");

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { threadCode: searchRegex },
        { threadName: searchRegex },
        { brand: searchRegex },
        { colorName: searchRegex },
      ];
    }

    const totalCount = await Thread.countDocuments(query);
    const threads = await Thread.find(query)
      .sort({ threadId: 1 })
      .skip(skip)
      .limit(limit);

    const formattedThreads = await Promise.all(
      threads.map((t) => formatThreadRecord(t))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      threads: formattedThreads,
      pagination,
    };
  }

  async getThreadById(id) {
    const numericId = Number(id);
    const thread = await Thread.findOne({ threadId: numericId });
    if (!thread) throw new CustomError("Thread not found", 404);
    return await formatThreadRecord(thread);
  }
}

module.exports = new ThreadService();
