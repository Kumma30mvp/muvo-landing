# Despliegue en Vercel y conexión con GA4

## 1. Crear la propiedad de GA4 (5 min)

1. Entra a <https://analytics.google.com> → **Administrar** → **Crear propiedad**: nombre `Muvo – Landing`, zona horaria **Perú**, moneda **PEN**.
2. Categoría: *Salud y fitness*. Objetivo: *Generar clientes potenciales*.
3. **Flujos de datos → Web**: URL de Vercel (paso 2). Deja activada la **medición mejorada**.
4. Copia el **ID de medición** (`G-XXXXXXXXXX`).

## 2. Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub (por ejemplo `muvo-landing`).
2. En <https://vercel.com/new> importa el repositorio. Vercel detecta Vite solo (`vercel.json` ya define build y salida).
3. **Settings → Environment Variables**:

| Variable | Production | Preview |
|---|---|---|
| `VITE_GA4_ID` | `G-XXXXXXXXXX` | `G-XXXXXXXXXX` |
| `VITE_SITE_URL` | `https://<tu-proyecto>.vercel.app` | igual |
| `VITE_GA4_DEBUG` | `false` | `true` |

4. **Deploy**. Cada push a `main` publica a producción; cada PR genera una URL de Preview.

> Las variables `VITE_*` se insertan al compilar: si las cambias, vuelve a desplegar.

## 3. Configurar GA4

1. **Administrar → Eventos**: cuando aparezcan, marca `generate_lead` y `begin_trial` como **evento clave**.
2. **Definiciones personalizadas**: crea `cta_location`, `sedentary_level`, `plan`, `variant` (evento) y `ab_hero_cta` (usuario).

## 4. Revisar los eventos (evidencia para el PPT)

1. Abre la URL de **Preview** (con `VITE_GA4_DEBUG=true`), acepta las cookies y completa el test.
2. En GA4 → **Administrar → DebugView** deben aparecer en orden: `page_view`, `experiment_impression`, `cta_click`, `quiz_start`, `quiz_step` ×3, `generate_lead`.
3. **Informes → Tiempo real**: confirma el evento clave.
4. Toma capturas de DebugView, Tiempo real y la lista de eventos clave para la diapositiva de SEO/SEM.

Si no aparece nada: revisa que aceptaste el banner, desactiva bloqueadores de anuncios y confirma el ID en *Ver código fuente → gtag/js?id=*.

## 5. Análisis técnico (para el criterio U3)

```bash
npx lighthouse https://<tu-proyecto>.vercel.app --preset=desktop --output html --output-path lighthouse-desktop.html
npx lighthouse https://<tu-proyecto>.vercel.app --form-factor=mobile --output html --output-path lighthouse-mobile.html
```

O usa <https://pagespeed.web.dev>. Luego se pasa el reporte por IA para el análisis on-page y técnico.
