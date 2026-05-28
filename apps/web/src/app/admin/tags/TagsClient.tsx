'use client';

import { useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  'Teknologi Informasi (IT)', 'Kreatif & Desain', 'Pemasaran & Sales',
  'Keuangan & Akuntansi', 'Konsultasi Bisnis', 'Hukum & Legal',
  'HR & Rekrutmen', 'Logistik & Rantai Pasok', 'Pendidikan & EdTech',
  'Kesehatan & HealthTech', 'Media & Jurnalisme', 'Properti & Real Estate',
  'Travel & Pariwisata', 'Agritech & Pertanian',
];

export default function TagsClient({ initialTags }: { initialTags: any[] }) {
  const [tags, setTags] = useState(initialTags);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState(CATEGORIES[0]);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const refresh = async () => {
    setRefreshing(true);
    const res = await fetch('/api/proxy/admin/tags');
    if (res.ok) setTags(await res.json());
    setRefreshing(false);
  };

  const addTag = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch('/api/proxy/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), category: newCat })
    });
    if (res.ok) {
      const tag = await res.json();
      setTags(prev => [...prev, tag].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      setNewName('');
    }
    setAdding(false);
  };

  const deleteTag = async (id: number) => {
    if (!confirm('Delete this tag? It will be removed from all user profiles.')) return;
    setDeleting(id);
    await fetch(`/api/proxy/admin/tags/${id}`, { method: 'DELETE' });
    setTags(prev => prev.filter(t => t.id !== id));
    setDeleting(null);
  };

  const filtered = tags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const tag of filtered) {
    if (!grouped[tag.category]) grouped[tag.category] = [];
    grouped[tag.category].push(tag);
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Tags & Industries</h1>
          <p className="text-sm text-gray-500 mt-1">{tags.length} expertise tags across {Object.keys(grouped).length} categories</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="p-2 rounded-lg border border-gray-700 hover:border-brand-400 text-gray-400 transition-colors">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Add new tag */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-display font-semibold text-gray-900 text-sm mb-3">Add New Tag</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Tag name, e.g. No-Code Development"
            className="flex-1 min-w-48 px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:border-brand-500 outline-none"
          />
          <select value={newCat} onChange={e => setNewCat(e.target.value)}
            className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:border-brand-500 outline-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addTag} disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            <Plus size={14} /> {adding ? 'Adding...' : 'Add Tag'}
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search tags or categories..."
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-brand-500 outline-none mb-4 bg-white"
      />

      {/* Tags by category */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, catTags]) => (
          <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-900 text-sm">{category}</h3>
              <span className="text-xs text-gray-400">{catTags.length} tags</span>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-2">
              {catTags.map(tag => (
                <div key={tag.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full group">
                  <span className="text-xs font-medium text-gray-700">{tag.name}</span>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    disabled={deleting === tag.id}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
