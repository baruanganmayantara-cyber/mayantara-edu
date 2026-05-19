import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari file .env (Variabel Lingkungan)
// Vite menggunakan import.meta.env untuk membaca file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Kunci Supabase belum disetel di file .env');
}

// Inisialisasi Klien Supabase
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
