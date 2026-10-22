import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Chip, Button, useTheme } from 'react-native-paper';
import client from '../api/client';

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
  const muted = theme.colors.onSurfaceVariant;
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  // Keep in sync when the feed is refreshed from the backend.
  useEffect(() => {
    setLiked(post.liked);
    setLikeCount(post.likes);
  }, [post.liked, post.likes]);

  const toggleLike = async () => {
    const before = { liked, likeCount };
    // Update the screen instantly, then confirm with the backend.
    setLiked(!liked);
    setLikeCount(likeCount + (liked ? -1 : 1));
    try {
      const res = await client.post(`/api/posts/${post.id}/like`);
      const data = res.data?.data ?? res.data;
      if (typeof data?.liked === 'boolean') setLiked(data.liked);
      if (typeof data?.likeCount === 'number') setLikeCount(data.likeCount);
    } catch (error) {
      setLiked(before.liked);
      setLikeCount(before.likeCount);
    }
  };

  return (
    <Card>
      {post.imageUrl ? <Card.Cover source={{ uri: post.imageUrl }} /> : null}
      <Card.Content style={post.imageUrl ? styles.contentWithCover : undefined}>
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
              onPress={toggleLike}
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
  contentWithCover: { paddingTop: 16 },
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
