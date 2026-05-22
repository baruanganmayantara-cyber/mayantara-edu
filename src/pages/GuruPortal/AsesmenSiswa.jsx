import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Award, TrendingUp, Sparkles, Printer, Save, Database, 
  RefreshCw, Check, X, ShieldAlert, BookOpen, AlertCircle, FileText, ChevronRight, Plus, Download
} from 'lucide-react';

export default function AsesmenSiswa() {
  const guruId = localStorage.getItem('guruId');
  const guruName = localStorage.getItem('guruName') || 'Guru';
  
  // Tab State
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'analisis' | 'remedial'
  
  // Selection Panel State
  const [kelasList, setKelasList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [selectedJenisAsesmen, setSelectedJenisAsesmen] = useState('formatif'); // 'diagnostik' | 'formatif' | 'sumatif'
  
  // Topic / Bab Selection State (Solusi Bug Wiping & History)
  const [allSavedScores, setAllSavedScores] = useState([]); // Semua nilai di kelas & mapel terpilih
  const [existingTopics, setExistingTopics] = useState([]); // Daftar bab/lingkup materi yang sudah tersimpan
  const [selectedTopicMode, setSelectedTopicMode] = useState('select'); // 'select' | 'new'
  const [selectedTopicDropdown, setSelectedTopicDropdown] = useState(''); // Bab terpilih dari dropdown
  const [newTopicInput, setNewTopicInput] = useState(''); // Input teks jika membuat bab baru
  
  // Quick Bulk Input State
  const [bulkScore, setBulkScore] = useState('');
  
  // Students & Scores State
  const [siswaList, setSiswaList] = useState([]);
  const [scoresInput, setScoresInput] = useState({}); // { siswaId: { skor: '', deskripsi: '' } }
  
  // Loading & UI States
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Database Migration Warning Modal State
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationErrorMsg, setMigrationErrorMsg] = useState('');
  const [isBypassed, setIsBypassed] = useState(false);
  
  // Suggestions for New Topic
  const [materiSuggestions] = useState([
    'Bab 1: Pengenalan Algoritma & Pemrograman dasar',
    'Bab 2: Struktur Data Linier dan Array',
    'Bab 3: Berpikir Komputasional dan Pemecahan Masalah',
    'Bab 4: Desain UI/UX Menggunakan Figma',
    'Bab 5: Implementasi Basis Data Relasional'
  ]);

  // Load configuration (Classes, Subjects)
  useEffect(() => {
    fetchConfig();
  }, []);

  // Fetch students & all scores for the selected Class & Subject
  useEffect(() => {
    if (selectedKelas && selectedMapel) {
      fetchSiswaDanNilai();
    } else {
      setSiswaList([]);
      setScoresInput({});
      setAllSavedScores([]);
      setExistingTopics([]);
    }
  }, [selectedKelas, selectedMapel, isBypassed]);

  // Update list of topics when assessment type or allSavedScores change
  useEffect(() => {
    updateTopicsList();
  }, [selectedJenisAsesmen, allSavedScores]);

  // Populate table input when the selected topic dropdown or topic mode changes
  useEffect(() => {
    populateScoresTable();
  }, [selectedTopicDropdown, selectedTopicMode, siswaList]);

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      
      // 1. Fetch Classes
      const { data: kelasData, error: kelasErr } = await supabase
        .from('kelas')
        .select('*')
        .order('tingkat', { ascending: true })
        .order('nama_rombel', { ascending: true });
        
      if (kelasErr) throw kelasErr;
      if (kelasData) setKelasList(kelasData);
      if (kelasData && kelasData.length > 0) setSelectedKelas(kelasData[0].id);

      // 2. Fetch Taught Subjects (with complete subjects fallback)
      const { data: mapelGuruData, error: mapelGuruErr } = await supabase
        .from('mapel_guru')
        .select('mapel_id, mata_pelajaran(*)')
        .eq('guru_id', guruId);

      let fetchedMapels = [];
      if (mapelGuruData && mapelGuruData.length > 0) {
        fetchedMapels = mapelGuruData
          .filter(x => x.mata_pelajaran)
          .map(x => x.mata_pelajaran);
      }

      if (fetchedMapels.length === 0) {
        const { data: allMapels } = await supabase
          .from('mata_pelajaran')
          .select('*')
          .order('nama', { ascending: true });
        if (allMapels) fetchedMapels = allMapels;
      }

      setMapelList(fetchedMapels);
      if (fetchedMapels.length > 0) setSelectedMapel(fetchedMapels[0].id);

    } catch (error) {
      console.error('Gagal memuat konfigurasi asesmen:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchSiswaDanNilai = async () => {
    if (!selectedKelas || !selectedMapel) return;
    try {
      setLoadingSiswa(true);
      
      // 1. Fetch all students in the selected class
      const { data: siswaData, error: siswaErr } = await supabase
        .from('siswa')
        .select('*')
        .eq('kelas_id', selectedKelas)
        .order('nama_lengkap', { ascending: true });

      if (siswaErr) throw siswaErr;
      setSiswaList(siswaData || []);

      // 2. Load all saved scores for this Class & Subject
      let loadedScores = [];
      if (isBypassed) {
        // Simulasi Mode Bypass Lokal
        const localData = localStorage.getItem('mock_nilai_asesmen_all');
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            loadedScores = parsed.filter(score => 
              score.kelas_id === selectedKelas && 
              score.mapel_id === selectedMapel
            );
          } catch (e) {
            console.error('Error parsing mock scores:', e);
          }
        }
      } else {
        // Supabase Real Database
        const { data: dbScores, error: dbScoresErr } = await supabase
          .from('nilai_asesmen')
          .select('*')
          .eq('kelas_id', selectedKelas)
          .eq('mapel_id', selectedMapel);

        if (dbScoresErr) {
          const errMsg = dbScoresErr.message || '';
          if (
            errMsg.includes('relation') && 
            (errMsg.includes('does not exist') || errMsg.includes('not found') || errMsg.includes('schema') || errMsg.includes('cache'))
          ) {
            setMigrationErrorMsg(errMsg);
            setShowMigrationModal(true);
          } else {
            console.error('Error fetching scores from DB:', dbScoresErr);
          }
        } else {
          loadedScores = dbScores || [];
        }
      }

      setAllSavedScores(loadedScores);

    } catch (error) {
      console.error('Gagal memuat siswa & rekap nilai:', error);
    } finally {
      setLoadingSiswa(false);
    }
  };

  // Extract saved unique topics for the selected assessment type
  const updateTopicsList = () => {
    const topics = allSavedScores
      .filter(score => score.jenis_asesmen === selectedJenisAsesmen)
      .map(score => score.lingkup_materi);
    
    // De-duplicate
    const uniqueTopics = [...new Set(topics)].sort();
    setExistingTopics(uniqueTopics);

    // Auto-select the first topic if available, otherwise switch to 'new' mode
    if (uniqueTopics.length > 0) {
      setSelectedTopicDropdown(uniqueTopics[0]);
      setSelectedTopicMode('select');
    } else {
      setSelectedTopicDropdown('__new__');
      setSelectedTopicMode('new');
      setNewTopicInput('');
    }
  };

  // Populate inputs based on selected topic or reset on new topic
  const populateScoresTable = () => {
    const initialInputs = {};
    siswaList.forEach(s => {
      initialInputs[s.id] = { skor: '', deskripsi: '' };
    });

    if (selectedTopicMode === 'select' && selectedTopicDropdown && selectedTopicDropdown !== '__new__') {
      // Pull scores matching this specific topic from allSavedScores
      allSavedScores
        .filter(score => 
          score.jenis_asesmen === selectedJenisAsesmen && 
          score.lingkup_materi === selectedTopicDropdown
        )
        .forEach(score => {
          if (initialInputs[score.siswa_id]) {
            initialInputs[score.siswa_id] = {
              skor: score.skor.toString(),
              deskripsi: score.deskripsi || ''
            };
          }
        });
    }

    setScoresInput(initialInputs);
  };

  const handleScoreChange = (siswaId, field, value) => {
    setScoresInput(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value
      }
    }));
  };

  const getActiveTopicName = () => {
    return selectedTopicMode === 'select' ? selectedTopicDropdown : newTopicInput.trim();
  };

  // Predicate letter calculator (A, B, C, D)
  const calculatePredicate = (score) => {
    const scoreVal = parseInt(score);
    if (isNaN(scoreVal)) return { grade: '-', label: '-', color: 'bg-slate-200 text-slate-700' };
    
    if (scoreVal >= 85) return { grade: 'A', label: 'Sangat Baik', color: 'bg-emerald-500 text-white border-2 border-black' };
    if (scoreVal >= 70) return { grade: 'B', label: 'Baik', color: 'bg-blue-400 text-black border-2 border-black' };
    if (scoreVal >= 55) return { grade: 'C', label: 'Cukup', color: 'bg-yellow-300 text-black border-2 border-black' };
    return { grade: 'D', label: 'Kurang', color: 'bg-red-400 text-black border-2 border-black' };
  };

  // Bulk Score Allocator (Premium Feature)
  const applyBulkScore = () => {
    const scoreVal = parseInt(bulkScore);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      alert('Masukkan nilai bulk yang valid (0 - 100).');
      return;
    }
    
    if (window.confirm(`Apakah Anda yakin ingin mengisi skor ${scoreVal} untuk semua siswa di tabel ini?`)) {
      const updated = { ...scoresInput };
      siswaList.forEach(s => {
        updated[s.id] = {
          ...updated[s.id],
          skor: scoreVal.toString()
        };
      });
      setScoresInput(updated);
      setBulkScore('');
      alert('Berhasil mengalokasikan nilai cepat untuk semua siswa. Silakan klik "Auto-Gen Semua KKTP" untuk memperbarui deskripsi.');
    }
  };

  // KKTP Description Auto-Generator
  const generateDescription = (siswaId, namaSiswa) => {
    const siswaData = scoresInput[siswaId];
    const scoreVal = parseInt(siswaData?.skor);

    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      alert('Mohon masukkan skor yang valid (0 - 100) terlebih dahulu.');
      return;
    }

    let generatedText = '';
    const topic = getActiveTopicName() || 'lingkup materi ini';

    if (scoreVal >= 85) {
      generatedText = `Sangat menguasai ${topic}. ${namaSiswa} menunjukkan pemahaman konsep yang mendalam dan mampu mengaplikasikan kompetensi secara mandiri serta sangat baik.`;
    } else if (scoreVal >= 70) {
      generatedText = `Menunjukkan ketercapaian kompetensi yang baik pada ${topic}. ${namaSiswa} telah memahami poin-poin utama namun dapat meningkatkan kedalaman analisisnya.`;
    } else {
      generatedText = `Perlu pendampingan intensif dalam menguasai konsep dasar ${topic}. ${namaSiswa} direkomendasikan mendapat bimbingan tambahan/remedial terstruktur.`;
    }

    handleScoreChange(siswaId, 'deskripsi', generatedText);
  };

  const generateAllDescriptions = () => {
    let count = 0;
    siswaList.forEach(s => {
      const score = scoresInput[s.id]?.skor;
      if (score !== undefined && score !== '') {
        generateDescription(s.id, s.nama_lengkap);
        count++;
      }
    });
    if (count === 0) {
      alert('Tidak ada nilai siswa yang diisi. Mohon isi nilai beberapa siswa terlebih dahulu.');
    }
  };

  const handleSaveAll = async () => {
    if (!selectedKelas || !selectedMapel) {
      alert('Mohon pilih Kelas dan Mata Pelajaran.');
      return;
    }

    const activeTopic = getActiveTopicName();
    if (!activeTopic) {
      alert('Mohon pilih Bab atau ketikkan nama Bab pembelajaran terlebih dahulu.');
      return;
    }

    // Prepare records to save
    const records = [];
    let hasInvalidScore = false;

    siswaList.forEach(s => {
      const data = scoresInput[s.id];
      if (data && data.skor !== '') {
        const scoreInt = parseInt(data.skor);
        if (isNaN(scoreInt) || scoreInt < 0 || scoreInt > 100) {
          hasInvalidScore = true;
          return;
        }
        records.push({
          guru_id: guruId,
          kelas_id: selectedKelas,
          mapel_id: selectedMapel,
          siswa_id: s.id,
          jenis_asesmen: selectedJenisAsesmen,
          lingkup_materi: activeTopic,
          skor: scoreInt,
          deskripsi: data.deskripsi || ''
        });
      }
    });

    if (hasInvalidScore) {
      alert('Ada skor yang tidak valid. Harap pastikan semua skor bernilai di antara 0 dan 100.');
      return;
    }

    if (records.length === 0) {
      alert('Belum ada nilai siswa yang diisi. Harap masukkan nilai setidaknya untuk satu siswa.');
      return;
    }

    try {
      setSaving(true);

      if (isBypassed) {
        // Save using LocalStorage simulation (Combined global database list)
        const localKey = 'mock_nilai_asesmen_all';
        const currentLocalStr = localStorage.getItem(localKey) || '[]';
        let currentLocal = [];
        try {
          currentLocal = JSON.parse(currentLocalStr);
        } catch (e) {
          currentLocal = [];
        }

        // Delete existing items matching this specific combination
        currentLocal = currentLocal.filter(item => 
          !(item.kelas_id === selectedKelas && 
            item.mapel_id === selectedMapel && 
            item.jenis_asesmen === selectedJenisAsesmen && 
            item.lingkup_materi === activeTopic)
        );

        // Add new records (assign pseudo random UUID)
        const enrichedRecords = records.map(r => ({
          ...r,
          id: Math.random().toString(36).substring(2, 15)
        }));

        const updatedLocal = [...currentLocal, ...enrichedRecords];
        localStorage.setItem(localKey, JSON.stringify(updatedLocal));

        alert(`[Simulasi Lokal] Berhasil menyimpan ${records.length} data nilai ke LocalStorage browser!`);
        fetchSiswaDanNilai(); // Reload from storage
        return;
      }

      // Supabase Save Engine
      // 1. Delete existing for this specific combination
      const { error: delErr } = await supabase
        .from('nilai_asesmen')
        .delete()
        .eq('kelas_id', selectedKelas)
        .eq('mapel_id', selectedMapel)
        .eq('jenis_asesmen', selectedJenisAsesmen)
        .eq('lingkup_materi', activeTopic);

      if (delErr) throw delErr;

      // 2. Insert new records
      const { error: insErr } = await supabase
        .from('nilai_asesmen')
        .insert(records);

      if (insErr) throw insErr;

      alert(`Berhasil menyimpan ${records.length} data nilai ke database Supabase!`);
      
      // Reload and set dropdown selection to the saved topic
      await fetchSiswaDanNilai();
      setSelectedTopicDropdown(activeTopic);
      setSelectedTopicMode('select');

    } catch (err) {
      console.error('Gagal menyimpan nilai asesmen:', err);
      const errMsg = err.message || '';
      if (
        errMsg.includes('relation') && 
        (errMsg.includes('does not exist') || errMsg.includes('not found') || errMsg.includes('schema') || errMsg.includes('cache'))
      ) {
        setMigrationErrorMsg(errMsg);
        setShowMigrationModal(true);
      } else {
        alert('Gagal menyimpan ke database: ' + errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Export Table Data to CSV Excel File (Premium Feature)
  const exportToCSV = () => {
    if (siswaList.length === 0) {
      alert('Tidak ada data siswa untuk diekspor.');
      return;
    }

    const activeTopic = getActiveTopicName() || 'Materi';
    
    // Helper to format cells for Excel
    const formatCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = val.toString().replace(/"/g, '""');
      // If it starts with 0 followed by digits, or is digits-only, force as text formula
      if (/^0\d+$/.test(str) || /^\+?\d+$/.test(str)) {
        return `"=""${str}"""`;
      }
      return `"${str}"`;
    };

    let csvContent = "No,NISN,Nama Siswa,Jenis Kelamin,Skor,Predikat,Deskripsi KKTP\n";
    
    // Data Rows
    siswaList.forEach((s, idx) => {
      const data = scoresInput[s.id] || { skor: '', deskripsi: '' };
      const scoreText = data.skor !== '' ? data.skor : '-';
      const predicate = calculatePredicate(data.skor).grade;
      
      const rowNo = formatCell(idx + 1);
      const nisnVal = formatCell(s.nisn || '-');
      const namaVal = formatCell(s.nama_lengkap);
      const jkVal = formatCell(s.jenis_kelamin);
      const skorVal = formatCell(scoreText);
      const predVal = formatCell(predicate);
      const descVal = formatCell(data.deskripsi || '');
      
      csvContent += `${rowNo},${nisnVal},${namaVal},${jkVal},${skorVal},${predVal},${descVal}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    const filename = `Rekap_Nilai_${getSelectedKelasText().replace(/\s+/g, '_')}_${selectedJenisAsesmen}_${slugify(activeTopic)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper selector text formatting
  const getSelectedKelasText = () => {
    const k = kelasList.find(x => x.id === selectedKelas);
    return k ? `${k.tingkat} - ${k.nama_rombel}` : '';
  };

  const getSelectedMapelText = () => {
    const m = mapelList.find(x => x.id === selectedMapel);
    return m ? m.nama : '';
  };

  const slugify = (text) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Display Student Grade History popover inside table
  const renderStudentHistory = (siswaId) => {
    const activeTopic = getActiveTopicName();
    
    // Find all grades for this student in this subject, excluding the currently edited one
    const studentGrades = allSavedScores.filter(score => 
      score.siswa_id === siswaId && 
      !(score.jenis_asesmen === selectedJenisAsesmen && score.lingkup_materi === activeTopic)
    );

    if (studentGrades.length === 0) {
      return <span className="text-[10px] text-slate-400 font-bold block mt-1">Belum ada riwayat nilai mapel ini</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {studentGrades.map((grade, idx) => {
          const typeBadge = grade.jenis_asesmen === 'diagnostik' ? 'bg-indigo-100 text-indigo-800' :
                            grade.jenis_asesmen === 'formatif' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
          return (
            <span 
              key={idx} 
              className={`text-[9px] font-black px-1.5 py-0.5 border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase ${typeBadge}`}
              title={`${grade.lingkup_materi}: ${grade.skor}`}
            >
              {grade.jenis_asesmen[0].toUpperCase()}: {grade.lingkup_materi.substring(0, 10)}... ({grade.skor})
            </span>
          );
        })}
      </div>
    );
  };

  // Calculations for Analisis Tab
  const calculatedStats = () => {
    let total = 0;
    let count = 0;
    let highest = -1;
    let lowest = 101;
    let passCount = 0;

    let rangeUnder70 = 0;
    let range70to79 = 0;
    let range80to89 = 0;
    let range90to100 = 0;

    siswaList.forEach(s => {
      const data = scoresInput[s.id];
      if (data && data.skor !== '') {
        const score = parseInt(data.skor);
        if (!isNaN(score)) {
          total += score;
          count++;
          if (score > highest) highest = score;
          if (score < lowest) lowest = score;
          if (score >= 70) passCount++;

          if (score < 70) rangeUnder70++;
          else if (score < 80) range70to79++;
          else if (score < 90) range80to89++;
          else range90to100++;
        }
      }
    });

    const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
    const passPercentage = count > 0 ? Math.round((passCount / count) * 100) : 0;
    
    return {
      count,
      average,
      highest: highest === -1 ? 0 : highest,
      lowest: lowest === 101 ? 0 : lowest,
      passPercentage,
      ranges: {
        under70: rangeUnder70,
        range70to79,
        range80to89,
        range90to100
      }
    };
  };

  const stats = calculatedStats();

  // Lists of students for Remedial & Enrichment Planning (Premium Feature)
  const getRemedialAndEnrichmentLists = () => {
    const remedial = [];
    const enrichment = [];

    siswaList.forEach(s => {
      const scoreData = scoresInput[s.id];
      if (scoreData && scoreData.skor !== '') {
        const scoreVal = parseInt(scoreData.skor);
        if (!isNaN(scoreVal)) {
          const item = {
            id: s.id,
            nama: s.nama_lengkap,
            nisn: s.nisn,
            skor: scoreVal
          };
          if (scoreVal < 70) {
            remedial.push(item);
          } else {
            enrichment.push(item);
          }
        }
      }
    });

    return { remedial, enrichment };
  };

  const { remedial: listRemedial, enrichment: listEnrichment } = getRemedialAndEnrichmentLists();

  const handlePrint = () => {
    if (siswaList.length === 0) {
      alert('Daftar siswa kosong. Tidak dapat mencetak.');
      return;
    }
    if (!getActiveTopicName()) {
      alert('Harap isi lingkup materi terlebih dahulu sebelum mencetak.');
      return;
    }
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 px-2 sm:px-4">
      
      {/* ======================================= */}
      {/* 1. KOP HEADER HALAMAN                   */}
      {/* ======================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-black text-xs font-black rounded-full uppercase border-2 border-black tracking-widest">
              <Award className="w-4 h-4" /> PORTAL ASESMEN
            </span>
            {isBypassed && (
              <span className="bg-red-500 text-black text-[10px] font-black uppercase px-2 py-1 border-2 border-black rounded-full">
                Simulasi Lokal Aktif
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black leading-none mt-1">
            Portal Rekap Nilai Kurikulum Merdeka
          </h2>
          <p className="text-slate-700 font-bold mt-2 uppercase tracking-wider text-xs">
            Pencatatan Nilai Diagnostik, Formatif, dan Sumatif berbasis KKTP
          </p>
        </div>

        {/* Action Button Panel */}
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => {
              setIsBypassed(false);
              fetchSiswaDanNilai();
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-black border-4 border-black px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all font-black uppercase cursor-pointer text-xs"
            title="Muat ulang data dari database"
          >
            <RefreshCw className="w-4 h-4" />
            Reload DB
          </button>

          <button 
            onClick={exportToCSV}
            className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-black px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all font-black uppercase cursor-pointer text-xs"
            title="Unduh rekap nilai tabel ini dalam format Excel CSV"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-violet-400 hover:bg-violet-300 text-black border-4 border-black px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all font-black uppercase cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4" />
            Cetak Ledger
          </button>
        </div>
      </div>

      {/* ======================================= */}
      {/* 2. PANEL SELECTOR UTAMA (INPUT CRITERIA) */}
      {/* ======================================= */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 print:hidden relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute right-0 bottom-0 top-0 w-2 bg-yellow-400 border-l-2 border-black hidden md:block"></div>
        
        <h3 className="text-md font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" /> 1. Konfigurasi Lingkup Asesmen Siswa
        </h3>

        {loadingConfig ? (
          <div className="text-center py-6">
            <span className="font-black text-slate-500 animate-pulse text-sm uppercase">Menghubungkan Database Mayantara...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Pilih Kelas */}
            <div className="md:col-span-3">
              <label className="block text-xs font-black uppercase text-black mb-1.5">Kelas Rombel</label>
              <select 
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full bg-white border-4 border-black rounded-xl p-2.5 font-bold text-sm text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>Kelas {k.tingkat} - {k.nama_rombel}</option>
                ))}
              </select>
            </div>

            {/* Pilih Mapel */}
            <div className="md:col-span-4">
              <label className="block text-xs font-black uppercase text-black mb-1.5">Mata Pelajaran</label>
              <select 
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full bg-white border-4 border-black rounded-xl p-2.5 font-bold text-sm text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                {mapelList.map(m => (
                  <option key={m.id} value={m.id}>{m.nama} ({m.kode})</option>
                ))}
              </select>
            </div>

            {/* Jenis Asesmen */}
            <div className="md:col-span-5">
              <label className="block text-xs font-black uppercase text-black mb-1.5">Jenis Asesmen Kurikulum Merdeka</label>
              <div className="grid grid-cols-3 gap-2">
                {['diagnostik', 'formatif', 'sumatif'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedJenisAsesmen(type)}
                    className={`py-2 px-1 text-center font-black uppercase text-[11px] rounded-xl border-3 border-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none
                      ${selectedJenisAsesmen === type 
                        ? 'bg-yellow-400 text-black' 
                        : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Bab / Lingkup Materi Selector & Input */}
            <div className="md:col-span-12 mt-2">
              <label className="block text-xs font-black uppercase text-black mb-1.5 flex items-center justify-between">
                <span>Bab / Lingkup Materi Pembelajaran</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Pilih bab tersimpan atau buat baru</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Dropdown Bab Terdaftar */}
                <div className="md:col-span-1">
                  <select
                    value={selectedTopicMode === 'new' ? '__new__' : selectedTopicDropdown}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setSelectedTopicMode('new');
                        setSelectedTopicDropdown('__new__');
                      } else {
                        setSelectedTopicMode('select');
                        setSelectedTopicDropdown(e.target.value);
                      }
                    }}
                    className="w-full bg-white border-4 border-black rounded-xl p-2.5 font-bold text-sm text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {existingTopics.map((topic, i) => (
                      <option key={i} value={topic}>{topic}</option>
                    ))}
                    <option value="__new__">+ Buat Bab Baru...</option>
                  </select>
                </div>

                {/* Input Teks Jika New Mode */}
                <div className="md:col-span-2">
                  {selectedTopicMode === 'new' ? (
                    <div>
                      <input 
                        type="text" 
                        value={newTopicInput}
                        onChange={(e) => setNewTopicInput(e.target.value)}
                        placeholder="Ketikkan nama bab baru (cth: Bab 3: Desain Database)"
                        className="w-full bg-white border-4 border-black rounded-xl p-2.5 font-bold text-sm text-black placeholder:text-slate-400 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                      
                      {/* Presets suggestions only shown for new mode */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
                        <span className="text-[9px] font-black uppercase text-slate-500 mr-1">Rekomendasi Cepat:</span>
                        {materiSuggestions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewTopicInput(s)}
                            className="bg-slate-100 hover:bg-yellow-100 text-slate-800 text-[9px] font-bold px-2 py-0.5 border-2 border-black rounded-lg transition-colors cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100 border-4 border-dashed border-slate-400 rounded-xl p-2.5 text-xs text-slate-600 font-bold uppercase flex items-center justify-between">
                      <span>✓ Mengedit data bab terdaftar (database history aman)</span>
                      <button
                        onClick={() => {
                          setSelectedTopicMode('new');
                          setSelectedTopicDropdown('__new__');
                          setNewTopicInput('');
                        }}
                        className="bg-black text-white hover:bg-slate-800 text-[9px] font-bold px-2 py-1 rounded border border-black cursor-pointer uppercase flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Buat Baru
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* 3. TABS NAVIGATOR                       */}
      {/* ======================================= */}
      <div className="flex border-b-4 border-black mb-6 print:hidden">
        <button
          onClick={() => setActiveTab('input')}
          className={`px-6 py-3 font-black uppercase text-sm border-t-4 border-x-4 border-black rounded-t-2xl transition-all mr-2 cursor-pointer
            ${activeTab === 'input' 
              ? 'bg-yellow-400 text-black border-b-white -translate-y-1 shadow-[0px_4px_0px_0px_rgba(254,240,138,1)]' 
              : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          📝 Input & Edit Nilai
        </button>
        <button
          onClick={() => setActiveTab('analisis')}
          className={`px-6 py-3 font-black uppercase text-sm border-t-4 border-x-4 border-black rounded-t-2xl transition-all mr-2 cursor-pointer
            ${activeTab === 'analisis' 
              ? 'bg-yellow-400 text-black border-b-white -translate-y-1 shadow-[0px_4px_0px_0px_rgba(254,240,138,1)]' 
              : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          📊 Analisis & Persebaran Nilai
        </button>
        <button
          onClick={() => setActiveTab('remedial')}
          className={`px-6 py-3 font-black uppercase text-sm border-t-4 border-x-4 border-black rounded-t-2xl transition-all cursor-pointer
            ${activeTab === 'remedial' 
              ? 'bg-yellow-400 text-black border-b-white -translate-y-1 shadow-[0px_4px_0px_0px_rgba(254,240,138,1)]' 
              : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          🚨 Remedial & Pengayaan
        </button>
      </div>

      {/* ======================================= */}
      {/* 4. TAB 1 CONTENT: INPUT & EDIT TABLE    */}
      {/* ======================================= */}
      {activeTab === 'input' && (
        <div className="print:hidden">
          {loadingSiswa ? (
            <div className="text-center py-20 bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-xl animate-pulse uppercase">Memuat Roster Siswa & Nilai...</span>
            </div>
          ) : siswaList.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400 animate-bounce" />
              <h3 className="text-2xl font-black uppercase mb-2">Pilih Kelas Terlebih Dahulu</h3>
              <p className="text-slate-600 font-bold max-w-md mx-auto">
                Silakan pilih kelas pada panel di atas untuk menampilkan daftar siswa secara otomatis.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Header inside input list with Bulk Allocator (Premium Feature) */}
              <div className="bg-indigo-100 border-4 border-black rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h4 className="text-sm font-black uppercase text-black">
                    Daftar Siswa Kelas {getSelectedKelasText()}
                  </h4>
                  <p className="text-xs font-semibold text-slate-700">
                    Jumlah Rombel: <strong>{siswaList.length} Siswa</strong> | Mapel: <strong>{getSelectedMapelText()}</strong>
                  </p>
                </div>
                
                {/* Bulk score allocator & Action buttons */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                  <div className="flex items-center gap-1 bg-white border-3 border-black p-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Skor..."
                      value={bulkScore}
                      onChange={(e) => setBulkScore(e.target.value)}
                      className="w-16 px-2 py-1 font-bold text-xs focus:outline-none border-none text-center"
                    />
                    <button
                      type="button"
                      onClick={applyBulkScore}
                      className="bg-black text-white hover:bg-slate-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    >
                      Terapkan Skor
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={generateAllDescriptions}
                    className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black border-3 border-black px-4 py-2 rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto-Gen Semua KKTP
                  </button>
                </div>
              </div>

              {/* Excel-like High Contrast Table */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-black text-white text-left uppercase text-xs tracking-wider">
                        <th className="p-4 border-r border-slate-700 text-center w-12">No</th>
                        <th className="p-4 border-r border-slate-700 w-32">NISN</th>
                        <th className="p-4 border-r border-slate-700 w-64">Nama Lengkap & Riwayat Nilai Mapel</th>
                        <th className="p-4 border-r border-slate-700 text-center w-36">Skor & Predikat</th>
                        <th className="p-4 border-r border-slate-700 text-center w-32">Tindakan</th>
                        <th className="p-4">Deskripsi Capaian Kompetensi Kurikulum Merdeka (KKTP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-4 divide-black">
                      {siswaList.map((siswa, index) => {
                        const scoreData = scoresInput[siswa.id] || { skor: '', deskripsi: '' };
                        const isScoreFilled = scoreData.skor !== '';
                        const isPassing = isScoreFilled && parseInt(scoreData.skor) >= 70;
                        const pred = calculatePredicate(scoreData.skor);

                        return (
                          <tr key={siswa.id} className="hover:bg-slate-50 font-semibold text-slate-800 text-sm">
                            
                            {/* No */}
                            <td className="p-4 border-r-4 border-black text-center text-xs font-black bg-slate-100 text-black">
                              {index + 1}
                            </td>
                            
                            {/* NISN */}
                            <td className="p-4 border-r-4 border-black font-mono text-xs">
                              {siswa.nisn || '-'}
                            </td>
                            
                            {/* Nama Lengkap & RIWAYAT NILAI SISWA */}
                            <td className="p-4 border-r-4 border-black text-black font-bold">
                              <div>
                                {siswa.nama_lengkap}
                                <span className="block text-[10px] text-slate-500 font-normal uppercase mt-0.5">
                                  {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                                
                                {/* Peta Riwayat/History Nilai Siswa */}
                                {renderStudentHistory(siswa.id)}
                              </div>
                            </td>
                            
                            {/* Skor Input & PREDIKAT PIL (Premium Feature) */}
                            <td className="p-4 border-r-4 border-black bg-yellow-50/50 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={scoreData.skor}
                                  onChange={(e) => handleScoreChange(siswa.id, 'skor', e.target.value)}
                                  className={`w-16 text-center bg-white border-3 border-black rounded-lg p-1.5 font-black text-sm text-black focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                                    ${isScoreFilled 
                                      ? isPassing 
                                        ? 'bg-emerald-100 border-emerald-600 text-emerald-900' 
                                        : 'bg-red-100 border-red-600 text-red-900'
                                      : 'bg-white'}`}
                                />
                                {isScoreFilled && (
                                  <span className={`px-2 py-1 rounded text-xs font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${pred.color}`} title={pred.label}>
                                    {pred.grade}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Action Auto-gen */}
                            <td className="p-4 border-r-4 border-black text-center">
                              <button
                                type="button"
                                onClick={() => generateDescription(siswa.id, siswa.nama_lengkap)}
                                className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-2 border-black px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                                title="Susun deskripsi kualitatif KKTP secara otomatis sesuai skor"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Auto-Gen
                              </button>
                            </td>
                            
                            {/* Deskripsi */}
                            <td className="p-4 bg-slate-50/50">
                              <textarea
                                rows="2"
                                placeholder="Klik 'Auto-Gen' atau ketikkan deskripsi capaian kompetensi..."
                                value={scoreData.deskripsi}
                                onChange={(e) => handleScoreChange(siswa.id, 'deskripsi', e.target.value)}
                                className="w-full bg-white border-2 border-black rounded-xl p-2 font-medium text-xs text-black focus:outline-none leading-normal resize-y shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              />
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Actions */}
                <div className="bg-slate-100 p-6 border-t-4 border-black flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-xs font-bold text-slate-700">
                    💡 <span className="text-black uppercase">Tips Merdeka:</span> KKTP Kurikulum Merdeka menyarankan target KKM di atas 70. Siswa dengan nilai di bawah 70 berstatus "Perlu Pendampingan".
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-black px-8 py-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all font-black uppercase text-md cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Simpan Nilai Asesmen
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* 5. TAB 2 CONTENT: ANALISIS & STATS      */}
      {/* ======================================= */}
      {activeTab === 'analisis' && (
        <div className="space-y-8 print:hidden">
          
          {siswaList.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
              <h3 className="text-2xl font-black uppercase mb-2">Data Belum Siap</h3>
              <p className="text-slate-600 font-bold">
                Harap pilih kelas terlebih dahulu untuk melihat dashboard analisis data dan persebaran nilai.
              </p>
            </div>
          ) : stats.count === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-2xl font-black uppercase mb-2">Nilai Belum Diisi</h3>
              <p className="text-slate-600 font-bold">
                Anda perlu mengisi nilai minimal satu siswa di Tab <strong>Input & Edit Nilai</strong> agar dapat menghasilkan statistika analisis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Big Stats */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Average Grade Card */}
                <div className="bg-yellow-300 border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black uppercase text-black/60 tracking-wider">Rata-rata Nilai Kelas</h5>
                    <p className="text-5xl font-black text-black mt-1">{stats.average}</p>
                    <p className="text-xs font-bold text-black/80 mt-2 uppercase">
                      Dari {stats.count} nilai diinput
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-black" />
                  </div>
                </div>

                {/* High / Low Grades Card */}
                <div className="bg-indigo-300 border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] grid grid-cols-2 gap-4">
                  <div className="border-r-2 border-black pr-2">
                    <h5 className="text-[10px] font-black uppercase text-black/60 tracking-wider">Nilai Tertinggi</h5>
                    <p className="text-3xl font-black text-black mt-1">{stats.highest}</p>
                  </div>
                  <div className="pl-2">
                    <h5 className="text-[10px] font-black uppercase text-black/60 tracking-wider">Nilai Terendah</h5>
                    <p className="text-3xl font-black text-black mt-1">{stats.lowest}</p>
                  </div>
                </div>

                {/* Passing KKTP Card */}
                <div className="bg-emerald-300 border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-xs font-black uppercase text-black/60 tracking-wider">Tingkat Ketuntasan KKTP</h5>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-4xl font-black text-black">{stats.passPercentage}%</p>
                    <p className="text-xs font-bold text-black/80">Tuntas</p>
                  </div>
                  {/* Custom Progress Bar */}
                  <div className="w-full bg-white border-2 border-black rounded-full h-4 mt-3 overflow-hidden">
                    <div 
                      className="bg-black h-full transition-all duration-1000 border-r border-black" 
                      style={{ width: `${stats.passPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] font-bold text-black/70 mt-2 uppercase">
                    KKTP batas kelulusan = 70.0
                  </p>
                </div>

              </div>

              {/* Right Column - CSS Bar Chart */}
              <div className="lg:col-span-2 bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                
                <div>
                  <h3 className="text-lg font-black uppercase text-black mb-1">
                    Grafik Persebaran Skor Siswa
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mb-6 uppercase">
                    Distribusi jumlah siswa per kelompok nilai di {getActiveTopicName()}
                  </p>
                </div>

                {/* Neo-Brutalist CSS Bar Chart */}
                <div className="flex flex-col sm:flex-row justify-around items-end gap-6 h-64 border-b-4 border-black px-4 pb-2 relative mb-6">
                  
                  {/* Y-axis Guideline Gridlines */}
                  <div className="absolute left-0 right-0 bottom-1/4 border-b-2 border-dashed border-slate-200 pointer-events-none"></div>
                  <div className="absolute left-0 right-0 bottom-2/4 border-b-2 border-dashed border-slate-200 pointer-events-none"></div>
                  <div className="absolute left-0 right-0 bottom-3/4 border-b-2 border-dashed border-slate-200 pointer-events-none"></div>

                  {/* Range under 70 */}
                  <div className="flex flex-col items-center w-full group relative">
                    <span className="text-xs font-black mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white py-0.5 px-2 rounded-md border border-black absolute -top-8 z-10">
                      {stats.ranges.under70} Siswa
                    </span>
                    <div 
                      style={{ height: `${Math.max(stats.ranges.under70 * 20, 8)}px` }}
                      className="w-12 bg-red-400 border-4 border-black rounded-t-xl group-hover:bg-red-300 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    ></div>
                    <span className="text-[10px] font-black uppercase text-slate-800 mt-2 bg-red-100 px-1.5 py-0.5 border border-black rounded">
                      &lt; 70
                    </span>
                  </div>

                  {/* Range 70-79 */}
                  <div className="flex flex-col items-center w-full group relative">
                    <span className="text-xs font-black mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white py-0.5 px-2 rounded-md border border-black absolute -top-8 z-10">
                      {stats.ranges.range70to79} Siswa
                    </span>
                    <div 
                      style={{ height: `${Math.max(stats.ranges.range70to79 * 20, 8)}px` }}
                      className="w-12 bg-orange-400 border-4 border-black rounded-t-xl group-hover:bg-orange-300 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    ></div>
                    <span className="text-[10px] font-black uppercase text-slate-800 mt-2 bg-orange-100 px-1.5 py-0.5 border border-black rounded">
                      70 - 79
                    </span>
                  </div>

                  {/* Range 80-89 */}
                  <div className="flex flex-col items-center w-full group relative">
                    <span className="text-xs font-black mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white py-0.5 px-2 rounded-md border border-black absolute -top-8 z-10">
                      {stats.ranges.range80to89} Siswa
                    </span>
                    <div 
                      style={{ height: `${Math.max(stats.ranges.range80to89 * 20, 8)}px` }}
                      className="w-12 bg-blue-400 border-4 border-black rounded-t-xl group-hover:bg-blue-300 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    ></div>
                    <span className="text-[10px] font-black uppercase text-slate-800 mt-2 bg-blue-100 px-1.5 py-0.5 border border-black rounded">
                      80 - 89
                    </span>
                  </div>

                  {/* Range 90-100 */}
                  <div className="flex flex-col items-center w-full group relative">
                    <span className="text-xs font-black mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white py-0.5 px-2 rounded-md border border-black absolute -top-8 z-10">
                      {stats.ranges.range90to100} Siswa
                    </span>
                    <div 
                      style={{ height: `${Math.max(stats.ranges.range90to100 * 20, 8)}px` }}
                      className="w-12 bg-emerald-400 border-4 border-black rounded-t-xl group-hover:bg-emerald-300 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    ></div>
                    <span className="text-[10px] font-black uppercase text-slate-800 mt-2 bg-emerald-100 px-1.5 py-0.5 border border-black rounded">
                      90 - 100
                    </span>
                  </div>

                </div>

                <div className="text-center font-bold text-xs text-slate-500 uppercase tracking-wide">
                  Grafik Sebaran Ketercapaian Asesmen Siswa (Pilar Kurikulum Merdeka)
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ======================================= */}
      {/* 6. TAB 3 CONTENT: REMEDIAL & PENGAYAAN  */}
      {/* ======================================= */}
      {activeTab === 'remedial' && (
        <div className="space-y-6 print:hidden">
          {siswaList.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500 animate-bounce" />
              <h3 className="text-2xl font-black uppercase mb-2">Data Belum Siap</h3>
              <p className="text-slate-600 font-bold">
                Harap pilih kelas terlebih dahulu untuk merencanakan tindak lanjut remedial dan pengayaan.
              </p>
            </div>
          ) : stats.count === 0 ? (
            <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-2xl font-black uppercase mb-2">Nilai Belum Diisi</h3>
              <p className="text-slate-600 font-bold">
                Anda perlu mengisi nilai minimal satu siswa di Tab <strong>Input & Edit Nilai</strong> untuk membagi kelompok siswa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* REMEDIAL CARD LIST */}
              <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
                  <h3 className="text-lg font-black uppercase text-red-600 flex items-center gap-2">
                    🔴 KELOMPOK REMEDIAL ({listRemedial.length} Siswa)
                  </h3>
                  <span className="bg-red-100 text-red-900 text-xs font-black uppercase px-2.5 py-1 border-2 border-black rounded-full">
                    Skor &lt; 70
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
                  Rekomendasi Tindak Lanjut: Berikan materi remedial dasar terstruktur dan pengulangan asesmen.
                </p>

                {listRemedial.length === 0 ? (
                  <div className="bg-emerald-50 border-3 border-black rounded-2xl p-6 text-center">
                    <Check className="w-10 h-10 mx-auto text-emerald-600 mb-2 animate-bounce" />
                    <h5 className="font-black text-emerald-900 uppercase">Luar Biasa! Nihil Remedial</h5>
                    <p className="text-xs text-emerald-700 font-bold mt-1">
                      Seluruh siswa di kelas ini telah mencapai nilai tuntas batas minimal KKTP.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {listRemedial.map((siswa, idx) => (
                      <div key={siswa.id} className="bg-red-50 border-3 border-black p-3.5 rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
                        <div>
                          <h4 className="font-black text-black text-sm uppercase leading-none">{siswa.nama}</h4>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">NISN: {siswa.nisn || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-red-600 text-white font-black text-sm px-2.5 py-1 rounded border-2 border-black">
                            {siswa.skor}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PENGAYAAN CARD LIST */}
              <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
                  <h3 className="text-lg font-black uppercase text-emerald-600 flex items-center gap-2">
                    🟢 KELOMPOK PENGAYAAN ({listEnrichment.length} Siswa)
                  </h3>
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-black uppercase px-2.5 py-1 border-2 border-black rounded-full">
                    Skor &ge; 70
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
                  Rekomendasi Tindak Lanjut: Tugaskan mengerjakan soal tantangan tingkat tinggi (HOTS) atau ditugaskan menjadi tutor sebaya.
                </p>

                {listEnrichment.length === 0 ? (
                  <div className="bg-slate-50 border-3 border-black rounded-2xl p-6 text-center text-slate-400">
                    <X className="w-10 h-10 mx-auto mb-2 animate-pulse" />
                    <h5 className="font-black uppercase">Belum Ada Siswa Tuntas</h5>
                    <p className="text-xs font-bold mt-1">
                      Nilai seluruh siswa masih berada di bawah target ketercapaian minimal KKTP.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {listEnrichment.map((siswa, idx) => (
                      <div key={siswa.id} className="bg-emerald-50 border-3 border-black p-3.5 rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
                        <div>
                          <h4 className="font-black text-black text-sm uppercase leading-none">{siswa.nama}</h4>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">NISN: {siswa.nisn || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-500 text-white font-black text-sm px-2.5 py-1 rounded border-2 border-black">
                            {siswa.skor}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* 7. MODE CETAK: LEDGER RESMI (HIDDEN PRINT ONLY) */}
      {/* ======================================= */}
      <div className="hidden print:block bg-white text-black p-4 font-serif leading-relaxed" id="ledger-print-area">
        
        {/* Kop Resmi Surat SMK Mayantara */}
        <div className="border-b-4 border-double border-black pb-4 mb-6 flex items-center justify-between gap-6">
          {/* Mock Logo */}
          <div className="w-16 h-16 bg-black text-white font-serif font-black text-2xl flex items-center justify-center border-2 border-black rounded-full shrink-0">
            M
          </div>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold uppercase tracking-tight leading-tight">YAYASAN PENDIDIKAN TEKNOLOGI MAYANTARA</h1>
            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none mt-1">SMK TEKNOLOGI MAYANTARA</h2>
            <p className="text-xs font-semibold text-slate-800 mt-2">
              Jalan Pendidikan Digital No. 45, Mayantara, Jawa Timur
            </p>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              Telp: (031) 555-1234 | Surel: info@smkmayantara.sch.id | Website: www.smkmayantara.sch.id
            </p>
          </div>
          <div className="w-16 h-16 invisible shrink-0"></div>
        </div>

        {/* Laporan Judul */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-black uppercase underline tracking-wider">BUKU LEDGER / REKAPITULASI NILAI ASESMEN</h3>
          <p className="text-xs font-bold uppercase mt-1">Semester Ganjil - Tahun Pelajaran 2026/2027</p>
        </div>

        {/* Metadata Informasi */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-bold font-sans">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 w-32 uppercase text-slate-700">Mata Pelajaran</td>
                <td className="py-1 w-4 text-center">:</td>
                <td className="py-1 text-black font-black uppercase">{getSelectedMapelText()}</td>
              </tr>
              <tr>
                <td className="py-1 uppercase text-slate-700">Kelas / Rombel</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-black font-black uppercase">{getSelectedKelasText()}</td>
              </tr>
              <tr>
                <td className="py-1 uppercase text-slate-700">Guru Pendidik</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-black font-black uppercase">{guruName}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 w-32 uppercase text-slate-700">Tipe Asesmen</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-black font-black uppercase">{selectedJenisAsesmen}</td>
              </tr>
              <tr>
                <td className="py-1 uppercase text-slate-700">Lingkup Materi</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-black font-black font-sans">{getActiveTopicName() || '-'}</td>
              </tr>
              <tr>
                <td className="py-1 uppercase text-slate-700">KKTP Batas Lulus</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 text-black font-black">70.0</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ledger Table */}
        <table className="w-full border-collapse border-2 border-black text-xs mb-8">
          <thead>
            <tr className="bg-slate-100 text-left border-b-2 border-black font-bold font-sans">
              <th className="p-2 border-r-2 border-black text-center w-10">No</th>
              <th className="p-2 border-r-2 border-black w-28">NISN</th>
              <th className="p-2 border-r-2 border-black w-48">Nama Lengkap Siswa</th>
              <th className="p-2 border-r-2 border-black text-center w-16">Nilai</th>
              <th className="p-2 border-r-2 border-black text-center w-16">Ketuntasan</th>
              <th className="p-2">Deskripsi Kualitatif Kriteria Ketercapaian (KKTP)</th>
            </tr>
          </thead>
          <tbody>
            {siswaList.map((siswa, idx) => {
              const scoreData = scoresInput[siswa.id] || { skor: '', deskripsi: '' };
              const isFilled = scoreData.skor !== '';
              const scoreInt = isFilled ? parseInt(scoreData.skor) : 0;
              const isPassing = scoreInt >= 70;

              return (
                <tr key={siswa.id} className="border-b border-black font-serif">
                  <td className="p-2 border-r-2 border-black text-center font-sans font-bold">{idx + 1}</td>
                  <td className="p-2 border-r-2 border-black font-mono text-[10px]">{siswa.nisn || '-'}</td>
                  <td className="p-2 border-r-2 border-black font-sans font-bold uppercase text-black">{siswa.nama_lengkap}</td>
                  <td className="p-2 border-r-2 border-black text-center font-sans font-black">{isFilled ? scoreData.skor : '-'}</td>
                  <td className="p-2 border-r-2 border-black text-center font-sans font-bold uppercase">
                    {isFilled ? (isPassing ? 'Tuntas' : 'Remedial') : '-'}
                  </td>
                  <td className="p-2 font-serif text-[11px] leading-relaxed text-slate-800">
                    {scoreData.deskripsi || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Ringkasan Analisis Cetak */}
        <div className="border-2 border-black p-4 rounded-xl bg-slate-50 font-sans text-xs mb-8 flex justify-around items-center">
          <div>
            <span className="text-slate-600 font-bold uppercase">Siswa Terdaftar : </span>
            <strong className="text-black text-sm">{siswaList.length} Murid</strong>
          </div>
          <div>
            <span className="text-slate-600 font-bold uppercase">Rata-rata Kelas : </span>
            <strong className="text-black text-sm">{stats.average}</strong>
          </div>
          <div>
            <span className="text-slate-600 font-bold uppercase">Ketuntasan KKTP : </span>
            <strong className="text-black text-sm">{stats.passPercentage}% Tuntas</strong>
          </div>
          <div>
            <span className="text-slate-600 font-bold uppercase">Nilai Max / Min : </span>
            <strong className="text-black text-sm">{stats.highest} / {stats.lowest}</strong>
          </div>
        </div>

        {/* Pengesahan Tanda Tangan */}
        <div className="flex justify-between items-center text-xs font-bold mt-12 font-sans">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="mb-20">Kepala SMK Teknologi Mayantara</p>
            <p className="underline uppercase font-bold">Dr. Mayantara, M.Pd.</p>
            <p className="text-[10px] text-slate-500 font-normal">NIP. 19750824 200003 1 001</p>
          </div>
          <div className="text-center">
            <p>Mayantara, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="mb-20">Guru Mata Pelajaran</p>
            <p className="underline uppercase font-bold">{guruName}</p>
            <p className="text-[10px] text-slate-500 font-normal">Pendidik SMK Mayantara</p>
          </div>
        </div>

      </div>

      {/* ======================================= */}
      {/* 7. DATABASE MIGRATION WARNING MODAL (NEO-BRUTALIST) */}
      {/* ======================================= */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white border-4 border-black rounded-2xl w-full max-w-2xl flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-red-500 border-b-4 border-black p-4 flex items-center gap-3 shrink-0">
              <ShieldAlert className="w-8 h-8 text-black shrink-0 animate-bounce" />
              <div>
                <h4 className="font-black text-lg text-black uppercase tracking-tight leading-none">Skema Database Belum Diperbarui!</h4>
                <p className="text-[10px] font-bold text-black uppercase mt-1">Sistem mendeteksi tabel `nilai_asesmen` belum terdaftar.</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[60vh] font-semibold text-slate-800 text-sm">
              <div className="bg-red-50 border-3 border-black p-3.5 rounded-xl text-red-900 text-xs">
                <p className="font-black uppercase mb-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Kode Eror Database:
                </p>
                <code className="font-mono bg-red-100 border border-red-300 p-1.5 rounded block whitespace-pre-wrap mt-1 text-[11px] leading-relaxed">
                  {migrationErrorMsg || "Relation 'public.nilai_asesmen' does not exist"}
                </code>
              </div>

              <div>
                <p className="text-black font-black uppercase text-xs mb-2">💡 SOLUSI CARA UPDATE DATABASE SUPABASE:</p>
                <ol className="list-decimal pl-5 space-y-2 text-xs font-bold leading-relaxed text-slate-700">
                  <li>Buka Dashboard proyek <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline text-indigo-700 font-extrabold flex inline-flex items-center gap-0.5">Supabase Anda <FileText className="w-3.5 h-3.5" /></a></li>
                  <li>Pergi ke menu <strong>SQL Editor</strong> di sidebar sebelah kiri.</li>
                  <li>Klik <strong>New Query</strong>, lalu salin dan jalankan (Run) skrip SQL DDL berikut ini:</li>
                </ol>
              </div>

              {/* SQL script container */}
              <div className="relative">
                <span className="absolute top-2 right-2 bg-black text-yellow-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black z-10">
                  SQL Editor Script
                </span>
                <pre className="bg-slate-900 text-slate-100 font-mono text-[11px] p-4 border-3 border-black rounded-xl overflow-x-auto leading-relaxed max-h-48 whitespace-pre">
{`-- Membuat Tabel Nilai Asesmen Kurikulum Merdeka
CREATE TABLE IF NOT EXISTS public.nilai_asesmen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    guru_id UUID REFERENCES public.guru(id) ON DELETE CASCADE,
    kelas_id UUID REFERENCES public.kelas(id) ON DELETE CASCADE,
    mapel_id UUID REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
    siswa_id UUID REFERENCES public.siswa(id) ON DELETE CASCADE,
    jenis_asesmen VARCHAR(20) CHECK (jenis_asesmen IN ('diagnostik', 'formatif', 'sumatif')) NOT NULL,
    lingkup_materi VARCHAR(150) NOT NULL,
    skor INTEGER CHECK (skor >= 0 AND skor <= 100) NOT NULL,
    deskripsi TEXT DEFAULT '',
    CONSTRAINT unique_siswa_asesmen_bab UNIQUE (siswa_id, mapel_id, jenis_asesmen, lingkup_materi)
);

-- Mengaktifkan Row Level Security (RLS) & Kebijakan Izin
ALTER TABLE public.nilai_asesmen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.nilai_asesmen FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.nilai_asesmen FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.nilai_asesmen FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.nilai_asesmen FOR DELETE USING (true);`}
                </pre>
              </div>

              <div className="border-t-3 border-dashed border-black pt-4 bg-slate-50 p-4 border-3 border-black rounded-xl">
                <p className="font-black text-black uppercase text-xs mb-1">🚀 INGIN MENCOBA / PRATINJAU LANGSUNG?</p>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  Jika Anda belum memigrasikan database namun ingin segera menguji fitur Portal Asesmen ini (input nilai, auto-generate KKTP, melihat grafik, dan mencetak ledger resmi), silakan aktifkan opsi <strong>Simulasi Mode Bypass Lokal</strong> di bawah. Data nilai akan disimpan sementara di LocalStorage browser Anda.
                </p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-100 border-t-4 border-black p-4 flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsBypassed(true);
                  setShowMigrationModal(false);
                }}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black border-3 border-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tight shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-black" />
                Gunakan Simulasi Mode Bypass Lokal
              </button>
              
              <button
                type="button"
                onClick={() => setShowMigrationModal(false)}
                className="bg-white hover:bg-slate-100 text-black border-3 border-black px-6 py-3 rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
