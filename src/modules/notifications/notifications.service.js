// Saves notifications in the database AND pushes them live over Socket.io.
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');
const { toSkipTake, paginated } = require('../../utils/pagination');
const { emitToUser } = require('../../socket');

// Never let a failed notification break the main action (like posting a comment).
async function notify(userId, { type, title, body, data }) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body, data },
    });
    emitToUser(userId, 'notification:new', notification);
    return notification;
  } catch (err) {
    console.error('Could not create notification:', err.message);
    return null;
  }
}

async function list(userId, { unreadOnly, ...page }) {
  const where = { userId, ...(unreadOnly && { isRead: false }) };
  const [items, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(page) }),
    prisma.notification.count({ where }),
  ]);
  return paginated(items, total, page);
}

async function unreadCount(userId) {
  const count = await prisma.notification.count({ where: { userId, isRead: false } });
  return { count };
}

async function markRead(userId, id) {
  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  if (!result.count) throw new HttpError(404, 'Notification not found');
  return { ok: true };
}

async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { ok: true, updated: result.count };
}

module.exports = { notify, list, unreadCount, markRead, markAllRead };
