const { HttpError } = require('./httpError');

// Validates req.body/query with a zod schema; throws a 400 HttpError if invalid.
function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
    throw new HttpError(400, msg);
  }
  return result.data;
}

// Lets async route handlers pass errors to the error handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function paging(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit };
}

module.exports = { parse, wrap, paging };