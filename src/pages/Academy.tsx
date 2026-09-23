import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { useAcademyProgress } from "../hooks/useAcademyProgress";
import { LESSONS, LEVELS, GLOSSARY, Level } from "../academy/curriculum";
import { Alert } from "../components/ui/Alert";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/layout/primitives";

/**
 * Academy home: level tracks, search, progress, glossary.
 * Lesson content is English-only (noted); chrome is translated.
 */
export default function Academy() {
  const { t } = useLang();
  const { done, scores } = useAcademyProgress();
  const [level, setLevel] = useState<Level | "all">("all");
  const [q, setQ] = useState("");
  const [showGlossary, setShowGlossary] = useState(false);

  const query = q.trim().toLowerCase();
  const lessons = useMemo(
    () =>
      LESSONS.filter(
        (l) =>
          (level === "all" || l.level === level) &&
          (!query || l.title.toLowerCase().includes(query) || l.definition.toLowerCase().includes(query))
      ),
    [level, query]
  );
  const pct = Math.round((done.length / LESSONS.length) * 100);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.academy.title}
        description={`${t.academy.subtitle} · ${done.length}/${LESSONS.length} ${t.academy.completed} (${pct}%)`}
      />
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.academy.progress}>
        <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-1.5 flex-wrap items-center">
        <div className="flex gap-1" role="group" aria-label="Level">
          {(["all", "beginner", "intermediate", "advanced"] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              aria-pressed={level === lv}
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                level === lv
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              {lv === "all" ? t.academy.allLevels : t.academy[lv]}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.academy.searchPh}
          aria-label={t.academy.searchPh}
          className="flex-1 min-w-[160px] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
        />
      </div>

      <Alert tone="info">
        <p className="text-xs">{t.academy.langNote} {t.academy.riskNote}</p>
      </Alert>

      {LEVELS.filter((l) => level === "all" || level === l.id).map((lv) => {
        const items = lessons.filter((l) => l.level === lv.id);
        if (!items.length) return null;
        return (
          <section key={lv.id} aria-label={t.academy[lv.id]}>
            <h2 className="font-semibold text-[0.9375rem] mb-2">
              {t.academy[lv.id]} <span className="font-normal text-xs text-slate-500">· {lv.blurb}</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((l) => {
                const isDone = done.includes(l.id);
                const sc = scores[l.id];
                return (
                  <Link
                    key={l.id}
                    to={`/learn/${l.id}`}
                    className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-card hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <p className="flex items-center gap-1.5 font-semibold text-sm">
                      <span aria-hidden="true">{isDone ? "✅" : "📘"}</span>
                      <span className="truncate">{l.title}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{l.definition}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {l.minutes} min
                      {sc != null ? ` · Quiz best ${sc}%` : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
      {!lessons.length && (
        <Card>
          <EmptyState icon="🔍" title={t.academy.noMatch} />
        </Card>
      )}

      <Card
        title={`${t.academy.glossary} (${GLOSSARY.length})`}
        action={
          <button onClick={() => setShowGlossary((v) => !v)} aria-expanded={showGlossary} className="text-sm text-blue-700 dark:text-blue-400 hover:underline">
            {showGlossary ? t.academy.hide : t.academy.show}
          </button>
        }
      >
        {showGlossary && (
          <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="border-b border-slate-100 dark:border-slate-800 pb-1">
                <dt className="font-semibold inline">{g.term}: </dt>
                <dd className="inline text-slate-600 dark:text-slate-300">{g.def}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
    </div>
  );
}
