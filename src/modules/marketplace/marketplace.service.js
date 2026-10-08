// ============================================================
//  Marketplace: students buy/sell books, gadgets, lab coats...
// ============================================================
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../utils/httpError');
const { userPublic } = require('../../utils/common');
const { toSkipTake, paginated } = require('../../utils/pagination');
const { notify } = require('../notifications/notifications.service');
const chat = require('../chat/chat.service');

const include = { seller: { select: userPublic } };

const format = (listing, viewerId) => ({ ...listing, isMine: listing.sellerId === viewerId });

async function listListings(viewerId, { category, search, status, minPrice, maxPrice, mine, ...page }) {
  const where = {
    // By default hide SOLD items, unless a status is asked for.
    status: status ?? { not: 'SOLD' },
    ...(category && { category }),
    ...(mine && { sellerId: viewerId }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) },
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.listing.findMany({ where, include, orderBy: { createdAt: 'desc' }, ...toSkipTake(page) }),
    prisma.listing.count({ where }),
  ]);
  return paginated(items.map((l) => format(l, viewerId)), total, page);
}

async function getListing(viewerId, id) {
  const listing = await prisma.listing.findUnique({ where: { id }, include });
  if (!listing) throw new HttpError(404, 'Listing not found');
  return format(listing, viewerId);
}

async function createListing(userId, data) {
  const listing = await prisma.listing.create({ data: { ...data, sellerId: userId }, include });
  return format(listing, userId);
}

async function assertSeller(user, id) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new HttpError(404, 'Listing not found');
  if (listing.sellerId !== user.id && user.role !== 'ADMIN') {
    throw new HttpError(403, 'Only the seller can change this listing');
  }
  return listing;
}

// Edit details, or mark as RESERVED / SOLD.
async function updateListing(user, id, data) {
  await assertSeller(user, id);
  const listing = await prisma.listing.update({ where: { id }, data, include });
  return format(listing, user.id);
}

async function deleteListing(user, id) {
  await assertSeller(user, id);
  await prisma.listing.delete({ where: { id } });
  return { ok: true };
}

// "I'm interested" -> opens a DM with the seller and sends the first message.
async function contactSeller(buyerId, id, message) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new HttpError(404, 'Listing not found');
  if (listing.sellerId === buyerId) throw new HttpError(400, 'This is your own listing');
  if (listing.status === 'SOLD') throw new HttpError(400, 'This item is already sold');

  const conversation = await chat.getOrCreateDirect(buyerId, listing.sellerId);
  const sent = await chat.sendMessage(
    buyerId,
    conversation.id,
    message || `Hi! Is "${listing.title}" still available?`,
  );
  await notify(listing.sellerId, {
    type: 'MARKETPLACE_INTEREST',
    title: 'Someone is interested',
    body: `${sent.sender.name} is interested in "${listing.title}"`,
    data: { listingId: id, conversationId: conversation.id },
  });
  return chat.getConversation(buyerId, conversation.id);
}

module.exports = { listListings, getListing, createListing, updateListing, deleteListing, contactSeller };
