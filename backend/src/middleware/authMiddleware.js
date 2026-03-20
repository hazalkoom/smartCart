const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require('../utils/asyncHandler');

// Sanitize logs to prevent CRLF injection from forged JWT errors
const cleanLog = (val) => String(val).replace(/[\r\n]+/g, '');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // FIX: Added the space 'Bearer ' and strict string checking
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith("Bearer ")) {
    try {
      token = authHeader.split(" ")[1];

      // Enforce the algorithm to prevent 'none' algorithm bypass attacks
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

      // FIX: Cast decoded.id to String to prevent NoSQL injection via malicious JWT payloads
      req.user = await User.findById(String(decoded.id)).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      return next(); // FIX: Added return to stop function execution here
    } catch (error) {
      console.error("Token verification failed:", cleanLog(error.message));
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  res.status(401);
  throw new Error("Not authorized, no token");
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      res.status(401);
      throw new Error("Not authorized");
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }

    return next(); // FIX: Added return
  };
};

module.exports = {
  protect,
  authorize,
};