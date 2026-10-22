import Constants from 'expo-constants';

// Normally you don't need to touch this. While `npx expo start` is running, Expo
// knows your laptop's address (like 192.168.29.107), and the backend runs on that
// same laptop on port 4000.
//
// If the app can't find the backend, type your laptop's address here instead,
// for example: 'http://192.168.29.107:4000'
const MANUAL_API_URL = null;

function guessApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : null;
  return host ? `http://${host}:4000` : 'http://localhost:4000';
}

export const API_URL = MANUAL_API_URL ?? guessApiUrl();
