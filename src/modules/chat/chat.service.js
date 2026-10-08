// ============================================================
//  Messaging: direct (1-to-1) chats and team group chats.
// ============================================================
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');
const { userPublic } = require('../../utils/common');
const { emitToUsers } = require('../../socket');

const conversationInclude = {
  members: { include: { user: { select: userPublic } } },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { sender: { select: userPublic } },
  },
};

// Only members may see or use a conversation.
async function assertMember(userId, conversationId) {
  if (!conversationId) throw new HttpError(400, 'conversationId is required');
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) throw new HttpError(404, 'Conversation not found');
  return member;
}

async function getMemberIds(userId, conversationId) {
  await assertMember(userId, conversationId);
  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

function countUnread(userId, conversationId, lastReadAt) {
  return prisma.message.count({
    where: { conversationId, createdAt: { gt: lastReadAt }, senderId: { not: userId } },
  });
}

// Shapes a conversation for the app. For DMs, the "name" is the other person's name.
function format(convo, userId, unreadCount) {
  const people = convo.members.map((m) => m.user);
  const other = people.find((p) => p.id !== userId);
  return {
    id: convo.id,
    type: convo.type,
    name: convo.type === 'DIRECT' ? other?.name ?? 'Unknown user' : convo.name,
    avatarUrl: convo.type === 'DIRECT' ? other?.avatarUrl ?? null : null,
    teamId: convo.teamId,
    members: people,
    lastMessage: convo.messages[0] ?? null,
    unreadCount,
    updatedAt: convo.updatedAt,
  };
}

async function listConversations(userId) {
  const convos = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: conversationInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return Promise.all(
    convos.map(async (c) => {
      const me = c.members.find((m) => m.userId === userId);
      return format(c, userId, await countUnread(userId, c.id, me.lastReadAt));
    }),
  );
}

async function getConversation(userId, conversationId) {
  const me = await assertMember(userId, conversationId);
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude,
  });
  return format(convo, userId, await countUnread(userId, conversationId, me.lastReadAt));
}

// Finds the DM between two people, or creates it the first time.
async function getOrCreateDirect(userId, otherUserId) {
  if (userId === otherUserId) throw new HttpError(400, "You can't message yourself");
  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!other) throw new HttpError(404, 'User not found');

  const directKey = [userId, otherUserId].sort().join('_');
  let convo = await prisma.conversation.findUnique({ where: { directKey } });
  if (!convo) {
    try {
      convo = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          directKey,
          members: { create: [{ userId }, { userId: otherUserId }] },
        },
      });
    } catch (err) {
      // Both people opened the chat at the same moment — use the one that won.
      if (err.code !== 'P2002') throw err;
      convo = await prisma.conversation.findUnique({ where: { directKey } });
    }
  }
  return getConversation(userId, convo.id);
}

// Loads older messages page by page (?before=<time of oldest loaded message>).
async function getMessages(userId, conversationId, { before, limit }) {
  await assertMember(userId, conversationId);
  const messages = await prisma.message.findMany({
    where: { conversationId, ...(before && { createdAt: { lt: before } }) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { sender: { select: userPublic } },
  });
  return messages.reverse(); // oldest first, like a chat screen
}

async function sendMessage(userId, conversationId, content) {
  const text = (content || '').trim();
  if (!text) throw new HttpError(400, 'Message cannot be empty');
  if (text.length > 2000) throw new HttpError(400, 'Message is too long (max 2000 characters)');
  await assertMember(userId, conversationId);

  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, content: text },
    include: { sender: { select: userPublic } },
  });
  await prisma.$transaction([
    // moves this chat to the top of everyone's list
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    // the sender has obviously "read" their own message
    prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: message.createdAt },
    }),
  ]);

  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  emitToUsers(members.map((m) => m.userId), 'message:new', message);
  return message;
}

async function markRead(userId, conversationId) {
  await assertMember(userId, conversationId);
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
  return { ok: true };
}

module.exports = {
  listConversations,
  getConversation,
  getOrCreateDirect,
  getMessages,
  sendMessage,
  markRead,
  getMemberIds,
};
