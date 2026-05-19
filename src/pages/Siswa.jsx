import { Plus, Edit, Trash2, Search, Filter, Phone, UserCircle, X, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Siswa() {
  const [siswaData, setSiswaData] = useState([]);
  const [kelasData, setKelasData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    nisn: '', nis: '', nama_lengkap: '', jenis_kelamin: 'L', 
    tempat_lahir: '', tanggal_lahir: '', kelas_id: '', 
    nama_wali: '', no_hp_wali: '', alamat: '', status: 'Aktif'
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({ id: '', ...initialFormState });

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  async function fetchKelas() {
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('id, tingkat, nama_rombel')
        .order('tingkat', { ascending: true })
        .order('nama_rombel', { ascending: true });
      if (error) throw error;
      setKelasData(data || []);
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
      setSiswaData(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Tambah
  async function handleAddSiswa(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
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

      const { error } = await supabase.from('siswa').insert([payload]);
      if (error) throw error;

      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchSiswa();
    } catch (error) {
      alert('Gagal menyimpan: Cek apakah nama kolom database sesuai. Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Edit
  const openEditModal = (siswa) => {
    setEditFormData({
      id: siswa.id,
      nisn: siswa.nisn || '',
      nis: siswa.nis || '',
      nama_lengkap: siswa.nama_lengkap || '',
      jenis_kelamin: siswa.jenis_kelamin || 'L',
      tempat_lahir: siswa.tempat_lahir || '',
      tanggal_lahir: siswa.tanggal_lahir || '',
      kelas_id: siswa.kelas_id || '',
      nama_wali: siswa.nama_wali || '',
      no_hp_wali: siswa.no_hp_wali || '',
      alamat: siswa.alamat || '',
      status: siswa.status || 'Aktif'
    });
    setIsEditModalOpen(true);
  };

  async function handleEditSiswa(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
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

      const { error } = await supabase.from('siswa').update(payload).eq('id', editFormData.id);
      if (error) throw error;

      setIsEditModalOpen(false);
      fetchSiswa();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Hapus
  async function handleDeleteSiswa(id) {
    if (!window.confirm('Yakin ingin menghapus data siswa ini?')) return;
    try {
      const { error } = await supabase.from('siswa').delete().eq('id', id);
      if (error) throw error;
      fetchSiswa();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  }

  const filteredSiswa = siswaData.filter(siswa => {
    const matchKelas = selectedKelas ? siswa.kelas_id === selectedKelas : true;
    const matchStatus = selectedStatus ? siswa.status === selectedStatus : true;
    const matchSearch = searchQuery ? 
      (siswa.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       siswa.nisn?.includes(searchQuery)) : true;
    
    return matchKelas && matchStatus && matchSearch;
  });

  const exportToCSV = () => {
    const selectedKelasObj = kelasData.find(k => k.id === selectedKelas);
    const namaKelasFilter = selectedKelasObj ? `${selectedKelasObj.tingkat}-${selectedKelasObj.nama_rombel}` : 'Semua_Kelas';

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "NISN,NIS,Nama Lengkap,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Kelas,Status,Nama Wali,Nomor HP Wali,Alamat\n";
    
    filteredSiswa.forEach(row => {
      const nisn = row.nisn || '';
      const nis = row.nis || '';
      const nm = row.nama_lengkap || '';
      const jk = row.jenis_kelamin || '';
      const tmpt = row.tempat_lahir || '';
      const tgl = row.tanggal_lahir || '';
      const kls = row.kelas ? `${row.kelas.tingkat}-${row.kelas.nama_rombel}` : '';
      const st = row.status || '';
      const wali = row.nama_wali || '';
      const hp = row.no_hp_wali || '';
      const almt = row.alamat || '';
      
      csvContent += `"${nisn}","${nis}","${nm}","${jk}","${tmpt}","${tgl}","${kls}","${st}","${wali}","${hp}","${almt}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Siswa_${namaKelasFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Siswa</h1>
          <p className="text-slate-500">Manajemen informasi profil siswa dan data orang tua/wali.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
            <span className="hidden sm:inline">Unduh Excel</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Tambah Siswa</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full md:max-w-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input type="text" placeholder="Cari NISN atau Nama Siswa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-full focus:ring-0" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors outline-none cursor-pointer">
              <option value="">Semua Kelas</option>
              {kelasData.map(k => (
                <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_rombel}</option>
              ))}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors outline-none cursor-pointer">
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Lulus">Lulus</option>
              <option value="Pindah">Pindah</option>
              <option value="DO">Drop Out</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr>
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
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500 animate-pulse">Memuat data siswa...</td></tr>
              ) : filteredSiswa.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Tidak ada data siswa yang cocok dengan filter.</td></tr>
              ) : (
                filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900">{siswa.nama_lengkap}</span>
                        <span className="font-mono text-xs text-slate-500">NISN: {siswa.nisn || '-'} • NIS: {siswa.nis || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {siswa.kelas ? `${siswa.kelas.tingkat} - ${siswa.kelas.nama_rombel}` : 'Belum Ada Kelas'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span>{siswa.tempat_lahir || '-'}, {siswa.tanggal_lahir || '-'}</span>
                        <span className="text-xs text-slate-500">Jenis Kelamin: {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700"><UserCircle className="w-4 h-4 text-slate-400" /> {siswa.nama_wali || '-'}</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="w-3.5 h-3.5 text-slate-400" /> {siswa.no_hp_wali || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="max-w-[200px] truncate" title={siswa.alamat}>{siswa.alamat || '-'}</div></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${siswa.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          siswa.status === 'Lulus' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-red-50 text-red-700 border-red-200'}`}>
                        {siswa.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(siswa)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit Data"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteSiswa(siswa.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Siswa"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Siswa (Reused untuk Tambah & Edit) */}
      {(isModalOpen || isEditModalOpen) && (() => {
        const isEdit = isEditModalOpen;
        const currentData = isEdit ? editFormData : formData;
        const setFunction = isEdit ? setEditFormData : setFormData;
        const handleSubmit = isEdit ? handleEditSiswa : handleAddSiswa;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-lg">{isEdit ? 'Edit Data Siswa' : 'Tambah Data Siswa'}</h2>
                <button onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                
                {/* Informasi Akademik */}
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2 border-b border-blue-100 pb-2"><span className="w-2 h-4 bg-blue-500 rounded-full"></span> Informasi Akademik</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Nama Lengkap *</label>
                      <input type="text" required value={currentData.nama_lengkap} onChange={(e) => setFunction({...currentData, nama_lengkap: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">NISN</label>
                      <input type="text" value={currentData.nisn} onChange={(e) => setFunction({...currentData, nisn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">NIS Lokal</label>
                      <input type="text" value={currentData.nis} onChange={(e) => setFunction({...currentData, nis: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Penempatan Kelas</label>
                      <select value={currentData.kelas_id} onChange={(e) => setFunction({...currentData, kelas_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white">
                        <option value="">-- Pilih Kelas --</option>
                        {kelasData.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_rombel}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Status Siswa</label>
                      <select value={currentData.status} onChange={(e) => setFunction({...currentData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer">
                        <option value="Aktif">Aktif</option>
                        <option value="Lulus">Lulus</option>
                        <option value="Pindah">Pindah</option>
                        <option value="DO">Drop Out (DO)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Data Pribadi */}
                <div className="space-y-4">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2 border-b border-amber-100 pb-2"><span className="w-2 h-4 bg-amber-500 rounded-full"></span> Data Pribadi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
                      <select value={currentData.jenis_kelamin} onChange={(e) => setFunction({...currentData, jenis_kelamin: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer">
                        <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Tempat Lahir</label>
                      <input type="text" value={currentData.tempat_lahir} onChange={(e) => setFunction({...currentData, tempat_lahir: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Tanggal Lahir</label>
                      <input type="date" value={currentData.tanggal_lahir} onChange={(e) => setFunction({...currentData, tanggal_lahir: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>

                {/* Data Orang Tua/Wali */}
                <div className="space-y-4">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2 border-b border-emerald-100 pb-2"><span className="w-2 h-4 bg-emerald-500 rounded-full"></span> Data Orang Tua / Wali</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Nama Orang Tua/Wali</label>
                      <input type="text" value={currentData.nama_wali} onChange={(e) => setFunction({...currentData, nama_wali: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Nomor HP/WA Wali</label>
                      <input type="text" value={currentData.no_hp_wali} onChange={(e) => setFunction({...currentData, no_hp_wali: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Alamat Lengkap Domisili</label>
                      <textarea rows="2" value={currentData.alamat} onChange={(e) => setFunction({...currentData, alamat: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"></textarea>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Data Siswa')}</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
