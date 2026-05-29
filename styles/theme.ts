// ── Fruitisimo Rugby Hub – centrální design tokeny ────────────────────────────
// Inspirace: Rugby Praga Praha (zlatá, inkoustová, světlé plátno)
// WCAG: gold na světlém pozadí NEVYHOVUJE AA jako text → gold pouze jako bg/border/akcent
// text na gold = ink (#111111) ✓ 10:1 kontrast

export const colors = {
  // Primární paleta
  gold:      '#D4AF37',
  goldDark:  '#B68C1F',
  goldLight: '#FBF5DC',
  goldBorder:'#E8D06B',

  // Neutrální
  ink:       '#111111',
  inkLight:  '#333333',
  canvas:    '#F7F5F0',
  panel:     '#FFFFFF',
  divider:   '#E5E5E5',

  // Text
  textPrimary:   '#111111',
  textSecondary: '#555555',
  textMuted:     '#888888',

  // Stav
  success: '#16A34A',
  warning: '#D97706',
  error:   '#DC2626',
} as const;

export const shadows = {
  sm:   '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  md:   '0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
  lg:   '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
  gold: '0 4px 16px rgba(212,175,55,0.25)',
} as const;

export const radius = {
  sm:  '0.5rem',   // rounded-lg
  md:  '0.75rem',  // rounded-xl
  lg:  '1rem',     // rounded-2xl
  xl:  '1.25rem',  // rounded-[20px]
} as const;

// Tailwind class helpers (shorthand combos)
export const tw = {
  // Tlačítka
  btnGold:    'bg-gold hover:bg-gold-dark active:bg-gold-dark text-ink font-semibold transition-colors',
  btnInk:     'bg-ink hover:bg-ink-light text-white font-semibold transition-colors',
  btnOutline: 'border border-divider bg-panel hover:bg-canvas text-ink font-medium transition-colors',
  btnGhost:   'text-secondary hover:text-ink hover:bg-canvas transition-colors',

  // Inputy
  input:      'bg-panel border border-divider rounded-xl px-3.5 py-3 text-ink placeholder-muted focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all',

  // Karty
  card:       'bg-panel border border-divider rounded-2xl shadow-sm',
  cardInk:    'bg-ink border border-ink rounded-2xl',
} as const;
