import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { auth, onAuthStateChanged, signInWithEmailAndPassword, User } from './firebase';
import LoginScreen from './screens/LoginScreen';
import ChatScreen from './screens/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const CREDENTIALS_KEY = 'chatapp:credentials';
const PROFILE_KEY = 'chatapp:profile';

export type StoredCredentials = {
  username: string;
  password: string;
};

export type StoredProfile = {
  username: string;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [hydrating, setHydrating] = useState(true);

  const hydrateProfile = useCallback(async () => {
    try {
      const rawProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (rawProfile) {
        setProfile(JSON.parse(rawProfile));
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.warn('Failed to read profile cache', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setHydrating(false);
      if (firebaseUser) {
        hydrateProfile();
      }
    });

    return () => unsubscribe();
  }, [hydrateProfile]);

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const raw = await AsyncStorage.getItem(CREDENTIALS_KEY);
        if (!raw) {
          setHydrating(false);
          return;
        }
        const stored: StoredCredentials = JSON.parse(raw);
        if (!auth.currentUser) {
          const email = `${stored.username}@chatapp.local`;
          await signInWithEmailAndPassword(auth, email, stored.password);
        }
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ username: stored.username }));
        setProfile({ username: stored.username });
      } catch (error) {
        console.warn('Auto login failed', error);
      } finally {
        setHydrating(false);
      }
    };

    autoLogin();
  }, []);

  const handleLoginSuccess = useCallback(async (username: string) => {
    const profilePayload: StoredProfile = { username };
    setProfile(profilePayload);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profilePayload));
  }, []);

  const handleLogout = useCallback(async () => {
    setProfile(null);
    await AsyncStorage.multiRemove([PROFILE_KEY, CREDENTIALS_KEY]);
  }, []);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
    }),
    [],
  );

  if (hydrating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {user ? (
          <Stack.Screen name="Chat">
            {(props) => (
              <ChatScreen
                {...props}
                username={profile?.username ?? user.email?.split('@')[0] ?? 'User'}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={handleLoginSuccess}
                credentialsKey={CREDENTIALS_KEY}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
