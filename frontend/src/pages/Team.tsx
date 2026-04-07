import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Avatar from "../components/ui/Avatar";
import AddTeamMemberModal from "../components/modals/AddTeamMemberModal";
import AddTeamModal from "../components/modals/AddTeamModal";
import BrowseTeamsModal from "../components/modals/BrowseTeamsModal";
import { useAppSelector } from "../hooks/hook";
import { isManager } from "../lib/managerUtils";

const Team: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showBrowseTeams, setShowBrowseTeams] = useState(false);
  const [hasAutoPromptedTeamCreate, setHasAutoPromptedTeamCreate] = useState(false);
  const [hasPendingJoinRequest, setHasPendingJoinRequest] = useState(false);
  const [pendingTeamName, setPendingTeamName] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Fetch teams first
      const teamsRes = await fetch(`${BASE_URL}/api/teams`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const teamsData = await teamsRes.json();

      if (teamsData.success && Array.isArray(teamsData.data)) {
        setTeams(teamsData.data);

        if (teamsData.data.length > 0) {
          const currentTeam = teamsData.data[0];
          const ownerId = currentTeam.owner?._id || currentTeam.owner;
          const members = currentTeam.members
            .filter((member: any) => !!member.user)
            .map((member: any) => {
              const memberUser = member.user;
              const memberId = memberUser?._id || memberUser;
              const isOwnerMember = !!ownerId && !!memberId && ownerId.toString() === memberId.toString();

              return {
                ...memberUser,
                teamRole: isOwnerMember ? "owner" : (member.role || "member")
              };
            })
            .filter(Boolean);
          setTeamMembers(members);
        } else {
          setTeamMembers([]);
        }
      } else {
        setTeams([]);
        setTeamMembers([]);
      }

      // For users with no team, show pending state instead of browse prompt after request.
      if (!isManager(user ?? undefined)) {
        const browseRes = await fetch(`${BASE_URL}/api/teams/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const browseData = await browseRes.json();
        if (browseData.success && Array.isArray(browseData.data)) {
          const pendingTeam = browseData.data.find((team: any) => !!team.hasPendingRequest);
          setHasPendingJoinRequest(!!pendingTeam);
          setPendingTeamName(pendingTeam?.name || null);
        } else {
          setHasPendingJoinRequest(false);
          setPendingTeamName(null);
        }
      } else {
        setHasPendingJoinRequest(false);
        setPendingTeamName(null);
      }

    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  useEffect(() => {
    if (
      !loading &&
      teams.length === 0 &&
      isManager(user ?? undefined) &&
      !hasAutoPromptedTeamCreate
    ) {
      setShowCreateTeam(true);
      setHasAutoPromptedTeamCreate(true);
    }
  }, [loading, teams.length, user, hasAutoPromptedTeamCreate]);

  const canAddMembers = (team: any) => {
    if (!user || !team) {
      return false;
    }

    // Check if user is the owner
    const ownerId = team.owner?._id || team.owner;
    const userId = user.id || user._id;
    const isOwner = ownerId && userId && (
      ownerId.toString() === userId.toString() ||
      ownerId === userId
    );
    
    if (isOwner) return true;

    // Check if user is admin/lead member
    if (team.members && Array.isArray(team.members)) {
      const member = team.members.find((m: any) => {
        const memberId = m.user?._id || m.user;
        return memberId && userId && (
          memberId.toString() === userId.toString() ||
          memberId === userId
        );
      });
      const isAdmin = member && (member.role === "admin" || member.role === "lead");
      if (isAdmin) return true;
    }
    
    return false;
  };

  const handleAddMemberSuccess = () => {
    fetchTeamData();
  };

  const handleCreateTeamSuccess = () => {
    fetchTeamData();
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete || !teams.length) return;

    setDeletingMemberId(memberToDelete._id);
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const teamId = teams[0]._id;
      const memberId = memberToDelete._id;

      const res = await fetch(`${BASE_URL}/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        setMemberToDelete(null);
        fetchTeamData();
      } else {
        const errorData = await res.json();
        alert('Error removing member: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setDeletingMemberId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        {teams.length > 0 && (
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {teams[0].name}
            </h2>
            {(teams[0].owner?.companyName || user?.companyName) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Company: {teams[0].owner?.companyName || user?.companyName}
              </p>
            )}
            {teams[0].description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{teams[0].description}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Team Management</h1>
          <div className="flex gap-3">
            {teams.length > 0 && (
              <button
                className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 ${
                  canAddMembers(teams[0])
                    ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                    : 'bg-gray-400 cursor-not-allowed opacity-50'
                }`}
                onClick={() => canAddMembers(teams[0]) && setShowAddMember(true)}
                disabled={!canAddMembers(teams[0])}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Team Member
              </button>
            )}
            {teams.length === 0 && isManager(user ?? undefined) && (
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                onClick={() => setShowCreateTeam(true)}
              >
                Create Team
              </button>
            )}
            {teams.length === 0 && !isManager(user ?? undefined) && hasPendingJoinRequest && (
              <button
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg cursor-not-allowed opacity-80"
                disabled
              >
                Join Request Pending
              </button>
            )}
            {teams.length === 0 && !isManager(user ?? undefined) && !hasPendingJoinRequest && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                onClick={() => setShowBrowseTeams(true)}
              >
                Browse Teams
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Welcome to TeamFlow
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isManager(user ?? undefined)
                  ? "You have no team yet. Create your team to start receiving join requests."
                  : hasPendingJoinRequest
                  ? `Your join request${pendingTeamName ? ` to "${pendingTeamName}"` : ""} is pending manager approval.`
                  : "You haven't joined any teams yet. Browse available teams and send a join request."}
              </p>
              <div className="flex gap-3 justify-center">
                {isManager(user ?? undefined) ? (
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Create Team
                  </button>
                ) : hasPendingJoinRequest ? (
                  <button
                    disabled
                    className="bg-yellow-600 text-white px-6 py-3 rounded-lg cursor-not-allowed opacity-80 text-lg font-medium"
                  >
                    Request Pending Approval
                  </button>
                ) : (
                  <button
                    onClick={() => setShowBrowseTeams(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg font-medium"
                  >
                    Browse Teams to Join
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Team Members
              </h2>
              {teamMembers.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">No team members yet</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {teamMembers.map((member) => {
                    const isCurrentUser =
                      member._id === user?.id ||
                      member._id?.toString() === user?.id ||
                      member.email === user?.email;
                    const roleLabel =
                      member.teamRole === "owner"
                        ? "Owner"
                        : member.teamRole === "admin"
                        ? "Admin"
                        : member.teamRole === "lead"
                        ? "Lead"
                        : "Member";

                    return (
                      <div
                        key={member._id || member.id || member.email}
                        className="flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow group hover:shadow-xl transition border border-blue-200 dark:border-blue-800"
                      >
                        <Avatar src={member.avatar} name={member.name} size="lg" />
                        <div className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                          {member.name}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">@{member.taskflowId}</div>
                        <div className="text-sm text-gray-400 mb-2 dark:text-gray-400">{member.email}</div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            isCurrentUser
                              ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                              : "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                          }`}
                        >
                          {roleLabel}{isCurrentUser ? " (You)" : ""}
                        </div>
                        {!isCurrentUser && teams.length > 0 && (teams[0].owner?._id === user?.id || teams[0].owner === user?.id) && (
                          <button
                            onClick={() => {
                              setMemberToDelete(member);
                              setShowDeleteConfirm(true);
                            }}
                            className="mt-3 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <AddTeamMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onSuccess={handleAddMemberSuccess}
      />
      <AddTeamModal
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onSuccess={handleCreateTeamSuccess}
      />
      <BrowseTeamsModal
        isOpen={showBrowseTeams}
        onClose={() => setShowBrowseTeams(false)}
        onJoinRequest={() => {
          fetchTeamData();
        }}
      />

      {/* Delete Member Confirmation Modal */}
      {showDeleteConfirm && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Remove Team Member?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to remove <span className="font-semibold">{memberToDelete.name}</span> from the team? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMemberToDelete(null);
                }}
                disabled={deletingMemberId === memberToDelete._id}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={deletingMemberId === memberToDelete._id}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deletingMemberId === memberToDelete._id ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
