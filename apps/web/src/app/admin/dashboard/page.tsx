import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Users, CheckCircle, Clock, ArrowRight, TrendingUp, Calendar, ExternalLink } from 'lucide-react';

async function fetchJson(path: string) {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.API_URL}${path}`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

export default async function AdminDashboardPage() {
  const [me, stats, registrations] = await Promise.all([
    fetchJson('/auth/me'),
    fetchJson('/admin/stats'),
    fetchJson('/admin/registrations'),
  ]);

  if (!me || me.role !== 'admin') redirect('/login');

  const pending = (registrations || []).filter((r: any) => r.status === 'pending');

  const statCards = [
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: Users, color: 'text-brand-500', bg: 'bg-brand-500/5 border-brand-500/20', href: '/admin/users' },
    { label: 'Profiles Complete', value: stats?.completedProfiles ?? 0, icon: CheckCircle, color: 'text-success', bg: 'bg-success/5 border-success/20', href: '/admin/users' },
    { label: 'Match Pairs', value: stats?.totalMatchPairs ?? 0, icon: TrendingUp, color: 'text-accent-dark', bg: 'bg-accent-mid/5 border-accent-mid/20', href: '/admin/matches', hint: 'Unique user pairs with computed score' },
    { label: 'Meetings Confirmed', value: stats?.confirmedMeetings ?? 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', href: '/admin/meetings' },
    { label: 'Pending Review', value: stats?.pendingRegistrations ?? 0, icon: Clock, color: 'text-warn', bg: 'bg-warn/5 border-warn/20', href: '/admin/registrations' },
    { label: 'Pending Meetings', value: stats?.pendingMeetings ?? 0, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', href: '/admin/meetings' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview — live data</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {statCards.map(({ label, value, icon: Icon, color, bg, href, hint }) => (
          <Link key={label} href={href} className={`p-5 bg-white border rounded-xl hover:shadow-sm transition-all group ${bg}`}>
            <div className="flex items-start justify-between mb-3">
              <Icon size={18} className={color} />
              <ExternalLink size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="font-display text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            {hint && <p className="text-xs text-gray-400 mt-1 italic">{hint}</p>}
          </Link>
        ))}
      </div>

      {/* Pending registrations queue */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-gray-900 text-sm">Pending Registrations</h2>
            <p className="text-xs text-gray-500 mt-0.5">Approve to issue platform credentials</p>
          </div>
          <Link href="/admin/registrations"
            className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle size={24} className="text-success mx-auto mb-2" />
            <p className="text-sm text-gray-500">No pending registrations — all caught up.</p>
          </div>
        ) : (
          <ul>
            {pending.slice(0, 5).map((reg: any) => (
              <li key={reg.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                  {reg.fullName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{reg.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{reg.email} · {reg.roleType || 'unspecified'}</p>
                </div>
                <span className="text-xs font-semibold bg-warn/10 text-warn px-2 py-0.5 rounded-full">Pending</span>
                <Link href="/admin/registrations" className="text-xs font-semibold text-brand-500 hover:underline">Review</Link>
              </li>
            ))}
            {pending.length > 5 && (
              <li className="px-5 py-3 text-center">
                <Link href="/admin/registrations" className="text-xs text-gray-500 hover:text-brand-500">
                  +{pending.length - 5} more pending
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/registrations', label: 'Manage Registrations', desc: 'Approve, reject, review submissions' },
          { href: '/admin/users', label: 'Manage Users', desc: 'Activate, deactivate, view profiles' },
          { href: '/admin/tags', label: 'Tags & Industries', desc: 'Manage expertise tags and categories' },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-500 hover:shadow-sm transition-all group">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-500 transition-colors">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
