import { useState, useEffect } from 'react';
import { Download, Users, Calendar as CalendarIcon, Search, FileSpreadsheet, LayoutList, PieChart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LaporanSiswa() {
  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('harian'); // 'harian' | 'rekap'

  // Data States
  const [laporanSiswa, setLaporanSiswa] = useState([]);
  const [kelasData, setKelasData] = useState([]);

  useEffect(() => {
    fetchKelas();
  }, []);

  async function fetchKelas() {
    try {
      const { data } = await supabase.from('kelas').select('id, tingkat, nama_rombel').order('tingkat');
      if (data) setKelasData(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchLaporanSiswa();
  }, [startDate, endDate]);

  async function fetchLaporanSiswa() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('presensi_siswa')
        .select(`
          id,
          status,
          keterangan,
          tanggal_jurnal:jurnal_mengajar!inner(tanggal, jadwal:jadwal_mengajar(mata_pelajaran(nama), kelas(id, tingkat, nama_rombel))),
          siswa:siswa_id(nama_lengkap, nisn)
        `)
        .gte('tanggal_jurnal.tanggal', startDate)
        .lte('tanggal_jurnal.tanggal', endDate);

      if (error) throw error;
      
      // Sort in JS to avoid Supabase foreign table ordering limitations
      const sortedData = (data || []).sort((a, b) => {
        const dateA = new Date(a.tanggal_jurnal?.tanggal || 0);
        const dateB = new Date(b.tanggal_jurnal?.tanggal || 0);
        return dateB - dateA; // Descending
      });
      
      setLaporanSiswa(sortedData);
    } catch (error) {
      console.error('Error fetching laporan siswa:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredSiswa = laporanSiswa.filter(item => {
    const classMatch = selectedKelas ? item.tanggal_jurnal?.jadwal?.kelas?.id === selectedKelas : true;
    if (!searchQuery) return classMatch;
    
    const name = (item.siswa?.nama_lengkap || '').toLowerCase();
    const mapel = (item.tanggal_jurnal?.jadwal?.mata_pelajaran?.nama || '').toLowerCase();
    const kelasString = (item.tanggal_jurnal?.jadwal?.kelas?.nama_rombel || '').toLowerCase();
    
    const searchMatch = name.includes(searchQuery.toLowerCase()) || mapel.includes(searchQuery.toLowerCase()) || kelasString.includes(searchQuery.toLowerCase());
    return classMatch && searchMatch;
  });

  // Calculate Recap
  const rekapSiswa = {};
  filteredSiswa.forEach(item => {
    const sId = item.siswa?.nisn || item.siswa?.nama_lengkap; 
    if (!sId) return;

    if (!rekapSiswa[sId]) {
      rekapSiswa[sId] = {
        nama: item.siswa?.nama_lengkap || '-',
        kelas: `${item.tanggal_jurnal?.jadwal?.kelas?.tingkat} - ${item.tanggal_jurnal?.jadwal?.kelas?.nama_rombel}`,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        total: 0
      };
    }
    rekapSiswa[sId].total += 1;
    if (item.status === 'Hadir') rekapSiswa[sId].hadir += 1;
    if (item.status === 'Sakit') rekapSiswa[sId].sakit += 1;
    if (item.status === 'Izin') rekapSiswa[sId].izin += 1;
    if (item.status === 'Alpa') rekapSiswa[sId].alpa += 1;
  });

  const rekapSiswaList = Object.values(rekapSiswa).map(s => {
    const p = s.total > 0 ? ((s.hadir / s.total) * 100).toFixed(1) : 0;
    return { ...s, persentase: p };
  }).sort((a, b) => a.nama.localeCompare(b.nama));

  const selectedKelasObj = kelasData.find(k => k.id === selectedKelas);
  const namaKelasFilter = selectedKelasObj ? `${selectedKelasObj.tingkat}-${selectedKelasObj.nama_rombel}` : 'Semua_Kelas';

  const exportToCSV = () => {
    // Helper to format cells for Excel
    const formatCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = val.toString().replace(/"/g, '""');
      // If it looks like a number/code or has date separators, force as text formula
      if (/^[0-9]+$/.test(str) || /^\d{2}-\d{2}-\d{4}$/.test(str)) {
        return `"=""${str}"""`;
      }
      return `"${str}"`;
    };

    let csvContent = "";
    if (viewMode === 'harian') {
      csvContent += "Tanggal,Nama Siswa,Kelas,Mata Pelajaran,Status,Keterangan\n";
      filteredSiswa.forEach(row => {
        const tgl = formatCell(formatTanggal(row.tanggal_jurnal?.tanggal));
        const nm = formatCell(row.siswa?.nama_lengkap || '-');
        const kls = formatCell(`${row.tanggal_jurnal?.jadwal?.kelas?.tingkat}-${row.tanggal_jurnal?.jadwal?.kelas?.nama_rombel}`);
        const mapel = formatCell(row.tanggal_jurnal?.jadwal?.mata_pelajaran?.nama || '-');
        const st = formatCell(row.status);
        const ket = formatCell(row.keterangan || '');
        csvContent += `${tgl},${nm},${kls},${mapel},${st},${ket}\n`;
      });
    } else {
      csvContent += "Nama Siswa,Kelas,Total Pertemuan,Hadir,Sakit,Izin,Alpa,Persentase Hadir (%)\n";
      rekapSiswaList.forEach(row => {
        const nm = formatCell(row.nama);
        const kls = formatCell(row.kelas);
        const total = formatCell(row.total);
        const hadir = formatCell(row.hadir);
        const sakit = formatCell(row.sakit);
        const izin = formatCell(row.izin);
        const alpa = formatCell(row.alpa);
        const persentase = formatCell(`${row.persentase}%`);
        csvContent += `${nm},${kls},${total},${hadir},${sakit},${izin},${alpa},${persentase}\n`;
      });
    }

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Laporan_${namaKelasFilter}_${viewMode}_${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" /> Laporan Presensi Siswa</h1>
          <p className="text-slate-500">Pantau kehadiran siswa berdasarkan rentang tanggal dan kelas.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={exportToCSV} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
            <span className="hidden sm:inline">Unduh Excel</span>
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col xl:flex-row gap-4 items-center justify-between print:hidden">
        
        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full xl:w-auto">
          <button 
            onClick={() => setViewMode('harian')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'harian' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutList className="w-4 h-4" /> Log Harian
          </button>
          <button 
            onClick={() => setViewMode('rekap')} 
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'rekap' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PieChart className="w-4 h-4" /> Rekapitulasi
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-full md:w-auto">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border-none bg-transparent outline-none cursor-pointer" />
          <span className="text-slate-400">-</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border-none bg-transparent outline-none cursor-pointer" />
        </div>

        {/* Other Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <select 
            value={selectedKelas} 
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer outline-none hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            <option value="">Semua Kelas</option>
            {kelasData.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_rombel}</option>)}
          </select>

          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full sm:w-64 focus-within:border-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Cari nama, mapel..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print-area">
        
        <div className="hidden print:block p-6 border-b border-slate-200 text-center">
          <h2 className="text-2xl font-black uppercase text-black">Laporan {viewMode === 'rekap' ? 'Rekapitulasi' : 'Kehadiran'} Siswa</h2>
          <p className="font-bold text-slate-800 text-lg mt-1">Kelas: {selectedKelasObj ? `${selectedKelasObj.tingkat} - ${selectedKelasObj.nama_rombel}` : 'Semua Kelas'}</p>
          <p className="font-bold text-slate-600 mt-1">Periode: {formatTanggal(startDate)} s.d. {formatTanggal(endDate)}</p>
        </div>

        <div className="overflow-x-auto">
          {viewMode === 'harian' ? (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                  <th className="px-6 py-4 font-semibold">Kelas</th>
                  <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 animate-pulse">Memuat data laporan...</td></tr>
              ) : filteredSiswa.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Tidak ada data kehadiran pada rentang tanggal ini.</td></tr>
              ) : (
                filteredSiswa.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">{formatTanggal(item.tanggal_jurnal?.tanggal)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.siswa?.nama_lengkap || '-'}</td>
                    <td className="px-6 py-4">{item.tanggal_jurnal?.jadwal?.kelas?.tingkat} - {item.tanggal_jurnal?.jadwal?.kelas?.nama_rombel}</td>
                    <td className="px-6 py-4">{item.tanggal_jurnal?.jadwal?.mata_pelajaran?.nama}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border
                        ${item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          item.status === 'Alpa' ? 'bg-red-50 text-red-700 border-red-200' : 
                          item.status === 'Izin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">{item.keterangan || '-'}</td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                  <th className="px-6 py-4 font-semibold">Kelas</th>
                  <th className="px-6 py-4 font-semibold text-center">Total Pertemuan</th>
                  <th className="px-6 py-4 font-semibold text-center">Hadir</th>
                  <th className="px-6 py-4 font-semibold text-center">Sakit</th>
                  <th className="px-6 py-4 font-semibold text-center">Izin</th>
                  <th className="px-6 py-4 font-semibold text-center text-red-600">Alpa</th>
                  <th className="px-6 py-4 font-semibold text-center">% Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500 animate-pulse">Memuat data rekap...</td></tr>
                ) : rekapSiswaList.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">Tidak ada data kehadiran pada rentang tanggal ini.</td></tr>
                ) : (
                  rekapSiswaList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{item.nama}</td>
                      <td className="px-6 py-4">{item.kelas}</td>
                      <td className="px-6 py-4 text-center font-bold bg-slate-50">{item.total}</td>
                      <td className="px-6 py-4 text-center font-medium text-emerald-600">{item.hadir}</td>
                      <td className="px-6 py-4 text-center font-medium text-orange-500">{item.sakit}</td>
                      <td className="px-6 py-4 text-center font-medium text-blue-500">{item.izin}</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/50">{item.alpa}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-md font-bold text-xs ${Number(item.persentase) >= 80 ? 'bg-emerald-100 text-emerald-800' : Number(item.persentase) >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800 border-2 border-red-500'}`}>
                          {item.persentase}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
