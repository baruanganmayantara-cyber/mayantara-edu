import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Phone, Mail, Edit, Trash2, X, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function Guru() {
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState([]);

  const initialFormState = {
    nip: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    no_hp: '',
    email: '',
    status: 'GTY',
    foto_base64: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', ...initialFormState, foto_url_lama: '' });

  useEffect(() => {
    fetchGuru();
  }, []);

  async function fetchGuru() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guru')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuruList(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Yakin ingin menghapus guru ini? Semua data terkait (seperti penugasan wali kelas) bisa terpengaruh.')) {
      try {
        const { error } = await supabase.from('guru').delete().eq('id', id);
        if (error) throw error;
        fetchGuru();
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  }

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return alert('Ukuran file maksimal 2MB!');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditFormData({ ...editFormData, foto_base64: reader.result });
        } else {
          setFormData({ ...formData, foto_base64: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleAdd(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let photoUrl = formData.foto_base64;
      if (!photoUrl) {
        photoUrl = formData.jenis_kelamin === 'L'
          ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(formData.nama_lengkap)}`
          : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(formData.nama_lengkap)}`;
      }

      const { error } = await supabase.from('guru').insert([{
        nip: formData.nip || null,
        nama_lengkap: formData.nama_lengkap,
        jenis_kelamin: formData.jenis_kelamin,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir || null,
        alamat: formData.alamat,
        no_hp: formData.no_hp,
        email: formData.email,
        status: formData.status,
        foto_url: photoUrl
      }]);

      if (error) throw error;

      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchGuru();
    } catch (error) {
      alert('Gagal menyimpan guru: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openEditModal = (item) => {
    setEditFormData({
      id: item.id,
      nip: item.nip || '',
      nama_lengkap: item.nama_lengkap || '',
      jenis_kelamin: item.jenis_kelamin || 'L',
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir || '',
      alamat: item.alamat || '',
      no_hp: item.no_hp || '',
      email: item.email || '',
      status: item.status || 'GTY',
      foto_base64: '',
      foto_url_lama: item.foto_url || ''
    });
    setIsEditModalOpen(true);
  };

  async function handleEdit(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const photoUrl = editFormData.foto_base64 || editFormData.foto_url_lama;

      const { error } = await supabase
        .from('guru')
        .update({
          nip: editFormData.nip || null,
          nama_lengkap: editFormData.nama_lengkap,
          jenis_kelamin: editFormData.jenis_kelamin,
          tempat_lahir: editFormData.tempat_lahir,
          tanggal_lahir: editFormData.tanggal_lahir || null,
          alamat: editFormData.alamat,
          no_hp: editFormData.no_hp,
          email: editFormData.email,
          status: editFormData.status,
          foto_url: photoUrl
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      fetchGuru();
    } catch (error) {
      alert('Gagal mengupdate guru: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Parser CSV & Excel tabular data for Guru
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
      nip: ['nip', 'nomor induk pegawai', 'n.i.p', 'no induk pegawai'],
      nama_lengkap: ['nama', 'nama lengkap', 'nama_lengkap', 'fullname', 'full name', 'guru', 'staf'],
      jenis_kelamin: ['jenis kelamin', 'jenis_kelamin', 'jk', 'l/p', 'gender', 'sex'],
      status: ['status', 'status kepegawaian', 'kepegawaian'],
      tempat_lahir: ['tempat lahir', 'tempat_lahir', 'tempat'],
      tanggal_lahir: ['tanggal lahir', 'tanggal_lahir', 'tgl lahir', 'tanggal_lahir_guru'],
      no_hp: ['no hp', 'nomor hp', 'telepon', 'no telp', 'hp', 'phone', 'no_hp', 'kontak'],
      email: ['email', 'surel', 'e-mail'],
      alamat: ['alamat', 'domisili', 'alamat rumah', 'alamat lengkap'],
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
        nip: mappedIndexes.nip !== undefined ? cols[mappedIndexes.nip] || '' : '',
        nama_lengkap: mappedIndexes.nama_lengkap !== undefined ? cols[mappedIndexes.nama_lengkap] || '' : '',
        jenis_kelamin: mappedIndexes.jenis_kelamin !== undefined ? cols[mappedIndexes.jenis_kelamin] || 'L' : 'L',
        status: mappedIndexes.status !== undefined ? cols[mappedIndexes.status] || 'GTY' : 'GTY',
        tempat_lahir: mappedIndexes.tempat_lahir !== undefined ? cols[mappedIndexes.tempat_lahir] || '' : '',
        tanggal_lahir: mappedIndexes.tanggal_lahir !== undefined ? cols[mappedIndexes.tanggal_lahir] || '' : '',
        no_hp: mappedIndexes.no_hp !== undefined ? cols[mappedIndexes.no_hp] || '' : '',
        email: mappedIndexes.email !== undefined ? cols[mappedIndexes.email] || '' : '',
        alamat: mappedIndexes.alamat !== undefined ? cols[mappedIndexes.alamat] || '' : '',
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

      // Normalize Kepegawaian
      let st = rowData.status.trim().toUpperCase();
      if (st.includes('PNS') || st.includes('NEGERI')) {
        rowData.status = 'PNS';
      } else if (st.includes('HONOR') || st.includes('LEPAS') || st.includes('GTT')) {
        rowData.status = 'Honorer';
      } else {
        rowData.status = 'GTY';
      }

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
      const payload = validRows.map(r => {
        let photoUrl = r.jenis_kelamin === 'L'
          ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(r.nama_lengkap)}`
          : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(r.nama_lengkap)}`;

        return {
          nip: r.nip || null,
          nama_lengkap: r.nama_lengkap,
          jenis_kelamin: r.jenis_kelamin,
          status: r.status,
          tempat_lahir: r.tempat_lahir || null,
          tanggal_lahir: r.tanggal_lahir || null,
          no_hp: r.no_hp || null,
          email: r.email || null,
          alamat: r.alamat || null,
          foto_url: photoUrl
        };
      });

      const { error } = await supabase.from('guru').insert(payload);
      if (error) throw error;

      alert(`Berhasil mengimpor ${payload.length} data guru!`);
      setIsImportModalOpen(false);
      setImportText('');
      setParsedImportRows([]);
      fetchGuru();
    } catch (err) {
      console.error('Error importing data:', err);
      alert('Gagal mengimpor data ke database: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  }

  const handleDownloadCSV = () => {
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
    
    let csvContent = 'NIP,Nama Lengkap,Jenis Kelamin,Status,Tempat Lahir,Tanggal Lahir,Nomor HP,Email,Alamat\n';
    
    filteredGuru.forEach(g => {
      const nipVal = formatCell(g.nip);
      const nameVal = formatCell(g.nama_lengkap);
      const jkVal = formatCell(g.jenis_kelamin);
      const statusVal = formatCell(g.status);
      const tmptVal = formatCell(g.tempat_lahir);
      const tglVal = formatCell(g.tanggal_lahir);
      const hpVal = formatCell(g.no_hp);
      const emailVal = formatCell(g.email);
      const alamatVal = formatCell(g.alamat);
      
      csvContent += `${nipVal},${nameVal},${jkVal},${statusVal},${tmptVal},${tglVal},${hpVal},${emailVal},${alamatVal}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Data_Guru_dan_Staf.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGuru = guruList.filter((item) =>
    (item.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.nip || '').includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Guru & Staf</h1>
          <p className="text-slate-500">Manajemen informasi profil dan kontak tenaga pendidik.</p>
        </div>
        <div className="flex gap-2">
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
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full max-w-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Cari berdasarkan NIP atau Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full focus:ring-0"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-12 text-center">No.</th>
                <th className="px-6 py-4 font-semibold">Profil Guru</th>
                <th className="px-6 py-4 font-semibold">L/P</th>
                <th className="px-6 py-4 font-semibold">Tempat, Tgl Lahir</th>
                <th className="px-6 py-4 font-semibold">Kontak</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 animate-pulse font-medium">
                    Memuat data guru...
                  </td>
                </tr>
              ) : filteredGuru.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    Belum ada data guru. Silakan tambahkan.
                  </td>
                </tr>
              ) : (
                filteredGuru.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.foto_url ||
                            (item.jenis_kelamin === 'L'
                              ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(item.nama_lengkap)}`
                              : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(item.nama_lengkap)}`)
                          }
                          alt={item.nama_lengkap}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{item.nama_lengkap}</span>
                          <span className="font-mono text-xs text-slate-500">NIP: {item.nip || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.jenis_kelamin}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{item.tempat_lahir || '-'}</span>
                        <span className="text-xs text-slate-500 font-semibold">{item.tanggal_lahir || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {item.no_hp || '-'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {item.email || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          item.status === 'PNS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.status === 'GTY'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
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
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
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

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" /> Impor Massal Data Guru (Excel / CSV)
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
                          <th className="px-4 py-2.5 font-bold">NIP</th>
                          <th className="px-4 py-2.5 font-bold">JK</th>
                          <th className="px-4 py-2.5 font-bold">Status Kerja</th>
                          <th className="px-4 py-2.5 font-bold">Tempat Lahir</th>
                          <th className="px-4 py-2.5 font-bold">Tgl Lahir</th>
                          <th className="px-4 py-2.5 font-bold">No HP</th>
                          <th className="px-4 py-2.5 font-bold">Email</th>
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
                            <td className="px-4 py-2 font-mono text-slate-500">{r.nip || '-'}</td>
                            <td className="px-4 py-2">{r.jenis_kelamin}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                r.status === 'PNS' ? 'bg-blue-50 text-blue-750 border-blue-200' : 'bg-emerald-50 text-emerald-750 border-emerald-200'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-800">{r.tempat_lahir || '-'}</td>
                            <td className="px-4 py-2 text-slate-500 font-mono">{r.tanggal_lahir || '-'}</td>
                            <td className="px-4 py-2 text-slate-500 font-mono">{r.no_hp || '-'}</td>
                            <td className="px-4 py-2 text-slate-500">{r.email || '-'}</td>
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
                Tips: Pastikan baris pertama file Excel / CSV berisi nama header kolom (misal: "Nama Lengkap", "NIP", "Status").
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
                  {importLoading ? 'Sedang Mengimpor...' : `Proses Impor (${parsedImportRows.filter(r => r.isValid).length} Guru)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-bold text-slate-900 text-lg">Tambah Data Guru</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0 relative group">
                  <img
                    src={
                      formData.foto_base64 ||
                      (formData.jenis_kelamin === 'L'
                        ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(formData.nama_lengkap || 'Guru')}`
                        : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(formData.nama_lengkap || 'Guru')}`)
                    }
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 text-xs">Foto Profil Guru</h3>
                  <p className="text-xs text-slate-500">
                    Opsional. Maksimal 2MB. Jika tidak diunggah, otomatis menggunakan ilustrasi Avatar{' '}
                    {formData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} di samping.
                  </p>
                  <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Pilih Foto
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, false)} className="hidden" />
                  </label>
                  {formData.foto_base64 && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foto_base64: '' })}
                      className="ml-2 text-xs text-red-500 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Status Kepegawaian</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                  >
                    <option value="PNS">PNS</option>
                    <option value="GTY">GTY</option>
                    <option value="Honorer">Honorer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nomor HP</label>
                  <input
                    type="text"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm font-semibold text-slate-750"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-sm font-semibold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-bold text-slate-900 text-lg">Edit Data Guru</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <img
                    src={
                      editFormData.foto_base64 ||
                      editFormData.foto_url_lama ||
                      (editFormData.jenis_kelamin === 'L'
                        ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(editFormData.nama_lengkap || 'Guru')}`
                        : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(editFormData.nama_lengkap || 'Guru')}`)
                    }
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 text-xs">Ubah Foto Profil</h3>
                  <p className="text-xs text-slate-500">
                    Avatar otomatis menyesuaikan nama dan jenis kelamin jika tidak mengunggah foto.
                  </p>
                  <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Pilih Foto Baru
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, true)} className="hidden" />
                  </label>
                  {editFormData.foto_base64 && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, foto_base64: '' })}
                      className="ml-2 text-xs text-red-500 hover:underline"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nama_lengkap}
                    onChange={(e) => setEditFormData({ ...editFormData, nama_lengkap: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={editFormData.nip}
                    onChange={(e) => setEditFormData({ ...editFormData, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={editFormData.jenis_kelamin}
                    onChange={(e) => setEditFormData({ ...editFormData, jenis_kelamin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Status Kepegawaian</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                  >
                    <option value="PNS">PNS</option>
                    <option value="GTY">GTY</option>
                    <option value="Honorer">Honorer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tempat Lahir</label>
                  <input
                    type="text"
                    value={editFormData.tempat_lahir}
                    onChange={(e) => setEditFormData({ ...editFormData, tempat_lahir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editFormData.tanggal_lahir}
                    onChange={(e) => setEditFormData({ ...editFormData, tanggal_lahir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nomor HP</label>
                  <input
                    type="text"
                    value={editFormData.no_hp}
                    onChange={(e) => setEditFormData({ ...editFormData, no_hp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  value={editFormData.alamat}
                  onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm font-semibold text-slate-750"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-sm font-semibold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}