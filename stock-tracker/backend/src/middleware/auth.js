const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { isAccessTokenBlacklisted } = require("../services/token.service");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized. No token.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Session expired. Please log in again.");
    }
    throw new ApiError(401, "Invalid token.");
  }

  if (decoded.jti && isAccessTokenBlacklisted(decoded.jti)) {
    throw new ApiError(401, "Session has been revoked. Please log in again.");
  }

  req.user = await User.findById(decoded.id);
  if (!req.user) {
    throw new ApiError(401, "User no longer exists.");
  }

  next();
});

module.exports = { protect };
