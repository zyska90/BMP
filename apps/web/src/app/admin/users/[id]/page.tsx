import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Building2, Phone, Linkedin, Globe, CheckCircle, AlertCircle, Calendar, TrendingUp, Tag, UserX, UserCheck } from 'lucide-react';

async function getUser(id: string) {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  const res = await fetch(`${process.env.API_URL}/admin/users/${id}`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return res.ok ? res.json() : null;
}

async function getMe() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  const res = await fetch(`${process.env.API_URL}/auth/me`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return res.ok ? res.json() : null;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-warn/10 text-warn',
  accepted: 'bg-success/10 text-success',
  declined: 'bg-red-50 text-red-500',
  rescheduled: 'bg-gray-100 text-gray-500',
};

function MeetingRow({ meeting, direction }: { meeting: any; direction: 'sent' | 'received' }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${direction === 'sent' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
            {direction === 'sent' ? 'Sent' : 'Received'}
          </span>
          <p className="text-sm font-medium text-gray-900 truncate">{meeting.otherName}</p>
        </div>
        <p className="text-xs text-gray-500">{meeting.channel} · {new Date(meeting.proposedTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[meeting.status] || 'bg-gray-100 text-gray-500'}`}>
        {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
      </span>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const [me, user] = await Promise.all([getMe(), getUser(params.id)]);
  if (!me || me.role !== 'admin') redirect('/login');
  if (!user || user.error) notFound();

  const allMeetings = [
    ...user.meetingsSent.map((m: any) => ({ ...m, direction: 'sent' })),
    ...user.meetingsReceived.map((m: any) => ({ ...m, direction: 'received' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Back */}
      <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={14} /> Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
            {user.photoUrl
              ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
              : <span>{user.fullName?.charAt(0) || '?'}</span>
            }
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{user.fullName || user.username}</h1>
            <p className="text-gray-500 text-sm">{user.title}{user.company ? ` · ${user.company}` : ''}</p>
            <p className="text-gray-400 text-xs mt-0.5">@{user.username} · {user.email}</p>
          </div>
        </div>
        <form method="POST" action={`/api/proxy/admin/users/${user.id}/status`}>
          <span className={`text-sm px-3 py-1.5 rounded-lg font-medium ${user.accountStatus === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
            {user.accountStatus === 'active' ? '● Active' : '○ Inactive'}
          </span>
        </form>
      </div>

      {/* Activity summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Profile', value: `${user.profileCompleteness}%`, icon: user.hasCompletedProfile ? CheckCircle : AlertCircle, color: user.hasCompletedProfile ? 'text-success' : 'text-warn' },
          { label: 'Top Match Score', value: user.topMatches?.[0]?.score ?? '—', icon: TrendingUp, color: 'text-brand-500' },
          { label: 'Meetings Sent', value: user.activity.totalMeetingsSent, icon: Calendar, color: 'text-blue-500' },
          { label: 'Meetings Confirmed', value: user.activity.meetingsConfirmed, icon: CheckCircle, color: 'text-success' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="font-display font-bold text-gray-900 text-xl">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile details */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-display font-semibold text-gray-900 text-sm">Profile Details</h2>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {[
                { icon: Building2, value: user.company, label: 'Company' },
                { icon: MapPin, value: user.city, label: 'City' },
                { icon: Phone, value: user.whatsappNumber, label: 'WhatsApp', href: user.whatsappNumber ? `https://wa.me/${user.whatsappNumber.replace(/[^0-9]/g, '')}` : null },
                { icon: Linkedin, value: user.linkedinUrl ? 'LinkedIn Profile' : null, label: 'LinkedIn', href: user.linkedinUrl },
                { icon: Globe, value: user.websiteUrl, label: 'Website', href: user.websiteUrl },
              ].map(({ icon: Icon, value, label, href }) => value ? (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon size={13} className="text-gray-400 flex-shrink-0" />
                  {href
                    ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">{value}</a>
                    : <span className="text-gray-700">{value}</span>
                  }
                </div>
              ) : null)}
              <div className="pt-1 text-xs text-gray-400">
                Member since {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Intent */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="font-display font-semibold text-gray-900 text-sm">Business Intent</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {user.intentOffer ? (
                <div>
                  <p className="text-xs font-semibold text-brand-500 mb-1">Offers</p>
                  <p className="text-sm text-gray-700">{user.intentOffer}</p>
                </div>
              ) : <p className="text-sm text-gray-400 italic">No intent offer set</p>}
              {user.intentSeek && (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs font-semibold text-accent-dark mb-1">Looking for</p>
                  <p className="text-sm text-gray-700">{user.intentSeek}</p>
                </div>
              )}
            </div>
          </div>

          {/* Expertise tags */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Tag size={14} className="text-gray-400" />
              <h2 className="font-display font-semibold text-gray-900 text-sm">Expertise Tags ({user.expertiseTags?.length || 0})</h2>
            </div>
            <div className="px-5 py-4">
              {user.expertiseTags?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.expertiseTags.map((tag: any) => (
                    <span key={tag.id} className="px-2.5 py-1 bg-brand-500/10 text-brand-700 text-xs font-medium rounded-full border border-brand-500/20">
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 italic">No tags selected</p>}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Top matches */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp size={14} className="text-gray-400" />
              <h2 className="font-display font-semibold text-gray-900 text-sm">Top Matches</h2>
            </div>
            <div className="px-5 py-2">
              {user.topMatches?.length > 0 ? user.topMatches.map((match: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${match.score >= 70 ? 'bg-success text-white' : match.score >= 60 ? 'bg-brand-500 text-white' : 'bg-warn text-white'}`}>
                    {match.score}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{match.fullName}</p>
                    {match.company && <p className="text-xs text-gray-500 truncate">{match.company}</p>}
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400 italic py-3">No matches computed yet</p>}
            </div>
          </div>

          {/* Meeting history */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <h2 className="font-display font-semibold text-gray-900 text-sm">Meeting Activity ({allMeetings.length})</h2>
            </div>
            <div className="px-5 py-1 max-h-64 overflow-y-auto">
              {allMeetings.length > 0 ? allMeetings.map((m: any) => (
                <MeetingRow key={`${m.direction}-${m.id}`} meeting={m} direction={m.direction} />
              )) : <p className="text-sm text-gray-400 italic py-3">No meeting activity</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
