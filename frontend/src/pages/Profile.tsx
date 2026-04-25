import { useMemo, useState } from 'react';
import { Check, X, Copy, Mail, Calendar, Badge, Shield, Download } from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useAppSelector } from '../hooks/hook';
import { useData } from '../context/DataContext';

export default function Profile() {
  const user = useAppSelector((state) => state.auth.user);
  const { projects, teams, tasks } = useData();
  const [copiedType, setCopiedType] = useState<'id' | 'profile' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
    ];
    return colors[name.length % colors.length];
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

  const memberSince = useMemo(() => {
    const createdAt = (user as any)?.createdAt;
    if (!createdAt) return null;

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }, [user]);

  const memberDays = useMemo(() => {
    if (!memberSince) return 0;
    const diff = Date.now() - memberSince.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [memberSince]);

  const copyTaskflowId = async () => {
    if (!user?.taskflowId) return;
    await navigator.clipboard.writeText(`@${user.taskflowId}`);
    setCopiedType('id');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const copyProfileLink = async () => {
    if (!user?.taskflowId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/profile/${user.taskflowId}`);
    setCopiedType('profile');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadQRCode = () => {
    const qrElement = document.querySelector('canvas');
    if (qrElement) {
      const url = qrElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `taskflow-profile-${user?.taskflowId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="relative">
        <div className="h-32 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md" />

        <div className="mx-auto px-6 pb-6">
          <div className="card relative -mt-16 shadow-xl">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
                <div className={`flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-lg border-4 border-white text-5xl font-bold text-white shadow-lg dark:border-gray-900 ${getAvatarColor(user?.name || '')}`}>
                  {getInitials(user?.name || '')}
                </div>

                <div className="flex-1 pt-4 sm:pt-0">
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>

                  <div className="mb-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Your TaskFlow ID
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                        @{user?.taskflowId}
                      </code>
                      <button
                        onClick={copyTaskflowId}
                        className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedType === 'id' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Share your TaskFlow ID to collaborate with others.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-semibold ${getRoleBadgeColor(user?.role || '')}`}>
                      <Shield className="h-4 w-4" />
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 sm:pt-0">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{projects.length}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Projects</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{teams.length}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Teams</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{tasks.length}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Tasks</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{memberDays}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Days</div>
            </div>
          </div>

          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Badge className="h-5 w-5" />
                Contact Information
              </h3>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-mono text-base text-gray-900 dark:text-white">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex-shrink-0 pt-1">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workspace ID</p>
                  <p className="break-all font-mono text-sm text-gray-900 dark:text-white">
                    {user?.tenantId ? `${user.tenantId.substring(0, 16)}...` : 'Not available'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex-shrink-0 pt-1">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="text-base text-gray-900 dark:text-white">
                    {memberSince ? memberSince.toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">About</h3>
            </div>
            <div className="p-6">
              <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                Hi! I am using TaskFlow to manage projects and collaborate with my team. Feel free to connect with me using my TaskFlow ID:{' '}
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">@{user?.taskflowId}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Share Profile</h3>
            </div>
            <div className="space-y-3 p-6">
              <button
                onClick={copyProfileLink}
                className="w-full rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                {copiedType === 'profile' ? 'Copied!' : 'Copy ID'}
              </button>
              <button 
                onClick={() => setShowQRCode(true)}
                className="w-full rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
              >
                Generate QR Code
              </button>
            </div>
          </div>

          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">Privacy</h3>
            </div>
            <div className="space-y-3 p-6">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show profile publicly</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow collaboration invites</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show activity status</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Profile</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <input type="text" defaultValue={user?.name} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" defaultValue={user?.email} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button onClick={() => setIsEditing(false)} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  <X className="mr-2 inline h-4 w-4" />
                  Cancel
                </button>
                <button onClick={() => setIsEditing(false)} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700">
                  <Check className="mr-2 inline h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQRCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowQRCode(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Share Profile - QR Code</h3>
            </div>
            <div className="flex flex-col items-center gap-4 p-6">
              <div className="flex items-center justify-center rounded-lg bg-white p-4">
                <QRCode 
                  value={`${window.location.origin}/profile/${user?.taskflowId}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Scan this QR code to share your TaskFlow profile
              </p>
              <div className="w-full text-center text-xs font-mono text-gray-500 dark:text-gray-400">
                {user?.taskflowId}
              </div>

              <div className="flex w-full gap-3">
                <button 
                  onClick={downloadQRCode}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button 
                  onClick={() => setShowQRCode(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
