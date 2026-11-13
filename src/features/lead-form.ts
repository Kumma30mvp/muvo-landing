import { LEAD_VALUE_PEN } from '../analytics/events';
import type { Tracker } from '../analytics/tracker';
import { ERROR_MESSAGES, validateLead, type FieldError } from '../lib/validation';
import { QUESTIONS, isComplete, resultMessage, type Answers } from './quiz';

interface Deps {
  form: HTMLFormElement;
  tracker: Tracker;
  utm: Record<string, string>;
  fetchImpl?: typeof fetch;
  endpoint?: string;
}

/** Renderiza las preguntas como radios nativos: accesibles y operables con teclado. */
export function renderQuestions(container: HTMLElement): void {
  const frag = document.createDocumentFragment();
  QUESTIONS.forEach((q, i) => {
    const fs = document.createElement('fieldset');
    fs.className = 'question';
    const legend = document.createElement('legend');
    legend.textContent = `${i + 1}. ${q.label}`;
    fs.append(legend);
    const opts = document.createElement('div');
    opts.className = 'options';
    for (const o of q.options) {
      const id = `q-${q.id}-${o.value}`;
      const input = document.createElement('input');
      Object.assign(input, { type: 'radio', name: q.id, value: o.value, id, required: true });
      const label = document.createElement('label');
      label.htmlFor = id;
      label.className = 'option';
      label.textContent = o.label;
      opts.append(input, label);
    }
    fs.append(opts);
    frag.append(fs);
  });
  container.replaceChildren(frag);
}

function readAnswers(form: HTMLFormElement): Answers {
  const data = new FormData(form);
  const answers: Answers = {};
  for (const q of QUESTIONS) {
    const v = data.get(q.id);
    if (typeof v === 'string') answers[q.id] = v;
  }
  return answers;
}

function showErrors(form: HTMLFormElement, errors: FieldError[]): void {
  form.querySelectorAll<HTMLElement>('.field-error').forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  let first: HTMLElement | null = null;
  for (const e of errors) {
    const msgEl = form.querySelector<HTMLElement>(`#e-${e.field}`);
    if (msgEl) {
      msgEl.textContent = ERROR_MESSAGES[`${e.field}:${e.reason}`] ?? 'Revisa este campo.';
      msgEl.hidden = false;
    }
    const input = form.querySelector<HTMLElement>(`[name="${e.field}"]`);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      if (msgEl) input.setAttribute('aria-describedby', msgEl.id);
      first ??= input;
    }
  }
  first?.focus();
}

export function mountLeadForm({ form, tracker, utm, fetchImpl = fetch, endpoint = '/api/lead' }: Deps): void {
  const questions = form.querySelector<HTMLElement>('#quiz-questions');
  if (!questions) return;
  renderQuestions(questions);

  const progress = form.querySelectorAll<HTMLElement>('.progress span');
  let started = false;
  form.addEventListener('change', (ev) => {
    const target = ev.target as HTMLInputElement;
    if (target.type !== 'radio') return;
    const answered = Object.keys(readAnswers(form)).length;
    progress.forEach((bar, i) => bar.classList.toggle('done', i < answered));
    if (!started) {
      started = true;
      tracker.track('quiz_start', { quiz_id: 'sedentarismo_v1' });
    }
    tracker.track('quiz_step', { quiz_id: 'sedentarismo_v1', step: answered });
  });

  const status = form.querySelector<HTMLElement>('#form-status')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const answers = readAnswers(form);
    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      consent: (form.elements.namedItem('consent') as HTMLInputElement).checked,
      website: data.get('website'),
      answers,
      utm,
    };

    const local = validateLead(payload);
    if (!local.ok || !isComplete(answers)) {
      const errors = local.ok ? [{ field: 'answers' as const, reason: 'incomplete' }] : local.errors;
      showErrors(form, errors);
      errors.forEach((e) => tracker.track('form_error', { field: e.field, reason: e.reason }));
      return;
    }
    showErrors(form, []);

    submit.disabled = true;
    status.textContent = 'Enviando…';
    try {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 422) {
        const body = (await res.json()) as { fields?: FieldError[] };
        showErrors(form, body.fields ?? []);
        status.textContent = '';
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = resultMessage(answers);
      // Sin PII: solo el nivel de sedentarismo y el valor esperado del lead.
      tracker.track('generate_lead', {
        method: 'quiz',
        sedentary_level: result.level,
        currency: 'PEN',
        value: LEAD_VALUE_PEN,
      });
      showResult(form, result);
    } catch {
      status.textContent = 'No pudimos enviar tus respuestas. Revisa tu conexión e inténtalo otra vez.';
    } finally {
      submit.disabled = false;
    }
  });
}

function showResult(form: HTMLFormElement, result: ReturnType<typeof resultMessage>): void {
  const box = document.getElementById('quiz-result');
  if (!box) return;
  box.querySelector('#result-title')!.textContent = result.title;
  box.querySelector('#result-body')!.textContent = result.body;
  form.hidden = true;
  box.hidden = false;
  box.focus();
}
