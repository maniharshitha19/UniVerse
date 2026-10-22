import { createContext, useContext, useState } from 'react';
import client, { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // TEMPORARY: uses the backend's testing login (POST /api/dev/login).
  // When Person B's real login is ready, only this function changes.
  const login = async (email) => {
    const res = await client.post('/api/dev/login', { email });
    const data = res.data?.data ?? res.data;
    if (!data?.token) {
      throw new Error('The server did not return a login token.');
    }
    setAuthToken(data.token);
    setUser(data.user ?? { name: email.split('@')[0] });
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
