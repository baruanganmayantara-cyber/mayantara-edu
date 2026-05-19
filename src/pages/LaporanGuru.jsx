import { useState, useEffect } from 'react';
import { Download, BookOpen, Calendar as CalendarIcon, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LaporanGuru() {
  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Data States
  const [laporanGuru, setLaporanGuru] = useState([]);

  useEffect(() => {
    fetchLaporanGuru();
  }, [startDate, endDate]);

  async function fetchLaporanGuru() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jurnal_mengajar')
        .select(`
          id,
          tanggal,
          materi_sekarang,
          jumlah_jam,
          jadwal:jadwal_mengajar!inner(
            mata_pelajaran(nama),
            kelas(tingkat, nama_rombel),
            guru(nama_lengkap)
          )
        `)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setLaporanGuru(data || []);
    } catch (error) {
      console.error('Error fetching laporan guru:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredGuru = laporanGuru.filter(item => {
    if (!searchQuery) return true;
    const name = (item.jadwal?.guru?.nama_lengkap || '').toLowerCase();
    const mapel = (item.jadwal?.mata_pelajaran?.nama || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || mapel.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-6 h-6 text-amber-600" /> Laporan Jurnal Guru</h1>
          <p className="text-slate-500">Pantau kinerja pengajaran dan jurnal materi guru.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
          <Download className="w-5 h-5" />
          Cetak (PDF)
        </button>
      </div>

      {/* Control Panel: Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-full md:w-auto">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border-none bg-transparent outline-none cursor-pointer" />
          <span className="text-slate-400">-</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border-none bg-transparent outline-none cursor-pointer" />
        </div>

        {/* Search */}
        <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full sm:w-64 focus-within:border-blue-500 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Cari nama guru, mapel..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Nama Guru</th>
                <th className="px-6 py-4 font-semibold">Mata Pelajaran / Kelas</th>
                <th className="px-6 py-4 font-semibold">Jurnal / Materi</th>
                <th className="px-6 py-4 font-semibold">Jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 animate-pulse">Memuat data laporan...</td></tr>
              ) : filteredGuru.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Tidak ada jurnal mengajar pada rentang tanggal ini.</td></tr>
              ) : (
                filteredGuru.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">{formatTanggal(item.tanggal)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.jadwal?.guru?.nama_lengkap || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold">{item.jadwal?.mata_pelajaran?.nama}</span>
                        <span className="text-xs text-slate-500">Kelas: {item.jadwal?.kelas?.tingkat} - {item.jadwal?.kelas?.nama_rombel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={item.materi_sekarang}>{item.materi_sekarang || '-'}</td>
                    <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{item.jumlah_jam || 0} JP</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
