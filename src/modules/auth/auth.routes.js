const router = require('express').Router();
const { z } = require('zod');
const service = require('./auth.service');
const { requireAuth } = require('../../middleware/auth');
const { parse, wrap } = require('../../utils/validate');

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  department: z.string().max(80).optional(),
  year: z.number().int().min(1).max(6).optional(),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

router.post('/register', wrap(async (req, res) => {
  res.status(201).json(await service.register(parse(registerSchema, req.body)));
}));

router.post('/login', wrap(async (req, res) => {
  res.json(await service.login(parse(loginSchema, req.body)));
}));

router.post('/refresh', wrap(async (req, res) => {
  const { refreshToken } = parse(refreshSchema, req.body);
  res.json(await service.refresh(refreshToken));
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  res.json(await service.getMe(req.user.id));
}));

module.exports = router;