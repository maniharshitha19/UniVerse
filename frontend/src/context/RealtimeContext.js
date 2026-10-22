import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import client from '../api/client';
import { API_URL } from '../config';
import { useAuth } from './AuthContext';
import { getItems, parseCount } from '../api/mappers';

const RealtimeContext = createContext(null);

// Keeps one live connection to the backend (for chat and notifications)
// and the unread counters shown on the dashboard badges.
export function RealtimeProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await client.get('/api/notifications/unread-count');
      setUnread(parseCount(res.data));
    } catch (error) {
      setUnread(0);
    }
  }, []);

  const refreshChatUnread = useCallback(async () => {
    try {
      const res = await client.get('/api/conversations');
      const total = getItems(res).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      setChatUnread(total);
    } catch (error) {
      setChatUnread(0);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setUnread(0);
      setChatUnread(0);
      return undefined;
    }
    const s = io(API_URL, { auth: { token }, transports: ['websocket'] });
    setSocket(s);
    refreshUnread();
    refreshChatUnread();
    s.on('notification:new', refreshUnread);
    s.on('message:new', refreshChatUnread);
    return () => {
      s.disconnect();
    };
  }, [token, refreshUnread, refreshChatUnread]);

  const value = useMemo(
    () => ({ socket, unread, chatUnread, refreshUnread, refreshChatUnread }),
    [socket, unread, chatUnread, refreshUnread, refreshChatUnread]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
