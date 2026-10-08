// One shared database client for the whole server.
const { PrismaClient } = require('@prisma/client');

module.exports = new PrismaClient();
