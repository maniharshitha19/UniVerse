// ============================================================
//  Socket.io = the "always-open phone line" for live updates.
//
//  How it works:
//   - The app connects with its login token.
//   - Each user joins a private room called "user:<their id>".
//   - To reach someone live, we emit to their room (works on all their devices).
//
//  Events the APP SENDS:      message:send, typing, conversation:read
//  Events the APP LISTENS TO: message:new, typing, notification:new
// ============================================================
const { Server } = require('socket.io');
const { z, ZodError } = require('zod');
const { verifyToken } = require('../middleware/auth');
const { HttpError } = require('../utils/httpError');

let io = null;

const userRoom = (userId) => `user:${userId}`;

function emitToUser(userId, event, data) {
  if (io) io.to(userRoom(userId)).emit(event, data);
}

function emitToUsers(userIds, event, data) {
  if (io && userIds.length) io.to(userIds.map(userRoom)).emit(event, data);
}

const sendSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  // Check the login token before allowing a connection.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Loaded here (not at the top) to avoid a circular import with chat.service.
    const chat = require('../modules/chat/chat.service');
    const me = socket.user.id;
    socket.join(userRoom(me));

    // Send a chat message. The app gets a reply via the "ack" callback.
    socket.on('message:send', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const { conversationId, content } = sendSchema.parse(payload || {});
        const message = await chat.sendMessage(me, conversationId, content);
        reply({ ok: true, message });
      } catch (err) {
        if (!(err instanceof HttpError) && !(err instanceof ZodError)) console.error(err);
        reply({ ok: false, error: err instanceof HttpError ? err.message : 'Could not send message' });
      }
    });

    // "Rahul is typing..." indicator
    socket.on('typing', async ({ conversationId, isTyping } = {}) => {
      try {
        const memberIds = await chat.getMemberIds(me, conversationId);
        emitToUsers(
          memberIds.filter((id) => id !== me),
          'typing',
          { conversationId, userId: me, isTyping: Boolean(isTyping) },
        );
      } catch {
        /* ignore typing errors */
      }
    });

    // User opened the chat -> mark messages as read
    socket.on('conversation:read', async ({ conversationId } = {}, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        await chat.markRead(me, conversationId);
        reply({ ok: true });
      } catch {
        reply({ ok: false });
      }
    });
  });

  return io;
}

module.exports = { initSocket, emitToUser, emitToUsers };
