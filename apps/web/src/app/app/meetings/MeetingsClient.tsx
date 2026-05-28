'use client';

import { useState } from 'react';
import { Calendar, Check, X, Clock, Phone, RefreshCw } from 'lucide-react';

type Meeting = {
  id: number;
  status: string;
  channel: string;
  proposedTime: string;
  introNote: string;
  direction: 'sent' | 'received';
  otherUserName: string;
  otherUserTitle?: string;
  otherUserCompany?: string;
  otherUserWhatsapp?: string;
  createdAt: string;
};

const CHANNEL_LABEL: Record<string, string> = {
  WhatsApp: 'WhatsApp Call',
  Meet: 'Google Meet',
  Zoom: 'Zoom'
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });
}

function MeetingCard({ meeting, onAction }: { meeting: Meeting; onAction: (id: number, action: string) => Promise<void> }) {
  const [acting, setActing] = useState(false);

  const handle = async (action: string) => {
    setActing(true);
    await onAction(meeting.id, action);
    setActing(false);
  };

  const isReceived = meeting.direction === 'received';
  const isPending = meeting.status === 'pending';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-gray-900 text-sm">{meeting.otherUserName || 'Unknown'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isReceived ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {isReceived ? 'Incoming' : 'Outgoing'}
            </span>
          </div>
          {meeting.otherUserTitle && (
            <p className="text-xs text-gray-500">{meeting.otherUserTitle}{meeting.otherUserCompany ? ` · ${meeting.otherUserCompany}` : ''}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          meeting.status === 'accepted' ? 'bg-success/10 text-success' :
          meeting.status === 'pending' ? 'bg-warn/10 text-warn' :
          meeting.status === 'declined' ? 'bg-red-50 text-red-500' :
          'bg-gray-100 text-gray-500'
        }`}>
          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar size={12} className="text-gray-400" />
          {formatTime(meeting.proposedTime)}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Phone size={12} className="text-gray-400" />
          {CHANNEL_LABEL[meeting.channel] || meeting.channel}
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg mb-4">
        <p className="text-xs text-gray-500 mb-0.5 font-medium">Intro note</p>
        <p className="text-sm text-gray-700">{meeting.introNote}</p>
      </div>

      {/* Actions — only for received pending */}
      {isReceived && isPending && (
        <div className="flex gap-2">
          <button onClick={() => handle('accepted')} disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-success/10 hover:bg-success/20 text-success text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            <Check size={14} /> Accept
          </button>
          <button onClick={() => handle('declined')} disabled={acting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            <X size={14} /> Decline
          </button>
        </div>
      )}

      {/* WhatsApp link if accepted and channel is WhatsApp */}
      {meeting.status === 'accepted' && meeting.channel === 'WhatsApp' && meeting.otherUserWhatsapp && (
        <a href={`https://wa.me/${meeting.otherUserWhatsapp.replace(/[^0-9]/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
          <Phone size={14} /> Open WhatsApp
        </a>
      )}
    </div>
  );
}

export default function MeetingsClient({ meetings: initial }: { meetings: { pending: Meeting[]; confirmed: Meeting[]; past: Meeting[] } }) {
  const [meetings, setMeetings] = useState(initial);
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'past'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    const res = await fetch('/api/proxy/meetings');
    if (res.ok) setMeetings(await res.json());
    setRefreshing(false);
  };

  const handleAction = async (id: number, action: string) => {
    await fetch(`/api/proxy/meetings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    await refresh();
  };

  const current = meetings[tab] || [];
  const pendingCount = meetings.pending?.length || 0;

  const tabs = [
    { key: 'pending', label: 'Pending', count: meetings.pending?.length },
    { key: 'confirmed', label: 'Confirmed', count: meetings.confirmed?.length },
    { key: 'past', label: 'Past', count: meetings.past?.length },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''} need your attention` : 'Meeting requests and confirmations'}
          </p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="p-2 rounded-lg border border-gray-200 hover:border-brand-500 text-gray-500 transition-colors disabled:opacity-50">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === key ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
            {(count || 0) > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === key ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {tab === 'pending' ? 'No pending meeting requests' :
             tab === 'confirmed' ? 'No confirmed meetings yet' :
             'No past meetings'}
          </p>
          {tab === 'pending' && (
            <p className="text-gray-400 text-xs mt-1">Send a request from the Matches page</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {current.map((m: Meeting) => (
            <MeetingCard key={m.id} meeting={m} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
