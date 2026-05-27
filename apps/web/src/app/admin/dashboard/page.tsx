import { cookies } from 'next/headers';
import Link from 'next/link';
import { ClipboardList, Users, CheckCircle, Clock, ArrowRight } from 'lucide-react';

async function getRegistrations() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return [];
  try {
    const res = await fetch(`${process.env.API_URL}/admin/registrations`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AdminDashboardPage() {
  const registrations: any[] = await getRegistrations();

  const pending = registrations.filter((r) => r.status === 'pending');
  const approved = registrations.filter((r) => r.status === 'approved');
  const rejected = registrations.filter((r) => r.status === 'rejected');

  const stats = [
    { label: 'Pending Review', value: pending.length, icon: Clock, color: 'text-warn', bg: 'bg-warn/5 border-warn/20' },
    { label: 'Approved', value: approved.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/5 border-success/20' },
    { label: 'Total Registrations', value: registrations.length, icon: ClipboardList, color: 'text-brand-500', bg: 'bg-brand-500/5 border-brand-500/20' },
    { label: 'Active Users', value: approved.length, icon: Users, color: 'text-accent-dark', bg: 'bg-accent-mid/5 border-accent-mid/20' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview for the current cohort</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`p-5 bg-white border rounded-xl ${bg}`}>
            <Icon size={18} className={`${color} mb-3`} />
            <p className="font-display text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending registrations — action queue */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-gray-900 text-sm">Pending Registrations</h2>
            <p className="text-xs text-gray-500 mt-0.5">Review and approve to issue platform credentials</p>
          </div>
          <Link
            href="/admin/registrations"
            className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1"
          >
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
                <span className="text-xs font-semibold bg-warn/10 text-warn px-2 py-0.5 rounded-full flex-shrink-0">
                  Pending
                </span>
                <Link
                  href="/admin/registrations"
                  className="text-xs font-semibold text-brand-500 hover:underline flex-shrink-0"
                >
                  Review
                </Link>
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
          { href: '/admin/registrations', label: 'Manage Registrations', desc: 'Approve, reject, or review all submissions' },
          { href: '/admin/users', label: 'Manage Users', desc: 'Activate, deactivate, or edit user profiles' },
          { href: '/admin/tags', label: 'Tags & Industries', desc: 'Manage expertise tags and industry categories' },
        ].map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-500 hover:shadow-sm transition-all group"
          >
            <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-500 transition-colors">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
