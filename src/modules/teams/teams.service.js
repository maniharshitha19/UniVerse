// ============================================================
//  Team Finder: post a team, others request to join,
//  the leader accepts/rejects, skill-based matching,
//  and an automatic group chat for every team.
// ============================================================
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');
const { userPublic, normalizeSkills } = require('../../utils/common');
const { toSkipTake, paginated } = require('../../utils/pagination');
const { notify } = require('../notifications/notifications.service');

const teamInclude = {
  owner: { select: userPublic },
  _count: { select: { members: true } },
};

function format(team, viewerId, extra = {}) {
  const { _count, ...rest } = team;
  return {
    ...rest,
    memberCount: _count.members,
    spotsLeft: Math.max(team.maxMembers - _count.members, 0),
    isOwner: team.ownerId === viewerId,
    ...extra,
  };
}

// Which of the team's needed skills does this person have?
function matchSkills(have = [], need = []) {
  const set = new Set(have);
  return need.filter((s) => set.has(s));
}

async function findTeamOr404(teamId) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new HttpError(404, 'Team not found');
  return team;
}

async function assertOwner(userId, teamId) {
  const team = await findTeamOr404(teamId);
  if (team.ownerId !== userId) throw new HttpError(403, 'Only the team leader can do this');
  return team;
}

// ---------- Creating & browsing ----------

// Creates the team, makes the creator the LEADER, and opens the team group chat.
async function createTeam(userId, data) {
  const team = await prisma.team.create({
    data: {
      ...data,
      skillsNeeded: normalizeSkills(data.skillsNeeded),
      ownerId: userId,
      members: { create: { userId, role: 'LEADER' } },
      conversation: {
        create: { type: 'GROUP', name: data.title, members: { create: { userId } } },
      },
    },
    include: { ...teamInclude, conversation: { select: { id: true } } },
  });
  const { conversation, ...rest } = team;
  return format(rest, userId, { isMember: true, conversationId: conversation.id });
}

async function listTeams(viewerId, { search, skill, status, ...page }) {
  const where = {
    status: status ?? 'OPEN',
    ...(skill && { skillsNeeded: { has: skill.trim().toLowerCase() } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { eventName: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const [teams, total] = await Promise.all([
    prisma.team.findMany({ where, include: teamInclude, orderBy: { createdAt: 'desc' }, ...toSkipTake(page) }),
    prisma.team.count({ where }),
  ]);
  return paginated(teams.map((t) => format(t, viewerId)), total, page);
}

async function getTeam(viewerId, teamId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      ...teamInclude,
      members: {
        orderBy: { joinedAt: 'asc' },
        include: { user: { select: { ...userPublic, skills: true } } },
      },
      conversation: { select: { id: true } },
    },
  });
  if (!team) throw new HttpError(404, 'Team not found');

  const { members, conversation, ...rest } = team;
  const isMember = members.some((m) => m.userId === viewerId);
  const myRequest = await prisma.teamRequest.findUnique({
    where: { teamId_userId: { teamId, userId: viewerId } },
    select: { id: true, status: true },
  });
  const pendingRequestCount =
    team.ownerId === viewerId
      ? await prisma.teamRequest.count({ where: { teamId, status: 'PENDING' } })
      : undefined;

  return format(rest, viewerId, {
    members: members.map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt })),
    isMember,
    myRequest, // null if I never asked to join
    pendingRequestCount,
    conversationId: isMember ? conversation?.id ?? null : null, // only members see the chat
  });
}

