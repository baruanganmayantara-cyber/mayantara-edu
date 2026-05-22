import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, BookOpen, Home, FileText, User as UserIcon, BookMarked, Award } from 'lucide-react';

export default function GuruPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const guruName = localStorage.getItem('guruName') || 'Guru';
  let guruFoto = localStorage.getItem('guruFoto');
  
  // State Tema
  const [themeClass, setThemeClass] = useState(localStorage.getItem('guruTheme') || 'bg-violet-200');

  useEffect(() => {
    const handleThemeChange = () => {
      setThemeClass(localStorage.getItem('guruTheme') || 'bg-violet-200');
    };
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Fallback Foto Profil
  if (!guruFoto || guruFoto === 'null' || guruFoto === 'undefined') {
    guruFoto = `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(guruName)}`;
  }

  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar dari portal?')) {
      localStorage.removeItem('isGuruAuthenticated');
      localStorage.removeItem('guruId');
      localStorage.removeItem('guruName');
      localStorage.removeItem('guruFoto');
      window.location.href = '/login-guru';
    }
  };

  const navItems = [
    { name: 'Dasbor', icon: Home, path: '/portal-guru' },
    { name: 'Modul Ajar', icon: BookMarked, path: '/portal-guru/modul-ajar' },
    { name: 'Asesmen & Nilai', icon: Award, path: '/portal-guru/asesmen' },
    { name: 'Laporan', icon: FileText, path: '/portal-guru/laporan' },
    { name: 'Profil', icon: UserIcon, path: '/portal-guru/profil' },
  ];

  return (
    <div className={`min-h-[100dvh] ${themeClass} font-sans selection:bg-black selection:text-white flex flex-col md:flex-row relative transition-colors duration-500`}>
      
      {/* Background Ornaments (Global) */}
      <div className="fixed top-20 -left-10 w-64 h-64 bg-yellow-400 border-4 border-black rounded-full mix-blend-multiply opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-40 -right-10 w-80 h-80 bg-pink-400 border-4 border-black mix-blend-multiply opacity-30 rotate-12 pointer-events-none"></div>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r-8 border-black flex-col z-30 shrink-0 sticky top-0 h-screen">
        <div className="h-24 flex items-center px-6 border-b-4 border-black bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-6 rounded-xl shrink-0">
              <BookOpen className="text-black w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">PORTAL GURU</h1>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">Mayantara Edu</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => item.path !== '#' && navigate(item.path)}
                className={`flex items-center gap-4 w-full px-4 py-4 rounded-2xl border-4 border-black font-black uppercase transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-yellow-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1' 
                    : 'bg-white hover:bg-pink-100 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'}
                `}
              >
                <Icon className="w-6 h-6" />
                {item.name}
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t-4 border-black bg-white shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-4 bg-red-500 hover:bg-red-400 text-black border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase cursor-pointer text-lg"
          >
            <LogOut className="w-6 h-6" />
            Keluar
          </button>
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-yellow-400 text-xs font-black rounded-full tracking-widest uppercase border-2 border-black">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              v1.0.1 Production
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen relative z-40">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden bg-white border-b-4 border-black px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-6 rounded-xl shrink-0">
              <BookOpen className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-black leading-none">PORTAL GURU</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Mayantara Edu</p>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black text-yellow-400 text-[8px] font-black rounded-full">
                   <span className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse"></span>
                  v1.0.1
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 bg-red-500 hover:bg-red-400 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4 font-bold" />
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 lg:p-10 pb-28 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Hidden on Desktop) */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-black px-6 py-3 flex justify-between items-center z-50 rounded-t-[2.5rem]">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button key={index} onClick={() => item.path !== '#' && navigate(item.path)} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className={`w-12 h-10 flex items-center justify-center border-2 border-black rounded-xl transition-all
                  ${isActive ? 'bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-1' : 'bg-slate-100 group-hover:bg-pink-200'}
                `}>
                  <Icon className="w-5 h-5 text-black" />
                </div>
                <span className={`text-[10px] font-black uppercase ${isActive ? 'text-black' : 'text-slate-500'}`}>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
