'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const ROLES = [
  { value: 'Startup Founder', label: 'Startup Founder' },
  { value: 'Freelancer/Konsultan', label: 'Freelancer / Konsultan' },
  { value: 'Corporate BD Team', label: 'Corporate BD Team' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '', email: '', roleType: '',
    company: '', city: '', whatsappNumber: '',
    intentOffer: '', intentSeek: '', linkedinUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.roleType || !form.company || !form.intentOffer || !form.intentSeek) {
      setError('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json();
        setError(d.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch {
      setError('Gagal terhubung. Periksa koneksi internet kamu.');
    }
    setLoading(false);
  };

  if (submitted) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">Pendaftaran Diterima!</h1>
        <p className="text-gray-400 mb-2">
          Terima kasih, <strong className="text-white">{form.fullName}</strong>. Pendaftaran kamu sudah kami terima.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Tim kami akan mereview dan mengirimkan credentials login ke <strong className="text-gray-300">{form.email}</strong> dalam 1–2 hari kerja.
        </p>
        <Link href="/" className="text-brand-400 hover:text-brand-300 text-sm flex items-center justify-center gap-2">
          <ArrowLeft size={14} /> Kembali ke beranda
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-8 w-fit">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-bold text-xs text-white">BL</div>
            <span className="font-display font-bold text-gray-100">BizLink<span className="text-brand-400">.</span></span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Daftar ke Komunitas</h1>
          <p className="text-gray-400">Platform ini invite-only. Isi form di bawah — tim kami akan review dan kirim akses dalam 1–2 hari kerja.</p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identity */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-gray-200 text-sm">Identitas</h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Nama Lengkap <span className="text-red-400">*</span></label>
              <input value={form.fullName} onChange={set('fullName')} placeholder="Nama lengkap kamu"
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Email <span className="text-red-400">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="email@perusahaan.com"
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Kamu bergabung sebagai <span className="text-red-400">*</span></label>
              <select value={form.roleType} onChange={set('roleType')}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:border-brand-500 outline-none">
                <option value="">Pilih peran...</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Perusahaan / Brand <span className="text-red-400">*</span></label>
                <input value={form.company} onChange={set('company')} placeholder="Nama perusahaan"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Kota</label>
                <input value={form.city} onChange={set('city')} placeholder="Jakarta, Surabaya..."
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">WhatsApp</label>
                <input value={form.whatsappNumber} onChange={set('whatsappNumber')} placeholder="+62..."
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">LinkedIn URL</label>
                <input value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="linkedin.com/in/..."
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Intent */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-gray-200 text-sm">Business Intent</h2>
            <p className="text-xs text-gray-500">Ini yang dipakai sistem untuk mencocokkan kamu dengan member lain. Semakin detail semakin baik.</p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Saya menawarkan... <span className="text-red-400">*</span></label>
              <textarea value={form.intentOffer} onChange={set('intentOffer')} rows={3}
                placeholder="Contoh: Jasa web development untuk startup, UI/UX design, dan konsultasi product strategy..."
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Saya sedang mencari... <span className="text-red-400">*</span></label>
              <textarea value={form.intentSeek} onChange={set('intentSeek')} rows={3}
                placeholder="Contoh: Klien B2B dari industri fintech atau healthtech, co-founder teknis, atau investor seed stage..."
                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:border-brand-500 outline-none resize-none" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Kirim Pendaftaran'}
          </button>

          <p className="text-center text-xs text-gray-600">
            Sudah punya akun? <Link href="/login" className="text-brand-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
