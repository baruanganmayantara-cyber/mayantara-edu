import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Phone, Mail, MapPin, Briefcase, Award, PenTool, CheckCircle, Palette, Camera, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

export default function ProfilGuru() {
  const [profilData, setProfilData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk Edit Profil
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // State Tema Saat Ini
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('guruTheme') || 'bg-violet-200');

  // State untuk Crop Foto
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  
  const fileInputRef = useRef(null);

  const guruId = localStorage.getItem('guruId');

  const themes = [
    { name: 'Ungu (Default)', class: 'bg-violet-200', color: '#ddd6fe' },
    { name: 'Biru Lembut', class: 'bg-blue-200', color: '#bfdbfe' },
    { name: 'Hijau Mint', class: 'bg-emerald-200', color: '#a7f3d0' },
    { name: 'Merah Muda', class: 'bg-pink-200', color: '#fbcfe8' },
    { name: 'Kuning Cerah', class: 'bg-yellow-200', color: '#fef08a' },
    { name: 'Oranye Hangat', class: 'bg-orange-200', color: '#fed7aa' },
  ];

  useEffect(() => {
    fetchProfil();
  }, []);

  async function fetchProfil() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guru')
        .select('*')
        .eq('id', guruId)
        .single();
        
      if (data) {
        setProfilData(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching profil:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('guru')
        .update({
          nama_lengkap: formData.nama_lengkap,
          jenis_kelamin: formData.jenis_kelamin,
          tempat_lahir: formData.tempat_lahir,
          tanggal_lahir: formData.tanggal_lahir,
          no_hp: formData.no_hp,
          email: formData.email,
          alamat: formData.alamat,
        })
        .eq('id', guruId);

      if (error) throw error;
      
      setProfilData(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
      localStorage.setItem('guruName', formData.nama_lengkap);
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      alert('Gagal menyimpan profil: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const changeTheme = (themeClass) => {
    setActiveTheme(themeClass);
    localStorage.setItem('guruTheme', themeClass);
    window.dispatchEvent(new Event('themeChange'));
  };

  // ---- FUNGSI CROP FOTO ----
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropping(true);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadCroppedImage = async () => {
    try {
      setIsSaving(true);
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Simpan Base64 ke Supabase (foto_url)
      const { error } = await supabase
        .from('guru')
        .update({ foto_url: croppedImageBase64 })
        .eq('id', guruId);

      if (error) throw error;

      setProfilData(prev => ({ ...prev, foto_url: croppedImageBase64 }));
      localStorage.setItem('guruFoto', croppedImageBase64);
      setIsCropping(false);
      setImageSrc(null);
      alert('Foto profil berhasil diperbarui!');

    } catch (e) {
      console.error(e);
      alert('Gagal mengunggah foto.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-bold uppercase animate-pulse">Memuat Profil...</div>;
  }

  if (!profilData) {
    return <div className="p-8 text-center font-bold text-red-500 uppercase">Data profil tidak ditemukan.</div>;
  }

  // Fallback foto
  let finalFoto = profilData.foto_url;
  if (!finalFoto || finalFoto === 'null' || finalFoto === 'undefined') {
    finalFoto = profilData.jenis_kelamin === 'L' 
      ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(profilData.nama_lengkap)}` 
      : `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(profilData.nama_lengkap)}`;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8 max-w-3xl mx-auto">
      
      {/* Header Profil */}
      <div className="bg-pink-400 border-4 border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative flex flex-col items-center text-center mt-8">
        
        {/* Foto Profil Area */}
        <div className="relative -mt-16 mb-4 group z-10">
          <div className="w-24 h-24 bg-white border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center">
            <img src={finalFoto} alt="Profil" className="w-full h-full object-cover" />
          </div>
          
          {/* Tombol Kamera (Selalu Muncul atau Muncul Saat Edit Saja? Muncul selalu lebih gampang ditemukan) */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-400 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center cursor-pointer hover:bg-blue-300 transition-colors z-20"
            title="Ubah Foto Profil"
          >
            <Camera className="w-4 h-4 text-black" />
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />
        </div>
        
        {isEditing ? (
          <input 
            type="text" 
            name="nama_lengkap"
            value={formData.nama_lengkap || ''} 
            onChange={handleInputChange}
            className="text-xl font-black uppercase text-center w-full max-w-sm border-4 border-black rounded-xl px-2 py-1 bg-white mb-2 outline-none focus:ring-4 focus:ring-blue-400/50"
          />
        ) : (
          <h2 className="text-2xl font-black uppercase text-black leading-tight mb-1">{profilData.nama_lengkap}</h2>
        )}
        
        <div className="bg-white border-2 border-black px-3 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex rounded-xl rotate-[-2deg]">
          NIP: {profilData.nip || '-'}
        </div>

        {/* Tombol Aksi Edit Profil Text */}
        <div className="absolute top-4 right-4">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => setIsEditing(false)} className="bg-white hover:bg-slate-100 border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer font-bold text-sm">
                Batal
              </button>
              <button onClick={handleSave} disabled={isSaving} className="bg-green-400 hover:bg-green-300 border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer disabled:opacity-50 font-bold text-sm">
                <CheckCircle className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="bg-yellow-400 hover:bg-yellow-300 border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none">
              <PenTool className="w-4 h-4" /> <span className="hidden sm:inline font-bold text-sm">Edit Profil</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Detail */}
      <div className="bg-white border-4 border-black rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
        <h3 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">Detail Pegawai</h3>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-300 border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Status Pegawai</p>
            <input 
              type="text" 
              value={profilData.status || ''} 
              disabled 
              className="w-full font-black text-lg bg-slate-100 border-2 border-black rounded-lg px-3 py-1 opacity-70 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-300 border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Jenis Kelamin</p>
            {isEditing ? (
              <select name="jenis_kelamin" value={formData.jenis_kelamin || ''} onChange={handleInputChange} className="w-full font-black text-lg bg-white border-2 border-black rounded-lg px-3 py-1 cursor-pointer outline-none">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            ) : (
              <p className="font-black text-lg px-3 py-1">{profilData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            )}
          </div>
        </div>

        <div className="flex items-start sm:items-center gap-4">
          <div className="w-10 h-10 bg-green-300 border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0 mt-2 sm:mt-0">
            <Briefcase className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tempat Lahir</p>
              {isEditing ? (
                <input type="text" name="tempat_lahir" value={formData.tempat_lahir || ''} onChange={handleInputChange} className="w-full font-black text-base bg-white border-2 border-black rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-400" />
              ) : (
                <p className="font-black text-lg px-3 py-1">{profilData.tempat_lahir || '-'}</p>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tanggal Lahir</p>
              {isEditing ? (
                <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir || ''} onChange={handleInputChange} className="w-full font-black text-base bg-white border-2 border-black rounded-lg px-3 py-1 cursor-pointer outline-none focus:ring-2 focus:ring-blue-400" />
              ) : (
                <p className="font-black text-lg px-3 py-1">{profilData.tanggal_lahir || '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-slate-100 border-4 border-black rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">
        <h3 className="text-xl font-black uppercase border-b-4 border-black pb-2 mb-4">Informasi Kontak</h3>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 uppercase mb-1">Nomor HP</p>
            {isEditing ? (
              <input type="text" name="no_hp" value={formData.no_hp || ''} onChange={handleInputChange} className="w-full font-black text-base bg-white border-2 border-black rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-400" />
            ) : (
              <p className="font-black text-lg px-3 py-1">{profilData.no_hp || 'Belum diisi'}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-600 uppercase mb-1">Email</p>
            {isEditing ? (
              <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full font-black text-base bg-white border-2 border-black rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-400" />
            ) : (
              <p className="font-black text-base px-3 py-1 break-all truncate">{profilData.email || 'Belum diisi'}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
            <MapPin className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 uppercase mb-1">Alamat Lengkap</p>
            {isEditing ? (
              <textarea name="alamat" value={formData.alamat || ''} onChange={handleInputChange} rows="3" className="w-full font-bold text-sm bg-white border-2 border-black rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-blue-400" />
            ) : (
              <p className="font-bold text-sm px-3 py-1 leading-relaxed">{profilData.alamat || 'Belum diisi'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tema Warna Dasbor */}
      <div className="bg-white border-4 border-black rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex items-center gap-3 border-b-4 border-black pb-2 mb-4">
          <Palette className="w-6 h-6 text-black" />
          <h3 className="text-xl font-black uppercase">Tema Warna Portal</h3>
        </div>
        <p className="text-sm font-bold text-slate-500">Pilih warna latar belakang favorit Anda. Pilihan ini akan disimpan secara otomatis.</p>
        
        <div className="flex flex-wrap gap-3 mt-4">
          {themes.map((theme) => (
            <button
              key={theme.class}
              onClick={() => changeTheme(theme.class)}
              style={{ backgroundColor: theme.color }}
              className={`w-12 h-12 rounded-full border-4 cursor-pointer transition-transform hover:scale-110 active:scale-95
                ${activeTheme === theme.class ? 'border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-4 ring-offset-2 ring-blue-500' : 'border-slate-300 border-dashed'}
              `}
              title={theme.name}
              aria-label={theme.name}
            ></button>
          ))}
        </div>
      </div>

      {/* Modal Crop Foto */}
      {isCropping && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 sm:border-8 border-black rounded-[2rem] w-full max-w-md h-[500px] flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
            
            <div className="p-4 border-b-4 border-black flex justify-between items-center bg-yellow-400 z-10 shrink-0">
              <h3 className="font-black uppercase text-lg">Sesuaikan Foto</h3>
              <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="p-1 bg-red-500 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 relative bg-slate-100">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-4 border-t-4 border-black bg-white z-10 shrink-0 space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full accent-blue-600"
                />
              </div>
              <button 
                onClick={uploadCroppedImage} 
                disabled={isSaving}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 border-4 border-black rounded-xl font-black text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Memproses...' : 'Potong & Simpan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
