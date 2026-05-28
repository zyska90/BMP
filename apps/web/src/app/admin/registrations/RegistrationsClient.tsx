'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-warn/10 text-warn',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-red-50 text-red-500'
};

function Row({ reg, onApprove, onReject }: { reg: any; onApprove: (id: number) => Promise<void>; onReject: (id: number) => Promise<void> }) {
  const [acting, setActing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handle = async (fn: (id: number) => Promise<void>) => {
    setActing(true);
    await fn(reg.id);
    setActing(false);
  };

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="px-5 py-3.5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{reg.fullName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[reg.status]}`}>
              {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{reg.email} · {reg.roleType || 'unspecified'}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {reg.status === 'pending' && (
            <>
              <button onClick={() => handle(onApprove)} disabled={acting}
                className="flex items-center gap-1 px-3 py-1.5 bg-success/10 hover:bg-success/20 text-success text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                <CheckCircle size={12} /> Approve
              </button>
              <button onClick={() => handle(onReject)} disabled={acting}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                <XCircle size={12} /> Reject
              </button>
            </>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div><span className="text-gray-400">Role type: </span><span className="text-gray-700">{reg.roleType || '—'}</span></div>
            <div><span className="text-gray-400">Status: </span><span className="text-gray-700">{reg.status}</span></div>
            <div className="col-span-2"><span className="text-gray-400">Submission ID: </span><span className="text-gray-700 font-mono">{reg.tallySubmissionId || '—'}</span></div>
            {reg.reviewedAt && <div className="col-span-2"><span className="text-gray-400">Reviewed: </span><span className="text-gray-700">{new Date(reg.reviewedAt).toLocaleString()}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegistrationsClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const token = () => document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] || '';

  const refresh = async () => {
    setRefreshing(true);
    const res = await fetch('/api/proxy/admin/registrations');
    if (res.ok) setData(await res.json());
    setRefreshing(false);
  };

  const approve = async (id: number) => {
    await fetch(`/api/proxy/admin/registrations/${id}/approve`, { method: 'POST' });
    await refresh();
  };

  const reject = async (id: number) => {
    await fetch(`/api/proxy/admin/registrations/${id}/reject`, { method: 'POST' });
    await refresh();
  };

  const filtered = filter === 'all' ? data : data.filter(r => r.status === filter);
  const counts = { pending: data.filter(r => r.status === 'pending').length, approved: data.filter(r => r.status === 'approved').length, rejected: data.filter(r => r.status === 'rejected').length };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Registrations</h1>
          <p className="text-sm text-gray-500 mt-1">{counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="p-2 rounded-lg border border-gray-700 hover:border-brand-400 text-gray-400 transition-colors disabled:opacity-50">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-800 p-1 rounded-lg w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === f ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && counts[f] > 0 && <span className="ml-1.5 text-xs opacity-70">({counts[f]})</span>}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Clock size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No {filter === 'all' ? '' : filter} registrations</p>
          </div>
        ) : (
          filtered.map(reg => (
            <Row key={reg.id} reg={reg} onApprove={approve} onReject={reject} />
          ))
        )}
      </div>
    </div>
  );
}
