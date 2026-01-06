import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  examiner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  technician: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  readonly: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.list();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      setActionLoading(user.id);
      const updated = await usersApi.update(user.id, { is_active: !user.is_active });
      setUsers(users.map(u => u.id === user.id ? updated : u));
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (user: User, newRole: User['role']) => {
    try {
      setActionLoading(user.id);
      const updated = await usersApi.update(user.id, { role: newRole });
      setUsers(users.map(u => u.id === user.id ? updated : u));
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setActionLoading(userId);
      await usersApi.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingUsers = users.filter(u => !u.is_active);
  const activeUsers = users.filter(u => u.is_active);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage user accounts and approve new registrations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Pending Approvals ({pendingUsers.length})
          </h2>
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div
                key={user.id}
                className="bg-white dark:bg-zinc-800 rounded-lg p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.full_name || user.username}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                      {user.auth_provider === 'google' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Google
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={actionLoading === user.id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading === user.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user.id)}
                    disabled={actionLoading === user.id}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Users ({activeUsers.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-zinc-800">
          {activeUsers.map(user => (
            <div
              key={user.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name || user.username}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.full_name || user.username}
                    </p>
                    {user.id === currentUser?.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.auth_provider === 'google' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Google
                      </span>
                    )}
                    {user.agency && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user.agency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user, e.target.value as User['role'])}
                  disabled={actionLoading === user.id || user.id === currentUser?.id}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 focus:ring-2 focus:ring-indigo-500 ${roleColors[user.role]} disabled:opacity-50`}
                >
                  <option value="admin">Admin</option>
                  <option value="examiner">Examiner</option>
                  <option value="technician">Technician</option>
                  <option value="readonly">Read Only</option>
                </select>
                <button
                  onClick={() => handleToggleActive(user)}
                  disabled={actionLoading === user.id || user.id === currentUser?.id}
                  className="p-2 rounded-lg transition-colors disabled:opacity-50"
                  title={user.is_active ? 'Deactivate user' : 'Activate user'}
                >
                  {user.is_active ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                </button>
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => setDeleteConfirm(user.id)}
                    disabled={actionLoading === user.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete User?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This action cannot be undone. The user will be permanently removed from the system.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === deleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
