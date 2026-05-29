'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserCheck, UserX, RefreshCw, CheckCircle, AlertCircle, MapPin, Building2, ExternalLink, TrendingUp, Calendar } from 'lucide-react';

function Avatar({ user }: { user: any }) {
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
      {user.photoUrl
        ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
        : <span>{user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}</span>
      }
    </div>
  );
}

function UserCard({ user, onToggle, acting }: { user: any; onToggle: (id: number, status: string) => Promise<void>; acting: number | null }) {
  const isActive = user.accountStatus === 'active';

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Avatar user={user} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-semibold text-gray-900 text-sm">{user.fullName || user.username}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isActive ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{user.title}{user.company ? ` · ${user.company}` : ''}</p>
            <p className="text-xs text-gray-400">@{user.username}</p>
          </div>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {user.city && (
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
              <MapPin size={10} /> {user.city}
            </span>
          )}
          {user.companySize && (
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
              <Building2 size={10} /> {user.companySize}
            </span>
          )}
          {user.isOpenToRemote && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Remote OK</span>
          )}
        </div>

        {/* Profile completeness */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Profile</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-700">{user.profileCompleteness}%</span>
              {user.hasCompletedProfile
                ? <CheckCircle size={11} className="text-success" />
                : <AlertCircle size={11} className="text-warn" />
              }
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${user.hasCompletedProfile ? 'bg-success' : 'bg-warn'}`}
              style={{ width: `${user.profileCompleteness}%` }} />
          </div>
        </div>

        {/* Intent preview */}
        {user.intentOffer && (
          <div className="p-2.5 bg-gray-50 rounded-lg mb-3">
            <p className="text-xs font-semibold text-brand-500 mb-0.5">Offers</p>
            <p className="text-xs text-gray-600 line-clamp-2">{user.intentOffer}</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="px-5 py-3 border-t border-gray-100 grid grid-cols-2 gap-3 bg-gray-50/30">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-brand-500" />
          <span className="text-xs text-gray-500">Matches</span>
          <span className="text-xs font-bold text-gray-900 ml-auto">{user.matchCount ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-purple-500" />
          <span className="text-xs text-gray-500">Meetings</span>
          <span className="text-xs font-bold text-gray-900 ml-auto">{(user.meetingsSentCount ?? 0) + (user.meetingsReceivedCount ?? 0)}</span>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <Link href={`/admin/users/${user.id}`}
          className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline">
          View detail <ExternalLink size={11} />
        </Link>
        <button
          onClick={() => onToggle(user.id, user.accountStatus)}
          disabled={acting === user.id}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
            isActive ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-success/10 hover:bg-success/20 text-success'
          }`}
        >
          {isActive ? <><UserX size={11} /> Deactivate</> : <><UserCheck size={11} /> Activate</>}
        </button>
      </div>
    </div>
  );
}

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers.filter((u: any) => u.role !== 'admin'));
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const refresh = async () => {
    setRefreshing(true);
    const res = await fetch('/api/proxy/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.filter((u: any) => u.role !== 'admin'));
    }
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

  const filtered = filter === 'all' ? users : users.filter(u => u.accountStatus === filter);
  const activeCount = users.filter(u => u.accountStatus === 'active').length;
  const inactiveCount = users.filter(u => u.accountStatus === 'inactive').length;

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">{activeCount} active · {inactiveCount} inactive</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="p-2 rounded-lg border border-gray-700 hover:border-brand-400 text-gray-400 transition-colors">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === f ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No users</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(user => (
            <UserCard key={user.id} user={user} onToggle={toggleStatus} acting={acting} />
          ))}
        </div>
      )}
    </div>
  );
}
