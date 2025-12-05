import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  CollectionReference,
  DocumentData,
  getDocs,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCzFRbcRT4-diV6qjCN1nkMfQ7vTrMYvH0',
  authDomain: 'chatapp-6d46f.firebaseapp.com',
  projectId: 'chatapp-6d46f',
  storageBucket: 'chatapp-6d46f.firebasestorage.app',
  messagingSenderId: '822333286620',
  appId: '1:822333286620:web:4f00afe481909885b52c19',
  measurementId: 'G-BE873LEH7L',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const messagesCollection = collection(db, 'messages') as CollectionReference<DocumentData>;

export {
  auth,
  db,
  storage,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  uploadBytes,
  getDownloadURL,
  ref,
  User,
  getDocs,
  signOut,
};
