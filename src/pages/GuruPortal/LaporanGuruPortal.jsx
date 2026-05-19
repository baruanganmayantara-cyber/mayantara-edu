import { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function LaporanGuruPortal() {
  const guruId = localStorage.getItem('guruId');
  
  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [laporanData, setLaporanData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLaporan();
  }, [startDate, endDate]);

  async function fetchLaporan() {
    setLoading(true);
    try {
      // Kita perlu mengambil presensi_siswa yang terhubung ke jurnal_mengajar,
      // yang jadwal_mengajar nya milik guruId ini.
      // Ambil dari jurnal_mengajar agar filter guru_id hanya 1 level (didukung penuh Supabase)
      const { data, error } = await supabase
        .from('jurnal_mengajar')
        .select(`
          id,
          tanggal,
          jadwal:jadwal_mengajar!inner(
            guru_id,
            mata_pelajaran(nama),
            kelas(tingkat, nama_rombel)
          ),
          presensi_siswa(
            id, 
            status, 
            keterangan, 
            siswa:siswa_id(nama_lengkap, nisn)
          )
        `)
        .eq('jadwal_mengajar.guru_id', guruId)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (error) throw error;
      
      // Flatten (ratakan) data presensi_siswa ke dalam satu array laporan
      let flattenedData = [];
      if (data) {
        data.forEach(jurnal => {
          if (jurnal.presensi_siswa) {
            jurnal.presensi_siswa.forEach(presensi => {
              flattenedData.push({
                id: presensi.id,
                status: presensi.status,
                keterangan: presensi.keterangan,
                siswa: presensi.siswa,
                tanggal_jurnal: {
                  tanggal: jurnal.tanggal,
                  jadwal: jurnal.jadwal
                }
              });
            });
          }
        });
      }

      // Urutkan berdasarkan tanggal
      const sortedData = flattenedData.sort((a, b) => {
        const dateA = new Date(a.tanggal_jurnal.tanggal);
        const dateB = new Date(b.tanggal_jurnal.tanggal);
        return dateB - dateA;
      });
      
      setLaporanData(sortedData);
    } catch (error) {
      console.error('Error fetching laporan guru portal:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredLaporan = laporanData.filter(item => {
    if (!searchQuery) return true;
    const name = (item.siswa?.nama_lengkap || '').toLowerCase();
    const mapel = (item.tanggal_jurnal?.jadwal?.mata_pelajaran?.nama || '').toLowerCase();
    const kelas = (item.tanggal_jurnal?.jadwal?.kelas?.nama_rombel || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || mapel.includes(searchQuery.toLowerCase()) || kelas.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
      
      {/* Header Neo-Brutalism */}
      <div className="bg-emerald-400 border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
        <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-6">
          <FileText className="w-6 h-6 text-black" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-black leading-none">Laporan Presensi</h2>
          <p className="text-sm font-bold text-black mt-1">Pantau kehadiran siswa di kelas Anda.</p>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white border-4 border-black rounded-3xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-blue-100 border-2 border-black rounded-xl px-3 py-2">
            <CalendarIcon className="w-5 h-5 text-black shrink-0" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-sm w-full cursor-pointer" />
          </div>
          <div className="flex items-center justify-center font-black">S/D</div>
          <div className="flex-1 flex items-center gap-2 bg-pink-100 border-2 border-black rounded-xl px-3 py-2">
            <CalendarIcon className="w-5 h-5 text-black shrink-0" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-sm w-full cursor-pointer" />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border-2 border-black rounded-xl px-3 py-2 focus-within:bg-yellow-50 transition-colors">
          <Search className="w-5 h-5 text-black shrink-0" />
          <input 
            type="text" 
            placeholder="Cari nama siswa atau kelas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-sm w-full"
          />
        </div>

      </div>

      {/* Daftar Laporan (List View) */}
      <div className="bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col divide-y-4 divide-black">
        {loading ? (
          <div className="p-8 text-center font-black uppercase animate-pulse">Memuat laporan...</div>
        ) : filteredLaporan.length === 0 ? (
          <div className="p-8 text-center font-black uppercase text-red-500">Tidak ada data kehadiran ditemukan!</div>
        ) : (
          filteredLaporan.map((item) => {
            const statusColors = {
              'Hadir': 'bg-green-400',
              'Alpa': 'bg-red-400',
              'Izin': 'bg-blue-400',
              'Sakit': 'bg-yellow-400'
            };
            const bgColor = statusColors[item.status] || 'bg-slate-200';

            return (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black uppercase bg-black text-white px-2 py-1 rounded-md">{formatTanggal(item.tanggal_jurnal?.tanggal)}</span>
                  <span className={`text-xs font-black uppercase border-2 border-black px-2 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${bgColor}`}>
                    {item.status}
                  </span>
                </div>
                
                <h4 className="text-lg font-black uppercase leading-tight mb-1">{item.siswa?.nama_lengkap}</h4>
                
                <div className="flex flex-col gap-0.5 mt-2">
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    Kelas: {item.tanggal_jurnal?.jadwal?.kelas?.tingkat} - {item.tanggal_jurnal?.jadwal?.kelas?.nama_rombel}
                  </p>
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    Mapel: {item.tanggal_jurnal?.jadwal?.mata_pelajaran?.nama}
                  </p>
                  {item.keterangan && (
                    <p className="text-sm font-medium mt-2 bg-slate-100 p-2 border-l-4 border-black italic">
                      "{item.keterangan}"
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
