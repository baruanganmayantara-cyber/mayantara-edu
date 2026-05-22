import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Megaphone, Calendar, Edit, Trash2, X } from 'lucide-react';

export default function Pengumuman() {
  const [pengumumanList, setPengumumanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const initialFormState = {
    judul: '',
    isi: '',
    tanggal: today,
    target: 'Semua',
    status: 'Aktif'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({ id: '', ...initialFormState });

  useEffect(() => {
    fetchPengumuman();
  }, []);

  async function fetchPengumuman() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pengumuman')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPengumumanList(data || []);
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
      const { error } = await supabase.from('pengumuman').insert([
        {
          judul: formData.judul,
          isi: formData.isi,
          tanggal: formData.tanggal,
          target: formData.target,
          status: formData.status
        }
      ]);
      if (error) throw error;

      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchPengumuman();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openEditModal = (item) => {
    setEditFormData({
      id: item.id,
      judul: item.judul || '',
      isi: item.isi || '',
      tanggal: item.tanggal || today,
      target: item.target || 'Semua',
      status: item.status || 'Aktif'
    });
    setIsEditModalOpen(true);
  };

  async function handleEdit(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('pengumuman')
        .update({
          judul: editFormData.judul,
          isi: editFormData.isi,
          tanggal: editFormData.tanggal,
          target: editFormData.target,
          status: editFormData.status
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      fetchPengumuman();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Yakin ingin menghapus pengumuman ini?')) {
      try {
        const { error } = await supabase.from('pengumuman').delete().eq('id', id);
        if (error) throw error;
        fetchPengumuman();
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  }

  const formatTanggal = (tgl) => {
    return tgl
      ? new Date(tgl).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : '-';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengumuman</h1>
          <p className="text-slate-500">Pusat informasi dan broadcast pesan ke warga sekolah.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Buat Pengumuman
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse">Memuat pengumuman...</div>
      ) : pengumumanList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <Megaphone className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">Belum Ada Pengumuman</h3>
          <p className="text-slate-500 max-w-sm mt-1">
            Buat pengumuman baru untuk memberikan informasi kepada siswa atau guru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pengumumanList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Megaphone className="w-6 h-6" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    item.status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{item.judul}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                {item.isi || <span className="italic text-slate-400">Tidak ada rincian.</span>}
              </p>
              <div className="mt-auto space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center text-sm text-slate-500 gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatTanggal(item.tanggal)}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500 gap-2">
                  <span className="font-medium text-slate-700">Target:</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                    {item.target}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isAddModalOpen || isEditModalOpen) && (() => {
        const isEdit = isEditModalOpen;
        const currentData = isEdit ? editFormData : formData;
        const setData = isEdit ? setEditFormData : setFormData;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-lg">
                  {isEdit ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h2>
                <button
                  onClick={() => (isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false))}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={isEdit ? handleEdit : handleAdd}
                className="p-6 space-y-4 overflow-y-auto flex-1"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Judul Pengumuman *</label>
                  <input
                    type="text"
                    required
                    value={currentData.judul}
                    onChange={(e) => setData({ ...currentData, judul: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Cth: Rapat Orang Tua, Pengumuman Libur"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Isi / Rincian Pengumuman</label>
                  <textarea
                    rows="4"
                    value={currentData.isi}
                    onChange={(e) => setData({ ...currentData, isi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                    placeholder="Tuliskan detail pengumuman di sini..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Tanggal *</label>
                    <input
                      type="date"
                      required
                      value={currentData.tanggal}
                      onChange={(e) => setData({ ...currentData, tanggal: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Target *</label>
                    <select
                      required
                      value={currentData.target}
                      onChange={(e) => setData({ ...currentData, target: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                    >
                      <option value="Semua">Semua (Guru & Siswa)</option>
                      <option value="Siswa">Siswa Saja</option>
                      <option value="Guru">Guru Saja</option>
                      <option value="Orang Tua">Orang Tua/Wali</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Status *</label>
                    <select
                      required
                      value={currentData.status}
                      onChange={(e) => setData({ ...currentData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Selesai">Selesai / Diarsipkan</option>
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => (isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false))}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Sebarkan Pengumuman'}
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