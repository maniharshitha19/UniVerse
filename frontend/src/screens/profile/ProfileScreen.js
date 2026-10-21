import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, useTheme } from 'react-native-paper';
import { currentUser } from '../../api/mockData';

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Avatar.Text size={88} label={currentUser.name[0]} />
      <Text variant="headlineSmall" style={styles.name}>
        {currentUser.name}
      </Text>
      <Text variant="bodyMedium" style={styles.meta}>
        {currentUser.department}, year {currentUser.year}
      </Text>
      <Button
        mode="outlined"
        icon="logout"
        style={styles.button}
        onPress={() => navigation.getParent()?.replace('Login')}
      >
        Log out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  name: { marginTop: 16, fontWeight: '700' },
  meta: { marginTop: 4, opacity: 0.7 },
  button: { marginTop: 32 },
});
