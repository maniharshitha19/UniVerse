const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');

const COORD = { id: true, name: true, avatarUrl: true };
const COUNTS = { _count: { select: { members: true, events: true } } };

async function getClubOrThrow(id) {
  const club = await prisma.club.findUnique({ where: { id } });
  if (!club) throw new HttpError(404, 'Club not found');
  return club;
}

// Only this club's coordinator (or an admin) may manage it.
function assertCanManage(club, user) {
  if (user.role !== 'ADMIN' && club.coordinatorId !== user.id) {
    throw new HttpError(403, "Only this club's coordinator can do this");
  }
}

async function listClubs({ search, page, limit }) {
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const [items, total] = await Promise.all([
    prisma.club.findMany({
      where, include: { coordinator: { select: COORD }, ...COUNTS },
      orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.club.count({ where }),
  ]);
  return { items, page, limit, total, hasMore: page * limit < total };
}

async function myClubs(userId) {
  return prisma.club.findMany({
    where: { members: { some: { userId } } },
    include: { coordinator: { select: COORD }, ...COUNTS },
    orderBy: { name: 'asc' },
  });
}

async function createClub(user, data) {
  try {
    return await prisma.club.create({
      data: { ...data, coordinatorId: user.id, members: { create: { userId: user.id } } },
    });
  } catch (e) {
    if (e.code === 'P2002') throw new HttpError(409, 'A club with this name already exists');
    throw e;
  }
}

async function getClub(id, userId) {
  const club = await prisma.club.findUnique({
    where: { id }, include: { coordinator: { select: COORD }, ...COUNTS },
  });
  if (!club) throw new HttpError(404, 'Club not found');
  const [membership, upcomingEvents] = await Promise.all([
    prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: id, userId } } }),
    prisma.event.findMany({
      where: { clubId: id, status: 'ACTIVE', startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' }, take: 5,
    }),
  ]);
  return { ...club, isMember: !!membership, upcomingEvents };
}

async function updateClub(id, user, data) {
  assertCanManage(await getClubOrThrow(id), user);
  try {
    return await prisma.club.update({ where: { id }, data });
  } catch (e) {
    if (e.code === 'P2002') throw new HttpError(409, 'A club with this name already exists');
    throw e;
  }
}

async function deleteClub(id, user) {
  assertCanManage(await getClubOrThrow(id), user);
  await prisma.club.delete({ where: { id } });
  return { ok: true };
}

async function joinClub(id, userId) {
  await getClubOrThrow(id);
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: id, userId } },
    update: {}, create: { clubId: id, userId },
  });
  return { joined: true };
}

async function leaveClub(id, userId) {
  const club = await getClubOrThrow(id);
  if (club.coordinatorId === userId) throw new HttpError(400, 'The coordinator cannot leave their own club');
  await prisma.clubMember.deleteMany({ where: { clubId: id, userId } });
  return { joined: false };
}

async function listMembers(id) {
  await getClubOrThrow(id);
  const rows = await prisma.clubMember.findMany({
    where: { clubId: id }, orderBy: { joinedAt: 'asc' },
    include: { user: { select: { id: true, name: true, avatarUrl: true, department: true, year: true } } },
  });
  return rows.map((r) => ({ ...r.user, joinedAt: r.joinedAt }));
}

module.exports = {
  assertCanManage, listClubs, myClubs, createClub, getClub,
  updateClub, deleteClub, joinClub, leaveClub, listMembers,
};