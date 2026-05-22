import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, UserCheck, Edit, Trash2, X } from 'lucide-react';

export default function Kelas() {
  const [kelas, setKelas] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tingkat, setTingkat] = useState('');
  const [rombelRows, setRombelRows] = useState([{ kode_kelas: '', nama_rombel: '', wali_kelas_id: '' }]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', tingkat: '', kode_kelas: '', nama_rombel: '', wali_kelas_id: '' });

  useEffect(() => {
    fetchKelas();
    fetchGurus();
  }, []);

  async function fetchGurus() {
    try {
      const { data, error } = await supabase
        .from('guru')
        .select('id, nama_lengkap')
        .order('nama_lengkap', { ascending: true });
      if (error) throw error;
      if (data) setGurus(data);
    } catch (error) {
      console.error('Error fetching gurus:', error.message);
    }
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
      setKelas(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const addRow = () => {
    setRombelRows([...rombelRows, { kode_kelas: '', nama_rombel: '', wali_kelas_id: '' }]);
  };

  const removeRow = (index) => {
    const newRows = [...rombelRows];
    newRows.splice(index, 1);
    setRombelRows(newRows);
  };

  const updateRow = (index, key, value) => {
    const newRows = [...rombelRows];
    newRows[index][key] = value;
    setRombelRows(newRows);
  };

  async function handleMassSubmit(e) {
    e.preventDefault();
    const validRows = rombelRows.filter(row => row.kode_kelas.trim() !== '' && row.nama_rombel.trim() !== '');
    if (validRows.length === 0) {
      return alert('Minimal isi 1 rombel dengan lengkap!');
    }

    try {
      setIsSubmitting(true);
      const dataToInsert = validRows.map(row => ({
        tingkat: tingkat,
        kode_kelas: row.kode_kelas.toUpperCase(),
        nama_rombel: row.nama_rombel,
        wali_kelas_id: row.wali_kelas_id || null
      }));

      const { error } = await supabase.from('kelas').insert(dataToInsert);
      if (error) throw error;

      setIsAddModalOpen(false);
      setTingkat('');
      setRombelRows([{ kode_kelas: '', nama_rombel: '', wali_kelas_id: '' }]);
      fetchKelas();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openEditModal = (item) => {
    setEditForm({
      id: item.id,
      tingkat: item.tingkat,
      kode_kelas: item.kode_kelas,
      nama_rombel: item.nama_rombel,
      wali_kelas_id: item.wali_kelas_id || ''
    });
    setIsEditModalOpen(true);
  };

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('kelas')
        .update({
          tingkat: editForm.tingkat,
          kode_kelas: editForm.kode_kelas.toUpperCase(),
          nama_rombel: editForm.nama_rombel,
          wali_kelas_id: editForm.wali_kelas_id || null
        })
        .eq('id', editForm.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchKelas();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Yakin ingin menghapus kelas ini? Data kelas akan terhapus secara permanen.')) {
      try {
        const { error } = await supabase.from('kelas').delete().eq('id', id);
        if (error) throw error;
        fetchKelas();
      } catch (error) {
        alert('Gagal menghapus kelas: ' + error.message);
      }
    }
  }

  const groupedKelas = kelas.reduce((acc, item) => {
    if (!acc[item.tingkat]) {
      acc[item.tingkat] = [];
    }
    acc[item.tingkat].push(item);
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
          onClick={() => setIsAddModalOpen(true)}
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
        Object.keys(groupedKelas).map((tingkatKey, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                {tingkatKey}
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                {groupedKelas[tingkatKey].length} Rombel
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
                  {groupedKelas[tingkatKey].map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium text-slate-600">{item.kode_kelas}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{item.nama_rombel}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${item.guru ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="font-medium text-xs">
                            {item.guru?.nama_lengkap || 'Belum Ditugaskan'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit Kelas / Wali"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Hapus"
                          >
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

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-bold text-slate-900 text-lg">Input Kelas Masal</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleMassSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="text-sm font-bold text-blue-900">Tingkat / Angkatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 10, Fase E, atau Angkatan 2026"
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none font-medium text-slate-700 transition-all"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Daftar Rombel / Jurusan</label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Total: {rombelRows.length} Rombel
                  </span>
                </div>

                {rombelRows.map((row, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 items-start animate-in slide-in-from-left-2 duration-200 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-xs font-medium text-slate-500">Kode Kelas</label>
                      <input
                        type="text"
                        required
                        placeholder="Cth: 10PPLG"
                        value={row.kode_kelas}
                        onChange={(e) => updateRow(idx, 'kode_kelas', e.target.value)}
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
                        onChange={(e) => updateRow(idx, 'nama_rombel', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>

                    <div className="flex-[1.5] w-full space-y-1">
                      <label className="text-xs font-medium text-slate-500">Wali Kelas (Opsional)</label>
                      <select
                        value={row.wali_kelas_id}
                        onChange={(e) => updateRow(idx, 'wali_kelas_id', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
                      >
                        <option value="">-- Pilih Guru --</option>
                        {gurus.map((g) => (
                          <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={rombelRows.length === 1}
                      className="p-2.5 mt-5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addRow}
                  className="mt-2 w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Baris Rombel
                </button>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer flex justify-center items-center"
                >
                  {isSubmitting ? 'Menyimpan Masal...' : `Simpan ${rombelRows.length} Rombel`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900 text-lg">Edit Kelas & Wali</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tingkat / Angkatan</label>
                <input
                  type="text"
                  required
                  value={editForm.tingkat}
                  onChange={(e) => setEditForm({ ...editForm, tingkat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kode Kelas</label>
                <input
                  type="text"
                  required
                  value={editForm.kode_kelas}
                  onChange={(e) => setEditForm({ ...editForm, kode_kelas: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Jurusan / Rombel</label>
                <input
                  type="text"
                  required
                  value={editForm.nama_rombel}
                  onChange={(e) => setEditForm({ ...editForm, nama_rombel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-1">
                <label className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Penugasan Wali Kelas
                </label>
                <select
                  value={editForm.wali_kelas_id}
                  onChange={(e) => setEditForm({ ...editForm, wali_kelas_id: e.target.value })}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-indigo-50 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- Kosongkan (Belum Ditugaskan) --</option>
                  {gurus.map((g) => (
                    <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
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
