import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "../api/market";
import { useLang } from "../i18n/LanguageContext";
import { useWatchlists } from "../hooks/useWatchlist";
import { useAlerts, evaluateAlert, describeAlert, AlertData } from "../hooks/useAlerts";
import { Alert } from "../components/ui/Alert";
import { Badge, AIScoreBadge, SignalBadge, RiskBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { SkeletonTable } from "../components/ui/Skeleton";
import { Table, Column } from "../components/ui/Table";
import { PageHeader } from "../components/layout/primitives";
import AlertModal from "../components/AlertModal";
import CompareTray from "../components/screener/CompareTray";
import { normSym } from "../components/screener/useScreenerUniverse";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Watchlist system (Phase 5): named lists with reorder, live
 * enrichment (one quotes batch + compare chunks), selection compare,
 * and real-data alerts evaluated against the same payload.
 * Everything persists in this browser — no backend tables exist.
 */
export default function Watchlist() {
  const { t, lang } = useLang();
  const TEMPLATES = [t.screen.tplLongTerm, t.screen.tplSwing, t.screen.tplDividend, t.screen.tplTech, t.screen.tplMyStocks];
  const wl = useWatchlists();
  const { alerts, triggered, remove: removeAlert, toggle: toggleAlert, ingest, clearTriggered } = useAlerts();
  const list = wl.active;

  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [addHint, setAddHint] = useState("");
  const [adding, setAdding] = useState(false);
  const [alertFor, setAlertFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showTray, setShowTray] = useState(false);

  const [quotes, setQuotes] = useState<any[]>([]);
  const [aiRows, setAiRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");
  const [seq, setSeq] = useState(0);

  const symKey = (list?.symbols || []).join(",");

  // Quotes batch (1 call) + AI chunks (≤5/call) per symbol set.
  // Quotes refresh every 60s; heavy AI data only on set change.
  useEffect(() => {
    if (!list || !list.symbols.length) {
      setQuotes([]);
      setAiRows([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError("");
    const syms = list.symbols;
    marketApi
      .quotes(syms)
      .then((r) => {
        if (!alive) return;
        setQuotes(r.quotes || []);
        setUpdated(new Date().toLocaleTimeString());
      })
      .catch(() => alive && setError(t.gen.unableToLoad))
      .finally(() => alive && setLoading(false));
    const chunks: string[][] = [];
    for (let i = 0; i < syms.length; i += 5) chunks.push(syms.slice(i, i + 5));
    Promise.all(
      chunks.map((c) => (c.length < 2 ? Promise.resolve(null) : marketApi.indiaCompare(c.join(","), lang).catch(() => null)))
    ).then((parts) => {
      if (!alive) return;
      setAiRows(parts.flatMap((p) => p?.ranked || []));
    });
    const timer = setInterval(() => {
      marketApi
        .quotes(syms)
        .then((r) => alive && (setQuotes(r.quotes || []), setUpdated(new Date().toLocaleTimeString())))
        .catch(() => {});
    }, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symKey, seq]);

  const qBySym = useMemo(() => {
    const m = new Map<string, any>();
    for (const q of quotes) m.set(normSym(q.appSymbol || q.symbol), q);
    return m;
  }, [quotes]);

  const aiBySym = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of aiRows) m.set(normSym(r.symbol), r);
    return m;
  }, [aiRows]);

  const dataOf = (sym: string): AlertData => {
    const q = qBySym.get(normSym(sym));
    const a = aiBySym.get(normSym(sym));
    return {
      price: num(q?.price),
      changePct: num(q?.changePct),
      volume: num(q?.volume),
      week52High: num(q?.week52High),
      week52Low: num(q?.week52Low),
      rsi14: num(a?.rsi14),
      score: num(a?.score),
      signal: a?.signal ?? null,
    };
  };

  // Evaluate alerts against the fresh payload; record transitions.
  useEffect(() => {
    if (!alerts.length || (!quotes.length && !aiRows.length)) return;
    ingest(
      alerts.map((a) => {
        const d = dataOf(a.symbol);
        const parts = [
          d.price != null ? `price ${d.price.toLocaleString("en-IN")}` : null,
          d.changePct != null ? `chg ${d.changePct}%` : null,
          d.rsi14 != null ? `RSI ${d.rsi14}` : null,
          d.score != null ? `score ${d.score}` : null,
          d.signal ? `signal ${d.signal}` : null,
        ].filter(Boolean);
        return { alert: a, status: evaluateAlert(a, d), snapshot: parts.join(" · ") || t.gen.dataUnavailable };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, aiRows]);

  const doAdd = async () => {
    const v = addInput.trim().toUpperCase();
    if (!v || !list || adding) return;
    setAdding(true);
    setAddHint("");
    try {
      const r = await marketApi.search(v);
      const hit = (r.results || []).find((h: any) => normSym(h.appSymbol || h.symbol) === normSym(v));
      if (!hit) {
        setAddHint(t.dash.watchNoMatch);
      } else {
        const res = wl.addSymbol(list.id, hit.appSymbol || hit.symbol);
        if (res === "full") setAddHint(t.watch.limitSymbols);
        else setAddInput("");
      }
    } catch {
      setAddHint(t.dash.watchNoMatch);
    } finally {
      setAdding(false);
    }
  };

  const toggleSelect = (sym: string) => {
    setShowTray(false);
    setSelected((p) => (p.includes(sym) ? p.filter((s) => s !== sym) : p.length >= 5 ? p : [...p, sym]));
  };

  const triggeredAlerts = alerts.filter((a) => triggered[a.id]);

  const columns: Column<{ id?: unknown; sym: string }>[] = [
    {
      key: "sel",
      header: <span className="sr-only">Select</span>,
      cell: (r) => (
        <input
          type="checkbox"
          checked={selected.includes(r.sym)}
          disabled={!selected.includes(r.sym) && selected.length >= 5}
          onChange={() => toggleSelect(r.sym)}
          aria-label={`Select ${r.sym} for comparison`}
        />
      ),
    },
    {
      key: "stock",
      header: t.screen.cStock,
      cell: (r) => {
        const q = qBySym.get(normSym(r.sym));
        return (
          <span>
            <Link to={`/stocks/${r.sym}`} className="text-blue-700 dark:text-blue-400 hover:underline font-semibold">
              {r.sym}
            </Link>
            <br />
            <span className="text-xs text-slate-500">{q?.name || t.gen.dataUnavailable}</span>
          </span>
        );
      },
    },
    {
      key: "price",
      header: t.screen.cPrice,
      numeric: true,
      cell: (r) => {
        const q = qBySym.get(normSym(r.sym));
        return (
          <span className="si-numeric font-semibold">
            {q?.price != null ? Number(q.price).toLocaleString("en-IN") : t.gen.na}
          </span>
        );
      },
    },
    {
      key: "chg",
      header: t.watch.cChange,
      numeric: true,
      cell: (r) => {
        const q = qBySym.get(normSym(r.sym));
        if (q?.changePct == null) return <span className="text-slate-400">{t.gen.na}</span>;
        const up = q.changePct >= 0;
        return (
          <span className={`si-numeric font-semibold ${up ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
            {up ? "+" : ""}{Number(q.change).toFixed(2)} ({up ? "+" : ""}{Number(q.changePct).toFixed(2)}%)
          </span>
        );
      },
    },
    {
      key: "score",
      header: t.screen.cScore,
      numeric: true,
      cell: (r) => <AIScoreBadge score={aiBySym.get(normSym(r.sym))?.score} />,
    },
    {
      key: "view",
      header: t.compare.mSignal,
      cell: (r) => <SignalBadge signal={aiBySym.get(normSym(r.sym))?.signal} />,
    },
    {
      key: "risk",
      header: t.screen.cRisk,
      cell: (r) => <RiskBadge level={aiBySym.get(normSym(r.sym))?.riskLevel} />,
    },
    {
      key: "act",
      header: "",
      cell: (r) => {
        const i = (list?.symbols || []).indexOf(r.sym);
        const n = list?.symbols.length || 0;
        return (
          <span className="inline-flex gap-1">
            <button onClick={() => list && wl.moveSymbol(list.id, r.sym, -1)} disabled={i <= 0} aria-label={`${t.watch.moveUp} ${r.sym}`} title={t.watch.moveUp} className="text-xs px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-30">▲</button>
            <button onClick={() => list && wl.moveSymbol(list.id, r.sym, 1)} disabled={i < 0 || i >= n - 1} aria-label={`${t.watch.moveDown} ${r.sym}`} title={t.watch.moveDown} className="text-xs px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-30">▼</button>
            <button onClick={() => setAlertFor(r.sym)} aria-label={`${t.watch.alertsBtn}: ${r.sym}`} title={`${t.watch.alertsBtn}: ${r.sym}`} className="text-xs px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700">🔔</button>
            <button onClick={() => list && wl.removeSymbol(list.id, r.sym)} aria-label={`Remove ${r.sym}`} title={`Remove ${r.sym}`} className="text-xs px-1.5 py-1 rounded text-slate-400 hover:text-red-600">✕</button>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.watch.title}
        description={updated ? `${t.watch.updated} ${updated} · ${t.common.autoRefresh}` : undefined}
        actions={
          <button
            onClick={() => setSeq((s) => s + 1)}
            className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          >
            ↻ {t.common.refreshNow}
          </button>
        }
      />

      {triggeredAlerts.length > 0 && (
        <Alert tone="warning" title={`🔔 ${t.alerts.triggered} (${triggeredAlerts.length})`}>
          <ul className="space-y-1 mt-1">
            {triggeredAlerts.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm flex-wrap">
                <span className="flex-1">{describeAlert(a)} <span className="text-slate-500">· {triggered[a.id].snapshot}</span></span>
                <span className="text-xs text-slate-500">{t.alerts.triggeredAt} {new Date(triggered[a.id].at).toLocaleTimeString()}</span>
                <button onClick={() => clearTriggered(a.id)} className="text-xs underline">{t.alerts.dismiss}</button>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Lists */}
      <Card title={t.watch.lists}>
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label={t.watch.lists}>
          {wl.lists.map((l) => (
            <button
              key={l.id}
              onClick={() => wl.setActiveId(l.id)}
              aria-pressed={list?.id === l.id}
              className={`text-sm px-3 py-1.5 rounded-full border ${
                list?.id === l.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              {l.name} ({l.symbols.length})
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                const id = wl.create(newName.trim());
                if (id) {
                  wl.setActiveId(id);
                  setNewName("");
                }
              }
            }}
            placeholder={t.watch.newPh}
            aria-label={t.watch.newPh}
            className="flex-1 min-w-[160px] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={!newName.trim() || wl.lists.length >= 10}
            onClick={() => {
              const id = wl.create(newName.trim());
              if (id) {
                wl.setActiveId(id);
                setNewName("");
              }
            }}
          >
            {t.watch.create}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1">{t.watch.limitLists}</p>
        <div className="flex gap-1.5 flex-wrap mt-2">
          <span className="text-xs text-slate-500 self-center">{t.watch.tplTitle}:</span>
          {TEMPLATES.map((name) => (
            <button
              key={name}
              onClick={() => {
                const id = wl.create(name);
                if (id) wl.setActiveId(id);
              }}
              className="text-xs px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-slate-500"
            >
              + {name}
            </button>
          ))}
        </div>
      </Card>

      {list && (
        <Card
          title={renaming === list.id ? "" : `${list.name} (${list.symbols.length})`}
          action={
            renaming === list.id ? undefined : (
              <span className="flex gap-1.5">
                <button
                  onClick={() => {
                    setRenaming(list.id);
                    setRenameValue(list.name);
                  }}
                  className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700"
                >
                  {t.watch.rename}
                </button>
                {confirmDelete ? (
                  <>
                    <button onClick={() => { wl.removeList(list.id); setConfirmDelete(false); }} className="text-xs px-2 py-1 rounded-md bg-red-600 text-white">
                      {t.watch.yesDelete}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                      {t.watch.cancel}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={wl.lists.length <= 1}
                    className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                  >
                    {t.watch.delete}
                  </button>
                )}
              </span>
            )
          }
        >
          {renaming === list.id && (
            <div className="flex gap-2 mb-2">
              <Input aria-label={t.watch.rename} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  wl.rename(list.id, renameValue);
                  setRenaming("");
                }}
              >
                {t.watch.saveName}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setRenaming("")}>
                {t.watch.cancel}
              </Button>
            </div>
          )}
          {confirmDelete && <p className="text-xs text-red-600 mb-2">{t.watch.confirmDelete}</p>}

          <div className="flex gap-2 mb-2">
            <input
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doAdd()}
              placeholder={t.watch.addPh}
              aria-label={t.watch.addPh}
              className="flex-1 min-w-0 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-900 placeholder:text-slate-400"
            />
            <Button variant="secondary" size="sm" onClick={doAdd} disabled={adding || !addInput.trim()} loading={adding}>
              {t.watch.add}
            </Button>
          </div>
          {addHint && <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">{addHint}</p>}

          {!list.symbols.length ? (
            <EmptyState icon="⭐" title={t.watch.empty} description={t.watch.emptyHint} />
          ) : loading && !quotes.length ? (
            <SkeletonTable rows={Math.min(list.symbols.length, 6)} />
          ) : error && !quotes.length ? (
            <ErrorState title={error} onRetry={() => setSeq((s) => s + 1)} retryLabel={t.common.retry} />
          ) : (
            <Table
              caption={`${list.name} stocks`}
              minWidth={760}
              columns={columns}
              rows={list.symbols.map((s) => ({ sym: s, id: s }))}
            />
          )}
        </Card>
      )}

      {/* Selection compare */}
      {list && list.symbols.length > 0 && (
        <Card title={`${t.watch.compare} · ${t.screen.selTitle} (${selected.length}/5)`}>
          {selected.length === 0 ? (
            <p className="text-sm text-slate-500">{t.screen.selHint}</p>
          ) : (
            <div className="flex gap-1.5 flex-wrap items-center">
              {selected.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                  {s}
                  <button onClick={() => toggleSelect(s)} aria-label={`Remove ${s} from selection`} className="text-slate-400 hover:text-red-600">✕</button>
                </span>
              ))}
              <Button variant="primary" size="sm" onClick={() => setShowTray(true)} disabled={selected.length < 2} className="ml-auto">
                {t.watch.compare} ({selected.length})
              </Button>
            </div>
          )}
          {showTray && selected.length >= 2 && (
            <div className="mt-3">
              <CompareTray key={selected.join(",")} symbols={selected} />
            </div>
          )}
        </Card>
      )}

      {/* Alerts */}
      <Card title={`${t.alerts.title} (${alerts.length})`}>
        {alerts.length === 0 ? (
          <EmptyState icon="🔔" title={t.alerts.noAlerts} />
        ) : (
          <ul className="space-y-1.5">
            {alerts.map((a) => {
              const st = evaluateAlert(a, dataOf(a.symbol));
              return (
                <li key={a.id} className="flex items-center gap-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-1.5 last:border-0 flex-wrap">
                  <Badge tone={st === "triggered" ? "negative" : st === "ok" ? "positive" : "neutral"}>
                    {st === "triggered" ? t.alerts.triggered : !a.active ? t.alerts.disabled : t.alerts.active}
                  </Badge>
                  <Link to={`/stocks/${a.symbol}`} className="font-semibold text-blue-700 dark:text-blue-400 hover:underline">
                    {a.symbol}
                  </Link>
                  <span className="flex-1 min-w-[140px]">{describeAlert(a)}</span>
                  {triggered[a.id] && (
                    <span className="text-xs text-slate-500">
                      {t.alerts.triggeredAt} {new Date(triggered[a.id].at).toLocaleString()} · {triggered[a.id].snapshot}
                    </span>
                  )}
                  <button onClick={() => toggleAlert(a.id)} className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                    {a.active ? t.alerts.disable : t.alerts.enable}
                  </button>
                  <button onClick={() => removeAlert(a.id)} aria-label={`${t.alerts.delete}: ${describeAlert(a)}`} className="text-xs px-2 py-1 text-slate-400 hover:text-red-600">
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-slate-500 mt-2">{t.alerts.backendNote}</p>
      </Card>

      {alertFor && <AlertModal symbol={alertFor} onClose={() => setAlertFor(null)} />}
    </div>
  );
}
