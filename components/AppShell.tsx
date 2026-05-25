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

  // Načti roli z localStorage po hydrataci
  useEffect(() => {
    setRoleState(loadRole());
    setHydrated(true);
  }, []);

  // Focusni input při zobrazení login screenu
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

  // Krátký prázdný flash při hydrataci — zabrání záblesku špatného UI
  if (!hydrated) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  // ── Entry screen ─────────────────────────────────────────────
  if (!role) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-5 shadow-lg shadow-green-600/20">
            <RugbyBallIcon size={28} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">RugbyHub</h1>
          <p className="text-gray-500 text-sm mt-2">Správa rugby turnajů v ČR</p>
        </div>

        {screen === 'pick' ? (
          /* Výběr režimu */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            {/* Sledující */}
            <button
              onClick={enterViewer}
              className="group flex flex-col items-center text-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 active:bg-gray-800 rounded-2xl px-6 py-8 transition-all duration-150"
            >
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                <EyeIcon />
              </div>
              <div>
                <p className="font-bold text-white text-lg">Sledující</p>
                <p className="text-gray-500 text-sm mt-1 leading-snug">
                  Prohlíž tabulky a výsledky bez přihlášení
                </p>
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={() => setScreen('login')}
              className="group flex flex-col items-center text-center gap-4 bg-gray-900 border border-gray-800 hover:border-green-600/60 active:bg-gray-900 rounded-2xl px-6 py-8 transition-all duration-150"
            >
              <div className="w-12 h-12 bg-green-600/10 border border-green-600/30 rounded-xl flex items-center justify-center group-hover:bg-green-600/20 transition-colors">
                <LockIcon />
              </div>
              <div>
                <p className="font-bold text-white text-lg">Admin</p>
                <p className="text-gray-500 text-sm mt-1 leading-snug">
                  Správa turnajů, skupin a výsledků
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* Admin login */
          <div className="w-full max-w-xs">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 bg-green-500 rounded-full" />
                <h2 className="font-bold text-white">Přihlášení admina</h2>
              </div>

              <label className="block text-xs font-medium text-gray-400 mb-1.5">Heslo</label>
              <input
                ref={pwRef}
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwErr(''); }}
                onKeyDown={e => e.key === 'Enter' && submitLogin()}
                placeholder="Zadej heslo"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors"
              />

              {pwErr && (
                <p className="text-red-400 text-sm mt-2.5 flex items-center gap-1.5">
                  <span aria-hidden>⚠</span> {pwErr}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={submitLogin}
                  className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
                >
                  Přihlásit
                </button>
                <button
                  onClick={() => { setScreen('pick'); setPwErr(''); setPassword(''); }}
                  className="px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors min-h-[44px]"
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
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 bg-green-600 rounded-md flex items-center justify-center shrink-0">
              <RugbyBallIcon size={14} />
            </div>
            <span className="text-white font-bold text-base tracking-tight">RugbyHub</span>
          </a>

          <div className="flex items-center gap-2.5">
            <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${
              role === 'admin'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-gray-800/60 text-gray-400 border-gray-700'
            }`}>
              {role === 'admin' ? '⚙ Admin' : '👁 Sledující'}
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-800"
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

function RugbyBallIcon({ size }: { size: number }) {
  if (size <= 14) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="4" ry="6.5" stroke="white" strokeWidth="1.5" />
        <line x1="0.5" y1="7" x2="13.5" y2="7" stroke="white" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <ellipse cx="14" cy="14" rx="8" ry="13" stroke="white" strokeWidth="2" />
      <line x1="1"  y1="14" x2="27" y2="14" stroke="white" strokeWidth="2" />
      <line x1="5"  y1="9"  x2="23" y2="9"  stroke="white" strokeWidth="1.5" />
      <line x1="5"  y1="19" x2="23" y2="19" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M1 11C1 11 4.5 4 11 4s10 7 10 7-3.5 7-10 7S1 11 1 11Z"
        stroke="#9ca3af" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="3" stroke="#9ca3af" strokeWidth="1.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="10" width="16" height="11" rx="2" stroke="#22c55e" strokeWidth="1.75" />
      <path d="M7 10V7a4 4 0 018 0v3" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="11" cy="15.5" r="1.5" fill="#22c55e" />
    </svg>
  );
}
