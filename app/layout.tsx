import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'RugbyHub',
  description: 'Turnajová aplikace pro rugby v ČR',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={`${inter.className} bg-gray-950 min-h-screen`}>
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-7 h-7 bg-green-600 rounded-md flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="7" cy="7" rx="4" ry="6.5" stroke="white" strokeWidth="1.5"/>
                  <line x1="0.5" y1="7" x2="13.5" y2="7" stroke="white" strokeWidth="1.5"/>
                </svg>
              </div>
              <span className="text-white font-bold text-base tracking-tight">RugbyHub</span>
            </a>
            <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full font-medium">
              Rugby CZ
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
