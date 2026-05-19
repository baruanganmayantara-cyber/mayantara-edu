import { Save, UploadCloud, Building2, Image as ImageIcon, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Pengaturan() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const logoInputRef = useRef(null);
  const kopInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: 1,
    nama_sekolah: '',
    npsn: '',
    nama_kepala_sekolah: '',
    tahun_ajaran: '',
    alamat: '',
    logo_url: null,
    kop_surat_url: null
  });

  useEffect(() => {
    fetchPengaturan();
  }, []);

  async function fetchPengaturan() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pengaturan')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching pengaturan:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Ukuran file maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }));
  };

  async function handleSave(e) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('pengaturan')
        .upsert([{
          id: 1, // Memastikan selalu update row id 1
          nama_sekolah: formData.nama_sekolah,
          npsn: formData.npsn,
          nama_kepala_sekolah: formData.nama_kepala_sekolah,
          tahun_ajaran: formData.tahun_ajaran,
          alamat: formData.alamat,
          logo_url: formData.logo_url,
          kop_surat_url: formData.kop_surat_url
        }]);

      if (error) throw error;
      
      alert('Pengaturan berhasil disimpan!');
    } catch (error) {
      alert('Gagal menyimpan pengaturan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-slate-500 animate-pulse">Memuat pengaturan sistem...</div>;
  }

  return (
    <form onSubmit={handleSave} className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
          <p className="text-slate-500">Konfigurasi identitas sekolah dan parameter sistem.</p>
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Identitas Sekolah */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Identitas Pokok Sekolah
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Sekolah</label>
                  <input type="text" required value={formData.nama_sekolah} onChange={e => setFormData({...formData, nama_sekolah: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">NPSN</label>
                  <input type="text" value={formData.npsn} onChange={e => setFormData({...formData, npsn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nama Kepala Sekolah</label>
                  <input type="text" required value={formData.nama_kepala_sekolah} onChange={e => setFormData({...formData, nama_kepala_sekolah: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tahun Ajaran Aktif</label>
                  <input type="text" required value={formData.tahun_ajaran} onChange={e => setFormData({...formData, tahun_ajaran: e.target.value})} placeholder="Contoh: 2025/2026 Ganjil" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
                <textarea rows="3" required value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Media & Upload */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Media Sekolah
            </h2>
            
            <div className="space-y-6">
              {/* Upload Logo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Logo Sekolah</label>
                <input type="file" accept="image/png, image/jpeg" className="hidden" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo_url')} />
                
                {formData.logo_url ? (
                  <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex justify-center">
                    <img src={formData.logo_url} alt="Logo" className="h-24 object-contain" />
                    <button type="button" onClick={() => removeImage('logo_url')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => logoInputRef.current.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                      <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-blue-600" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Klik untuk upload logo</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG up to 2MB</p>
                  </div>
                )}
              </div>

              {/* Upload Kop Surat */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Desain Kop Surat</label>
                <input type="file" accept="image/png, image/jpeg" className="hidden" ref={kopInputRef} onChange={(e) => handleFileUpload(e, 'kop_surat_url')} />
                
                {formData.kop_surat_url ? (
                  <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 overflow-hidden">
                    <img src={formData.kop_surat_url} alt="Kop Surat" className="w-full h-auto object-cover" />
                    <button type="button" onClick={() => removeImage('kop_surat_url')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => kopInputRef.current.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition-colors">
                      <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Upload banner kop surat</p>
                    <p className="text-[10px] text-slate-400">Dimensi memanjang (landscape)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
