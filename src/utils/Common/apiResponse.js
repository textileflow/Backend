const sendSuccess = (res, statusCode, message, data = null, pagination = null) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  if (pagination !== null && pagination !== undefined) {
    response.pagination = pagination;
  }
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess };
