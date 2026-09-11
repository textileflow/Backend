/**
 * Helper to build pagination parameters and response object
 */

/**
 * Parse pagination and search query parameters from req.query
 * @param {Object} query - req.query object
 * @returns {Object} { page, limit, skip, search }
 */
const getPaginationQueryParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.per_page || query.limit, 10) || 10);
  const skip = (page - 1) * limit;
  const search = query.search ? String(query.search).trim() : "";

  return {
    page,
    limit,
    skip,
    search,
  };
};

/**
 * Build standardization pagination object for API response
 * @param {Number} totalCount - Total matching records count in DB
 * @param {Number} page - Current page number
 * @param {Number} limit - Number of records per page
 * @returns {Object} Pagination metadata object
 */
const buildPaginationData = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit) || 0;
  const currentPage = Math.min(page, totalPages > 0 ? totalPages : page);

  return {
    totalCount: totalCount,
    currentPage: currentPage,
    totalPages: totalPages,
    limit: limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

module.exports = {
  getPaginationQueryParams,
  buildPaginationData,
};
