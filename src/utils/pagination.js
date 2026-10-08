// Shared "page" and "limit" handling for list endpoints (?page=2&limit=20).
const { z } = require('zod');

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function toSkipTake({ page, limit }) {
  return { skip: (page - 1) * limit, take: limit };
}

function paginated(items, total, { page, limit }) {
  return { items, page, limit, total, hasMore: page * limit < total };
}

module.exports = { paginationSchema, toSkipTake, paginated };
