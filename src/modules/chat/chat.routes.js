const { Router } = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middleware/auth');
const chat = require('./chat.service');

const router = Router();
router.use(requireAuth);

// GET /api/conversations   -> my chat list (newest first, with unread counts)
router.get('/', async (req, res) => {
  res.json(await chat.listConversations(req.user.id));
});

// POST /api/conversations/direct  { "userId": "..." }  -> open (or create) a DM
router.post('/direct', async (req, res) => {
  const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body);
  res.status(201).json(await chat.getOrCreateDirect(req.user.id, userId));
});

// GET /api/conversations/:id
router.get('/:id', async (req, res) => {
  res.json(await chat.getConversation(req.user.id, req.params.id));
});

// GET /api/conversations/:id/messages?before=2026-10-08T10:00:00Z&limit=30
router.get('/:id/messages', async (req, res) => {
  const query = z
    .object({
      before: z.coerce.date().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(30),
    })
    .parse(req.query);
  res.json(await chat.getMessages(req.user.id, req.params.id, query));
});

// POST /api/conversations/:id/messages  { "content": "hi" }
// (The app normally sends via Socket.io "message:send"; this is a backup.)
router.post('/:id/messages', async (req, res) => {
  const { content } = z.object({ content: z.string().trim().min(1).max(2000) }).parse(req.body);
  res.status(201).json(await chat.sendMessage(req.user.id, req.params.id, content));
});

// POST /api/conversations/:id/read
router.post('/:id/read', async (req, res) => {
  res.json(await chat.markRead(req.user.id, req.params.id));
});

module.exports = router;
