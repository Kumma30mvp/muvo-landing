# Muvo · Landing de conversión

Landing de la marca ficticia **Muvo** (coaching fitness online) para el Proyecto Integrador de Digital Media Marketing — UTEC, **Grupo 01**: Enzo Santillán y Gabriel Blanco.

Cubre la unidad U3 de la rúbrica: web ficticia conectada a GA4, formulario de conversión (test “¿Qué tan sedentario eres?”) con eventos configurados, SEO on-page y base para el análisis técnico.

## Stack

Vite 8 · TypeScript 7 (modo estricto) · Vitest + jsdom · función serverless de Vercel · GA4 (gtag.js + Consent Mode v2).

## Estructura

```
index.html                 Landing (SEO, Open Graph, JSON-LD Organization/Service/FAQPage)
privacidad.html            Política de privacidad y cookies
src/
  main.ts                  Composición de módulos
  analytics/events.ts      Plan de medición tipado (contrato de eventos)
  analytics/tracker.ts     Cliente GA4 con Consent Mode v2
  features/                quiz · lead-form · ab-test · consent · interactions
  lib/                     validation (compartida con la API) · storage · utm
  styles/main.css          Tokens y estilos
api/lead.ts                POST /api/lead (validación, rate limit, honeypot)
tests/                     Unitarias + integración DOM + API
docs/                      tracking-plan.md · architecture.md · deploy-ga4.md
```

## Desarrollo

```bash
npm ci
cp .env.example .env      # pon tu VITE_GA4_ID
npm run dev               # http://localhost:5173 (sin la API)
npx vercel dev            # con la API /api/lead
npm run check             # typecheck + tests + build
```

Despliegue y conexión con GA4: ver [`docs/deploy-ga4.md`](docs/deploy-ga4.md).
