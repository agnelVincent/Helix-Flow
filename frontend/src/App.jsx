import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks     from './pages/Tasks';
import Calendar  from './pages/Calendar';
import './styles/global.css';


function App() {

  return (
<BrowserRouter>
      {/* AuthProvider must wrap everything so useAuth() works everywhere */}
      <AuthProvider>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a35',
              color: '#f1f0ff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/login" element={<Login />} />
          {/* ── Protected routes — require valid session ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks"     element={<Tasks />} />
            <Route path="/calendar"  element={<Calendar />} />
          </Route>
          {/* ── Fallback ── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
