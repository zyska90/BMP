import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RecomputeAllButton from './RecomputeAllButton';

async function getMatches() {
  const token = cookies().get('token')?.value;
  if (!token) return [];
  const res = await fetch(`${process.env.API_URL}/admin/matches`, {
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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-success text-white' : score >= 60 ? 'bg-brand-500 text-white' : score >= 50 ? 'bg-warn text-white' : 'bg-gray-200 text-gray-600';
  return <span className={`${color} text-xs font-bold px-2.5 py-1 rounded-full`}>{score}</span>;
}

function Avatar({ user }: { user: any }) {
  if (!user) return <div className="w-8 h-8 rounded-full bg-gray-200" />;
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
      {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : user.fullName?.charAt(0) || '?'}
    </div>
  );
}

export default async function AdminMatchesPage() {
  const [me, matches] = await Promise.all([getMe(), getMatches()]);
  if (!me || me.role !== 'admin') redirect('/login');

  const above60 = matches.filter((m: any) => m.totalScore >= 60).length;
  const above50 = matches.filter((m: any) => m.totalScore >= 50 && m.totalScore < 60).length;
  const below50 = matches.filter((m: any) => m.totalScore < 50).length;

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Match Pairs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {matches.length} unique pairs · {above60} above 60 · {above50} between 50–60 · {below50} below 50
          </p>
        </div>
        <RecomputeAllButton />
      </div>

      {/* Score legend */}
      <div className="flex gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-success inline-block" /> Score ≥ 80</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-brand-500 inline-block" /> 60–79</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-warn inline-block" /> 50–59</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> &lt; 50</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User A</div>
          <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User B</div>
          <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Score</div>
          <div className="col-span-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score Breakdown</div>
        </div>

        {matches.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No match pairs computed yet</div>
        ) : matches.map((match: any, i: number) => (
          <div key={i} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/50">
            {/* User A */}
            <div className="col-span-3 flex items-center gap-2 min-w-0">
              <Avatar user={match.userA} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{match.userA?.fullName || '—'}</p>
                <p className="text-xs text-gray-500 truncate">{match.userA?.company || ''}</p>
              </div>
            </div>

            {/* User B */}
            <div className="col-span-3 flex items-center gap-2 min-w-0">
              <Avatar user={match.userB} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{match.userB?.fullName || '—'}</p>
                <p className="text-xs text-gray-500 truncate">{match.userB?.company || ''}</p>
              </div>
            </div>

            {/* Total score */}
            <div className="col-span-1 flex justify-center">
              <ScoreBadge score={match.totalScore} />
            </div>

            {/* Breakdown bars */}
            <div className="col-span-5 space-y-1">
              {[
                { label: 'Intent', value: match.intentScore, max: 30 },
                { label: 'Expertise', value: match.expertiseScore, max: 25 },
                { label: 'Industry', value: match.industryScore, max: 20 },
                { label: 'Scale', value: match.scaleScore, max: 15 },
                { label: 'Geo', value: match.geoScore, max: 10 },
              ].map(({ label, value, max }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-14 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-6 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
