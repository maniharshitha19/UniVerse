import { useState, useCallback, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, Alert, StyleSheet } from 'react-native';
import { List, Button, Divider, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getItems, normalizeNotification } from '../../api/mappers';
import { useRealtime } from '../../context/RealtimeContext';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

// Where tapping a notification should take you.
function openTarget(navigation, data) {
  if (data.conversationId) {
    navigation.navigate('Chat', { conversationId: data.conversationId, title: 'Chat' });
  } else if (data.postId) {
    navigation.navigate('PostDetail', { postId: data.postId });
  } else if (data.teamId) {
    navigation.navigate('TeamDetail', { teamId: data.teamId });
  } else if (data.listingId) {
    navigation.navigate('ListingDetail', { listingId: data.listingId });
  }
}

export default function NotificationsScreen({ navigation }) {
  const theme = useTheme();
  const { socket, refreshUnread } = useRealtime();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get('/api/notifications');
      setItems(getItems(res).map(normalizeNotification));
      refreshUnread();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [refreshUnread]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // A new notification arrives while this screen is open.
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('notification:new', load);
    return () => {
      socket.off('notification:new', load);
    };
  }, [socket, load]);

  const markAllRef = useRef();
  markAllRef.current = async () => {
    try {
      await client.patch('/api/notifications/read-all');
      setItems((list) => list.map((n) => ({ ...n, read: true })));
      refreshUnread();
    } catch (err) {
      Alert.alert('Could not update', getErrorMessage(err));
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button compact onPress={() => markAllRef.current()}>
          Mark all read
        </Button>
      ),
    });
  }, [navigation]);

  const open = async (item) => {
    if (!item.read) {
      setItems((list) => list.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      client.patch(`/api/notifications/${item.id}/read`).then(refreshUnread).catch(() => {});
    }
    openTarget(navigation, item.data);
  };

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
      data={items}
      keyExtractor={(item) => String(item.id)}
      ItemSeparatorComponent={Divider}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
      }
      ListEmptyComponent={
        <EmptyView
          icon="bell-outline"
          title="You're all caught up"
          text="Likes, comments, team requests and messages will show up here."
        />
      }
      renderItem={({ item }) => (
        <List.Item
          title={item.title}
          titleStyle={item.read ? undefined : styles.bold}
          description={item.body ? `${item.body}\n${item.time}` : item.time}
          descriptionNumberOfLines={3}
          style={item.read ? undefined : { backgroundColor: theme.colors.primaryContainer }}
          left={(props) => (
            <List.Icon {...props} icon={item.read ? 'bell-outline' : 'bell-ring'} />
          )}
          onPress={() => open(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
});
