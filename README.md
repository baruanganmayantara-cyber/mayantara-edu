# Mayantara Edu 🎓
## Sistem Manajemen Informasi Sekolah

Platform digital berbasis web untuk mengelola operasional sekolah secara komprehensif.

### Fitur Utama
- **Portal Admin**: Dasbor dengan grafik kehadiran real-time, manajemen data siswa & guru
- **Portal Guru**: Presensi siswa, jurnal mengajar, laporan, profil dengan crop foto
- **Laporan & Ekspor**: Unduh laporan per kelas ke Excel (.csv), cetak PDF rapi
- **Grafik Analitik**: Visualisasi kehadiran 7 hari menggunakan Recharts

### Tech Stack
| Teknologi | Versi |
|---|---|
| React | 19.x |
| Vite | 8.x |
| Tailwind CSS | 4.x |
| Supabase | 2.x |
| Recharts | 2.x |
| React Router DOM | 7.x |
| Lucide React | 1.x |

### Cara Menjalankan (Development)
```bash
npm install
npm run dev
```

### Build Produksi
```bash
npm install -D terser
npm run build
```
Hasil build akan ada di folder `/dist`.

### Deployment
**Netlify:** Upload folder `/dist` atau hubungkan ke GitHub repository.
**Vercel:** `vercel --prod` dari root proyek (file `vercel.json` sudah tersedia).

### Environment Variables
Buat file `.env` di root proyek:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Struktur Database (Supabase)
Tabel utama yang dibutuhkan:
- `admin_users` — Akun admin (username, password)
- `guru` — Data guru
- `siswa` — Data siswa
- `kelas` — Data rombongan belajar
- `mata_pelajaran` — Daftar mata pelajaran
- `jadwal_mengajar` — Jadwal guru mengajar
- `jurnal_mengajar` — Jurnal dan presensi harian guru
- `presensi_siswa` — Status kehadiran siswa per jurnal
- `pengumuman` — Info penting / pengumuman sekolah

---
© 2026 Mayantara Edu. Hak Cipta Dilindungi.
