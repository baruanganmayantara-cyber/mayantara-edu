import { Plus, Edit, Trash2, Search, Filter, X, Minus, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Kelas() {
  const [kelasData, setKelasData] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Form (Input Masal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTingkat, setFormTingkat] = useState('');
  const [formRombel, setFormRombel] = useState([{ kode_kelas: '', nama_rombel: '', wali_kelas_id: '' }]);

  // State untuk Modal Edit (Satuan)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', tingkat: '', kode_kelas: '', nama_rombel: '', wali_kelas_id: '' });

  useEffect(() => {
    fetchKelas();
    fetchGuruList();
  }, []);

  async function fetchGuruList() {
    const { data } = await supabase.from('guru').select('id, nama_lengkap').order('nama_lengkap', { ascending: true });
    if (data) setGuruList(data);
  }

  async function fetchKelas() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kelas')
        .select(`
          id,
          tingkat,
          kode_kelas,
          nama_rombel,
          wali_kelas_id,
          guru (
            nama_lengkap
          )
        `)
        .order('tingkat', { ascending: true })
        .order('nama_rombel', { ascending: true });

      if (error) throw error;
      setKelasData(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // ==== Handle Input Masal Rombel ====
  const handleAddRombelRow = () => {
    setFormRombel([...formRombel, { kode_kelas: '', nama_rombel: '', wali_kelas_id: '' }]);
  };

  const handleRemoveRombelRow = (index) => {
    const newRombel = [...formRombel];
    newRombel.splice(index, 1);
    setFormRombel(newRombel);
  };

  const handleChangeRombel = (index, field, value) => {
    const newRombel = [...formRombel];
    newRombel[index][field] = value;
    setFormRombel(newRombel);
  };

  // Fungsi Tambah Kelas Masal ke Supabase
  async function handleAddClass(e) {
    e.preventDefault();
    
    const validRombel = formRombel.filter(r => r.kode_kelas.trim() !== '' && r.nama_rombel.trim() !== '');
    if (validRombel.length === 0) return alert('Minimal isi 1 rombel dengan lengkap!');

    try {
      setIsSubmitting(true);
      const payload = validRombel.map(r => ({
        tingkat: formTingkat,
        kode_kelas: r.kode_kelas.toUpperCase(),
        nama_rombel: r.nama_rombel,
        wali_kelas_id: r.wali_kelas_id || null
      }));

      const { error } = await supabase.from('kelas').insert(payload);
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormTingkat('');
      setFormRombel([{ kode_kelas: '', nama_rombel: '', wali_kelas_id: '' }]);
      fetchKelas();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==== Handle Edit Kelas Satuan ====
  const openEditModal = (kelas) => {
    setEditFormData({
      id: kelas.id,
      tingkat: kelas.tingkat,
      kode_kelas: kelas.kode_kelas,
      nama_rombel: kelas.nama_rombel,
      wali_kelas_id: kelas.wali_kelas_id || ''
    });
    setIsEditModalOpen(true);
  };

  async function handleEditClass(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('kelas')
        .update({
          tingkat: editFormData.tingkat,
          kode_kelas: editFormData.kode_kelas.toUpperCase(),
          nama_rombel: editFormData.nama_rombel,
          wali_kelas_id: editFormData.wali_kelas_id || null
        })
        .eq('id', editFormData.id);

      if (error) throw error;
      
      setIsEditModalOpen(false);
      fetchKelas();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==== Handle Hapus Kelas ====
  async function handleDeleteClass(id) {
    if (!window.confirm('Yakin ingin menghapus kelas ini? Data kelas akan terhapus secara permanen.')) return;
    try {
      const { error } = await supabase.from('kelas').delete().eq('id', id);
      if (error) throw error;
      fetchKelas();
    } catch (error) {
      alert('Gagal menghapus kelas: ' + error.message);
    }
  }

  // Grouping Data Kelas Berdasarkan Tingkat
  const groupedKelas = kelasData.reduce((acc, kelas) => {
    if (!acc[kelas.tingkat]) acc[kelas.tingkat] = [];
    acc[kelas.tingkat].push(kelas);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Kelas</h1>
          <p className="text-slate-500">Manajemen data kelas, rombongan belajar, dan penugasan wali kelas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Kelas Masal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse">Memuat data kelas...</div>
      ) : Object.keys(groupedKelas).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 shadow-sm">
          Belum ada data kelas. Silakan klik tombol "Tambah Kelas Masal" di atas.
        </div>
      ) : (
        // Looping untuk setiap Tingkat
        Object.keys(groupedKelas).map((tingkat, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                {tingkat}
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                {groupedKelas[tingkat].length} Rombel
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-slate-500 border-b border-slate-100 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Kode Kelas</th>
                    <th className="px-6 py-3 font-semibold">Jurusan / Rombel</th>
                    <th className="px-6 py-3 font-semibold">Wali Kelas</th>
                    <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedKelas[tingkat].map((kelas) => (
                    <tr key={kelas.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium text-slate-600">{kelas.kode_kelas}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{kelas.nama_rombel}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${kelas.guru ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="font-medium text-xs">{kelas.guru?.nama_lengkap || 'Belum Ditugaskan'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(kelas)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="Edit Kelas / Wali">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClass(kelas.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Modal Overlay Tambah Data Masal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-bold text-slate-900 text-lg">Input Kelas Masal</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddClass} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Pilih Tingkat */}
              <div className="space-y-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="text-sm font-bold text-blue-900">Tingkat / Angkatan</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Kelas 10, Fase E, atau Angkatan 2026"
                  value={formTingkat}
                  onChange={(e) => setFormTingkat(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none font-medium text-slate-700 transition-all"
                />
              </div>

              {/* Daftar Rombel */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Daftar Rombel / Jurusan</label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Total: {formRombel.length} Rombel</span>
                </div>
                
                {formRombel.map((row, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-start animate-in slide-in-from-left-2 duration-200 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-xs font-medium text-slate-500">Kode Kelas</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Cth: 10PPLG"
                        value={row.kode_kelas}
                        onChange={(e) => handleChangeRombel(index, 'kode_kelas', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono uppercase" 
                      />
                    </div>
                    <div className="flex-[1.5] w-full space-y-1">
                      <label className="text-xs font-medium text-slate-500">Nama Jurusan/Rombel</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Cth: 10 PPLG 1"
                        value={row.nama_rombel}
                        onChange={(e) => handleChangeRombel(index, 'nama_rombel', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      />
                    </div>
                    <div className="flex-[1.5] w-full space-y-1">
                      <label className="text-xs font-medium text-slate-500">Wali Kelas (Opsional)</label>
                      <select 
                        value={row.wali_kelas_id}
                        onChange={(e) => handleChangeRombel(index, 'wali_kelas_id', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
                      >
                        <option value="">-- Pilih Guru --</option>
                        {guruList.map(g => (
                          <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveRombelRow(index)}
                      disabled={formRombel.length === 1}
                      className="p-2.5 mt-5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                      title="Hapus baris"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={handleAddRombelRow}
                  className="mt-2 w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Baris Rombel
                </button>
              </div>
              
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 cursor-pointer">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex justify-center items-center">
                  {isSubmitting ? 'Menyimpan Masal...' : `Simpan ${formRombel.length} Rombel`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Overlay Edit Kelas & Penugasan Wali */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900 text-lg">Edit Kelas & Wali</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditClass} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tingkat / Angkatan</label>
                <input 
                  type="text" required
                  value={editFormData.tingkat}
                  onChange={(e) => setEditFormData({...editFormData, tingkat: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kode Kelas</label>
                <input 
                  type="text" required
                  value={editFormData.kode_kelas}
                  onChange={(e) => setEditFormData({...editFormData, kode_kelas: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase bg-slate-50" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Jurusan / Rombel</label>
                <input 
                  type="text" required
                  value={editFormData.nama_rombel}
                  onChange={(e) => setEditFormData({...editFormData, nama_rombel: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                />
              </div>
              <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-1">
                <label className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Penugasan Wali Kelas
                </label>
                <select 
                  value={editFormData.wali_kelas_id}
                  onChange={(e) => setEditFormData({...editFormData, wali_kelas_id: e.target.value})}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-indigo-50 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- Kosongkan (Belum Ditugaskan) --</option>
                  {guruList.map(g => (
                    <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
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
