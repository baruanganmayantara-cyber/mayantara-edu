import { useState, useEffect } from 'react';
import { CalendarDays, Megaphone, Clock, MapPin, BookOpen, AlertCircle, X, CheckCircle, PenTool, LayoutGrid, FileText, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function DashboardGuru() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('beranda'); // 'beranda' | 'jadwal'
  const [jadwalData, setJadwalData] = useState([]);
  const [pengumumanData, setPengumumanData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Presensi State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [siswaList, setSiswaList] = useState([]);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [jurnalForm, setJurnalForm] = useState({ materi_sekarang: '', materi_selanjutnya: '', jumlah_jam: '' });
  const [presensiState, setPresensiState] = useState({}); // { siswaId: { status: 'Hadir', keterangan: '' } }

  const guruId = localStorage.getItem('guruId');
  const guruName = localStorage.getItem('guruName') || 'Guru';
  
  let guruFoto = localStorage.getItem('guruFoto');
  if (!guruFoto || guruFoto === 'null' || guruFoto === 'undefined') {
    guruFoto = `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(guruName)}`;
  }

  // Mapping nama hari
  const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayHari = hariMap[new Date().getDay()];
  const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // 1. Fetch Jadwal Mengajar untuk guru ini
      const { data: jadwal } = await supabase
        .from('jadwal_mengajar')
        .select(`*, kelas (tingkat, nama_rombel), mata_pelajaran (nama)`)
        .eq('guru_id', guruId)
        .order('hari')
        .order('jam_mulai');

      // 2. Cek jadwal mana yang sudah diisi jurnalnya HARI INI
      const { data: jurnalHariIni } = await supabase
        .from('jurnal_mengajar')
        .select('*')
        .eq('tanggal', todayDate);

      if (jadwal) {
        const enrichedJadwal = jadwal.map(j => {
          const matchedJurnal = (jurnalHariIni || []).find(jur => jur.jadwal_id === j.id);
          return {
            ...j,
            isDone: !!matchedJurnal,
            jurnal: matchedJurnal || null
          };
        });
        setJadwalData(enrichedJadwal);
      }

      // 3. Fetch Pengumuman
      const { data: pengumuman } = await supabase
        .from('pengumuman')
        .select('*')
        .in('target', ['Semua', 'Guru'])
        .eq('status', 'Aktif')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pengumuman) setPengumumanData(pengumuman);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const openPresensiModal = async (jadwal) => {
    setSelectedJadwal(jadwal);
    setJurnalForm({ materi_sekarang: '', materi_selanjutnya: '', jumlah_jam: '' });
    setPresensiState({});
    setIsModalOpen(true);
    setLoadingSiswa(true);

    try {
      // Ambil data siswa di kelas tersebut
      const { data: siswa } = await supabase
        .from('siswa')
        .select('id, nama_lengkap, nisn')
        .eq('kelas_id', jadwal.kelas_id)
        .eq('status', 'Aktif')
        .order('nama_lengkap', { ascending: true });

      if (siswa) {
        setSiswaList(siswa);
        const initialPresensi = {};

        // Jika mode edit, tarik data lama
        if (jadwal.isDone && jadwal.jurnal) {
          setJurnalForm({
            materi_sekarang: jadwal.jurnal.materi_sekarang || '',
            materi_selanjutnya: jadwal.jurnal.materi_selanjutnya || '',
            jumlah_jam: jadwal.jurnal.jumlah_jam || ''
          });

          const { data: presensiHistory } = await supabase
            .from('presensi_siswa')
            .select('*')
            .eq('jurnal_id', jadwal.jurnal.id);

          siswa.forEach(s => {
            const prev = (presensiHistory || []).find(p => p.siswa_id === s.id);
            initialPresensi[s.id] = { 
              status: prev ? prev.status : 'Hadir', 
              keterangan: prev ? (prev.keterangan || '') : '' 
            };
          });
        } else {
          // Default Hadir semua
          siswa.forEach(s => {
            initialPresensi[s.id] = { status: 'Hadir', keterangan: '' };
          });
        }
        
        setPresensiState(initialPresensi);
      }
    } catch (error) {
      console.error('Error fetching siswa:', error);
    } finally {
      setLoadingSiswa(false);
    }
  };

  const handleStatusChange = (siswaId, status) => {
    setPresensiState(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], status }
    }));
  };

  const handleKeteranganChange = (siswaId, keterangan) => {
    setPresensiState(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], keterangan }
    }));
  };

  const handleSubmitPresensi = async (e) => {
    e.preventDefault();
    if (!window.confirm('Simpan jurnal dan presensi ini secara permanen? Anda tidak bisa mengubahnya nanti.')) return;
    
    try {
      setIsSubmitting(true);
      let jurnalId;

      if (selectedJadwal.isDone && selectedJadwal.jurnal) {
        // Mode Edit
        jurnalId = selectedJadwal.jurnal.id;
        const { error: updateError } = await supabase
          .from('jurnal_mengajar')
          .update({
            materi_sekarang: jurnalForm.materi_sekarang,
            materi_selanjutnya: jurnalForm.materi_selanjutnya,
            jumlah_jam: parseInt(jurnalForm.jumlah_jam)
          })
          .eq('id', jurnalId);

        if (updateError) throw updateError;

        // Hapus presensi lama
        await supabase.from('presensi_siswa').delete().eq('jurnal_id', jurnalId);

      } else {
        // Mode Baru
        const { data: jurnalData, error: jurnalError } = await supabase
          .from('jurnal_mengajar')
          .insert([{
            jadwal_id: selectedJadwal.id,
            tanggal: todayDate,
            materi_sekarang: jurnalForm.materi_sekarang,
            materi_selanjutnya: jurnalForm.materi_selanjutnya,
            jumlah_jam: parseInt(jurnalForm.jumlah_jam)
          }])
          .select('id')
          .single();

        if (jurnalError) throw jurnalError;
        jurnalId = jurnalData.id;
      }

      // Insert Presensi Siswa (Bulk)
      const presensiPayload = siswaList.map(s => ({
        jurnal_id: jurnalId,
        siswa_id: s.id,
        status: presensiState[s.id].status,
        keterangan: presensiState[s.id].keterangan || null
      }));

      const { error: presensiError } = await supabase
        .from('presensi_siswa')
        .insert(presensiPayload);

      if (presensiError) throw presensiError;

      alert('Presensi berhasil disimpan!');
      setIsModalOpen(false);
      fetchData(); // Refresh UI (jadwal akan jadi isDone)

    } catch (error) {
      alert('Gagal menyimpan presensi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
      
      {/* Banner Utama */}
      <div className="bg-yellow-400 border-4 border-black rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-black overflow-hidden bg-white shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <img src={guruFoto} alt="Profil" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-1">Halo, {guruName}!</h2>
            <p className="text-xs sm:text-sm font-bold text-black max-w-2xl bg-white inline-block px-2 py-0.5 border-2 border-black rounded-xl rotate-1">Selamat datang. Cek jadwal Anda hari ini.</p>
          </div>
        </div>
        {/* Dekorasi Tape */}
        <div className="absolute top-0 right-4 w-8 h-20 bg-blue-500 border-4 border-black transform rotate-45 translate-y-[-20%]"></div>
      </div>

      {viewMode === 'beranda' ? (
        <div className="flex flex-col gap-8">
          
          {/* Seksi Pengumuman (Dipindah ke atas) */}
          <div id="info-penting" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-pink-500 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-black" />
              </div>
              <h3 className="text-xl font-black uppercase text-black">Info Penting</h3>
            </div>

            <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col divide-y-4 divide-black">
              {loading ? (
                <div className="p-6 text-center font-bold uppercase">Memuat...</div>
              ) : pengumumanData.length === 0 ? (
                <div className="p-6 text-center font-bold">Tidak ada pengumuman saat ini.</div>
              ) : (
                pengumumanData.map((pengumuman) => (
                  <div key={pengumuman.id} className="p-5 hover:bg-slate-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-yellow-400 border-2 border-black rounded-md uppercase">{formatTanggal(pengumuman.tanggal)}</span>
                      <span className="text-xs font-black uppercase underline">{pengumuman.target}</span>
                    </div>
                    <h4 className="text-xl font-black leading-tight mb-2 uppercase">{pengumuman.judul}</h4>
                    {pengumuman.isi && <p className="font-medium text-slate-700 text-sm leading-relaxed">{pengumuman.isi}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seksi Menu Utama (Shortcut Grid) */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
              <LayoutGrid className="w-6 h-6 text-black" />
              <h3 className="text-xl font-black uppercase text-black">Menu Utama</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Tombol Absensi */}
              <button 
                onClick={() => setViewMode('jadwal')}
                className="bg-green-300 hover:bg-green-400 border-4 border-black rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer aspect-square"
              >
                <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                  <PenTool className="w-6 h-6 text-black" />
                </div>
                <span className="font-black uppercase text-sm text-center leading-tight">Isi<br/>Presensi</span>
              </button>

              {/* Tombol Laporan */}
              <button 
                onClick={() => navigate('/portal-guru/laporan')}
                className="bg-blue-300 hover:bg-blue-400 border-4 border-black rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer aspect-square"
              >
                <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-black" />
                </div>
                <span className="font-black uppercase text-sm text-center leading-tight">Laporan<br/>Mengajar</span>
              </button>

              {/* Tombol Profil */}
              <button 
                onClick={() => navigate('/portal-guru/profil')}
                className="bg-pink-300 hover:bg-pink-400 border-4 border-black rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer aspect-square"
              >
                <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-black" />
                </div>
                <span className="font-black uppercase text-sm text-center leading-tight">Profil<br/>Pegawai</span>
              </button>

              {/* Tombol Info Penting */}
              <button 
                onClick={() => { 
                  setViewMode('beranda');
                  setTimeout(() => document.getElementById('info-penting')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="bg-yellow-300 hover:bg-yellow-400 border-4 border-black rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer aspect-square"
              >
                <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-black" />
                </div>
                <span className="font-black uppercase text-sm text-center leading-tight">Info<br/>Sekolah</span>
              </button>
            </div>
          </div>
      </div>
      ) : (
      <div className="flex flex-col gap-8 animate-in slide-in-from-right-8 duration-300">
        
        {/* Tombol Kembali */}
        <button 
          onClick={() => setViewMode('beranda')}
          className="bg-white hover:bg-slate-100 border-4 border-black rounded-2xl px-5 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 font-black uppercase w-full md:w-auto self-start"
        >
          <X className="w-5 h-5 text-black" /> Kembali ke Beranda
        </button>

        {/* Seksi Jadwal Hari Ini */}
        <div id="jadwal-hari-ini" className="space-y-3 scroll-mt-24">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-400 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-black" />
            </div>
            <h3 className="text-xl font-black uppercase text-black">Jadwal Hari Ini</h3>
          </div>

          {loading ? (
            <div className="bg-white border-[3px] border-black rounded-2xl p-6 text-center font-bold text-lg uppercase animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Memuat Jadwal...</div>
          ) : jadwalData.filter(j => j.hari === todayHari).length === 0 ? (
            <div className="bg-white border-[3px] border-black rounded-2xl p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-100 border-[3px] border-black rounded-full flex items-center justify-center mb-3 transform -rotate-12">
                <span className="text-xl">☕</span>
              </div>
              <p className="text-lg font-black uppercase">Tidak Ada Jadwal Hari Ini</p>
              <p className="text-xs font-bold text-slate-500 mt-1">Waktunya istirahat atau tugas administratif.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {jadwalData.filter(j => j.hari === todayHari).map((jadwal, index) => {
                const colors = ['bg-pink-300', 'bg-blue-300', 'bg-green-300', 'bg-orange-300', 'bg-violet-300'];
                const cardColor = colors[index % colors.length];

                return (
                  <div key={jadwal.id} className={`${cardColor} border-[3px] border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full relative hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}>
                    <div className="border-b-[3px] border-black px-3 py-2 bg-white flex justify-between items-center">
                      <span className="font-black uppercase text-base">{jadwal.hari}</span>
                      <span className="font-bold bg-black rounded-lg text-white px-2 py-0.5 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {jadwal.jam_mulai.substring(0,5)} - {jadwal.jam_selesai.substring(0,5)}
                      </span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <h4 className="text-lg font-black uppercase leading-tight mb-2">{jadwal.mata_pelajaran?.nama}</h4>
                      
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-white border-2 border-black rounded flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-3 h-3 text-black" />
                          </div>
                          <span className="font-bold text-xs">Kelas: {jadwal.kelas?.tingkat}-{jadwal.kelas?.nama_rombel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-white border-2 border-black rounded flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3 h-3 text-black" />
                          </div>
                          <span className="font-bold text-xs">R: {jadwal.ruangan || '-'}</span>
                        </div>
                      </div>

                      {/* Tombol Presensi Khusus Hari Ini */}
                      <div className="mt-auto pt-3 border-t-2 border-black/10">
                        {jadwal.isDone ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-center gap-1 bg-green-100 border-2 border-green-600 text-green-700 rounded-lg py-1 px-2">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-tight">Selesai Presensi</span>
                            </div>
                            <button 
                              onClick={() => openPresensiModal(jadwal)}
                              className="w-full bg-white hover:bg-slate-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all text-black text-center py-1.5 px-2 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <PenTool className="w-3 h-3" /> Edit
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => openPresensiModal(jadwal)}
                            className="w-full bg-blue-500 hover:bg-blue-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all text-black text-center py-1.5 px-2 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <PenTool className="w-3 h-3" /> Presensi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
      )}
      
    </div>

    {/* Modal Presensi (Layar Penuh / Sangat Besar - Diletakkan di luar div ber-animasi) */}
    {isModalOpen && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
        <form onSubmit={handleSubmitPresensi} className="bg-violet-200 border-4 border-black rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative animate-in zoom-in-95 duration-200">
          
          {/* Modal Header (Lebih Tipis) */}
          <div className="bg-white border-b-4 border-black px-4 py-2.5 flex justify-between items-center z-10 shrink-0">
            <div>
              <h2 className="text-base font-black uppercase text-black">{selectedJadwal?.isDone ? 'Edit Jurnal & Presensi' : 'Isi Jurnal & Presensi'}</h2>
              <p className="text-[10px] font-bold text-slate-600">Kelas: {selectedJadwal?.kelas?.tingkat} - {selectedJadwal?.kelas?.nama_rombel}</p>
            </div>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-red-500 border-2 border-black rounded-lg flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
              <X className="w-4 h-4 text-black font-bold" />
            </button>
          </div>

          {/* Modal Body (Scrollable, Rapat & Double Column di Desktop) */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            
            {/* Seksi Jurnal (Sangat Ringkas) */}
            <div className="bg-white border-4 border-black rounded-2xl p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <h3 className="text-xs font-black uppercase border-b-2 border-black pb-0.5 inline-block">Jurnal Pembelajaran</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-black uppercase text-slate-700">Materi yang Diajarkan *</label>
                  <textarea required value={jurnalForm.materi_sekarang} onChange={e => setJurnalForm({...jurnalForm, materi_sekarang: e.target.value})} className="w-full border-2 border-black rounded-xl p-2 bg-blue-50 outline-none focus:bg-blue-100 min-h-[50px] text-xs font-bold leading-normal" placeholder="Contoh: Bab 1 - Pengenalan Teks Observasi"></textarea>
                </div>
                
                <div className="space-y-0.5">
                  <label className="text-[10px] font-black uppercase text-slate-700">Materi Selanjutnya *</label>
                  <textarea required value={jurnalForm.materi_selanjutnya} onChange={e => setJurnalForm({...jurnalForm, materi_selanjutnya: e.target.value})} className="w-full border-2 border-black rounded-xl p-2 bg-pink-50 outline-none focus:bg-pink-100 min-h-[50px] text-xs font-bold leading-normal" placeholder="Contoh: Ulangan Harian Bab 1"></textarea>
                </div>
                
                <div className="space-y-0.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-700">Jumlah Jam Pelajaran *</label>
                  <input type="number" min="1" required value={jurnalForm.jumlah_jam} onChange={e => setJurnalForm({...jurnalForm, jumlah_jam: e.target.value})} className="w-full border-2 border-black rounded-xl p-1.5 bg-yellow-50 outline-none focus:bg-yellow-100 text-xs font-bold" placeholder="Contoh: 2" />
                </div>
              </div>
            </div>

            {/* Seksi Presensi Siswa */}
            <div className="bg-white border-4 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
              <div className="bg-yellow-400 border-b-2 border-black p-2 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase">Daftar Kehadiran Siswa</h3>
                  <p className="text-[9px] font-bold text-black/70">Tekan tombol status untuk mengubah kehadiran.</p>
                </div>
                <span className="bg-black text-white px-2 py-0.5 rounded text-[9px] font-black uppercase">Total: {siswaList.length}</span>
              </div>
              
              <div className="p-0">
                {loadingSiswa ? (
                  <div className="p-6 text-center font-bold uppercase animate-pulse text-xs">Memuat data siswa...</div>
                ) : siswaList.length === 0 ? (
                  <div className="p-6 text-center font-bold text-red-500 uppercase text-xs">Tidak ada siswa di kelas ini!</div>
                ) : (
                  <div className="divide-y-2 divide-black">
                    {siswaList.map((siswa, idx) => {
                      const sStatus = presensiState[siswa.id]?.status || 'Hadir';
                      return (
                        <div key={siswa.id} className="p-2 sm:p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                          
                          {/* Info Siswa */}
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-black text-white font-black text-[10px] flex items-center justify-center shrink-0 border border-black">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-black text-xs uppercase leading-tight">{siswa.nama_lengkap}</h4>
                              <span className="text-[9px] font-bold text-slate-500">NISN: {siswa.nisn || '-'}</span>
                            </div>
                          </div>
                          
                          {/* Aksi & Input */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                            {/* Tombol Status Kehadiran (Mini & Ringkas) */}
                            <div className="flex gap-0.5 shrink-0 bg-slate-200 border-2 border-black rounded-lg p-0.5 w-fit">
                              <button type="button" onClick={() => handleStatusChange(siswa.id, 'Hadir')} className={`w-6 h-6 rounded font-black text-[9px] border border-black transition-all ${sStatus === 'Hadir' ? 'bg-green-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white opacity-60 hover:opacity-100'}`}>H</button>
                              <button type="button" onClick={() => handleStatusChange(siswa.id, 'Alpa')} className={`w-6 h-6 rounded font-black text-[9px] border border-black transition-all ${sStatus === 'Alpa' ? 'bg-red-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white opacity-60 hover:opacity-100'}`}>A</button>
                              <button type="button" onClick={() => handleStatusChange(siswa.id, 'Izin')} className={`w-6 h-6 rounded font-black text-[9px] border border-black transition-all ${sStatus === 'Izin' ? 'bg-blue-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white opacity-60 hover:opacity-100'}`}>I</button>
                              <button type="button" onClick={() => handleStatusChange(siswa.id, 'Sakit')} className={`w-6 h-6 rounded font-black text-[9px] border border-black transition-all ${sStatus === 'Sakit' ? 'bg-yellow-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white opacity-60 hover:opacity-100'}`}>S</button>
                            </div>
                            
                            {/* Input Keterangan Rapi */}
                            <input 
                              type="text" 
                              placeholder="Keterangan..." 
                              value={presensiState[siswa.id]?.keterangan || ''}
                              onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                              className="w-full sm:w-32 px-1.5 py-0.5 border-2 border-black rounded-lg text-[10px] font-bold bg-white outline-none focus:bg-slate-100"
                            />
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Submit Button Area (Footer Tetap - Diluar Scroll - Sangat Ringkas) */}
          <div className="bg-white border-t-4 border-black p-2.5 shrink-0 z-20 flex-shrink-0">
            <button 
              type="submit" 
              disabled={isSubmitting || loadingSiswa || siswaList.length === 0}
              className="w-full py-2.5 bg-green-500 border-4 border-black rounded-xl font-black text-sm text-black uppercase shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'MENYIMPAN DATA...' : 'SIMPAN PRESENSI SEKARANG'}
            </button>
          </div>

        </form>
      </div>
    )}

  </>
  );
}
