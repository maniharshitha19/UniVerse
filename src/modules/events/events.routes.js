const router = require('express').Router();
const { z } = require('zod');
const service = require('./events.service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { parse, wrap, paging } = require('../../utils/validate');

const createSchema = z.object({
  clubId: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().min(1).max(3000),
  venue: z.string().min(1).max(120),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  capacity: z.number().int().min(1).max(100000).optional(),
  imageUrl: z.string().url().optional(),
});
const updateSchema = createSchema
  .omit({ clubId: true })
  .partial()
  .extend({ status: z.enum(['ACTIVE', 'CANCELLED']).optional() });

router.use(requireAuth);

// /api/events?clubId=&search=&upcoming=false   (upcoming is true by default)
router.get('/', wrap(async (req, res) => {
  res.json(await service.listEvents({
    clubId: req.query.clubId ? String(req.query.clubId) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    upcoming: req.query.upcoming !== 'false',
    ...paging(req.query),
  }));
}));

// must be above '/:id'
router.get('/mine/registered', wrap(async (req, res) => {
  res.json(await service.myRegistrations(req.user.id));
}));

router.post('/', requireRole('COORDINATOR', 'ADMIN'), wrap(async (req, res) => {
  res.status(201).json(await service.createEvent(req.user, parse(createSchema, req.body)));
}));

router.get('/:id', wrap(async (req, res) => {
  res.json(await service.getEvent(req.params.id, req.user.id));
}));

router.patch('/:id', wrap(async (req, res) => {
  res.json(await service.updateEvent(req.params.id, req.user, parse(updateSchema, req.body)));
}));

router.delete('/:id', wrap(async (req, res) => {
  res.json(await service.deleteEvent(req.params.id, req.user));
}));

router.post('/:id/register', wrap(async (req, res) => {
  await service.register(req.params.id, req.user);
  res.status(201).json({ registered: true });
}));

router.delete('/:id/register', wrap(async (req, res) => {
  res.json(await service.unregister(req.params.id, req.user.id));
}));

router.get('/:id/registrations', wrap(async (req, res) => {
  res.json(await service.listRegistrations(req.params.id, req.user));
}));

module.exports = router;