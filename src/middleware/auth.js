const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { HttpError } = require('../utils/httpError');

// Access token (short-lived). Payload { userId, role } is the team contract: don't change it.
function signToken(user, expiresIn = '1h') {
  return jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn });
}

// Refresh token (long-lived, separate secret)
function signRefreshToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// Turns a token into { id, role }, or throws if it's fake/expired.
function verifyToken(token) {
  const payload = jwt.verify(token, jwtSecret);
  if (!payload.userId) throw new Error('Token has no userId');
  return { id: payload.userId, role: payload.role || 'STUDENT' };
}

// Put this in front of any route that needs a logged-in user.
function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Please log in (missing token)');
  }
  try {
    req.user = verifyToken(token);
  } catch {
    throw new HttpError(401, 'Your session is invalid or expired. Please log in again.');
  }
  next();
}

// Use AFTER requireAuth:  router.post('/', requireAuth, requireRole('COORDINATOR', 'ADMIN'), ...)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to do this');
    }
    next();
  };
}

module.exports = { signToken, signRefreshToken, verifyRefreshToken, verifyToken, requireAuth, requireRole };