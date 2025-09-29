# Mobile HRD - Employee Mobile Application

Aplikasi mobile untuk karyawan yang terintegrasi dengan sistem HRD backend Express.js.

## 🚀 Fitur Utama

### 1. **Dashboard Karyawan**
- Overview profil karyawan
- Statistik kinerja (masa kerja, KPI, rating)
- Akses cepat ke fitur utama
- Pelatihan terbaru

### 2. **Manajemen Profil**
- Lihat dan edit data pribadi
- Informasi kerja (departemen, jabatan, masa kerja)
- Update alamat dan kontak
- Foto profil

### 3. **Pelatihan & Pengembangan**
- Daftar pelatihan yang diikuti
- Status pelatihan (selesai, akan datang, hari ini)
- Skor dan catatan pelatihan
- Filter berdasarkan status
- Unduh sertifikat

### 4. **Performance Tracking**
- Grafik KPI dan Rating per tahun
- Level performa (Excellent, Good, Average, dll)
- Tips peningkatan kinerja
- Riwayat lengkap penilaian

### 5. **Notifikasi**
- Notifikasi pelatihan baru
- Update KPI dan rating
- Pengumuman perusahaan
- Reminder evaluasi kinerja
- Filter notifikasi (semua/belum dibaca)

## 🛠 Teknologi

- **Framework**: React Native dengan Expo
- **Navigation**: Expo Router
- **UI Components**: Custom components dengan Ionicons
- **Charts**: React Native Chart Kit
- **Storage**: Expo Secure Store
- **HTTP Client**: Fetch API
- **State Management**: React Context

## 📱 Struktur Aplikasi

```
app/
├── (auth)/
│   ├── login.tsx          # Halaman login
│   └── _layout.tsx        # Layout autentikasi
├── (tabs)/
│   ├── dashboard.tsx      # Dashboard utama
│   ├── profile.tsx        # Profil karyawan
│   ├── training.tsx       # Pelatihan
│   ├── performance.tsx    # Kinerja
│   ├── notifications.tsx  # Notifikasi
│   └── _layout.tsx        # Layout tab navigator
└── _layout.tsx            # Root layout
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- Expo CLI
- Backend Express.js berjalan di port 3000

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### Environment Configuration
Pastikan backend Express.js berjalan di `http://localhost:3000` atau update `API_BASE_URL` di `services/api.ts`.

## 🔐 Autentikasi

- Login dengan email/username dan password
- JWT token disimpan secara aman menggunakan Expo Secure Store
- Automatic logout saat token expired
- Role-based access (KARYAWAN)

## 📊 Integrasi Backend

### API Endpoints yang Digunakan
- `POST /api/auth/login` - Login karyawan
- `GET /api/karyawan` - Data profil karyawan
- `PUT /api/karyawan/me` - Update profil
- `GET /api/pelatihan/my` - Pelatihan karyawan
- `GET /api/karyawan/my-kpi` - Data KPI
- `GET /api/karyawan/my-rating` - Data rating

### Data Models
```typescript
interface Karyawan {
  id: string;
  nama: string;
  gender: 'Pria' | 'Wanita';
  alamat?: string;
  no_telp?: string;
  tanggal_lahir?: string;
  pendidikan: string;
  tanggal_masuk: string;
  jalur_rekrut: string;
  umur?: number;
  masaKerja?: number;
  Departemen: Array<{ id: string; nama: string }>;
  Jabatan: Array<{ id: string; nama: string }>;
  KPI: Array<{ id: string; year: number; score: number; notes?: string }>;
  Rating: Array<{ id: string; year: number; score: number; notes?: string }>;
  pelatihanDetail: Array<{
    id: string;
    skor?: number;
    catatan?: string;
    pelatihan: {
      id: string;
      nama: string;
      tanggal: string;
      lokasi: string;
    };
  }>;
}
```

## 🎨 UI/UX Features

### Design System
- **Primary Color**: #667eea (Blue gradient)
- **Secondary Color**: #764ba2 (Purple gradient)
- **Typography**: System fonts dengan berbagai weight
- **Icons**: Ionicons
- **Shadows**: Subtle shadows untuk depth
- **Border Radius**: 12px untuk cards, 8px untuk buttons

### Responsive Design
- Optimized untuk berbagai ukuran layar
- Touch-friendly interface
- Pull-to-refresh functionality
- Loading states dan error handling

### Accessibility
- High contrast colors
- Touch targets minimum 44px
- Screen reader support
- Keyboard navigation

## 🔄 State Management

### AuthContext
- Global authentication state
- User data management
- Login/logout functionality
- Token management

### Local State
- Component-level state untuk UI
- Form data management
- Loading states
- Error handling

## 📱 Platform Support

- **iOS**: Native iOS app
- **Android**: Native Android app
- **Web**: Progressive Web App (PWA)

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios

# Build for Web
expo build:web
```

## 🔧 Customization

### Themes
Update colors di `constants/theme.ts` untuk mengubah skema warna.

### API Configuration
Update `services/api.ts` untuk mengubah endpoint atau menambah fitur baru.

### Navigation
Modifikasi `app/(tabs)/_layout.tsx` untuk menambah/mengubah tab navigasi.

## 📝 Notes

- Aplikasi ini dirancang khusus untuk role KARYAWAN
- Fitur HRD (decision support, training model) tidak tersedia di mobile
- Data real-time sync dengan backend Express.js
- Offline capability terbatas (hanya data yang sudah di-cache)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

Private project - All rights reserved