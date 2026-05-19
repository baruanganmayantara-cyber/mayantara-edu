import { useState, useEffect } from 'react';
import { Users, GraduationCap, UserCheck, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [statsData, setStatsData] = useState({
    siswa: 0,
    guru: 0,
    kelas: 0,
    mapel: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      // Fetch Total Siswa Aktif
      const { count: countSiswa } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Aktif');

      // Fetch Total Guru
      const { count: countGuru } = await supabase
        .from('guru')
        .select('*', { count: 'exact', head: true });

      // Fetch Total Kelas
      const { count: countKelas } = await supabase
        .from('kelas')
        .select('*', { count: 'exact', head: true });

      // Fetch Total Mapel
      const { count: countMapel } = await supabase
        .from('mata_pelajaran')
        .select('*', { count: 'exact', head: true });

      setStatsData({
        siswa: countSiswa || 0,
        guru: countGuru || 0,
        kelas: countKelas || 0,
        mapel: countMapel || 0
      });

      // Fetch Recent Activities (Latest Jurnal Mengajar)
      const { data: activities } = await supabase
        .from('jurnal_mengajar')
        .select(`
          id,
          created_at,
          jadwal:jadwal_mengajar (
            guru (nama_lengkap),
            kelas (tingkat, nama_rombel),
            mata_pelajaran (nama)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (activities) {
        setRecentActivities(activities);
      }

      // Fetch 7 Days Presensi for Chart
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: presensiData } = await supabase
        .from('presensi_siswa')
        .select('status, jurnal_mengajar!inner(tanggal)')
        .gte('jurnal_mengajar.tanggal', dateStr);

      const grouped = {};
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        grouped[dStr] = { name: d.toLocaleDateString('id-ID', {weekday: 'short', day: 'numeric'}), Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
      }

      if (presensiData) {
        presensiData.forEach(p => {
          const tgl = p.jurnal_mengajar?.tanggal;
          if(grouped[tgl]) {
            if(p.status === 'Hadir') grouped[tgl].Hadir++;
            else if(p.status === 'Sakit') grouped[tgl].Sakit++;
            else if(p.status === 'Izin') grouped[tgl].Izin++;
            else if(p.status === 'Alpa') grouped[tgl].Alpa++;
          }
        });
      }
      setChartData(Object.values(grouped));

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  };

  const stats = [
    { name: 'Siswa Aktif', value: loading ? '...' : statsData.siswa, icon: GraduationCap, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { name: 'Total Guru', value: loading ? '...' : statsData.guru, icon: Users, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { name: 'Total Kelas', value: loading ? '...' : statsData.kelas, icon: BookOpen, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
    { name: 'Mata Pelajaran', value: loading ? '...' : statsData.mapel, icon: UserCheck, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-slate-500">Selamat datang kembali, Super Admin.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
          + Tambah Laporan / Info
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Grafik Kehadiran Mingguan</h2>
          <div className="h-[300px] w-full flex-1">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-400 animate-pulse">Memuat grafik...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="Hadir" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sakit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Izin" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Alpa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
            Aktivitas Terbaru
            <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-md">Real-time</span>
          </h2>
          <div className="space-y-4">
            {recentActivities.length === 0 && !loading && (
              <p className="text-sm text-slate-500 italic">Belum ada aktivitas hari ini.</p>
            )}
            {loading && <p className="text-sm text-slate-500 animate-pulse">Memuat aktivitas...</p>}
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3 items-start hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {activity.jadwal?.guru?.nama_lengkap ? activity.jadwal.guru.nama_lengkap.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{activity.jadwal?.guru?.nama_lengkap || 'Guru Tidak Diketahui'}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mengisi jurnal <span className="font-semibold text-slate-800">{activity.jadwal?.mata_pelajaran?.nama}</span> di Kelas {activity.jadwal?.kelas?.tingkat}-{activity.jadwal?.kelas?.nama_rombel}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {formatTimeAgo(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
