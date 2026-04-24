import { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Building2, UserX } from 'lucide-react';
import { logout as logoutRedux, initializeAuth } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks/hook';
import { isManager } from '../lib/managerUtils';

type TeamMember = {
  user: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  } | string;
  role: string;
};

type TeamData = {
  _id: string;
  id?: string;
  name: string;
  owner?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    companyName?: string | null;
  } | string;
  members: TeamMember[];
};

type ConfirmAction = 'delete_team' | 'kick_member' | 'delete_account' | 'delete_company' | null;

export default function Settings() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  const [activeTab, setActiveTab] = useState<'account' | 'team'>('account');
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [savingTeamName, setSavingTeamName] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [kickingMemberId, setKickingMemberId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: ConfirmAction;
    title: string;
    message: string;
    confirmLabel: string;
    memberId?: string;
    memberName?: string;
  }>({
    open: false,
    action: null,
    title: '',
    message: '',
    confirmLabel: 'Confirm'
  });

  const canManageTeam = isManager(user ?? undefined);
  const { refetchData } = useData();

  const currentTeam = useMemo(() => {
    if (!teams.length) return null;
    return teams[0];
  }, [teams]);

  const currentTeamName = currentTeam?.name || 'No team';
  const displayCompanyName =
    user?.companyName ||
    (typeof currentTeam?.owner === 'object' ? currentTeam?.owner?.companyName : null) ||
    '-';

  const getUserId = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value._id || value.id || null;
  };

  const getOwnerId = (team: TeamData | null): string | null => {
    if (!team) return null;
    return getUserId(team.owner);
  };

  const isCompanyOwner = Boolean(
    canManageTeam &&
      currentTeam &&
      getOwnerId(currentTeam) &&
      getOwnerId(currentTeam) === (user?.id || null)
  );

  // Helper to safely parse API responses that might not be JSON (e.g., rate-limit text responses)
  const parseApiResponse = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: res.ok, error: text, _rawText: text, status: res.status, statusText: res.statusText };
    }
  };

  const fetchTeams = async () => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    setLoadingTeams(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/teams`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await parseApiResponse(res);

      if (!res.ok || !data?.success) {
        const errMsg = data?.error || data?.message || data?._rawText || 'Failed to fetch team data';
        throw new Error(errMsg);
      }

      const fetchedTeams = Array.isArray(data.data) ? data.data : [];
      setTeams(fetchedTeams);
      setTeamName(fetchedTeams[0]?.name || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team data');
      setTeams([]);
      setTeamName('');
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [token, user?.id]);

  useEffect(() => {
    if (!canManageTeam && activeTab === 'team') {
      setActiveTab('account');
    }
  }, [activeTab, canManageTeam]);

  const openConfirmModal = (config: {
    action: ConfirmAction;
    title: string;
    message: string;
    confirmLabel: string;
    memberId?: string;
    memberName?: string;
  }) => {
    setConfirmModal({
      open: true,
      ...config
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({
      ...prev,
      open: false
    }));
  };

  const handleRenameTeam = async () => {
    if (!currentTeam || !teamName.trim()) return;
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    setSavingTeamName(true);
    setMessage(null);
    setError(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/teams/${currentTeam._id}/rename`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: teamName.trim() })
      });
      const data = await parseApiResponse(res);

      if (!res.ok || !data?.success) {
        const errMsg = data?.error || data?.message || data?._rawText || 'Failed to rename team';
        throw new Error(errMsg);
      }

      setMessage('Team name updated.');
      await fetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename team');
    } finally {
      setSavingTeamName(false);
    }
  };

  const handleDeleteTeam = async (skipConfirm = false) => {
    if (!currentTeam) return;

    if (!skipConfirm) {
      openConfirmModal({
        action: 'delete_team',
        title: 'Delete Team?',
        message: `Delete team "${currentTeam.name}"? This cannot be undone and all members will be removed.`,
        confirmLabel: 'Delete Team'
      });
      return;
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    setDeletingTeam(true);
    setMessage(null);
    setError(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/teams/${currentTeam._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await parseApiResponse(res);

      if (!res.ok || !data?.success) {
        const errMsg = data?.error || data?.message || data?._rawText || 'Failed to delete team';
        throw new Error(errMsg);
      }

      setMessage('Team deleted successfully.');
      await fetchTeams();
      try { refetchData(); } catch (e) { /* ignore if provider not present */ }
      dispatch(initializeAuth());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    } finally {
      setDeletingTeam(false);
    }
  };

  const handleKickMember = async (memberId: string, memberName: string, skipConfirm = false) => {
    if (!currentTeam) return;

    if (!skipConfirm) {
      openConfirmModal({
        action: 'kick_member',
        title: 'Remove Team Member?',
        message: `Remove ${memberName} from the team?`,
        confirmLabel: 'Remove Member',
        memberId,
        memberName
      });
      return;
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    setKickingMemberId(memberId);
    setMessage(null);
    setError(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/teams/${currentTeam._id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await parseApiResponse(res);

      if (!res.ok || !data?.success) {
        const errMsg = data?.error || data?.message || data?._rawText || 'Failed to remove member';
        throw new Error(errMsg);
      }

      setMessage(`${memberName} removed from team.`);
      await fetchTeams();
      try { refetchData(); } catch (e) { /* ignore if provider not present */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setKickingMemberId(null);
    }
  };

  const handleDeleteAccount = async (skipConfirm = false) => {
    if (!skipConfirm) {
      openConfirmModal({
        action: 'delete_account',
        title: 'Delete Account?',
        message:
          'Delete your account permanently? If you are a manager, your team will be deleted and members will be removed.',
        confirmLabel: 'Delete Account'
      });
      return;
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    setDeletingAccount(true);
    setMessage(null);
    setError(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await parseApiResponse(res);

      if (!res.ok || !data?.success) {
        const errMsg = data?.error || data?.message || data?._rawText || 'Failed to delete account';
        throw new Error(errMsg);
      }

      localStorage.removeItem('token');
      dispatch(logoutRedux());
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const handleDeleteCompany = async (skipConfirm = false) => {
    if (!skipConfirm) {
      openConfirmModal({
        action: 'delete_company',
        title: 'Delete Company?',
        message:
          'This will delete all company teams, remove all team members, and notify affected users.',
        confirmLabel: 'Delete Company'
      });
      return;
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    setDeletingCompany(true);
    setMessage(null);
    setError(null);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/auth/company`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await parseApiResponse(res);

      if (!res.ok || !data?.success) {
        const errMsg = data?.error || data?.message || data?._rawText || 'Failed to delete company';
        throw new Error(errMsg);
      }

      setMessage('Company deleted successfully.');
      await fetchTeams();
      try { refetchData(); } catch (e) { /* ignore if provider not present */ }
      dispatch(initializeAuth());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
    } finally {
      setDeletingCompany(false);
    }
  };

  const handleConfirmAction = async () => {
    const action = confirmModal.action;
    const memberId = confirmModal.memberId;
    const memberName = confirmModal.memberName;

    closeConfirmModal();

    if (action === 'delete_team') {
      await handleDeleteTeam(true);
      return;
    }

    if (action === 'kick_member' && memberId && memberName) {
      await handleKickMember(memberId, memberName, true);
      return;
    }

    if (action === 'delete_account') {
      await handleDeleteAccount(true);
      return;
    }

    if (action === 'delete_company') {
      await handleDeleteCompany(true);
    }
  };

  const tabs: Array<{ id: 'account' | 'team'; label: string }> = [
    { id: 'account', label: 'Account' }
  ];

  if (canManageTeam) {
    tabs.push({ id: 'team', label: 'Team' });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {message && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full shrink-0 md:w-64">
          <div className="card">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="font-medium">Settings</h3>
            </div>
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'account' && (
            <div className="card space-y-6 p-5">
              <div>
                <h3 className="text-lg font-medium">Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your personal and organization account settings.
                </p>
              </div>

              <div className="grid gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Profile Name</p>
                  <p className="mt-1 text-sm font-medium">{user?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Company Name</p>
                  <p className="mt-1 text-sm font-medium">{displayCompanyName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Team Name</p>
                  <p className="mt-1 text-sm font-medium">{currentTeamName}</p>
                </div>
              </div>

            

              <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Delete Account</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700 dark:text-red-400">
                  <li>Account will be permanently deleted.</li>
                  <li>If manager, team will be deleted.</li>
                  <li>All team members will be removed and notified.</li>
                </ul>
                <button
                  onClick={() => handleDeleteAccount()}
                  disabled={deletingAccount}
                  className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && canManageTeam && (
            <div className="card space-y-6 p-5">
              <div>
                <h3 className="text-lg font-medium">Team</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Rename or delete the team and manage members.
                </p>
              </div>

              {loadingTeams ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading team data...</div>
              ) : !currentTeam ? (
                <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                  No team found for your account.
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Team Name</p>
                    <p className="mt-1 text-sm font-medium">{currentTeam.name}</p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Enter new team name"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                      />
                      <button
                        onClick={handleRenameTeam}
                        disabled={savingTeamName || !teamName.trim()}
                        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingTeamName ? 'Saving...' : 'Rename Team'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Delete Team</h4>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      Deleting team removes all members and sends top-bar notifications to affected users.
                    </p>
                    <button
                      onClick={() => handleDeleteTeam()}
                      disabled={deletingTeam}
                      className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingTeam ? 'Deleting Team...' : 'Delete Team'}
                    </button>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="text-sm font-semibold">Team Members</h4>
                    <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentTeam.members.length === 0 && (
                        <div className="py-3 text-sm text-gray-500 dark:text-gray-400">No members found.</div>
                      )}
                      {currentTeam.members.map((member) => {
                        const memberId = getUserId(member.user);
                        const memberName =
                          typeof member.user === 'string'
                            ? 'Unknown User'
                            : member.user?.name || 'Unknown User';
                        const memberEmail =
                          typeof member.user === 'string' ? '' : member.user?.email || '';
                        const isOwner = memberId && memberId === getOwnerId(currentTeam);
                        const isCurrentUser = memberId && memberId === user?.id;
                        const canKick = Boolean(memberId && !isOwner && !isCurrentUser);

                        return (
                          <div key={`${memberId || memberName}-${member.role}`} className="flex items-center justify-between py-3">
                            <div>
                              <p className="text-sm font-medium">{memberName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{memberEmail}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                {isOwner ? 'owner' : member.role}
                              </span>
                              {canKick && (
                                <button
                                  onClick={() => handleKickMember(memberId, memberName)}
                                  disabled={kickingMemberId === memberId}
                                  title="Kick member"
                                  className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold">{confirmModal.title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{confirmModal.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeConfirmModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
