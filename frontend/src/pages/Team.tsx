import React, { useEffect, useState } from "react";
import Avatar from "../components/ui/Avatar";
import AddTeamMemberModal from "../components/modals/AddTeamMemberModal";


// Fetch users from backend
const Team: React.FC = () => {
	const [users, setUsers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAddMember, setShowAddMember] = useState(false);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const token = localStorage.getItem('token');
				const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
				const res = await fetch(`${BASE_URL}/api/users`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const data = await res.json();
				if (data.success && Array.isArray(data.data)) {
					setUsers(data.data);
				} else {
					setUsers([]);
					setError('Failed to fetch users');
				}
			} catch (err) {
				setError('Failed to fetch users');
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	}, []);

	const handleAddMemberSuccess = () => {
		setLoading(true);
		setError(null);
		const fetchUsers = async () => {
			try {
				const token = localStorage.getItem('token');
				const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
				const res = await fetch(`${BASE_URL}/api/users`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const data = await res.json();
				if (data.success && Array.isArray(data.data)) {
					setUsers(data.data);
				} else {
					setUsers([]);
					setError('Failed to fetch users');
				}
			} catch (err) {
				setError('Failed to fetch users');
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
			<div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Team Members</h1>
					<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={() => setShowAddMember(true)}>
						Add new team member
					</button>
				</div>
				{loading ? (
					<div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
				) : error ? (
					<div className="text-center text-red-500">{error}</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
						{users.map((user) => (
							<div
								key={user._id || user.id || user.email}
								className="flex flex-col items-center bg-gray-50 dark:bg-gray-900 rounded-xl p-4 shadow group hover:shadow-xl transition"
							>
								<Avatar src={user.avatar} name={user.name} size="lg" />
								<div className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
									{user.name}
								</div>
								<div className="text-sm text-gray-400 mb-2 dark:text-gray-400">{user.email}</div>
							</div>
						))}
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
			<AddTeamMemberModal isOpen={showAddMember} onClose={() => setShowAddMember(false)} onSuccess={handleAddMemberSuccess} />
		</div>
	);
};

export default Team;