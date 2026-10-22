import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, Button, HelperText, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { uploadImage } from '../../api/upload';
import { fetchMarketOptions } from '../../api/marketOptions';
import { getData } from '../../api/mappers';
import ImagePickerRow from '../../components/ImagePickerRow';

export default function CreateListingScreen({ navigation }) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [options, setOptions] = useState({ categories: [], conditions: [] });
  const [category, setCategory] = useState(null);
  const [condition, setCondition] = useState(null);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMarketOptions().then((o) => {
      setOptions(o);
      setCategory(o.categories[o.categories.length - 1]?.value ?? null);
      setCondition(o.conditions[0]?.value ?? null);
    });
  }, []);

  const submit = async () => {
    const amount = Number(price);
    if (!title.trim() || !description.trim()) {
      setError('Please add a title and a description.');
      return;
    }
    if (!price || Number.isNaN(amount) || amount < 0) {
      setError('Enter a valid price.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const imageUrls = [];
      for (const uri of images) {
        imageUrls.push(await uploadImage(uri, 'marketplace'));
      }
      const res = await client.post('/api/marketplace', {
        title: title.trim(),
        description: description.trim(),
        price: amount,
        category: category ?? undefined,
        condition: condition ?? undefined,
        imageUrls,
      });
      const data = getData(res);
      const id = data?.listing?.id ?? data?.id;
      if (id) navigation.replace('ListingDetail', { listingId: id });
      else navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const chips = (list, value, onSelect) => (
    <View style={styles.chips}>
      {list.map((o) => (
        <Chip
          key={String(o.value)}
          mode={value === o.value ? 'flat' : 'outlined'}
          onPress={() => onSelect(o.value)}
          style={value === o.value && { backgroundColor: theme.colors.primary }}
          textStyle={value === o.value ? { color: '#FFFFFF' } : undefined}
        >
          {o.label}
        </Chip>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput mode="outlined" label="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput
        mode="outlined"
        label="Price (INR)"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="Description"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      <Text variant="titleSmall" style={styles.label}>
        Category
      </Text>
      {chips(options.categories, category, setCategory)}

      <Text variant="titleSmall" style={styles.label}>
        Condition
      </Text>
      {chips(options.conditions, condition, setCondition)}

      <Text variant="titleSmall" style={styles.label}>
        Photos (up to 4)
      </Text>
      <ImagePickerRow images={images} onChange={setImages} max={4} />

      <HelperText type="error" visible={Boolean(error)}>
        {error}
      </HelperText>
      <Button
        mode="contained"
        loading={saving}
        disabled={saving}
        onPress={submit}
        contentStyle={styles.buttonContent}
        style={styles.button}
      >
        List item
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  input: { marginBottom: 16 },
  label: { marginTop: 8, marginBottom: 8, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  button: { marginTop: 8, borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
});
