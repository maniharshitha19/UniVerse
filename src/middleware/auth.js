// ============================================================
//  ⚠️  TEMPORARY AUTH — Person B owns login/signup.
//
//  Agreement with Person B (keep these the same and nothing breaks):
//   1. Tokens are JWTs signed with JWT_SECRET from .env
//   2. Token payload contains { userId, role }
//   3. The app sends it as:  Authorization: Bearer <token>
//
//  Person B can replace this file with their own version as long as
//  requireAuth still sets req.user = { id, role }.
// ============================================================
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { HttpError } = require('../utils/httpError');

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
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

module.exports = { signToken, verifyToken, requireAuth };
