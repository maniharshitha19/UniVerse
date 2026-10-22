import { View, Image, StyleSheet } from 'react-native';
import { Button, IconButton, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

// Lets the user choose photos from the phone. `images` holds local photo addresses.
export default function ImagePickerRow({ images, onChange, max = 4 }) {
  const theme = useTheme();

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: max - images.length > 1,
      selectionLimit: Math.max(max - images.length, 1),
      quality: 0.7,
    });
    if (!result.canceled) {
      onChange([...images, ...result.assets.map((a) => a.uri)].slice(0, max));
    }
  };

  const remove = (uri) => onChange(images.filter((item) => item !== uri));

  return (
    <View style={styles.row}>
      {images.map((uri) => (
        <View key={uri} style={styles.thumbWrap}>
          <Image source={{ uri }} style={styles.thumb} />
          <IconButton
            icon="close"
            size={14}
            iconColor="#FFFFFF"
            style={styles.remove}
            onPress={() => remove(uri)}
          />
        </View>
      ))}
      {images.length < max ? (
        <Button
          mode="outlined"
          icon="image-plus"
          onPress={pick}
          style={[styles.add, { borderColor: theme.colors.outline }]}
        >
          Add photo
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  thumbWrap: { width: 84, height: 84 },
  thumb: { width: 84, height: 84, borderRadius: 12 },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  add: { borderRadius: 12 },
});
