
class ApiResponse {
  constructor(statusCode, message, data = null, extra = {}) {
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
    Object.assign(this, extra);
  }
}

module.exports = { ApiResponse };
