# Fitur Kehadiran Mobile App

## Overview

Fitur kehadiran memungkinkan karyawan untuk:
- Check-in dan check-out harian
- Melihat status kehadiran hari ini
- Melihat riwayat kehadiran
- Melihat statistik kehadiran bulanan

## Screenshots & Fitur

### 1. Tab Kehadiran
- Tampil di navigation bar dengan ikon kalender
- Akses mudah dari mana saja dalam aplikasi

### 2. Halaman Kehadiran

#### Header
- Menampilkan tanggal lengkap hari ini
- Jam real-time yang update setiap detik

#### Tombol Check In/Out
- **Check In**: Tombol hijau, aktif jika belum check-in hari ini
- **Check Out**: Tombol merah, aktif jika sudah check-in tapi belum check-out
- Konfirmasi dialog sebelum melakukan check-in/out

#### Status Hari Ini
Card yang menampilkan:
- Badge status kehadiran (dengan warna sesuai status)
- Waktu masuk (jika sudah check-in)
- Waktu keluar (jika sudah check-out)
- Lokasi check-in
- Keterangan tambahan

#### Statistik Bulanan
Grid card menampilkan jumlah:
- Hadir (hijau)
- Terlambat (orange)
- Izin (biru)
- Sakit (merah)
- Alpa (merah gelap)
- Total hari

#### Riwayat Kehadiran
List card untuk setiap hari dengan:
- Tanggal
- Badge status
- Waktu masuk dan keluar
- Keterangan (jika ada)

### 3. Status Kehadiran

| Status | Warna | Kondisi |
|--------|-------|---------|
| Hadir | Hijau | Check-in ≤ 08:00 |
| Terlambat | Orange | Check-in > 08:00 |
| Izin | Biru | Karyawan izin |
| Sakit | Merah | Karyawan sakit |
| Alpa | Merah Gelap | Tidak hadir tanpa keterangan |
| Belum Absen | Abu-abu | Belum melakukan absensi |

## Cara Penggunaan

### Check In
1. Buka tab "Kehadiran"
2. Tekan tombol "Check In" (hijau)
3. Konfirmasi dialog
4. Status akan berubah menjadi HADIR atau TERLAMBAT (tergantung waktu)

### Check Out
1. Pastikan sudah check-in
2. Tekan tombol "Check Out" (merah)
3. Konfirmasi dialog
4. Waktu keluar akan tercatat

### Melihat Riwayat
- Scroll ke bawah untuk melihat riwayat kehadiran bulan ini
- Statistik otomatis dihitung berdasarkan data bulan berjalan

### Refresh Data
- Pull down (swipe ke bawah) untuk refresh data

## API Integration

File: `mobilehrd/services/api.ts`

### Methods:
```typescript
// Check-in
await apiService.checkIn({
  lokasi: 'Kantor Pusat Jakarta',
  keterangan: 'Check in melalui mobile app'
});

// Check-out
await apiService.checkOut({
  keterangan: 'Check out melalui mobile app'
});

// Get kehadiran hari ini
const today = await apiService.getTodayKehadiran();

// Get riwayat kehadiran
const history = await apiService.getKehadiranHistory({
  month: 11,
  year: 2025
});
```

## Database Schema

```prisma
model kehadiran {
  id           String            @id @default(cuid())
  karyawanId   String
  tanggal      DateTime          @default(now())
  waktuMasuk   DateTime?
  waktuKeluar  DateTime?
  status       kehadiran_status  @default(BELUM_ABSEN)
  lokasi       String?
  keterangan   String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  karyawan     karyawan          @relation(fields: [karyawanId], references: [id])

  @@unique([karyawanId, tanggal])
  @@index([karyawanId])
}

enum kehadiran_status {
  HADIR
  TERLAMBAT
  IZIN
  SAKIT
  ALPA
  BELUM_ABSEN
}
```

## Testing

### Test Accounts:
```
Email: john.doe@company.com
Password: karyawan123
```

atau

```
Email: jane.smith@company.com
Password: karyawan123
```

### Test Scenario:
1. Login dengan salah satu akun test
2. Buka tab Kehadiran
3. Lakukan check-in (akan muncul status HADIR/TERLAMBAT tergantung jam)
4. Tunggu beberapa saat
5. Lakukan check-out
6. Lihat status hari ini dan riwayat kehadiran
7. Scroll untuk melihat statistik dan history

## Features Roadmap (Future)

Fitur yang bisa ditambahkan di masa depan:
- [ ] Geolocation untuk validasi lokasi check-in
- [ ] Photo capture saat check-in
- [ ] Push notification reminder untuk check-in/out
- [ ] Grafik visualisasi kehadiran
- [ ] Export laporan kehadiran ke PDF
- [ ] Filter riwayat berdasarkan tanggal custom
- [ ] Request izin/cuti dari mobile

## Troubleshooting

### Tombol Check In disabled
- Pastikan belum check-in hari ini
- Refresh halaman dengan pull-to-refresh

### Tombol Check Out disabled
- Pastikan sudah check-in hari ini
- Pastikan belum check-out hari ini

### Data tidak muncul
- Periksa koneksi internet
- Periksa apakah backend server berjalan
- Periksa IP address di `services/api.ts` sudah benar
- Refresh dengan pull-to-refresh

### Error saat check-in/out
- Periksa log console untuk detail error
- Pastikan token authentication masih valid
- Coba logout dan login kembali
