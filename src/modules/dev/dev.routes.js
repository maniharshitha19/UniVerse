// ============================================================
//  🧪 DEVELOPMENT-ONLY helpers (switched off in production).
//  Lets you test Person C features before Person B's login exists.
// ============================================================
const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../../lib/prisma');
const { signToken } = require('../../middleware/auth');
const { normalizeSkills } = require('../../utils/common');

const router = Router();

// POST /api/dev/login  { "email": "rahul@test.com", "name"?: "Rahul", "skills"?: ["react"] }
// Creates the user if new, and returns a token you can use for everything else.
router.post('/login', async (req, res) => {
  const body = z
    .object({
      email: z.string().trim().toLowerCase().email(),
      name: z.string().trim().min(1).max(80).optional(),
      skills: z.array(z.string()).max(20).optional(),
      role: z.enum(['STUDENT', 'COORDINATOR', 'ADMIN']).optional(),
    })
    .parse(req.body);

  const skills = body.skills ? normalizeSkills(body.skills) : undefined;
  const user = await prisma.user.upsert({
    where: { email: body.email },
    create: {
      email: body.email,
      name: body.name ?? body.email.split('@')[0],
      skills: skills ?? [],
      role: body.role ?? 'STUDENT',
    },
    update: {
      ...(body.name && { name: body.name }),
      ...(skills && { skills }),
      ...(body.role && { role: body.role }),
    },
  });
  res.json({ token: signToken(user), user });
});

// GET /api/dev/users  -> see everyone (to grab ids for testing DMs)
router.get('/users', async (req, res) => {
  res.json(
    await prisma.user.findMany({
      select: { id: true, name: true, email: true, skills: true, role: true },
      orderBy: { createdAt: 'asc' },
    }),
  );
});

module.exports = router;
