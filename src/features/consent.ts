import type { Tracker } from '../analytics/tracker';
import type { KeyValueStore } from '../lib/storage';

const KEY = 'muvo_consent_v1';
export type ConsentChoice = 'granted' | 'denied';

/**
 * Banner de consentimiento (Ley 29733 + Consent Mode v2).
 * La decisión se guarda 1 sola vez; si ya existe se aplica sin mostrar el banner.
 */
export function mountConsent(root: HTMLElement | null, tracker: Tracker, store: KeyValueStore): void {
  if (!root || !tracker.enabled) return;

  const saved = store.get(KEY) as ConsentChoice | null;
  if (saved === 'granted' || saved === 'denied') {
    tracker.updateConsent(saved === 'granted');
    return;
  }

  root.hidden = false;
  root.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-consent]');
    if (!btn) return;
    const choice: ConsentChoice = btn.dataset.consent === 'grant' ? 'granted' : 'denied';
    store.set(KEY, choice);
    tracker.updateConsent(choice === 'granted');
    root.hidden = true;
  });
}
