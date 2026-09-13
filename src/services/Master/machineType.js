const MachineType = require("../../models/Master/machineType");
const CustomError = require("../../utils/Common/customError");

class MachineTypeService {
  async createMachineType(data) {
    const machineType = await MachineType.create({
      code: data.code ? data.code.trim().toUpperCase() : undefined,
      name: data.name.trim(),
      description: data.description ? data.description.trim() : "",
      status: data.status || "Active",
    });
    return machineType;
  }

  async getAllMachineTypes() {
    return await MachineType.find().sort({ machineTypeId: 1 });
  }
}

module.exports = new MachineTypeService();
