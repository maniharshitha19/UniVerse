import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, Chip, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const name = user?.name ?? 'Student';
  const role = user?.role ? String(user.role).toLowerCase() : 'student';
  const skills = Array.isArray(user?.skills) ? user.skills : [];

  const handleLogout = () => {
    logout();
    navigation.getParent()?.replace('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

      <Button
        mode="outlined"
        icon="logout"
        style={styles.button}
        onPress={handleLogout}
      >
        Log out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  name: { marginTop: 16, fontWeight: '700' },
  meta: { marginTop: 4, opacity: 0.7, textTransform: 'capitalize' },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  button: { marginTop: 32 },
});
