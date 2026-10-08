// Catches every error in one place and turns it into a clear JSON reply.
const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const multer = require('multer');
const { HttpError } = require('../utils/httpError');

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Input didn't match what we expected (e.g. missing "content")
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Invalid input',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  // Errors we threw on purpose
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'This already exists' });
    if (err.code === 'P2003') return res.status(400).json({ error: 'A related record was not found' });
  }
  // File upload problems (too big, wrong field)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  // Broken JSON sent by the app
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  console.error('💥 Unexpected error:', err);
  res.status(500).json({ error: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
