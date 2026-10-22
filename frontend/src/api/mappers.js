// The backend and the screens don't always use the same field names.
// These helpers translate backend data into the shape our screens expect.
// If a card shows something wrong, this is the one file to fix.

export const postCategories = [
  { value: 'ALL', label: 'All' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'OPPORTUNITIES', label: 'Opportunities' },
  { value: 'CLUBS', label: 'Clubs' },
  { value: 'QUESTIONS', label: 'Questions' },
  { value: 'LOST_AND_FOUND', label: 'Lost & found' },
  { value: 'GENERAL', label: 'General' },
];

const categoryLabel = Object.fromEntries(
  postCategories.map((c) => [c.value, c.label])
);

export const commonSkills = ['React', 'Node.js', 'Python', 'Java', 'SQL', 'Figma', 'UI/UX', 'ML'];

// ---------- small helpers ----------

export function getData(response) {
  return response.data?.data ?? response.data;
}

// List endpoints return { items, page, limit, total, hasMore }.
export function getItems(response) {
  const body = response.data;
  const list = Array.isArray(body)
    ? body
    : body?.items ?? body?.data?.items ?? body?.data;
  return Array.isArray(list) ? list : [];
}

export function parseCount(data) {
  const d = data?.data ?? data;
  if (typeof d === 'number') return d;
  return d?.count ?? d?.unreadCount ?? d?.unread ?? 0;
}

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function humanize(value) {
  if (!value) return '';
  const text = String(value).replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return `\u20B9${n.toLocaleString('en-IN')}`;
}

