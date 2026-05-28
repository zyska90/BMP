'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const STEPS = ['Identity', 'Intent', 'Expertise'];
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
            ${i + 1 < current ? 'bg-brand-500 text-white' :
              i + 1 === current ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' :
              'bg-gray-100 text-gray-400'}`}>
            {i + 1 < current ? <Check size={12} /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i + 1 === current ? 'text-gray-900' : 'text-gray-400'}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className={`w-8 h-px ${i + 1 < current ? 'bg-brand-500' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function SetupStep() {
  const router = useRouter();
  const params = useParams();
  const step = Number(params.step);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, any[]>>({});

  const [form, setForm] = useState({
    fullName: '', title: '', company: '',
    companySize: '', industryId: '', city: '',
    isOpenToRemote: false,
    intentOffer: '', intentSeek: '',
    tagIds: [] as number[],
    whatsappNumber: '', linkedinUrl: ''
  });

  // Load prefill + reference data on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/proxy/me').then(r => r.json()).catch(() => null),
      fetch('/api/proxy/prefill').then(r => r.json()).catch(() => null),
      fetch(`${API}/reference/industries`).then(r => r.json()).catch(() => []),
      fetch(`${API}/reference/expertise-tags`).then(r => r.json()).catch(() => ({ tags: [], grouped: {} }))
    ]).then(([me, prefill, inds, tagsData]) => {
      setIndustries(inds || []);
      setAllTags(tagsData?.tags || []);
      setTagsByCategory(tagsData?.grouped || {});

      // Pre-fill from existing profile or registration data
      setForm(prev => ({
        ...prev,
        fullName: me?.fullName || prefill?.data?.fullName || '',
        title: me?.title || prefill?.data?.title || '',
        company: me?.company || prefill?.data?.company || '',
        companySize: me?.companySize || '',
        industryId: me?.industryId ? String(me.industryId) : '',
        city: me?.city || prefill?.data?.city || '',
        isOpenToRemote: me?.isOpenToRemote || false,
        intentOffer: me?.intentOffer || prefill?.data?.intentOffer || '',
        intentSeek: me?.intentSeek || prefill?.data?.intentSeek || '',
        tagIds: me?.expertiseTags?.map((t: any) => t.id) || [],
        whatsappNumber: me?.whatsappNumber || prefill?.data?.whatsappNumber || '',
        linkedinUrl: me?.linkedinUrl || ''
      }));
      setLoading(false);
    });
  }, []);

  const toggleTag = (id: number) => {
    setForm(prev => {
      const has = prev.tagIds.includes(id);
      if (has) return { ...prev, tagIds: prev.tagIds.filter(t => t !== id) };
      if (prev.tagIds.length >= 8) return prev;
      return { ...prev, tagIds: [...prev.tagIds, id] };
    });
  };

  const handleNext = async () => {
    if (step < 3) {
      router.push(`/profile/setup/step/${step + 1}`);
      return;
    }

    // Step 3 — save profile
    setSaving(true);
    try {
      const res = await fetch('/api/proxy/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          industryId: form.industryId ? Number(form.industryId) : null
        })
      });
      const data = await res.json();
      if (data.hasCompletedProfile) {
        router.push('/app/dashboard');
      } else {
        router.push('/app/dashboard');
      }
    } catch {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-bold text-xs text-white">BL</div>
          <span className="font-display font-bold text-gray-900">BizLink<span className="text-brand-500">.</span></span>
        </div>

        <StepBar current={step} />

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">

          {/* Step 1 — Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-bold text-gray-900 text-lg mb-0.5">Your Identity</h2>
                <p className="text-sm text-gray-500">Confirm your details — pre-filled from your registration.</p>
              </div>
              {[
                { label: 'Full Name', key: 'fullName', placeholder: 'Your full name', required: true },
                { label: 'Job Title', key: 'title', placeholder: 'e.g. Founder, Marketing Consultant' },
                { label: 'Company / Brand', key: 'company', placeholder: 'Company or freelance brand name' },
                { label: 'City', key: 'city', placeholder: 'e.g. Jakarta, Surabaya, Bali' },
                { label: 'WhatsApp Number', key: 'whatsappNumber', placeholder: '+62...' },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Company Size</label>
                <select
                  value={form.companySize}
                  onChange={e => setForm(prev => ({ ...prev, companySize: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-brand-500 outline-none"
                >
                  <option value="">Select size</option>
                  {['Solo', '2-10', '11-50', '51-200', '200+'].map(s => <option key={s} value={s}>{s} people</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Industry</label>
                <select
                  value={form.industryId}
                  onChange={e => setForm(prev => ({ ...prev, industryId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-brand-500 outline-none"
                >
                  <option value="">Select industry</option>
                  {industries.map((ind: any) => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.isOpenToRemote} onChange={e => setForm(prev => ({ ...prev, isOpenToRemote: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                <span className="text-sm text-gray-700">Open to remote collaboration</span>
              </label>
            </div>
          )}

          {/* Step 2 — Intent */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-gray-900 text-lg mb-0.5">Your Business Intent</h2>
                <p className="text-sm text-gray-500">This drives the matching engine. Be specific — the more detail, the better your matches.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  I offer... <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.intentOffer}
                  onChange={e => setForm(prev => ({ ...prev, intentOffer: e.target.value }))}
                  placeholder="e.g. UI/UX design services for early-stage startups, brand identity, and mobile app design"
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.intentOffer.length} chars — minimum 10</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  I am looking for... <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.intentSeek}
                  onChange={e => setForm(prev => ({ ...prev, intentSeek: e.target.value }))}
                  placeholder="e.g. B2B clients in EdTech or HealthTech who need product design, or co-founder with technical background"
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.intentSeek.length} chars — minimum 10</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">LinkedIn URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={form.linkedinUrl}
                  onChange={e => setForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourname"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Expertise Tags */}
          {step === 3 && (
            <div>
              <div className="mb-5">
                <h2 className="font-display font-bold text-gray-900 text-lg mb-0.5">Your Expertise</h2>
                <p className="text-sm text-gray-500">Select up to 8 tags that best describe your skills and offerings.</p>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">Selected: <strong className="text-gray-900">{form.tagIds.length}/8</strong></span>
                {form.tagIds.length > 0 && (
                  <button onClick={() => setForm(prev => ({ ...prev, tagIds: [] }))} className="text-xs text-gray-400 hover:text-red-500">Clear all</button>
                )}
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {Object.entries(tagsByCategory).map(([category, tags]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: any) => {
                        const selected = form.tagIds.includes(tag.id);
                        const disabled = !selected && form.tagIds.length >= 8;
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            disabled={disabled}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              selected ? 'bg-brand-500 text-white border-brand-500' :
                              disabled ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' :
                              'bg-white text-gray-600 border-gray-200 hover:border-brand-500 hover:text-brand-500'
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => router.push(`/profile/setup/step/${step - 1}`)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <button onClick={() => router.push('/profile/setup')}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving || (step === 1 && !form.fullName) || (step === 2 && (form.intentOffer.length < 10 || form.intentSeek.length < 10))}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 disabled:opacity-40 text-white font-semibold rounded-lg text-sm transition-all"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
             step === 3 ? <><Check size={16} /> Save Profile</> :
             <>Next <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
