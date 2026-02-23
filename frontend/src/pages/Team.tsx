import React, { useEffect, useState } from "react";
import Avatar from "../components/ui/Avatar";
import AddTeamMemberModal from "../components/modals/AddTeamMemberModal";
import AddTeamModal from "../components/modals/AddTeamModal";
import TeamInvitations from "../components/TeamInvitations";
import { useAuth } from "../context/AuthContext";


// Fetch users from backend
const Team: React.FC = () => {
	const { user } = useAuth();
	const [availableUsers, setAvailableUsers] = useState<any[]>([]);
	const [teamMembers, setTeamMembers] = useState<any[]>([]);
	const [teams, setTeams] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAddMember, setShowAddMember] = useState(false);
	const [showCreateTeam, setShowCreateTeam] = useState(false);

	const canAddMembers = (team: any) => {
		if (!user || !team) {
			return false;
		}
		// User can add members if they are the owner
		const isOwner = team.owner._id === user.id || team.owner === user.id;

		if (isOwner) return true;

		// Or if they are a member with admin or lead role
		const member = team.members.find((m: any) => m.user._id === user.id || m.user === user.id);
		const isAdmin = member && (member.role === 'admin' || member.role === 'lead');

		return isAdmin;
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const token = localStorage.getItem('token');
				const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

				// Fetch teams first
				const teamsRes = await fetch(`${BASE_URL}/api/teams`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const teamsData = await teamsRes.json();

				if (teamsData.success && Array.isArray(teamsData.data)) {
					setTeams(teamsData.data);
					
					// If no teams exist, show create team modal
					if (teamsData.data.length === 0) {
						setShowCreateTeam(true);
						setLoading(false);
						return;
					}
				}

				// Fetch available users
				const availableRes = await fetch(`${BASE_URL}/api/users/available`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const availableData = await availableRes.json();

				// Fetch team members
				const teamRes = await fetch(`${BASE_URL}/api/users/team-members`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const teamData = await teamRes.json();

				if (availableData.success && Array.isArray(availableData.data)) {
					setAvailableUsers(availableData.data);
				} else {
					setAvailableUsers([]);
				}

				if (teamData.success && Array.isArray(teamData.data)) {
					setTeamMembers(teamData.data);
				} else {
					setTeamMembers([]);
				}

				if (!availableData.success || !teamData.success) {
					setError('Failed to fetch users');
				}
			} catch (err) {
				setError('Failed to fetch data');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const handleAddMemberSuccess = () => {
		setLoading(true);
		setError(null);
		const fetchData = async () => {
			try {
				const token = localStorage.getItem('token');
				const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

				// Fetch teams
				const teamsRes = await fetch(`${BASE_URL}/api/teams`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const teamsData = await teamsRes.json();

				if (teamsData.success && Array.isArray(teamsData.data)) {
					setTeams(teamsData.data);
				}

				// Fetch available users
				const availableRes = await fetch(`${BASE_URL}/api/users/available`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const availableData = await availableRes.json();

				// Fetch team members
				const teamRes = await fetch(`${BASE_URL}/api/users/team-members`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const teamData = await teamRes.json();

				if (availableData.success && Array.isArray(availableData.data)) {
					setAvailableUsers(availableData.data);
				} else {
					setAvailableUsers([]);
				}

				if (teamData.success && Array.isArray(teamData.data)) {
					setTeamMembers(teamData.data);
				} else {
					setTeamMembers([]);
				}
			} catch (err) {
				setError('Failed to fetch data');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	};

	const handleCreateTeamSuccess = () => {
		setLoading(true);
		setError(null);
		const fetchData = async () => {
			try {
				const token = localStorage.getItem('token');
				const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

				// Fetch teams
				const teamsRes = await fetch(`${BASE_URL}/api/teams`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const teamsData = await teamsRes.json();

				if (teamsData.success && Array.isArray(teamsData.data)) {
					setTeams(teamsData.data);
				}

				// Fetch available users
				const availableRes = await fetch(`${BASE_URL}/api/users/available`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const availableData = await availableRes.json();

				// Fetch team members
				const teamRes = await fetch(`${BASE_URL}/api/users/team-members`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const teamData = await teamRes.json();

				if (availableData.success && Array.isArray(availableData.data)) {
					setAvailableUsers(availableData.data);
				} else {
					setAvailableUsers([]);
				}

				if (teamData.success && Array.isArray(teamData.data)) {
					setTeamMembers(teamData.data);
				} else {
					setTeamMembers([]);
				}
			} catch (err) {
				setError('Failed to fetch data');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
			<div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
				{/* Team Name Display */}
				{teams.length > 0 && (
					<div className="text-center mb-6">
						<h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
							{teams[0].name}
						</h2>
						{teams[0].description && (
							<p className="text-gray-600 dark:text-gray-400 mt-2">{teams[0].description}</p>
						)}
					</div>
				)}
				
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Team Management</h1>
					{teams.length > 0 && (
						<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={() => setShowAddMember(true)}>
							Add new team member
						</button>
					)}
				</div>

				{loading ? (
					<div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
				) : error ? (
					<div className="text-center text-red-500">{error}</div>
				) : (
					<div className="space-y-8">
						{/* Available Members Section */}
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
									{availableUsers.map((user) => (
										<div
											key={user._id || user.id || user.email}
											className="flex flex-col items-center bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow group hover:shadow-xl transition border border-green-200 dark:border-green-800"
										>
											<Avatar src={user.avatar} name={user.name} size="lg" />
											<div className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
												{user.name}
											</div>
											<div className="text-sm text-gray-400 mb-2 dark:text-gray-400">{user.email}</div>
											<div className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
												Available
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Team Members Section */}
						<div>
							<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
								Team Members
							</h2>
							{teamMembers.length === 0 ? (
								<div className="text-center text-gray-500 dark:text-gray-400 py-8">
									No team members yet
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
									{teamMembers.map((member) => {
										const isCurrentUser = member._id === user?.id;
										return (
											<div
												key={member._id || member.id || member.email}
												className="flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow group hover:shadow-xl transition border border-blue-200 dark:border-blue-800"
											>
												<Avatar src={member.avatar} name={member.name} size="lg" />
												<div className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
													{isCurrentUser ? (
														<span className="text-green-600 dark:text-green-400 font-bold">You</span>
													) : (
														member.name
													)}
												</div>
												<div className="text-sm text-gray-400 mb-2 dark:text-gray-400">{member.email}</div>
												<div className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
													{isCurrentUser ? 'Team Lead' : `In Team${member.teams && member.teams.length > 1 ? `s (${member.teams.length})` : ''}`}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Team Invitations Section */}
				<div className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-8">
					<TeamInvitations onUpdate={handleAddMemberSuccess} />
				</div>

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
			<AddTeamMemberModal isOpen={showAddMember} onClose={() => setShowAddMember(false)} onSuccess={handleAddMemberSuccess} />
			<AddTeamModal isOpen={showCreateTeam} onClose={() => setShowCreateTeam(false)} onSuccess={handleCreateTeamSuccess} />
		</div>
	);
};

export default Team;