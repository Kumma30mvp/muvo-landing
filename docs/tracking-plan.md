# Plan de medición GA4 · Muvo

Fuente de verdad en código: `src/analytics/events.ts`. Este documento se valida en CI (`tests/tracker.test.ts`): si se agrega un evento al código y no aquí, el build falla.

**Regla de privacidad:** ningún evento lleva nombre, correo ni teléfono (política de GA4 y Ley N.° 29733).

## Eventos personalizados

| Evento | Cuándo se dispara | Parámetros | Tipo |
|---|---|---|---|
| `cta_click` | Clic en cualquier botón “Empieza gratis” / “Haz el test” | `cta_text`, `cta_location` (header, hero, plans, final_cta, sticky_mobile), `ab_variant` | Micro-conversión |
| `quiz_start` | Primera respuesta del test | `quiz_id` | Micro-conversión |
| `quiz_step` | Cada respuesta del test | `quiz_id`, `step` (1–3) | Embudo |
| `generate_lead` | Envío válido del formulario, confirmado por `/api/lead` (201) | `method`, `sedentary_level`, `value` (S/ 33.90), `currency` | KEY EVENT (conversión primaria) |
| `form_error` | Error de validación | `field`, `reason` | Diagnóstico CRO |
| `select_plan` | Clic en “Empezar prueba gratis” de un plan | `plan`, `value`, `currency` | Micro-conversión |
| `begin_trial` | Mismo clic, como intención de prueba | `plan` | KEY EVENT |
| `whatsapp_click` | Botón flotante de WhatsApp | `location` | Micro-conversión |
| `faq_open` | Apertura de una pregunta frecuente | `question` | Engagement |
| `experiment_impression` | Exposición al A/B test (1 vez por sesión) | `experiment_id`, `variant` | Experimentación |

Automáticos (Enhanced Measurement): `page_view`, `scroll` (90 %), `user_engagement`, `click` saliente.

**Propiedad de usuario:** `ab_hero_cta` = A | B.

## Valor del lead

`value` de `generate_lead` = LTV de contribución 12 m (US$ 59.28) × TC 3.432 × lead→prueba 83.3 % × prueba→pago 20 % ≈ **S/ 33.90**. Así GA4 reporta ingresos esperados por canal, comparables con el ROAS del modelo Excel.

## A/B test del hero

| | Variante A (control) | Variante B |
|---|---|---|
| CTA principal | “Empieza gratis 7 días” | “Haz el test gratis” |
| CTA secundario (fijo) | “Ver planes” | “Ver planes” |

- Asignación 50/50 determinística (hash FNV-1a del id de visitante), persistente.
- Métrica primaria: `generate_lead` / usuarios, por `ab_hero_cta`. Guardarraíl: `begin_trial` no cae.
- Muestra: 9,800 visitas por variante (≈ 24 días), α 5 %, potencia 80 % — ver Excel, hoja KPIs.
- QA: `?variant=A` o `?variant=B` fuerza la variante.

## Convención UTM

| Parámetro | Valores |
|---|---|
| `utm_source` | `meta`, `google`, `tiktok`, `youtube`, `email`, `whatsapp` |
| `utm_medium` | `paid_social`, `cpc`, `email`, `referral` |
| `utm_campaign` | `muvo_prospecting`, `muvo_retargeting`, `muvo_search_alta_intencion`, `muvo_brand` |
| `utm_content` | id del anuncio o creatividad |

Los UTM se guardan en la sesión y viajan con el lead a `/api/lead` para cruzar leads con campañas (base del modelo de atribución 40/20/40).

## Configuración en GA4

1. Marcar como **evento clave**: `generate_lead`, `begin_trial`.
2. Dimensiones personalizadas (ámbito evento): `cta_location`, `sedentary_level`, `plan`, `variant`. Ámbito usuario: `ab_hero_cta`.
3. Retención de datos: 14 meses.
4. Validar con **DebugView** (desplegar con `VITE_GA4_DEBUG=true` en Preview).
