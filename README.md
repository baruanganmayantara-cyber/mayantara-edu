# Mayantara Edu 🎓✨
### **Sistem Informasi Manajemen Sekolah & Portal Pembelajaran Deep Learning (3T)**

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://mayantara-edu.vercel.app)
[![React Version](https://img.shields.io/badge/React-19.x-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Vite Version](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite)](https://vite.dev)
[![Supabase Database](https://img.shields.io/badge/Supabase-Database-emerald?style=for-the-badge&logo=supabase)](https://supabase.com)

**Mayantara Edu** adalah platform manajemen sekolah digital modern yang dirancang untuk merampingkan operasional sekolah, menyajikan analitik data secara real-time, serta memfasilitasi guru dalam menyusun rancangan pembelajaran berbasis kurikulum merdeka dengan **Formula Deep Learning (3T - Mindful, Meaningful, & Joyful Learning)**.

---

## 🌟 Fitur Utama Unggulan

### 🛡️ 1. Portal Administrasi Sekolah (Admin Portal)
*   **Real-time Analytics Dashboard**: Visualisasi persentase kehadiran guru dan siswa 7 hari terakhir dalam format grafik area yang interaktif (ditenagai oleh *Recharts*).
*   **Manajemen Master Data Terintegrasi**: Kelola data Guru, Siswa, Kelas, Mata Pelajaran, Jadwal Mengajar, hingga Pengumuman sekolah hanya dalam satu tempat.
*   **Ekspor Data Laporan**: Unduh rekap kehadiran guru dan jurnal KBM kelas secara instan dalam format file Excel/CSV.

### 🏫 2. Portal Pendidik Modern (Guru Portal)
*   **Sistem Presensi Presisi & Ringkas**: Modal pengisian absensi siswa yang ultra-compact, hemat ruang, dan responsif.
*   **Jurnal Pembelajaran Harian**: Pencatatan materi pembelajaran hari ini dan target materi selanjutnya secara runut.
*   **Manajemen Profil Mandiri**: Guru dapat mengunggah foto profil dan memotongnya secara pas menggunakan fitur **Smart Image Cropper**.

### 🧠 3. Pembuat Modul Ajar Deep Learning (3T)
Guru dapat merancang Modul Ajar Kurikulum Merdeka secara otomatis melalui wizard 4-langkah interaktif berbasis metode **Deep Learning (3T)**:
1.  **Mindful Learning (Fokus & Kesadaran)**: Merancang aktivitas relaksasi pembuka & kesiapan emosi siswa sebelum belajar.
2.  **Meaningful Learning (Bermakna & Kontekstual)**: Merumuskan tantangan riil kehidupan sehari-hari dan manfaat karir masa depan materi bagi siswa.
3.  **Joyful Learning (Interaksi & Kegembiraan)**: Memilih strategi belajar interaktif (ice breaking, gamifikasi) dan opsi tugas berdiferensiasi.
4.  **Bebas Beban Server (Tautan Google Drive & LKPD)**: Mendukung integrasi link Google Drive eksternal serta pembuatan LKPD langsung.
5.  **Cetak PDF Ramah Cetak (Print-Friendly)**: Modul Ajar dapat dicetak langsung ke kertas atau diekspor ke PDF dengan tata letak resmi dinas pendidikan lengkap dengan area tanda tangan kepala sekolah.

### 📱 4. PWA (Progressive Web App) & Mobile Optimized
*   Aplikasi ini dirancang dengan gaya **Neo-Brutalism CSS** yang sangat mencolok, premium, dan responsif baik di desktop, tablet, maupun smartphone.
*   Mendukung instalasi aplikasi langsung di perangkat HP/Komputer (*PWA Installable*) serta caching cerdas untuk akses yang super cepat.

---

## 🛠️ Teknologi & Library Pendukung (Tech Stack)

Aplikasi dibangun menggunakan teknologi mutakhir untuk performa maksimal:

| Teknologi / Library | Kegunaan | Deskripsi |
| :--- | :--- | :--- |
| **React 19** | Core Framework | Pembangunan komponen UI reaktif & modular. |
| **Vite 8** | Build Tool | Kompilasi kilat dan Hot Module Replacement (HMR) instan. |
| **Tailwind CSS 4** | Styling | Desain antarmuka responsif bernuansa Neo-Brutalism. |
| **Supabase** | Backend as a Service | Database PostgreSQL real-time, autentikasi user, & media storage. |
| **Recharts** | Visualisasi Data | Rendering grafik kehadiran siswa dan aktivitas mengajar yang indah. |
| **Lucide React** | Icon Pack | Kumpulan ikon vektor modern, tajam, dan ringan. |
| **React Image Cropper**| Media Utility | Pemotong foto profil guru sebelum diunggah ke storage. |

---

## 🚀 Panduan Instalasi Lokal (Terminal)

Ikuti langkah-langkah di bawah untuk menjalankan proyek ini di komputer lokal Anda:

### 1. Kloning Repositori
```bash
git clone https://github.com/baruanganmayantara-cyber/mayantara-edu.git
cd mayantara-edu
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file bernama `.env` di root direktori proyek Anda, lalu masukkan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser Anda di: `http://localhost:5173`

---

## 🗄️ Konfigurasi Database Supabase & SQL Schema

Seluruh skema database telah didokumentasikan secara mandiri. Kami menyediakan **Skrip SQL DDL Lengkap** yang mencakup pembuatan **12 tabel utama** beserta **kunci relasi** dan **contoh data awal (seed)** untuk login uji coba.

👉 **Akses Skrip SQL Lengkap Di Sini**: **[`panduan/cara instalasi.txt`](file:///f:/mayantara-edu/panduan/cara%20instalasi.txt)**

*(Cukup salin seluruh isi skrip SQL di file tersebut, buka **SQL Editor** di dashboard Supabase Anda, tempelkan kodenya, dan klik **Run**! Database Anda langsung siap pakai dalam 1 detik).*

---

## ☁️ Panduan Deployment ke Vercel (Produksi)

Aplikasi ini sepenuhnya siap untuk di-deploy ke Vercel secara mudah:

### A. Deploy Otomatis via Github (Sangat Direkomendasikan)
1. Push kode Anda ke repositori GitHub Anda.
2. Masuk ke [Vercel Dashboard](https://vercel.com).
3. Hubungkan repositori GitHub Anda dan pilih `Import` pada proyek `mayantara-edu`.
4. Di bagian **Environment Variables**, tambahkan:
   *   `VITE_SUPABASE_URL`
   *   `VITE_SUPABASE_ANON_KEY`
5. Klik **Deploy**! Setiap kali Anda melakukan `git push` ke GitHub ke depannya, Vercel akan otomatis meng-update website Anda secara instan tanpa downtime.

### B. Deploy Manual via Vercel CLI
```bash
# Lakukan kompilasi produksi
npm run build

# Deploy menggunakan CLI
npm install -g vercel
vercel login
vercel --prod
```

---

## 🤝 Kontribusi & Dukungan

Proyek ini diprakarsai dan dikembangkan secara penuh oleh **Mayantara Edu Pioneer Team**. 
Jika Anda memiliki saran fitur, temuan bug, atau ingin berpartisipasi dalam pengembangan kurikulum pembelajaran digital interaktif, silakan ajukan melalui fitur *Pull Request* atau hubungi tim administrator kami.

---
© 2026 **Mayantara Edu**. Hak Cipta Dilindungi Undang-Undang.  
*Mencerdaskan Pendidik, Memajukan Anak Bangsa dengan Deep Learning.* 🇮🇩🎓
