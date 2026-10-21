import { useState, useCallback } from 'react';
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

import {
  currentUser,
  quickActions,
  events,
  teams,
  categories,
  posts,
} from '../../api/mockData';
import SectionHeader from '../../components/SectionHeader';
import QuickActions from '../../components/QuickActions';
import EventCard from '../../components/EventCard';
import TeamCard from '../../components/TeamCard';
import PostCard from '../../components/PostCard';

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

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Later: fetch fresh data from the backend here. For now, fake a short wait.
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleQuickAction = (action) => {
    if (action.id === 'teammates') navigation.navigate('Teams');
    if (action.id === 'sell') navigation.navigate('Market');
    if (action.id === 'clubs') navigation.navigate('Events');
    // 'post' will open the create-post screen once we build it.
  };

  const q = query.trim().toLowerCase();
  const visiblePosts = posts.filter(
    (p) =>
      (selected === 'All' || p.category === selected) &&
      (q === '' ||
        p.text.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q))
  );

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
        {/* 1. Header: greeting, notifications, search */}
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
                Hi, {currentUser.name}
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <View>
                <IconButton
                  icon="bell-outline"
                  iconColor="#FFFFFF"
                  size={26}
                  onPress={() => {}}
                />
                <Badge size={16} style={styles.badge}>
                  3
                </Badge>
              </View>
              <Avatar.Text
                size={40}
                label={currentUser.name[0]}
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

        {/* 3. Happening soon */}
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
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TeamCard team={item} />}
          ItemSeparatorComponent={Gap}
          contentContainerStyle={styles.listPadding}
        />

        {/* 5. Campus feed with category filters */}
        <SectionHeader title="Campus feed" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.filterRow}
        >
          {categories.map((category) => {
            const active = selected === category;
            return (
              <Chip
                key={category}
                mode={active ? 'flat' : 'outlined'}
                onPress={() => setSelected(category)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: theme.colors.primary },
                ]}
                textStyle={active ? { color: '#FFFFFF' } : undefined}
              >
                {category}
              </Chip>
            );
          })}
        </ScrollView>

        <View style={styles.feed}>
          {visiblePosts.length > 0 ? (
            visiblePosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <View style={styles.emptyBox}>
              <Avatar.Icon
                size={64}
                icon="text-box-search-outline"
                color={theme.colors.primary}
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No posts match yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Try another category, or be the first to post here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Create"
        color="#FFFFFF"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
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
  filterRow: { paddingHorizontal: 16, paddingBottom: 8 },
  filterChip: { marginRight: 8 },
  feed: { paddingHorizontal: 16, marginTop: 8, gap: 12 },
  emptyBox: { alignItems: 'center', padding: 32 },
  emptyTitle: { marginTop: 16, fontWeight: '700' },
  emptyText: { marginTop: 4, textAlign: 'center', opacity: 0.7 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
