import { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Text, TextInput, IconButton, Button, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getItems, getData, normalizeMessage } from '../../api/mappers';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingView, ErrorView } from '../../components/StateViews';

const PAGE = 30;

export default function ChatScreen({ route }) {
  const { conversationId } = route.params;
  const theme = useTheme();
  const { userId } = useAuth();
  const { socket, refreshChatUnread } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [typing, setTyping] = useState(false);
  const stopTimer = useRef(null);

  const markRead = useCallback(() => {
    client
      .post(`/api/conversations/${conversationId}/read`)
      .then(refreshChatUnread)
      .catch(() => {});
  }, [conversationId, refreshChatUnread]);

  const addMessage = useCallback((msg) => {
    setMessages((list) => (list.some((m) => m.id === msg.id) ? list : [...list, msg]));
  }, []);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get(`/api/conversations/${conversationId}/messages`, {
        params: { limit: PAGE },
      });
      const items = getItems(res).map(normalizeMessage);
      setMessages(items);
      setHasMore(res.data?.hasMore ?? items.length >= PAGE);
      markRead();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [conversationId, markRead]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const loadEarlier = async () => {
    const oldest = messages[0];
    if (!oldest) return;
    try {
      const res = await client.get(`/api/conversations/${conversationId}/messages`, {
        params: { before: oldest.createdAt, limit: PAGE },
      });
      const items = getItems(res).map(normalizeMessage);
      setMessages((list) => [...items, ...list]);
      setHasMore(res.data?.hasMore ?? items.length >= PAGE);
    } catch (err) {
      Alert.alert('Could not load', getErrorMessage(err));
    }
  };

  // Live updates: new messages and "typing..." from the other person.
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (payload) => {
      const msg = normalizeMessage(payload);
      if (msg.conversationId && msg.conversationId !== conversationId) return;
      addMessage(msg);
      if (msg.senderId !== userId) markRead();
    };
    const onTyping = (p) => {
      if (p.conversationId !== conversationId || p.userId === userId) return;
      setTyping(Boolean(p.isTyping));
    };
    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      clearTimeout(stopTimer.current);
    };
  }, [socket, conversationId, userId, addMessage, markRead]);

  const onChangeText = (value) => {
    setText(value);
    if (!socket) return;
    socket.emit('typing', { conversationId, isTyping: true });
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      socket.emit('typing', { conversationId, isTyping: false });
    }, 1500);
  };

  const send = () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    if (socket?.connected) {
      socket.emit('message:send', { conversationId, content }, (ack) => {
        if (ack?.ok && ack.message) addMessage(normalizeMessage(ack.message));
        else Alert.alert('Message not sent', ack?.error || 'Please try again.');
      });
    } else {
      // Backup route when the live connection is down.
      client
        .post(`/api/conversations/${conversationId}/messages`, { content })
        .then((res) => addMessage(normalizeMessage(getData(res))))
        .catch((err) => Alert.alert('Message not sent', getErrorMessage(err)));
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        inverted
        data={[...messages].reverse()}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          typing ? (
            <Text variant="bodySmall" style={styles.typing}>
              typing...
            </Text>
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <Button compact onPress={loadEarlier}>
              Load earlier messages
            </Button>
          ) : null
        }
        renderItem={({ item }) => {
          const mine = item.senderId === userId;
          return (
            <View
              style={[
                styles.bubble,
                mine
                  ? { alignSelf: 'flex-end', backgroundColor: theme.colors.primary }
                  : { alignSelf: 'flex-start', backgroundColor: theme.colors.surface },
              ]}
            >
              {!mine && item.senderName ? (
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                  {item.senderName}
                </Text>
              ) : null}
              <Text style={{ color: mine ? '#FFFFFF' : theme.colors.onSurface }}>{item.text}</Text>
            </View>
          );
        }}
      />

      <View style={[styles.bar, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          mode="outlined"
          dense
          multiline
          placeholder="Type a message"
          value={text}
          onChangeText={onChangeText}
          style={styles.input}
        />
        <IconButton
          icon="send"
          mode="contained"
          iconColor="#FFFFFF"
          containerColor={theme.colors.primary}
          disabled={!text.trim()}
          onPress={send}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 12, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  typing: { opacity: 0.6, marginLeft: 8, marginBottom: 4 },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  input: { flex: 1, maxHeight: 110 },
});
