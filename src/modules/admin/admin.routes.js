const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { parse, wrap, paging } = require('../../utils/validate');

router.use(requireAuth, requireRole('ADMIN')); // every route here is admin-only

const SELECT = { id: true, name: true, email: true, role: true, department: true, year: true };

// /api/admin/users?search=&role=COORDINATOR
router.get('/users', wrap(async (req, res) => {
  const { page, limit } = paging(req.query);
  const where = {
    ...(req.query.role && { role: String(req.query.role) }),
    ...(req.query.search && {
      OR: [
        { name: { contains: String(req.query.search), mode: 'insensitive' } },
        { email: { contains: String(req.query.search), mode: 'insensitive' } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: SELECT, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
    prisma.user.count({ where }),
  ]);
  res.json({ items, page, limit, total, hasMore: page * limit < total });
}));

// Change someone's role
router.patch('/users/:id/role', wrap(async (req, res) => {
  const { role } = parse(z.object({ role: z.enum(['STUDENT', 'COORDINATOR', 'ADMIN']) }), req.body);
  if (req.params.id === req.user.id) throw new HttpError(400, "You can't change your own role");
  const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new HttpError(404, 'User not found');
  res.json(await prisma.user.update({ where: { id: req.params.id }, data: { role }, select: SELECT }));
}));

module.exports = router;