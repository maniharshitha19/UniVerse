import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function SectionHeader({ title, onSeeAll }) {
  return (
    <View style={styles.row}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {onSeeAll ? (
        <Button compact onPress={onSeeAll}>
          See all
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  title: { fontWeight: '700' },
});
