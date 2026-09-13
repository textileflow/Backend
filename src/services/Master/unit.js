const Unit = require("../../models/Master/unit");
const CustomError = require("../../utils/Common/customError");

class UnitService {
  async createUnit(data) {
    const unit = await Unit.create({
      unitCode: data.unitCode ? data.unitCode.trim().toUpperCase() : undefined,
      unitName: data.unitName.trim(),
      symbol: data.symbol ? data.symbol.trim() : "",
      status: data.status || "Active",
    });
    return unit;
  }

  async getAllUnits() {
    return await Unit.find().sort({ unitId: 1 });
  }

  async getUnitById(id) {
    const numericId = Number(id);
    const unit = await Unit.findOne({ unitId: numericId });
    if (!unit) throw new CustomError("Unit not found", 404);
    return unit;
  }
}

module.exports = new UnitService();
