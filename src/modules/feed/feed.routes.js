const { Router } = require('express');
const { z } = require('zod');
const { PostCategory } = require('@prisma/client');
const { requireAuth } = require('../../middleware/auth');
const { paginationSchema } = require('../../utils/pagination');
const { emptyToUndefined } = require('../../utils/common');
const feed = require('./feed.service');

const router = Router();
router.use(requireAuth);

const categoryEnum = z.enum(Object.values(PostCategory));

const listSchema = paginationSchema.extend({
  category: z.preprocess(emptyToUndefined, categoryEnum.optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  mine: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

const createSchema = z.object({
  content: z.string().trim().min(1, 'Post cannot be empty').max(5000),
  category: categoryEnum.default('GENERAL'),
  imageUrl: z.string().url().optional(),
  isAnonymous: z.boolean().default(false),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(1000),
  isAnonymous: z.boolean().default(false),
});

// GET /api/posts?category=ACADEMIC&search=exam&page=1
router.get('/', async (req, res) => {
  res.json(await feed.listPosts(req.user.id, listSchema.parse(req.query)));
});

// GET /api/posts/categories  -> list of categories for the filter chips
router.get('/categories', (req, res) => {
  res.json(Object.values(PostCategory));
});

// POST /api/posts  { content, category, imageUrl?, isAnonymous? }
router.post('/', async (req, res) => {
  res.status(201).json(await feed.createPost(req.user.id, createSchema.parse(req.body)));
});

// GET /api/posts/:id   -> one post with its comments
router.get('/:id', async (req, res) => {
  res.json(await feed.getPost(req.user.id, req.params.id));
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res) => {
  res.json(await feed.deletePost(req.user, req.params.id));
});

// POST /api/posts/:id/like   -> like / unlike
router.post('/:id/like', async (req, res) => {
  res.json(await feed.toggleLike(req.user.id, req.params.id));
});

// POST /api/posts/:id/comments  { content, isAnonymous? }
router.post('/:id/comments', async (req, res) => {
  res.status(201).json(await feed.addComment(req.user.id, req.params.id, commentSchema.parse(req.body)));
});

// DELETE /api/posts/comments/:commentId
router.delete('/comments/:commentId', async (req, res) => {
  res.json(await feed.deleteComment(req.user, req.params.commentId));
});

module.exports = router;
