import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Users, Tag, LogOut, TrendingUp, Calendar } from 'lucide-react';

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
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/matches', label: 'Match Pairs', icon: TrendingUp },
  { href: '/admin/meetings', label: 'Meetings', icon: Calendar },
  { href: '/admin/tags', label: 'Tags & Industries', icon: Tag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getMe();
  if (!user || user.role !== 'admin') redirect('/login');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Admin sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-950 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-display font-bold text-xs text-white">
              BL
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm">
                BizLink<span className="text-brand-400">.</span>
              </span>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Admin identity */}
        <div className="px-5 py-3.5 border-b border-gray-800">
          <p className="text-xs text-gray-500 mb-0.5">Signed in as admin</p>
          <p className="text-sm font-medium text-gray-300 truncate">{user.fullName || user.username}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-gray-800 pt-3">
          <Link
            href="/api/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors w-full"
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
