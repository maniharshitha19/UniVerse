import { useState, useCallback, useEffect } from 'react';
import { View, FlatList, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Text, TextInput, IconButton, Button, Divider, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getData, normalizePost } from '../../api/mappers';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/PostCard';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

export default function PostDetailScreen({ navigation, route }) {
  const { postId } = route.params;
  const theme = useTheme();
  const { userId, role } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get(`/api/posts/${postId}`);
      const data = getData(res);
      setPost(normalizePost(data.post ?? data));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [postId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const canDeletePost = post && (post.authorId === userId || role === 'ADMIN');

  useEffect(() => {
    navigation.setOptions({
      headerRight: canDeletePost
        ? () => (
            <IconButton
              icon="delete-outline"
              iconColor={theme.colors.error}
              onPress={confirmDeletePost}
            />
          )
        : undefined,
    });
  }, [navigation, canDeletePost]);

  const confirmDeletePost = () => {
    Alert.alert('Delete this post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/api/posts/${postId}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not delete', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const deleteComment = (commentId) => {
    Alert.alert('Delete comment?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/api/posts/comments/${commentId}`);
            load();
          } catch (err) {
            Alert.alert('Could not delete', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await client.post(`/api/posts/${postId}/comments`, {
        content: comment.trim(),
        isAnonymous: anonymous,
      });
      setComment('');
      await load();
    } catch (err) {
      Alert.alert('Could not post comment', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error || !post) return <ErrorView message={error || 'Post not found.'} onRetry={load} />;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={post.commentList}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <PostCard post={post} inDetail />
            <Text variant="titleMedium" style={styles.commentsTitle}>
              Comments ({post.commentList.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyView
            icon="comment-outline"
            title="No comments yet"
            text="Start the conversation below."
          />
        }
        ItemSeparatorComponent={Divider}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <View style={styles.commentBody}>
              <Text variant="titleSmall" style={styles.bold}>
                {item.author}{' '}
                <Text variant="bodySmall" style={styles.muted}>
                  {item.time}
                </Text>
              </Text>
              <Text variant="bodyMedium">{item.text}</Text>
            </View>
            {item.authorId && (item.authorId === userId || role === 'ADMIN') ? (
              <IconButton
                icon="delete-outline"
                size={20}
                onPress={() => deleteComment(item.id)}
              />
            ) : null}
          </View>
        )}
      />

      <View style={[styles.bar, { backgroundColor: theme.colors.surface }]}>
        <IconButton
          icon={anonymous ? 'incognito' : 'account-outline'}
          selected={anonymous}
          mode={anonymous ? 'contained-tonal' : undefined}
          onPress={() => setAnonymous(!anonymous)}
        />
        <TextInput
          mode="outlined"
          dense
          placeholder={anonymous ? 'Comment anonymously' : 'Add a comment'}
          value={comment}
          onChangeText={setComment}
          style={styles.input}
        />
        <Button compact loading={sending} disabled={sending || !comment.trim()} onPress={sendComment}>
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, paddingBottom: 24 },
  commentsTitle: { marginTop: 24, marginBottom: 8, fontWeight: '700' },
  comment: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  commentBody: { flex: 1 },
  bold: { fontWeight: '700' },
  muted: { opacity: 0.6 },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  input: { flex: 1, marginHorizontal: 4 },
});
