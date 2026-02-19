import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { initializeAuth } from './features/auth/authSlice';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Help from './pages/Help';
import KanbanBoard from './pages/KanbanBoard';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
 
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const dispatch = useDispatch();
  const [, setDbStatus] = useState('unknown');

  useEffect(() => {
    // Set page title
    document.title = 'TaskFlow - Project Management System';
    
    // Initialize authentication on app startup
    dispatch(initializeAuth());
    
    // Fetch MongoDB status
    fetch('https://task-flow-backend-nowictqd0-aman0sayeds-projects.vercel.app/api/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data.status))
      .catch(() => setDbStatus('error'));
  }, [dispatch]);

  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="team" element={<Team />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="help" element={<Help />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;