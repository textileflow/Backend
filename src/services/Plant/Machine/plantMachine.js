const PlantMachine = require("../../../models/Plant/Machine/plantMachine");
const SubContractor = require("../../../models/Plant/SubContractor/subContractor");
const CustomError = require("../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

const formatMachine = async (machine) => {
  if (!machine) return null;
  const obj =
    typeof machine.toJSON === "function" ? machine.toJSON() : { ...machine };

  if (obj.ownership === "Subcontractor" && obj.subContractorId) {
    const subContractor = await SubContractor.findOne({
      subContractorId: obj.subContractorId,
    });
    if (subContractor) {
      obj.subContractor = {
        id: subContractor.subContractorId,
        companyName: subContractor.companyName,
        personName: subContractor.personName,
        code: subContractor.subContractorCode,
      };
    }
  }

  return obj;
};

class PlantMachineService {
  /**
   * Create a Machine (In-house or Subcontractor)
   */
  async createMachine(machineData) {
    const ownership = machineData.ownership || "In-house";

    let numSubContractorId = null;

    if (ownership === "Subcontractor") {
      if (!machineData.subContractorId) {
        throw new CustomError(
          "SubContractor ID is required for Subcontractor machines",
          400
        );
      }
      numSubContractorId = Number(machineData.subContractorId);
      const subContractor = await SubContractor.findOne({
        subContractorId: numSubContractorId,
      });
      if (!subContractor) {
        throw new CustomError("Selected SubContractor does not exist", 404);
      }
    }

    const machine = await PlantMachine.create({
      machineName: machineData.machineName.trim(),
      ownership,
      subContractorId: numSubContractorId,
      machineType: machineData.machineType || "Multi Head",
      brand: machineData.brand ? machineData.brand.trim() : "Tajima",
      model: machineData.model ? machineData.model.trim() : "",
      headCount: Number(machineData.headCount),
      needleCount: machineData.needleCount ? Number(machineData.needleCount) : 9,
      maxRpm: machineData.maxRpm ? Number(machineData.maxRpm) : 800,
      headSpacing: machineData.headSpacing ? Number(machineData.headSpacing) : 400,
      note: machineData.note ? machineData.note.trim() : "",
    });

    return await formatMachine(machine);
  }

  /**
   * Get all Plant Machines with filtering (ownership, subContractorId)
   */
  async getAllMachines(queryParams = {}) {
    const { page, limit, skip, search, status } = getPaginationQueryParams(queryParams);
    const { ownership, subContractorId } = queryParams;
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }

    if (ownership) {
      query.ownership = new RegExp(`^${ownership.trim()}$`, "i");
    }

    if (subContractorId) {
      const numSubId = Number(subContractorId);
      if (!isNaN(numSubId)) query.subContractorId = numSubId;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { machineName: searchRegex },
        { machineCode: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
      ];
    }

    const totalCount = await PlantMachine.countDocuments(query);
    const machines = await PlantMachine.find(query)
      .sort({ machineId: 1 })
      .skip(skip)
      .limit(limit);

    const formattedMachines = await Promise.all(
      machines.map((m) => formatMachine(m))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      machines: formattedMachines,
      pagination,
    };
  }

  /**
   * Get single Machine by numeric ID
   */
  async getMachineById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Machine ID", 400);
    }

    const machine = await PlantMachine.findOne({ machineId: numericId });
    if (!machine) {
      throw new CustomError("Machine not found", 404);
    }

    return await formatMachine(machine);
  }

  /**
   * Update Machine
   */
  async updateMachine(id, updateData) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Machine ID", 400);
    }

    const machine = await PlantMachine.findOne({ machineId: numericId });
    if (!machine) {
      throw new CustomError("Machine not found", 404);
    }

    if (updateData.ownership) machine.ownership = updateData.ownership;

    if (updateData.subContractorId !== undefined) {
      const numSubId = Number(updateData.subContractorId);
      if (isNaN(numSubId)) {
        throw new CustomError("Invalid SubContractor ID", 400);
      }
      const subContractor = await SubContractor.findOne({
        subContractorId: numSubId,
      });
      if (!subContractor) {
        throw new CustomError("Selected SubContractor does not exist", 404);
      }
      machine.subContractorId = numSubId;
    }

    if (updateData.machineName) machine.machineName = updateData.machineName.trim();
    if (updateData.machineType) machine.machineType = updateData.machineType.trim();
    if (updateData.brand) machine.brand = updateData.brand.trim();
    if (updateData.model !== undefined) machine.model = updateData.model.trim();
    if (updateData.headCount) machine.headCount = Number(updateData.headCount);
    if (updateData.needleCount) machine.needleCount = Number(updateData.needleCount);
    if (updateData.maxRpm) machine.maxRpm = Number(updateData.maxRpm);
    if (updateData.headSpacing) machine.headSpacing = Number(updateData.headSpacing);
    if (updateData.note !== undefined) machine.note = updateData.note.trim();

    await machine.save();
    return await formatMachine(machine);
  }

  /**
   * Update Machine Status (Active / Maintenance / Inactive)
   */
  async updateMachineStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Machine ID", 400);
    }

    const machine = await PlantMachine.findOne({ machineId: numericId });
    if (!machine) {
      throw new CustomError("Machine not found", 404);
    }

    machine.status = status;
    await machine.save();
    return await formatMachine(machine);
  }

  /**
   * Soft delete Machine
   */
  async deleteMachine(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Machine ID", 400);
    }

    const machine = await PlantMachine.findOne({ machineId: numericId });
    if (!machine) {
      throw new CustomError("Machine not found", 404);
    }

    await machine.softDelete();
    return { id: numericId };
  }
}

module.exports = new PlantMachineService();
