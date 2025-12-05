import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  messagesCollection,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  auth,
  signOut,
} from '../firebase';
import { RootStackParamList } from '../App';

type MessageType = {
  id: string;
  text: string;
  user: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  imageUrl?: string | null;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'> & {
  username: string;
  onLogout: () => Promise<void>;
};

const MESSAGES_CACHE_KEY = 'chatapp:messages';

export default function ChatScreen({ username, onLogout }: Props) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sending, setSending] = useState(false);

  const loadCachedMessages = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(MESSAGES_CACHE_KEY);
      if (raw) {
        setMessages(JSON.parse(raw));
      }
    } catch (error) {
      console.warn('Failed to load cached messages', error);
    }
  }, []);

  const cacheMessages = useCallback(async (nextMessages: MessageType[]) => {
    try {
      await AsyncStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(nextMessages));
    } catch (error) {
      console.warn('Failed to persist messages', error);
    }
  }, []);

  useEffect(() => {
    loadCachedMessages();
    const q = query(messagesCollection, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: MessageType[] = [];
      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...(doc.data() as Omit<MessageType, 'id'>),
        });
      });
      setMessages(list);
      cacheMessages(list);
    });
    return () => unsub();
  }, [cacheMessages, loadCachedMessages]);

  const sendMessage = useCallback(
    async (overrides?: { text?: string; imageUrl?: string | null }) => {
      const textPayload = overrides?.text ?? message.trim();
      const imageUrlPayload = overrides?.imageUrl ?? pendingImage;
      if (!textPayload && !imageUrlPayload) return;
      setSending(true);
      try {
        await addDoc(messagesCollection, {
          text: textPayload,
          user: username,
          createdAt: serverTimestamp(),
          imageUrl: imageUrlPayload ?? null,
        });
        setMessage('');
        setPendingImage(null);
      } catch (error) {
        console.warn('Failed to send message', error);
      } finally {
        setSending(false);
      }
    },
    [message, pendingImage, username],
  );

  const uploadImage = useCallback(async (uri: string) => {
    setUploadingImage(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `messages/${Date.now()}-${username}.jpg`);
      await uploadBytes(imageRef, blob);
      const url = await getDownloadURL(imageRef);
      setPendingImage(url);
    } catch (error) {
      console.warn('Gagal mengunggah gambar', error);
    } finally {
      setUploadingImage(false);
    }
  }, [username]);

  const handlePickImage = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.length) {
      return;
    }
    const asset = result.assets[0];
    if (asset?.uri) {
      await uploadImage(asset.uri);
    }
  }, [uploadImage]);

  const handleSendImage = useCallback(async () => {
    if (!pendingImage) return;
    await sendMessage({ imageUrl: pendingImage, text: message.trim() });
  }, [message, pendingImage, sendMessage]);

  const handleLogout = async () => {
    await signOut(auth);
    await onLogout();
  };

  const renderItem = ({ item }: { item: MessageType }) => {
    const isOwn = item.user === username;
    return (
      <View style={[styles.msgBox, isOwn ? styles.myMsg : styles.otherMsg]}>
        <Text style={styles.sender}>{item.user}</Text>
        {!!item.text && <Text style={styles.messageText}>{item.text}</Text>}
        {!!item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Halo, {username}</Text>
        <Button title="Keluar" onPress={handleLogout} />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />
      {pendingImage && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: pendingImage }} style={styles.previewImage} />
          <Button title="Kirim Foto" onPress={handleSendImage} disabled={sending} />
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ketik pesan..."
          value={message}
          onChangeText={setMessage}
        />
        <Button title="Foto" onPress={handlePickImage} disabled={uploadingImage} />
        <Button title={sending ? '...' : 'Kirim'} onPress={() => sendMessage()} disabled={sending} />
      </View>
      {(uploadingImage || sending) && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  msgBox: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    maxWidth: '80%',
  },
  myMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#d1f0ff',
  },
  otherMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },
  sender: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
  },
  messageImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
