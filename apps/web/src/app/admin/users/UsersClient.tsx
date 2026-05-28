'use client';

import { useState } from 'react';
import { UserCheck, UserX, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<number | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    const res = await fetch('/api/proxy/admin/users');
    if (res.ok) setUsers(await res.json());
    setRefreshing(false);
  };

  const toggleStatus = async (id: number, current: string) => {
    setActing(id);
    const newStatus = current === 'active' ? 'inactive' : 'active';
    await fetch(`/api/proxy/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, accountStatus: newStatus } : u));
    setActing(null);
  };

  const regularUsers = users.filter(u => u.role !== 'admin');

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            {regularUsers.filter(u => u.accountStatus === 'active').length} active · {regularUsers.filter(u => u.accountStatus === 'inactive').length} inactive
          </p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="p-2 rounded-lg border border-gray-700 hover:border-brand-400 text-gray-400 transition-colors">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Company</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Profile</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {regularUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">No users yet</td></tr>
            ) : regularUsers.map(user => (
              <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-gray-900">{user.fullName || user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  <p className="text-sm text-gray-700">{user.company || '—'}</p>
                  <p className="text-xs text-gray-500">{user.title || ''}</p>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${user.profileCompleteness}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{user.profileCompleteness}%</span>
                    {user.hasCompletedProfile
                      ? <CheckCircle size={12} className="text-success" />
                      : <AlertCircle size={12} className="text-warn" />}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.accountStatus === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.accountStatus === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => toggleStatus(user.id, user.accountStatus)}
                    disabled={acting === user.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ml-auto ${
                      user.accountStatus === 'active'
                        ? 'bg-red-50 hover:bg-red-100 text-red-500'
                        : 'bg-success/10 hover:bg-success/20 text-success'
                    }`}
                  >
                    {user.accountStatus === 'active'
                      ? <><UserX size={12} /> Deactivate</>
                      : <><UserCheck size={12} /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
