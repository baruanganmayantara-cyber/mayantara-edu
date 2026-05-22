import { useState, useEffect } from 'react';
import { Download, BookOpen, Calendar as CalendarIcon, Search, Users, BarChart2, FileSpreadsheet, Eye, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LaporanGuru() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('log'); // 'log' or 'rekap'

  // Filters
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default: past 30 days
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Data States
  const [laporanGuru, setLaporanGuru] = useState([]);

  // Audit Modal States
  const [auditJurnal, setAuditJurnal] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPresensi, setAuditPresensi] = useState([]);

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
            guru(id, nama_lengkap)
          ),
          presensi_siswa(
            status
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

  // Fetch student detailed attendance for audit modal
  async function openAuditModal(jurnal) {
    setAuditJurnal(jurnal);
    setAuditLoading(true);
    try {
      const { data, error } = await supabase
        .from('presensi_siswa')
        .select(`
          id,
          status,
          keterangan,
          siswa:siswa_id(nisn, nis, nama_lengkap)
        `)
        .eq('jurnal_id', jurnal.id);
      
      if (error) throw error;
      setAuditPresensi(data || []);
    } catch (err) {
      console.error('Error fetching detailed presensi:', err);
      alert('Gagal memuat data presensi: ' + err.message);
    } finally {
      setAuditLoading(false);
    }
  }

  const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredLogs = laporanGuru.filter(item => {
    if (!searchQuery) return true;
    const name = (item.jadwal?.guru?.nama_lengkap || '').toLowerCase();
    const mapel = (item.jadwal?.mata_pelajaran?.nama || '').toLowerCase();
    const kelasStr = `${item.jadwal?.kelas?.tingkat || ''} ${item.jadwal?.kelas?.nama_rombel || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || mapel.includes(searchQuery.toLowerCase()) || kelasStr.includes(searchQuery.toLowerCase());
  });

  // Calculate Rekap Kinerja Guru
  const rekapKinerja = Object.values(laporanGuru.reduce((acc, item) => {
    const guru = item.jadwal?.guru;
    if (!guru) return acc;
    const guruId = guru.id || guru.nama_lengkap;

    if (!acc[guruId]) {
      acc[guruId] = {
        id: guruId,
        nama_lengkap: guru.nama_lengkap,
        total_pertemuan: 0,
        total_jp: 0,
        presensiStats: { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 }
      };
    }

    acc[guruId].total_pertemuan += 1;
    acc[guruId].total_jp += Number(item.jumlah_jam) || 0;

    if (item.presensi_siswa && Array.isArray(item.presensi_siswa)) {
      item.presensi_siswa.forEach(p => {
        if (p.status in acc[guruId].presensiStats) {
          acc[guruId].presensiStats[p.status] += 1;
        }
      });
    }

    return acc;
  }, {}));

  const filteredRekap = rekapKinerja.filter(item => {
    if (!searchQuery) return true;
    return item.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Export CSV for daily logs
  // Export CSV for daily logs
  const handleDownloadLogsCSV = () => {
    const formatCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = val.toString().replace(/"/g, '""');
      if (/^[0-9]+$/.test(str) || /^\d{2}-\d{2}-\d{4}$/.test(str)) {
        return `"=""${str}"""`;
      }
      return `"${str}"`;
    };

    let csvContent = 'Tanggal,Nama Guru,Mata Pelajaran,Kelas,Materi / Jurnal,JP (Jam Pelajaran),Presensi (H/S/I/A)\n';
    
    filteredLogs.forEach(item => {
      const tgl = formatCell(formatTanggal(item.tanggal));
      const guru = formatCell(item.jadwal?.guru?.nama_lengkap || '-');
      const mapel = formatCell(item.jadwal?.mata_pelajaran?.nama || '-');
      const kelas = formatCell(item.jadwal?.kelas ? `${item.jadwal.kelas.tingkat}-${item.jadwal.kelas.nama_rombel}` : '-');
      const materi = formatCell(item.materi_sekarang || '');
      const jp = formatCell(`${item.jumlah_jam || 0} JP`);
      
      const stats = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
      if (item.presensi_siswa) {
        item.presensi_siswa.forEach(p => {
          if (p.status in stats) stats[p.status]++;
        });
      }
      const rincian = formatCell(`${stats.Hadir}/${stats.Sakit}/${stats.Izin}/${stats.Alpa}`);
      
      csvContent += `${tgl},${guru},${mapel},${kelas},${materi},${jp},${rincian}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Log_Jurnal_Guru_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV for performance rekap
  const handleDownloadRekapCSV = () => {
    const formatCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = val.toString().replace(/"/g, '""');
      if (/^[0-9]+$/.test(str)) {
        return `"=""${str}"""`;
      }
      return `"${str}"`;
    };

    let csvContent = 'Nama Guru,Total Pertemuan,Total JP (Jam Pelajaran),Kehadiran Siswa (%),Hadir,Sakit,Izin,Alpa\n';
    
    filteredRekap.forEach(r => {
      const totalPresensi = r.presensiStats.Hadir + r.presensiStats.Sakit + r.presensiStats.Izin + r.presensiStats.Alpa;
      const rate = totalPresensi > 0 ? Math.round((r.presensiStats.Hadir / totalPresensi) * 100) : '-';
      
      const guru = formatCell(r.nama_lengkap);
      const total = formatCell(r.total_pertemuan);
      const jp = formatCell(r.total_jp);
      const persentase = formatCell(rate !== '-' ? `${rate}%` : '-');
      const hadir = formatCell(r.presensiStats.Hadir);
      const sakit = formatCell(r.presensiStats.Sakit);
      const izin = formatCell(r.presensiStats.Izin);
      const alpa = formatCell(r.presensiStats.Alpa);

      csvContent += `${guru},${total},${jp},${persentase},${hadir},${sakit},${izin},${alpa}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Rekap_Kinerja_Guru_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Audit Jurnal & Absensi Guru
          </h1>
          <p className="text-slate-500">Monitor kinerja mengajar guru dan lakukan verifikasi kehadiran siswa.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'log' ? (
            <button 
              onClick={handleDownloadLogsCSV} 
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm text-sm"
            >
              <Download className="w-4 h-4" /> Unduh Log Jurnal
            </button>
          ) : (
            <button 
              onClick={handleDownloadRekapCSV} 
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Unduh Rekap Kinerja
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'log'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Log Jurnal Mengajar
        </button>
        <button
          onClick={() => setActiveTab('rekap')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rekap'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Rekap Kinerja Guru
        </button>
      </div>

      {/* Control Panel: Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-full md:w-auto">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            className="text-sm border-none bg-transparent outline-none cursor-pointer text-slate-700 font-medium" 
          />
          <span className="text-slate-400 font-bold">-</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
            className="text-sm border-none bg-transparent outline-none cursor-pointer text-slate-700 font-medium" 
          />
        </div>

        {/* Search */}
        <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg w-full sm:w-80 focus-within:border-indigo-500 transition-all shadow-sm">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder={activeTab === 'log' ? "Cari guru, mapel, kelas..." : "Cari nama guru..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      {/* Data Views */}
      {activeTab === 'log' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Nama Guru</th>
                  <th className="px-6 py-4 font-semibold">Mata Pelajaran & Kelas</th>
                  <th className="px-6 py-4 font-semibold">Jurnal / Materi</th>
                  <th className="px-6 py-4 font-semibold">Durasi</th>
                  <th className="px-6 py-4 font-semibold">Presensi Kelas</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500 animate-pulse">
                      Memuat log jurnal mengajar...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                      Tidak ada jurnal mengajar pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item) => {
                    const stats = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
                    if (item.presensi_siswa) {
                      item.presensi_siswa.forEach(p => {
                        if (p.status in stats) stats[p.status]++;
                      });
                    }
                    const totalSiswa = stats.Hadir + stats.Sakit + stats.Izin + stats.Alpa;
                    const hadirPercent = totalSiswa > 0 ? Math.round((stats.Hadir / totalSiswa) * 100) : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-750 font-medium">{formatTanggal(item.tanggal)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{item.jadwal?.guru?.nama_lengkap || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{item.jadwal?.mata_pelajaran?.nama}</span>
                            <span className="text-xs text-slate-500">Kelas: {item.jadwal?.kelas?.tingkat} - {item.jadwal?.kelas?.nama_rombel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={item.materi_sekarang}>
                          {item.materi_sekarang || <span className="text-slate-400 italic">Belum diisi</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-indigo-55 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-100">
                            {item.jumlah_jam || 0} JP
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hadirPercent !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                hadirPercent >= 90 ? 'bg-emerald-500' : hadirPercent >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} />
                              <span className="font-bold text-slate-800">{hadirPercent}% Hadir</span>
                              <span className="text-xs text-slate-400 font-medium">({stats.Hadir}/{totalSiswa})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Tanpa Absensi</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openAuditModal(item)}
                            className="p-1 px-2.5 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md border border-slate-200 hover:border-indigo-200 transition-all font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Audit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab Rekap Kinerja */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Guru</th>
                  <th className="px-6 py-4 font-semibold text-center">Total Mengajar (Sesi)</th>
                  <th className="px-6 py-4 font-semibold text-center">Total JP Kumulatif</th>
                  <th className="px-6 py-4 font-semibold">Rata-rata Kehadiran Siswa</th>
                  <th className="px-6 py-4 font-semibold">Rincian Absensi (H/S/I/A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 animate-pulse">
                      Menghitung rekapitulasi kinerja...
                    </td>
                  </tr>
                ) : filteredRekap.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data mengajar yang terekap pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  filteredRekap.map((r) => {
                    const totalPresensi = r.presensiStats.Hadir + r.presensiStats.Sakit + r.presensiStats.Izin + r.presensiStats.Alpa;
                    const hadirPercent = totalPresensi > 0 ? Math.round((r.presensiStats.Hadir / totalPresensi) * 100) : null;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{r.nama_lengkap}</td>
                        <td className="px-6 py-4 text-center text-slate-800 font-semibold">{r.total_pertemuan} Pertemuan</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-1 rounded-md text-xs font-bold">
                            {r.total_jp} JP
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {hadirPercent !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-100 rounded-full h-2 border border-slate-200 overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full ${
                                    hadirPercent >= 90 ? 'bg-emerald-500' : hadirPercent >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${hadirPercent}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-800">{hadirPercent}%</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Belum ada absensi</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1.5 text-xs font-bold text-slate-700">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                              Hadir: {r.presensiStats.Hadir}
                            </span>
                            <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100">
                              Sakit: {r.presensiStats.Sakit}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                              Izin: {r.presensiStats.Izin}
                            </span>
                            <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">
                              Alpa: {r.presensiStats.Alpa}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Audit Kehadiran */}
      {auditJurnal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Audit Log Absensi Kelas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifikasi lembar absen siswa untuk mata pelajaran {auditJurnal.jadwal?.mata_pelajaran?.nama}
                </p>
              </div>
              <button 
                onClick={() => setAuditJurnal(null)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Info Jurnal */}
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nama Guru</span>
                <span className="text-slate-800 font-bold">{auditJurnal.jadwal?.guru?.nama_lengkap}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Kelas</span>
                <span className="text-slate-800 font-bold">{auditJurnal.jadwal?.kelas?.tingkat} - {auditJurnal.jadwal?.kelas?.nama_rombel}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tanggal Pertemuan</span>
                <span className="text-slate-800 font-bold">{formatTanggal(auditJurnal.tanggal)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Durasi Jam</span>
                <span className="bg-indigo-100 text-indigo-750 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                  {auditJurnal.jumlah_jam || 0} JP
                </span>
              </div>
            </div>

            {/* Modal Body: Student attendance table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-650">
                  <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold">Siswa</th>
                      <th className="px-4 py-3 font-bold">NISN / NIS</th>
                      <th className="px-4 py-3 font-bold text-center">Status Kehadiran</th>
                      <th className="px-4 py-3 font-bold">Keterangan / Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLoading ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-slate-400 animate-pulse font-bold">
                          Mengambil data kehadiran siswa dari database...
                        </td>
                      </tr>
                    ) : auditPresensi.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500 italic">
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          Tidak ada siswa yang tercatat presensi dalam jurnal mengajar ini.
                        </td>
                      </tr>
                    ) : (
                      auditPresensi.map((p, idx) => {
                        const statusColors = {
                          'Hadir': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          'Sakit': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          'Izin': 'bg-blue-100 text-blue-800 border-blue-200',
                          'Alpa': 'bg-rose-100 text-rose-800 border-rose-200'
                        };
                        const cls = statusColors[p.status] || 'bg-slate-100 text-slate-800 border-slate-200';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 font-medium">
                            <td className="px-4 py-3 font-bold text-slate-900">{p.siswa?.nama_lengkap || '-'}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">
                              {p.siswa?.nisn || '-'}<span className="text-slate-350"> / </span>{p.siswa?.nis || '-'}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${cls}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate" title={p.keterangan}>
                              {p.keterangan ? `"${p.keterangan}"` : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setAuditJurnal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                Selesai Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
