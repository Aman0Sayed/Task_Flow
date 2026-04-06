import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import AnimatedList from '../ui/AnimatedList';
import { useAppSelector } from '../../hooks/hook';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface User {
  _id: string;
  name: string;
  email: string;
  taskflowId: string;
  avatar?: string;
  role: string;
}

export default function AddTeamMemberModal({ isOpen, onClose, onSuccess }: AddTeamMemberModalProps) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all users when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSearchQuery('');
      setSelectedUser(null);
      fetchCurrentTeamAndUsers();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const fetchCurrentTeamAndUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // First get user's teams to find the current team
      const teamsRes = await fetch(`${BASE_URL}/api/teams`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const teamsData = await teamsRes.json();
      console.log('📋 Teams response:', teamsData);

      if (teamsData.success && teamsData.data && teamsData.data.length > 0) {
        const teamId = teamsData.data[0]._id;
        const currentTeamMembers = teamsData.data[0].members?.map((m: any) => m.user?._id || m.user) || [];
        console.log('✅ Current team ID:', teamId);
        console.log('👥 Current team members:', currentTeamMembers.length);
        setCurrentTeamId(teamId);

        // Try fetching users with teamId filter first
        let usersData = null;
        let usersUrl = `${BASE_URL}/api/users/search?teamId=${teamId}`;
        console.log('🔍 Attempt 1: Fetching with teamId filter from:', usersUrl);
        
        try {
          const usersRes = await fetch(usersUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          usersData = await usersRes.json();
          console.log('📊 Response from /search?teamId:', usersData);
        } catch (err) {
          console.error('❌ Error with teamId filter');
        }

        // If that returned nothing, try search without teamId
        if (!usersData || !usersData.success || usersData.data.length === 0) {
          console.log('⚠️ No users with teamId filter, trying /search without filter...');
          usersUrl = `${BASE_URL}/api/users/search`;
          try {
            const usersRes = await fetch(usersUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            usersData = await usersRes.json();
            console.log('📊 Response from /search:', usersData);
          } catch (err) {
            console.error('❌ Error with /search');
          }
        }

        // If still nothing, try the basic /users endpoint
        if (!usersData || !usersData.success || usersData.data.length === 0) {
          console.log('⚠️ Trying basic /users endpoint...');
          usersUrl = `${BASE_URL}/api/users`;
          try {
            const usersRes = await fetch(usersUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            usersData = await usersRes.json();
            console.log('📊 Response from /users:', usersData);
            
            // Filter out current user and team members manually
            const userId = currentUser?.id || currentUser?._id;
            if (usersData.success && Array.isArray(usersData.data)) {
              const filtered = usersData.data.filter((u: any) => 
                u._id !== userId && !currentTeamMembers.includes(u._id)
              );
              usersData.data = filtered;
              console.log('📊 After filtering:', usersData);
            }
          } catch (err) {
            console.error('❌ Error with /users');
          }
        }

        if (usersData && usersData.success && Array.isArray(usersData.data)) {
          console.log(`✅ Loaded ${usersData.data.length} initial users`);
          setUsers(usersData.data);
          setFilteredUsers(usersData.data);
        } else {
          console.error('❌ Failed to load users - invalid response format');
          setError('Failed to load users');
          setUsers([]);
          setFilteredUsers([]);
        }
      } else {
        console.error('❌ No teams available');
        setError('No teams available');
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError('Error fetching users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.taskflowId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      // If search is empty, show all users
      setFilteredUsers(users);
      return;
    }

    // Debounce server search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      if (!currentTeamId) {
        console.warn('❌ No team ID available for search');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const searchUrl = `${BASE_URL}/api/users/search?teamId=${currentTeamId}&search=${encodeURIComponent(query)}`;
        console.log('🔍 Searching with URL:', searchUrl);
        
        const res = await fetch(searchUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        console.log('📡 Response status:', res.status);

        if (!res.ok) {
          console.error('❌ Search request failed:', res.status, res.statusText);
          throw new Error(`Search failed: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('✅ Search response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          console.log(`📊 Found ${data.data.length} results`);
          setFilteredUsers(data.data);
          setError(null);
        } else {
          console.warn('⚠️ Invalid response format, falling back to client-side filtering');
          // Fall back to client-side filtering
          const filtered = users.filter(user =>
            user.name?.toLowerCase().includes(query.toLowerCase()) ||
            user.taskflowId?.toLowerCase().includes(query.toLowerCase()) ||
            user.email?.toLowerCase().includes(query.toLowerCase())
          );
          setFilteredUsers(filtered);
        }
      } catch (err) {
        console.error('❌ Search error:', err);
        setError(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        // Fall back to client-side filtering if server search fails
        const filtered = users.filter(user =>
          user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.taskflowId?.toLowerCase().includes(query.toLowerCase()) ||
          user.email?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredUsers(filtered);
      }
    }, 300);
  };

  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
  }, []);

  const handleSendInvitation = async () => {
    if (!selectedUser || !currentTeamId) return;

    setInviting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/teams/${currentTeamId}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: selectedUser._id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error sending invitation');
    } finally {
      setInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Invite Team Member</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 text-sm"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500 dark:text-gray-400">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? 'No users found matching your search' : 'No users available to add'}
                </div>
                {error && (
                  <div className="text-red-500 text-xs">
                    Error: {error}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-4">
                  Total in users list: {users.length}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 pt-0 h-full overflow-hidden">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Showing {filteredUsers.length} available user{filteredUsers.length !== 1 ? 's' : ''}
              </div>
              <AnimatedList
                items={filteredUsers.map(user => user._id)}
                onItemSelect={(userId: string) => {
                  const user = filteredUsers.find(u => u._id === userId);
                  if (user) handleUserSelect(user);
                }}
                renderItem={(userId: string) => {
                  const user = filteredUsers.find(u => u._id === userId);
                  if (!user) return null;
                  const isSelected = selectedUser?._id === userId;
                  return (
                    <div className={`flex items-center space-x-3 w-full p-3 rounded-md cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{user.taskflowId} • {user.email}
                        </p>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        isSelected 
                          ? 'bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {user.role}
                      </div>
                    </div>
                  );
                }}
                className="h-full"
                displayScrollbar={true}
                initialSelectedIndex={-1}
              />
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedUser ? `Selected: ${selectedUser.name}` : 'Select a user to invite'}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={!selectedUser || inviting}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
