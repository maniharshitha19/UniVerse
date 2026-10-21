import { View, Pressable, StyleSheet } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';

export default function QuickActions({ actions, onPress }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={styles.item}
          onPress={() => onPress(action)}
        >
          <Avatar.Icon
            size={56}
            icon={action.icon}
            color={theme.colors.primary}
            style={{ backgroundColor: theme.colors.primaryContainer }}
          />
          <Text variant="labelMedium" style={styles.label}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginTop: 24,
  },
  item: { alignItems: 'center', width: 80 },
  label: { marginTop: 8, textAlign: 'center' },
});
