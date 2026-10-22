const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');
const { assertCanManage } = require('../clubs/clubs.service');
const { notify } = require('../notifications/notifications.service');
const CLUB = { select: { id: true, name: true, logoUrl: true, coordinatorId: true } };
const REG_COUNT = { _count: { select: { registrations: true } } };

// Adds registeredCount and spotsLeft so the app doesn't have to calculate them.
const withCounts = ({ _count, ...e }) => ({
  ...e,
  registeredCount: _count.registrations,
  spotsLeft: e.capacity == null ? null : Math.max(0, e.capacity - _count.registrations),
});

async function listEvents({ clubId, search, upcoming, page, limit }) {
  const where = {
    status: 'ACTIVE',
    ...(clubId && { clubId }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...(upcoming && { startsAt: { gte: new Date() } }),
  };
  const [rows, total] = await Promise.all([
    prisma.event.findMany({
      where, include: { club: CLUB, ...REG_COUNT },
      orderBy: { startsAt: 'asc' }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.event.count({ where }),
  ]);
  return { items: rows.map(withCounts), page, limit, total, hasMore: page * limit < total };
}

async function getEvent(id, userId) {
  const event = await prisma.event.findUnique({ where: { id }, include: { club: CLUB, ...REG_COUNT } });
  if (!event) throw new HttpError(404, 'Event not found');
  const reg = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: id, userId } },
  });
  return { ...withCounts(event), isRegistered: !!reg };
}

async function createEvent(user, data) {
  const club = await prisma.club.findUnique({ where: { id: data.clubId } });
  if (!club) throw new HttpError(404, 'Club not found');
  assertCanManage(club, user);
  if (data.startsAt <= new Date()) throw new HttpError(400, 'Event must start in the future');
  if (data.endsAt && data.endsAt <= data.startsAt) throw new HttpError(400, 'End time must be after start time');

  const event = await prisma.event.create({ data: { ...data, createdById: user.id } });

  // Tell the club's members about the new event (the creator is skipped)
  const members = await prisma.clubMember.findMany({
    where: { clubId: club.id, userId: { not: user.id } },
    select: { userId: true },
  });
  await Promise.all(
    members.map((m) =>
      notify(m.userId, {
        type: 'NEW_EVENT',
        title: `New event in ${club.name}`,
        body: `${event.title} at ${event.venue}`,
        data: { eventId: event.id, clubId: club.id },
      }),
    ),
  );
  return event;
}

async function updateEvent(id, user, data) {
  const event = await prisma.event.findUnique({ where: { id }, include: { club: true, ...REG_COUNT } });
  if (!event) throw new HttpError(404, 'Event not found');
  assertCanManage(event.club, user);

  const taken = event._count.registrations;
  if (data.capacity != null && data.capacity < taken) {
    throw new HttpError(400, `${taken} students are already registered; capacity can't be lower`);
  }
  const startsAt = data.startsAt ?? event.startsAt;
  const endsAt = data.endsAt ?? event.endsAt;
  if (endsAt && endsAt <= startsAt) throw new HttpError(400, 'End time must be after start time');

  const updated = await prisma.event.update({ where: { id }, data });

  // If the event was just cancelled, tell everyone who registered
  if (data.status === 'CANCELLED' && event.status !== 'CANCELLED') {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      select: { userId: true },
    });
    await Promise.all(
      registrations.map((r) =>
        notify(r.userId, {
          type: 'EVENT_CANCELLED',
          title: 'Event cancelled',
          body: `"${event.title}" has been cancelled`,
          data: { eventId: id, clubId: event.clubId },
        }),
      ),
    );
  }
  return updated;
}

async function deleteEvent(id, user) {
  const event = await prisma.event.findUnique({ where: { id }, include: { club: true } });
  if (!event) throw new HttpError(404, 'Event not found');
  assertCanManage(event.club, user);
  await prisma.event.delete({ where: { id } });
  return { ok: true };
}

// ---------- Registration ----------

// The row lock (FOR UPDATE) makes concurrent requests wait their turn,
// so two students can never take the last seat at the same time.
async function register(eventId, user) {
  const event = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

    const event = await tx.event.findUnique({ where: { id: eventId }, include: REG_COUNT });
    if (!event) throw new HttpError(404, 'Event not found');
    if (event.status !== 'ACTIVE') throw new HttpError(400, 'This event has been cancelled');
    if (event.startsAt < new Date()) throw new HttpError(400, 'This event has already started');

    const already = await tx.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (already) throw new HttpError(409, 'You are already registered for this event');

    if (event.capacity != null && event._count.registrations >= event.capacity) {
      throw new HttpError(409, 'Sorry, this event is full');
    }
    await tx.eventRegistration.create({ data: { eventId, userId: user.id } });
    return event;
  });

  // Sent after the transaction succeeds, never inside it
  await notify(user.id, {
    type: 'EVENT_REGISTERED',
    title: "You're registered!",
    body: `You're registered for "${event.title}" at ${event.venue}`,
    data: { eventId },
  });
}

async function unregister(eventId, userId) {
  const { count } = await prisma.eventRegistration.deleteMany({ where: { eventId, userId } });
  if (!count) throw new HttpError(404, 'You are not registered for this event');
  return { registered: false };
}

// Organizer view: who has registered
async function listRegistrations(eventId, user) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { club: true } });
  if (!event) throw new HttpError(404, 'Event not found');
  assertCanManage(event.club, user);
  const rows = await prisma.eventRegistration.findMany({
    where: { eventId }, orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, email: true, department: true, year: true } } },
  });
  return { total: rows.length, items: rows.map((r) => ({ ...r.user, registeredAt: r.createdAt })) };
}

// Events I have registered for
async function myRegistrations(userId) {
  const rows = await prisma.eventRegistration.findMany({
    where: { userId },
    include: { event: { include: { club: CLUB, ...REG_COUNT } } },
  });
  return rows
    .map((r) => withCounts(r.event))
    .sort((a, b) => a.startsAt - b.startsAt);
}

module.exports = {
  listEvents, getEvent, createEvent, updateEvent, deleteEvent,
  register, unregister, listRegistrations, myRegistrations,
};