import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Copy, Mail, Calendar, Shield, Users, Loader } from 'lucide-react';
import { useAppSelector } from '../hooks/hook';

export default function PublicProfile() {
  const { taskflowId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    fetchProfile();
  }, [taskflowId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/collaboration/user/${taskflowId}`);
      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.message || 'User not found');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const copyTaskflowId = async () => {
    if (profile?.taskflowId) {
      await navigator.clipboard.writeText(`@${profile.taskflowId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
    ];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Home
          </a>
        </div>
      </div>
    );
  }

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
                <div className={`flex-shrink-0 h-32 w-32 rounded-lg ${getAvatarColor(profile?.name)} flex items-center justify-center text-5xl font-bold text-white shadow-lg border-4 border-white dark:border-gray-900`}>
                  {getInitials(profile?.name)}
                </div>

                {/* Header info */}
                <div className="flex-1 pt-4 sm:pt-0">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile?.name}
                  </h1>

                  {/* TaskFlow ID Section - Prominent */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                      TaskFlow ID
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                        @{profile?.taskflowId}
                      </code>
                      <button
                        onClick={copyTaskflowId}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${getRoleBadgeColor(profile?.role)}`}>
                      <Shield className="w-4 h-4" />
                      {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm font-semibold">
                      ✓ Active
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 sm:pt-0 flex-wrap">
                  <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition text-sm">
                    Create Project
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition text-sm">
                    Message
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
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Projects</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {profile?.teams?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Teams</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks</div>
            </div>
          </div>

          {/* Teams Section */}
          {profile?.teams && profile.teams.length > 0 && (
            <div className="card">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Teams ({profile.teams.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {profile.teams.map((team, idx) => (
                  <div key={idx} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition">
                    <h4 className="font-medium text-gray-900 dark:text-white">{team.name}</h4>
                    {team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{team.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Public Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Join Date */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="text-base text-gray-900 dark:text-white">
                    {new Date(profile?.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Connection</h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {currentUser ? 'You are connected' : 'Sign in to collaborate'}
                </p>
                <button className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition">
                  {currentUser ? 'Send Invite' : 'Sign In'}
                </button>
              </div>
            </div>
          </div>

          {/* Share Profile */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Share</h3>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-medium text-sm transition flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 font-medium text-sm transition">
                Share TaskFlow ID
              </button>
            </div>
          </div>

          {/* Badge Info */}
          <div className="card bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
            <div className="p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                💡 Tips
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Connect to view more details</li>
                <li>• Create projects together</li>
                <li>• Share teams and tasks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
