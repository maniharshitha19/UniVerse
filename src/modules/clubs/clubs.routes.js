const router = require('express').Router();
const { z } = require('zod');
const service = require('./clubs.service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { parse, wrap, paging } = require('../../utils/validate');

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(1000),
  category: z.string().max(40).optional(),
  logoUrl: z.string().url().optional(),
});
const updateSchema = createSchema.partial();

router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  const search = req.query.search ? String(req.query.search) : undefined;
  res.json(await service.listClubs({ search, ...paging(req.query) }));
}));

router.get('/mine', wrap(async (req, res) => {
  res.json(await service.myClubs(req.user.id));
}));

router.post('/', requireRole('COORDINATOR', 'ADMIN'), wrap(async (req, res) => {
  res.status(201).json(await service.createClub(req.user, parse(createSchema, req.body)));
}));

router.get('/:id', wrap(async (req, res) => {
  res.json(await service.getClub(req.params.id, req.user.id));
}));

router.patch('/:id', wrap(async (req, res) => {
  res.json(await service.updateClub(req.params.id, req.user, parse(updateSchema, req.body)));
}));

router.delete('/:id', wrap(async (req, res) => {
  res.json(await service.deleteClub(req.params.id, req.user));
}));

router.post('/:id/join', wrap(async (req, res) => {
  res.json(await service.joinClub(req.params.id, req.user.id));
}));

router.post('/:id/leave', wrap(async (req, res) => {
  res.json(await service.leaveClub(req.params.id, req.user.id));
}));

router.get('/:id/members', wrap(async (req, res) => {
  res.json(await service.listMembers(req.params.id));
}));

module.exports = router;