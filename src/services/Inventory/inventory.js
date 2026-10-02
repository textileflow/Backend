const Inventory = require("../../models/Inventory/inventory");

const createInventoryItem = async (data) => {
  const existing = await Inventory.findOne({ itemCode: data.itemCode });
  if (existing) {
    const error = new Error("Inventory item with this SKU / Item Code already exists");
    error.statusCode = 400;
    throw error;
  }
  const item = new Inventory(data);
  return await item.save();
};

const getAllInventoryItems = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.perPage || query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search) {
    filter.$or = [
      { itemCode: { $regex: query.search, $options: "i" } },
      { name: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.category && query.category !== "all") {
    filter.category = query.category;
  }

  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Inventory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Inventory.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getInventoryById = async (id) => {
  const item = await Inventory.findById(id);
  if (!item) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }
  return item;
};

const updateInventoryItem = async (id, data) => {
  if (data.currentStock !== undefined || data.minStock !== undefined) {
    const itemToUpdate = await Inventory.findById(id);
    if (itemToUpdate) {
      const cur = data.currentStock !== undefined ? Number(data.currentStock) : itemToUpdate.currentStock;
      const min = data.minStock !== undefined ? Number(data.minStock) : itemToUpdate.minStock;
      if (cur <= 0) {
        data.status = "Out of Stock";
      } else if (cur <= min) {
        data.status = "Low Stock Alert";
      } else {
        data.status = "Optimal Stock";
      }
    }
  }

  const updated = await Inventory.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

const deleteInventoryItem = async (id) => {
  const item = await Inventory.findByIdAndDelete(id);
  if (!item) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }
  return item;
};

module.exports = {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryById,
  updateInventoryItem,
  deleteInventoryItem,
};
