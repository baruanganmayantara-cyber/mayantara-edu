import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  BookOpen, Plus, FileText, ArrowLeft, ArrowRight, CheckCircle, 
  Trash2, Printer, Sparkles, AlertCircle, ExternalLink, HelpCircle 
} from 'lucide-react';

export default function ModulAjar() {
  const [modulList, setModulList] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Tampilan / Flow
  const [view, setView] = useState('list'); // 'list' | 'create' | 'preview'
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModul, setSelectedModul] = useState(null);
  const [saving, setSaving] = useState(false);

  // Initial Form State
  const initialForm = {
    kelas_id: '',
    mapel_id: '',
    semester: '1',
    alokasi_waktu: '4 JP (2 Pertemuan)',
    fase: 'E',
    p3: [],
    sarana: 'Laptop, Proyektor, Internet, Buku Paket Siswa',
    target_peserta: 'Peserta Didik Reguler',
    mindful_activity: '',
    kesiapan_emosi: '',
    meaningful_challenge: '',
    meaningful_benefit: '',
    joyful_strategy: [],
    diferensiasi_tugas: [],
    kegiatan_pembelajaran: '',
    asesmen: [],
    drive_link: '',
    lkpd: '',
    status: 'draft'
  };

  const [formData, setFormData] = useState(initialForm);

  const guruId = localStorage.getItem('guruId');
  const guruName = localStorage.getItem('guruName') || 'Guru';

  const listP3 = [
    'Bernalar Kritis 🧠',
    'Mandiri 👤',
    'Gotong Royong 👥',
    'Kreatif 💡',
    'Kebinekaan Global 🌐',
    'Berakhlak Mulia 🌸'
  ];

  const listJoyful = [
    'Ice Breaking Interaktif 🎮',
    'Gamifikasi / Kuis Cepat 🎯',
    'Role-Playing (Bermain Peran) 🎭',
    'Diskusi Kolaboratif Kelompok 👥',
    'Eksperimen / Praktik Mandiri 🧪',
    'Presentasi Kreatif 📢'
  ];

  const listDiferensiasi = [
    'Laporan Tertulis 📝',
    'Video Presentasi Singkat 📹',
    'Desain Infografis / Mindmap 🎨',
    'Demonstrasi / Praktik Langsung 🛠️'
  ];

  const listAsesmen = [
    'Asesmen Diagnostik (Awal Pembelajaran)',
    'Asesmen Formatif (Selama Pembelajaran)',
    'Asesmen Sumatif (Akhir Pembelajaran)'
  ];

  useEffect(() => {
    if (guruId) {
      fetchData();
    }
  }, [guruId]);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch Kelas
      const { data: kelas } = await supabase.from('kelas').select('*').order('tingkat').order('nama_rombel');
      if (kelas) setKelasOptions(kelas);

      // Fetch Mapel
      const { data: mapel } = await supabase.from('mata_pelajaran').select('*').order('nama');
      if (mapel) setMapelOptions(mapel);

      // Fetch Modul Ajar Guru Ini
      const { data: modul, error } = await supabase
        .from('modul_ajar')
        .select('*, kelas(tingkat, nama_rombel), mata_pelajaran(nama)')
        .eq('guru_id', guruId)
        .order('created_at', { ascending: false });

      if (modul) setModulList(modul);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updated = { ...prev, [name]: value };
      // Auto-set Fase berdasarkan tingkat kelas jika terpilih
      if (name === 'kelas_id') {
        const selectedKelas = kelasOptions.find(k => k.id === value);
        if (selectedKelas) {
          // Fungsi cerdas mengekstrak tingkat baik dalam angka biasa maupun Romawi
          const parseTingkat = (val) => {
            if (!val) return 0;
            const str = String(val).toUpperCase().trim();
            
            // Periksa Angka Romawi
            if (str.includes('XII')) return 12;
            if (str.includes('XI')) return 11;
            if (str.includes('X')) return 10;
            if (str.includes('IX')) return 9;
            if (str.includes('VIII')) return 8;
            if (str.includes('VII')) return 7;
            if (str.includes('VI')) return 6;
            if (str.includes('V')) return 5;
            if (str.includes('IV')) return 4;
            if (str.includes('III')) return 3;
            if (str.includes('II')) return 2;
            if (str.includes('I')) return 1;

            // Periksa angka numerik regular
            const match = str.match(/\d+/);
            if (match) {
              return parseInt(match[0]);
            }
            return 0;
          };

          const t = parseTingkat(selectedKelas.tingkat);
          if (t === 1 || t === 2) {
            updated.fase = 'A';
          } else if (t === 3 || t === 4) {
            updated.fase = 'B';
          } else if (t === 5 || t === 6) {
            updated.fase = 'C';
          } else if (t === 7 || t === 8 || t === 9) {
            updated.fase = 'D';
          } else if (t === 10) {
            updated.fase = 'E';
          } else if (t === 11 || t === 12) {
            updated.fase = 'F';
          } else {
            updated.fase = 'E'; // Default fallback
          }
        }
      }
      return updated;
    });
  };

  const toggleArrayItem = (fieldName, item) => {
    setFormData(prev => {
      const arr = prev[fieldName] || [];
      const updated = arr.includes(item)
        ? arr.filter(x => x !== item)
        : [...arr, item];
      return { ...prev, [fieldName]: updated };
    });
  };

  const handleSave = async (statusVal = 'draft') => {
    if (!formData.kelas_id || !formData.mapel_id) {
      alert('Mohon pilih Kelas dan Mata Pelajaran terlebih dahulu.');
      return;
    }

    try {
      setSaving(true);
      
      // Hapus kolom relasi virtual agar tidak dikirim ke Supabase
      const cleanedFormData = { ...formData };
      delete cleanedFormData.kelas;
      delete cleanedFormData.mata_pelajaran;

      const payload = {
        ...cleanedFormData,
        guru_id: guruId,
        status: statusVal
      };

      let error;
      if (formData.id) {
        // Update
        const { error: err } = await supabase
          .from('modul_ajar')
          .update(payload)
          .eq('id', formData.id);
        error = err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from('modul_ajar')
          .insert([payload]);
        error = err;
      }

      if (error) throw error;

      alert(`Modul Ajar berhasil disimpan sebagai ${statusVal === 'terbit' ? 'Terbit' : 'Draft'}!`);
      setView('list');
      setFormData(initialForm);
      setCurrentStep(1);
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan modul: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (modul) => {
    // Pastikan semua nilai null dari database disaring ke string kosong / array kosong
    // agar binding state input React tetap berjalan secara 'controlled' dengan sempurna.
    const safeModul = {
      ...initialForm,
      ...modul,
      p3: modul.p3 || [],
      joyful_strategy: modul.joyful_strategy || [],
      diferensiasi_tugas: modul.diferensiasi_tugas || [],
      asesmen: modul.asesmen || [],
      drive_link: modul.drive_link || '',
      lkpd: modul.lkpd || '',
      mindful_activity: modul.mindful_activity || '',
      kesiapan_emosi: modul.kesiapan_emosi || '',
      meaningful_challenge: modul.meaningful_challenge || '',
      meaningful_benefit: modul.meaningful_benefit || '',
      kegiatan_pembelajaran: modul.kegiatan_pembelajaran || '',
    };
    setFormData(safeModul);
    setView('create');
    setCurrentStep(1);
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus Modul Ajar ini?')) {
      try {
        const { error } = await supabase.from('modul_ajar').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const triggerPrint = (modul) => {
    setSelectedModul(modul);
    setView('preview');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* HEADER UTAMA (Sembunyikan saat print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black leading-none">MODUL AJAR DEEP LEARNING</h2>
          <p className="text-slate-700 font-bold mt-2 uppercase tracking-wider text-xs">Pilar 3T: Mindful, Meaningful, Joyful Learning</p>
        </div>

        {view === 'list' && (
          <button 
            onClick={() => { setFormData(initialForm); setView('create'); setCurrentStep(1); }}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black px-5 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all font-black uppercase cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Buat Modul Ajar
          </button>
        )}

        {view !== 'list' && (
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-black border-4 border-black px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all font-black uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
        )}
      </div>

      {/* VIEW: LIST DAFTAR MODUL AJAR (Sembunyikan saat print) */}
      {view === 'list' && (
        <div className="print:hidden">
          {loading ? (
            <div className="text-center py-20 bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-xl animate-pulse uppercase">Memuat Data Modul Ajar...</span>
            </div>
          ) : modulList.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-2xl font-black uppercase mb-2">Belum Ada Modul Ajar</h3>
              <p className="text-slate-600 font-bold mb-6">Mulai buat rancangan pembelajaran Deep Learning (3T) yang interaktif sekarang juga!</p>
              <button 
                onClick={() => { setFormData(initialForm); setView('create'); }}
                className="bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase"
              >
                Buat Modul Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modulList.map((m) => (
                <div key={m.id} className="bg-white border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 transition-transform relative">
                  <div>
                    {/* Badge Status */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 text-xs font-black uppercase border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        m.status === 'terbit' ? 'bg-emerald-300' : 'bg-yellow-200'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-black uppercase text-black leading-tight mb-2 pr-20">{m.mata_pelajaran?.nama}</h3>
                    
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className="bg-blue-100 text-black border-2 border-black px-2 py-0.5 rounded-lg text-xs font-black">
                        KELAS {m.kelas?.tingkat} - {m.kelas?.nama_rombel}
                      </span>
                      <span className="bg-violet-100 text-black border-2 border-black px-2 py-0.5 rounded-lg text-xs font-black">
                        FASE {m.fase}
                      </span>
                    </div>

                    <div className="space-y-2 mb-6 border-t-2 border-black pt-4 text-sm font-semibold text-slate-700">
                      <p>✨ <strong className="text-black">Mindful:</strong> {m.mindful_activity ? (m.mindful_activity.substring(0, 45) + '...') : '-'}</p>
                      <p>🎯 <strong className="text-black">Meaningful:</strong> {m.meaningful_challenge ? (m.meaningful_challenge.substring(0, 45) + '...') : '-'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t-4 border-black pt-4">
                    <button 
                      onClick={() => handleEdit(m)}
                      className="flex-1 bg-yellow-300 hover:bg-yellow-200 border-2 border-black py-2 rounded-xl font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer"
                    >
                      Edit / Buka
                    </button>
                    <button 
                      onClick={() => triggerPrint(m)}
                      className="flex-1 bg-violet-300 hover:bg-violet-200 border-2 border-black py-2 rounded-xl font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak PDF
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className="bg-red-400 hover:bg-red-300 border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: FORM WIZARD INPUT (Sembunyikan saat print) */}
      {view === 'create' && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] print:hidden">
          
          {/* Form Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 pb-4 border-b-4 border-black">
            {[1, 2, 3, 4].map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`w-full text-center py-2.5 font-black uppercase tracking-wider text-xs border-2 border-black rounded-xl cursor-pointer transition-all ${
                  currentStep === stepNum 
                    ? 'bg-yellow-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5' 
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Langkah {stepNum}
              </button>
            ))}
          </div>

          {/* LANGKAH 1: INFORMASI UMUM */}
          {currentStep === 1 && (
             <div className="space-y-6">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 1: Identitas Modul & Karakter</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Mata Pelajaran *</label>
                  <select 
                    name="mapel_id" 
                    value={formData.mapel_id} 
                    onChange={handleInputChange} 
                    className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2.5 outline-none text-sm"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mapelOptions.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Rombel Kelas *</label>
                  <select 
                    name="kelas_id" 
                    value={formData.kelas_id} 
                    onChange={handleInputChange} 
                    className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2.5 outline-none text-sm"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {kelasOptions.map(k => <option key={k.id} value={k.id}>Kelas {k.tingkat} - {k.nama_rombel}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2.5 outline-none text-sm">
                    <option value="1">Semester Ganjil (1)</option>
                    <option value="2">Semester Genap (2)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Alokasi Waktu</label>
                  <input type="text" name="alokasi_waktu" value={formData.alokasi_waktu} onChange={handleInputChange} className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none text-sm" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Fase Ajar (Auto)</label>
                  <input type="text" name="fase" value={formData.fase} disabled className="w-full font-black text-center bg-slate-100 border-2 border-black rounded-xl px-3 py-2 opacity-70 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">Profil Pelajar Pancasila (P3) *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {listP3.map((p3Item) => {
                    const isSelected = formData.p3?.includes(p3Item);
                    return (
                      <button
                        key={p3Item}
                        type="button"
                        onClick={() => toggleArrayItem('p3', p3Item)}
                        className={`px-3 py-2.5 text-xs font-black border-2 border-black rounded-xl text-left cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5' 
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {p3Item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Sarana & Prasarana</label>
                  <input type="text" name="sarana" value={formData.sarana} onChange={handleInputChange} className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">Target Peserta Didik</label>
                  <input type="text" name="target_peserta" value={formData.target_peserta} onChange={handleInputChange} className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* LANGKAH 2: FORMULA DEEP LEARNING */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 2: Tiga Pilar Deep Learning (3T)</h3>
              
              {/* Mindful Card */}
              <div className="bg-violet-50 border-4 border-black rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-violet-400 border-2 border-black rounded-lg flex items-center justify-center font-black">1</span>
                  <h4 className="font-black uppercase text-black">Mindful Learning (Fokus & Kesadaran)</h4>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-violet-900 mb-1">Aktivitas Mindfulness Pembuka</label>
                  <input 
                    type="text" 
                    name="mindful_activity" 
                    value={formData.mindful_activity} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Mengheningkan cipta sejenak dan bernapas teknik STOP 3 kali sebelum materi dimulai."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-violet-900 mb-1">Rencana Kesiapan Emosi Siswa</label>
                  <input 
                    type="text" 
                    name="kesiapan_emosi" 
                    value={formData.kesiapan_emosi} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Menggunakan kartu emoji wajah untuk mengecek perasaan siswa hari ini."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              </div>

              {/* Meaningful Card */}
              <div className="bg-blue-50 border-4 border-black rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-400 border-2 border-black rounded-lg flex items-center justify-center font-black">2</span>
                  <h4 className="font-black uppercase text-black">Meaningful Learning (Kegunaan & Kontekstual)</h4>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-blue-900 mb-1">Tantangan Riil / Masalah Kontekstual</label>
                  <input 
                    type="text" 
                    name="meaningful_challenge" 
                    value={formData.meaningful_challenge} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Menganalisis kenapa koneksi internet rumah sering terputus."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-blue-900 mb-1">Manfaat Pembelajaran bagi Karir / Hidup Siswa</label>
                  <input 
                    type="text" 
                    name="meaningful_benefit" 
                    value={formData.meaningful_benefit} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Mempersiapkan siswa menjadi network engineer profesional di industri."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              </div>

              {/* Joyful Card */}
              <div className="bg-pink-50 border-4 border-black rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-pink-400 border-2 border-black rounded-lg flex items-center justify-center font-black">3</span>
                  <h4 className="font-black uppercase text-black">Joyful Learning (Interaksi & Kegembiraan)</h4>
                </div>
                
                <div>
                  <label className="block text-xs font-black uppercase text-pink-900 mb-2">Taktik Pembelajaran & Ice Breaking</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listJoyful.map(j => {
                      const isSelected = formData.joyful_strategy?.includes(j);
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => toggleArrayItem('joyful_strategy', j)}
                          className={`px-3 py-3 text-xs font-black border-2 border-black rounded-xl text-left cursor-pointer transition-all ${
                            isSelected ? 'bg-pink-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-pink-100'
                          }`}
                        >
                          {j}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-pink-900 mb-2">Opsi Diferensiasi Pengumpulan Tugas</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listDiferensiasi.map(d => {
                      const isSelected = formData.diferensiasi_tugas?.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleArrayItem('diferensiasi_tugas', d)}
                          className={`px-3 py-3 text-xs font-black border-2 border-black rounded-xl text-left cursor-pointer transition-all ${
                            isSelected ? 'bg-pink-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-pink-100'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LANGKAH 3: SKENARIO PEMBELAJARAN */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 3: Langkah Kegiatan & Asesmen</h3>
              
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Rincian Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)</label>
                <textarea 
                  name="kegiatan_pembelajaran" 
                  value={formData.kegiatan_pembelajaran} 
                  onChange={handleInputChange} 
                  rows="10" 
                  placeholder="Tulis langkah-langkah detail di sini.&#10;Contoh:&#10;1. Pendahuluan (15 Menit): Guru melakukan ice breaking tebak gambar...&#10;2. Inti (60 Menit): Siswa bekerja berkelompok merancang topologi...&#10;3. Penutup (15 Menit): Sesi refleksi dan tanya jawab..."
                  className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none font-mono text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">Rencana Asesmen (Penilaian)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {listAsesmen.map(a => {
                    const isSelected = formData.asesmen?.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleArrayItem('asesmen', a)}
                        className={`px-3 py-2.5 text-xs font-black border-2 border-black rounded-xl text-left cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LANGKAH 4: LAMPIRAN & DRIVE LINK */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 4: Aset & LKPD</h3>
              
              <div className="bg-emerald-50 border-4 border-black rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-emerald-600 w-6 h-6" />
                  <h4 className="font-black uppercase text-black">Bebas Beban Server - Link Google Drive</h4>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-emerald-950 mb-1">Tautan Folder / File Google Drive Materi Ajar</label>
                  <input 
                    type="url" 
                    name="drive_link" 
                    value={formData.drive_link} 
                    onChange={handleInputChange} 
                    placeholder="https://drive.google.com/drive/folders/your-shared-folder-link"
                    className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none"
                  />
                  <span className="text-[10px] font-bold text-slate-500 mt-1 block">💡 Pastikan izin akses folder Google Drive disetel ke "Siapa saja yang memiliki link" agar bisa diakses oleh murid/kepala sekolah.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">Lembar Kerja Peserta Didik (LKPD) Singkat / Ringkasan Penugasan</label>
                <textarea 
                  name="lkpd" 
                  value={formData.lkpd} 
                  onChange={handleInputChange} 
                  rows="6" 
                  placeholder="Tulis instruksi tugas utama siswa atau 3-5 pertanyaan latihan mandiri siswa..."
                  className="w-full font-bold bg-white border-2 border-black rounded-xl px-3 py-2 outline-none font-mono text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* BUTTON NAVIGATION FORM WIZARD */}
          <div className="mt-8 pt-6 border-t-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 border-2 border-black px-4 py-2.5 rounded-xl font-black uppercase text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Sebelumnya
                </button>
              )}
              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex items-center gap-2 bg-white hover:bg-slate-100 border-2 border-black px-4 py-2.5 rounded-xl font-black uppercase text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Selanjutnya
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="flex-1 sm:flex-none bg-yellow-200 hover:bg-yellow-300 border-4 border-black px-5 py-2.5 rounded-xl font-black uppercase text-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                {saving ? 'Menyimpan...' : 'Simpan Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('terbit')}
                disabled={saving}
                className="flex-1 sm:flex-none bg-emerald-400 hover:bg-emerald-300 border-4 border-black px-5 py-2.5 rounded-xl font-black uppercase text-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                {saving ? 'Proses...' : 'Terbitkan Modul'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* VIEW: CETAK / PREVIEW MODUL AJAR (Mode Print-Friendly) */}
      {view === 'preview' && selectedModul && (
        <div className="print-preview-area bg-white border-2 border-black p-4 sm:p-8 rounded-none max-w-4xl mx-auto shadow-none print:shadow-none print:border-none print:p-0">
          
          {/* Header Dinas Pendidikan */}
          <div className="text-center border-b-4 double border-black pb-4 mb-6">
            <h1 className="text-xl font-black uppercase tracking-tight leading-tight">YAYASAN PENDIDIKAN MAYANTARA</h1>
            <h2 className="text-2xl font-black uppercase tracking-tight leading-none mt-1">SMK TEKNOLOGI MAYANTARA EDU</h2>
            <p className="text-xs font-bold text-slate-600 mt-2 uppercase tracking-wide">Jl. Raya Digital No. 1, Kota Mayantara · Telp: (021) 888-999 · Email: info@mayantara-edu.sch.id</p>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-black uppercase tracking-wider underline">MODUL AJAR DEEP LEARNING (3T)</h3>
            <p className="text-xs font-bold text-slate-700 mt-1">Metode: Mindful, Meaningful, & Joyful Learning</p>
          </div>

          {/* I. INFORMASI UMUM */}
          <div className="space-y-4 mb-6">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">I. INFORMASI UMUM</h4>
            <table className="w-full text-xs font-bold border-collapse border-2 border-black">
              <tbody>
                <tr className="border-b border-black">
                  <td className="w-1/3 p-2 bg-slate-100 border-r border-black uppercase">Penyusun</td>
                  <td className="p-2">{guruName}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Mata Pelajaran</td>
                  <td className="p-2">{selectedModul.mata_pelajaran?.nama}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Kelas / Rombel</td>
                  <td className="p-2">Kelas {selectedModul.kelas?.tingkat} - {selectedModul.kelas?.nama_rombel}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Semester / Alokasi Waktu</td>
                  <td className="p-2">Semester {selectedModul.semester} / {selectedModul.alokasi_waktu}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Fase Ajar</td>
                  <td className="p-2">Fase {selectedModul.fase}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Profil Pelajar Pancasila (P3)</td>
                  <td className="p-2">{(selectedModul.p3 || []).join(', ') || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Sarana & Prasarana</td>
                  <td className="p-2">{selectedModul.sarana || '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Target Peserta Didik</td>
                  <td className="p-2">{selectedModul.target_peserta || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* II. FORMULA DEEP LEARNING (3T) */}
          <div className="space-y-4 mb-6 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">II. FORMULA DEEP LEARNING (3T)</h4>
            
            <div className="space-y-3">
              <div className="border border-black p-3 rounded-lg text-xs font-semibold">
                <h5 className="font-black uppercase text-violet-900 mb-1">🧠 PILAR 1: MINDFUL LEARNING (FOKUS & KESADARAN)</h5>
                <p className="mb-2"><strong className="text-black uppercase text-[10px]">Aktivitas Mindfulness Pembuka:</strong> {selectedModul.mindful_activity || '-'}</p>
                <p><strong className="text-black uppercase text-[10px]">Rencana Kesiapan Emosi Siswa:</strong> {selectedModul.kesiapan_emosi || '-'}</p>
              </div>

              <div className="border border-black p-3 rounded-lg text-xs font-semibold">
                <h5 className="font-black uppercase text-blue-900 mb-1">🎯 PILAR 2: MEANINGFUL LEARNING (BERMAKNA & KONTEKSTUAL)</h5>
                <p className="mb-2"><strong className="text-black uppercase text-[10px]">Tantangan Riil / Masalah:</strong> {selectedModul.meaningful_challenge || '-'}</p>
                <p><strong className="text-black uppercase text-[10px]">Manfaat Bagi Masa Depan Siswa:</strong> {selectedModul.meaningful_benefit || '-'}</p>
              </div>

              <div className="border border-black p-3 rounded-lg text-xs font-semibold">
                <h5 className="font-black uppercase text-pink-900 mb-1">🎉 PILAR 3: JOYFUL LEARNING (MENYENANGKAN)</h5>
                <p className="mb-2"><strong className="text-black uppercase text-[10px]">Strategi Belajar Interaktif:</strong> {(selectedModul.joyful_strategy || []).join(', ') || '-'}</p>
                <p><strong className="text-black uppercase text-[10px]">Opsi Diferensiasi Tugas:</strong> {(selectedModul.diferensiasi_tugas || []).join(', ') || '-'}</p>
              </div>
            </div>
          </div>

          {/* III. SKENARIO KEGIATAN PEMBELAJARAN */}
          <div className="space-y-3 mb-6 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">III. SKENARIO KEGIATAN PEMBELAJARAN</h4>
            <div className="border border-black p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {selectedModul.kegiatan_pembelajaran || 'Belum diisi.'}
            </div>
            <p className="text-xs font-bold"><strong className="text-black">Rencana Asesmen:</strong> {(selectedModul.asesmen || []).join(', ') || '-'}</p>
          </div>

          {/* IV. LAMPIRAN & MEDIA */}
          <div className="space-y-4 mb-10 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">IV. LAMPIRAN & MEDIA</h4>
            
            {selectedModul.drive_link && (
              <div className="border border-black p-3 rounded-lg text-xs font-semibold flex items-center justify-between print:hidden">
                <div>
                  <h5 className="font-black uppercase text-emerald-900 mb-0.5">📂 LINK MATERI AJAR (GOOGLE DRIVE)</h5>
                  <p className="text-[10px] text-slate-500">Materi penunjang pembelajaran online</p>
                </div>
                <a href={selectedModul.drive_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-85">
                  Buka Link <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="border border-black p-3 rounded-lg text-xs">
              <h5 className="font-black uppercase mb-2">📝 LEMBAR KERJA PESERTA DIDIK (LKPD) / TUGAS MANDIRI</h5>
              <div className="font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 p-2 border border-slate-300 rounded">
                {selectedModul.lkpd || 'Belum diisi.'}
              </div>
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="flex justify-between items-center text-xs font-bold mt-12 break-inside-avoid">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p className="mb-16">Kepala Sekolah SMK Mayantara Edu</p>
              <p className="underline uppercase">Dr. Mayantara, M.Pd.</p>
              <p className="text-[10px] text-slate-500">NIP. 19750824 200003 1 001</p>
            </div>
            <div className="text-center">
              <p>Mayantara, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mb-16">Guru Mata Pelajaran</p>
              <p className="underline uppercase">{guruName}</p>
              <p className="text-[10px] text-slate-500">Pendidik Mayantara Edu</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
