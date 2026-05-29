import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Edit, MapPin, Building2, Users, Globe, Phone, Linkedin, CheckCircle, AlertCircle, Tag } from 'lucide-react';

async function getProfile() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.API_URL}/users/me`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const COMPANY_SIZE_LABEL: Record<string, string> = {
  'Solo': 'Solo / Freelancer',
  '2-10': '2–10 people',
  '11-50': '11–50 people',
  '51-200': '51–200 people',
  '200+': '200+ people',
};

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  const completeness: number = profile.profileCompleteness ?? 0;
  const isComplete = profile.hasCompletedProfile;

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">How you appear to other members</p>
        </div>
        <Link
          href="/profile/setup/step/1"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Edit size={14} /> Edit Profile
        </Link>
      </div>

      {/* Completeness banner */}
      <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
        isComplete ? 'bg-success/5 border-success/20' : 'bg-warn/5 border-warn/20'
      }`}>
        {isComplete
          ? <CheckCircle size={18} className="text-success flex-shrink-0 mt-0.5" />
          : <AlertCircle size={18} className="text-warn flex-shrink-0 mt-0.5" />
        }
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold text-gray-900">
              {isComplete ? 'Profile complete — you\'re visible in match results' : `Profile ${completeness}% complete`}
            </p>
            <span className={`text-xs font-bold ${isComplete ? 'text-success' : 'text-warn'}`}>{completeness}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${isComplete ? 'bg-success' : 'bg-warn'}`}
              style={{ width: `${completeness}%` }} />
          </div>
          {!isComplete && (
            <p className="text-xs text-gray-500 mt-1.5">
              Need 80% to appear in match results. Add intent and expertise tags to reach it.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Identity card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-gray-900 text-sm">Identity</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                {profile.photoUrl
                  ? <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                  : <span>{profile.fullName?.charAt(0) || profile.username?.charAt(0) || '?'}</span>
                }
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile.fullName || <span className="text-gray-400 italic">No name set</span>}</p>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { icon: Building2, value: profile.title, label: 'Job Title' },
                { icon: Building2, value: profile.company, label: 'Company' },
                { icon: Users, value: profile.companySize ? COMPANY_SIZE_LABEL[profile.companySize] : null, label: 'Company Size' },
                { icon: Tag, value: profile.industryName, label: 'Industry' },
                { icon: MapPin, value: profile.city, label: 'City' },
                { icon: Globe, value: profile.isOpenToRemote ? 'Open to remote' : null, label: 'Remote' },
              ].map(({ icon: Icon, value, label }) => value ? (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{value}</span>
                </div>
              ) : null)}
            </div>

            {/* Contact */}
            <div className="flex flex-wrap gap-3 pt-1">
              {profile.whatsappNumber && (
                <a href={`https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-green-600 hover:underline">
                  <Phone size={12} /> {profile.whatsappNumber}
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-brand-500 hover:underline">
                  <Globe size={12} /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Intent card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-gray-900 text-sm">Business Intent</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-1.5">I offer</p>
              {profile.intentOffer
                ? <p className="text-sm text-gray-700 leading-relaxed">{profile.intentOffer}</p>
                : <p className="text-sm text-gray-400 italic">Not set — <Link href="/profile/setup/step/2" className="text-brand-500 hover:underline">add now</Link></p>
              }
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark mb-1.5">I am looking for</p>
              {profile.intentSeek
                ? <p className="text-sm text-gray-700 leading-relaxed">{profile.intentSeek}</p>
                : <p className="text-sm text-gray-400 italic">Not set — <Link href="/profile/setup/step/2" className="text-brand-500 hover:underline">add now</Link></p>
              }
            </div>
          </div>
        </div>

        {/* Expertise tags */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900 text-sm">Expertise Tags</h2>
            <span className="text-xs text-gray-400">{profile.expertiseTags?.length || 0}/8</span>
          </div>
          <div className="px-5 py-4">
            {profile.expertiseTags?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.expertiseTags.map((tag: any) => (
                  <span key={tag.id}
                    className="px-3 py-1.5 bg-brand-500/10 text-brand-700 text-xs font-medium rounded-full border border-brand-500/20">
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No tags selected — <Link href="/profile/setup/step/3" className="text-brand-500 hover:underline">add expertise tags</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
