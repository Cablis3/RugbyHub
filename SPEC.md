# Mini Tournify — Technické zadání

> Rugby turnajová aplikace pro ČR · MVP · Next.js + Tailwind + Supabase

---

## 1. Popis aplikace

### Co aplikace dělá
Mini Tournify umožňuje organizátorům rugby turnajů v ČR rychle vytvořit turnaj, přidat týmy z databáze českých rugby klubů a automaticky vygenerovat rozpis zápasů systémem „každý s každým". Po odehrání zápasů organizátor zadá výsledky a aplikace průběžně počítá a zobrazuje tabulku s pořadím.

### Pro koho
- Organizátoři jednorázových rugby turnajů (kategorie seniors, junioři, mini rugby)
- Hráči a fanoušci, kteří chtějí sledovat výsledky a tabulku

### MVP rozsah
- Vytvoření turnaje
- Výběr týmů z databáze českých rugby klubů
- Generování rozpisu zápasů každý s každým
- Zadávání výsledků
- Automatická tabulka s bodovým hodnocením
- Vše funguje lokálně v prohlížeči (Phase 1 — bez databáze)

### Co MVP NEřeší
- Autentizace / přihlášení
- Mobilní nativní aplikace
- Více souběžných administrátorů
- Playoff / pavouk / skupinová fáze
- Notifikace, sdílení, export PDF
- Rugby 7s / 15s specifická pravidla (bonus body za 4 pokusy apod.)

---

## 2. Uživatelské role

| Role             | Popis                                        | Co smí                          |
|------------------|----------------------------------------------|---------------------------------|
| Admin turnaje    | Organizátor, který turnaj vytvořil           | Vše: editace, výsledky, správa  |
| Návštěvník       | Hráč nebo fanoušek se sdíleným odkazem       | Prohlížení tabulky a zápasů     |

> Phase 1: žádné role — vše je veřejné, admin = kdokoli s odkazem.
> Phase 3+: přidání jednoduchého admin hesla nebo Supabase Auth.

---

## 3. Obrazovky aplikace

### `/` — Homepage / Seznam turnajů
- Nadpis „Mini Tournify"
- Tlačítko „+ Nový turnaj" → inline formulář
- Formulář: název, datum, místo konání
- Seznam existujících turnajů (karta s názvem, datem, stavem)
- Klik na turnaj → `/tournaments/[id]`

### `/tournaments/[id]` — Detail turnaje
Tři záložky:

**Tabulka**
- Pořadová tabulka se sloupci: #, Tým, Z, V, R, P, Skóre, +/-, Body
- Barevné zvýraznění výher/proher/remíz
- Aktualizuje se v reálném čase po zadání výsledků

**Zápasy**
- Pokud nejsou vygenerovány: tlačítko „Vygenerovat rozpis"
- Zápasy seskupené po kolech
- Každý zápas: domácí tým — výsledek — hostující tým
- Klik na „Zadat výsledek" → inline input pro skóre
- Klik na existující výsledek → možnost opravit

**Týmy**
- Seznam vybraných týmů s možností odebrání
- Vyhledávání v databázi klubů ČRU
- Přidání vlastního týmu (bez záznamu v ČRU)
- Tlačítko „Uložit" → při změně týmů se resetuje rozpis

---

## 4. Datový model

