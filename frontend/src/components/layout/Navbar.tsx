import { ReactNode, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout as logoutRedux } from '../../features/auth/authSlice';
import { Bell, Search, UserCircle, Settings, HelpCircle, LogOut } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import Avatar from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { useAppSelector } from '../../hooks/hook';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  children?: ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const user = useAppSelector((state) => state.auth.user);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500"></span>
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                <div className="p-3 border-b dark:border-gray-700">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No new notifications
                  </div>
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
                  </div>
                  
                  <div className="py-1">
                    {[
                      { icon: UserCircle, label: 'Profile', href: '/profile' },
                      { icon: Settings, label: 'Settings', href: '/settings' },
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