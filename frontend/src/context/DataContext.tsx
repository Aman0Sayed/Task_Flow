import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
  refetchData: () => Promise<void>;
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

type SliceKey = 'tasks' | 'projects' | 'teams' | 'users' | 'activities';

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

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const inFlightRef = useRef<Promise<void> | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const lastFetchAtRef = useRef<number>(0);

  const fetchAllData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!token || !isAuthenticated) return;

      const now = Date.now();
      if (now < cooldownUntilRef.current) {
        return;
      }

      // Coalesce calls (pages can call refetchData() + the interval/focus hooks can overlap).
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      // Avoid back-to-back bursts (ex: multiple refetchData() calls in the same tick).
      if (now - lastFetchAtRef.current < 750) {
        return;
      }
      lastFetchAtRef.current = now;

      setData((prev) => ({
        ...prev,
        isLoading: opts?.silent ? prev.isLoading : true,
        error: null,
      }));

      const headers = { Authorization: `Bearer ${token}` };
      const requests: Array<{ key: SliceKey; url: string }> = [
        { key: 'tasks', url: `${BASE_URL}/api/tasks` },
        { key: 'projects', url: `${BASE_URL}/api/projects` },
        { key: 'teams', url: `${BASE_URL}/api/teams` },
        { key: 'users', url: `${BASE_URL}/api/users` },
        { key: 'activities', url: `${BASE_URL}/api/activities` },
      ];

      const doFetch = async () => {
        try {
          const results = await Promise.allSettled(
            requests.map(async (reqItem) => {
              const res = await fetch(reqItem.url, { headers });
              const payload = await res.json().catch(() => ({}));
              return { key: reqItem.key, res, payload };
            }),
          );

          const nextSlices: Partial<DataState> = {};
          const errors: string[] = [];

          for (const r of results) {
            if (r.status !== 'fulfilled') {
              errors.push('Network error while loading data');
              continue;
            }

            const { key, res, payload } = r.value;
            if (!res.ok) {
              // If we hit the backend rate limiter, back off briefly to avoid hammering.
              if (res.status === 429) {
                cooldownUntilRef.current = Date.now() + 30_000;
              }

              // Clear slice on any failure to avoid showing stale access-controlled data.
              (nextSlices as any)[key] = [];
              errors.push((payload as any)?.error || (payload as any)?.message || `Failed to load ${key}`);
              continue;
            }

            const extracted = Array.isArray(payload) ? payload : ((payload as any)?.data || []);
            (nextSlices as any)[key] = Array.isArray(extracted) ? extracted : [];
          }

          setData((prev) => ({
            ...prev,
            ...nextSlices,
            isLoading: false,
            error: errors.length ? errors[0] : null,
          }));
        } catch (err) {
          setData((prev) => ({
            ...prev,
            tasks: [],
            projects: [],
            teams: [],
            users: [],
            activities: [],
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to fetch data',
          }));
        } finally {
          inFlightRef.current = null;
        }
      };

      inFlightRef.current = doFetch();
      return inFlightRef.current;
    },
    [BASE_URL, isAuthenticated, token],
  );

  const refetchData = () => fetchAllData();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllData();
    }
  }, [fetchAllData, isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setData({
        tasks: [],
        projects: [],
        teams: [],
        users: [],
        activities: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    const refreshSilent = () => {
      fetchAllData({ silent: true });
    };

    const handleFocus = () => refreshSilent();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshSilent();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = window.setInterval(refreshSilent, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [fetchAllData, isAuthenticated, token]);

  const value = {
    ...data,
    refetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
