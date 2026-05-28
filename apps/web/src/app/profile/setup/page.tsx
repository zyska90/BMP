import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, User, Briefcase, Tag, CheckCircle } from 'lucide-react';

async function getMe() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

const steps = [
  { icon: User, label: 'Identity', desc: 'Confirm your name and company' },
  { icon: Briefcase, label: 'Intent', desc: 'What you offer and what you seek' },
  { icon: Tag, label: 'Expertise', desc: 'Your skills and specialisations' },
];

export default async function ProfileSetupPage() {
  const user = await getMe();
  if (!user) redirect('/login');
  if (user.hasCompletedProfile) redirect('/app/dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-bold text-xs text-white">BL</div>
          <span className="font-display font-bold text-gray-900">BizLink<span className="text-brand-500">.</span></span>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Set up your profile</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Welcome, <strong>{user.fullName?.split(' ')[0] || 'there'}</strong>. Complete 3 quick steps so
            the matching engine can find your best-fit connections.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          {steps.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className={`flex items-center gap-4 px-5 py-4 ${i < steps.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                Step {i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl mb-6">
          <CheckCircle size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            Your registration info is <strong>pre-filled</strong> — you only need to confirm and add a few details. Takes about 2 minutes.
          </p>
        </div>

        <Link
          href="/profile/setup/step/1"
          className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-brand-500/20"
        >
          Start profile setup <ArrowRight size={16} />
        </Link>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can edit your profile at any time after setup.
        </p>
      </div>
    </div>
  );
}
