import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Chip, Button, useTheme } from 'react-native-paper';

function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PostCard({ post }) {
  const theme = useTheme();
  const [liked, setLiked] = useState(false);
  const muted = theme.colors.onSurfaceVariant;
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <Card>
      <Card.Content>
        <View style={styles.header}>
          {post.anonymous ? (
            <Avatar.Icon size={40} icon="incognito" style={styles.anonAvatar} />
          ) : (
            <Avatar.Text size={40} label={getInitials(post.author)} />
          )}
          <View style={styles.headerText}>
            <Text variant="titleSmall" style={styles.author}>
              {post.author}
            </Text>
            <Text variant="bodySmall" style={{ color: muted }}>
              {post.subtitle}, {post.time}
            </Text>
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.body}>
          {post.text}
        </Text>

        <View style={styles.footer}>
          <Chip
            compact
            style={{ backgroundColor: theme.colors.primaryContainer }}
            textStyle={{ color: theme.colors.primary, fontSize: 12 }}
          >
            {post.category}
          </Chip>
          <View style={styles.actions}>
            <Button
              compact
              icon={liked ? 'heart' : 'heart-outline'}
              textColor={liked ? '#E5484D' : muted}
              onPress={() => setLiked(!liked)}
            >
              {String(likeCount)}
            </Button>
            <Button compact icon="comment-outline" textColor={muted}>
              {String(post.comments)}
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  author: { fontWeight: '700' },
  anonAvatar: { backgroundColor: '#5B5870' },
  body: { marginTop: 12, lineHeight: 22 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  actions: { flexDirection: 'row' },
});
