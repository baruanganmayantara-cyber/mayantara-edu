import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, BookOpen, Edit, Trash2, User, X, Check } from 'lucide-react';

export default function MataPelajaran() {
  const [mapelList, setMapelList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const initialFormState = {
    kode: '',
    nama: '',
    kelompok: 'A (Muatan Nasional)',
    kkm: 75,
    selectedGurus: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({ id: '', ...initialFormState });

  useEffect(() => {
    fetchMapel();
    fetchGurus();
  }, []);

  async function fetchGurus() {
    try {
      const { data, error } = await supabase
        .from('guru')
        .select('id, nama_lengkap')
        .order('nama_lengkap');
      if (error) throw error;
      if (data) setGuruList(data);
    } catch (error) {
      console.error('Error fetching gurus:', error.message);
    }
  }

  async function fetchMapel() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mata_pelajaran')
        .select(`
          *,
          mapel_guru (
            guru (
              id,
              nama_lengkap
            )
          )
        `)
        .order('kelompok', { ascending: true })
        .order('nama', { ascending: true });

      if (error) throw error;
      setMapelList(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleGuruSelection = (guruId, currentForm, setForm) => {
    if (currentForm.selectedGurus.includes(guruId)) {
      setForm({
        ...currentForm,
        selectedGurus: currentForm.selectedGurus.filter(id => id !== guruId)
      });
    } else {
      setForm({
        ...currentForm,
        selectedGurus: [...currentForm.selectedGurus, guruId]
      });
    }
  };

  async function handleAdd(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data: newMapel, error: mapelErr } = await supabase
        .from('mata_pelajaran')
        .insert([{
          kode: formData.kode,
          nama: formData.nama,
          kelompok: formData.kelompok,
          kkm: formData.kkm
        }])
        .select()
        .single();

      if (mapelErr) throw mapelErr;

      if (formData.selectedGurus.length > 0) {
        const mapelGurus = formData.selectedGurus.map(guruId => ({
          mapel_id: newMapel.id,
          guru_id: guruId
        }));
        const { error: relationErr } = await supabase
          .from('mapel_guru')
          .insert(mapelGurus);
        if (relationErr) throw relationErr;
      }

      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchMapel();
    } catch (error) {
      alert('Gagal menyimpan: Cek koneksi atau pastikan tabel database sudah terbuat sesuai rencana. Detail: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openEditModal = (item) => {
    const selectedGurus = item.mapel_guru?.map(mg => mg.guru?.id).filter(Boolean) || [];
    setEditFormData({
      id: item.id,
      kode: item.kode || '',
      nama: item.nama || '',
      kelompok: item.kelompok || 'A (Muatan Nasional)',
      kkm: item.kkm || 75,
      selectedGurus: selectedGurus
    });
    setIsEditModalOpen(true);
  };

  async function handleEdit(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { error: mapelErr } = await supabase
        .from('mata_pelajaran')
        .update({
          kode: editFormData.kode,
          nama: editFormData.nama,
          kelompok: editFormData.kelompok,
          kkm: editFormData.kkm
        })
        .eq('id', editFormData.id);

      if (mapelErr) throw mapelErr;

      // Delete existing relations
      await supabase.from('mapel_guru').delete().eq('mapel_id', editFormData.id);

      if (editFormData.selectedGurus.length > 0) {
        const mapelGurus = editFormData.selectedGurus.map(guruId => ({
          mapel_id: editFormData.id,
          guru_id: guruId
        }));
        const { error: relationErr } = await supabase
          .from('mapel_guru')
          .insert(mapelGurus);
        if (relationErr) throw relationErr;
      }

      setIsEditModalOpen(false);
      fetchMapel();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Yakin ingin menghapus mapel ini?')) {
      try {
        const { error } = await supabase.from('mata_pelajaran').delete().eq('id', id);
        if (error) throw error;
        fetchMapel();
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  }

  const renderGurus = (mapelGuru) => {
    if (!mapelGuru || mapelGuru.length === 0) {
      return <span className="text-slate-400 italic text-xs">Belum ada guru</span>;
    }
    const names = mapelGuru.map(mg => mg.guru?.nama_lengkap).filter(Boolean);
    return (
      <div className="flex flex-col gap-0.5">
        {names.slice(0, 2).map((name, index) => (
          <span key={index} className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> {name}
          </span>
        ))}
        {names.length > 2 && (
          <span className="text-xs text-blue-600 font-medium">+{names.length - 2} Guru lainnya</span>
        )}
      </div>
    );
  };

  const filteredMapel = mapelList.filter(mapel => 
    (mapel.kode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (mapel.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mata Pelajaran</h1>
          <p className="text-slate-500">Manajemen data mata pelajaran dan penugasan guru pengampu.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Mapel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full max-w-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Cari kode atau nama mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full focus:ring-0"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Kode</th>
                <th className="px-6 py-4 font-semibold">Nama Mata Pelajaran</th>
                <th className="px-6 py-4 font-semibold">Guru Pengampu</th>
                <th className="px-6 py-4 font-semibold">Kelompok</th>
                <th className="px-6 py-4 font-semibold">KKM</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 animate-pulse">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredMapel.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    Belum ada data mata pelajaran.
                  </td>
                </tr>
              ) : (
                filteredMapel.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-500">{item.kode || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        {item.nama}
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderGurus(item.mapel_guru)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.kelompok}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">{item.kkm}</td>
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

      {(isAddModalOpen || isEditModalOpen) && (() => {
        const isEdit = isEditModalOpen;
        const currentData = isEdit ? editFormData : formData;
        const setForm = isEdit ? setEditFormData : setFormData;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-lg font-bold">
                  {isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                </h2>
                <button
                  onClick={() => (isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false))}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={isEdit ? handleEdit : handleAdd} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Kode Mapel</label>
                    <input
                      type="text"
                      value={currentData.kode}
                      onChange={(e) => setForm({ ...currentData, kode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                      placeholder="Cth: MAT-X"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Mata Pelajaran *</label>
                    <input
                      type="text"
                      required
                      value={currentData.nama}
                      onChange={(e) => setForm({ ...currentData, nama: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Cth: Matematika Wajib"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Kelompok</label>
                    <select
                      value={currentData.kelompok}
                      onChange={(e) => setForm({ ...currentData, kelompok: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer"
                    >
                      <option value="A (Muatan Nasional)">A (Muatan Nasional)</option>
                      <option value="B (Muatan Kewilayahan)">B (Muatan Kewilayahan)</option>
                      <option value="C (Peminatan Akademik)">C (Peminatan Akademik)</option>
                      <option value="Lainnya / Ekstrakurikuler">Lainnya / Ekstrakurikuler</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">KKM *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={currentData.kkm}
                      onChange={(e) => setForm({ ...currentData, kkm: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2 relative mt-2 border-t border-slate-100 pt-4">
                  <label className="text-sm font-bold text-slate-800 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Guru Pengampu (Bisa Pilih Lebih dari 1)
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {currentData.selectedGurus.length} Terpilih
                    </span>
                  </label>

                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full min-h-[42px] px-3 py-2 border rounded-lg bg-white cursor-pointer flex flex-wrap gap-2 items-center transition-all ${
                      isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {currentData.selectedGurus.length === 0 ? (
                      <span className="text-sm text-slate-400">Klik di sini untuk memilih guru...</span>
                    ) : (
                      currentData.selectedGurus.map((guruId) => {
                        const guruObj = guruList.find((g) => g.id === guruId);
                        return guruObj ? (
                          <span
                            key={guruId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 shadow-sm animate-in zoom-in duration-200"
                          >
                            {guruObj.nama_lengkap}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGuruSelection(guruId, currentData, setForm);
                              }}
                              className="hover:bg-blue-200 rounded-full p-0.5 ml-1 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })
                    )}
                  </div>

                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {guruList.length === 0 ? (
                          <div className="p-4 text-sm text-slate-500 text-center italic">
                            Belum ada data guru. Silakan tambahkan guru terlebih dahulu.
                          </div>
                        ) : (
                          <div className="p-1">
                            {guruList.map((g) => {
                              const isChecked = currentData.selectedGurus.includes(g.id);
                              return (
                                <div
                                  key={g.id}
                                  onClick={() => toggleGuruSelection(g.id, currentData, setForm)}
                                  className={`px-3 py-2.5 text-sm cursor-pointer rounded-md flex items-center justify-between transition-colors ${
                                    isChecked ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {g.nama_lengkap}
                                  {isChecked && <Check className="w-4 h-4 text-blue-600" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-100">
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
                    {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Mata Pelajaran'}
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