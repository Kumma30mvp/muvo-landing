import type { SedentaryLevel } from '../analytics/events';

/**
 * Lead magnet "¿Qué tan sedentario eres?" como lógica pura (sin DOM),
 * para poder probarla de forma aislada.
 */
export interface QuizOption {
  readonly value: string;
  readonly label: string;
  /** Puntos de sedentarismo que suma la respuesta (más = más sedentario). */
  readonly points: number;
}

export interface QuizQuestion {
  readonly id: 'horas' | 'dias' | 'objetivo';
  readonly label: string;
  readonly options: readonly QuizOption[];
  /** Si suma al puntaje o solo personaliza el mini-plan. */
  readonly scored: boolean;
}

export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'horas',
    label: '¿Cuántas horas pasas sentado al día?',
    scored: true,
    options: [
      { value: 'lt6', label: 'Menos de 6', points: 0 },
      { value: '6a8', label: '6 a 8', points: 1 },
      { value: 'gt8', label: 'Más de 8', points: 2 },
    ],
  },
  {
    id: 'dias',
    label: '¿Cuántos días a la semana te mueves 20 minutos o más?',
    scored: true,
    options: [
      { value: '0a1', label: '0 a 1', points: 2 },
      { value: '2a3', label: '2 a 3', points: 1 },
      { value: '4mas', label: '4 o más', points: 0 },
    ],
  },
  {
    id: 'objetivo',
    label: '¿Qué quieres lograr primero?',
    scored: false,
    options: [
      { value: 'energia', label: 'Más energía', points: 0 },
      { value: 'espalda', label: 'Menos dolor de espalda', points: 0 },
      { value: 'forma', label: 'Sentirme en forma', points: 0 },
    ],
  },
];

export type Answers = Partial<Record<QuizQuestion['id'], string>>;

export function isComplete(answers: Answers): boolean {
  return QUESTIONS.every((q) => typeof answers[q.id] === 'string');
}

export function score(answers: Answers): number {
  return QUESTIONS.filter((q) => q.scored).reduce((acc, q) => {
    const opt = q.options.find((o) => o.value === answers[q.id]);
    return acc + (opt?.points ?? 0);
  }, 0);
}

/** 0–1 bajo · 2 medio · 3–4 alto. */
export function levelFor(points: number): SedentaryLevel {
  if (points >= 3) return 'alto';
  if (points === 2) return 'medio';
  return 'bajo';
}

const PLAN_BY_GOAL: Record<string, string> = {
  energia: 'rutinas de activación de 15 min por la mañana',
  espalda: 'movilidad de espalda y cuello entre reuniones',
  forma: 'circuitos de fuerza con tu peso corporal',
};

export function resultMessage(answers: Answers): { level: SedentaryLevel; title: string; body: string } {
  const level = levelFor(score(answers));
  const focus = PLAN_BY_GOAL[answers.objetivo ?? ''] ?? 'rutinas cortas en casa';
  const titles: Record<SedentaryLevel, string> = {
    alto: 'Sedentarismo alto: tu cuerpo te está pidiendo moverse',
    medio: 'Sedentarismo medio: ya tienes una base, falta constancia',
    bajo: 'Sedentarismo bajo: vamos a sostener el hábito',
  };
  return {
    level,
    title: titles[level],
    body: `Te enviamos un mini-plan de 7 días centrado en ${focus}. Tu coach puede acompañarte desde hoy con la prueba gratis.`,
  };
}
