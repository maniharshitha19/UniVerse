import { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, RefreshControl, useWindowDimensions, StyleSheet } from 'react-native';
import { Searchbar, Chip, FAB, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getItems, normalizeListing } from '../../api/mappers';
import { fetchMarketOptions } from '../../api/marketOptions';
import TabHeader from '../../components/TabHeader';
import ListingCard from '../../components/ListingCard';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

export default function MarketplaceScreen({ navigation }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 12) / 2;

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMarketOptions().then((o) => setCategories(o.categories));
  }, []);

  const fetchListings = useCallback(async () => {
    try {
      setError('');
      const params = {};
      if (category) params.category = category;
      if (query.trim()) params.search = query.trim();
      if (mine) {
        params.mine = true;
        params.status = 'AVAILABLE';
      }
      const res = await client.get('/api/marketplace', { params });
      setListings(getItems(res).map(normalizeListing));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [category, query, mine]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchListings().finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  const reloadRef = useRef(fetchListings);
  reloadRef.current = fetchListings;
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reloadRef.current();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <TabHeader title="Marketplace" />
      <View style={styles.controls}>
        <Searchbar
          placeholder="Search for books, gadgets..."
          value={query}
          onChangeText={setQuery}
          elevation={0}
          style={styles.search}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ value: 'MINE', label: 'My listings' }, { value: null, label: 'All' }, ...categories]}
          keyExtractor={(item) => String(item.value)}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => {
            const active = item.value === 'MINE' ? mine : !mine && category === item.value;
            return (
              <Chip
                compact
                mode={active ? 'flat' : 'outlined'}
                onPress={() => {
                  if (item.value === 'MINE') {
                    setMine(!mine);
                    setCategory(null);
                  } else {
                    setMine(false);
                    setCategory(item.value);
                  }
                }}
                style={[styles.chip, active && { backgroundColor: theme.colors.primary }]}
                textStyle={active ? { color: '#FFFFFF' } : undefined}
              >
                {item.label}
              </Chip>
            );
          }}
        />
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={onRefresh} />
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ListingCard listing={item} width={cardWidth} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyView
              icon="storefront-outline"
              title="Nothing here yet"
              text="Be the first to list something for your campus."
              actionLabel="Sell an item"
              onAction={() => navigation.navigate('CreateListing')}
            />
          }
        />
      )}

      <FAB
        icon="plus"
        label="Sell"
        color="#FFFFFF"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateListing')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { paddingBottom: 8 },
  search: { marginHorizontal: 16, borderRadius: 16 },
  chips: { paddingHorizontal: 16, paddingTop: 12 },
  chip: { marginRight: 8 },
  list: { padding: 16, paddingBottom: 112 },
  column: { gap: 12, marginBottom: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
