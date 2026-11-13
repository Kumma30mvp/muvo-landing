import { PLAN_PRICES_PEN, type CtaLocation, type PlanId, type Variant } from '../analytics/events';
import type { Tracker } from '../analytics/tracker';

const CTA_LOCATIONS = new Set<CtaLocation>(['header', 'hero', 'plans', 'final_cta', 'sticky_mobile']);
const PLANS = new Set<PlanId>(['mensual', 'trimestral', 'anual']);

/**
 * Tracking declarativo: el HTML marca los elementos con `data-cta`,
 * `data-plan` o `data-wa`, y un único listener delegado envía el evento.
 * Agregar un botón nuevo no exige tocar JavaScript.
 */
export function mountInteractions(root: Document, tracker: Tracker, heroVariant: Variant): void {
  root.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-cta],[data-plan],[data-wa]');
    if (!el) return;

    const cta = el.dataset.cta as CtaLocation | undefined;
    if (cta && CTA_LOCATIONS.has(cta)) {
      tracker.track('cta_click', {
        cta_text: (el.textContent ?? '').trim().slice(0, 60),
        cta_location: cta,
        ...(el.dataset.ab ? { ab_variant: heroVariant } : {}),
      });
    }

    const plan = el.dataset.plan as PlanId | undefined;
    if (plan && PLANS.has(plan)) {
      tracker.track('select_plan', { plan, value: PLAN_PRICES_PEN[plan], currency: 'PEN' });
      tracker.track('begin_trial', { plan });
    }

    const wa = el.dataset.wa;
    if (wa === 'floating' || wa === 'sticky_mobile') tracker.track('whatsapp_click', { location: wa });
  });

  // FAQ con <details>: funciona sin JS; aquí solo se mide la apertura.
  root.querySelectorAll<HTMLDetailsElement>('.faq details').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) tracker.track('faq_open', { question: d.querySelector('summary')?.textContent?.trim() ?? '' });
    });
  });
}
