import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, Chip, List, Divider, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { unread, chatUnread } = useRealtime();
  const name = user?.name ?? 'Student';
  const role = user?.role ? String(user.role).toLowerCase() : 'student';
  const skills = Array.isArray(user?.skills) ? user.skills : [];

  const handleLogout = () => {
    logout();
    navigation.getParent()?.replace('Login');
  };

  const row = (title, icon, onPress, count) => (
    <List.Item
      title={title}
      left={(props) => <List.Icon {...props} icon={icon} />}
      right={(props) =>
        count > 0 ? (
          <Chip compact style={styles.count}>
            {String(count)}
          </Chip>
        ) : (
          <List.Icon {...props} icon="chevron-right" />
        )
      }
      onPress={onPress}
    />
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 32 }]}
    >
      <Avatar.Text size={88} label={name[0].toUpperCase()} />
      <Text variant="headlineSmall" style={styles.name}>
        {name}
      </Text>
      <Text variant="bodyMedium" style={styles.meta}>
        {role}
      </Text>

      {skills.length > 0 ? (
        <View style={styles.skills}>
          {skills.map((skill) => (
            <Chip
              key={skill}
              compact
              style={{ backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary, fontSize: 12 }}
            >
              {skill}
            </Chip>
          ))}
        </View>
      ) : null}

      <View style={[styles.list, { backgroundColor: theme.colors.surface }]}>
        {row('Messages', 'message-outline', () => navigation.navigate('Conversations'), chatUnread)}
        <Divider />
        {row('Notifications', 'bell-outline', () => navigation.navigate('Notifications'), unread)}
        <Divider />
        {row('My teams', 'account-group-outline', () =>
          navigation.navigate('Teams', { segment: 'mine' })
        )}
        <Divider />
        {row('My join requests', 'send-outline', () => navigation.navigate('MyRequests'))}
      </View>

      <Button mode="outlined" icon="logout" style={styles.button} onPress={handleLogout}>
        Log out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 48 },
  name: { marginTop: 16, fontWeight: '700' },
  meta: { marginTop: 4, opacity: 0.7, textTransform: 'capitalize' },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  list: { alignSelf: 'stretch', marginTop: 32, borderRadius: 16, overflow: 'hidden' },
  count: { alignSelf: 'center', marginRight: 8 },
  button: { marginTop: 32 },
});
