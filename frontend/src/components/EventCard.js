import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Avatar } from 'react-native-paper';

export default function EventCard({ event }) {
  const [registered, setRegistered] = useState(false);

  return (
    <Card style={styles.card}>
      <View style={[styles.banner, { backgroundColor: event.color }]}>
        <Avatar.Icon
          size={44}
          icon={event.icon}
          color="#FFFFFF"
          style={styles.bannerIcon}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{event.category}</Text>
        </View>
      </View>
      <Card.Content style={styles.content}>
        <Text variant="titleSmall" numberOfLines={2} style={styles.title}>
          {event.title}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {event.date} at {event.time}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {event.location}
        </Text>
        <Button
          mode={registered ? 'outlined' : 'contained'}
          icon={registered ? 'check' : undefined}
          compact
          style={styles.button}
          onPress={() => setRegistered(!registered)}
        >
          {registered ? 'Registered' : 'Register'}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: 240 },
  banner: {
    height: 96,
    padding: 12,
    justifyContent: 'flex-end',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bannerIcon: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2B2B36' },
  content: { paddingTop: 12 },
  title: { fontWeight: '700', minHeight: 40 },
  meta: { marginTop: 4, opacity: 0.7 },
  button: { marginTop: 16 },
});
