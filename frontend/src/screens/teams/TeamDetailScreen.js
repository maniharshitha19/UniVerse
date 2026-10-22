import { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, Alert, StyleSheet } from 'react-native';
import { Text, Chip, Button, ProgressBar, List, Avatar, IconButton, Divider, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getData, getItems, normalizeTeam, normalizeUser, initials } from '../../api/mappers';
import { useAuth } from '../../context/AuthContext';
import MessageDialog from '../../components/MessageDialog';
import { LoadingView, ErrorView } from '../../components/StateViews';

export default function TeamDetailScreen({ navigation, route }) {
  const { teamId } = route.params;
  const theme = useTheme();
  const { userId } = useAuth();
  const [team, setTeam] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get(`/api/teams/${teamId}`);
      const data = getData(res);
      const t = normalizeTeam(data.team ?? data);
      setTeam(t);
      if (t.leaderId && t.leaderId === userId) {
        client
          .get(`/api/teams/${teamId}/suggested-members`)
          .then((r) => setSuggested(getItems(r).map(normalizeUser)))
          .catch(() => setSuggested([]));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [teamId, userId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Runs an action, shows any error, then reloads the team.
  const run = async (action, { goBackAfter = false } = {}) => {
    setBusy(true);
    try {
      await action();
      if (goBackAfter) navigation.goBack();
      else await load();
    } catch (err) {
      Alert.alert('Something went wrong', getErrorMessage(err));
    } finally {
      setBusy(false);
      setDialog(false);
    }
  };

  const confirm = (title, message, onYes) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: onYes },
    ]);

  const messageUser = async (otherId, name) => {
    try {
      const res = await client.post('/api/conversations/direct', { userId: otherId });
      const data = getData(res);
      const id = data?.conversation?.id ?? data?.id;
      if (id) navigation.navigate('Chat', { conversationId: id, title: name });
    } catch (err) {
      Alert.alert('Could not open chat', getErrorMessage(err));
    }
  };

  if (loading) return <LoadingView />;
  if (error || !team) return <ErrorView message={error || 'Team not found.'} onRetry={load} />;

  const isLeader = Boolean(team.leaderId) && team.leaderId === userId;
  const isMember = isLeader || team.members.some((m) => m.id === userId) || Boolean(team.conversationId);
  const isOpen = team.status === 'OPEN';
  const pending = team.myRequest?.status === 'PENDING';

  const openChat = () =>
    navigation.navigate('Chat', { conversationId: team.conversationId, title: team.title });

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
        {team.event}
      </Text>
      <Text variant="headlineSmall" style={styles.title}>
        {team.title}
      </Text>
      <View style={styles.row}>
        <Chip compact>{isOpen ? 'Open' : 'Closed'}</Chip>
        <Text variant="bodySmall" style={styles.muted}>
          Led by {team.owner}
        </Text>
      </View>

      {team.description ? (
        <Text variant="bodyMedium" style={styles.description}>
          {team.description}
        </Text>
      ) : null}

      <Text variant="titleSmall" style={styles.section}>
        Skills needed
      </Text>
      <View style={styles.chips}>
        {team.skills.length === 0 ? (
          <Text variant="bodySmall" style={styles.muted}>
            No specific skills listed.
          </Text>
        ) : (
          team.skills.map((skill) => (
            <Chip
              key={skill}
              compact
              style={{ backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary }}
            >
              {skill}
            </Chip>
          ))
        )}
      </View>

      <ProgressBar
        progress={Math.min(team.filled / team.total, 1)}
        color={theme.colors.primary}
        style={styles.progress}
      />
      <Text variant="bodySmall" style={styles.muted}>
        {team.filled} of {team.total} spots filled
      </Text>

      {/* Actions for this person */}
      <View style={styles.actions}>
        {isLeader ? (
          <>
            <Button
              mode="contained"
              icon="account-multiple-check-outline"
              onPress={() => navigation.navigate('TeamRequests', { teamId, title: team.title })}
            >
              Review join requests
            </Button>
            {team.conversationId ? (
              <Button mode="outlined" icon="message-outline" onPress={openChat}>
                Open team chat
              </Button>
            ) : null}
            <Button
              mode="outlined"
              icon={isOpen ? 'lock-outline' : 'lock-open-outline'}
              disabled={busy}
              onPress={() =>
                run(() => client.patch(`/api/teams/${teamId}`, { status: isOpen ? 'CLOSED' : 'OPEN' }))
              }
            >
              {isOpen ? 'Close team' : 'Reopen team'}
            </Button>
            <Button
              mode="text"
              icon="delete-outline"
              textColor={theme.colors.error}
              disabled={busy}
              onPress={() =>
                confirm('Delete this team?', 'Its group chat will no longer be usable.', () =>
                  run(() => client.delete(`/api/teams/${teamId}`), { goBackAfter: true })
                )
              }
            >
              Delete team
            </Button>
          </>
        ) : isMember ? (
          <>
            {team.conversationId ? (
              <Button mode="contained" icon="message-outline" onPress={openChat}>
                Open team chat
              </Button>
            ) : null}
            <Button
              mode="outlined"
              icon="exit-run"
              disabled={busy}
              onPress={() =>
                confirm('Leave this team?', 'You can request to join again later.', () =>
                  run(() => client.post(`/api/teams/${teamId}/leave`), { goBackAfter: true })
                )
              }
            >
              Leave team
            </Button>
          </>
        ) : pending ? (
          <Button
            mode="outlined"
            icon="close"
            disabled={busy}
            onPress={() => run(() => client.delete(`/api/teams/requests/${team.myRequest.id}`))}
          >
            Cancel my request
          </Button>
        ) : isOpen ? (
          <Button mode="contained" icon="send-outline" disabled={busy} onPress={() => setDialog(true)}>
            Request to join
          </Button>
        ) : (
          <Text variant="bodyMedium" style={styles.muted}>
            This team is closed.
          </Text>
        )}
      </View>

      <Text variant="titleSmall" style={styles.section}>
        Members
      </Text>
      {team.members.length === 0 ? (
        <Text variant="bodySmall" style={styles.muted}>
          {isMember ? 'No members listed.' : 'Member list is visible to team members.'}
        </Text>
      ) : (
        team.members.map((m) => (
          <List.Item
            key={String(m.id)}
            title={m.name + (m.id === team.leaderId ? ' (leader)' : '')}
            description={m.skills.join(', ')}
            left={() => <Avatar.Text size={40} label={initials(m.name)} style={styles.avatar} />}
            right={() =>
              m.id !== userId ? (
                <IconButton icon="message-outline" onPress={() => messageUser(m.id, m.name)} />
              ) : null
            }
          />
        ))
      )}

      {isLeader && suggested.length > 0 ? (
        <>
          <Divider style={styles.divider} />
          <Text variant="titleSmall" style={styles.section}>
            Students who match your skills
          </Text>
          {suggested.map((s) => (
            <List.Item
              key={String(s.id)}
              title={s.name}
              description={s.skills.join(', ')}
              left={() => <Avatar.Text size={40} label={initials(s.name)} style={styles.avatar} />}
              right={() => (
                <IconButton icon="message-outline" onPress={() => messageUser(s.id, s.name)} />
              )}
            />
          ))}
        </>
      ) : null}

      <MessageDialog
        visible={dialog}
        title="Request to join"
        placeholder="Tell the leader why you'd be a great fit (optional)"
        confirmLabel="Send request"
        loading={busy}
        onDismiss={() => setDialog(false)}
        onConfirm={(message) =>
          run(() => client.post(`/api/teams/${teamId}/requests`, message ? { message } : {}))
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  title: { fontWeight: '700', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  muted: { opacity: 0.7 },
  description: { marginTop: 16, lineHeight: 22 },
  section: { marginTop: 24, marginBottom: 8, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  progress: { height: 6, borderRadius: 3, marginTop: 24, marginBottom: 8 },
  actions: { marginTop: 24, gap: 12 },
  avatar: { alignSelf: 'center' },
  divider: { marginTop: 24 },
});
