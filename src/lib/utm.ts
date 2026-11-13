import type { KeyValueStore } from './storage';

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const STORE_KEY = 'muvo_utm';

/**
 * Guarda los UTM de la primera página vista de la sesión (first-touch de
 * sesión) para adjuntarlos al lead. Así el CRM puede cruzar cada lead con la
 * campaña de Meta o Google que lo trajo, igual que el modelo de atribución.
 */
export function captureUtm(search: string, store: KeyValueStore): Record<string, string> {
  const existing = store.get(STORE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as Record<string, string>;
    } catch {
      /* valor corrupto: se recalcula */
    }
  }
  const params = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) utm[k] = v.slice(0, 80);
  }
  if (Object.keys(utm).length) store.set(STORE_KEY, JSON.stringify(utm));
  return utm;
}
