import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700']
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700']
});

export const metadata: Metadata = {
  title: 'BizLink (LinkID) — Business Matching Platform',
  description: 'A curated, invite-only platform that connects freelancers, founders, and corporate teams to find clients and partners.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
