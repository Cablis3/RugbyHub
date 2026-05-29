import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '../components/AppShell';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'RugbyHub',
  description: 'Turnajová aplikace pro rugby v ČR',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={`${inter.className} bg-canvas min-h-screen`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
