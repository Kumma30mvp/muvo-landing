import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST, maskEmail, resetRateLimit } from '../api/lead';

const body = {
  name: 'Camila', email: 'camila@ejemplo.com', consent: true,
  answers: { horas: 'gt8', dias: '0a1', objetivo: 'espalda' },
};

function req(payload: unknown, headers: Record<string, string> = {}) {
  return new Request('https://muvo.test/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'muvo.test', origin: 'https://muvo.test', 'x-forwarded-for': '1.1.1.1', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

describe('POST /api/lead', () => {
  beforeEach(() => { resetRateLimit(); vi.spyOn(console, 'info').mockImplementation(() => {}); });

  it('crea el lead (201) y registra el correo enmascarado', async () => {
    const res = await POST(req(body));
    expect(res.status).toBe(201);
    expect((await res.json()).leadId).toMatch(/[0-9a-f-]{36}/);
    expect(String(vi.mocked(console.info).mock.calls[0]?.[0])).toContain('ca***@ejemplo.com');
  });

  it('revalida en el servidor (422)', async () => {
    const res = await POST(req({ ...body, email: 'malo' }));
    expect(res.status).toBe(422);
  });

  it('bloquea otros orígenes (403), tipos de contenido (415) y JSON roto (400)', async () => {
    expect((await POST(req(body, { origin: 'https://evil.test' }))).status).toBe(403);
    expect((await POST(req(body, { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await POST(req('{malo'))).status).toBe(400);
  });

  it('rechaza cuerpos grandes (413)', async () => {
    expect((await POST(req({ ...body, name: 'x'.repeat(5000) }))).status).toBe(413);
  });

  it('aplica rate limit por IP (429 al 6.º intento por minuto)', async () => {
    for (let i = 0; i < 5; i++) expect((await POST(req(body))).status).toBe(201);
    expect((await POST(req(body))).status).toBe(429);
  });

  it('responde 201 al bot del honeypot sin registrar nada', async () => {
    const res = await POST(req({ ...body, website: 'spam.com' }));
    expect(res.status).toBe(201);
    expect(console.info).not.toHaveBeenCalled();
  });

  it('GET no está permitido', () => {
    expect(GET().status).toBe(405);
  });

  it('enmascara correos', () => {
    expect(maskEmail('gabriel@utec.edu.pe')).toBe('ga***@utec.edu.pe');
  });
});
