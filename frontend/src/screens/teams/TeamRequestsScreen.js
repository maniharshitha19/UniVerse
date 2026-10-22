import { useState, useCallback, useEffect } from 'react';
import { FlatList, View, Alert, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Button, Chip, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getItems, normalizeRequest, initials } from '../../api/mappers';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

// Shown to the team leader: accept or reject people who asked to join.
export default function TeamRequestsScreen({ route }) {
  const { teamId } = route.params;
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get(`/api/teams/${teamId}/requests`, {
        params: { status: 'PENDING' },
      });
      setRequests(getItems(res).map(normalizeRequest));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [teamId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const decide = async (request, action) => {
    setBusyId(request.id);
    try {
      await client.patch(`/api/teams/requests/${request.id}`, { action });
      setRequests((list) => list.filter((r) => r.id !== request.id));
    } catch (err) {
      Alert.alert('Could not update request', getErrorMessage(err));
    } finally {
      setBusyId(null);
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
          icon="account-multiple-check-outline"
          title="No pending requests"
          text="When students ask to join, you'll see them here."
        />
      }
      renderItem={({ item }) => (
        <Card>
          <Card.Content>
            <View style={styles.header}>
              <Avatar.Text size={44} label={initials(item.applicant?.name)} />
              <View style={styles.headerText}>
                <Text variant="titleSmall" style={styles.bold}>
                  {item.applicant?.name ?? 'Student'}
                </Text>
                <Text variant="bodySmall" style={styles.muted}>
                  {item.time}
                </Text>
              </View>
            </View>
            {item.message ? (
              <Text variant="bodyMedium" style={styles.message}>
                "{item.message}"
              </Text>
            ) : null}
            <View style={styles.chips}>
              {(item.applicant?.skills ?? []).map((s) => (
                <Chip
                  key={s}
                  compact
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                  textStyle={{ color: theme.colors.primary, fontSize: 12 }}
                >
                  {s}
                </Chip>
              ))}
            </View>
            <View style={styles.buttons}>
              <Button
                mode="outlined"
                disabled={busyId === item.id}
                onPress={() => decide(item, 'reject')}
              >
                Reject
              </Button>
              <Button
                mode="contained"
                loading={busyId === item.id}
                disabled={busyId === item.id}
                onPress={() => decide(item, 'accept')}
              >
                Accept
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  bold: { fontWeight: '700' },
  muted: { opacity: 0.6 },
  message: { marginTop: 12, fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
});
