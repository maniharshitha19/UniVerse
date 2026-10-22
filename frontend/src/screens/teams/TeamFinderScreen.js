import { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Searchbar, SegmentedButtons, Chip, FAB, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getItems, normalizeTeam, commonSkills } from '../../api/mappers';
import TabHeader from '../../components/TabHeader';
import TeamCard from '../../components/TeamCard';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

export default function TeamFinderScreen({ navigation, route }) {
  const theme = useTheme();
  const [segment, setSegment] = useState('discover');
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // The profile screen can open this tab straight on "My teams".
  useEffect(() => {
    if (route.params?.segment) {
      setSegment(route.params.segment);
      navigation.setParams({ segment: undefined });
    }
  }, [route.params?.segment, navigation]);

  const fetchTeams = useCallback(async () => {
    try {
      setError('');
      let res;
      if (segment === 'recommended') {
        res = await client.get('/api/teams/recommended');
      } else if (segment === 'mine') {
        res = await client.get('/api/teams/mine');
      } else {
        const params = { status: 'OPEN' };
        if (query.trim()) params.search = query.trim();
        if (skill) params.skill = skill.toLowerCase();
        res = await client.get('/api/teams', { params });
      }
      setTeams(getItems(res).map(normalizeTeam));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [segment, query, skill]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchTeams().finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTeams]);

  // Refresh when you come back to this tab (for example after creating a team).
  const reloadRef = useRef(fetchTeams);
  reloadRef.current = fetchTeams;
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reloadRef.current();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  };

  const emptyText = {
    discover: 'No open teams match. Try a different skill, or create your own.',
    recommended: 'Add skills to your profile and teams that match them will show up here.',
    mine: "You haven't created or joined any team yet.",
  }[segment];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <TabHeader title="Team finder" />
      <View style={styles.controls}>
        <SegmentedButtons
          value={segment}
          onValueChange={setSegment}
          buttons={[
            { value: 'discover', label: 'Discover' },
            { value: 'recommended', label: 'For you' },
            { value: 'mine', label: 'Mine' },
          ]}
        />
        {segment === 'discover' ? (
          <>
            <Searchbar
              placeholder="Search teams"
              value={query}
              onChangeText={setQuery}
              elevation={0}
              style={styles.search}
            />
            <View style={styles.skills}>
              {commonSkills.map((s) => (
                <Chip
                  key={s}
                  compact
                  mode={skill === s ? 'flat' : 'outlined'}
                  onPress={() => setSkill(skill === s ? null : s)}
                  style={skill === s && { backgroundColor: theme.colors.primary }}
                  textStyle={skill === s ? { color: '#FFFFFF' } : undefined}
                >
                  {s}
                </Chip>
              ))}
            </View>
          </>
        ) : null}
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={onRefresh} />
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <TeamCard team={item} fullWidth />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Gap}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyView
              icon="account-group-outline"
              title="No teams here"
              text={emptyText}
              actionLabel="Create a team"
              onAction={() => navigation.navigate('CreateTeam')}
            />
          }
        />
      )}

      <FAB
        icon="plus"
        label="Create team"
        color="#FFFFFF"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateTeam')}
      />
    </View>
  );
}

const Gap = () => <View style={{ height: 12 }} />;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { paddingHorizontal: 16, paddingBottom: 8 },
  search: { marginTop: 12, borderRadius: 16 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  list: { padding: 16, paddingBottom: 112 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
