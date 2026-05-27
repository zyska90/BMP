import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, User, LogOut } from 'lucide-react';

async function getMe() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/matches', label: 'Find Matches', icon: Users },
  { href: '/app/meetings', label: 'My Meetings', icon: Calendar },
  { href: '/app/profile', label: 'My Profile', icon: User },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getMe();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white">
              BL
            </div>
            <span className="font-display font-bold text-gray-900">
              BizLink<span className="text-brand-500">.</span>
            </span>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Signed in as</p>
          <p className="text-sm font-medium text-gray-900 truncate">{user.fullName || user.username}</p>
          {user.company && (
            <p className="text-xs text-gray-500 truncate">{user.company}</p>
          )}
          {/* Profile completeness bar */}
          {!user.hasCompletedProfile && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-warn font-medium">Profile incomplete</span>
                <span className="text-xs text-warn font-semibold">{user.profileCompleteness}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warn rounded-full transition-all"
                  style={{ width: `${user.profileCompleteness}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const locked = href === '/app/matches' && !user.hasCompletedProfile;
            return (
              <Link
                key={href}
                href={locked ? '/profile/setup' : href}
                title={locked ? 'Complete your profile to unlock matches' : undefined}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  locked
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                ].join(' ')}
              >
                <Icon size={16} className="flex-shrink-0" />
                {label}
                {locked && (
                  <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-normal">
                    Complete profile
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <Link
            href="/api/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
