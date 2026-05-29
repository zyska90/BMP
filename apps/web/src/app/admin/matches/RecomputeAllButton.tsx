'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function RecomputeAllButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const recompute = async () => {
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/proxy/admin/matches/recompute-all', { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setResult(`✓ ${data.computed} pairs computed`);
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-xs text-success font-medium">{result}</span>}
      <button onClick={recompute} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Computing...' : 'Recompute All'}
      </button>
    </div>
  );
}
