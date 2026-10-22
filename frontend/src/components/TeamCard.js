import { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button, ProgressBar, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../api/client';

export default function TeamCard({ team }) {
  const theme = useTheme();
  const [requested, setRequested] = useState(team.requested);
  const [sending, setSending] = useState(false);

  const sendRequest = async () => {
    setSending(true);
    try {
      await client.post(`/api/teams/${team.id}/requests`, {});
      setRequested(true);
    } catch (error) {
      Alert.alert('Could not send request', getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
          {team.event}
        </Text>
        <Text variant="titleSmall" numberOfLines={2} style={styles.title}>
          {team.title}
        </Text>
        <Text variant="bodySmall" style={styles.owner}>
          Posted by {team.owner}
        </Text>

        <View style={styles.chips}>
          {team.skills.map((skill) => {
            // Skills that match your own profile are highlighted.
            const isMatch = team.matched.includes(skill);
            return (
              <Chip
                key={skill}
                compact
                style={{
                  backgroundColor: isMatch
                    ? theme.colors.primary
                    : theme.colors.primaryContainer,
                }}
                textStyle={{
                  color: isMatch ? '#FFFFFF' : theme.colors.primary,
                  fontSize: 12,
                }}
              >
                {skill}
              </Chip>
            );
          })}
        </View>

        <ProgressBar
          progress={Math.min(team.filled / team.total, 1)}
          color={theme.colors.primary}
          style={styles.progress}
        />
        <View style={styles.footer}>
          <Text variant="bodySmall">
            {team.filled} of {team.total} joined
          </Text>
          <Button
            mode={requested ? 'outlined' : 'contained'}
            compact
            loading={sending}
            disabled={requested || sending}
            onPress={sendRequest}
          >
            {requested ? 'Requested' : 'Request'}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: 280 },
  title: { fontWeight: '700', marginTop: 4, minHeight: 40 },
  owner: { opacity: 0.7, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  progress: { height: 6, borderRadius: 3, marginTop: 16 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});
