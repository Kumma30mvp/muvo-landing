/**
 * Validación del lead compartida entre el navegador y la función serverless
 * `api/lead.ts`. El servidor nunca confía en la validación del cliente:
 * vuelve a ejecutar la misma función.
 */

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  consent: boolean;
  answers: Record<string, string>;
  utm?: Record<string, string>;
  /** Campo trampa: los humanos no lo ven; si viene lleno es un bot. */
  website?: string;
}

export type FieldError = { field: keyof LeadInput | 'payload'; reason: string };
export type ValidationResult = { ok: true; value: LeadInput } | { ok: false; errors: FieldError[] };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
/** Celular peruano: 9 dígitos que empiezan en 9, con o sin +51. */
const PE_MOBILE = /^(?:\+?51)?9\d{8}$/;
const ALLOWED_ANSWER_KEYS = new Set(['horas', 'dias', 'objetivo']);
const ALLOWED_UTM_KEYS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']);
const SAFE_TOKEN = /^[\w.\-]{1,80}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

function cleanText(s: unknown, max: number): string {
  return typeof s === 'string' ? s.normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max) : '';
}

function pickTokens(obj: unknown, allowed: Set<string>): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (allowed.has(k) && typeof v === 'string' && SAFE_TOKEN.test(v)) out[k] = v;
    }
  }
  return out;
}

export function validateLead(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') return { ok: false, errors: [{ field: 'payload', reason: 'invalid' }] };
  const r = raw as Record<string, unknown>;
  const errors: FieldError[] = [];

  const name = cleanText(r.name, 60);
  if (name.length < 2) errors.push({ field: 'name', reason: 'required' });

  const email = cleanText(r.email, 254).toLowerCase();
  if (!EMAIL.test(email)) errors.push({ field: 'email', reason: 'format' });

  const phoneRaw = cleanText(r.phone, 20);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : '';
  if (phone && !PE_MOBILE.test(phone)) errors.push({ field: 'phone', reason: 'format' });

  if (r.consent !== true) errors.push({ field: 'consent', reason: 'required' });

  const answers = pickTokens(r.answers, ALLOWED_ANSWER_KEYS);
  if (Object.keys(answers).length !== ALLOWED_ANSWER_KEYS.size) errors.push({ field: 'answers', reason: 'incomplete' });

  const website = cleanText(r.website, 200);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      email,
      ...(phone ? { phone } : {}),
      consent: true,
      answers,
      utm: pickTokens(r.utm, ALLOWED_UTM_KEYS),
      ...(website ? { website } : {}),
    },
  };
}

export const ERROR_MESSAGES: Record<string, string> = {
  'name:required': 'Escribe tu nombre (mínimo 2 letras).',
  'email:format': 'Revisa tu correo: parece incompleto.',
  'phone:format': 'Usa un celular peruano de 9 dígitos que empiece en 9.',
  'consent:required': 'Necesitamos tu consentimiento para enviarte el mini-plan.',
  'answers:incomplete': 'Responde las tres preguntas del test.',
  'payload:invalid': 'No pudimos procesar el formulario. Intenta de nuevo.',
};
