import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Searchbar,
  IconButton,
  Badge,
  Chip,
  FAB,
  Avatar,
  useTheme,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import client, { getErrorMessage } from '../../api/client';
import {
  postCategories,
  getItems,
  normalizePost,
  normalizeTeam,
  normalizeListing,
} from '../../api/mappers';
import { quickActions, events } from '../../api/mockData';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import SectionHeader from '../../components/SectionHeader';
import QuickActions from '../../components/QuickActions';
import EventCard from '../../components/EventCard';
import TeamCard from '../../components/TeamCard';
import PostCard from '../../components/PostCard';
import ListingCard from '../../components/ListingCard';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

const Gap = () => <View style={{ width: 12 }} />;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { unread, chatUnread, refreshUnread, refreshChatUnread } = useRealtime();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('ALL');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [teams, setTeams] = useState([]);
  const [listings, setListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setPostsError('');
      const params = {};
      if (selected !== 'ALL') params.category = selected;
      if (query.trim()) params.search = query.trim();
      const res = await client.get('/api/posts', { params });
      setPosts(getItems(res).map(normalizePost));
    } catch (error) {
      setPostsError(getErrorMessage(error));
    }
  }, [selected, query]);

  const fetchTeams = useCallback(async () => {
    try {
      // Teams that match my skills first; if none, show any open teams.
      let list = getItems(await client.get('/api/teams/recommended'));
      if (list.length === 0) {
        list = getItems(
          await client.get('/api/teams', { params: { status: 'OPEN' } })
        );
      }
      setTeams(list.map(normalizeTeam));
    } catch (error) {
      setTeams([]);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    try {
      const res = await client.get('/api/marketplace', { params: { limit: 6 } });
      setListings(getItems(res).map(normalizeListing).slice(0, 6));
    } catch (error) {
      setListings([]);
    }
  }, []);

  // Reload the feed when the category changes, or shortly after you stop typing.
  useEffect(() => {
    setPostsLoading(true);
    const timer = setTimeout(() => {
      fetchPosts().finally(() => setPostsLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  useEffect(() => {
    fetchTeams();
    fetchListings();
  }, [fetchTeams, fetchListings]);

  const reloadAll = useCallback(async () => {
    await Promise.all([
      fetchPosts(),
      fetchTeams(),
      fetchListings(),
      refreshUnread(),
      refreshChatUnread(),
    ]);
  }, [fetchPosts, fetchTeams, fetchListings, refreshUnread, refreshChatUnread]);

  // When you come back to this screen (for example after creating a post), refresh.
  const reloadRef = useRef(reloadAll);
  reloadRef.current = reloadAll;
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reloadRef.current();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reloadAll();
    setRefreshing(false);
  }, [reloadAll]);

  const handleQuickAction = (action) => {
    if (action.id === 'teammates') navigation.navigate('Teams');
    if (action.id === 'post') navigation.navigate('CreatePost');
    if (action.id === 'sell') navigation.navigate('CreateListing');
    if (action.id === 'clubs') navigation.navigate('Events');
  };

  const renderFeed = () => {
    if (postsLoading) return <LoadingView />;
    if (postsError) return <ErrorView message={postsError} onRetry={onRefresh} />;
    if (posts.length === 0) {
      return (
        <EmptyView
          title="No posts match yet"
          text="Try another category, or be the first to post here."
          actionLabel="Create a post"
          onAction={() => navigation.navigate('CreatePost')}
        />
      );
    }
    return posts.map((post) => <PostCard key={post.id} post={post} />);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {isFocused && <StatusBar style="light" />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* 1. Header: greeting, messages, notifications, search */}
        <LinearGradient
          colors={[theme.colors.primary, '#9B7BFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text variant="bodyMedium" style={styles.headerSub}>
                {getGreeting()}
              </Text>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Hi, {firstName}
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <View>
                <IconButton
                  icon="message-outline"
                  iconColor="#FFFFFF"
                  size={24}
                  onPress={() => navigation.navigate('Conversations')}
                />
                {chatUnread > 0 && (
                  <Badge size={16} style={styles.badge}>
                    {chatUnread > 99 ? '99+' : String(chatUnread)}
                  </Badge>
                )}
              </View>
              <View>
                <IconButton
                  icon="bell-outline"
                  iconColor="#FFFFFF"
                  size={24}
                  onPress={() => navigation.navigate('Notifications')}
                />
                {unread > 0 && (
                  <Badge size={16} style={styles.badge}>
                    {unread > 99 ? '99+' : String(unread)}
                  </Badge>
                )}
              </View>
              <Avatar.Text
                size={40}
                label={firstName[0].toUpperCase()}
                style={styles.headerAvatar}
              />
            </View>
          </View>

          <Searchbar
            placeholder="Search the campus feed"
            value={query}
            onChangeText={setQuery}
            elevation={0}
            style={styles.search}
          />
        </LinearGradient>

        {/* 2. Quick actions */}
        <QuickActions actions={quickActions} onPress={handleQuickAction} />

        {/* 3. Happening soon (still sample data until the events backend is ready) */}
        <SectionHeader
          title="Happening soon"
          onSeeAll={() => navigation.navigate('Events')}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          ItemSeparatorComponent={Gap}
          contentContainerStyle={styles.listPadding}
        />

        {/* 4. Teams looking for you */}
        <SectionHeader
          title="Teams looking for you"
          onSeeAll={() => navigation.navigate('Teams')}
        />
        {teams.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={teams}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <TeamCard team={item} />}
            ItemSeparatorComponent={Gap}
            contentContainerStyle={styles.listPadding}
          />
        ) : (
          <Text variant="bodyMedium" style={styles.noItems}>
            No open teams right now. Check back soon.
          </Text>
        )}

        {/* 5. Fresh on the marketplace */}
        <SectionHeader
          title="Fresh on the marketplace"
          onSeeAll={() => navigation.navigate('Market')}
        />
        {listings.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={listings}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ListingCard listing={item} width={160} />}
            ItemSeparatorComponent={Gap}
            contentContainerStyle={styles.listPadding}
          />
        ) : (
          <Text variant="bodyMedium" style={styles.noItems}>
            Nothing for sale yet. List something!
          </Text>
        )}

        {/* 6. Campus feed with category filters */}
        <SectionHeader title="Campus feed" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.filterRow}
        >
          {postCategories.map((category) => {
            const active = selected === category.value;
            return (
              <Chip
                key={category.value}
                mode={active ? 'flat' : 'outlined'}
                onPress={() => setSelected(category.value)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: theme.colors.primary },
                ]}
                textStyle={active ? { color: '#FFFFFF' } : undefined}
              >
                {category.label}
              </Chip>
            );
          })}
        </ScrollView>

        <View style={styles.feed}>{renderFeed()}</View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Create"
        color="#FFFFFF"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreatePost')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 112 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSub: { color: 'rgba(255,255,255,0.85)' },
  headerTitle: { color: '#FFFFFF', fontWeight: '700' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  badge: { position: 'absolute', top: 6, right: 6 },
  headerAvatar: { backgroundColor: 'rgba(255,255,255,0.25)', marginLeft: 4 },
  search: { marginTop: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  listPadding: { paddingHorizontal: 16, paddingBottom: 8 },
  noItems: { paddingHorizontal: 16, opacity: 0.7 },
  filterRow: { paddingHorizontal: 16, paddingBottom: 8 },
  filterChip: { marginRight: 8 },
  feed: { paddingHorizontal: 16, marginTop: 8, gap: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
