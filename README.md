# Tugas 11 PBP – ChatApp
Aplikasi chat sederhana berbasis React Native dengan backend Firebase. Fitur yang disiapkan:
- Autentikasi username & password menggunakan Firebase Authentication.
- Auto-login (credential tersimpan di AsyncStorage).
- Riwayat chat tersimpan lokal untuk mode offline.
- Upload gambar ke Firebase Storage dan tampil dalam chat bubble.

> Catatan: build Android di mesin lokal sempat gagal karena instalasi NDK yang belum lengkap. Kode dan konfigurasi projek sudah siap; cukup selesaikan setup environment Android/NDK sebelum menjalankan `run-android`.

## Prasyarat
1. Node.js & npm terbaru.
2. Java JDK 17 (set `JAVA_HOME` ke versi ini sebelum build).
3. Android SDK + Android Studio (emulator atau device fisik).
4. Firebase project dengan `google-services.json` pada `android/app/`.

## Instalasi
```bash
git clone https://github.com/Ester2805/Tugas_11_PBP.git
cd Tugas_11_PBP
npm install
```

## Menjalankan Aplikasi
1. Jalankan Metro bundler:
   ```bash
   npm start
   ```
2. Di terminal lain, setelah emulator/device aktif:
   ```bash
   npx react-native run-android
   ```
3. Untuk iOS (opsional) jalankan `cd ios && pod install` lalu `npx react-native run-ios`.

Jika menemui error `Unsupported class file major version`, pastikan sudah menggunakan Java 17 dan bersihkan cache Gradle jika perlu (`./gradlew clean`).

## Struktur Utama
- `App.tsx`: navigasi stack + logika auto-login.
- `firebase.ts`: inisialisasi Firebase (Auth, Firestore, Storage).
- `screens/LoginScreen.tsx`: form login/registrasi + penyimpanan credential.
- `screens/ChatScreen.tsx`: realtime chat, cache offline, upload gambar.

Silakan sesuaikan `firebase.ts` dengan kredensial proyek Firebase masing-masing.