### `clubs` — databáze rugby klubů ČR
| Sloupec         | Typ   | Popis                                    |
|-----------------|-------|------------------------------------------|
| id              | uuid  | Primární klíč                            |
| name            | text  | Název klubu (např. „RC Praga Praha")     |
| city            | text  | Město                                    |
| website         | text  | Web klubu (volitelné)                    |
| rugby_union_url | text  | URL detailu na rugbyunion.cz (volitelné) |
| created_at      | ts    | Čas vytvoření                            |

### `tournaments` — turnaje
| Sloupec    | Typ    | Popis                                    |
|------------|--------|------------------------------------------|
| id         | uuid   | Primární klíč                            |
| name       | text   | Název turnaje                            |
| date       | date   | Datum konání                             |
| location   | text   | Místo konání                             |
| status     | text   | draft / active / finished                |
| created_at | ts     | Čas vytvoření                            |

### `teams` — týmy v turnaji
| Sloupec       | Typ  | Popis                                      |
|---------------|------|--------------------------------------------|
| id            | uuid | Primární klíč                              |
| tournament_id | uuid | FK → tournaments.id (cascade delete)       |
| name          | text | Zobrazovaný název (může být alias)         |
| club_id       | uuid | FK → clubs.id (volitelné)                 |
| created_at    | ts   | Čas vytvoření                              |

### `matches` — zápasy
| Sloupec       | Typ     | Popis                               |
|---------------|---------|-------------------------------------|
| id            | uuid    | Primární klíč                       |
| tournament_id | uuid    | FK → tournaments.id (cascade)       |
| home_team_id  | uuid    | FK → teams.id (domácí)              |
| away_team_id  | uuid    | FK → teams.id (hosté)               |
| home_score    | integer | Skóre domácích (null = nesehráno)   |
| away_score    | integer | Skóre hostů (null = nesehráno)      |
| round         | integer | Číslo kola                          |
| played        | boolean | Zda byl zápas odehrán               |
| created_at    | ts      | Čas vytvoření                       |

Constraint: `home_team_id <> away_team_id`

### `standings` — tabulka (výpočet, ne tabulka)
Tabulka se **nepersistuje** — počítá se dynamicky v `lib/calculateStandings.ts` nebo jako SQL pohled v Supabase.

### Vazby (diagram)
```
clubs ◄──────── teams ──────────► tournaments
                  │
              matches ◄─── home_team_id
                      ◄─── away_team_id
```

---

## 5. Import klubů z rugbyunion.cz

### Phase 1 — ruční seed soubor (aktuální stav)
Soubor [`data/clubs.ts`](data/clubs.ts) obsahuje 18 ručně ověřených klubů z webu ČRU.
Formát: `{ id, name, city, website?, rugbyUnionUrl? }`

Kluby zahrnují:
- RC Praga Praha, RC Slavia Praha, RC Sparta Praha, RK Petrovice, RC Tatra Smíchov, ARC Iuridica, RC Dragons Praha *(Praha)*
- RC Mountfield Říčany *(Středočeský kraj)*
- RA Brno, RC Ducks Brno, RK Kuřim *(Jihomoravský kraj)*
- TJ Sokol Mariánské Hory *(Ostrava)*
- RK Vrchovina, RC Havlíčkův Brod *(Vysočina)*
- Strakonice RFC *(Jihočeský kraj)*
- Rugby Club Plzeň *(Plzeňský kraj)*
- Přerov RFC *(Olomoucký kraj)*
- RC Lomnice nad Popelkou *(Liberecký kraj)*

### Phase 2 — automatický scraper
Skript [`scripts/scrapeClubs.ts`](scripts/scrapeClubs.ts):
1. Stáhne stránku `rugbyunion.cz/kluby`
2. Extrahuje seznam URL `/kluby/[slug]`
3. Pro každý klub stáhne detail a extrahuje název, web
4. Vypíše TypeScript export → přepíše `data/clubs.ts`

Spuštění:
```bash
npx ts-node scripts/scrapeClubs.ts > data/clubs-generated.ts
```

> Zkontroluj výstup ručně před nahrazením clubs.ts — HTML struktura webu se může změnit.

---

## 6. Logika turnaje

### Generování zápasů každý s každým

Soubor: [`lib/generateRoundRobin.ts`](lib/generateRoundRobin.ts)

**Algoritmus rotace (standardní round-robin scheduling):**

1. Máme `n` týmů. Pokud `n` je liché, přidáme dummy tým `__bye__`.
2. Počet kol = `n - 1` (pro sudé n)
3. Počet zápasů za kolo = `n / 2`
4. Celkem zápasů = `n * (n-1) / 2`
5. V každém kole: fixujeme tým na pozici 0, ostatní rotujeme o 1 doleva.

```
Příklad pro 4 týmy [A, B, C, D]:
Kolo 1: A–D, B–C
Kolo 2: A–C, D–B
Kolo 3: A–B, C–D
```

**Pravidla:**
- Každá dvojice hraje právě jednou
- Domácí/hostující se střídá přirozeně díky rotaci
- Duplicity jsou vyloučeny strukturou algoritmu

### Bodování
| Výsledek | Body |
|----------|------|
| Výhra    | 3    |
| Remíza   | 1    |
| Prohra   | 0    |

### Výpočet tabulky

Soubor: [`lib/calculateStandings.ts`](lib/calculateStandings.ts)

Pro každý tým iteruje přes všechny odehrané zápasy a akumuluje:
- Odehrané zápasy (`played`)
- Výhry / remízy / prohry
- Vstřelené góly (`goalsFor`)
- Obdržené góly (`goalsAgainst`)
- Rozdíl skóre (`goalDifference = goalsFor - goalsAgainst`)
- Body (výhra=3, remíza=1, prohra=0)

### Řazení tabulky (priorita)
1. Body (sestupně)
2. Rozdíl skóre (sestupně)
3. Skóre pro (vstřelené góly, sestupně)
4. Název týmu (abecedně, česká lokalizace)

---

## 7. Struktura projektu

```
Mini-tournify/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (header, body)
│   ├── globals.css               # Tailwind direktivy
│   ├── page.tsx                  # Homepage — seznam turnajů
│   └── tournaments/
│       └── [id]/
│           └── page.tsx          # Detail turnaje (3 záložky)
│
├── components/                   # Sdílené React komponenty
│   ├── TournamentTable.tsx       # Bodová tabulka
│   ├── MatchList.tsx             # Seznam zápasů s editací výsledků
│   └── TeamSelector.tsx          # Výběr a správa týmů
│
├── lib/                          # Business logika (čisté funkce)
│   ├── generateRoundRobin.ts     # Algoritmus generování zápasů
│   ├── calculateStandings.ts     # Výpočet tabulky
│   └── storage.ts                # localStorage wrapper (Phase 1)
│
├── data/
│   └── clubs.ts                  # Seed data — české rugby kluby
│
├── types/
│   └── index.ts                  # TypeScript typy (Club, Tournament…)
│
├── supabase/
│   └── schema.sql                # DDL pro Supabase (Phase 2)
│
├── scripts/
│   └── scrapeClubs.ts            # Scraper rugbyunion.cz (volitelné)
│
├── .env.local                    # Supabase klíče (NEVERZOVAT!)
└── SPEC.md                       # Toto technické zadání
```

---

## 8. Soubory — přehled

| Soubor                             | Fáze | Popis                                    |
|------------------------------------|------|------------------------------------------|
| `types/index.ts`                   | 1    | Všechny TypeScript typy                  |
| `data/clubs.ts`                    | 1    | Seed data 18 rugby klubů ČR              |
| `lib/generateRoundRobin.ts`        | 1    | Pure funkce — generuje Match[]           |
| `lib/calculateStandings.ts`        | 1    | Pure funkce — počítá StandingRow[]       |
| `lib/storage.ts`                   | 1    | CRUD pro localStorage                    |
| `components/TournamentTable.tsx`   | 1    | Tabulka pořadí                           |
| `components/MatchList.tsx`         | 1    | Zápasy + inline editace výsledků         |
| `components/TeamSelector.tsx`      | 1    | Správa týmů + výběr z ČRU klubů          |
| `app/layout.tsx`                   | 1    | Root layout s navigací                   |
| `app/page.tsx`                     | 1    | Homepage + formulář nového turnaje       |
| `app/tournaments/[id]/page.tsx`    | 1    | Celý detail turnaje                      |
| `supabase/schema.sql`              | 2    | Databázové schéma pro Supabase           |
| `scripts/scrapeClubs.ts`           | 2    | Automatický import klubů z ČRU           |

---

## 9. Kód

Všechny soubory jsou připraveny v příslušných adresářích. Základní přehled:

**`types/index.ts`** — datové typy `Club`, `Tournament`, `Team`, `Match`, `StandingRow`

**`lib/generateRoundRobin.ts`** — vstup: `(tournamentId, teamIds[])` → výstup: `Match[]`
Rotační algoritmus, lichý počet týmů řeší dummy `__bye__` slotem.

**`lib/calculateStandings.ts`** — vstup: `(teams[], matches[])` → výstup: `StandingRow[]` seřazené dle pravidel.

**`lib/storage.ts`** — localStorage wrapper s funkcemi:
`getTournaments()`, `saveTournament()`, `getTeamsForTournament()`, `saveTeams()`,
`getMatchesForTournament()`, `saveMatches()`, `updateMatch()`, `generateId()`

**Komponenty** — všechny jsou `'use client'`, berou data jako props, callbacks pro akce.

---

## 10. Instrukce pro spuštění

### Krok 1 — Vytvoř Next.js projekt

Otevři terminál (PowerShell nebo Windows Terminal) a spusť:

```bash
cd C:\Users\m.cabla
npx create-next-app@latest Mini-tournify --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-npm
```

> Přepíše existující soubory — **zkopíruj si je nejdříve** nebo odpovídej `No` na konflikty a kopíruj manuálně.

Nebo — pokud chceš zachovat soubory beze změny — spusť v novém adresáři a zkopíruj soubory ručně:

```bash
cd C:\Users\m.cabla
npx create-next-app@latest mt-setup --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-npm
# Pak zkopíruj obsah Mini-tournify do mt-setup a přejmenuj
```

### Krok 2 — Otevři ve VS Code

```bash
cd Mini-tournify
code .
```

### Krok 3 — Zkontroluj `app/globals.css`

Ujisti se, že soubor obsahuje Tailwind direktivy:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Krok 4 — Spusť lokální server

```bash
npm run dev
```

Otevři prohlížeč na `http://localhost:3000`

### Krok 5 — Ověř funkčnost (checklist)
- [ ] Zobrazí se homepage s tlačítkem „+ Nový turnaj"
- [ ] Po vyplnění formuláře se turnaj uloží a zobrazí v seznamu
- [ ] Klik na turnaj otevře detail se 3 záložkami
- [ ] V záložce „Týmy" lze vybrat kluby z ČRU seznamu
- [ ] Po uložení týmů se v záložce „Zápasy" zobrazí tlačítko generování
- [ ] Vygenerovaný rozpis ukazuje zápasy po kolech
- [ ] Zadání výsledku aktualizuje tabulku v záložce „Tabulka"

### Krok 6 — Připojení Supabase (Phase 2)

1. Založ projekt na [supabase.com](https://supabase.com)
2. Spusť `supabase/schema.sql` v SQL Editoru
3. Zkopíruj API klíče do `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
4. Nainstaluj klienta:
   ```bash
   npm install @supabase/supabase-js
   ```
5. Vytvoř `lib/supabase.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```
6. Nahraď funkce z `lib/storage.ts` Supabase voláními

---

## 11. Roadmapa

### Fáze 1 — Lokální MVP (aktuální stav)
- Next.js + TypeScript + Tailwind
- Data v `localStorage` — funguje offline, bez registrace
- Generování zápasů, zadávání výsledků, tabulka
- 18 předvyplněných rugby klubů ČR

**Cíl: Do 1 dne spustit fungující aplikaci**

---

### Fáze 2 — Supabase databáze
- Připojit Supabase
- Migrovat `localStorage` operace na Supabase client
- Seed clubs do tabulky `clubs`
- Turnaje perzistují mezi zařízeními a prohlížeči
- Základní sdílený odkaz na turnaj funguje

**Soubory k úpravě:** `lib/storage.ts` → nahradit Supabase voláními

---

### Fáze 3 — Admin rozhraní
- Jednoduché admin heslo pro turnaj (nebo Supabase Auth)
- Chráněné operace: editace výsledků, správa týmů
- Veřejný read-only pohled bez hesla
- Row Level Security v Supabase

---

### Fáze 4 — Veřejný odkaz a sdílení
- Hezká URL: `mini-tournify.cz/t/[slug]`
- Open Graph meta tagy (náhled při sdílení na WhatsApp, FB)
- QR kód pro tisk a vystavení na místě konání
- Real-time aktualizace tabulky (Supabase Realtime)

---

### Fáze 5 — Mobilní responzivní verze
- Optimalizace pro telefon (horizontální scroll tabulky, velká tlačítka)
- PWA manifest (instalovatelné jako aplikace)
- Offline podpora přes Service Worker

---

### Fáze 6 — Rozšíření (volitelné)
- Export výsledků do PDF
- Více formátů: playoff pavouk, skupinová fáze + playoff
- Bonus body (rugby 7s pravidla: 4 pokusy = bonus bod)
- Statistiky hráčů (pokusy, přeměny)
- Historické výsledky a archiv turnajů

---

## Bodování — referenční karta

```
Výhra   = 3 body
Remíza  = 1 bod
Prohra  = 0 bodů

Řazení: Body → Rozdíl skóre → Skóre pro → Název týmu
```

---

*Vytvořeno: 2025 · Stack: Next.js 15 · React 19 · TypeScript · Tailwind CSS · Supabase*
