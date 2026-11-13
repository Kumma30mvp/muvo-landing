import '@fontsource-variable/inter/wght.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import './styles/main.css';
import { createTracker } from './analytics/tracker';
import { HERO_EXPERIMENT, getOrCreateVisitorId, readForcedVariant, variantFor } from './features/ab-test';
import { mountConsent } from './features/consent';
import { mountInteractions } from './features/interactions';
import { mountLeadForm } from './features/lead-form';
import { safeStorage } from './lib/storage';
import { captureUtm } from './lib/utm';

/** Punto de entrada: compone los módulos. Cada uno se puede probar por separado. */
function bootstrap(): void {
  const local = safeStorage('local');
  const session = safeStorage('session');

  const tracker = createTracker({
    measurementId: import.meta.env.VITE_GA4_ID,
    debug: import.meta.env.VITE_GA4_DEBUG === 'true' || import.meta.env.DEV,
  });

  mountConsent(document.getElementById('consent'), tracker, local);

  // A/B test del CTA principal del hero.
  const visitorId = getOrCreateVisitorId(local, () => crypto.randomUUID());
  const variant = readForcedVariant(location.search) ?? variantFor(visitorId, HERO_EXPERIMENT.id);
  const heroCta = document.querySelector<HTMLElement>(`[data-ab="${HERO_EXPERIMENT.id}"]`);
  if (heroCta) heroCta.textContent = HERO_EXPERIMENT.variants[variant];
  document.documentElement.dataset.heroVariant = variant;
  tracker.setUserProperties({ ab_hero_cta: variant });
  if (!session.get(`exp_${HERO_EXPERIMENT.id}`)) {
    tracker.track('experiment_impression', { experiment_id: HERO_EXPERIMENT.id, variant });
    session.set(`exp_${HERO_EXPERIMENT.id}`, '1');
  }

  const utm = captureUtm(location.search, session);
  mountInteractions(document, tracker, variant);

  const form = document.getElementById('lead-form');
  if (form instanceof HTMLFormElement) mountLeadForm({ form, tracker, utm });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
