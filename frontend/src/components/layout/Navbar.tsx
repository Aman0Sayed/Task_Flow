import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { initializeAuth, logout as logoutRedux } from '../../features/auth/authSlice';
import { Bell, Search, UserCircle, Settings, HelpCircle, LogOut, Check, X, Book } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import Avatar from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { useAppSelector } from '../../hooks/hook';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface NavbarProps {
  children?: ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [processingJoinRequestId, setProcessingJoinRequestId] = useState<string | null>(null);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [companyNameFallback, setCompanyNameFallback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const { logout } = useAuth();
  const { refetchData, teams } = useData();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handledKickIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem('handledKickNotificationIds');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        handledKickIds.current = new Set(parsed.map(String));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistHandledKickIds = () => {
    try {
      localStorage.setItem('handledKickNotificationIds', JSON.stringify(Array.from(handledKickIds.current)));
    } catch {
      // ignore
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to a search results page or implement global search
      // For now, we'll navigate to tasks page with search parameter
      navigate(`/tasks?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/notifications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle accept/reject actions for team join requests and team invitations
  const handleTeamNotificationAction = async (notification: any, action: 'accept' | 'reject') => {
    try {
      if (processingJoinRequestId === notification._id) {
        return;
      }
      setProcessingJoinRequestId(notification._id);

      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const requestId = notification?.joinRequest?._id || notification?.joinRequest;
      const relatedTeamId =
        notification?.relatedTeam?._id ||
        notification?.relatedTeam ||
        notification?.joinRequest?.team?._id ||
        notification?.joinRequest?.team;

      if (!requestId) {
        // If payload is incomplete, remove stale notification from list.
        console.warn('No joinRequest ID found in notification');
        setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
        setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));
        return;
      }

      const endpoint = action === 'accept' ? 'accept' : 'reject';
      let url = '';

      if (notification.type === 'team_invitation') {
        url = `${BASE_URL}/api/teams/invitations/${requestId}/${endpoint}`;
      } else if (notification.type === 'team_join_request' && relatedTeamId) {
        url = `${BASE_URL}/api/teams/${relatedTeamId}/join-requests/${requestId}/${endpoint}`;
      } else {
        console.warn('Unsupported actionable notification payload', notification);
        setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
        setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));
        return;
      }

      console.log(`Calling ${url}`);
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok || res.status === 404) {
        // Optimistically remove the handled (or stale) invitation notification.
        setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
        setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));

        // Best effort: remove notification from backend as well.
        await fetch(`${BASE_URL}/api/notifications/${notification._id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        fetchNotifications();
      } else {
        const errorData = await res.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing team notification action:`, error);
    } finally {
      setProcessingJoinRequestId(null);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleKicked = async (notification: any) => {
    if (!notification?._id) return;

    // Avoid re-triggering every 10s polling cycle.
    if (handledKickIds.current.has(String(notification._id))) {
      return;
    }

    handledKickIds.current.add(String(notification._id));
    persistHandledKickIds();

    try {
      // Close popovers and take the user to a safe page.
      setShowNotifications(false);
      setShowUserMenu(false);
      navigate('/', { replace: true });

      // Refresh auth + all cached lists so kicked user immediately loses access everywhere.
      // Keep the kick notification unread so they still see it in the bell.
      try {
        await (dispatch as any)(initializeAuth()).unwrap();
      } catch {
        // ignore auth refresh errors; data refresh will still clear access-controlled slices
      }

      await refetchData();
    } catch (error) {
      console.error('Error handling kick notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      if (clearingNotifications) {
        return;
      }

      setClearingNotifications(true);
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Failed to clear notifications');
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setClearingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  // Auto-handle kick notification: refresh data and redirect to dashboard.
  useEffect(() => {
    const kickNotif = notifications.find((n) => n?.type === 'team_member_kicked' && n?._id);
    if (!kickNotif) return;
    if (handledKickIds.current.has(String(kickNotif._id))) return;
    handleKicked(kickNotif);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    let isCancelled = false;

    const fetchCompanyNameFallback = async () => {
      if (!user) {
        setCompanyNameFallback(null);
        return;
      }

      const userTeams = Array.isArray((user as any)?.teams) ? (user as any).teams : null;
      const hasTeam =
        (Array.isArray(userTeams) && userTeams.length > 0) ||
        (Array.isArray(teams) && teams.length > 0);

      // If the user isn't in a team, never show a company/team badge.
      if (!hasTeam) {
        setCompanyNameFallback(null);
        return;
      }

      if (user.companyName) {
        setCompanyNameFallback(null);
        return;
      }

      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        return;
      }

      try {
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const teamsRes = await fetch(`${BASE_URL}/api/teams`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!teamsRes.ok) {
          if (!isCancelled) setCompanyNameFallback(null);
          return;
        }

        const teamsData = await teamsRes.json();
        if (!isCancelled && teamsData.success && Array.isArray(teamsData.data) && teamsData.data.length > 0) {
          const fallbackCompany = teamsData.data[0]?.owner?.companyName || teamsData.data[0]?.companyName || null;
          setCompanyNameFallback(fallbackCompany);
        } else if (!isCancelled) {
          setCompanyNameFallback(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setCompanyNameFallback(null);
        }
        console.error('Error fetching company fallback:', error);
      }
    };

    fetchCompanyNameFallback();

    return () => {
      isCancelled = true;
    };
  }, [token, user, teams]);

  const displayCompanyName = (() => {
    const userTeams = Array.isArray((user as any)?.teams) ? (user as any).teams : null;
    const hasTeam =
      (Array.isArray(userTeams) && userTeams.length > 0) ||
      (Array.isArray(teams) && teams.length > 0);

    if (!hasTeam) return null;
    return user?.companyName || companyNameFallback;
  })();
  
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {children}
          
          <div className="hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <input
                type="search"
                placeholder="Search projects, tasks..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-9 w-[200px] rounded-md border border-gray-300 bg-transparent py-2 pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:placeholder:text-gray-400 lg:w-[280px]"
              />
            </form>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (showUserMenu) setShowUserMenu(false);
              }}
            >
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      disabled={clearingNotifications}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60 disabled:cursor-not-allowed dark:text-red-400 dark:hover:text-red-300"
                    >
                      {clearingNotifications ? 'Clearing...' : 'Clear'}
                    </button>
                  )}
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No new notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {notifications.slice(0, 10).map((notification) => (
                        <div 
                          key={notification._id} 
                          className={cn(
                            "p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer",
                            !notification.isRead && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                          onClick={() => !notification.isRead && markAsRead(notification._id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              {(notification.type === 'team_join_request' || notification.type === 'team_invitation') && notification.joinRequest && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTeamNotificationAction(notification, 'accept');
                                    }}
                                    disabled={processingJoinRequestId === notification._id}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 dark:text-green-400 dark:bg-green-900/30"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {processingJoinRequestId === notification._id ? 'Processing...' : 'Accept'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTeamNotificationAction(notification, 'reject');
                                    }}
                                    disabled={processingJoinRequestId === notification._id}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:text-red-400 dark:bg-red-900/30"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    {processingJoinRequestId === notification._id ? 'Processing...' : 'Reject'}
                                  </button>
                                </div>
                              )}
                            </div>
                            {!notification.isRead && (
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-2 border-t dark:border-gray-700">
                  <Link 
                    to="/notifications"
                    className="block w-full rounded-md p-2 text-center text-xs font-medium text-primary-600 hover:bg-gray-50 dark:text-primary-400 dark:hover:bg-gray-700"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="border-r h-6 mx-1 border-gray-300 dark:border-gray-600" />

          <ThemeToggle />

          {displayCompanyName && (
            <div className="hidden lg:flex items-center rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              {displayCompanyName}
            </div>
          )}

          <div className="relative">
            <button
              className="flex items-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                if (showNotifications) setShowNotifications(false);
              }}
            >
              <Avatar name={user?.name || "User"} />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                <div className="p-1">
                  <div className="border-b pb-2 pt-1 px-4 dark:border-gray-700">
                    <p className="text-sm font-medium">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
                    {displayCompanyName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {displayCompanyName}
                      </p>
                    )}
                  </div>
                  
                  <div className="py-1">
                    {[
                      { icon: UserCircle, label: 'Profile', href: '/profile' },
                      { icon: Settings, label: 'Settings', href: '/settings' },
                      { icon: Book, label: 'Documentation', href: '/documentation' },
                      { icon: HelpCircle, label: 'Help', href: '/help' },
                    ].map((item, i) => (
                      <Link
                        key={i}
                        to={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <item.icon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="border-t py-1 dark:border-gray-700">
                    <button 
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => { logout(); dispatch(logoutRedux()); navigate('/login'); }}
                    >
                      <LogOut className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
