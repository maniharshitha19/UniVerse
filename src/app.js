// ============================================================
//  The Express app: all the "doors" (routes) into the backend.
// ============================================================
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors()); // allow the mobile app to call us
app.use(express.json({ limit: '1mb' })); // read JSON bodies
if (!env.isProduction) app.use(morgan('dev')); // print each request in the terminal

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'UniVerse backend', time: new Date().toISOString() });
});

// 🧪 Testing helpers — only on your laptop, never in production
if (!env.isProduction) {
  app.use('/api/dev', require('./modules/dev/dev.routes'));
  app.get('/dev/chat-tester', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'chat-tester.html'));
  });
}

// ---- Person B's routes go here (auth, profiles, events, clubs) ----
// app.use('/api/auth', require('./modules/auth/auth.routes'));

// ---- Person C: Social & Communication + Team Finder ----
app.use('/api/posts', require('./modules/feed/feed.routes'));
app.use('/api/marketplace', require('./modules/marketplace/marketplace.routes'));
app.use('/api/conversations', require('./modules/chat/chat.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/teams', require('./modules/teams/teams.routes'));
app.use('/api/uploads', require('./modules/uploads/uploads.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
