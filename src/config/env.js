// Reads settings from the .env file and checks the important ones exist.
require('dotenv').config({ quiet: true });

const required = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`\n❌ Missing in .env: ${missing.join(', ')}`);
  console.error('   Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv,
  isProduction: nodeEnv === 'production',
  jwtSecret: process.env.JWT_SECRET,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
