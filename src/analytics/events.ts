/**
 * Plan de medición de Muvo como contrato tipado.
 *
 * Cada evento que la landing envía a GA4 está declarado aquí con sus
 * parámetros. El compilador impide enviar un evento no planificado o con
 * parámetros incorrectos, y `docs/tracking-plan.md` se mantiene alineado
 * con este archivo (lo verifica `tests/events.test.ts`).
 *
 * Regla de privacidad: ningún parámetro lleva PII (nombre, correo, teléfono).
 * Las políticas de Google Analytics lo prohíben y la Ley 29733 lo exige.
 */

export type CtaLocation = 'header' | 'hero' | 'plans' | 'final_cta' | 'sticky_mobile';
export type PlanId = 'mensual' | 'trimestral' | 'anual';
export type SedentaryLevel = 'alto' | 'medio' | 'bajo';
export type Variant = 'A' | 'B';

export interface EventMap {
  /** Clic en cualquier CTA hacia el test o la prueba. */
  cta_click: { cta_text: string; cta_location: CtaLocation; ab_variant?: Variant };
  /** Primera respuesta del test "¿Qué tan sedentario eres?". */
  quiz_start: { quiz_id: 'sedentarismo_v1' };
  /** Avance de pregunta dentro del test. */
  quiz_step: { quiz_id: 'sedentarismo_v1'; step: number };
  /** Envío válido del formulario. KEY EVENT (conversión primaria). */
  generate_lead: { method: 'quiz'; sedentary_level: SedentaryLevel; currency: 'PEN'; value: number };
  /** Error de validación del formulario (diagnóstico de CRO). */
  form_error: { field: string; reason: string };
  /** Elección de plan en la sección Planes. */
  select_plan: { plan: PlanId; value: number; currency: 'PEN' };
  /** Inicio de prueba gratuita desde un plan. KEY EVENT. */
  begin_trial: { plan: PlanId };
  /** Clic al botón de WhatsApp. */
  whatsapp_click: { location: 'floating' | 'sticky_mobile' };
  /** Apertura de una pregunta frecuente. */
  faq_open: { question: string };
  /** Exposición a un experimento A/B (se envía una vez por sesión). */
  experiment_impression: { experiment_id: string; variant: Variant };
}

export type EventName = keyof EventMap;

/** Eventos marcados como "evento clave" (conversión) en GA4. */
export const KEY_EVENTS: readonly EventName[] = ['generate_lead', 'begin_trial'] as const;

export const EVENT_NAMES: readonly EventName[] = [
  'cta_click',
  'quiz_start',
  'quiz_step',
  'generate_lead',
  'form_error',
  'select_plan',
  'begin_trial',
  'whatsapp_click',
  'faq_open',
  'experiment_impression',
] as const;

/**
 * Valor esperado de un lead en PEN, derivado del modelo cuantitativo
 * (TrabajoFinal_Grupo01.xlsx):
 *   LTV de contribución 12 m (US$ 59.28, Unit_Economics) × TC 3.432
 *   × lead→prueba 83.3 % × prueba→pago 20 %  ≈ S/ 33.90
 */
const LTV_CONTRIBUTION_USD = 59.28;
const FX_PEN_PER_USD = 3.432;
const LEAD_TO_TRIAL = 0.833;
const TRIAL_TO_PAID = 0.2;
export const LEAD_VALUE_PEN =
  Math.round(LTV_CONTRIBUTION_USD * FX_PEN_PER_USD * LEAD_TO_TRIAL * TRIAL_TO_PAID * 100) / 100;

export const PLAN_PRICES_PEN: Record<PlanId, number> = {
  mensual: 89,
  trimestral: 237,
  anual: 828,
};
