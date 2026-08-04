// Standard response shape for all successful API responses.
//
// `extra` lets a route add top-level fields the frontend already depends
// on (token/user for auth, count for lists, valid for symbol validation)
// without breaking existing contracts — everything still gets a
// consistent `success`/`message` envelope around it.
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
