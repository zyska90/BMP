'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/app/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !passcode) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passcode })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || 'Login failed. Please verify credentials.');
        setLoading(false);
        return;
      }

      setLoading(false);
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (!data.user.hasCompletedProfile) {
        router.push('/profile/setup');
      } else {
        router.push(from);
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError('A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white flex items-center justify-center p-6 select-none">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-[420px] bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-display font-bold text-sm tracking-tight text-white shadow-md">
            BL
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-gray-100">
            BizLink<span className="text-brand-400">.</span>
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-100 mb-1">Welcome Back</h2>
        <p className="text-gray-400 text-sm mb-6">Enter your username and passcode to access your cohort.</p>

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. john.doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all duration-150"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all duration-150"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-brand-500/10 transition-all duration-150 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-brand-500/5 border border-brand-500/10 rounded-lg text-xs leading-relaxed text-brand-400">
          💡 <strong>Curated platform:</strong> Credentials are sent to approved members via email. Check your inbox if you have registered.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
