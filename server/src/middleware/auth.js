const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Requires a valid `Authorization: Bearer <token>` header, and attaches the
 * corresponding user to req.user for downstream handlers.
 */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Not authorized — no token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized — user no longer exists." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized — invalid or expired token." });
  }
}

async function optionalProtect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch {
    // Continue gracefully
  }
  next();
}

module.exports = { protect, optionalProtect };
