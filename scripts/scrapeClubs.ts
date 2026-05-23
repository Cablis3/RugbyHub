/**
 * Jednoduchý scraper pro www.rugbyunion.cz/kluby
 *
 * Spuštění (po `npm install` v projektu):
 *   npx ts-node --project tsconfig.json scripts/scrapeClubs.ts
 *
 * Výstup: vypíše JSON do konzole → přesměruj do souboru:
 *   npx ts-node scripts/scrapeClubs.ts > data/clubs-raw.json
 *
 * POZOR: Scraping může porušit podmínky webu. Používej pouze
 * pro vlastní nekomerční účely a respektuj rate limiting.
 */

const BASE_URL = 'https://www.rugbyunion.cz';

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mini-Tournify-Bot/1.0 (rugby club data collector)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractClubLinks(html: string): string[] {
  const links = new Set<string>();
  for (const match of html.matchAll(/href="(\/kluby\/[a-z0-9-]+)"/g)) {
    links.add(match[1]);
  }
  return [...links];
}

function extractText(html: string, pattern: RegExp): string {
  return html.match(pattern)?.[1]?.trim() ?? '';
}

async function scrapeClub(path: string) {
  const url = `${BASE_URL}${path}`;
  const html = await fetchHtml(url);

  const name    = extractText(html, /<h1[^>]*class="[^"]*page-title[^"]*"[^>]*>([^<]+)<\/h1>/i)
               || extractText(html, /<h1[^>]*>([^<]+)<\/h1>/);
  const website = extractText(html, /href="(https?:\/\/(?!www\.rugbyunion)[^"]+)"\s[^>]*>web/i);

  return {
    name: name || path.split('/').pop(),
    rugbyUnionUrl: url,
    website: website || undefined,
  };
}

async function main() {
  console.error('Stahuji seznam klubů...');
  const listHtml = await fetchHtml(`${BASE_URL}/kluby`);
  const paths    = extractClubLinks(listHtml);

  console.error(`Nalezeno ${paths.length} klubů. Scrapuji detaily...`);

  const clubs = [];
  for (const [i, path] of paths.entries()) {
    try {
      const club = await scrapeClub(path);
      clubs.push(club);
      console.error(`[${i + 1}/${paths.length}] OK: ${club.name}`);
    } catch (err) {
      console.error(`[${i + 1}/${paths.length}] CHYBA: ${path} —`, err);
    }
    // Rate limiting: 600 ms mezi požadavky
    await new Promise(r => setTimeout(r, 600));
  }

  // Výstup jako TypeScript export
  const ts = [
    `import { Club } from '../types';`,
    ``,
    `export const czechRugbyClubs: Club[] = ${JSON.stringify(clubs, null, 2)};`,
  ].join('\n');

  process.stdout.write(ts);
}

main().catch(err => {
  console.error('Fatální chyba:', err);
  process.exit(1);
});
