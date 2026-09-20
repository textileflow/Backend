const Staff = require("../../../models/Plant/Staff/staff");
const CustomError = require("../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

const formatStaff = async (staff) => {
  if (!staff) return null;
  return typeof staff.toJSON === "function" ? staff.toJSON() : { ...staff };
};

class StaffService {
  /**
   * Create a new Staff member (Worker / Designer / etc.)
   */
  async createStaff(staffData) {
    let numPlantId = null;
    if (staffData.plantId) {
      numPlantId = Number(staffData.plantId);
      if (isNaN(numPlantId)) {
        throw new CustomError("Invalid Plant ID", 400);
      }
    }

    const salaryVal =
      staffData.salaryAmount !== undefined
        ? Number(staffData.salaryAmount)
        : staffData.salary !== undefined
        ? Number(staffData.salary)
        : 0;

    const staff = await Staff.create({
      name: staffData.name.trim(),
      plantId: numPlantId,
      type: staffData.type.trim(),
      mobile: staffData.mobile ? String(staffData.mobile).trim() : "",
      email: staffData.email ? staffData.email.trim().toLowerCase() : "",
      shift: staffData.shift || "General",
      salaryType: staffData.salaryType || "Fixed",
      salaryAmount: isNaN(salaryVal) ? 0 : salaryVal,
      joiningDate: staffData.joiningDate ? new Date(staffData.joiningDate) : null,
      note: staffData.note ? staffData.note.trim() : "",
    });

    return await formatStaff(staff);
  }

  /**
   * Get all Staff with filtering by plantId, staff type (Worker/Designer), search & pagination
   */
  async getAllStaff(queryParams = {}) {
    const { page, limit, skip, search, status } = getPaginationQueryParams(queryParams);
    const { plantId, type } = queryParams;
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }

    if (plantId) {
      const numPlantId = Number(plantId);
      if (!isNaN(numPlantId)) query.plantId = numPlantId;
    }

    if (type) {
      query.type = new RegExp(`^${type.trim()}$`, "i");
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { staffCode: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
      ];
    }

    const totalCount = await Staff.countDocuments(query);
    const staffList = await Staff.find(query)
      .sort({ staffId: 1 })
      .skip(skip)
      .limit(limit);

    const formattedStaffList = await Promise.all(
      staffList.map((s) => formatStaff(s))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      staff: formattedStaffList,
      pagination,
    };
  }

  /**
   * Get single Staff by numeric ID
   */
  async getStaffById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Staff ID", 400);
    }

    const staff = await Staff.findOne({ staffId: numericId });
    if (!staff) {
      throw new CustomError("Staff member not found", 404);
    }

    return await formatStaff(staff);
  }

  /**
   * Update Staff member
   */
  async updateStaff(id, updateData) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Staff ID", 400);
    }

    const staff = await Staff.findOne({ staffId: numericId });
    if (!staff) {
      throw new CustomError("Staff member not found", 404);
    }

    if (updateData.plantId !== undefined) {
      if (updateData.plantId === null || updateData.plantId === "") {
        staff.plantId = null;
      } else {
        const numPlantId = Number(updateData.plantId);
        if (isNaN(numPlantId)) {
          throw new CustomError("Invalid Plant ID", 400);
        }
        staff.plantId = numPlantId;
      }
    }

    if (updateData.name) staff.name = updateData.name.trim();
    if (updateData.type) staff.type = updateData.type.trim();
    if (updateData.mobile !== undefined)
      staff.mobile = updateData.mobile ? String(updateData.mobile).trim() : "";
    if (updateData.email !== undefined)
      staff.email = updateData.email ? updateData.email.trim().toLowerCase() : "";
    if (updateData.shift) staff.shift = updateData.shift;
    if (updateData.salaryType) staff.salaryType = updateData.salaryType;
    if (updateData.salaryAmount !== undefined || updateData.salary !== undefined) {
      const val = Number(
        updateData.salaryAmount !== undefined
          ? updateData.salaryAmount
          : updateData.salary
      );
      staff.salaryAmount = isNaN(val) ? 0 : val;
    }
    if (updateData.joiningDate !== undefined)
      staff.joiningDate = updateData.joiningDate ? new Date(updateData.joiningDate) : null;
    if (updateData.note !== undefined) staff.note = updateData.note.trim();

    await staff.save();
    return await formatStaff(staff);
  }

  /**
   * Update Staff Status
   */
  async updateStaffStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Staff ID", 400);
    }

    const staff = await Staff.findOne({ staffId: numericId });
    if (!staff) {
      throw new CustomError("Staff member not found", 404);
    }

    staff.status = status;
    await staff.save();
    return await formatStaff(staff);
  }

  /**
   * Soft delete Staff by numeric ID
   */
  async deleteStaff(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Staff ID", 400);
    }

    const staff = await Staff.findOne({ staffId: numericId });
    if (!staff) {
      throw new CustomError("Staff member not found", 404);
    }

    await staff.softDelete();
    return { id: numericId };
  }
}

module.exports = new StaffService();
