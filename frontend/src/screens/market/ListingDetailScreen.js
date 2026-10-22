import { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, Image, Alert, useWindowDimensions, StyleSheet } from 'react-native';
import { Text, Chip, Button, Avatar, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { getData, normalizeListing, formatPrice, humanize, initials } from '../../api/mappers';
import { useAuth } from '../../context/AuthContext';
import MessageDialog from '../../components/MessageDialog';
import { LoadingView, ErrorView } from '../../components/StateViews';

export default function ListingDetailScreen({ navigation, route }) {
  const { listingId } = route.params;
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { userId } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await client.get(`/api/marketplace/${listingId}`);
      const data = getData(res);
      setListing(normalizeListing(data.listing ?? data));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [listingId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const markSold = async () => {
    setBusy(true);
    try {
      await client.patch(`/api/marketplace/${listingId}`, { status: 'SOLD' });
      await load();
    } catch (err) {
      Alert.alert('Could not update', getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete this listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/api/marketplace/${listingId}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not delete', getErrorMessage(err));
          }
        },
      },
    ]);

  const contactSeller = async (message) => {
    setBusy(true);
    try {
      const res = await client.post(`/api/marketplace/${listingId}/contact`, message ? { message } : {});
      const data = getData(res);
      const conversationId =
        data?.conversationId ?? data?.conversation?.id ?? data?.message?.conversationId ?? data?.id;
      setDialog(false);
      if (conversationId) {
        navigation.navigate('Chat', {
          conversationId,
          title: listing.seller?.name ?? 'Seller',
        });
      } else {
        Alert.alert('Message sent', 'Find the chat under Messages.');
      }
    } catch (err) {
      Alert.alert('Could not contact seller', getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error || !listing) return <ErrorView message={error || 'Listing not found.'} onRetry={load} />;

  const isSeller = Boolean(listing.sellerId) && listing.sellerId === userId;
  const sold = listing.status === 'SOLD';

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {listing.images.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {listing.images.map((uri) => (
            <Image key={uri} source={{ uri }} style={{ width, height: 280 }} />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.noImage, { backgroundColor: theme.colors.primaryContainer }]}>
          <Avatar.Icon
            size={64}
            icon="image-outline"
            color={theme.colors.primary}
            style={styles.noImageIcon}
          />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.row}>
          <Text variant="headlineSmall" style={[styles.price, { color: theme.colors.primary }]}>
            {formatPrice(listing.price)}
          </Text>
          {sold ? <Chip compact>Sold</Chip> : null}
        </View>
        <Text variant="titleLarge" style={styles.title}>
          {listing.title}
        </Text>
        <View style={styles.chips}>
          {listing.category ? <Chip compact>{humanize(listing.category)}</Chip> : null}
          {listing.condition ? <Chip compact>{humanize(listing.condition)}</Chip> : null}
        </View>

        {listing.description ? (
          <Text variant="bodyMedium" style={styles.description}>
            {listing.description}
          </Text>
        ) : null}

        <View style={styles.seller}>
          <Avatar.Text size={40} label={initials(listing.seller?.name)} />
          <View style={styles.sellerText}>
            <Text variant="titleSmall" style={styles.bold}>
              {listing.seller?.name ?? 'Seller'}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              Listed {listing.time}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {isSeller ? (
            <>
              {!sold ? (
                <Button mode="contained" icon="check" disabled={busy} onPress={markSold}>
                  Mark as sold
                </Button>
              ) : null}
              <Button
                mode="text"
                icon="delete-outline"
                textColor={theme.colors.error}
                onPress={remove}
              >
                Delete listing
              </Button>
            </>
          ) : sold ? (
            <Text variant="bodyMedium" style={styles.muted}>
              This item has been sold.
            </Text>
          ) : (
            <Button mode="contained" icon="message-outline" onPress={() => setDialog(true)}>
              Message seller
            </Button>
          )}
        </View>
      </View>

      <MessageDialog
        visible={dialog}
        title="Message the seller"
        initialText="Hi, is this still available?"
        confirmLabel="Send"
        loading={busy}
        onDismiss={() => setDialog(false)}
        onConfirm={contactSeller}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 48 },
  noImage: { height: 220, alignItems: 'center', justifyContent: 'center' },
  noImageIcon: { backgroundColor: 'transparent' },
  body: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontWeight: '700' },
  title: { marginTop: 4, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  description: { marginTop: 16, lineHeight: 22 },
  seller: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  sellerText: { marginLeft: 12 },
  bold: { fontWeight: '700' },
  muted: { opacity: 0.7 },
  actions: { marginTop: 24, gap: 12 },
});
