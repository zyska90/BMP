import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

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

export default async function DashboardPage() {
  const user = await getMe();
  if (!user) redirect('/login');

  const isProfileReady = user.hasCompletedProfile;
  const completeness: number = user.profileCompleteness ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Welcome back, {user.fullName?.split(' ')[0] || user.username}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user.company ? `${user.title ? user.title + ' · ' : ''}${user.company}` : 'Complete your profile to get started'}
        </p>
      </div>

      {/* Profile completeness banner — only shown if incomplete */}
      {!isProfileReady && (
        <div className="mb-6 p-5 bg-warn/5 border border-warn/20 rounded-xl flex items-start gap-4">
          <AlertCircle size={20} className="text-warn flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Your profile is {completeness}% complete
            </p>
            <p className="text-sm text-gray-500 mb-3">
              You need at least 80% to unlock match suggestions. Add your intent and expertise tags to get there.
            </p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-warn rounded-full transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <Link
              href="/profile/setup"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-warn hover:underline"
            >
              Complete your profile <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Profile ready banner */}
      {isProfileReady && (
        <div className="mb-6 p-4 bg-success/5 border border-success/20 rounded-xl flex items-center gap-3">
          <CheckCircle size={18} className="text-success flex-shrink-0" />
          <p className="text-sm font-medium text-gray-700">
            Your profile is complete — match suggestions are active.
          </p>
        </div>
      )}

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link
          href={isProfileReady ? '/app/matches' : '/profile/setup'}
          className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-brand-500 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-500/15 transition-colors">
            <Users size={20} className="text-brand-500" />
          </div>
          <h3 className="font-display font-semibold text-gray-900 mb-1">Find Matches</h3>
          <p className="text-sm text-gray-500">
            {isProfileReady
              ? 'View your top match suggestions ranked by fit score.'
              : 'Complete your profile to unlock your top 10 match suggestions.'}
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-500">
            {isProfileReady ? 'View matches' : 'Complete profile'}
            <ArrowRight size={14} />
          </div>
        </Link>

        <Link
          href="/app/meetings"
          className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-accent-dark hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 bg-accent-mid/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent-mid/15 transition-colors">
            <Calendar size={20} className="text-accent-dark" />
          </div>
          <h3 className="font-display font-semibold text-gray-900 mb-1">My Meetings</h3>
          <p className="text-sm text-gray-500">
            View pending requests and confirmed meetings for this cohort cycle.
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-dark">
            View meetings <ArrowRight size={14} />
          </div>
        </Link>
      </div>

      {/* How it works — shown only when profile is incomplete */}
      {!isProfileReady && (
        <div>
          <h2 className="font-display font-semibold text-gray-900 mb-4 text-base">How BizLink works</h2>
          <ol className="space-y-3">
            {[
              { step: '1', text: 'Complete your profile — add your intent, expertise tags, and industry.' },
              { step: '2', text: 'Review your top 10 match suggestions, scored by complementarity.' },
              { step: '3', text: 'Send a meeting request to matches that fit your goals.' },
              { step: '4', text: 'Connect via WhatsApp, Google Meet, or Zoom within the event window.' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-sm text-gray-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
