import { useState, useEffect, useCallback } from 'react';
import { X, Users, UserPlus } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAppSelector } from '../../hooks/hook';

interface TeamOwner {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  companyName?: string;
}

interface TeamMemberUser {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  owner: TeamOwner | string | null;
  members: {
    user?: TeamMemberUser | string | null;
    role: string;
  }[];
  createdAt: string;
  hasPendingRequest?: boolean;
}

interface BrowseTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRequest: () => void;
}

export default function BrowseTeamsModal({ isOpen, onClose, onJoinRequest }: BrowseTeamsModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const authToken = useAppSelector((state) => state.auth.token);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authToken || localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please login again.');
        return;
      }
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/teams/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const receivedTeams = Array.isArray(data.data) ? data.data : [];
        console.log('BrowseTeamsModal: Received teams data:', receivedTeams);
        console.log('BrowseTeamsModal: Current user:', user);
        setTeams(receivedTeams);
      } else {
        console.error('BrowseTeamsModal: API returned error:', data);
        setError(data?.message || 'Failed to load teams');
      }
    } catch {
      setError('Error loading teams');
    } finally {
      setLoading(false);
    }
  }, [user, authToken]);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen, fetchTeams]);

  const handleJoinRequest = async (teamId: string) => {
    try {
      setJoiningTeam(teamId);
      const token = authToken || localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please login again.');
        return;
      }
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/teams/${teamId}/join-request`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        onJoinRequest();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to send join request');
      }
    } catch {
      setError('Error sending join request');
    } finally {
      setJoiningTeam(null);
    }
  };

  if (!isOpen) return null;

  const getOwner = (team: Team): TeamOwner | null => {
    return team.owner && typeof team.owner === 'object' ? team.owner : null;
  };

  const getPopulatedMembers = (team: Team): TeamMemberUser[] => {
    return team.members
      .map((member) => (member.user && typeof member.user === 'object' ? member.user : null))
      .filter((member): member is TeamMemberUser => !!member && !!member._id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-white shadow-xl dark:bg-gray-800 overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Browse Teams
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Find teams to join and send join requests
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading teams...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No teams available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                (() => {
                  const owner = getOwner(team);
                  const populatedMembers = getPopulatedMembers(team);
                  const totalMembers = team.members.filter((member) => !!member.user).length;
                  const isPending = !!team.hasPendingRequest;

                  return (
                    <div
                      key={team._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {team.name}
                          </h3>
                          {team.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {team.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleJoinRequest(team._id)}
                          disabled={joiningTeam === team._id || isPending}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {joiningTeam === team._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          {joiningTeam === team._id
                            ? 'Sending...'
                            : isPending
                            ? 'Request Pending'
                            : 'Join Request'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Avatar src={owner?.avatar} name={owner?.name || 'Unknown'} size="sm" />
                          <div className="flex flex-col">
                            <span>Owner: {owner?.name || 'Unknown'}</span>
                            {owner?.companyName && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Company: {owner.companyName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{totalMembers} members</span>
                        </div>
                      </div>

                      {populatedMembers.length > 0 && (
                        <div className="mt-3 flex -space-x-2">
                          {populatedMembers.slice(0, 5).map((member) => (
                            <Avatar
                              key={member._id}
                              src={member.avatar}
                              name={member.name || 'User'}
                              size="sm"
                              className="ring-2 ring-white dark:ring-gray-800"
                            />
                          ))}
                          {populatedMembers.length > 5 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 ring-2 ring-white dark:ring-gray-800">
                              +{populatedMembers.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
