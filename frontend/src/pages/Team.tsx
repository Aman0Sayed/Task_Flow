import React, { useCallback, useEffect, useState } from "react";
import Avatar from "../components/ui/Avatar";
import AddTeamMemberModal from "../components/modals/AddTeamMemberModal";
import AddTeamModal from "../components/modals/AddTeamModal";
import BrowseTeamsModal from "../components/modals/BrowseTeamsModal";
import { useAppSelector } from "../hooks/hook";
import { isManager } from "../lib/managerUtils";

const Team: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
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

      // Fetch available users
      const availableRes = await fetch(`${BASE_URL}/api/users/available`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const availableData = await availableRes.json();

      if (availableData.success && Array.isArray(availableData.data)) {
        setAvailableUsers(availableData.data);
      } else {
        setAvailableUsers([]);
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

    const isOwner = team.owner?._id === user.id || team.owner === user.id;
    if (isOwner) return true;

    const member = team.members.find(
      (m: any) => m.user?._id === user.id || m.user === user.id
    );
    const isAdmin = member && (member.role === "admin" || member.role === "lead");
    return isAdmin;
  };

  const handleAddMemberSuccess = () => {
    fetchTeamData();
  };

  const handleCreateTeamSuccess = () => {
    fetchTeamData();
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
            {teams.length > 0 ? (
              canAddMembers(teams[0]) && (
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  onClick={() => setShowAddMember(true)}
                >
                  Add new team member
                </button>
              )
            ) : isManager(user ?? undefined) ? (
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                onClick={() => setShowCreateTeam(true)}
              >
                Create Team
              </button>
            ) : hasPendingJoinRequest ? (
              <button
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg cursor-not-allowed opacity-80"
                disabled
              >
                Join Request Pending
              </button>
            ) : (
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
            {isManager(user ?? undefined) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Available Members
                </h2>
                {availableUsers.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No available members
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {availableUsers.map((availableUser) => (
                      <div
                        key={availableUser._id || availableUser.id || availableUser.email}
                        className="flex flex-col items-center bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow group hover:shadow-xl transition border border-green-200 dark:border-green-800"
                      >
                        <Avatar src={availableUser.avatar} name={availableUser.name} size="lg" />
                        <div className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                          {availableUser.name}
                        </div>
                        <div className="text-sm text-gray-400 mb-2 dark:text-gray-400">
                          {availableUser.email}
                        </div>
                        <div className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                          Available
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Some basic stats about your team activity
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="py-2 px-4 text-gray-500">Stats name</th>
                  <th className="py-2 px-4 text-gray-500">Monthly Stats</th>
                  <th className="py-2 px-4 text-gray-500">Progress</th>
                  <th className="py-2 px-4 text-gray-500">Last Month</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4">Time in use</td>
                  <td className="py-2 px-4">52 minutes</td>
                  <td className="py-2 px-4 text-green-600 font-bold">+4.4%</td>
                  <td className="py-2 px-4">+2.3%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Tasks done</td>
                  <td className="py-2 px-4">126</td>
                  <td className="py-2 px-4 text-green-600 font-bold">+9.2%</td>
                  <td className="py-2 px-4">+7.1%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">Responses</td>
                  <td className="py-2 px-4">260</td>
                  <td className="py-2 px-4 text-green-600 font-bold">+2.1%</td>
                  <td className="py-2 px-4">+1.8%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default Team;
