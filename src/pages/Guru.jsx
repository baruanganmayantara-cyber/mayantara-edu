import { Plus, Edit, Trash2, Search, Filter, Phone, Mail, X, Upload, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Guru() {
  const [guruData, setGuruData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Tambah State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nip: '', nama_lengkap: '', jenis_kelamin: 'L', tempat_lahir: '',
    tanggal_lahir: '', alamat: '', no_hp: '', email: '', status: 'GTY', foto_base64: ''
  });

  // Modal Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '', nip: '', nama_lengkap: '', jenis_kelamin: 'L', tempat_lahir: '',
    tanggal_lahir: '', alamat: '', no_hp: '', email: '', status: 'GTY', foto_base64: '', foto_url_lama: ''
  });

  useEffect(() => {
    fetchGuru();
  }, []);

  async function fetchGuru() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('guru').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGuruData(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Hapus Guru
  async function handleDeleteGuru(id) {
    if (!window.confirm('Yakin ingin menghapus guru ini? Semua data terkait (seperti penugasan wali kelas) bisa terpengaruh.')) return;
    try {
      const { error } = await supabase.from('guru').delete().eq('id', id);
      if (error) throw error;
      fetchGuru();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  }

  // Handle Tambah Guru
  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('Ukuran file maksimal 2MB!');
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

  async function handleAddGuru(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let finalFotoUrl = formData.foto_base64;
      if (!finalFotoUrl) {
        finalFotoUrl = formData.jenis_kelamin === 'L' 
          ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(formData.nama_lengkap)}` 
          : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(formData.nama_lengkap)}`;
      }

      const { error } = await supabase.from('guru').insert([{
        nip: formData.nip || null, nama_lengkap: formData.nama_lengkap, jenis_kelamin: formData.jenis_kelamin,
        tempat_lahir: formData.tempat_lahir, tanggal_lahir: formData.tanggal_lahir || null, alamat: formData.alamat,
        no_hp: formData.no_hp, email: formData.email, status: formData.status, foto_url: finalFotoUrl
      }]);

      if (error) throw error;
      setIsModalOpen(false);
      setFormData({ nip: '', nama_lengkap: '', jenis_kelamin: 'L', tempat_lahir: '', tanggal_lahir: '', alamat: '', no_hp: '', email: '', status: 'GTY', foto_base64: '' });
      fetchGuru();
    } catch (error) {
      alert('Gagal menyimpan guru: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Edit Guru
  const openEditModal = (guru) => {
    setEditFormData({
      id: guru.id, nip: guru.nip || '', nama_lengkap: guru.nama_lengkap || '', 
      jenis_kelamin: guru.jenis_kelamin || 'L', tempat_lahir: guru.tempat_lahir || '', 
      tanggal_lahir: guru.tanggal_lahir || '', alamat: guru.alamat || '', 
      no_hp: guru.no_hp || '', email: guru.email || '', status: guru.status || 'GTY',
      foto_base64: '', foto_url_lama: guru.foto_url || ''
    });
    setIsEditModalOpen(true);
  };

  async function handleEditGuru(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let finalFotoUrl = editFormData.foto_base64 || editFormData.foto_url_lama;

      const { error } = await supabase.from('guru').update({
        nip: editFormData.nip || null, nama_lengkap: editFormData.nama_lengkap, jenis_kelamin: editFormData.jenis_kelamin,
        tempat_lahir: editFormData.tempat_lahir, tanggal_lahir: editFormData.tanggal_lahir || null, alamat: editFormData.alamat,
        no_hp: editFormData.no_hp, email: editFormData.email, status: editFormData.status, foto_url: finalFotoUrl
      }).eq('id', editFormData.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchGuru();
    } catch (error) {
      alert('Gagal mengupdate guru: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Guru & Staf</h1>
          <p className="text-slate-500">Manajemen informasi profil dan kontak tenaga pendidik.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
          <Plus className="w-5 h-5" />
          Tambah Guru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full max-w-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input type="text" placeholder="Cari berdasarkan NIP atau Nama..." className="bg-transparent border-none outline-none text-sm w-full focus:ring-0" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr>
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
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 animate-pulse">Memuat data guru...</td></tr>
              ) : guruData.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Belum ada data guru. Silakan tambahkan.</td></tr>
              ) : (
                guruData.map((guru) => (
                  <tr key={guru.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={guru.foto_url || (guru.jenis_kelamin === 'L' ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(guru.nama_lengkap)}` : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(guru.nama_lengkap)}`)} 
                          alt={guru.nama_lengkap} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100 flex-shrink-0" 
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{guru.nama_lengkap}</span>
                          <span className="font-mono text-xs text-slate-500">NIP: {guru.nip || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{guru.jenis_kelamin}</td>
                    <td className="px-6 py-4">{guru.tempat_lahir || '-'}, <br/><span className="text-xs text-slate-500">{guru.tanggal_lahir || '-'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {guru.no_hp || '-'}</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {guru.email || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${guru.status === 'PNS' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          guru.status === 'GTY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'}`}>{guru.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(guru)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteGuru(guru.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
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

      {/* Modal Tambah Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-bold text-slate-900 text-lg">Tambah Data Guru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddGuru} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0 relative group">
                  <img 
                    src={formData.foto_base64 || (formData.jenis_kelamin === 'L' ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(formData.nama_lengkap || 'Guru')}` : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(formData.nama_lengkap || 'Guru')}`)} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Foto Profil Guru</h3>
                  <p className="text-xs text-slate-500">Opsional. Maksimal 2MB. Jika tidak diunggah, otomatis menggunakan ilustrasi Avatar {formData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} di samping.</p>
                  <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Pilih Foto
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                  </label>
                  {formData.foto_base64 && <button type="button" onClick={() => setFormData({...formData, foto_base64: ''})} className="ml-2 text-xs text-red-500 hover:underline">Hapus</button>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Lengkap & Gelar *</label>
                  <input type="text" required value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">NIP (Opsional)</label>
                  <input type="text" value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
                  <select value={formData.jenis_kelamin} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer">
                    <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Status Kepegawaian</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm cursor-pointer">
                    <option value="PNS">PNS</option><option value="GTY">GTY</option><option value="Honorer">Honorer</option>
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Tempat Lahir</label><input type="text" value={formData.tempat_lahir} onChange={(e) => setFormData({...formData, tempat_lahir: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Tanggal Lahir</label><input type="date" value={formData.tanggal_lahir} onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Nomor HP</label><input type="text" value={formData.no_hp} onChange={(e) => setFormData({...formData, no_hp: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Alamat Lengkap</label><textarea rows="2" value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"></textarea></div>
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : 'Simpan Data Guru'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Guru */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-bold text-slate-900 text-lg">Edit Data Guru</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleEditGuru} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <img 
                    src={editFormData.foto_base64 || editFormData.foto_url_lama || (editFormData.jenis_kelamin === 'L' ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(editFormData.nama_lengkap || 'Guru')}` : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(editFormData.nama_lengkap || 'Guru')}`)} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Ubah Foto Profil</h3>
                  <p className="text-xs text-slate-500">Avatar otomatis menyesuaikan nama dan jenis kelamin jika tidak mengunggah foto.</p>
                  <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Pilih Foto Baru
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Nama Lengkap & Gelar *</label><input type="text" required value={editFormData.nama_lengkap} onChange={(e) => setEditFormData({...editFormData, nama_lengkap: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">NIP</label><input type="text" value={editFormData.nip} onChange={(e) => setEditFormData({...editFormData, nip: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Jenis Kelamin</label><select value={editFormData.jenis_kelamin} onChange={(e) => setEditFormData({...editFormData, jenis_kelamin: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Status Kepegawaian</label><select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="PNS">PNS</option><option value="GTY">GTY</option><option value="Honorer">Honorer</option></select></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Tempat Lahir</label><input type="text" value={editFormData.tempat_lahir} onChange={(e) => setEditFormData({...editFormData, tempat_lahir: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Tanggal Lahir</label><input type="date" value={editFormData.tanggal_lahir} onChange={(e) => setEditFormData({...editFormData, tanggal_lahir: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Nomor HP</label><input type="text" value={editFormData.no_hp} onChange={(e) => setEditFormData({...editFormData, no_hp: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Email</label><input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Alamat Lengkap</label><textarea rows="2" value={editFormData.alamat} onChange={(e) => setEditFormData({...editFormData, alamat: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"></textarea></div>
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
