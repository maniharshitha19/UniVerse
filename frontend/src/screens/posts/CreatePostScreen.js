import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, Switch, Button, HelperText, useTheme } from 'react-native-paper';
import client, { getErrorMessage } from '../../api/client';
import { uploadImage } from '../../api/upload';
import { postCategories } from '../../api/mappers';
import ImagePickerRow from '../../components/ImagePickerRow';

const choices = postCategories.filter((c) => c.value !== 'ALL');

export default function CreatePostScreen({ navigation }) {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [anonymous, setAnonymous] = useState(false);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!content.trim()) {
      setError('Write something first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = { content: content.trim(), category, isAnonymous: anonymous };
      if (images.length > 0) body.imageUrl = await uploadImage(images[0], 'posts');
      await client.post('/api/posts', body);
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        mode="outlined"
        label="What's on your mind?"
        multiline
        numberOfLines={6}
        value={content}
        onChangeText={setContent}
        style={styles.input}
      />

      <Text variant="titleSmall" style={styles.label}>
        Category
      </Text>
      <View style={styles.chips}>
        {choices.map((c) => (
          <Chip
            key={c.value}
            mode={category === c.value ? 'flat' : 'outlined'}
            onPress={() => setCategory(c.value)}
            style={category === c.value && { backgroundColor: theme.colors.primary }}
            textStyle={category === c.value ? { color: '#FFFFFF' } : undefined}
          >
            {c.label}
          </Chip>
        ))}
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text variant="titleSmall">Post anonymously</Text>
          <Text variant="bodySmall" style={styles.muted}>
            Other students won't see your name.
          </Text>
        </View>
        <Switch value={anonymous} onValueChange={setAnonymous} />
      </View>

      <Text variant="titleSmall" style={styles.label}>
        Photo (optional)
      </Text>
      <ImagePickerRow images={images} onChange={setImages} max={1} />

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
        Post
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  input: { minHeight: 140 },
  label: { marginTop: 24, marginBottom: 8, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  switchText: { flex: 1 },
  muted: { opacity: 0.7 },
  button: { marginTop: 8, borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
});
