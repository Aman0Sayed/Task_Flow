import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/hook';
import { useData } from '../../context/DataContext';

export default function TeamRequiredRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { teams, isLoading: dataLoading } = useData();

  // Defer any redirect until auth finishes initializing.
  if (isLoading || isAuthenticated === null) return <>{children}</>;

  const role = String(user?.role || '').toLowerCase();
  if (role !== 'user') return <>{children}</>;

  const userTeams = Array.isArray((user as any)?.teams) ? (user as any).teams : null;
  const hasTeamFromAuth = Array.isArray(userTeams) ? userTeams.length > 0 : null;
  const hasTeamFromData = Array.isArray(teams) ? teams.length > 0 : null;

  // If we don't know yet, wait for data (prevents false redirects).
  if (hasTeamFromAuth === null && hasTeamFromData === null && dataLoading) return <>{children}</>;

  const hasTeam = (hasTeamFromAuth ?? false) || (hasTeamFromData ?? false);
  if (!hasTeam) {
    return <Navigate to="/team" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

