const { Router } = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middleware/auth');
const { paginationSchema } = require('../../utils/pagination');
const service = require('./notifications.service');

const router = Router();
router.use(requireAuth);

const listSchema = paginationSchema.extend({
  unreadOnly: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

// GET /api/notifications?unreadOnly=true&page=1
router.get('/', async (req, res) => {
  res.json(await service.list(req.user.id, listSchema.parse(req.query)));
});

// GET /api/notifications/unread-count   -> for the red badge on the bell icon
router.get('/unread-count', async (req, res) => {
  res.json(await service.unreadCount(req.user.id));
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  res.json(await service.markAllRead(req.user.id));
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  res.json(await service.markRead(req.user.id, req.params.id));
});

module.exports = router;
