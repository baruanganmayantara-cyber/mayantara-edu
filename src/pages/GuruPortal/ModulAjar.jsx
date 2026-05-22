import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  BookOpen, Plus, FileText, ArrowLeft, ArrowRight, CheckCircle, 
  Trash2, Printer, Sparkles, AlertCircle, ExternalLink, HelpCircle 
} from 'lucide-react';

const presets3T = {
  rpl: {
    nama: 'Teknologi & Informasi (RPL/IT)',
    mindful: [
      {
        label: 'Relaksasi STOP Koding',
        text: 'Menghentikan seluruh aktivitas mengetik (STOP), melakukan pernapasan perut lambat 3 kali untuk menjernihkan pikiran koding, mengamati rasa tegang di jari-jari, lalu tersenyum sebelum lanjut belajar.'
      },
      {
        label: 'Fokus Suara Kipas / Lab',
        text: 'Siswa memejamkan mata selama 1 menit, mendengarkan getaran suara kipas komputer/AC di laboratorium secara sadar untuk membumikan perhatian pada momen saat ini.'
      }
    ],
    meaningful: [
      {
        label: 'Studi Kasus Bug Aplikasi Nyata',
        challenge: 'Aplikasi belanja online yang sering crash saat pengguna melakukan transaksi checkout pembayaran.',
        benefit: 'Memahami pentingnya penanganan error koding untuk mencegah kerugian finansial bisnis jutaan rupiah dan melatih kesiapan sebagai Backend Developer profesional.'
      },
      {
        label: 'Sistem Keamanan Smart Home',
        challenge: 'Menganalisis celah keamanan ketika sensor Internet of Things (IoT) pintu rumah bisa diretas orang asing.',
        benefit: 'Belajar enkripsi jaringan untuk melindungi privasi data keluarga di era rumah cerdas masa depan.'
      }
    ]
  },
  sains: {
    nama: 'Sains & Alam (Fisika/Kimia/Bio)',
    mindful: [
      {
        label: 'Observasi Objek Alami',
        text: 'Siswa mengambil satu benda di sekitar (daun, batu, atau pensil) dan mengamatinya secara penuh perhatian selama 1 menit (tekstur, warna, detail mikro) untuk mengistirahatkan pikiran luar.'
      },
      {
        label: 'Bernapas Ritme Paru-paru',
        text: 'Melakukan pernapasan meditasi dengan menghirup napas 4 detik, menahan 4 detik, dan menghembuskan 4 detik, meraba denyut nadi sendiri untuk menyelaraskan ritme biologis tubuh.'
      }
    ],
    meaningful: [
      {
        label: 'Pencemaran Sungai Lokal',
        challenge: 'Sungai di dekat sekolah yang berubah hitam dan berbau menyengat akibat limbah plastik detergen rumah tangga.',
        benefit: 'Menguasai konsep reaksi kimia asam-basa untuk merancang sistem penjernih air sederhana bagi masyarakat sekitar.'
      },
      {
        label: 'Konservasi Energi Rumah Tangga',
        challenge: 'Melonjaknya tagihan listrik bulanan akibat penggunaan AC dan peralatan elektronik yang kurang efisien.',
        benefit: 'Menerapkan hukum kekekalan energi untuk mendesain rumah ramah lingkungan yang hemat listrik dan biaya.'
      }
    ]
  },
  matematika: {
    nama: 'Matematika & Logika',
    mindful: [
      {
        label: 'Menghitung Napas Mundur',
        text: 'Siswa memejamkan mata dan menghitung mundur dari 20 ke 1 secara perlahan, hanya berfokus pada visualisasi angka di pikiran seiring tarikan napas.'
      },
      {
        label: 'Pola Geometri Pikiran',
        text: 'Siswa membayangkan sebuah bentuk lingkaran sempurna di pikiran, menarik napas seiring memperbesar lingkaran tersebut, dan menghembuskan napas seiring mengecilkannya.'
      }
    ],
    meaningful: [
      {
        label: 'Estimasi Angsuran Impian',
        challenge: 'Menghitung bagaimana bunga majemuk atau kredit bank dapat melipatgandakan hutang jika tidak dipahami dengan cermat.',
        benefit: 'Memiliki kecerdasan finansial sejak dini agar mampu merencanakan anggaran investasi masa depan dan menghindari jebakan hutang konsumtif.'
      },
      {
        label: 'Statistika Tren Media Sosial',
        challenge: 'Menentukan mengapa video atau konten tertentu bisa viral di TikTok berdasarkan algoritma distribusi data statistika.',
        benefit: 'Menjadi ahli data analyst yang mampu membaca peluang pasar digital untuk memasarkan produk secara efektif.'
      }
    ]
  },
  bahasa: {
    nama: 'Bahasa & Sosial',
    mindful: [
      {
        label: 'Mendengar Kata Positif',
        text: 'Guru menyebutkan satu kata positif (misal: "Sabar", "Damai", "Gigih"). Siswa memejamkan mata dan merenungkan makna kata tersebut bagi diri mereka hari ini selama 1 menit.'
      },
      {
        label: 'Menulis Jurnal Rasa Syukur',
        text: 'Siswa menuliskan satu hal kecil yang paling mereka syukuri hari ini dalam satu kalimat pendek sebelum materi pembelajaran dimulai.'
      }
    ],
    meaningful: [
      {
        label: 'Retorika Debat Publik / Hoaks',
        challenge: 'Beredarnya berita bohong (hoaks) di grup chat keluarga yang memicu perselisihan antar-anggota keluarga.',
        benefit: 'Melatih kemampuan literasi kritis dan seni berkomunikasi persuasif yang dibutuhkan untuk profesi Humas, Jurnalis, atau Pengacara.'
      },
      {
        label: 'Resolusi Konflik Sosial Kelas',
        challenge: 'Perselisihan kelompok yang terjadi akibat salah paham dalam pembagian tugas kerja kelompok.',
        benefit: 'Memahami sosiologi interaksi sosial untuk menjadi pemimpin yang bijaksana dan penengah konflik yang andal.'
      }
    ]
  },
  umum: {
    nama: 'Umum & Karakter',
    mindful: [
      {
        label: 'Teknik Relaksasi Otot Leher',
        text: 'Melakukan peregangan otot leher secara sadar (menoleh ke kiri, kanan, atas, bawah perlahan) seraya membuang ketegangan fisik tubuh dari jam pelajaran sebelumnya.'
      }
    ],
    meaningful: [
      {
        label: 'Keterampilan Manajemen Waktu',
        challenge: 'Siswa merasa kewalahan dan kehabisan waktu akibat menunda-nunda tugas sekolah hingga menumpuk di akhir pekan.',
        benefit: 'Menguasai skala prioritas waktu (Eisenhower Matrix) untuk menyeimbangkan belajar, hobi, dan istirahat tanpa stres.'
      }
    ]
  }
};

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

  // State untuk 3T Presets
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState('rpl');

  // State untuk Fallback Migrasi Database
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationErrorMsg, setMigrationErrorMsg] = useState('');
  const [pendingStatusVal, setPendingStatusVal] = useState('draft');

  // Helper untuk validasi kelengkapan langkah
  const isStepCompleted = (stepNum) => {
    if (stepNum === 1) {
      return !!(formData.kelas_id && formData.mapel_id && formData.p3?.length > 0);
    }
    if (stepNum === 2) {
      return !!(formData.cp?.trim().length > 5 && formData.atp?.trim().length > 5);
    }
    if (stepNum === 3) {
      return !!((formData.mindful_activity || formData.kesiapan_emosi) && 
               (formData.meaningful_challenge || formData.meaningful_benefit) && 
               formData.joyful_strategy?.length > 0);
    }
    if (stepNum === 4) {
      return !!(formData.kegiatan_pembelajaran?.trim().length > 10 && formData.asesmen?.length > 0);
    }
    if (stepNum === 5) {
      return !!(formData.materi?.trim().length > 5 && formData.buku_ajar?.trim().length > 5);
    }
    if (stepNum === 6) {
      return !!(formData.drive_link || formData.lkpd?.trim());
    }
    return false;
  };

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
    cp: '',
    atp: '',
    kktp: '',
    prota: '',
    promes: '',
    materi: '',
    buku_ajar: '',
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
      const errMsg = err.message || '';
      // Periksa apakah error dikarenakan kolom skema yang belum termigrasi
      if (
        errMsg.includes('column') && 
        (errMsg.includes('does not exist') || errMsg.includes('not found') || errMsg.includes('schema') || errMsg.includes('cache'))
      ) {
        setPendingStatusVal(statusVal);
        setMigrationErrorMsg(errMsg);
        setShowMigrationModal(true);
      } else {
        alert('Gagal menyimpan modul: ' + errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBypassSave = async () => {
    try {
      setSaving(true);
      
      // Hapus kolom relasi virtual
      const cleanedFormData = { ...formData };
      delete cleanedFormData.kelas;
      delete cleanedFormData.mata_pelajaran;
      
      // Hapus 7 kolom fitur baru Kurikulum Merdeka agar tidak bentrok dengan skema lama
      const newFields = ['cp', 'atp', 'kktp', 'prota', 'promes', 'materi', 'buku_ajar'];
      newFields.forEach(field => {
        delete cleanedFormData[field];
      });

      const payload = {
        ...cleanedFormData,
        guru_id: guruId,
        status: pendingStatusVal
      };

      let error;
      if (formData.id) {
        const { error: err } = await supabase
          .from('modul_ajar')
          .update(payload)
          .eq('id', formData.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('modul_ajar')
          .insert([payload]);
        error = err;
      }

      if (error) throw error;

      alert(`[Bypass] Modul Ajar berhasil disimpan (tanpa field administrasi baru) sebagai ${pendingStatusVal === 'terbit' ? 'Terbit' : 'Draft'}!`);
      setShowMigrationModal(false);
      setView('list');
      setFormData(initialForm);
      setCurrentStep(1);
      fetchData();
    } catch (err) {
      alert('Gagal melakukan bypass save: ' + err.message);
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
      cp: modul.cp || '',
      atp: modul.atp || '',
      kktp: modul.kktp || '',
      prota: modul.prota || '',
      promes: modul.promes || '',
      materi: modul.materi || '',
      buku_ajar: modul.buku_ajar || '',
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 pb-4 border-b-4 border-black">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => {
              const completed = isStepCompleted(stepNum);
              return (
                <button
                  key={stepNum}
                  type="button"
                  onClick={() => setCurrentStep(stepNum)}
                  className={`w-full text-center py-2.5 font-black uppercase tracking-wider text-xs border-2 border-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    currentStep === stepNum 
                      ? 'bg-yellow-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5' 
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  Langkah {stepNum}
                  {completed && (
                    <span className="w-4 h-4 bg-emerald-400 border border-black rounded-full flex items-center justify-center text-[9px] font-black text-black">✓</span>
                  )}
                </button>
              );
            })}
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

          {/* LANGKAH 2: KURIKULUM & CAPAIAN */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 2: Capaian & Alur Pembelajaran (CP / ATP)</h3>
              
              <div className="bg-sky-50 border-4 border-black rounded-2xl p-5 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-sky-900">Capaian Pembelajaran (CP) *</label>
                  <p className="text-[9px] font-bold text-sky-700">Tuliskan target kompetensi umum akhir fase pembelajaran Kurikulum Merdeka untuk mata pelajaran ini.</p>
                  <textarea 
                    name="cp" 
                    rows="4"
                    value={formData.cp} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Pada akhir fase E, peserta didik mampu memahami, merancang, mendokumentasikan, menguji, dan memelihara aplikasi perangkat lunak..."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-sky-100/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-sky-900">Alur Tujuan Pembelajaran (ATP) *</label>
                  <p className="text-[9px] font-bold text-sky-700">Rincian rangkaian tujuan pembelajaran yang disusun secara logis menurut urutan pembelajaran dari awal hingga akhir fase.</p>
                  <textarea 
                    name="atp" 
                    rows="4"
                    value={formData.atp} 
                    onChange={handleInputChange}
                    placeholder="Contoh: 10.1 Menganalisis kebutuhan perangkat lunak; 10.2 Menyusun pemodelan struktur data relasional; 10.3 Melakukan pemrograman dasar..."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-sky-100/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-sky-900">Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</label>
                  <p className="text-[9px] font-bold text-sky-700">Kriteria, deskripsi, atau rubrik penentu ketercapaian tujuan pembelajaran siswa (kriteria ketuntasan).</p>
                  <textarea 
                    name="kktp" 
                    rows="3"
                    value={formData.kktp} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Siswa dianggap mencapai tujuan jika mampu menjelaskan konsep dengan persentase kriteria kelayakan >= 75% serta menyelesaikan penugasan mandiri."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-sky-100/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LANGKAH 3: FORMULA DEEP LEARNING */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 3: Tiga Pilar Deep Learning (3T)</h3>
              
              {/* Asisten Inspirasi 3T (Presets) */}
              <div className="bg-yellow-100 border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-black leading-tight">Asisten Inspirasi 3T</h4>
                    <p className="text-[10px] font-bold text-slate-700 mt-0.5">Dapatkan rekomendasi otomatis berdasarkan rumpun pelajaran untuk membantu pengisian modul.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPresetOpen(true)}
                  className="bg-white hover:bg-slate-100 border-4 border-black px-5 py-2.5 rounded-2xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer w-full md:w-auto text-center"
                >
                  Rekomendasi Cepat 3T 💡
                </button>
              </div>

              {/* Mindful Card */}
              <div className="bg-violet-50 border-4 border-black rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-violet-400 border-2 border-black rounded-lg flex items-center justify-center font-black">1</span>
                  <h4 className="font-black uppercase text-black">Mindful Learning (Fokus & Kesadaran)</h4>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-violet-900">Aktivitas Mindfulness Pembuka *</label>
                  <p className="text-[9px] font-bold text-violet-700">Rencana peregangan otot, hening sejenak, atau latihan pernapasan agar siswa fokus sebelum mulai.</p>
                  <textarea 
                    name="mindful_activity" 
                    rows="3"
                    value={formData.mindful_activity} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Mengheningkan cipta sejenak dan bernapas teknik STOP 3 kali sebelum materi dimulai."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-violet-100/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-violet-900">Rencana Kesiapan Emosi Siswa *</label>
                  <p className="text-[9px] font-bold text-violet-700">Taktik memantau kesiapan mental siswa, misalnya dengan kartu emoji perasaan atau cerita pembuka.</p>
                  <textarea 
                    name="kesiapan_emosi" 
                    rows="3"
                    value={formData.kesiapan_emosi} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Menggunakan kartu emoji wajah untuk mengecek perasaan siswa hari ini."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-violet-100/30"
                  />
                </div>
              </div>

              {/* Meaningful Card */}
              <div className="bg-blue-50 border-4 border-black rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-400 border-2 border-black rounded-lg flex items-center justify-center font-black">2</span>
                  <h4 className="font-black uppercase text-black">Meaningful Learning (Kegunaan & Kontekstual)</h4>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-blue-900">Tantangan Riil / Masalah Kontekstual *</label>
                  <p className="text-[9px] font-bold text-blue-700">Hubungkan materi dengan studi kasus nyata di dunia nyata atau masalah sekitar siswa.</p>
                  <textarea 
                    name="meaningful_challenge" 
                    rows="3"
                    value={formData.meaningful_challenge} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Menganalisis kenapa koneksi internet rumah sering terputus."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-blue-100/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-blue-900">Manfaat Pembelajaran bagi Karir / Hidup Siswa *</label>
                  <p className="text-[9px] font-bold text-blue-700">Jelaskan mengapa materi ini berguna untuk pekerjaan masa depan atau penyelesaian masalah sehari-hari.</p>
                  <textarea 
                    name="meaningful_benefit" 
                    rows="3"
                    value={formData.meaningful_benefit} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Mempersiapkan siswa menjadi network engineer profesional di industri."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-blue-100/30"
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

          {/* LANGKAH 4: SKENARIO PEMBELAJARAN */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 4: Skenario Kegiatan & Asesmen</h3>
              
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

          {/* LANGKAH 5: PROGRAM & BAHAN AJAR */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 5: Program & Rujukan (Prota / Promes / Materi / Buku Ajar)</h3>
              
              <div className="bg-amber-50 border-4 border-black rounded-2xl p-5 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-black uppercase text-amber-900">Program Tahunan (Prota) Rujukan</label>
                    <p className="text-[9px] font-bold text-amber-700">Keterangan target kurikulum tahunan atau integrasi materi pada kalender akademik tahunan.</p>
                    <input 
                      type="text" 
                      name="prota" 
                      value={formData.prota} 
                      onChange={handleInputChange}
                      placeholder="Contoh: Terintegrasi pada agenda Prota semester ganjil tahun ajaran 2026/2027."
                      className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-amber-100/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-black uppercase text-amber-900">Program Semester (Promes) Rujukan</label>
                    <p className="text-[9px] font-bold text-amber-700">Penjadwalan alokasi waktu pembelajaran per unit/materi per minggu dalam semester.</p>
                    <input 
                      type="text" 
                      name="promes" 
                      value={formData.promes} 
                      onChange={handleInputChange}
                      placeholder="Contoh: Dialokasikan pada minggu ke-3 & ke-4 bulan September semester 1."
                      className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-amber-100/30"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-amber-900">Ringkasan Materi Pokok *</label>
                  <p className="text-[9px] font-bold text-amber-700">Tulis ringkasan singkat materi esensial/konsep utama yang akan dipelajari oleh siswa.</p>
                  <textarea 
                    name="materi" 
                    rows="4"
                    value={formData.materi} 
                    onChange={handleInputChange}
                    placeholder="Contoh: 1. Konsep dasar pemodelan data relasional; 2. Tipe data dan constraint; 3. Operasi DDL (CREATE, ALTER, DROP) & DML (SELECT, INSERT, UPDATE, DELETE)..."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-amber-100/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase text-amber-900">Buku & Bahan Ajar Rujukan *</label>
                  <p className="text-[9px] font-bold text-amber-700">Daftar buku paket siswa, modul elektronik, modul ajar buatan guru, atau sumber referensi tepercaya.</p>
                  <textarea 
                    name="buku_ajar" 
                    rows="3"
                    value={formData.buku_ajar} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Buku Siswa RPL Kelas X Kemendikbudristek 2021, E-Book Pemrograman Dasar SMK Mayantara, Dokumentasi Resmi W3Schools."
                    className="w-full font-bold bg-white border-2 border-black rounded-xl p-3 outline-none text-xs leading-relaxed focus:bg-amber-100/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LANGKAH 6: LAMPIRAN & DRIVE LINK */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Langkah 6: Aset & LKPD</h3>
              
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
              {currentStep < 6 && (
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
            <h3 className="text-lg font-black uppercase tracking-wider underline">DOKUMEN ADMINISTRASI GURU</h3>
            <h4 className="text-md font-black uppercase tracking-wider mt-1 text-slate-800">MODUL AJAR DEEP LEARNING & KURIKULUM MERDEKA</h4>
            <p className="text-xs font-bold text-slate-700 mt-1">Sistem Terintegrasi Administrasi Guru Mayantara</p>
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

          {/* II. CAPAIAN & ALUR PEMBELAJARAN (CP / ATP / KKTP) */}
          <div className="space-y-4 mb-6 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">II. CAPAIAN & ALUR PEMBELAJARAN (CP / ATP / KKTP)</h4>
            <div className="border-2 border-black p-3 text-xs font-semibold space-y-3 leading-relaxed">
              <div>
                <h5 className="font-black text-black text-[10px] uppercase mb-1">🎯 CAPAIAN PEMBELAJARAN (CP)</h5>
                <p className="bg-slate-50 p-2 border border-slate-300 rounded font-normal text-slate-700 whitespace-pre-wrap">{selectedModul.cp || '-'}</p>
              </div>
              <div>
                <h5 className="font-black text-black text-[10px] uppercase mb-1">⛓️ ALUR TUJUAN PEMBELAJARAN (ATP)</h5>
                <p className="bg-slate-50 p-2 border border-slate-300 rounded font-normal text-slate-700 whitespace-pre-wrap">{selectedModul.atp || '-'}</p>
              </div>
              <div>
                <h5 className="font-black text-black text-[10px] uppercase mb-1">📈 KRITERIA KETERGAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h5>
                <p className="bg-slate-50 p-2 border border-slate-300 rounded font-normal text-slate-700 whitespace-pre-wrap">{selectedModul.kktp || '-'}</p>
              </div>
            </div>
          </div>

          {/* III. MATERI AJAR & REFERENSI BUKU */}
          <div className="space-y-4 mb-6 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">III. MATERI AJAR & REFERENSI BUKU</h4>
            <div className="border-2 border-black p-3 text-xs font-semibold space-y-3 leading-relaxed">
              <div>
                <h5 className="font-black text-black text-[10px] uppercase mb-1">📖 RINGKASAN MATERI POKOK</h5>
                <p className="bg-slate-50 p-2 border border-slate-300 rounded font-normal text-slate-700 whitespace-pre-wrap">{selectedModul.materi || '-'}</p>
              </div>
              <div>
                <h5 className="font-black text-black text-[10px] uppercase mb-1">📚 BUKU & BAHAN AJAR RUJUKAN</h5>
                <p className="bg-slate-50 p-2 border border-slate-300 rounded font-normal text-slate-700 whitespace-pre-wrap">{selectedModul.buku_ajar || '-'}</p>
              </div>
            </div>
          </div>

          {/* IV. FORMULA PEMBELAJARAN DEEP LEARNING (3T) */}
          <div className="space-y-4 mb-6 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">IV. FORMULA PEMBELAJARAN DEEP LEARNING (3T)</h4>
            
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

          {/* V. SKENARIO KEGIATAN BELAJAR MENGAJAR (KBM) */}
          <div className="space-y-3 mb-6 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">V. SKENARIO KEGIATAN BELAJAR MENGAJAR (KBM) & ASESMEN</h4>
            <div className="border border-black p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {selectedModul.kegiatan_pembelajaran || 'Belum diisi.'}
            </div>
            <p className="text-xs font-bold"><strong className="text-black uppercase text-[10px]">Rencana Asesmen:</strong> {(selectedModul.asesmen || []).join(', ') || '-'}</p>
          </div>

          {/* VI. PROGRAM ACUAN TAHUNAN & SEMESTER (PROTA / PROMES) */}
          <div className="space-y-4 mb-6 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">VI. PROGRAM ACUAN TAHUNAN & SEMESTER (PROTA / PROMES)</h4>
            <table className="w-full text-xs font-bold border-collapse border-2 border-black">
              <tbody>
                <tr className="border-b border-black">
                  <td className="w-1/3 p-2 bg-slate-100 border-r border-black uppercase">Program Tahunan (Prota)</td>
                  <td className="p-2 font-normal text-slate-700">{selectedModul.prota || '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-100 border-r border-black uppercase">Program Semester (Promes)</td>
                  <td className="p-2 font-normal text-slate-700">{selectedModul.promes || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VII. LAMPIRAN & MEDIA */}
          <div className="space-y-4 mb-10 break-inside-avoid">
            <h4 className="font-black border-b-2 border-black pb-1 uppercase text-sm">VII. LAMPIRAN & MEDIA</h4>
            
            {selectedModul.drive_link && (
              <div className="border border-black p-3 rounded-lg text-xs font-semibold flex items-center justify-between print:hidden mb-3">
                <div>
                  <h5 className="font-black uppercase text-emerald-900 mb-0.5">📂 LINK MATERI AJAR (GOOGLE DRIVE)</h5>
                  <p className="text-[10px] text-slate-500">Materi penunjang pembelajaran online</p>
                </div>
                <a href={selectedModul.drive_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-85">
                  Buka Link <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {selectedModul.drive_link && (
              <div className="hidden print:block border border-black p-2 rounded text-xs font-bold mb-3">
                <span className="text-black">Tautan Materi Google Drive: </span>
                <span className="text-slate-600 font-mono font-normal">{selectedModul.drive_link}</span>
              </div>
            )}

            <div className="border border-black p-3 rounded-lg text-xs">
              <h5 className="font-black uppercase mb-2">📝 LEMBAR KERJA PESERTA DIDIK (LKPD) / TUGAS MANDIRI</h5>
              <div className="font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 p-2 border border-slate-300 rounded">
                {selectedModul.lkpd || 'Belum diisi.'}
              </div>
            </div>
          </div>

          {/* VIII. PENGESAHAN DOKUMEN */}
          <div className="flex justify-between items-center text-xs font-bold mt-12 break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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

      {/* MODAL PRESET REKOMENDASI 3T */}
      {isPresetOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-yellow-400 border-b-4 border-black px-4 py-3 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-black" />
                <h3 className="font-black text-sm uppercase text-black leading-none">Asisten Inspirasi 3T (Presets)</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPresetOpen(false)} 
                className="w-8 h-8 bg-red-500 border-2 border-black rounded-lg flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-sm font-black text-black"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">Pilih Rumpun Pelajaran:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.keys(presets3T).map((catKey) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedPresetCategory(catKey)}
                      className={`py-2 px-1 text-[10px] font-black uppercase border-2 border-black rounded-xl cursor-pointer text-center transition-all ${
                        selectedPresetCategory === catKey
                          ? 'bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                          : 'bg-slate-100 hover:bg-slate-200 text-black'
                      }`}
                    >
                      {presets3T[catKey].nama.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t-2 border-black pt-4">
                <h4 className="font-black text-xs uppercase text-slate-800">💡 Preset Terpilih: <span className="underline">{presets3T[selectedPresetCategory].nama}</span></h4>
                
                <div className="space-y-4">
                  {/* Mindful Presets */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-violet-900 tracking-wider">🧠 Rekomendasi Mindful (Pembuka & Emosi)</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {presets3T[selectedPresetCategory].mindful.map((m, idx) => (
                        <div key={idx} className="bg-violet-50 border-2 border-black rounded-xl p-3 flex flex-col justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-violet-100/50 transition-colors">
                          <div>
                            <span className="font-black text-xs text-violet-950 block mb-1">🌿 {m.label}</span>
                            <p className="text-[11px] font-bold text-slate-700 leading-normal">{m.text}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, mindful_activity: m.text }));
                              alert('Taktik Mindfulness disalin ke kolom Mindful Activity!');
                            }}
                            className="self-end bg-white hover:bg-violet-200 border-2 border-black px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer text-black"
                          >
                            Terapkan Ke Modul ✍️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meaningful Presets */}
                  <div className="space-y-2 pt-2">
                    <h5 className="text-[10px] font-black uppercase text-blue-900 tracking-wider">🎯 Rekomendasi Meaningful (Tantangan & Manfaat)</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {presets3T[selectedPresetCategory].meaningful.map((m, idx) => (
                        <div key={idx} className="bg-blue-50 border-2 border-black rounded-xl p-3 flex flex-col justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-100/50 transition-colors">
                          <div>
                            <span className="font-black text-xs text-blue-950 block mb-1.5">🔥 {m.label}</span>
                            <div className="space-y-1.5 text-[11px] font-bold text-slate-700 leading-normal">
                              <p>💡 <strong className="text-black">Tantangan:</strong> {m.challenge}</p>
                              <p>🚀 <strong className="text-black">Manfaat:</strong> {m.benefit}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                meaningful_challenge: m.challenge,
                                meaningful_benefit: m.benefit 
                              }));
                              alert('Tantangan & Manfaat disalin ke kolom Meaningful!');
                            }}
                            className="self-end bg-white hover:bg-blue-200 border-2 border-black px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer text-black"
                          >
                            Terapkan Ke Modul ✍️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 border-t-4 border-black p-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsPresetOpen(false)}
                className="bg-black hover:bg-slate-800 text-white border-2 border-black px-5 py-2 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Tutup Asisten
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL MIGRASI FALLBACK DATABASE (Neo-Brutalist) */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-xl flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-red-400 border-b-4 border-black px-4 py-3 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-black" />
                <h3 className="font-black text-sm uppercase text-black leading-none">Upgrade Database Diperlukan ⚙️</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMigrationModal(false)} 
                className="w-8 h-8 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-sm font-black text-black"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-5 space-y-4">
              <div className="bg-red-50 border-2 border-red-500 rounded-xl p-3 text-xs font-bold text-red-800 leading-relaxed">
                ⚠️ <strong className="uppercase">Informasi Penting:</strong> Fitur Administrasi Baru (CP, ATP, KKTP, Prota, Promes, Materi, Buku Ajar) memerlukan kolom baru di database Supabase Anda. Kami mendeteksi bahwa kolom tersebut belum ditambahkan.
              </div>

              <div className="space-y-1.5">
                <h4 className="font-black text-xs uppercase text-slate-800">Langkah Pemecahan Masalah:</h4>
                <ol className="list-decimal list-inside text-[11px] font-bold text-slate-600 space-y-1">
                  <li>Klik tombol <strong>"Salin SQL Kueri"</strong> di bawah ini.</li>
                  <li>Buka dashboard <strong>Supabase</strong> proyek Anda.</li>
                  <li>Masuk ke menu <strong>SQL Editor</strong> &gt; buat kueri baru (<strong>New Query</strong>).</li>
                  <li>Tempelkan (Paste) kueri SQL tersebut, klik <strong>Run</strong>, lalu coba simpan kembali.</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-700">Skrip SQL Migrasi:</label>
                <div className="relative">
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl text-[10px] font-mono overflow-x-auto border-2 border-black leading-normal max-h-36">
                    {`ALTER TABLE modul_ajar 
ADD COLUMN IF NOT EXISTS cp TEXT,
ADD COLUMN IF NOT EXISTS atp TEXT,
ADD COLUMN IF NOT EXISTS kktp TEXT,
ADD COLUMN IF NOT EXISTS prota TEXT,
ADD COLUMN IF NOT EXISTS promes TEXT,
ADD COLUMN IF NOT EXISTS materi TEXT,
ADD COLUMN IF NOT EXISTS buku_ajar TEXT;`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`ALTER TABLE modul_ajar 
ADD COLUMN IF NOT EXISTS cp TEXT,
ADD COLUMN IF NOT EXISTS atp TEXT,
ADD COLUMN IF NOT EXISTS kktp TEXT,
ADD COLUMN IF NOT EXISTS prota TEXT,
ADD COLUMN IF NOT EXISTS promes TEXT,
ADD COLUMN IF NOT EXISTS materi TEXT,
ADD COLUMN IF NOT EXISTS buku_ajar TEXT;`);
                      alert('Skrip SQL berhasil disalin! Silakan jalankan di Supabase SQL Editor.');
                    }}
                    className="absolute top-2 right-2 bg-yellow-300 hover:bg-yellow-200 border-2 border-black px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer text-black"
                  >
                    Salin SQL 📋
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 border-2 border-black rounded-xl p-3 text-[11px] font-bold text-slate-700 leading-normal">
                💡 **Khawatir Data Anda Hilang?** Anda tetap bisa mengamankan progres Anda sekarang dengan klik tombol **"Bypass & Simpan Dasar"** di bawah. Ini akan mengabaikan 7 field baru untuk sementara dan menyimpan modul Anda dengan aman.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 border-t-4 border-black p-3.5 flex flex-col sm:flex-row justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowMigrationModal(false)}
                className="bg-white hover:bg-slate-200 border-2 border-black px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer text-center"
              >
                Nanti Saja
              </button>
              
              <button
                type="button"
                onClick={handleBypassSave}
                disabled={saving}
                className="bg-emerald-400 hover:bg-emerald-300 border-4 border-black px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none cursor-pointer text-center"
              >
                Bypass & Simpan Dasar 🚀
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

