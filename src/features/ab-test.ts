import type { Variant } from '../analytics/events';
import type { KeyValueStore } from '../lib/storage';

/**
 * Experimento del hero (diseñado en el PPT, sección U6 · CRO):
 *   A (control): "Empieza gratis 7 días"
 *   B          : "Haz el test gratis"
 * Métrica primaria: tasa clic → lead. Asignación 50/50, persistente por
 * visitante para que no cambie de variante entre visitas.
 */
export const HERO_EXPERIMENT = {
  id: 'hero_cta_v1',
  variants: {
    A: 'Empieza gratis 7 días',
    B: 'Haz el test gratis',
  } satisfies Record<Variant, string>,
} as const;

/** FNV-1a de 32 bits: hash estable y sin dependencias. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Asignación determinística: el mismo visitante siempre cae en la misma variante. */
export function variantFor(visitorId: string, experimentId: string): Variant {
  return fnv1a(`${experimentId}:${visitorId}`) % 2 === 0 ? 'A' : 'B';
}

/** Permite forzar la variante con ?variant=A|B (útil para QA y capturas). */
export function readForcedVariant(search: string): Variant | null {
  const v = new URLSearchParams(search).get('variant');
  return v === 'A' || v === 'B' ? v : null;
}

export function getOrCreateVisitorId(store: KeyValueStore, random: () => string): string {
  const key = 'muvo_vid';
  const existing = store.get(key);
  if (existing) return existing;
  const id = random();
  store.set(key, id);
  return id;
}
