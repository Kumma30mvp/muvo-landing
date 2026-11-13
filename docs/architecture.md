# Arquitectura

```
Navegador                                     Vercel
┌───────────────────────────────────┐        ┌──────────────────────────────┐
│ index.html (estático, SEO, JSON-LD)│        │ CDN: dist/ + cabeceras CSP   │
│                                   │        │                              │
│ main.ts  ── compone módulos       │        │ api/lead.ts (serverless)     │
│  ├─ analytics/tracker  ──► gtag ──┼──────► │  ├─ origen, tipo, tamaño      │
│  ├─ features/consent              │  GA4   │  ├─ rate limit por IP        │
│  ├─ features/ab-test              │        │  ├─ validateLead (compartida)│
│  ├─ features/interactions         │        │  ├─ honeypot                 │
│  └─ features/lead-form ──fetch────┼──────► │  └─ log con correo enmascarado│
│        └─ lib/validation ◄────────┼────────┼── misma función             │
└───────────────────────────────────┘        └──────────────────────────────┘
```

## Decisiones (ADR resumidas)

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| ADR-01 | Vite + TypeScript sin framework | Una landing no necesita estado complejo; 4.4 KB de JS gzip favorece LCP/INP y el Quality Score de Google Ads | Next.js / React: más JS y complejidad sin beneficio aquí |
| ADR-02 | Plan de medición como tipos (`EventMap`) | El compilador impide eventos fuera del plan o con parámetros mal escritos; un test lo cruza con la documentación | `gtag('event', 'string libre')` disperso por el código |
| ADR-03 | Tracking declarativo con `data-*` | Marketing agrega o mueve botones sin tocar JS | Listeners por botón |
| ADR-04 | Validación compartida cliente/servidor | Una sola regla; el servidor nunca confía en el cliente | Validar dos veces con reglas distintas |
| ADR-05 | Consent Mode v2 en `denied` por defecto | Ley 29733; GA4 sigue modelando conversiones sin cookies | Cargar GA4 sin consentimiento |
| ADR-06 | Sin scripts inline + CSP estricta | Mitiga XSS e inyección de terceros | `'unsafe-inline'` |
| ADR-07 | Sin base de datos en esta fase | Alcance académico; el lead queda en logs con PII enmascarada. Siguiente paso: integrar la herramienta de email del flujo E1–E4 | Guardar PII sin necesidad |
| ADR-08 | A/B test propio (hash determinístico) | Google Optimize se retiró en 2023; el experimento es simple y se mide en GA4 | Herramientas pagadas |

## Calidad

- `npm run check` = typecheck estricto + 40+ tests + build. Corre en GitHub Actions en cada push y PR.
- Accesibilidad: HTML semántico, radios y `<details>` nativos, foco visible, errores con `aria-invalid` y `aria-describedby`, objetivos táctiles ≥ 44 px, contraste AA.
- Rendimiento: CSS y JS mínimos, sin imágenes pesadas, fuentes con `display=swap`, assets con caché inmutable.
