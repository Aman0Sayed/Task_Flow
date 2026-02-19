import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAppSelector } from '../hooks/hook';
import type { RootState } from '../app/store';

interface DataState {
  tasks: any[];
  projects: any[];
  teams: any[];
  users: any[];
  activities: any[];
  isLoading: boolean;
  error: string | null;
}

interface DataContextType extends DataState {
  refetchData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { token, isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  const [data, setData] = useState<DataState>({
    tasks: [],
    projects: [],
    teams: [],
    users: [],
    activities: [],
    isLoading: false,
    error: null,
  });

  const BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchAllData = async () => {
    if (!token || !isAuthenticated) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [tasksRes, projectsRes, teamsRes, usersRes, activitiesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/tasks`, { headers }),
        fetch(`${BASE_URL}/api/projects`, { headers }),
        fetch(`${BASE_URL}/api/teams`, { headers }),
        fetch(`${BASE_URL}/api/users`, { headers }),
        fetch(`${BASE_URL}/api/activities`, { headers }),
      ]);

      const [tasksData, projectsData, teamsData, usersData, activitiesData] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        teamsRes.json(),
        usersRes.json(),
        activitiesRes.json(),
      ]);

      setData({
        tasks: tasksData.data || tasksData || [],
        projects: projectsData.data || projectsData || [],
        teams: teamsData.data || teamsData || [],
        users: usersData.data || usersData || [],
        activities: activitiesData.data || activitiesData || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }));
    }
  };

  const refetchData = () => {
    fetchAllData();
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllData();
    }
  }, [isAuthenticated, token]);

  const value = {
    ...data,
    refetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}