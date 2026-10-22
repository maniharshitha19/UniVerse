import { useState, useCallback, useEffect, useRef } from 'react';
import { FlatList, View, RefreshControl, StyleSheet } from 'react-native';
import { List, Avatar, Badge, Text, Divider, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getItems, normalizeConversation, initials } from '../../api/mappers';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

export default function ConversationsScreen({ navigation }) {
  const theme = useTheme();
  const { userId } = useAuth();
  const { socket, refreshChatUnread } = useRealtime();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get('/api/conversations');
      setChats(getItems(res).map((c) => normalizeConversation(c, userId)));
      refreshChatUnread();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [userId, refreshChatUnread]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Come back from a chat and the list (and unread counts) update.
  const reloadRef = useRef(load);
  reloadRef.current = load;
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reloadRef.current();
    });
    return unsubscribe;
  }, [navigation]);

  // A new message arrives while this screen is open.
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('message:new', load);
    return () => {
      socket.off('message:new', load);
    };
  }, [socket, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      data={chats}
      keyExtractor={(item) => String(item.id)}
      ItemSeparatorComponent={Divider}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
      }
      ListEmptyComponent={
        <EmptyView
          icon="message-outline"
          title="No chats yet"
          text="Message a teammate from a team page, or a seller from the marketplace."
        />
      }
      renderItem={({ item }) => (
        <List.Item
          title={item.title}
          titleStyle={item.unread > 0 ? styles.bold : undefined}
          description={item.preview}
          descriptionNumberOfLines={1}
          left={() =>
            item.isGroup ? (
              <Avatar.Icon size={44} icon="account-group" style={styles.avatar} />
            ) : (
              <Avatar.Text size={44} label={initials(item.title)} style={styles.avatar} />
            )
          }
          right={() => (
            <View style={styles.right}>
              <Text variant="bodySmall" style={styles.time}>
                {item.time}
              </Text>
              {item.unread > 0 ? <Badge>{String(item.unread)}</Badge> : null}
            </View>
          )}
          onPress={() =>
            navigation.navigate('Chat', { conversationId: item.id, title: item.title })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  avatar: { alignSelf: 'center', marginLeft: 8 },
  right: { alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  time: { opacity: 0.6 },
});
