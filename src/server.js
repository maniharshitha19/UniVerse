// ============================================================
//  Starting point: runs Express (normal requests) and
//  Socket.io (live chat/notifications) on the same port.
// ============================================================
const http = require('http');
const env = require('./config/env');
const app = require('./app');
const { initSocket } = require('./socket');
const prisma = require('./lib/prisma');

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  console.log(`\n🚀 UniVerse backend running on http://localhost:${env.port}`);
  console.log(`   Health check:  http://localhost:${env.port}/health`);
  if (!env.isProduction) {
    console.log(`   Chat tester:   http://localhost:${env.port}/dev/chat-tester\n`);
  }
});

// Close the database connection cleanly when the server stops.
async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
