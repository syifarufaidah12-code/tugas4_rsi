import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EmptyState } from './components/StatusViews';
import { StallListPage } from './pages/StallListPage';
import { StallDetailPage } from './pages/StallDetailPage';
import { StallCreatePage } from './pages/StallCreatePage';
import { StallEditPage } from './pages/StallEditPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuditLogPage } from './pages/AuditLogPage';
import { API_BASE_URL } from './api/client';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="container main">
          <Routes>
            {/* Publik */}
            <Route path="/" element={<StallListPage />} />
            <Route path="/stalls/:id" element={<StallDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Harus login */}
            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin saja */}
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />

            {/* Owner & Admin */}
            <Route
              path="/stalls/new"
              element={
                <ProtectedRoute roles={['owner', 'admin']}>
                  <StallCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stalls/:id/edit"
              element={
                <ProtectedRoute roles={['owner', 'admin']}>
                  <StallEditPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <EmptyState icon="🧭" title="Halaman tidak ditemukan" description="Periksa kembali alamat URL." />
              }
            />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container">
            Review Kantin · React + TypeScript + Axios · API: <code>{API_BASE_URL}</code>
          </div>
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}
