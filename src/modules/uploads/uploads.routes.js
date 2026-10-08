// ============================================================
//  Image upload -> Cloudinary. Returns a URL the app then puts in
//  a post (imageUrl) or a listing (imageUrls).
//  Optional: works only after you add Cloudinary keys to .env.
// ============================================================
const { Router } = require('express');
const { z } = require('zod');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const env = require('../../config/env');
const { requireAuth } = require('../../middleware/auth');
const { HttpError } = require('../../utils/httpError');

const { cloudName, apiKey, apiSecret } = env.cloudinary;
const isConfigured = Boolean(cloudName && apiKey && apiSecret);
if (isConfigured) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

// Keep the file in memory (Render deletes saved files), max 5 MB, images only.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new HttpError(400, 'Only image files are allowed')),
});

const router = Router();

// POST /api/uploads/image   (form-data: image=<file>, folder=posts|marketplace|avatars)
router.post('/image', requireAuth, upload.single('image'), async (req, res) => {
  if (!isConfigured) {
    throw new HttpError(503, 'Image uploads are not set up yet (add Cloudinary keys to .env)');
  }
  if (!req.file) throw new HttpError(400, 'Attach an image in the "image" field');

  const folder = z.enum(['posts', 'marketplace', 'avatars', 'misc']).default('misc').parse(req.body?.folder);
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `universe/${folder}`, resource_type: 'image' },
      (err, uploaded) => (err ? reject(err) : resolve(uploaded)),
    );
    stream.end(req.file.buffer);
  });

  res.status(201).json({ url: result.secure_url, width: result.width, height: result.height });
});

module.exports = router;
