import { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const { login } = useAuth();
  // Pre-filled with a test account from the backend's sample data.
  const [email, setEmail] = useState('aarav@test.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim());
      navigation.replace('Main');
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text
        variant="displaySmall"
        style={[styles.title, { color: theme.colors.primary }]}
      >
        UniVerse
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Your campus, all in one place
      </Text>

      <TextInput
        label="College email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="Password"
        mode="outlined"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
        style={styles.input}
      />

      <HelperText type="error" visible={Boolean(error)}>
        {error}
      </HelperText>

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Log in
      </Button>
      <Text variant="bodySmall" style={styles.testNote}>
        Testing mode: use a sample account such as aarav@test.com. Any password works.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', fontWeight: 'bold' },
  subtitle: { textAlign: 'center', marginBottom: 32, opacity: 0.7 },
  input: { marginBottom: 16 },
  button: { marginTop: 8, borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
  testNote: { textAlign: 'center', marginTop: 16, opacity: 0.6 },
});
