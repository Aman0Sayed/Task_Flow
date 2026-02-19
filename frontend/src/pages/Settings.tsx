import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useAppSelector } from '../hooks/hook';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('appearance');
  const [selectedTheme, setSelectedTheme] = useState('System');
  const [selectedColor, setSelectedColor] = useState('Blue');
  const [loading, setLoading] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const { setTheme, setColor } = useTheme();

  const tabs = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security & Privacy' },
    { id: 'appearance', label: 'Appearance' },
  ];

  // Load user preferences on component mount
  useEffect(() => {
    if (user?.preferences) {
      setSelectedTheme(user.preferences.theme.charAt(0).toUpperCase() + user.preferences.theme.slice(1));
      setSelectedColor(user.preferences.color);
    }
  }, [user]);

  const saveAppearanceSettings = async () => {
    setLoading(true);
    try {
      // Apply theme and color (now saves to backend automatically)
      await setTheme(selectedTheme.toLowerCase() as 'light' | 'dark' | 'system');
      await setColor(selectedColor as 'Blue' | 'Purple' | 'Green' | 'Red' | 'Orange');
      
      // Show success message
      // You can add a toast notification here
    } catch (error) {
      console.error('Error saving appearance settings:', error);
    } finally {
      setLoading(false);
    }
  };
      // Here you would make an API call to save to database
      // await api.saveUserPreferences({ theme: selectedTheme, color: selectedColor });
      
      // Show success message (you might want to add a toast notification system)
      // alert('Appearance settings saved successfully!');
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
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

        {/* Main content */}
        <div className="flex-1">
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h3 className="font-medium">Notification Settings</h3>
              </div>
              <div className="p-5">
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-sm font-medium">Email Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Task assignments', description: 'Get notified when you\'re assigned to a task' },
                        { label: 'Project updates', description: 'Receive updates about project changes' },
                        { label: 'Due date reminders', description: 'Get reminded about upcoming deadlines' },
                        { label: 'Team mentions', description: 'Notifications when someone mentions you' },
                        { label: 'Weekly reports', description: 'Receive weekly project summaries' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start justify-between">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                          </div>
                          <div className="ml-4">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Push Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Browser notifications', description: 'Show notifications in your browser' },
                        { label: 'Mobile notifications', description: 'Receive push notifications on mobile' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start justify-between">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                          </div>
                          <div className="ml-4">
                            <input
                              type="checkbox"
                              defaultChecked={item.label === 'Browser notifications'}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
                    >
                      <Check className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h3 className="font-medium">Security & Privacy</h3>
              </div>
              <div className="p-5">
                <div className="space-y-8">
                  {/* Password Section */}
                  <div>
                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Password & Authentication</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                            placeholder="Enter new password"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 sm:w-1/2"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <button className="btn btn-primary">
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Login Sessions */}
                  <div>
                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Active Sessions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">Current Session</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Chrome on Windows • Active now</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                          Current
                        </span>
                      </div>
                      <button className="btn btn-outline">
                        View All Sessions
                      </button>
                    </div>
                  </div>

                  {/* Data Export/Delete */}
                  <div>
                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Data Management</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">Export Your Data</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of all your data</p>
                        </div>
                        <button className="btn btn-outline">
                          Export
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg dark:border-red-700">
                        <div>
                          <h5 className="text-sm font-medium text-red-900 dark:text-red-100">Delete Account</h5>
                          <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account and all data</p>
                        </div>
                        <button className="btn bg-red-600 hover:bg-red-700 text-white border-red-600">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
                    >
                      <Check className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <h3 className="font-medium">Appearance Settings</h3>
              </div>
              <div className="p-5">
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-sm font-medium">Theme</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {['Light', 'Dark', 'System'].map((theme) => (
                        <div
                          key={theme}
                          onClick={() => setSelectedTheme(theme)}
                          className={`relative flex cursor-pointer flex-col items-center rounded-md border p-4 transition-all hover:border-primary-500 dark:border-gray-700 ${
                            selectedTheme === theme ? 'border-white ring-2 ring-white bg-transparent' : 'border-gray-300'
                          }`}
                        >
                          <div
                            className={`mb-3 h-12 w-full rounded-md ${
                              theme === 'Light' 
                                ? 'bg-white border border-gray-200' 
                                : theme === 'Dark' 
                                ? 'bg-gray-900' 
                                : 'bg-gradient-to-r from-white to-gray-900 border border-gray-200'
                            }`}
                          >
                            <div 
                              className={`h-2 w-8 mx-auto mt-2 rounded-full ${
                                theme === 'Light' 
                                  ? 'bg-gray-300' 
                                  : theme === 'Dark' 
                                  ? 'bg-gray-600' 
                                  : 'bg-gradient-to-r from-gray-300 to-gray-600'
                              }`} 
                            />
                          </div>
                          <span className="text-sm font-medium">{theme}</span>
                          {selectedTheme === theme && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Primary Color</h4>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      {[
                        { name: 'Blue', color: 'bg-blue-500' },
                        { name: 'Purple', color: 'bg-purple-500' },
                        { name: 'Green', color: 'bg-green-500' },
                        { name: 'Red', color: 'bg-red-500' },
                        { name: 'Orange', color: 'bg-orange-500' },
                      ].map((color) => (
                        <div
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={`relative flex cursor-pointer flex-col items-center rounded-md border p-4 transition-all hover:border-primary-500 dark:border-gray-700 ${
                            selectedColor === color.name ? 'border-white ring-2 ring-white bg-transparent' : 'border-gray-300'
                          }`}
                        >
                          <div className={`mb-2 h-8 w-8 rounded-full ${color.color}`} />
                          <span className="text-sm">{color.name}</span>
                          {selectedColor === color.name && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveAppearanceSettings}
                      disabled={loading}
                      className="flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'notifications' && activeTab !== 'security' && activeTab !== 'appearance' && (
            <div className="card p-12 text-center">
              <h3 className="text-lg font-medium">Coming Soon</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">This section is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}