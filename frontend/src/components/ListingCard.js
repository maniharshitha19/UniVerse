import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { formatPrice, humanize } from '../api/mappers';

export default function ListingCard({ listing, width }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const sold = listing.status === 'SOLD';

  return (
    <Card
      style={{ width }}
      onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
    >
      {listing.images[0] ? (
        <Card.Cover source={{ uri: listing.images[0] }} style={styles.cover} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: theme.colors.primaryContainer }]}>
          <Avatar.Icon
            size={44}
            icon="image-outline"
            color={theme.colors.primary}
            style={styles.placeholderIcon}
          />
        </View>
      )}
      {sold ? (
        <View style={styles.soldBadge}>
          <Text style={styles.soldText}>SOLD</Text>
        </View>
      ) : null}
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={[styles.price, { color: theme.colors.primary }]}>
          {formatPrice(listing.price)}
        </Text>
        <Text variant="bodyMedium" numberOfLines={1}>
          {listing.title}
        </Text>
        {listing.condition ? (
          <Text variant="bodySmall" style={styles.meta}>
            {humanize(listing.condition)}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  cover: { height: 110 },
  placeholder: { height: 110, alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { backgroundColor: 'transparent' },
  soldBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E5484D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soldText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  content: { paddingTop: 8 },
  price: { fontWeight: '700' },
  meta: { opacity: 0.6, marginTop: 2 },
});
