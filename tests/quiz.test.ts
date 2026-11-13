import { describe, expect, it } from 'vitest';
import { isComplete, levelFor, resultMessage, score } from '../src/features/quiz';

describe('quiz de sedentarismo', () => {
  it('suma solo preguntas puntuadas', () => {
    expect(score({ horas: 'gt8', dias: '0a1', objetivo: 'energia' })).toBe(4);
    expect(score({ horas: 'lt6', dias: '4mas', objetivo: 'forma' })).toBe(0);
  });

  it.each([
    [0, 'bajo'], [1, 'bajo'], [2, 'medio'], [3, 'alto'], [4, 'alto'],
  ] as const)('%i puntos → nivel %s', (pts, level) => {
    expect(levelFor(pts)).toBe(level);
  });

  it('detecta si el test está completo', () => {
    expect(isComplete({ horas: 'gt8', dias: '0a1' })).toBe(false);
    expect(isComplete({ horas: 'gt8', dias: '0a1', objetivo: 'espalda' })).toBe(true);
  });

  it('personaliza el mensaje según el objetivo', () => {
    const r = resultMessage({ horas: 'gt8', dias: '0a1', objetivo: 'espalda' });
    expect(r.level).toBe('alto');
    expect(r.body).toContain('espalda');
  });
});
