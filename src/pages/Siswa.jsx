import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Edit, Trash2, Search, Phone, UserCircle, X, FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Siswa() {
  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination & Checkbox Selection States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState(new Set());

  // Bulk Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState([]);

  const initialFormState = {
    nisn: '',
    nis: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    kelas_id: '',
    nama_wali: '',
    no_hp_wali: '',
    alamat: '',
    status: 'Aktif'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({ id: '', ...initialFormState });

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKelas, selectedStatus, pageSize]);

  async function fetchKelas() {
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('id, tingkat, nama_rombel')
        .order('tingkat', { ascending: true })
        .order('nama_rombel', { ascending: true });
      if (error) throw error;
      setKelasList(data || []);
    } catch (error) {
      console.error('Error fetching kelas:', error.message);
    }
  }

  async function fetchSiswa() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('siswa')
        .select(`
          *,
          kelas (
            tingkat,
            nama_rombel
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSiswaList(data || []);
      setSelectedSiswaIds(new Set());
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const dataToInsert = {
        nisn: formData.nisn || null,
        nis: formData.nis || null,
        nama_lengkap: formData.nama_lengkap,
        jenis_kelamin: formData.jenis_kelamin,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir || null,
        kelas_id: formData.kelas_id || null,
        nama_wali: formData.nama_wali,
        no_hp_wali: formData.no_hp_wali,
        alamat: formData.alamat,
        status: formData.status
      };
      
      const { error } = await supabase.from('siswa').insert([dataToInsert]);
      if (error) throw error;
      
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchSiswa();
    } catch (error) {
      alert('Gagal menyimpan: Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openEditModal = (item) => {
    setEditFormData({
      id: item.id,
      nisn: item.nisn || '',
      nis: item.nis || '',
      nama_lengkap: item.nama_lengkap || '',
      jenis_kelamin: item.jenis_kelamin || 'L',
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir || '',
      kelas_id: item.kelas_id || '',
      nama_wali: item.nama_wali || '',
      no_hp_wali: item.no_hp_wali || '',
      alamat: item.alamat || '',
      status: item.status || 'Aktif'
    });
    setIsEditModalOpen(true);
  };

  async function handleEdit(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const dataToUpdate = {
        nisn: editFormData.nisn || null,
        nis: editFormData.nis || null,
        nama_lengkap: editFormData.nama_lengkap,
        jenis_kelamin: editFormData.jenis_kelamin,
        tempat_lahir: editFormData.tempat_lahir,
        tanggal_lahir: editFormData.tanggal_lahir || null,
        kelas_id: editFormData.kelas_id || null,
        nama_wali: editFormData.nama_wali,
        no_hp_wali: editFormData.no_hp_wali,
        alamat: editFormData.alamat,
        status: editFormData.status
      };

      const { error } = await supabase
        .from('siswa')
        .update(dataToUpdate)
        .eq('id', editFormData.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchSiswa();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Yakin ingin menghapus data siswa ini?')) {
      try {
        const { error } = await supabase.from('siswa').delete().eq('id', id);
        if (error) throw error;
        fetchSiswa();
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  }

  async function handleBulkDelete() {
    if (selectedSiswaIds.size === 0) return;
    if (window.confirm(`Yakin ingin menghapus ${selectedSiswaIds.size} siswa terpilih secara permanen?`)) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('siswa')
          .delete()
          .in('id', Array.from(selectedSiswaIds));
        if (error) throw error;
        alert(`Berhasil menghapus ${selectedSiswaIds.size} siswa.`);
        setSelectedSiswaIds(new Set());
        fetchSiswa();
      } catch (error) {
        alert('Gagal menghapus siswa terpilih: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  }

  const handleDownloadCSV = () => {
    const classObj = kelasList.find(c => c.id === selectedKelas);
    const classNameStr = classObj ? `${classObj.tingkat}-${classObj.nama_rombel}` : 'Semua_Kelas';
    
    // Helper to format cells for Excel to preserve leading zeroes and text representation
    const formatCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = val.toString().replace(/"/g, '""');
      // If it starts with 0 followed by digits, or is digits-only, or is a date format, force as text formula
      if (/^0\d+$/.test(str) || /^\+?\d+$/.test(str) || /^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return `"=""${str}"""`;
      }
      return `"${str}"`;
    };
    
    let csvContent = 'NISN,NIS,Nama Lengkap,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Kelas,Status,Nama Wali,Nomor HP Wali,Alamat\n';
    
    filteredSiswa.forEach(s => {
      const nisnVal = formatCell(s.nisn);
      const nisVal = formatCell(s.nis);
      const nameVal = formatCell(s.nama_lengkap);
      const jkVal = formatCell(s.jenis_kelamin);
      const tmptVal = formatCell(s.tempat_lahir);
      const tglVal = formatCell(s.tanggal_lahir);
      const classVal = formatCell(s.kelas ? `${s.kelas.tingkat}-${s.kelas.nama_rombel}` : '');
      const statusVal = formatCell(s.status);
      const waliVal = formatCell(s.nama_wali);
      const hpVal = formatCell(s.no_hp_wali);
      const alamatVal = formatCell(s.alamat);
      
      csvContent += `${nisnVal},${nisVal},${nameVal},${jkVal},${tmptVal},${tglVal},${classVal},${statusVal},${waliVal},${hpVal},${alamatVal}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Data_Siswa_${classNameStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parser CSV & Excel Tab-delimited text
  const handleParseImport = (text) => {
    if (!text.trim()) {
      setParsedImportRows([]);
      return;
    }

    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return;

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes(';') && !firstLine.includes('\t')) {
      delimiter = ';';
    } else if (firstLine.includes(',') && !firstLine.includes('\t') && !firstLine.includes(';')) {
      delimiter = ',';
    }

    const rawHeaders = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
    
    const headerMapping = {
      nisn: ['nisn', 'nomor induk siswa nasional', 'n.i.s.n'],
      nis: ['nis', 'nomor induk', 'no induk', 'n.i.s'],
      nama_lengkap: ['nama', 'nama lengkap', 'nama_lengkap', 'fullname', 'full name', 'siswa'],
      jenis_kelamin: ['jenis kelamin', 'jenis_kelamin', 'jk', 'l/p', 'gender', 'sex'],
      tempat_lahir: ['tempat lahir', 'tempat_lahir', 'tempat'],
      tanggal_lahir: ['tanggal lahir', 'tanggal_lahir', 'tgl lahir', 'tanggal_lahir_siswa'],
      kelas: ['kelas', 'kelas_id', 'rombel', 'nama rombel', 'tingkat'],
      nama_wali: ['nama wali', 'nama_wali', 'wali', 'orang tua', 'ortu', 'ayah', 'ibu'],
      no_hp_wali: ['no hp wali', 'no_hp_wali', 'no telp wali', 'telepon wali', 'hp wali', 'no hp', 'nomor hp'],
      alamat: ['alamat', 'domisili', 'alamat rumah', 'alamat lengkap'],
      status: ['status', 'aktif']
    };

    const mappedIndexes = {};
    Object.keys(headerMapping).forEach(field => {
      const match = rawHeaders.findIndex(header => 
        headerMapping[field].some(alias => header === alias || header.includes(alias) || alias.includes(header))
      );
      if (match !== -1) mappedIndexes[field] = match;
    });

    // Fallbacks
    if (mappedIndexes.nama_lengkap === undefined) {
      const idx = rawHeaders.findIndex(h => h.includes('nama'));
      mappedIndexes.nama_lengkap = idx !== -1 ? idx : 0;
    }

    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let cols = [];
      if (delimiter === '\t') {
        cols = line.split('\t');
      } else {
        const regex = new RegExp(`\\s*${delimiter}\\s*(?=(?:[^"]*"[^"]*")*[^"]*$)`);
        cols = line.split(regex).map(val => val.replace(/^["']|["']$/g, '').trim());
      }

      const rowData = {
        nisn: mappedIndexes.nisn !== undefined ? cols[mappedIndexes.nisn] || '' : '',
        nis: mappedIndexes.nis !== undefined ? cols[mappedIndexes.nis] || '' : '',
        nama_lengkap: mappedIndexes.nama_lengkap !== undefined ? cols[mappedIndexes.nama_lengkap] || '' : '',
        jenis_kelamin: mappedIndexes.jenis_kelamin !== undefined ? cols[mappedIndexes.jenis_kelamin] || 'L' : 'L',
        tempat_lahir: mappedIndexes.tempat_lahir !== undefined ? cols[mappedIndexes.tempat_lahir] || '' : '',
        tanggal_lahir: mappedIndexes.tanggal_lahir !== undefined ? cols[mappedIndexes.tanggal_lahir] || '' : '',
        kelasStr: mappedIndexes.kelas !== undefined ? cols[mappedIndexes.kelas] || '' : '',
        nama_wali: mappedIndexes.nama_wali !== undefined ? cols[mappedIndexes.nama_wali] || '' : '',
        no_hp_wali: mappedIndexes.no_hp_wali !== undefined ? cols[mappedIndexes.no_hp_wali] || '' : '',
        alamat: mappedIndexes.alamat !== undefined ? cols[mappedIndexes.alamat] || '' : '',
        status: mappedIndexes.status !== undefined ? cols[mappedIndexes.status] || 'Aktif' : 'Aktif',
      };

      rowData.nama_lengkap = rowData.nama_lengkap.trim();

      // Clean gender
      let jk = rowData.jenis_kelamin.trim().toUpperCase();
      if (jk.startsWith('P') || jk.includes('PEREMPUAN') || jk.includes('WITA') || jk === 'FEMALE') {
        rowData.jenis_kelamin = 'P';
      } else {
        rowData.jenis_kelamin = 'L';
      }

      // Format Date
      if (rowData.tanggal_lahir) {
        const dateClean = rowData.tanggal_lahir.replace(/[\/\.]/g, '-');
        const parts = dateClean.split('-');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            rowData.tanggal_lahir = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else if (parts[0].length === 4) {
            rowData.tanggal_lahir = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }
      }

      // Smart match kelas
      let kelasId = null;
      let matchedKelasName = '';
      if (rowData.kelasStr) {
        const cleanClassStr = rowData.kelasStr.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
        const matched = kelasList.find(k => {
          const kStr = `${k.tingkat}${k.nama_rombel}`.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
          return kStr === cleanClassStr;
        });
        if (matched) {
          kelasId = matched.id;
          matchedKelasName = `${matched.tingkat} - ${matched.nama_rombel}`;
        }
      }
      rowData.kelas_id = kelasId;
      rowData.matchedKelasName = matchedKelasName;

      rowData.isValid = rowData.nama_lengkap.length > 0;
      rowData.errorMsg = rowData.isValid ? '' : 'Nama Lengkap kosong';

      parsedRows.push(rowData);
    }

    setParsedImportRows(parsedRows);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImportText(evt.target.result);
        handleParseImport(evt.target.result);
      };
      reader.readAsText(file);
    }
  };

  async function executeBulkImport() {
    const validRows = parsedImportRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada data valid untuk diimpor!');
      return;
    }

    setImportLoading(true);
    try {
      const payload = validRows.map(r => ({
        nisn: r.nisn || null,
        nis: r.nis || null,
        nama_lengkap: r.nama_lengkap,
        jenis_kelamin: r.jenis_kelamin,
        tempat_lahir: r.tempat_lahir || null,
        tanggal_lahir: r.tanggal_lahir || null,
        kelas_id: r.kelas_id || null,
        nama_wali: r.nama_wali || null,
        no_hp_wali: r.no_hp_wali || null,
        alamat: r.alamat || null,
        status: r.status || 'Aktif'
      }));

      const { error } = await supabase.from('siswa').insert(payload);
      if (error) throw error;

      alert(`Berhasil mengimpor ${payload.length} data siswa!`);
      setIsImportModalOpen(false);
      setImportText('');
      setParsedImportRows([]);
      fetchSiswa();
    } catch (err) {
      console.error('Error importing data:', err);
      alert('Gagal mengimpor data ke database: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  }

  const filteredSiswa = siswaList.filter((item) => {
    const matchesKelas = selectedKelas ? item.kelas_id === selectedKelas : true;
    const matchesStatus = selectedStatus ? item.status === selectedStatus : true;
    const matchesSearch = searchQuery
      ? (item.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nisn || '').includes(searchQuery)
      : true;
    return matchesKelas && matchesStatus && matchesSearch;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredSiswa.length / pageSize);
  const paginatedSiswa = filteredSiswa.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Checkbox row functions
  const handleSelectRow = (id) => {
    const newSelection = new Set(selectedSiswaIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSiswaIds(newSelection);
  };

  const handleSelectAll = (e) => {
    const newSelection = new Set(selectedSiswaIds);
    if (e.target.checked) {
      paginatedSiswa.forEach(s => newSelection.add(s.id));
    } else {
      paginatedSiswa.forEach(s => newSelection.delete(s.id));
    }
    setSelectedSiswaIds(newSelection);
  };

  const isAllSelected = paginatedSiswa.length > 0 && paginatedSiswa.every(s => selectedSiswaIds.has(s.id));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Siswa</h1>
          <p className="text-slate-500">Manajemen informasi profil siswa dan data orang tua/wali.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedSiswaIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Terpilih ({selectedSiswaIds.size})</span>
            </button>
          )}
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm text-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Excel/CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full lg:max-w-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Cari NISN atau Nama Siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full focus:ring-0"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors outline-none cursor-pointer font-medium w-full sm:w-auto"
            >
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.tingkat} - {k.nama_rombel}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors outline-none cursor-pointer font-medium w-full sm:w-auto"
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Lulus">Lulus</option>
              <option value="Pindah">Pindah</option>
              <option value="DO">Drop Out</option>
            </select>

            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg w-full sm:w-auto justify-between">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent border-none text-slate-700 text-xs font-bold outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 font-semibold w-12 text-center">No.</th>
                <th className="px-6 py-4 font-semibold">Profil Siswa</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold">Tempat, Tgl Lahir / L/P</th>
                <th className="px-6 py-4 font-semibold">Data Wali</th>
                <th className="px-6 py-4 font-semibold">Alamat Domisili</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-500 animate-pulse font-medium">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : paginatedSiswa.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedSiswa.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors group ${selectedSiswaIds.has(item.id) ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSiswaIds.has(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900">{item.nama_lengkap}</span>
                        <span className="font-mono text-xs text-slate-500">
                          NISN: {item.nisn || '-'} • NIS: {item.nis || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.kelas ? `${item.kelas.tingkat} - ${item.kelas.nama_rombel}` : 'Belum Ada Kelas'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span>
                          {item.tempat_lahir || '-'}, {item.tanggal_lahir || '-'}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          Jenis Kelamin: {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <UserCircle className="w-4 h-4 text-slate-400" />
                          {item.nama_wali || '-'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {item.no_hp_wali || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate font-medium text-slate-700" title={item.alamat}>
                        {item.alamat || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          item.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'Lulus'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && filteredSiswa.length > 0 && (
        <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs font-semibold text-slate-500">
            Menampilkan <span className="text-slate-800">{paginatedSiswa.length}</span> dari <span className="text-slate-800">{filteredSiswa.length}</span> siswa (Halaman {currentPage} dari {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border border-slate-200 rounded-md transition-all text-xs font-bold text-slate-700 cursor-pointer"
            >
              Sebelumnya
            </button>

            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border border-slate-200 rounded-md transition-all text-xs font-bold text-slate-700 cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" /> Impor Massal Data Siswa (Excel / CSV)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salin & tempel kolom data langsung dari file spreadsheet Anda, atau unggah file CSV.
                </p>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
              
              {/* Opsi Upload / Area Paste */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-sm font-semibold text-slate-700">Opsi 1: Unggah File CSV (.csv)</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/10 transition-colors cursor-pointer relative h-28">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCSVUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-600">Klik atau seret file CSV ke sini</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Format file teks dipisahkan koma atau titik koma</span>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-sm font-semibold text-slate-700">Opsi 2: Salin-Tempel dari Excel / Google Sheets</label>
                  <textarea
                    rows="3"
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      handleParseImport(e.target.value);
                    }}
                    placeholder="Tempel baris data tabel Excel Anda di sini (termasuk kolom baris pertama sebagai Header)..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none flex-1 h-28"
                  />
                </div>
              </div>

              {/* Table Preview */}
              {parsedImportRows.length > 0 && (
                <div className="space-y-2 flex-1 flex flex-col min-h-[220px]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">
                      Pratinjau Data Impor ({parsedImportRows.filter(r => r.isValid).length} baris valid dari {parsedImportRows.length} total)
                    </h3>
                    <button 
                      onClick={() => { setImportText(''); setParsedImportRows([]); }}
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Reset Pratinjau
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 overflow-y-auto max-h-56 shadow-sm">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-900 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5 font-bold">Status</th>
                          <th className="px-4 py-2.5 font-bold">Nama Lengkap</th>
                          <th className="px-4 py-2.5 font-bold">NISN</th>
                          <th className="px-4 py-2.5 font-bold">NIS</th>
                          <th className="px-4 py-2.5 font-bold">JK</th>
                          <th className="px-4 py-2.5 font-bold">Kelas Terdeteksi</th>
                          <th className="px-4 py-2.5 font-bold">Wali</th>
                          <th className="px-4 py-2.5 font-bold">No HP</th>
                          <th className="px-4 py-2.5 font-bold">Alamat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {parsedImportRows.map((r, idx) => (
                          <tr key={idx} className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/40 text-rose-900'}>
                            <td className="px-4 py-2 font-semibold">
                              {r.isValid ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200" title={r.errorMsg}>
                                  Gagal
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 font-bold">{r.nama_lengkap || <span className="text-red-500 italic">Nama kosong</span>}</td>
                            <td className="px-4 py-2 font-mono text-slate-500">{r.nisn || '-'}</td>
                            <td className="px-4 py-2 font-mono text-slate-500">{r.nis || '-'}</td>
                            <td className="px-4 py-2">{r.jenis_kelamin}</td>
                            <td className="px-4 py-2">
                              {r.kelas_id ? (
                                <span className="bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border border-indigo-200">
                                  {r.matchedKelasName}
                                </span>
                              ) : r.kelasStr ? (
                                <span className="bg-rose-150 text-rose-800 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold" title="Tidak ditemukan dalam database kelas">
                                  Gagal Match: "{r.kelasStr}"
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-slate-800">{r.nama_wali || '-'}</td>
                            <td className="px-4 py-2 text-slate-500 font-mono">{r.no_hp_wali || '-'}</td>
                            <td className="px-4 py-2 text-slate-500 truncate max-w-[150px]" title={r.alamat}>{r.alamat || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold">
                Tips: Pastikan baris pertama file Excel / CSV berisi nama header kolom (misal: "Nama Lengkap", "NISN", "Kelas").
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeBulkImport}
                  disabled={importLoading || parsedImportRows.filter(r => r.isValid).length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {importLoading ? 'Sedang Mengimpor...' : `Proses Impor (${parsedImportRows.filter(r => r.isValid).length} Siswa)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {(isAddModalOpen || isEditModalOpen) && (() => {
        const isEdit = isEditModalOpen;
        const currentData = isEdit ? editFormData : formData;
        const setForm = isEdit ? setEditFormData : setFormData;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-lg">
                  {isEdit ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
                </h2>
                <button
                  onClick={() => (isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false))}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={isEdit ? handleEdit : handleAdd} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2 border-b border-blue-100 pb-2 text-sm">
                    <span className="w-2 h-4 bg-blue-500 rounded-full"></span>
                    Informasi Akademik
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Nama Lengkap *</label>
                      <input
                        type="text"
                        required
                        value={currentData.nama_lengkap}
                        onChange={(e) => setForm({ ...currentData, nama_lengkap: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">NISN</label>
                      <input
                        type="text"
                        value={currentData.nisn}
                        onChange={(e) => setForm({ ...currentData, nisn: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">NIS Lokal</label>
                      <input
                        type="text"
                        value={currentData.nis}
                        onChange={(e) => setForm({ ...currentData, nis: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Penempatan Kelas</label>
                      <select
                        value={currentData.kelas_id}
                        onChange={(e) => setForm({ ...currentData, kelas_id: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {kelasList.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.tingkat} - {k.nama_rombel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Status Siswa</label>
                      <select
                        value={currentData.status}
                        onChange={(e) => setForm({ ...currentData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Lulus">Lulus</option>
                        <option value="Pindah">Pindah</option>
                        <option value="DO">Drop Out (DO)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2 border-b border-amber-100 pb-2 text-sm">
                    <span className="w-2 h-4 bg-amber-500 rounded-full"></span>
                    Data Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Jenis Kelamin</label>
                      <select
                        value={currentData.jenis_kelamin}
                        onChange={(e) => setForm({ ...currentData, jenis_kelamin: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tempat Lahir</label>
                      <input
                        type="text"
                        value={currentData.tempat_lahir}
                        onChange={(e) => setForm({ ...currentData, tempat_lahir: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={currentData.tanggal_lahir}
                        onChange={(e) => setForm({ ...currentData, tanggal_lahir: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2 border-b border-emerald-100 pb-2 text-sm">
                    <span className="w-2 h-4 bg-emerald-500 rounded-full"></span>
                    Data Orang Tua / Wali
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Nama Orang Tua/Wali</label>
                      <input
                        type="text"
                        value={currentData.nama_wali}
                        onChange={(e) => setForm({ ...currentData, nama_wali: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Nomor HP/WA Wali</label>
                      <input
                        type="text"
                        value={currentData.no_hp_wali}
                        onChange={(e) => setForm({ ...currentData, no_hp_wali: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">Alamat Lengkap Domisili</label>
                      <textarea
                        rows="2"
                        value={currentData.alamat}
                        onChange={(e) => setForm({ ...currentData, alamat: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => (isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false))}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 cursor-pointer text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 cursor-pointer text-sm"
                  >
                    {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Data Siswa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
