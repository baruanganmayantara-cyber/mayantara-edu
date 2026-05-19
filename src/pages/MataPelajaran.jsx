import { Plus, Edit, Trash2, Search, Book, X, Users, CheckSquare, Square } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MataPelajaran() {
  const [mapelData, setMapelData] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Untuk custom multi-select

  const initialFormState = { kode: '', nama: '', kelompok: 'A (Muatan Nasional)', kkm: 75, selectedGurus: [] };
  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({ id: '', ...initialFormState });

  useEffect(() => {
    fetchMapel();
    fetchGuruList();
  }, []);

  async function fetchGuruList() {
    const { data } = await supabase.from('guru').select('id, nama_lengkap').order('nama_lengkap');
    if (data) setGuruList(data);
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
      setMapelData(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleGuruSelection = (guruId, currentData, setFunction) => {
    const isSelected = currentData.selectedGurus.includes(guruId);
    if (isSelected) {
      setFunction({ ...currentData, selectedGurus: currentData.selectedGurus.filter(id => id !== guruId) });
    } else {
      setFunction({ ...currentData, selectedGurus: [...currentData.selectedGurus, guruId] });
    }
  };

  async function handleAddMapel(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // 1. Simpan ke mata_pelajaran
      const { data: newMapel, error: mapelError } = await supabase
        .from('mata_pelajaran')
        .insert([{ 
          kode: formData.kode, 
          nama: formData.nama, 
          kelompok: formData.kelompok, 
          kkm: formData.kkm 
        }])
        .select()
        .single();
        
      if (mapelError) throw mapelError;

      // 2. Simpan relasi ke mapel_guru jika ada guru yang dipilih
      if (formData.selectedGurus.length > 0) {
        const relations = formData.selectedGurus.map(guruId => ({
          mapel_id: newMapel.id,
          guru_id: guruId
        }));
        const { error: relError } = await supabase.from('mapel_guru').insert(relations);
        if (relError) throw relError;
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchMapel();
    } catch (error) {
      alert('Gagal menyimpan: Cek koneksi atau pastikan tabel database sudah terbuat sesuai rencana. Detail: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openEditModal = (mapel) => {
    // Kumpulkan ID guru dari data mapel_guru
    const existingGuruIds = mapel.mapel_guru?.map(mg => mg.guru?.id).filter(Boolean) || [];
    
    setEditFormData({
      id: mapel.id,
      kode: mapel.kode || '',
      nama: mapel.nama || '',
      kelompok: mapel.kelompok || 'A (Muatan Nasional)',
      kkm: mapel.kkm || 75,
      selectedGurus: existingGuruIds
    });
    setIsEditModalOpen(true);
  };

  async function handleEditMapel(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // 1. Update data utama
      const { error: mapelError } = await supabase
        .from('mata_pelajaran')
        .update({ 
          kode: editFormData.kode, 
          nama: editFormData.nama, 
          kelompok: editFormData.kelompok, 
          kkm: editFormData.kkm 
        })
        .eq('id', editFormData.id);
        
      if (mapelError) throw mapelError;

      // 2. Hapus semua relasi guru lama
      await supabase.from('mapel_guru').delete().eq('mapel_id', editFormData.id);

      // 3. Masukkan relasi guru baru (jika ada)
      if (editFormData.selectedGurus.length > 0) {
        const relations = editFormData.selectedGurus.map(guruId => ({
          mapel_id: editFormData.id,
          guru_id: guruId
        }));
        const { error: relError } = await supabase.from('mapel_guru').insert(relations);
        if (relError) throw relError;
      }

      setIsEditModalOpen(false);
      fetchMapel();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMapel(id) {
    if (!window.confirm('Yakin ingin menghapus mapel ini?')) return;
    try {
      const { error } = await supabase.from('mata_pelajaran').delete().eq('id', id);
      if (error) throw error;
      fetchMapel();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  }

  // Helper untuk menampilkan nama-nama guru
  const renderGuruNames = (mapel_guru) => {
    if (!mapel_guru || mapel_guru.length === 0) {
      return <span className="text-slate-400 italic text-xs">Belum ada guru</span>;
    }
    const names = mapel_guru.map(mg => mg.guru?.nama_lengkap).filter(Boolean);
    return (
      <div className="flex flex-col gap-0.5">
        {names.slice(0, 2).map((name, i) => (
          <span key={i} className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" /> {name}
          </span>
        ))}
        {names.length > 2 && (
          <span className="text-xs text-blue-600 font-medium">+{names.length - 2} Guru lainnya</span>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mata Pelajaran</h1>
          <p className="text-slate-500">Manajemen data mata pelajaran dan penugasan guru pengampu.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
          <Plus className="w-5 h-5" />
          Tambah Mapel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full max-w-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input type="text" placeholder="Cari kode atau nama mapel..." className="bg-transparent border-none outline-none text-sm w-full focus:ring-0" />
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
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 animate-pulse">Memuat data...</td></tr>
              ) : mapelData.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Belum ada data mata pelajaran.</td></tr>
              ) : (
                mapelData.map((mapel) => (
                  <tr key={mapel.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-500">{mapel.kode || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <Book className="w-4 h-4" />
                        </div>
                        {mapel.nama}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderGuruNames(mapel.mapel_guru)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {mapel.kelompok}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">{mapel.kkm}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(mapel)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteMapel(mapel.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
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

      {/* Modal Reusable for Tambah/Edit */}
      {(isModalOpen || isEditModalOpen) && (() => {
        const isEdit = isEditModalOpen;
        const currentData = isEdit ? editFormData : formData;
        const setFunction = isEdit ? setEditFormData : setFormData;
        const handleSubmit = isEdit ? handleEditMapel : handleAddMapel;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-lg">{isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h2>
                <button onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Kode Mapel</label>
                    <input type="text" value={currentData.kode} onChange={(e) => setFunction({...currentData, kode: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase" placeholder="Cth: MAT-X" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Mata Pelajaran *</label>
                    <input type="text" required value={currentData.nama} onChange={(e) => setFunction({...currentData, nama: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Cth: Matematika Wajib" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Kelompok</label>
                    <select value={currentData.kelompok} onChange={(e) => setFunction({...currentData, kelompok: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer">
                      <option value="A (Muatan Nasional)">A (Muatan Nasional)</option>
                      <option value="B (Muatan Kewilayahan)">B (Muatan Kewilayahan)</option>
                      <option value="C (Peminatan Akademik)">C (Peminatan Akademik)</option>
                      <option value="Lainnya / Ekstrakurikuler">Lainnya / Ekstrakurikuler</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">KKM *</label>
                    <input type="number" required min="0" max="100" value={currentData.kkm} onChange={(e) => setFunction({...currentData, kkm: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>

                {/* Section Pilihan Multi-Guru Dropdown */}
                <div className="space-y-1.5 md:col-span-2 relative mt-2 border-t border-slate-100 pt-4">
                  <label className="text-sm font-bold text-slate-800 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Guru Pengampu (Bisa Pilih Lebih dari 1)
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {currentData.selectedGurus.length} Terpilih
                    </span>
                  </label>
                  
                  {/* Fake Input Box that acts as Dropdown Trigger */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full min-h-[42px] px-3 py-2 border rounded-lg bg-white cursor-pointer flex flex-wrap gap-2 items-center transition-all ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-blue-400'}`}
                  >
                    {currentData.selectedGurus.length === 0 ? (
                      <span className="text-sm text-slate-400">Klik di sini untuk memilih guru...</span>
                    ) : (
                      currentData.selectedGurus.map(id => {
                        const guru = guruList.find(g => g.id === id);
                        return guru ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 shadow-sm animate-in zoom-in duration-200">
                            {guru.nama_lengkap}
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); toggleGuruSelection(id, currentData, setFunction); }} 
                              className="hover:bg-blue-200 rounded-full p-0.5 ml-1 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })
                    )}
                  </div>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close dropdown when clicking outside */}
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                      
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {guruList.length === 0 ? (
                          <div className="p-4 text-sm text-slate-500 text-center italic">Belum ada data guru. Silakan tambahkan guru terlebih dahulu.</div>
                        ) : (
                          <div className="p-1">
                            {guruList.map(guru => {
                              const isSelected = currentData.selectedGurus.includes(guru.id);
                              return (
                                <div 
                                  key={guru.id}
                                  onClick={() => toggleGuruSelection(guru.id, currentData, setFunction)}
                                  className={`px-3 py-2.5 text-sm cursor-pointer rounded-md flex items-center justify-between transition-colors
                                    ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  {guru.nama_lengkap}
                                  {isSelected && <CheckSquare className="w-4 h-4 text-blue-600" />}
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
                  <button type="button" onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium cursor-pointer">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 cursor-pointer">
                    {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Mata Pelajaran')}
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
