import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'> & {
  onLoginSuccess: (username: string) => Promise<void>;
  credentialsKey: string;
};

export default function LoginScreen({ navigation, onLoginSuccess, credentialsKey }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toEmail = (value: string) => `${value.toLowerCase()}@chatapp.local`;

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Nama pengguna dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);
    setError('');
    const email = toEmail(username);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      await AsyncStorage.setItem(
        credentialsKey,
        JSON.stringify({ username: username.trim(), password }),
      );
      await onLoginSuccess(username.trim());
      navigation.replace('Chat');
    } catch (err: any) {
      const message = err?.message ?? 'Terjadi kesalahan';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegister ? 'Daftar Akun' : 'Masuk Ke Akun'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        placeholder="Username"
        style={styles.input}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        placeholder="Kata sandi"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={loading ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'} onPress={handleSubmit} disabled={loading} />
      <TouchableOpacity onPress={() => setIsRegister((prev) => !prev)} style={styles.toggle}>
        <Text>{isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
  },
  toggle: {
    alignItems: 'center',
    marginTop: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});
