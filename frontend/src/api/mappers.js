// The backend and the screens don't always use the same field names.
// These helpers translate backend data into the shape our cards expect.
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

// List endpoints return { items, page, limit, total, hasMore }.
export function getItems(response) {
  const body = response.data;
  const list = Array.isArray(body)
    ? body
    : body?.items ?? body?.data?.items ?? body?.data;
  return Array.isArray(list) ? list : [];
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

export function normalizePost(raw) {
  // Anonymous posts come back with author: null.
  const anonymous = Boolean(raw.isAnonymous) || !raw.author;
  return {
    id: raw.id,
    author: anonymous ? 'Anonymous' : raw.author.name ?? 'Student',
    subtitle: anonymous ? 'Anonymous post' : raw.author.department ?? 'Student',
    category: categoryLabel[raw.category] ?? raw.category ?? 'General',
    time: timeAgo(raw.createdAt),
    text: raw.content ?? '',
    imageUrl: raw.imageUrl ?? null,
    likes: raw.likeCount ?? raw._count?.likes ?? 0,
    comments:
      raw.commentCount ?? raw._count?.comments ?? raw.comments?.length ?? 0,
    liked: Boolean(raw.liked ?? raw.likedByMe ?? raw.isLiked),
    anonymous,
  };
}

export function normalizeTeam(raw) {
  return {
    id: raw.id,
    event: raw.eventName || 'Open team',
    title: raw.title ?? 'Untitled team',
    owner: raw.leader?.name ?? raw.owner?.name ?? 'A student',
    skills: Array.isArray(raw.skillsNeeded) ? raw.skillsNeeded : [],
    matched: Array.isArray(raw.matchedSkills) ? raw.matchedSkills : [],
    filled: raw.memberCount ?? raw._count?.members ?? raw.members?.length ?? 1,
    total: raw.maxMembers ?? 4,
    requested: Boolean(raw.myRequest),
  };
}
