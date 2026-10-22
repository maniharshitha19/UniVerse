import { createContext, useContext, useMemo, useState } from 'react';
import client, { setAuthToken } from '../api/client';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Reads the user id and role out of the login token (no extra library needed).
export function decodeToken(token) {
  try {
    const part = token
      .split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/=+$/, '');
    let bits = '';
    for (let i = 0; i < part.length; i += 1) {
      bits += BASE64.indexOf(part[i]).toString(2).padStart(6, '0');
    }
    let json = '';
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      json += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
    }
    return JSON.parse(json);
  } catch (error) {
    return {};
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // TEMPORARY: uses the backend's testing login (POST /api/dev/login).
  // When Person B's real login is ready, only this function changes.
  const login = async (email) => {
    const res = await client.post('/api/dev/login', { email });
    const data = res.data?.data ?? res.data;
    if (!data?.token) {
      throw new Error('The server did not return a login token.');
    }
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user ?? { name: email.split('@')[0] });
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => {
    const payload = token ? decodeToken(token) : {};
    return {
      user,
      token,
      userId: payload.userId ?? user?.id ?? null,
      role: payload.role ?? user?.role ?? null,
      login,
      logout,
    };
  }, [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
