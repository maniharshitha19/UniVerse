# UniVerse Backend

Express + Socket.io + Prisma + PostgreSQL (Neon).

This repo is the **shared backend** for the whole team. It currently contains
**Person C's modules**: Feed, Marketplace, Messaging, Notifications, and Team Finder.
Person B adds their modules (auth, profiles, events, clubs) in `src/modules/`.

---

## 🚀 First-time setup

1. Open this folder in VS Code, then open a terminal (**Terminal → New Terminal**).
2. Install the libraries:
   ```
   npm install
   ```
3. Make a copy of `.env.example` and name the copy `.env`. Fill in the
   Neon connection strings and a `JWT_SECRET` (instructions are inside the file).
4. Create the tables in the database:
   ```
   npx prisma migrate dev --name init
   ```
5. (Optional) Add sample users, posts, listings and teams:
   ```
   npm run db:seed
   ```
6. Start the server:
   ```
   npm run dev
   ```
   Open http://localhost:4000/health and you should see `"status": "ok"`.

## 🧰 Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the server; it restarts itself when you save a file |
| `npm run db:studio` | Opens a website where you can see and edit the database tables |
| `npx prisma migrate dev --name <what-changed>` | Run after editing `prisma/schema.prisma` |
| `npm run db:seed` | Add sample data |

## 🧪 Testing without the mobile app

**Live chat:** open http://localhost:4000/dev/chat-tester in two browser windows
(one normal, one incognito). Log in as `aarav@test.com` in one and `rahul@test.com`
in the other, then chat. Notifications also show up live there.

**Everything else (Thunder Client in VS Code):**
1. `POST http://localhost:4000/api/dev/login` with JSON body `{ "email": "aarav@test.com" }`
2. Copy the `token` from the reply.
3. For every other request, open the **Auth** tab → **Bearer** and paste the token.

> `/api/dev/*` is a temporary testing login. It is switched off automatically when `NODE_ENV=production`.

---

## 🤝 Agreement with Person B (auth)

- Tokens are JWTs signed with the shared `JWT_SECRET`.
- The token payload is `{ userId, role }`.
- The app sends `Authorization: Bearer <token>`.
- The `User` table must keep the fields `id`, `name`, `avatarUrl`, `skills`, and `role`.
  Person B can add more fields.

Person B may replace `src/middleware/auth.js` as long as `requireAuth` still sets `req.user = { id, role }`.

## 📁 Folder structure

```
prisma/schema.prisma      ← all database tables
prisma/seed.js            ← sample data
src/server.js             ← starts everything
src/app.js                ← connects all the routes
src/socket/index.js       ← live events (chat, typing, notifications)
src/middleware/           ← login check + error handling
src/modules/<feature>/
    <feature>.routes.js   ← the URLs and input checks
    <feature>.service.js  ← the actual logic + database work
public/chat-tester.html   ← browser page for testing chat
```

---

## 📖 API reference (for Person A)

All routes below need `Authorization: Bearer <token>`. List endpoints accept
`?page=1&limit=20` and return `{ items, page, limit, total, hasMore }`.

### Feed: `/api/posts`
| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/posts` | `?category=ACADEMIC&search=exam&mine=true` |
| GET | `/api/posts/categories` | Returns the list of categories |
| POST | `/api/posts` | `{ content, category?, imageUrl?, isAnonymous? }` |
| GET | `/api/posts/:id` | Returns the post with its comments |
| DELETE | `/api/posts/:id` | Owner or admin only |
| POST | `/api/posts/:id/like` | Toggles like; returns `{ liked, likeCount }` |
| POST | `/api/posts/:id/comments` | `{ content, isAnonymous? }` |
| DELETE | `/api/posts/comments/:commentId` | Owner or admin only |

Categories: `GENERAL, ACADEMIC, EVENTS, OPPORTUNITIES, CLUBS, LOST_AND_FOUND, QUESTIONS`.
Anonymous posts and comments return `author: null`.

### Marketplace: `/api/marketplace`
| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/marketplace` | `?category=BOOKS&search=&minPrice=&maxPrice=&status=&mine=true` (SOLD items are hidden unless `status` is given) |
| GET | `/api/marketplace/options` | Categories, conditions, and statuses |
| POST | `/api/marketplace` | `{ title, description, price, category?, condition?, imageUrls? }` |
| GET | `/api/marketplace/:id` | |
| PATCH | `/api/marketplace/:id` | Any field, or `{ status: "SOLD" }` |
| DELETE | `/api/marketplace/:id` | |
| POST | `/api/marketplace/:id/contact` | `{ message? }`: opens a DM with the seller and sends the first message |

### Team Finder: `/api/teams`
| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/teams` | `?search=&skill=react&status=OPEN` |
| GET | `/api/teams/recommended` | Teams matching my skills (`matchedSkills`, `matchScore`) |
| GET | `/api/teams/mine` | Teams I lead or joined |
| POST | `/api/teams` | `{ title, description, eventName?, skillsNeeded[], maxMembers? }`: also creates a group chat |
| GET | `/api/teams/:id` | Includes `members`, `myRequest`, and `conversationId` (members only) |
| PATCH | `/api/teams/:id` | Leader only. Any field, or `{ status: "CLOSED" }` |
| DELETE | `/api/teams/:id` | Leader only |
| POST | `/api/teams/:id/requests` | `{ message? }` to ask to join |
| GET | `/api/teams/:id/requests` | Leader only. `?status=PENDING` |
| GET | `/api/teams/:id/suggested-members` | Leader only. Students whose skills match |
| POST | `/api/teams/:id/leave` | |
| GET | `/api/teams/requests/mine` | Requests I sent |
| PATCH | `/api/teams/requests/:requestId` | Leader only. `{ action: "accept" \| "reject" }` |
| DELETE | `/api/teams/requests/:requestId` | Cancel my pending request |

Accepting a request adds the person to the team's group chat. A team closes
automatically when it's full.

### Messaging: `/api/conversations`
| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/conversations` | My chats, newest first, each with `unreadCount` and `lastMessage` |
| POST | `/api/conversations/direct` | `{ userId }`: opens or creates a DM |
| GET | `/api/conversations/:id` | |
| GET | `/api/conversations/:id/messages` | `?before=<ISO date>&limit=30` (oldest first) |
| POST | `/api/conversations/:id/messages` | `{ content }` (backup; prefer the socket) |
| POST | `/api/conversations/:id/read` | |

### Notifications: `/api/notifications`
| Method | Path |
|---|---|
| GET | `/api/notifications?unreadOnly=true` |
| GET | `/api/notifications/unread-count` |
| PATCH | `/api/notifications/:id/read` |
| PATCH | `/api/notifications/read-all` |

Each notification has a `data` field (e.g. `{ postId }`, `{ teamId }`, `{ conversationId }`)
so the app knows which screen to open.

### Uploads: `/api/uploads`
`POST /api/uploads/image` takes form-data with `image` (the file) and `folder`
(`posts`, `marketplace`, `avatars`, or `misc`). It returns `{ url }`. This needs
the Cloudinary keys in `.env`.

### ⚡ Live events (Socket.io)
Connect with `io(SERVER_URL, { auth: { token } })`.

| App sends | Data | Reply |
|---|---|---|
| `message:send` | `{ conversationId, content }` | ack `{ ok, message }` or `{ ok: false, error }` |
| `typing` | `{ conversationId, isTyping }` | |
| `conversation:read` | `{ conversationId }` | ack `{ ok }` |

| App listens for | Data |
|---|---|
| `message:new` | The message, with `sender` |
| `typing` | `{ conversationId, userId, isTyping }` |
| `notification:new` | The notification |
