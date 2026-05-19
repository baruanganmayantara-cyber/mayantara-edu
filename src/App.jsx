import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import LoginGuru from './pages/LoginGuru';
import GuruPortalLayout from './layouts/GuruPortalLayout';
import DashboardGuru from './pages/GuruPortal/DashboardGuru';
import ProfilGuru from './pages/GuruPortal/ProfilGuru';
import LaporanGuruPortal from './pages/GuruPortal/LaporanGuruPortal';
import ModulAjar from './pages/GuruPortal/ModulAjar';
import Dashboard from './pages/Dashboard';
import Kelas from './pages/Kelas';
import MataPelajaran from './pages/MataPelajaran';
import JadwalMengajar from './pages/JadwalMengajar';
import Pengumuman from './pages/Pengumuman';
import LaporanSiswa from './pages/LaporanSiswa';
import LaporanGuru from './pages/LaporanGuru';
import Pengaturan from './pages/Pengaturan';
import Guru from './pages/Guru';
import Siswa from './pages/Siswa';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const ProtectedGuruRoute = ({ children }) => {
  const isGuruAuthenticated = localStorage.getItem('isGuruAuthenticated') === 'true';
  const location = useLocation();

  if (!isGuruAuthenticated) {
    return <Navigate to="/login-guru" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Default: arahkan ke Login Guru */}
        <Route path="/" element={<Navigate to="/login-guru" replace />} />

        {/* Rute Admin */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="kelas" element={<Kelas />} />
          <Route path="mapel" element={<MataPelajaran />} />
          <Route path="jadwal" element={<JadwalMengajar />} />
          <Route path="pengumuman" element={<Pengumuman />} />
          <Route path="laporan-siswa" element={<LaporanSiswa />} />
          <Route path="laporan-guru" element={<LaporanGuru />} />
          <Route path="siswa" element={<Siswa />} />
          <Route path="guru" element={<Guru />} />
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>

        {/* Rute Portal Guru */}
        <Route path="/login-guru" element={<LoginGuru />} />
        <Route path="/portal-guru" element={<ProtectedGuruRoute><GuruPortalLayout /></ProtectedGuruRoute>}>
          <Route index element={<DashboardGuru />} />
          <Route path="modul-ajar" element={<ModulAjar />} />
          <Route path="laporan" element={<LaporanGuruPortal />} />
          <Route path="profil" element={<ProfilGuru />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
