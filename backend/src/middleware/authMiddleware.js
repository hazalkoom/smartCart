const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require('../utils/asyncHandler');

// Sanitize logs to prevent CRLF injection from forged JWT errors
const cleanLog = (val) => String(val).replace(/[\r\n]+/g, '');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';

  // SECURITY PATCH: Use Regex to extract token to satisfy CodeQL taint analysis
  const tokenMatch = authHeader.match(/^Bearer\s+(\S+)$/i);

  if (!tokenMatch) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const token = tokenMatch[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    req.user = await User.findById(String(decoded.id)).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    return next();
  } catch (error) {
    console.error("Token verification failed:", cleanLog(error.message));
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
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

const requireEmailVerification = asyncHandler(async (req, res, next) => {
  // We assume 'protect' runs before this, so req.user is already loaded
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }

  // If the user is an admin or owner, let them through. Otherwise, check verification.
  if (req.user.role !== 'admin' && req.user.role !== 'owner' && !req.user.isEmailVerified) {
    res.status(403); // 403 means Forbidden (You know who they are, but they lack permissions)
    throw new Error("Email verification required. Please check your inbox and verify your email to perform this action.");
  }

  next();
});

module.exports = {
  protect,
  authorize,
  requireEmailVerification,
};