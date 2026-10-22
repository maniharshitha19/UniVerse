import { useState, useCallback, useEffect } from 'react';
import { FlatList, View, Alert, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getItems, normalizeRequest, humanize } from '../../api/mappers';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

// Requests I sent to join other people's teams.
export default function MyRequestsScreen({ navigation }) {
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get('/api/teams/requests/mine');
      setRequests(getItems(res).map(normalizeRequest));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const cancel = async (request) => {
    try {
      await client.delete(`/api/teams/requests/${request.id}`);
      setRequests((list) => list.filter((r) => r.id !== request.id));
    } catch (err) {
      Alert.alert('Could not cancel', getErrorMessage(err));
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      data={requests}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={
        <EmptyView
          icon="send-outline"
          title="No requests yet"
          text="Find a team you like and tap Request."
          actionLabel="Find teams"
          onAction={() => navigation.navigate('Main', { screen: 'Teams' })}
        />
      }
      renderItem={({ item }) => (
        <Card
          onPress={() => item.teamId && navigation.navigate('TeamDetail', { teamId: item.teamId })}
        >
          <Card.Content>
            <View style={styles.row}>
              <Text variant="titleSmall" style={styles.title} numberOfLines={2}>
                {item.teamTitle}
              </Text>
              <Chip compact>{humanize(item.status)}</Chip>
            </View>
            {item.message ? (
              <Text variant="bodySmall" style={styles.message}>
                "{item.message}"
              </Text>
            ) : null}
            {item.status === 'PENDING' ? (
              <Button style={styles.cancel} compact onPress={() => cancel(item)}>
                Cancel request
              </Button>
            ) : null}
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 48 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontWeight: '700' },
  message: { marginTop: 8, opacity: 0.7, fontStyle: 'italic' },
  cancel: { alignSelf: 'flex-start', marginTop: 8 },
});
