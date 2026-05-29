'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

// ── Typy & konstanty ──────────────────────────────────────────

export type Role = 'viewer' | 'admin';

const STORAGE_KEY = 'rh-role';
const ADMIN_PW    = '1234';

function loadRole(): Role | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'viewer' || v === 'admin' ? v : null;
}

// ── Role context ──────────────────────────────────────────────

interface RoleCtx {
  role: Role | null;
  isAdmin: boolean;
  logout: () => void;
}

const RoleContext = createContext<RoleCtx>({ role: null, isAdmin: false, logout: () => {} });

export function useRole(): RoleCtx {
  return useContext(RoleContext);
}

// ── AppShell ──────────────────────────────────────────────────

export function AppShell({ children }: { children: ReactNode }) {
  const [role,     setRoleState] = useState<Role | null>(null);
  const [hydrated, setHydrated]  = useState(false);
  const [screen,   setScreen]    = useState<'pick' | 'login'>('pick');
  const [password, setPassword]  = useState('');
  const [pwErr,    setPwErr]     = useState('');
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRoleState(loadRole());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (screen === 'login') pwRef.current?.focus();
  }, [screen]);

  const enterViewer = () => {
    localStorage.setItem(STORAGE_KEY, 'viewer');
    setRoleState('viewer');
  };

  const submitLogin = () => {
    if (password === ADMIN_PW) {
      localStorage.setItem(STORAGE_KEY, 'admin');
      setRoleState('admin');
      setPassword('');
      setPwErr('');
    } else {
      setPwErr('Špatné heslo. Zkus to znovu.');
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRoleState(null);
    setScreen('pick');
    setPassword('');
    setPwErr('');
  };

  // Krátký flash při hydrataci
  if (!hydrated) {
    return <div className="min-h-screen bg-canvas" />;
  }

  // ── Entry screen ─────────────────────────────────────────────
  if (!role) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ink rounded-2xl mb-5 shadow-lg">
            <RugbyBallIcon size={28} color="gold" />
          </div>
          <h1 className="text-4xl font-extrabold text-ink tracking-tight">RugbyHub</h1>
          <p className="text-secondary text-sm mt-2">Správa rugby turnajů v ČR</p>
        </div>

        {screen === 'pick' ? (
          /* Výběr režimu */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            {/* Sledující */}
            <button
              onClick={enterViewer}
              className="group flex flex-col items-center text-center gap-4 bg-panel border border-divider hover:border-gold hover:shadow-md active:bg-canvas rounded-2xl px-6 py-8 transition-all duration-150 shadow-sm"
            >
              <div className="w-12 h-12 bg-canvas border border-divider rounded-xl flex items-center justify-center group-hover:bg-gold-light group-hover:border-gold-border transition-colors">
                <EyeIcon />
              </div>
              <div>
                <p className="font-bold text-ink text-lg">Sledující</p>
                <p className="text-secondary text-sm mt-1 leading-snug">
                  Prohlíž tabulky a výsledky bez přihlášení
                </p>
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={() => setScreen('login')}
              className="group flex flex-col items-center text-center gap-4 bg-ink border border-ink hover:border-gold active:bg-ink-light rounded-2xl px-6 py-8 transition-all duration-150 shadow-sm"
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                <LockIcon />
              </div>
              <div>
                <p className="font-bold text-white text-lg">Admin</p>
                <p className="text-white/60 text-sm mt-1 leading-snug">
                  Správa turnajů, skupin a výsledků
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* Admin login */
          <div className="w-full max-w-xs">
            <div className="bg-ink border border-ink-light rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 bg-gold rounded-full" />
                <h2 className="font-bold text-white">Přihlášení admina</h2>
              </div>

              <label className="block text-xs font-medium text-white/60 mb-1.5">Heslo</label>
              <input
                ref={pwRef}
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwErr(''); }}
                onKeyDown={e => e.key === 'Enter' && submitLogin()}
                placeholder="Zadej heslo"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-3 text-base text-white placeholder-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />

              {pwErr && (
                <p className="text-red-400 text-sm mt-2.5 flex items-center gap-1.5">
                  <span aria-hidden>⚠</span> {pwErr}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={submitLogin}
                  className="flex-1 bg-gold hover:bg-gold-dark active:bg-gold-dark text-ink px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors min-h-[44px]"
                >
                  Přihlásit
                </button>
                <button
                  onClick={() => { setScreen('pick'); setPwErr(''); setPassword(''); }}
                  className="px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors min-h-[44px]"
                >
                  ← Zpět
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── App (role je vybrána) ────────────────────────────────────
  return (
    <RoleContext.Provider value={{ role, isAdmin: role === 'admin', logout }}>
      <header className="sticky top-0 z-50 bg-ink border-b border-ink-light/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 bg-gold rounded-md flex items-center justify-center shrink-0">
              <RugbyBallIcon size={14} color="ink" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">RugbyHub</span>
          </a>

          <div className="flex items-center gap-2.5">
            <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${
              role === 'admin'
                ? 'bg-gold/15 text-gold border-gold/30'
                : 'bg-white/10 text-white/70 border-white/20'
            }`}>
              {role === 'admin' ? '⚙ Admin' : '👁 Sledující'}
            </span>
            <button
              onClick={logout}
              className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
            >
              Změnit režim
            </button>
          </div>
        </div>
      </header>
      {children}
    </RoleContext.Provider>
  );
}

// ── Ikony ─────────────────────────────────────────────────────

function RugbyBallIcon({ size, color = 'white' }: { size: number; color?: 'white' | 'gold' | 'ink' }) {
  const stroke = color === 'gold' ? '#D4AF37' : color === 'ink' ? '#111111' : 'white';
  if (size <= 14) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="4" ry="6.5" stroke={stroke} strokeWidth="1.5" />
        <line x1="0.5" y1="7" x2="13.5" y2="7" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <ellipse cx="14" cy="14" rx="8" ry="13" stroke={stroke} strokeWidth="2" />
      <line x1="1"  y1="14" x2="27" y2="14" stroke={stroke} strokeWidth="2" />
      <line x1="5"  y1="9"  x2="23" y2="9"  stroke={stroke} strokeWidth="1.5" />
      <line x1="5"  y1="19" x2="23" y2="19" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M1 11C1 11 4.5 4 11 4s10 7 10 7-3.5 7-10 7S1 11 1 11Z"
        stroke="#555555" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="3" stroke="#555555" strokeWidth="1.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="10" width="16" height="11" rx="2" stroke="#D4AF37" strokeWidth="1.75" />
      <path d="M7 10V7a4 4 0 018 0v3" stroke="#D4AF37" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="11" cy="15.5" r="1.5" fill="#D4AF37" />
    </svg>
  );
}
