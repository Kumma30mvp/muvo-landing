import { describe, expect, it } from 'vitest';
import { EVENT_NAMES, KEY_EVENTS, LEAD_VALUE_PEN } from '../src/analytics/events';
import { createTracker } from '../src/analytics/tracker';
import { readFileSync } from 'node:fs';

function freshWindow() {
  const doc = document.implementation.createHTMLDocument('t');
  const win = { dataLayer: undefined } as unknown as Window;
  return { win, doc };
}

describe('tracker GA4', () => {
  it('queda desactivado sin un ID válido y no carga scripts', () => {
    const { win, doc } = freshWindow();
    const t = createTracker({ measurementId: 'UA-123', debug: false, win, doc });
    expect(t.enabled).toBe(false);
    expect(doc.querySelectorAll('script')).toHaveLength(0);
  });

  it('arranca con Consent Mode en denied y carga gtag.js', () => {
    const { win, doc } = freshWindow();
    const t = createTracker({ measurementId: 'G-ABC1234567', debug: false, win, doc });
    expect(t.enabled).toBe(true);
    const first = Array.from(win.dataLayer![0] as IArguments);
    expect(first[0]).toBe('consent');
    expect(first[1]).toBe('default');
    expect((first[2] as Record<string, string>).analytics_storage).toBe('denied');
    expect(doc.querySelector('script')!.getAttribute('src')).toContain('id=G-ABC1234567');
  });

  it('envía eventos tipados al dataLayer', () => {
    const { win, doc } = freshWindow();
    const t = createTracker({ measurementId: 'G-ABC1234567', debug: false, win, doc });
    t.track('generate_lead', { method: 'quiz', sedentary_level: 'alto', currency: 'PEN', value: LEAD_VALUE_PEN });
    const last = Array.from(win.dataLayer!.at(-1) as IArguments);
    expect(last).toEqual(['event', 'generate_lead', { method: 'quiz', sedentary_level: 'alto', currency: 'PEN', value: LEAD_VALUE_PEN }]);
  });

  it('el valor del lead sale del modelo cuantitativo (≈ S/ 33.90)', () => {
    expect(LEAD_VALUE_PEN).toBeCloseTo(33.9, 1);
  });

  it('docs/tracking-plan.md documenta todos los eventos y los key events', () => {
    const doc = readFileSync('docs/tracking-plan.md', 'utf8');
    for (const e of EVENT_NAMES) expect(doc).toContain(`\`${e}\``);
    for (const e of KEY_EVENTS) expect(doc).toMatch(new RegExp(`\`${e}\`.*KEY EVENT`));
  });
});
