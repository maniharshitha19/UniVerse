import axios from 'axios';
import { API_URL } from '../config';

// The login token lives here after you sign in, and is attached to every request.
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

const client = axios.create({ baseURL: API_URL, timeout: 15000 });

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Turns any error into a short, friendly sentence you can show on screen.
export function getErrorMessage(error) {
  if (error?.response) {
    const data = error.response.data;
    const message =
      typeof data?.error === 'string'
        ? data.error
        : data?.error?.message ?? data?.message;
    return message || `Server error (${error.response.status})`;
  }
  if (error?.request) {
    return "Can't reach the server. Check that the backend is running and your phone is on the same Wi-Fi as your laptop.";
  }
  return error?.message || 'Something went wrong. Please try again.';
}

export default client;
