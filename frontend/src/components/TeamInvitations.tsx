import { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';

interface Invitation {
  _id: string;
  team: {
    name: string;
    description?: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  invitedAt: string;
}

interface TeamInvitationsProps {
  onUpdate: () => void;
}

export default function TeamInvitations({ onUpdate }: TeamInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/teams/invitations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (data.success) {
        setInvitations(data.data);
      } else {
        setError('Failed to load invitations');
      }
    } catch (err) {
      setError('Error loading invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/teams/invitations/${invitationId}/accept`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        onUpdate();
      } else {
        setError('Failed to accept invitation');
      }
    } catch (err) {
      setError('Error accepting invitation');
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BASE_URL}/api/teams/invitations/${invitationId}/reject`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        onUpdate();
      } else {
        setError('Failed to reject invitation');
      }
    } catch (err) {
      setError('Error rejecting invitation');
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Loading invitations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No pending invitations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        Team Invitations
      </h3>

      {invitations.map((invitation) => (
        <div
          key={invitation._id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Invited by {invitation.invitedBy.name}
                </span>
              </div>

              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                {invitation.team.name}
              </h4>

              {invitation.team.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {invitation.team.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Role: {invitation.role}</span>
                <span>Invited: {new Date(invitation.invitedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleAccept(invitation._id)}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors"
              >
                <Check className="h-4 w-4" />
                Accept
              </button>

              <button
                onClick={() => handleReject(invitation._id)}
                className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}