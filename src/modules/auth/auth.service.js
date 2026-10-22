const bcrypt = require('bcryptjs');
const prisma = require('../../lib/prisma'); // ⚠️ use the path from Step 1
const { HttpError } = require('../../utils/httpError');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../../middleware/auth');

const safeUser = ({ passwordHash, ...rest }) => rest; // never send the hash out

const tokensFor = (user) => ({
  accessToken: signToken(user),
  refreshToken: signRefreshToken(user),
});

async function register({ name, email, password, department, year }) {
  email = email.toLowerCase().trim();

  const domain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (domain && !email.endsWith('@' + domain)) {
    throw new HttpError(400, `Please use your college email (@${domain})`);
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new HttpError(409, 'This email is already registered');
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      department,
      year,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'STUDENT', // never take the role from the request body
    },
  });
  return { user: safeUser(user), ...tokensFor(user) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  const ok = user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Invalid email or password'); // same message either way
  return { user: safeUser(user), ...tokensFor(user) };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }
  // reload from DB so role changes (e.g. promoted to coordinator) take effect
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new HttpError(401, 'User no longer exists');
  return tokensFor(user);
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found');
  return safeUser(user);
}

module.exports = { register, login, refresh, getMe };