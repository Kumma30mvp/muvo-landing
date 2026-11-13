import type { EventMap, EventName } from './events';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export interface TrackerOptions {
  measurementId: string | undefined;
  debug: boolean;
  /** Inyectable para pruebas; por defecto `window` y `document`. */
  win?: Window;
  doc?: Document;
}

export interface Tracker {
  readonly enabled: boolean;
  track<E extends EventName>(name: E, params: EventMap[E]): void;
  setUserProperties(props: Record<string, string>): void;
  updateConsent(granted: boolean): void;
}

const GA_ID_PATTERN = /^G-[A-Z0-9]{6,12}$/;

/**
 * Crea el cliente de analítica.
 *
 * - Sin ID válido no carga nada: la página funciona igual (degradación elegante).
 * - Arranca con Google Consent Mode v2 en "denied" y solo concede
 *   `analytics_storage` cuando la persona acepta el banner. No hay
 *   almacenamiento publicitario: Muvo no usa remarketing desde la web.
 * - Sin scripts inline: el stub de gtag se define aquí, compatible con la CSP
 *   de `vercel.json`.
 */
export function createTracker(opts: TrackerOptions): Tracker {
  const win = opts.win ?? window;
  const doc = opts.doc ?? document;
  const id = opts.measurementId?.trim();

  if (!id || !GA_ID_PATTERN.test(id)) {
    if (opts.debug) console.info('[analytics] desactivada: falta VITE_GA4_ID válido');
    return {
      enabled: false,
      track: (name, params) => {
        if (opts.debug) console.info('[analytics:noop]', name, params);
      },
      setUserProperties: () => {},
      updateConsent: () => {},
    };
  }

  win.dataLayer = win.dataLayer ?? [];
  // gtag debe empujar el objeto `arguments`, no un array (requisito de gtag.js).
  const gtag: Gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    win.dataLayer!.push(arguments);
  };
  win.gtag = gtag;

  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
  gtag('js', new Date());
  gtag('config', id, {
    send_page_view: true,
    ...(opts.debug ? { debug_mode: true } : {}),
  });

  const script = doc.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  doc.head.appendChild(script);

  return {
    enabled: true,
    track(name, params) {
      gtag('event', name, params);
      if (opts.debug) console.info('[analytics]', name, params);
    },
    setUserProperties(props) {
      gtag('set', 'user_properties', props);
    },
    updateConsent(granted) {
      gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    },
  };
}
