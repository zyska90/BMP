import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getMeetings() {
  const token = cookies().get('token')?.value;
  if (!token) return [];
  const res = await fetch(`${process.env.API_URL}/admin/meetings`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return res.ok ? res.json() : [];
}

async function getMe() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  const res = await fetch(`${process.env.API_URL}/auth/me`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return res.ok ? res.json() : null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'bg-warn/10 text-warn' },
  accepted:    { label: 'Confirmed',   color: 'bg-success/10 text-success' },
  declined:    { label: 'Declined',    color: 'bg-red-50 text-red-500' },
  rescheduled: { label: 'Rescheduled', color: 'bg-gray-100 text-gray-500' },
};

const CHANNEL_LABEL: Record<string, string> = {
  WhatsApp: '💬 WhatsApp',
  Meet: '📹 Google Meet',
  Zoom: '🎥 Zoom',
};

function Avatar({ user }: { user: any }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
      {user?.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : user?.fullName?.charAt(0) || '?'}
    </div>
  );
}

export default async function AdminMeetingsPage() {
  const [me, meetings] = await Promise.all([getMe(), getMeetings()]);
  if (!me || me.role !== 'admin') redirect('/login');

  const byStatus = {
    pending: meetings.filter((m: any) => m.status === 'pending'),
    accepted: meetings.filter((m: any) => m.status === 'accepted'),
    declined: meetings.filter((m: any) => m.status === 'declined'),
    rescheduled: meetings.filter((m: any) => m.status === 'rescheduled'),
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Meeting Requests</h1>
        <p className="text-sm text-gray-500 mt-1">{meetings.length} total meeting requests across all users</p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap mb-6">
        {Object.entries(byStatus).map(([status, items]) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color} border border-current/20`}>
              <span>{cfg.label}</span>
              <span className="font-bold">{items.length}</span>
            </div>
          );
        })}
      </div>

      {/* Meeting list */}
      {meetings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-400">
          No meeting requests yet
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting: any) => {
            const cfg = STATUS_CONFIG[meeting.status] || { label: meeting.status, color: 'bg-gray-100 text-gray-500' };
            return (
              <div key={meeting.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Requester → Recipient */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar user={meeting.requester} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{meeting.requester?.fullName || '—'}</p>
                      <p className="text-xs text-gray-500">{meeting.requester?.company || ''}</p>
                    </div>
                    <div className="text-gray-300 font-bold text-lg flex-shrink-0">→</div>
                    <Avatar user={meeting.recipient} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{meeting.recipient?.fullName || '—'}</p>
                      <p className="text-xs text-gray-500">{meeting.recipient?.company || ''}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>{CHANNEL_LABEL[meeting.channel] || meeting.channel}</span>
                  <span>📅 {new Date(meeting.proposedTime).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-gray-400">Requested {new Date(meeting.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>

                {/* Intro note */}
                {meeting.introNote && (
                  <div className="mt-2.5 p-2.5 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 italic">"{meeting.introNote}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
