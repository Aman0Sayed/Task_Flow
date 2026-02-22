import { useState } from 'react';
import { Check, X, Copy, Mail, Calendar, Badge, Shield, MapPin } from 'lucide-react';
import { useAppSelector } from '../hooks/hook';

export default function Profile() {
  const user = useAppSelector((state) => state.auth.user);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Copy TaskFlow ID to clipboard
  const copyTaskflowId = async () => {
    if (user?.taskflowId) {
      await navigator.clipboard.writeText(`@${user.taskflowId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Profile Header */}
      <div className="relative">
        {/* Background banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg shadow-md"></div>

        {/* Profile info card */}
        <div className="mx-auto px-6 pb-6">
          <div className="card relative -mt-16 shadow-xl">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
                {/* Avatar */}
                <div className={`flex-shrink-0 h-32 w-32 rounded-lg ${getAvatarColor(user?.name || '')} flex items-center justify-center text-5xl font-bold text-white shadow-lg border-4 border-white dark:border-gray-900`}>
                  {getInitials(user?.name || '')}
                </div>

                {/* Header info */}
                <div className="flex-1 pt-4 sm:pt-0">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {user?.name}
                  </h1>

                  {/* TaskFlow ID Section - Prominent */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Your TaskFlow ID
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                        @{user?.taskflowId}
                      </code>
                      <button
                        onClick={copyTaskflowId}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Share your TaskFlow ID to collaborate with others
                    </p>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${getRoleBadgeColor(user?.role || '')}`}>
                      <Shield className="w-4 h-4" />
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm font-semibold">
                      ✓ Active
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 sm:pt-0">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition text-sm"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Projects</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Teams</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">0</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Days</div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Badge className="w-5 h-5" />
                Contact Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-base text-gray-900 dark:text-white font-mono">{user?.email}</p>
                </div>
              </div>

              {/* Tenant ID */}
              <div className="flex items-start gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0 pt-1">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workspace ID</p>
                  <p className="text-sm text-gray-900 dark:text-white font-mono break-all">{user?.tenantId?.substring(0, 16)}...</p>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-start gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0 pt-1">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="text-base text-gray-900 dark:text-white">February 23, 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">About</h3>
            </div>
            <div className="p-6">
              {isEditing ? (
                <textarea
                  rows={4}
                  defaultValue="Add a bio to tell others about yourself..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  👋 Hi! I'm using TaskFlow to manage my projects and collaborate with my team. Feel free to connect with me using my TaskFlow ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">@{user?.taskflowId}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Share Profile</h3>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-medium text-sm transition">
                Copy Profile Link
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 font-medium text-sm transition">
                Share TaskFlow ID
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 font-medium text-sm transition">
                Generate QR Code
              </button>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Privacy</h3>
            </div>
            <div className="p-6 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show profile publicly</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow collaboration invites</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show activity status</span>
              </label>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Account</h3>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm transition">
                Change Password
              </button>
              <button className="w-full px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-medium text-sm transition">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit mode form (at bottom) */}
      {isEditing && (
        <div className="px-6 pb-6">
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Edit Profile</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input type="text" defaultValue={user?.name} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input type="email" defaultValue={user?.email} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                  <input type="text" placeholder="Add your location" className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input type="text" placeholder="Your job title" className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition">
                  <X className="w-4 h-4 inline mr-2" />
                  Cancel
                </button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition">
                  <Check className="w-4 h-4 inline mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}