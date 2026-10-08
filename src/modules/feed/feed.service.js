// ============================================================
//  Feed: posts by category, likes, comments, anonymous posting.
// ============================================================
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');
const { userPublic } = require('../../utils/common');
const { toSkipTake, paginated } = require('../../utils/pagination');
const { notify } = require('../notifications/notifications.service');

const postInclude = (viewerId) => ({
  author: { select: userPublic },
  likes: { where: { userId: viewerId }, select: { userId: true } }, // did *I* like it?
  _count: { select: { likes: true, comments: true } },
});

// Hides the author of anonymous posts/comments from everyone.
// (We still store who wrote it, so admins can act on abuse.)
function formatComment(comment, viewerId) {
  const { author, authorId, ...rest } = comment;
  return { ...rest, author: comment.isAnonymous ? null : author, isMine: authorId === viewerId };
}

function formatPost(post, viewerId) {
  const { author, authorId, likes, _count, comments, ...rest } = post;
  return {
    ...rest,
    author: post.isAnonymous ? null : author,
    isMine: authorId === viewerId,
    likedByMe: likes.length > 0,
    likeCount: _count.likes,
    commentCount: _count.comments,
    ...(comments && { comments: comments.map((c) => formatComment(c, viewerId)) }),
  };
}

async function listPosts(viewerId, { category, search, mine, ...page }) {
  const where = {
    ...(category && { category }),
    ...(search && { content: { contains: search, mode: 'insensitive' } }),
    ...(mine && { authorId: viewerId }),
  };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude(viewerId),
      orderBy: { createdAt: 'desc' },
      ...toSkipTake(page),
    }),
    prisma.post.count({ where }),
  ]);
  return paginated(posts.map((p) => formatPost(p, viewerId)), total, page);
}

async function createPost(userId, data) {
  const post = await prisma.post.create({
    data: { ...data, authorId: userId },
    include: postInclude(userId),
  });
  return formatPost(post, userId);
}

async function getPost(viewerId, postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      ...postInclude(viewerId),
      comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: userPublic } } },
    },
  });
  if (!post) throw new HttpError(404, 'Post not found');
  return formatPost(post, viewerId);
}

async function deletePost(user, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, 'Post not found');
  if (post.authorId !== user.id && user.role !== 'ADMIN') {
    throw new HttpError(403, 'You can only delete your own posts');
  }
  await prisma.post.delete({ where: { id: postId } });
  return { ok: true };
}

// Tap once = like, tap again = unlike.
async function toggleLike(userId, postId) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new HttpError(404, 'Post not found');

  const key = { userId_postId: { userId, postId } };
  const existing = await prisma.postLike.findUnique({ where: key });
  if (existing) {
    await prisma.postLike.delete({ where: key });
  } else {
    await prisma.postLike.create({ data: { userId, postId } });
    if (post.authorId !== userId) {
      const liker = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await notify(post.authorId, {
        type: 'POST_LIKE',
        title: 'New like',
        body: `${liker?.name ?? 'Someone'} liked your post`,
        data: { postId },
      });
    }
  }
  const likeCount = await prisma.postLike.count({ where: { postId } });
  return { liked: !existing, likeCount };
}

async function addComment(userId, postId, { content, isAnonymous }) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new HttpError(404, 'Post not found');

  const comment = await prisma.comment.create({
    data: { postId, authorId: userId, content, isAnonymous },
    include: { author: { select: userPublic } },
  });

  if (post.authorId !== userId) {
    const who = isAnonymous ? 'Someone' : comment.author.name;
    const snippet = content.length > 60 ? `${content.slice(0, 57)}...` : content;
    await notify(post.authorId, {
      type: 'POST_COMMENT',
      title: 'New comment',
      body: `${who} commented: "${snippet}"`,
      data: { postId, commentId: comment.id },
    });
  }
  return formatComment(comment, userId);
}

async function deleteComment(user, commentId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new HttpError(404, 'Comment not found');
  if (comment.authorId !== user.id && user.role !== 'ADMIN') {
    throw new HttpError(403, 'You can only delete your own comments');
  }
  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}

module.exports = { listPosts, createPost, getPost, deletePost, toggleLike, addComment, deleteComment };
