import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Avatar, Button, Text, useTheme } from 'react-native-paper';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Avatar.Icon
        size={64}
        icon="alert-circle-outline"
        color={theme.colors.error}
        style={{ backgroundColor: theme.colors.errorContainer }}
      />
      <Text variant="titleMedium" style={styles.title}>
        Something went wrong
      </Text>
      <Text variant="bodyMedium" style={styles.text}>
        {message}
      </Text>
      {onRetry ? (
        <Button mode="contained-tonal" style={styles.button} onPress={onRetry}>
          Try again
        </Button>
      ) : null}
    </View>
  );
}

export function EmptyView({
  icon = 'text-box-search-outline',
  title,
  text,
  actionLabel,
  onAction,
}) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Avatar.Icon
        size={64}
        icon={icon}
        color={theme.colors.primary}
        style={{ backgroundColor: theme.colors.primaryContainer }}
      />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {text ? (
        <Text variant="bodyMedium" style={styles.text}>
          {text}
        </Text>
      ) : null}
      {actionLabel ? (
        <Button mode="contained" style={styles.button} onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', padding: 32 },
  title: { marginTop: 16, fontWeight: '700', textAlign: 'center' },
  text: { marginTop: 4, textAlign: 'center', opacity: 0.7 },
  button: { marginTop: 16 },
});
