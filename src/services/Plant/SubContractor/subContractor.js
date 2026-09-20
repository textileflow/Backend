const SubContractor = require("../../../models/Plant/SubContractor/subContractor");
const PlantMachine = require("../../../models/Plant/Machine/plantMachine");
const CustomError = require("../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

const formatSubContractor = async (subContractor) => {
  if (!subContractor) return null;
  const obj =
    typeof subContractor.toJSON === "function"
      ? subContractor.toJSON()
      : { ...subContractor };

  // Fetch machines assigned to this subcontractor
  const machines = await PlantMachine.find({
    subContractorId: obj.id,
  });

  const formattedMachines = machines.map((m) => m.toJSON());

  obj.machines = formattedMachines;
  obj.totalMachines = machines.length;
  obj.totalHeads = machines.reduce(
    (sum, m) => sum + (m.headCount || m.noOfHeads || 0),
    0
  );

  return obj;
};

class SubContractorService {
  /**
   * Create a new SubContractor
   */
  async createSubContractor(subContractorData) {
    let numPlantId = null;
    if (subContractorData.plantId) {
      numPlantId = Number(subContractorData.plantId);
      if (isNaN(numPlantId)) {
        throw new CustomError("Invalid Plant ID", 400);
      }
    }

    const subContractor = await SubContractor.create({
      companyName: subContractorData.companyName.trim(),
      personName: subContractorData.personName.trim(),
      mobile: String(subContractorData.mobile).trim(),
      email: subContractorData.email ? subContractorData.email.trim().toLowerCase() : "",
      address: subContractorData.address ? subContractorData.address.trim() : "",
      gstNumber: subContractorData.gstNumber
        ? subContractorData.gstNumber.trim().toUpperCase()
        : "",
      panCard: subContractorData.panCard
        ? subContractorData.panCard.trim().toUpperCase()
        : "",
      ratePerStitch: subContractorData.ratePerStitch
        ? Number(subContractorData.ratePerStitch)
        : 0,
      paymentTerms: subContractorData.paymentTerms
        ? subContractorData.paymentTerms.trim()
        : "",
      plantId: numPlantId,
      note: subContractorData.note ? subContractorData.note.trim() : "",
    });

    return await formatSubContractor(subContractor);
  }

  /**
   * Get all SubContractors with search, machine counts & pagination
   */
  async getAllSubContractors(queryParams = {}) {
    const { page, limit, skip, search, status } = getPaginationQueryParams(queryParams);
    const { plantId } = queryParams;
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }

    if (plantId) {
      const numPlantId = Number(plantId);
      if (!isNaN(numPlantId)) query.plantId = numPlantId;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { companyName: searchRegex },
        { personName: searchRegex },
        { subContractorCode: searchRegex },
        { mobile: searchRegex },
        { gstNumber: searchRegex },
      ];
    }

    const totalCount = await SubContractor.countDocuments(query);
    const subContractors = await SubContractor.find(query)
      .sort({ subContractorId: 1 })
      .skip(skip)
      .limit(limit);

    const formattedList = await Promise.all(
      subContractors.map((s) => formatSubContractor(s))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      subContractors: formattedList,
      pagination,
    };
  }

  /**
   * Get single SubContractor by numeric ID with machine details
   */
  async getSubContractorById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid SubContractor ID", 400);
    }

    const subContractor = await SubContractor.findOne({
      subContractorId: numericId,
    });
    if (!subContractor) {
      throw new CustomError("SubContractor not found", 404);
    }

    return await formatSubContractor(subContractor);
  }

  /**
   * Update SubContractor
   */
  async updateSubContractor(id, updateData) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid SubContractor ID", 400);
    }

    const subContractor = await SubContractor.findOne({
      subContractorId: numericId,
    });
    if (!subContractor) {
      throw new CustomError("SubContractor not found", 404);
    }

    if (updateData.plantId !== undefined) {
      if (updateData.plantId === null || updateData.plantId === "") {
        subContractor.plantId = null;
      } else {
        const numPlantId = Number(updateData.plantId);
        if (isNaN(numPlantId)) {
          throw new CustomError("Invalid Plant ID", 400);
        }
        subContractor.plantId = numPlantId;
      }
    }

    if (updateData.companyName)
      subContractor.companyName = updateData.companyName.trim();
    if (updateData.personName)
      subContractor.personName = updateData.personName.trim();
    if (updateData.mobile)
      subContractor.mobile = String(updateData.mobile).trim();
    if (updateData.email !== undefined)
      subContractor.email = updateData.email ? updateData.email.trim().toLowerCase() : "";
    if (updateData.address !== undefined)
      subContractor.address = updateData.address ? updateData.address.trim() : "";
    if (updateData.gstNumber !== undefined)
      subContractor.gstNumber = updateData.gstNumber ? updateData.gstNumber.trim().toUpperCase() : "";
    if (updateData.panCard !== undefined)
      subContractor.panCard = updateData.panCard ? updateData.panCard.trim().toUpperCase() : "";
    if (updateData.ratePerStitch !== undefined)
      subContractor.ratePerStitch = Number(updateData.ratePerStitch);
    if (updateData.paymentTerms !== undefined)
      subContractor.paymentTerms = updateData.paymentTerms ? updateData.paymentTerms.trim() : "";
    if (updateData.note !== undefined)
      subContractor.note = updateData.note ? updateData.note.trim() : "";

    await subContractor.save();
    return await formatSubContractor(subContractor);
  }

  /**
   * Update SubContractor Status
   */
  async updateSubContractorStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid SubContractor ID", 400);
    }

    const subContractor = await SubContractor.findOne({
      subContractorId: numericId,
    });
    if (!subContractor) {
      throw new CustomError("SubContractor not found", 404);
    }

    subContractor.status = status;
    await subContractor.save();
    return await formatSubContractor(subContractor);
  }

  /**
   * Soft delete SubContractor
   */
  async deleteSubContractor(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid SubContractor ID", 400);
    }

    const subContractor = await SubContractor.findOne({
      subContractorId: numericId,
    });
    if (!subContractor) {
      throw new CustomError("SubContractor not found", 404);
    }

    await subContractor.softDelete();
    return { id: numericId };
  }
}

module.exports = new SubContractorService();
