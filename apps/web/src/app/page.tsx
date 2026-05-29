import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden flex flex-col justify-between selection:bg-brand-500">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent-dark/15 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-brand-500 to-brand-700 rounded-lg flex items-center justify-center font-display font-bold text-sm tracking-tight text-white shadow-md">
            BL
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-gray-100">
            BizLink<span className="text-brand-400">.</span>
          </span>
        </div>
        <Link 
          href="/login"
          className="px-5 py-2 bg-gray-900 border border-gray-800 hover:border-brand-500 hover:text-white rounded-md text-sm font-medium text-gray-300 transition-all duration-200"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center flex-1 flex flex-col justify-center items-center z-10">
        <span className="px-3.5 py-1.5 rounded-full border border-brand-500/25 bg-brand-500/5 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          ✨ Curated invite-only platform
        </span>
        
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight max-w-3xl">
          Curated Business Matching for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-mid">
            Founders & Professionals
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed font-light">
          Connect directly with founders, consultants, and teams. Intent-first matching based on mutual offerings and seeks, optimized for cohort-based events.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-semibold rounded-md shadow-lg shadow-brand-500/20 transform active:scale-95 transition-all duration-150"
          >
            Access Platform
          </Link>
          <Link
            href="/register"
            className="px-8 py-3.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-200 font-semibold rounded-md transition-all duration-150"
          >
            Request Invite
          </Link>
        </div>

        {/* Feature grid preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl mt-20 text-left">
          <div className="p-6 bg-gray-900/40 border border-gray-900 rounded-xl backdrop-blur-sm">
            <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400 mb-4 font-bold text-lg">1</div>
            <h3 className="font-display text-base font-semibold text-gray-100 mb-2">Intent Matching Engine</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Matches are scored on exact alignment of expertise and needs, eliminating cold networking noise.</p>
          </div>
          <div className="p-6 bg-gray-900/40 border border-gray-900 rounded-xl backdrop-blur-sm">
            <div className="w-10 h-10 bg-accent-mid/10 rounded-lg flex items-center justify-center text-accent-mid mb-4 font-bold text-lg">2</div>
            <h3 className="font-display text-base font-semibold text-gray-100 mb-2">Curated Gatekeeping</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Strict admin review process ensures every member is highly trusted and actively looking to collaborate.</p>
          </div>
          <div className="p-6 bg-gray-900/40 border border-gray-900 rounded-xl backdrop-blur-sm">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 mb-4 font-bold text-lg">3</div>
            <h3 className="font-display text-base font-semibold text-gray-100 mb-2">Stateless Meetings</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Book, schedule, and join professional meetups directly inside the platform aligned to a weekly cycle.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-gray-900 text-center text-gray-500 text-xs z-10">
        &copy; 2026 BizLink Business Matching Platform. Powered by Bun & Next.js.
      </footer>
    </div>
  );
}
