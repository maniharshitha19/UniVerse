const { Router } = require('express');
const { z } = require('zod');
const { TeamStatus, RequestStatus } = require('@prisma/client');
const { requireAuth } = require('../../middleware/auth');
const { paginationSchema } = require('../../utils/pagination');
const { emptyToUndefined } = require('../../utils/common');
const teams = require('./teams.service');

const router = Router();
router.use(requireAuth);

const listSchema = paginationSchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  skill: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(Object.values(TeamStatus)).optional()),
});

// The fields of a team (no defaults here, so edits never reset untouched fields).
const teamFields = {
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(1).max(2000),
  eventName: z.string().trim().max(150),
  skillsNeeded: z.array(z.string().trim().min(1).max(50)).max(15),
  maxMembers: z.number().int().min(2).max(10),
};

const createSchema = z.object({
  ...teamFields,
  eventName: teamFields.eventName.optional(),
  skillsNeeded: teamFields.skillsNeeded.default([]),
  maxMembers: teamFields.maxMembers.default(4),
});

const updateSchema = z
  .object({ ...teamFields, status: z.enum(Object.values(TeamStatus)) })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Send at least one field to update');

// ---- Fixed paths first (so "/mine" isn't mistaken for a team id) ----

// GET /api/teams?search=hackathon&skill=react&page=1
router.get('/', async (req, res) => {
  res.json(await teams.listTeams(req.user.id, listSchema.parse(req.query)));
});

// GET /api/teams/recommended   -> teams matching MY skills
router.get('/recommended', async (req, res) => {
  res.json(await teams.recommendedTeams(req.user.id));
});

// GET /api/teams/mine          -> teams I lead or joined
router.get('/mine', async (req, res) => {
  res.json(await teams.myTeams(req.user.id));
});

// GET /api/teams/requests/mine -> join requests I sent
router.get('/requests/mine', async (req, res) => {
  res.json(await teams.myRequests(req.user.id));
});

// PATCH /api/teams/requests/:requestId  { "action": "accept" | "reject" }  (leader only)
router.patch('/requests/:requestId', async (req, res) => {
  const { action } = z.object({ action: z.enum(['accept', 'reject']) }).parse(req.body);
  res.json(await teams.respondToRequest(req.user.id, req.params.requestId, action));
});

// DELETE /api/teams/requests/:requestId  -> cancel my pending request
router.delete('/requests/:requestId', async (req, res) => {
  res.json(await teams.cancelRequest(req.user.id, req.params.requestId));
});

// POST /api/teams  { title, description, eventName?, skillsNeeded[], maxMembers }
router.post('/', async (req, res) => {
  res.status(201).json(await teams.createTeam(req.user.id, createSchema.parse(req.body)));
});

// ---- Paths with a team id ----

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  res.json(await teams.getTeam(req.user.id, req.params.id));
});

// PATCH /api/teams/:id   (leader only) e.g. { "status": "CLOSED" }
router.patch('/:id', async (req, res) => {
  res.json(await teams.updateTeam(req.user.id, req.params.id, updateSchema.parse(req.body)));
});

// DELETE /api/teams/:id  (leader only)
router.delete('/:id', async (req, res) => {
  res.json(await teams.deleteTeam(req.user.id, req.params.id));
});

// POST /api/teams/:id/requests  { "message"?: "I know React Native" }
router.post('/:id/requests', async (req, res) => {
  const { message } = z
    .object({ message: z.string().trim().max(500).optional() })
    .parse(req.body ?? {});
  res.status(201).json(await teams.requestToJoin(req.user.id, req.params.id, message));
});

// GET /api/teams/:id/requests?status=PENDING   (leader only)
router.get('/:id/requests', async (req, res) => {
  const { status } = z
    .object({ status: z.preprocess(emptyToUndefined, z.enum(Object.values(RequestStatus)).optional()) })
    .parse(req.query);
  res.json(await teams.listRequests(req.user.id, req.params.id, status));
});

// GET /api/teams/:id/suggested-members   (leader only)
router.get('/:id/suggested-members', async (req, res) => {
  res.json(await teams.suggestedMembers(req.user.id, req.params.id));
});

// POST /api/teams/:id/leave
router.post('/:id/leave', async (req, res) => {
  res.json(await teams.leaveTeam(req.user.id, req.params.id));
});

module.exports = router;
