import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Tracker } from '../src/analytics/tracker';
import { mountLeadForm } from '../src/features/lead-form';

function setup(fetchImpl: typeof fetch) {
  const html = readFileSync('index.html', 'utf8');
  document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
  const calls: Array<[string, unknown]> = [];
  const tracker: Tracker = {
    enabled: true,
    track: (n, p) => void calls.push([n, p]),
    setUserProperties: () => {},
    updateConsent: () => {},
  };
  const form = document.getElementById('lead-form') as HTMLFormElement;
  mountLeadForm({ form, tracker, utm: { utm_source: 'meta' }, fetchImpl });
  return { form, calls };
}

function answerAll(form: HTMLFormElement) {
  for (const id of ['q-horas-gt8', 'q-dias-0a1', 'q-objetivo-espalda']) {
    const el = form.querySelector<HTMLInputElement>(`#${id}`)!;
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('formulario del test (integración DOM)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renderiza 3 preguntas con radios accesibles', () => {
    const { form } = setup(vi.fn());
    expect(form.querySelectorAll('fieldset.question')).toHaveLength(3);
    expect(form.querySelectorAll('input[type=radio]')).toHaveLength(9);
    form.querySelectorAll('input[type=radio]').forEach((r) => expect(form.querySelector(`label[for="${r.id}"]`)).not.toBeNull());
  });

  it('dispara quiz_start una sola vez y quiz_step por respuesta', () => {
    const { form, calls } = setup(vi.fn());
    answerAll(form);
    expect(calls.filter(([n]) => n === 'quiz_start')).toHaveLength(1);
    expect(calls.filter(([n]) => n === 'quiz_step')).toHaveLength(3);
  });

  it('muestra errores accesibles y no llama a la API si faltan datos', async () => {
    const fetchImpl = vi.fn();
    const { form, calls } = setup(fetchImpl as unknown as typeof fetch);
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(form.querySelector('#f-email')!.getAttribute('aria-invalid')).toBe('true');
    expect(calls.some(([n]) => n === 'form_error')).toBe(true);
  });

  it('envía el lead, registra generate_lead sin PII y muestra el resultado', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ leadId: 'x' }), { status: 201 }));
    const { form, calls } = setup(fetchImpl as unknown as typeof fetch);
    answerAll(form);
    (form.querySelector('#f-name') as HTMLInputElement).value = 'Camila';
    (form.querySelector('#f-email') as HTMLInputElement).value = 'camila@ejemplo.com';
    (form.querySelector('#f-consent') as HTMLInputElement).checked = true;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush(); await flush();

    expect(fetchImpl).toHaveBeenCalledOnce();
    const sent = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent.utm).toEqual({ utm_source: 'meta' });

    const lead = calls.find(([n]) => n === 'generate_lead');
    expect(lead).toBeDefined();
    const serialized = JSON.stringify(calls);
    expect(serialized).not.toContain('camila@ejemplo.com');
    expect(serialized).not.toContain('Camila');
    expect(document.getElementById('quiz-result')!.hidden).toBe(false);
    expect(document.getElementById('result-title')!.textContent).toContain('alto');
  });

  it('muestra un mensaje si la red falla y no registra conversión', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('offline'); });
    const { form, calls } = setup(fetchImpl as unknown as typeof fetch);
    answerAll(form);
    (form.querySelector('#f-name') as HTMLInputElement).value = 'Camila';
    (form.querySelector('#f-email') as HTMLInputElement).value = 'camila@ejemplo.com';
    (form.querySelector('#f-consent') as HTMLInputElement).checked = true;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush(); await flush();
    expect(document.getElementById('form-status')!.textContent).toContain('No pudimos');
    expect(calls.some(([n]) => n === 'generate_lead')).toBe(false);
  });
});
