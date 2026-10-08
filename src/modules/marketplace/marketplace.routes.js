const { Router } = require('express');
const { z } = require('zod');
const { ListingCategory, ListingCondition, ListingStatus } = require('@prisma/client');
const { requireAuth } = require('../../middleware/auth');
const { paginationSchema } = require('../../utils/pagination');
const { emptyToUndefined } = require('../../utils/common');
const market = require('./marketplace.service');

const router = Router();
router.use(requireAuth);

const categoryEnum = z.enum(Object.values(ListingCategory));
const conditionEnum = z.enum(Object.values(ListingCondition));
const statusEnum = z.enum(Object.values(ListingStatus));
const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional());

const listSchema = paginationSchema.extend({
  category: z.preprocess(emptyToUndefined, categoryEnum.optional()),
  status: z.preprocess(emptyToUndefined, statusEnum.optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  mine: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

// The fields of a listing (no defaults here, so edits never reset untouched fields).
const listingFields = {
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(1).max(2000),
  price: z.number().int().min(0).max(1000000),
  category: categoryEnum,
  condition: conditionEnum,
  imageUrls: z.array(z.string().url()).max(5),
};

const createSchema = z.object({
  ...listingFields,
  category: categoryEnum.default('OTHER'),
  condition: conditionEnum.default('GOOD'),
  imageUrls: listingFields.imageUrls.default([]),
});

// For edits every field is optional, plus the seller can change status.
const updateSchema = z
  .object({ ...listingFields, status: statusEnum })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Send at least one field to update');

// GET /api/marketplace?category=BOOKS&search=dbms&minPrice=100&maxPrice=500
router.get('/', async (req, res) => {
  res.json(await market.listListings(req.user.id, listSchema.parse(req.query)));
});

// GET /api/marketplace/options  -> categories/conditions for dropdowns
router.get('/options', (req, res) => {
  res.json({
    categories: Object.values(ListingCategory),
    conditions: Object.values(ListingCondition),
    statuses: Object.values(ListingStatus),
  });
});

// POST /api/marketplace
router.post('/', async (req, res) => {
  res.status(201).json(await market.createListing(req.user.id, createSchema.parse(req.body)));
});

// GET /api/marketplace/:id
router.get('/:id', async (req, res) => {
  res.json(await market.getListing(req.user.id, req.params.id));
});

// PATCH /api/marketplace/:id   e.g. { "status": "SOLD" }
router.patch('/:id', async (req, res) => {
  res.json(await market.updateListing(req.user, req.params.id, updateSchema.parse(req.body)));
});

// DELETE /api/marketplace/:id
router.delete('/:id', async (req, res) => {
  res.json(await market.deleteListing(req.user, req.params.id));
});

// POST /api/marketplace/:id/contact  { "message"?: "Can you do ₹300?" }
router.post('/:id/contact', async (req, res) => {
  const { message } = z
    .object({ message: z.string().trim().min(1).max(2000).optional() })
    .parse(req.body ?? {});
  res.status(201).json(await market.contactSeller(req.user.id, req.params.id, message));
});

module.exports = router;