export function initials(name) {
  return String(name || '?')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function normalizeOptions(list, fallback) {
  const items = Array.isArray(list) && list.length > 0 ? list : fallback;
  return items.map((o) =>
    typeof o === 'string'
      ? { value: o, label: humanize(o) }
      : {
          value: o.value ?? o.id ?? o.name,
          label: o.label ?? humanize(o.value ?? o.name),
        }
  );
}

// ---------- people ----------

export function normalizeUser(raw) {
  if (!raw) return null;
  const u = raw.user ?? raw;
  return {
    id: u.id ?? raw.userId ?? null,
    name: u.name ?? 'Student',
    avatarUrl: u.avatarUrl ?? null,
    skills: Array.isArray(u.skills) ? u.skills : [],
    role: raw.role ?? u.role ?? null,
    matched: Array.isArray(raw.matchedSkills) ? raw.matchedSkills : [],
  };
}

// ---------- feed ----------

export function normalizeComment(raw) {
  const anonymous = Boolean(raw.isAnonymous) || !raw.author;
  return {
    id: raw.id,
    text: raw.content ?? '',
    author: anonymous ? 'Anonymous' : raw.author.name ?? 'Student',
    authorId: raw.authorId ?? raw.author?.id ?? raw.userId ?? null,
    anonymous,
    time: timeAgo(raw.createdAt),
  };
}

export function normalizePost(raw) {
  // Anonymous posts come back with author: null.
  const anonymous = Boolean(raw.isAnonymous) || !raw.author;
  const commentList = Array.isArray(raw.comments) ? raw.comments.map(normalizeComment) : [];
  return {
    id: raw.id,
    author: anonymous ? 'Anonymous' : raw.author.name ?? 'Student',
    authorId: raw.authorId ?? raw.author?.id ?? raw.userId ?? null,
    subtitle: anonymous ? 'Anonymous post' : raw.author.department ?? 'Student',
    category: categoryLabel[raw.category] ?? raw.category ?? 'General',
    time: timeAgo(raw.createdAt),
    text: raw.content ?? '',
    imageUrl: raw.imageUrl ?? null,
    likes: raw.likeCount ?? raw._count?.likes ?? 0,
    comments: raw.commentCount ?? raw._count?.comments ?? commentList.length,
    commentList,
    liked: Boolean(raw.liked ?? raw.likedByMe ?? raw.isLiked),
    anonymous,
  };
}

// ---------- teams ----------

export function normalizeTeam(input) {
  const raw = input.team ?? input;
  const members = (Array.isArray(raw.members) ? raw.members : []).map(normalizeUser);
  const leaderId =
    raw.leaderId ??
    raw.leader?.id ??
    raw.ownerId ??
    raw.creatorId ??
    members.find((m) => /lead|owner/i.test(m.role ?? ''))?.id ??
    null;
  const my = raw.myRequest;
  return {
    id: raw.id,
    event: raw.eventName || 'Open team',
    title: raw.title ?? 'Untitled team',
    description: raw.description ?? '',
    status: raw.status ?? 'OPEN',
    owner: raw.leader?.name ?? raw.owner?.name ?? 'A student',
    leaderId,
    skills: Array.isArray(raw.skillsNeeded) ? raw.skillsNeeded : [],
    matched: Array.isArray(raw.matchedSkills) ? raw.matchedSkills : [],
    filled: raw.memberCount ?? raw._count?.members ?? (members.length || 1),
    total: raw.maxMembers ?? 4,
    members,
    myRequest: my ? { id: my.id, status: my.status ?? 'PENDING' } : null,
    requested: Boolean(my),
    conversationId: raw.conversationId ?? raw.conversation?.id ?? null,
  };
}

export function normalizeRequest(raw) {
  const team = raw.team ?? null;
  return {
    id: raw.id,
    status: raw.status ?? 'PENDING',
    message: raw.message ?? '',
    time: timeAgo(raw.createdAt),
    applicant: normalizeUser(raw.user ?? raw.applicant ?? raw.requester),
    teamId: raw.teamId ?? team?.id ?? null,
    teamTitle: team?.title ?? 'Team',
  };
}

// ---------- marketplace ----------

export function normalizeListing(input) {
  const raw = input.listing ?? input;
  const seller = normalizeUser(raw.seller ?? raw.user ?? raw.owner);
  const images = Array.isArray(raw.imageUrls)
    ? raw.imageUrls
    : Array.isArray(raw.images)
    ? raw.images.map((i) => (typeof i === 'string' ? i : i.url))
    : [];
  return {
    id: raw.id,
    title: raw.title ?? 'Untitled',
    description: raw.description ?? '',
    price: Number(raw.price ?? 0),
    category: raw.category ?? '',
    condition: raw.condition ?? '',
    status: raw.status ?? 'AVAILABLE',
    images: images.filter(Boolean),
    seller,
    sellerId: raw.sellerId ?? raw.userId ?? seller?.id ?? null,
    time: timeAgo(raw.createdAt),
  };
}

// ---------- chat ----------

export function normalizeMessage(input) {
  const raw = input.message ?? input;
  return {
    id: raw.id ?? `${raw.createdAt}-${raw.content}`,
    conversationId: raw.conversationId ?? null,
    text: raw.content ?? '',
    senderId: raw.senderId ?? raw.sender?.id ?? null,
    senderName: raw.sender?.name ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeConversation(raw, myId) {
  const people = (raw.participants ?? raw.members ?? []).map((p) => p.user ?? p);
  const other = people.find((p) => p.id !== myId) ?? people[0];
  const isGroup = Boolean(raw.isGroup) || raw.type === 'GROUP' || raw.type === 'TEAM';
  const last = raw.lastMessage;
  return {
    id: raw.id,
    isGroup,
    title: raw.name ?? raw.title ?? (isGroup ? 'Group chat' : other?.name) ?? 'Chat',
    preview: last?.content ?? 'No messages yet',
    time: timeAgo(last?.createdAt ?? raw.updatedAt),
    unread: raw.unreadCount ?? 0,
  };
}

// ---------- notifications ----------

export function normalizeNotification(input) {
  const raw = input.notification ?? input;
  return {
    id: raw.id,
    type: raw.type ?? '',
    title: raw.title ?? humanize(raw.type) ?? 'Notification',
    body: raw.message ?? raw.body ?? raw.content ?? '',
    read: Boolean(raw.isRead ?? raw.read ?? raw.readAt),
    time: timeAgo(raw.createdAt),
    data: raw.data ?? {},
  };
}
