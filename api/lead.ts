import { validateLead } from '../src/lib/validation';

/**
 * POST /api/lead — función serverless de Vercel (runtime Node, firma Web).
 *
 * Responsabilidades:
 *  1. Aceptar solo JSON pequeño desde el mismo origen.
 *  2. Revalidar en el servidor (nunca confiar en el cliente).
 *  3. Descartar bots con el campo trampa sin revelarlo (responde 201 igual).
 *  4. Limitar abusos con un rate limit por IP (best effort: la memoria de una
 *     función serverless no se comparte entre instancias).
 *  5. Registrar el lead con el correo enmascarado. En producción el paso
 *     siguiente es enviarlo a la herramienta de email (flujo E1–E4).
 */

const MAX_BODY_BYTES = 4_096;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; start: number }>();

export function rateLimited(ip: string, now = Date.now()): boolean {
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export function resetRateLimit(): void {
  hits.clear();
}

export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return json(403, { error: 'forbidden_origin' });

  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json(415, { error: 'unsupported_media_type' });
  }

  const ip = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0]!.trim();
  if (rateLimited(ip)) return json(429, { error: 'too_many_requests' });

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return json(413, { error: 'payload_too_large' });

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const result = validateLead(payload);
  if (!result.ok) return json(422, { error: 'validation', fields: result.errors });

  const leadId = crypto.randomUUID();

  if (result.value.website) {
    // Bot: misma respuesta que un lead real para no darle pistas.
    return json(201, { leadId });
  }

  console.info(
    JSON.stringify({
      event: 'lead_created',
      leadId,
      email: maskEmail(result.value.email),
      answers: result.value.answers,
      utm: result.value.utm,
      at: new Date().toISOString(),
    }),
  );

  return json(201, { leadId });
}

export function GET(): Response {
  return json(405, { error: 'method_not_allowed' });
}
