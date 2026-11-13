export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/**
 * Envoltorio seguro de Web Storage: en modo privado, iframes con
 * restricciones o cuando la cuota está llena, `localStorage` lanza
 * excepciones. Aquí se degrada a memoria en lugar de romper la página.
 */
export function safeStorage(kind: 'local' | 'session'): KeyValueStore {
  const memory = new Map<string, string>();
  let backend: Storage | null = null;
  try {
    backend = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = '__muvo_probe__';
    backend.setItem(probe, '1');
    backend.removeItem(probe);
  } catch {
    backend = null;
  }
  return {
    get(key) {
      try {
        return backend ? backend.getItem(key) : (memory.get(key) ?? null);
      } catch {
        return memory.get(key) ?? null;
      }
    },
    set(key, value) {
      try {
        if (backend) backend.setItem(key, value);
        else memory.set(key, value);
      } catch {
        memory.set(key, value);
      }
    },
  };
}

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v) };
}
