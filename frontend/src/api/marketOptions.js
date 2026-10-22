import client from './client';
import { getData, normalizeOptions } from './mappers';

const FALLBACK_CATEGORIES = ['BOOKS', 'ELECTRONICS', 'FURNITURE', 'CLOTHING', 'STATIONERY', 'OTHER'];
const FALLBACK_CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

// Asks the backend which marketplace categories and conditions exist.
// If that fails, a sensible default list is used so the screens still work.
export async function fetchMarketOptions() {
  try {
    const res = await client.get('/api/marketplace/options');
    const data = getData(res);
    return {
      categories: normalizeOptions(data?.categories, FALLBACK_CATEGORIES),
      conditions: normalizeOptions(data?.conditions, FALLBACK_CONDITIONS),
    };
  } catch (error) {
    return {
      categories: normalizeOptions(null, FALLBACK_CATEGORIES),
      conditions: normalizeOptions(null, FALLBACK_CONDITIONS),
    };
  }
}
