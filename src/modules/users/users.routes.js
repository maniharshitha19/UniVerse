const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../../lib/prisma'); // ⚠️ use the path from Step 1
const { HttpError } = require('../../utils/httpError');
const { requireAuth } = require('../../middleware/auth');
const { parse, wrap } = require('../../utils/validate');

// Fields other students are allowed to see (no email, no passwordHash)
const PUBLIC = {
  id: true, name: true, avatarUrl: true, skills: true, role: true,
  department: true, year: true, bio: true, interests: true, projectLinks: true,
};

const updateSchema = z.object({
  name: z.string().min(2).max(80),
  avatarUrl: z.string().url(),
  department: z.string().max(80),
  year: z.number().int().min(1).max(6),
  bio: z.string().max(500),
  skills: z.array(z.string().max(30)).max(20),
  interests: z.array(z.string().max(30)).max(20),
  projectLinks: z.array(z.string().url()).max(10),
}).partial();

// Skills are stored lowercase because Person C's team matching relies on that.
const normalize = (arr) => [...new Set(arr.map((s) => s.trim().toLowerCase()).filter(Boolean))];

router.use(requireAuth);

// My profile
router.get('/me', wrap(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: PUBLIC });
  res.json(user);
}));

// Update my profile (role and email can NOT be changed here)
router.patch('/me', wrap(async (req, res) => {
  const data = parse(updateSchema, req.body);
  if (data.skills) data.skills = normalize(data.skills);
  if (data.interests) data.interests = normalize(data.interests);
  res.json(await prisma.user.update({ where: { id: req.user.id }, data, select: PUBLIC }));
}));

// Browse students: /api/users?search=aar&skill=react&department=CSE&page=1&limit=20
router.get('/', wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const where = {
    ...(req.query.search && { name: { contains: String(req.query.search), mode: 'insensitive' } }),
    ...(req.query.skill && { skills: { has: String(req.query.skill).toLowerCase() } }),
    ...(req.query.department && { department: String(req.query.department) }),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: PUBLIC, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
    prisma.user.count({ where }),
  ]);
  res.json({ items, page, limit, total, hasMore: page * limit < total }); // same shape as her list endpoints
}));

// Someone else's profile (keep this AFTER '/me')
router.get('/:id', wrap(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: PUBLIC });
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
}));

module.exports = router;