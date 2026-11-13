import { describe, expect, it } from 'vitest';
import { getOrCreateVisitorId, readForcedVariant, variantFor } from '../src/features/ab-test';
import { memoryStore } from '../src/lib/storage';

describe('A/B test del hero', () => {
  it('asigna siempre la misma variante al mismo visitante', () => {
    expect(variantFor('visitor-1', 'hero_cta_v1')).toBe(variantFor('visitor-1', 'hero_cta_v1'));
  });

  it('reparte cerca de 50/50 en 10,000 visitantes', () => {
    let a = 0;
    for (let i = 0; i < 10_000; i++) if (variantFor(`v-${i}`, 'hero_cta_v1') === 'A') a++;
    expect(a / 10_000).toBeGreaterThan(0.47);
    expect(a / 10_000).toBeLessThan(0.53);
  });

  it('permite forzar la variante por URL solo con valores válidos', () => {
    expect(readForcedVariant('?variant=B')).toBe('B');
    expect(readForcedVariant('?variant=Z')).toBeNull();
  });

  it('persiste el id de visitante', () => {
    const store = memoryStore();
    const first = getOrCreateVisitorId(store, () => 'abc');
    const second = getOrCreateVisitorId(store, () => 'xyz');
    expect(first).toBe('abc');
    expect(second).toBe('abc');
  });
});
