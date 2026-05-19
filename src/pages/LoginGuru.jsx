import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LoginGuru() {
  const [nip, setNip] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // Login menggunakan NIP
      const { data, error } = await supabase
        .from('guru')
        .select('id, nip, nama_lengkap, foto_url')
        .eq('nip', nip)
        .single();

      if (error || !data) {
        setErrorMsg('NIP tidak ditemukan. Pastikan Anda mengetik NIP dengan benar.');
      } else {
        localStorage.setItem('isGuruAuthenticated', 'true');
        localStorage.setItem('guruId', data.id);
        localStorage.setItem('guruName', data.nama_lengkap);
        localStorage.setItem('guruFoto', data.foto_url);
        window.location.href = '/portal-guru';
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat menghubungi database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-400 p-4 font-sans selection:bg-black selection:text-yellow-400">
      
      {/* Neo-Brutalism Card */}
      <div className="bg-white p-8 md:p-12 w-full max-w-md border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-[2.5rem] relative">
        
        {/* Dekorasi Tape / Aksesoris */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-pink-500 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full animate-bounce flex items-center justify-center">
          <BookOpen className="text-black w-5 h-5" />
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-2">PORTAL<br/>GURU</h1>
          <p className="text-black font-bold bg-green-400 inline-block px-3 py-1 border-2 border-black rotate-[-2deg]">
            Akses Jadwal & Info
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-black flex-shrink-0 mt-0.5" />
            <p className="text-black font-bold text-sm leading-tight">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xl font-bold text-black uppercase">Masukkan NIP</label>
            <input 
              type="text" 
              required 
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              className="w-full px-4 py-4 bg-white border-4 border-black rounded-2xl text-black font-bold text-lg outline-none focus:bg-pink-100 transition-colors placeholder:text-slate-400 placeholder:font-normal"
              placeholder="Contoh: 19801234..."
            />
            <p className="text-sm font-bold text-slate-600 mt-2">*Gunakan NIP Anda sebagai akses masuk.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-400 text-black font-black uppercase text-xl border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:translate-x-2 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
            {!loading && <ArrowRight className="w-6 h-6" />}
          </button>
        </form>
      </div>

    </div>
  );
}
