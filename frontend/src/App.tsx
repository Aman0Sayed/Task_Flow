import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { initializeAuth } from './features/auth/authSlice';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Team from './pages/Team';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Help from './pages/Help';
import Documentation from './pages/Documentation';
import KanbanBoard from './pages/KanbanBoard';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ManagerSetup from './pages/ManagerSetup';
 
import ProtectedRoute from './components/auth/ProtectedRoute';
import UnderConstructionModal from './components/modals/UnderConstructionModal';
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
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/db-status`)
      .then(res => res.json())
      .then(data => setDbStatus(data.status))
      .catch(() => setDbStatus('error'));
  }, [dispatch]);

  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <UnderConstructionModal />
          <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/manager-setup" element={<ManagerSetup />} />

          {/* Public profile route */}
          <Route path="/profile/:taskflowId" element={<PublicProfile />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/:id" element={<TaskDetails />} />
            <Route path="team" element={<Team />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="help" element={<Help />} />
            <Route path="documentation" element={<Documentation />} />
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
