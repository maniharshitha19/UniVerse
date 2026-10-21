import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button, ProgressBar, useTheme } from 'react-native-paper';

export default function TeamCard({ team }) {
  const theme = useTheme();
  const [requested, setRequested] = useState(false);

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
          {team.skills.map((skill) => (
            <Chip
              key={skill}
              compact
              style={{ backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary, fontSize: 12 }}
            >
              {skill}
            </Chip>
          ))}
        </View>

        <ProgressBar
          progress={team.filled / team.total}
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
            onPress={() => setRequested(!requested)}
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
