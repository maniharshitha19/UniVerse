import { View, StyleSheet } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';

export default function PlaceholderScreen({ title, icon, note }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Avatar.Icon
        size={80}
        icon={icon}
        color={theme.colors.primary}
        style={{ backgroundColor: theme.colors.primaryContainer }}
      />
      <Text variant="headlineSmall" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.note}>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { marginTop: 24, fontWeight: '700' },
  note: { marginTop: 8, textAlign: 'center', opacity: 0.7 },
});
