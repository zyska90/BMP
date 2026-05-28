'use client';

import { useState } from 'react';
import { MapPin, Building2, RefreshCw, ChevronRight, X, Phone, Linkedin, Star } from 'lucide-react';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-success text-white' : score >= 70 ? 'bg-brand-500 text-white' : 'bg-warn text-white';
  return (
    <span className={`${color} text-xs font-bold px-2.5 py-1 rounded-full`}>{score}</span>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

function ProfileModal({ match, onClose }: { match: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
              {match.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-display font-bold text-gray-900">{match.fullName || match.username}</p>
              <p className="text-sm text-gray-500">{match.title}{match.company ? ` · ${match.company}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge score={match.totalScore} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Match reason */}
          {match.reason && (
            <div className="p-3 bg-brand-500/5 border border-brand-500/15 rounded-lg">
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">Why you match</p>
              <p className="text-sm text-gray-700 capitalize">{match.reason}</p>
            </div>
          )}

          {/* Score breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Score Breakdown</p>
            <div className="space-y-1.5">
              <ScoreBar label="Intent" value={match.intentScore} max={30} />
              <ScoreBar label="Expertise" value={match.expertiseScore} max={25} />
              <ScoreBar label="Industry" value={match.industryScore} max={20} />
              <ScoreBar label="Scale" value={match.scaleScore} max={15} />
              <ScoreBar label="Location" value={match.geoScore} max={10} />
            </div>
          </div>

          {/* Intent */}
          {(match.intentOffer || match.intentSeek) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Intent</p>
              {match.intentOffer && (
                <div>
                  <p className="text-xs text-brand-500 font-semibold mb-0.5">Offers</p>
                  <p className="text-sm text-gray-700">{match.intentOffer}</p>
                </div>
              )}
              {match.intentSeek && (
                <div>
                  <p className="text-xs text-accent-dark font-semibold mb-0.5">Looking for</p>
                  <p className="text-sm text-gray-700">{match.intentSeek}</p>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="flex flex-wrap gap-3">
            {match.city && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{match.city}</span>}
            {match.companySize && <span className="flex items-center gap-1 text-xs text-gray-500"><Building2 size={11} />{match.companySize}</span>}
            {match.isOpenToRemote && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Remote OK</span>}
          </div>

          {/* Contact */}
          <div className="flex gap-3 pt-1">
            {match.whatsappNumber && (
              <a href={`https://wa.me/${match.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
                <Phone size={14} /> WhatsApp
              </a>
            )}
            {match.linkedinUrl && (
              <a href={match.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchesClient({ initialMatches }: { initialMatches: any[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [selected, setSelected] = useState<any | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  const [lastComputed, setLastComputed] = useState<string | null>(null);

  const recompute = async () => {
    setRecomputing(true);
    try {
      await fetch('/api/proxy/matches', { method: 'POST' });
      const res = await fetch('/api/proxy/matches');
      const data = await res.json();
      setMatches(data.matches || []);
      setLastComputed(new Date().toLocaleTimeString());
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Find Matches</h1>
          <p className="text-sm text-gray-500 mt-1">
            Top {matches.length} matches with score ≥ 60 — sorted by fit score
          </p>
        </div>
        <button onClick={recompute} disabled={recomputing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-brand-500 text-sm font-medium text-gray-700 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} />
          {recomputing ? 'Computing...' : 'Recompute'}
        </button>
      </div>

      {lastComputed && (
        <p className="text-xs text-gray-400 mb-4">Last computed: {lastComputed}</p>
      )}

      {matches.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={20} className="text-gray-400" />
          </div>
          <h3 className="font-display font-semibold text-gray-900 mb-2">No matches yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
            Click "Recompute" to run the matching engine, or wait for more members to join the cohort.
          </p>
          <button onClick={recompute} disabled={recomputing}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors">
            {recomputing ? 'Computing...' : 'Run Matching Engine'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matches.map((match, i) => (
            <button key={match.matchId} onClick={() => setSelected(match)}
              className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-brand-500 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                      {match.fullName?.charAt(0) || '?'}
                    </div>
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-gray-100 rounded-full text-xs font-bold text-gray-500 flex items-center justify-center border border-white">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{match.fullName || match.username}</p>
                    <p className="text-xs text-gray-500 truncate">{match.title || 'Member'}{match.company ? ` · ${match.company}` : ''}</p>
                  </div>
                </div>
                <ScoreBadge score={match.totalScore} />
              </div>

              {match.intentOffer && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                  <span className="font-medium text-brand-500">Offers: </span>{match.intentOffer}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {match.city && <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={10} />{match.city}</span>}
                  {match.isOpenToRemote && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Remote</span>}
                </div>
                <span className="text-xs text-brand-500 font-medium flex items-center gap-0.5 group-hover:gap-1 transition-all">
                  View <ChevronRight size={12} />
                </span>
              </div>

              {match.reason && (
                <p className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2 truncate capitalize">{match.reason}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && <ProfileModal match={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
