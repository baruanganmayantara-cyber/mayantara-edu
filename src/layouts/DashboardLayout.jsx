import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, Settings, Menu, Bell, Search, BookOpen, Library, CalendarDays, Megaphone, FileText, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubMenus, setOpenSubMenus] = useState({});
  
  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar dari dasbor?')) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('adminUsername');
      window.location.href = '/login';
    }
  };
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Jadwal Mengajar', icon: CalendarDays, path: '/admin/jadwal' },
    { name: 'Data Kelas', icon: BookOpen, path: '/admin/kelas' },
    { name: 'Mata Pelajaran', icon: Library, path: '/admin/mapel' },
    { name: 'Data Siswa', icon: GraduationCap, path: '/admin/siswa' },
    { name: 'Data Guru', icon: Users, path: '/admin/guru' },
    { name: 'Pengumuman', icon: Megaphone, path: '/admin/pengumuman' },
    { 
      name: 'Laporan', 
      icon: FileText, 
      subItems: [
        { name: 'Laporan Siswa', path: '/admin/laporan-siswa' },
        { name: 'Laporan Guru', path: '/admin/laporan-guru' }
      ]
    },
    { name: 'Pengaturan', icon: Settings, path: '/admin/pengaturan' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-800">Mayantara Edu</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.subItems) {
              const isSubOpen = openSubMenus[item.name] || item.subItems.some(sub => location.pathname === sub.path);
              const isActive = item.subItems.some(sub => location.pathname === sub.path);
              const Icon = item.icon;
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => setOpenSubMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                      {item.name}
                    </div>
                    {isSubOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {isSubOpen && (
                    <div className="pl-11 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <Link
                            key={sub.name}
                            to={sub.path}
                            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isSubActive 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium w-full text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Keluar Dasbor
          </button>
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              v1.0.1 · Production
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 print:hidden">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center px-3 py-2 bg-slate-100 rounded-lg">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Cari sesuatu..." 
                className="bg-transparent border-none outline-none text-sm w-64 focus:ring-0"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-700">A</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
