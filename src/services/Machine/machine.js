const Machine = require("../../models/Machine/machine");
const MachineType = require("../../models/Master/machineType");
const CustomError = require("../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

const formatMachineRecord = async (machine) => {
  if (!machine) return {};
  const obj = typeof machine.toJSON === "function" ? machine.toJSON() : { ...machine };

  if (obj.machineTypeId) {
    const mt = await MachineType.findOne({ machineTypeId: obj.machineTypeId });
    if (mt) {
      obj.machineTypeDetails = {
        id: mt.machineTypeId,
        code: mt.code,
        name: mt.name,
      };
    }
  }

  delete obj.machineTypeId;
  return obj;
};

class MachineService {
  /**
   * Create a new Machine Master record
   */
  async createMachine(data) {
    if (data.machineCode) {
      const existingCode = await Machine.findOne({
        machineCode: data.machineCode.trim().toUpperCase(),
      });
      if (existingCode) {
        throw new CustomError("Machine Code already exists", 400);
      }
    }

    let numMachineTypeId = null;
    if (data.machineTypeId) {
      numMachineTypeId = Number(data.machineTypeId);
      const mtExists = await MachineType.findOne({ machineTypeId: numMachineTypeId });
      if (!mtExists) {
        throw new CustomError("Selected Machine Type does not exist", 404);
      }
    }

    const machine = await Machine.create({
      machineCode: data.machineCode ? data.machineCode.trim().toUpperCase() : undefined,
      machineName: data.machineName.trim(),
      machineTypeId: numMachineTypeId,
      machineType: data.machineType ? data.machineType.trim() : "Multi Head",
      brand: data.brand ? data.brand.trim() : "Tajima",
      model: data.model ? data.model.trim() : "TMAR",
      headCount: data.headCount ? Number(data.headCount) : data.noOfHeads ? Number(data.noOfHeads) : 20,
      needleCount: data.needleCount ? Number(data.needleCount) : 9,
      maxRpm: data.maxRpm ? Number(data.maxRpm) : 800,
      headSpacing: data.headSpacing ? Number(data.headSpacing) : data.headSpacingMm ? Number(data.headSpacingMm) : 400,
      status: data.status || "Active",
      note: data.note ? data.note.trim() : "",
    });

    return await formatMachineRecord(machine);
  }

  /**
   * Get all Machines with filtering & pagination
   */
  async getAllMachines(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const { machineType, status } = queryParams;
    const query = {};

    if (machineType) {
      query.machineType = machineType;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { machineCode: searchRegex },
        { machineName: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
      ];
    }

    const totalCount = await Machine.countDocuments(query);
    const machines = await Machine.find(query)
      .sort({ machineId: -1 })
      .skip(skip)
      .limit(limit);

    const formattedMachines = await Promise.all(
      machines.map((m) => formatMachineRecord(m))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      machines: formattedMachines,
      pagination,
    };
  }

  /**
   * Get Machine by numeric machineId
   */
  async getMachineById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Machine ID", 400);
    }

    const machine = await Machine.findOne({ machineId: numericId });
    if (!machine) {
      throw new CustomError("Machine not found", 404);
    }

    return await formatMachineRecord(machine);
  }

  /**
   * Update Machine by numeric machineId
   */
  async updateMachine(id, updateData) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Machine ID", 400);
    }

    const machine = await Machine.findOne({ machineId: numericId });
    if (!machine) {
      throw new CustomError("Machine not found", 404);
    }

    if (updateData.machineCode && updateData.machineCode.trim().toUpperCase() !== machine.machineCode) {
      const existingCode = await Machine.findOne({
        machineCode: updateData.machineCode.trim().toUpperCase(),
        machineId: { $ne: numericId },
      });
      if (existingCode) {
        throw new CustomError("Machine Code already exists", 400);
      }
      machine.machineCode = updateData.machineCode.trim().toUpperCase();
    }

    if (updateData.machineName) machine.machineName = updateData.machineName.trim();
    if (updateData.machineTypeId !== undefined) machine.machineTypeId = Number(updateData.machineTypeId);
    if (updateData.machineType) machine.machineType = updateData.machineType;
    if (updateData.brand !== undefined) machine.brand = updateData.brand.trim();
    if (updateData.model !== undefined) machine.model = updateData.model.trim();
    if (updateData.headCount !== undefined || updateData.noOfHeads !== undefined) {
      machine.headCount = updateData.headCount !== undefined ? Number(updateData.headCount) : Number(updateData.noOfHeads);
    }
    if (updateData.needleCount !== undefined) machine.needleCount = Number(updateData.needleCount);
    if (updateData.maxRpm !== undefined) machine.maxRpm = Number(updateData.maxRpm);
    if (updateData.headSpacing !== undefined || updateData.headSpacingMm !== undefined) {
      machine.headSpacing = updateData.headSpacing !== undefined ? Number(updateData.headSpacing) : Number(updateData.headSpacingMm);
    }
    if (updateData.status) machine.status = updateData.status;
    if (updateData.note !== undefined) machine.note = updateData.note.trim();

    await machine.save();
    return await formatMachineRecord(machine);
  }

  /**
   * Delete Machine by numeric machineId
   */
  async deleteMachine(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Machine ID", 400);
    }

    const machine = await Machine.findOne({ machineId: numericId });
    if (!machine) {
      throw new CustomError("Machine not found", 404);
    }

    await Machine.findOneAndDelete({ machineId: numericId });
    return { id: numericId };
  }
}

module.exports = new MachineService();
