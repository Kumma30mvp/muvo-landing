import { describe, expect, it } from 'vitest';
import { validateLead } from '../src/lib/validation';

const valid = {
  name: 'Camila',
  email: 'Camila@Ejemplo.com ',
  phone: '987 654 321',
  consent: true,
  answers: { horas: 'gt8', dias: '0a1', objetivo: 'espalda' },
  utm: { utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'muvo_prospecting', evil: 'x' },
};

describe('validateLead', () => {
  it('acepta un lead válido y normaliza datos', () => {
    const r = validateLead(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.email).toBe('camila@ejemplo.com');
    expect(r.value.phone).toBe('987654321');
    expect(r.value.utm).toEqual({ utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'muvo_prospecting' });
  });

  it('acepta celular con +51 y sin teléfono', () => {
    expect(validateLead({ ...valid, phone: '+51 987654321' }).ok).toBe(true);
    expect(validateLead({ ...valid, phone: '' }).ok).toBe(true);
  });

  it.each([
    [{ name: 'A' }, 'name'],
    [{ email: 'camila@' }, 'email'],
    [{ phone: '012345678' }, 'phone'],
    [{ consent: false }, 'consent'],
    [{ answers: { horas: 'gt8' } }, 'answers'],
  ])('rechaza %o en el campo %s', (patch, field) => {
    const r = validateLead({ ...valid, ...patch });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.field)).toContain(field);
  });

  it('elimina caracteres de control y etiquetas HTML del nombre', () => {
    const r = validateLead({ ...valid, name: '<script>Camila</script>\u0000' });
    expect(r.ok && r.value.name).toBe('scriptCamila/script');
  });

  it('descarta respuestas o UTM con valores no seguros', () => {
    const r = validateLead({ ...valid, answers: { ...valid.answers, horas: 'gt8"><img>' } });
    expect(r.ok).toBe(false);
  });

  it('rechaza payloads que no son objetos', () => {
    expect(validateLead(null).ok).toBe(false);
    expect(validateLead('hola').ok).toBe(false);
  });
});
