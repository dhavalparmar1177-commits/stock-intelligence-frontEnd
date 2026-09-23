import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { useAcademyProgress } from "../hooks/useAcademyProgress";
import { LESSONS } from "../academy/curriculum";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

/**
 * Lesson detail: Definition → Explanation → Real example → How to
 * use → Mistakes → Live link → Interactive quiz → Prev/Next.
 */
export default function Lesson() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const { done, scores, toggleDone, recordQuiz } = useAcademyProgress();
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const idx = LESSONS.findIndex((l) => l.id === id);
  const lesson = idx >= 0 ? LESSONS[idx] : null;
  const prev = idx > 0 ? LESSONS[idx - 1] : null;
  const next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;

  if (!lesson) {
    return (
      <Card>
        <EmptyState icon="📘" title={t.academy.noMatch} action={{ label: t.academy.back, href: "/learn" }} />
      </Card>
    );
  }

  const total = lesson.quiz.length;
  const correct = lesson.quiz.filter((qq, i) => picked[i] === qq.answer).length;
  const isDone = done.includes(lesson.id);

  const submit = () => {
    setSubmitted(true);
    if (total) recordQuiz(lesson.id, Math.round((correct / total) * 100));
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card title={title}>
      <div className="text-sm space-y-1.5 text-slate-700 dark:text-slate-200">{children}</div>
    </Card>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Link to="/learn" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">← {t.academy.title}</Link>
        <span className="text-[11px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {t.academy[lesson.level]} · {lesson.minutes} min
        </span>
        <Button variant={isDone ? "secondary" : "primary"} size="sm" onClick={() => toggleDone(lesson.id)} className="ml-auto">
          {isDone ? `✓ ${t.academy.completed}` : t.academy.markDone}
        </Button>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{lesson.title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 border-l-4 border-blue-600 pl-3">{lesson.definition}</p>

      <Section title={t.academy.explanation}>
        <p>{lesson.explanation}</p>
      </Section>

      <Section title={t.academy.example}>
        <p className="font-semibold">{lesson.exampleTitle}</p>
        <p>{lesson.exampleBody}</p>
      </Section>

      <Section title={t.academy.howTo}>
        <ul className="list-disc ml-4 space-y-1">
          {lesson.howTo.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </Section>

      <Section title={t.academy.mistakes}>
        <ul className="list-disc ml-4 space-y-1">
          {lesson.mistakes.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </Section>

      {lesson.liveTo && (
        <Card title={t.academy.tryLive}>
          <Link to={lesson.liveTo} className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline">
            {lesson.liveLabel || lesson.liveTo} →
          </Link>
          <p className="text-xs text-slate-500 mt-1">{t.academy.liveNote}</p>
        </Card>
      )}

      <Card
        title={`${t.academy.quiz} (${correct}/${total}${submitted ? ` · ${t.academy.best} ${scores[lesson.id] ?? Math.round((correct / total) * 100)}%` : ""})`}
      >
        {lesson.quiz.map((qq, qi) => (
          <div key={qi} className="mb-3 last:mb-0">
            <p className="text-sm font-semibold">
              {qi + 1}. {qq.q}
            </p>
            <div className="flex flex-col gap-1 mt-1.5" role="radiogroup" aria-label={qq.q}>
              {qq.options.map((op, oi) => {
                const chosen = picked[qi] === oi;
                const right = submitted && oi === qq.answer;
                const wrong = submitted && chosen && oi !== qq.answer;
                return (
                  <button
                    key={oi}
                    role="radio"
                    aria-checked={chosen}
                    disabled={submitted}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={`text-left text-sm px-3 py-1.5 rounded-lg border ${
                      right
                        ? "border-green-500 bg-green-50 dark:bg-green-950/30 font-semibold"
                        : wrong
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : chosen
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                            : "border-slate-300 dark:border-slate-700"
                    } disabled:cursor-default`}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
            {submitted && <p className="text-xs text-slate-500 mt-1">→ {qq.explain}</p>}
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          {!submitted ? (
            <Button
              variant="primary"
              size="sm"
              disabled={Object.keys(picked).length < total}
              onClick={submit}
            >
              {t.academy.submit}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPicked({});
                setSubmitted(false);
              }}
            >
              {t.academy.retry}
            </Button>
          )}
        </div>
      </Card>

      <div className="flex justify-between gap-2 flex-wrap">
        {prev ? (
          <Link to={`/learn/${prev.id}`} className="text-sm text-blue-700 dark:text-blue-400 hover:underline">← {prev.title}</Link>
        ) : <span />}
        {next ? (
          <Link to={`/learn/${next.id}`} className="text-sm text-blue-700 dark:text-blue-400 hover:underline">{next.title} →</Link>
        ) : <span />}
      </div>

      <Alert tone="info">
        <p className="text-xs">{t.academy.riskNote}</p>
      </Alert>
    </div>
  );
}
