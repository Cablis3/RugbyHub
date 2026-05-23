/**
 * lib/storage.ts
 * Data jsou nyní uložena v Supabase — viz lib/db.ts.
 * Zde zůstává pouze pomocná funkce pro generování ID.
 */

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