// Teams I lead or belong to.
async function myTeams(userId) {
  const teams = await prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: { ...teamInclude, conversation: { select: { id: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return teams.map(({ conversation, ...t }) =>
    format(t, userId, { isMember: true, conversationId: conversation?.id ?? null }),
  );
}

async function updateTeam(userId, teamId, data) {
  await assertOwner(userId, teamId);
  if (data.maxMembers !== undefined) {
    const count = await prisma.teamMember.count({ where: { teamId } });
    if (data.maxMembers < count) {
      throw new HttpError(400, `The team already has ${count} members`);
    }
  }
  if (data.skillsNeeded) data.skillsNeeded = normalizeSkills(data.skillsNeeded);

  const team = await prisma.team.update({ where: { id: teamId }, data, include: teamInclude });
  if (data.title) {
    await prisma.conversation.updateMany({ where: { teamId }, data: { name: data.title } });
  }
  return format(team, userId);
}

async function deleteTeam(userId, teamId) {
  await assertOwner(userId, teamId);
  await prisma.team.delete({ where: { id: teamId } }); // also deletes members, requests, chat
  return { ok: true };
}

// ---------- Join requests ----------

async function requestToJoin(userId, teamId, message) {
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: teamInclude });
  if (!team) throw new HttpError(404, 'Team not found');
  if (team.ownerId === userId) throw new HttpError(400, 'You lead this team');
  if (team.status !== 'OPEN') throw new HttpError(400, 'This team is no longer accepting members');
  if (team._count.members >= team.maxMembers) throw new HttpError(400, 'This team is full');

  const alreadyMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (alreadyMember) throw new HttpError(400, 'You are already in this team');

  const existing = await prisma.teamRequest.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (existing) {
    throw new HttpError(409, `You already sent a request (status: ${existing.status.toLowerCase()})`);
  }

  const request = await prisma.teamRequest.create({
    data: { teamId, userId, message },
    include: { user: { select: userPublic } },
  });
  await notify(team.ownerId, {
    type: 'TEAM_REQUEST',
    title: 'New join request',
    body: `${request.user.name} wants to join "${team.title}"`,
    data: { teamId, requestId: request.id },
  });
  return request;
}

// Leader sees who asked to join (with their skills, to decide).
async function listRequests(userId, teamId, status) {
  const team = await assertOwner(userId, teamId);
  const requests = await prisma.teamRequest.findMany({
    where: { teamId, ...(status && { status }) },
    include: { user: { select: { ...userPublic, skills: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return requests.map((r) => ({
    ...r,
    matchedSkills: matchSkills(r.user.skills, team.skillsNeeded),
  }));
}

// Requests I have sent, with each team's basic info.
async function myRequests(userId) {
  return prisma.teamRequest.findMany({
    where: { userId },
    include: { team: { include: teamInclude } },
    orderBy: { createdAt: 'desc' },
  });
}

// Leader accepts or rejects. Accepting also adds the person to the team chat,
// and closes the team automatically once it's full.
async function respondToRequest(userId, requestId, action) {
  const request = await prisma.teamRequest.findUnique({
    where: { id: requestId },
    include: {
      team: { include: { _count: { select: { members: true } }, conversation: { select: { id: true } } } },
    },
  });
  if (!request) throw new HttpError(404, 'Request not found');
  const { team } = request;
  if (team.ownerId !== userId) throw new HttpError(403, 'Only the team leader can respond');
  if (request.status !== 'PENDING') {
    throw new HttpError(400, `This request was already ${request.status.toLowerCase()}`);
  }

  if (action === 'reject') {
    await prisma.teamRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
    await notify(request.userId, {
      type: 'TEAM_REQUEST_REJECTED',
      title: 'Request declined',
      body: `Your request to join "${team.title}" was declined`,
      data: { teamId: team.id },
    });
    return { ok: true, status: 'REJECTED' };
  }

  if (team._count.members >= team.maxMembers) throw new HttpError(400, 'The team is already full');
  const nowFull = team._count.members + 1 >= team.maxMembers;

  // All-or-nothing: if any step fails, none of them happen.
  await prisma.$transaction(async (tx) => {
    await tx.teamRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
    await tx.teamMember.create({ data: { teamId: team.id, userId: request.userId } });
    if (team.conversation) {
      await tx.conversationMember.create({
        data: { conversationId: team.conversation.id, userId: request.userId },
      });
    }
    if (nowFull) await tx.team.update({ where: { id: team.id }, data: { status: 'CLOSED' } });
  });

  await notify(request.userId, {
    type: 'TEAM_REQUEST_ACCEPTED',
    title: "You're in! 🎉",
    body: `You joined "${team.title}". Say hi in the team chat!`,
    data: { teamId: team.id, conversationId: team.conversation?.id ?? null },
  });
  return { ok: true, status: 'ACCEPTED', teamClosed: nowFull };
}

async function cancelRequest(userId, requestId) {
  const request = await prisma.teamRequest.findUnique({ where: { id: requestId } });
  if (!request || request.userId !== userId) throw new HttpError(404, 'Request not found');
  if (request.status !== 'PENDING') throw new HttpError(400, 'Only pending requests can be cancelled');
  await prisma.teamRequest.delete({ where: { id: requestId } });
  return { ok: true };
}

async function leaveTeam(userId, teamId) {
  const team = await findTeamOr404(teamId);
  if (team.ownerId === userId) {
    throw new HttpError(400, 'The leader cannot leave. Delete the team instead.');
  }
  await prisma.$transaction([
    prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } }),
    prisma.conversationMember.deleteMany({ where: { conversation: { teamId }, userId } }),
    // lets them request again later if they want
    prisma.teamRequest.deleteMany({ where: { teamId, userId } }),
  ]);
  return { ok: true };
}

// ---------- Matching ----------

// Teams that need the skills I have, best match first.
async function recommendedTeams(userId) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { skills: true } });
  const mySkills = normalizeSkills(me?.skills ?? []);

  const teams = await prisma.team.findMany({
    where: {
      status: 'OPEN',
      ownerId: { not: userId },
      members: { none: { userId } },
      ...(mySkills.length && { skillsNeeded: { hasSome: mySkills } }),
    },
    include: teamInclude,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return teams
    .map((t) => {
      const matchedSkills = matchSkills(mySkills, t.skillsNeeded);
      return format(t, userId, { matchedSkills, matchScore: matchedSkills.length });
    })
    .filter((t) => t.spotsLeft > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);
}

// Students whose skills fit what the team needs (for the leader to invite/DM).
async function suggestedMembers(userId, teamId) {
  const team = await assertOwner(userId, teamId);
  if (!team.skillsNeeded.length) return [];

  const members = await prisma.teamMember.findMany({ where: { teamId }, select: { userId: true } });
  const users = await prisma.user.findMany({
    where: {
      id: { notIn: members.map((m) => m.userId) },
      skills: { hasSome: team.skillsNeeded },
    },
    select: { ...userPublic, skills: true },
    take: 50,
  });

  return users
    .map((u) => {
      const matchedSkills = matchSkills(u.skills, team.skillsNeeded);
      return { ...u, matchedSkills, matchScore: matchedSkills.length };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);
}

module.exports = {
  createTeam,
  listTeams,
  getTeam,
  myTeams,
  updateTeam,
  deleteTeam,
  requestToJoin,
  listRequests,
  myRequests,
  respondToRequest,
  cancelRequest,
  leaveTeam,
  recommendedTeams,
  suggestedMembers,
};
