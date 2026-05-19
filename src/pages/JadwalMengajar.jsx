import { Plus, Edit, Trash2, Search, CalendarDays, Clock, MapPin, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function JadwalMengajar() {
  const [jadwalData, setJadwalData] = useState([]);
  const [kelasData, setKelasData] = useState([]);
  const [mapelData, setMapelData] = useState([]);
  const [guruData, setGuruData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeHari, setActiveHari] = useState('Semua Hari');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    hari: 'Senin', jam_mulai: '', jam_selesai: '',
    kelas_id: '', mapel_id: '', guru_id: '', ruangan: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({ id: '', ...initialFormState });

  useEffect(() => {
    fetchSemuaData();
  }, []);

  async function fetchSemuaData() {
    setLoading(true);
    try {
      // 1. Fetch Master Data (Dropdowns)
      const [resKelas, resMapel, resGuru, resJadwal] = await Promise.all([
        supabase.from('kelas').select('id, tingkat, nama_rombel').order('tingkat'),
        supabase.from('mata_pelajaran').select('id, nama').order('nama'),
        supabase.from('guru').select('id, nama_lengkap').order('nama_lengkap'),
        supabase.from('jadwal_mengajar').select(`
          *,
          kelas (tingkat, nama_rombel),
          mata_pelajaran (nama),
          guru (nama_lengkap)
        `).order('jam_mulai', { ascending: true })
      ]);

      if (resKelas.data) setKelasData(resKelas.data);
      if (resMapel.data) setMapelData(resMapel.data);
      if (resGuru.data) setGuruData(resGuru.data);
      if (resJadwal.data) setJadwalData(resJadwal.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchJadwal() {
    const { data } = await supabase
      .from('jadwal_mengajar')
      .select(`*, kelas (tingkat, nama_rombel), mata_pelajaran (nama), guru (nama_lengkap)`)
      .order('jam_mulai', { ascending: true });
    if (data) setJadwalData(data);
  }

  async function handleAddJadwal(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        hari: formData.hari,
        jam_mulai: formData.jam_mulai,
        jam_selesai: formData.jam_selesai,
        kelas_id: formData.kelas_id || null,
        mapel_id: formData.mapel_id || null,
        guru_id: formData.guru_id || null,
        ruangan: formData.ruangan
      };

      const { error } = await supabase.from('jadwal_mengajar').insert([payload]);
      if (error) throw error;

      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchJadwal();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const openEditModal = (jadwal) => {
    setEditFormData({
      id: jadwal.id,
      hari: jadwal.hari,
      jam_mulai: jadwal.jam_mulai.substring(0, 5), // potong format waktu 00:00:00 jadi 00:00
      jam_selesai: jadwal.jam_selesai.substring(0, 5),
      kelas_id: jadwal.kelas_id || '',
      mapel_id: jadwal.mapel_id || '',
      guru_id: jadwal.guru_id || '',
      ruangan: jadwal.ruangan || ''
    });
    setIsEditModalOpen(true);
  };

  async function handleEditJadwal(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        hari: editFormData.hari,
        jam_mulai: editFormData.jam_mulai,
        jam_selesai: editFormData.jam_selesai,
        kelas_id: editFormData.kelas_id || null,
        mapel_id: editFormData.mapel_id || null,
        guru_id: editFormData.guru_id || null,
        ruangan: editFormData.ruangan
      };

      const { error } = await supabase.from('jadwal_mengajar').update(payload).eq('id', editFormData.id);
      if (error) throw error;

      setIsEditModalOpen(false);
      fetchJadwal();
    } catch (error) {
      alert('Gagal mengupdate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteJadwal(id) {
    if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', id);
      if (error) throw error;
      fetchJadwal();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  }

  // Filter Data
  const filteredJadwal = jadwalData.filter(j => {
    const matchHari = activeHari === 'Semua Hari' || j.hari === activeHari;
    const matchSearch = (j.mata_pelajaran?.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (j.guru?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (j.kelas?.nama_rombel || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchHari && matchSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jadwal Mengajar</h1>
          <p className="text-slate-500">Pengaturan jadwal pelajaran kelas dan penugasan guru.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
          <Plus className="w-5 h-5" />
          Tambah Jadwal
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['Semua Hari', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((hari) => (
            <button 
              key={hari}
              onClick={() => setActiveHari(hari)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeHari === hari 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {hari}
            </button>
          ))}
        </div>
        
        <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full md:w-64 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Cari kelas, guru, mapel..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full focus:ring-0"
          />
        </div>
      </div>

      {/* Tabel Data Jadwal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Hari & Jam</th>
                <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold">Guru Pengajar</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 animate-pulse">Memuat jadwal...</td></tr>
              ) : filteredJadwal.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Tidak ada jadwal ditemukan.</td></tr>
              ) : (
                filteredJadwal.map((jadwal) => (
                  <tr key={jadwal.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-blue-500" />
                          {jadwal.hari}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1.5 font-mono bg-slate-100 w-fit px-1.5 py-0.5 rounded">
                          <Clock className="w-3.5 h-3.5" />
                          {jadwal.jam_mulai.substring(0,5)} - {jadwal.jam_selesai.substring(0,5)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{jadwal.mata_pelajaran?.nama || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                        {jadwal.kelas ? `${jadwal.kelas.tingkat} - ${jadwal.kelas.nama_rombel}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-900 font-medium">{jadwal.guru?.nama_lengkap || '-'}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          {jadwal.ruangan || 'Belum diatur'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(jadwal)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteJadwal(jadwal.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
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
        const handleSubmit = isEdit ? handleEditJadwal : handleAddJadwal;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 className="font-bold text-slate-900 text-lg">{isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Mengajar'}</h2>
                <button onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Hari *</label>
                    <select required value={currentData.hari} onChange={(e) => setFunction({...currentData, hari: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white">
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                      <option value="Sabtu">Sabtu</option>
                      <option value="Minggu">Minggu</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="space-y-1.5 w-full">
                      <label className="text-sm font-medium text-slate-700">Mulai *</label>
                      <input type="time" required value={currentData.jam_mulai} onChange={(e) => setFunction({...currentData, jam_mulai: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer" />
                    </div>
                    <div className="space-y-1.5 w-full">
                      <label className="text-sm font-medium text-slate-700">Selesai *</label>
                      <input type="time" required value={currentData.jam_selesai} onChange={(e) => setFunction({...currentData, jam_selesai: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Kelas *</label>
                    <select required value={currentData.kelas_id} onChange={(e) => setFunction({...currentData, kelas_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white">
                      <option value="">-- Pilih Kelas --</option>
                      {kelasData.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_rombel}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Mata Pelajaran *</label>
                    <select required value={currentData.mapel_id} onChange={(e) => setFunction({...currentData, mapel_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white">
                      <option value="">-- Pilih Mata Pelajaran --</option>
                      {mapelData.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Guru Pengajar *</label>
                    <select required value={currentData.guru_id} onChange={(e) => setFunction({...currentData, guru_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer bg-white">
                      <option value="">-- Pilih Guru Pengajar --</option>
                      {guruData.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Ruangan (Opsional)</label>
                    <input type="text" value={currentData.ruangan} onChange={(e) => setFunction({...currentData, ruangan: e.target.value})} placeholder="Cth: Lab Komputer 1, R. 101" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium cursor-pointer">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 cursor-pointer">
                    {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Jadwal')}
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
