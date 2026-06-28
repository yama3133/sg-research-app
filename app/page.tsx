"use client";

import { useEffect, useRef, useState } from "react";
import { Lang, PRESETS, Preset, T } from "./i18n";

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
};

type TavilyResponse = {
  query: string;
  answer?: string;
  answer_ja?: string;
  results: TavilyResult[];
  response_time?: number;
};

const LANG_STORAGE_KEY = "sg-research-lang";

export default function Home() {
  const [lang, setLang] = useState<Lang>("ja");
  const t = T[lang];

  const [query, setQuery] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TavilyResponse | null>(null);

  const [thinkingText, setThinkingText] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "ja" || saved === "en") setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function updateLang(next: Lang) {
    setLang(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  async function runAnalyze(data: TavilyResponse, currentLang: Lang) {
    if (abortRef.current) abortRef.current.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setThinkingText("");
    setAnalysisText("");
    setStreamError(null);
    setStreaming(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: data.query,
          lang: currentLang,
          sources: data.results.slice(0, 10).map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
          })),
        }),
        signal: ctl.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(`analyze failed: ${res.status} ${txt}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          const lines = ev.split("\n");
          let evName = "message";
          let dataStr = "";
          for (const ln of lines) {
            if (ln.startsWith("event:")) evName = ln.slice(6).trim();
            else if (ln.startsWith("data:")) dataStr += ln.slice(5).trim();
          }
          if (!dataStr) continue;
          let payload: { text?: string; message?: string };
          try {
            payload = JSON.parse(dataStr);
          } catch {
            continue;
          }
          if (evName === "thinking" && payload.text) {
            setThinkingText((s) => s + payload.text);
          } else if (evName === "text" && payload.text) {
            setAnalysisText((s) => s + payload.text);
          } else if (evName === "error" && payload.message) {
            setStreamError(payload.message);
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setStreamError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setStreaming(false);
    }
  }

  async function runSearch(q: string, currentLang: Lang) {
    setLoading(true);
    setError(null);
    setResponse(null);
    setThinkingText("");
    setAnalysisText("");
    setStreamError(null);
    if (abortRef.current) abortRef.current.abort();

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          search_depth: "advanced",
          max_results: 10,
          lang: currentLang,
        }),
      });
      const json = (await res.json()) as TavilyResponse | { error: string };
      if (!res.ok) {
        throw new Error(("error" in json && json.error) || `HTTP ${res.status}`);
      }
      const data = json as TavilyResponse;
      setResponse(data);
      runAnalyze(data, currentLang);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function handlePreset(preset: Preset) {
    setActivePresetId(preset.id);
    setQuery(preset.query);
    runSearch(preset.query, lang);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setActivePresetId(null);
    runSearch(query.trim(), lang);
  }

  const summary = response?.answer_ja || response?.answer;

  return (
    <main className="mx-auto w-full max-w-5xl px-3 sm:px-4 py-6 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl">🇸🇬 SG Research</h1>
          </div>
          <div
            role="group"
            aria-label={t.langToggleLabel}
            className="shrink-0 inline-flex rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs"
          >
            <button
              type="button"
              onClick={() => updateLang("ja")}
              className={[
                "px-3 py-1 rounded-full transition",
                lang === "ja"
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              ].join(" ")}
              aria-pressed={lang === "ja"}
            >
              JP
            </button>
            <button
              type="button"
              onClick={() => updateLang("en")}
              className={[
                "px-3 py-1 rounded-full transition",
                lang === "en"
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
              ].join(" ")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t.subtitle}
        </p>
      </header>

      <section className="mb-6">
        <h2 className="mb-3 text-sm text-slate-700 dark:text-slate-300">
          {t.presetsHeading}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const active = activePresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePreset(p)}
                disabled={loading}
                className={[
                  "text-left rounded-lg border p-2.5 sm:p-3 transition min-w-0",
                  "hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  active
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-1 ring-sky-500"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
                ].join(" ")}
              >
                <div className="flex items-center gap-1.5">
                  <span aria-hidden className="shrink-0">
                    {p.emoji}
                  </span>
                  <span className="text-xs sm:text-sm truncate">
                    {p.label[lang]}
                  </span>
                </div>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug break-words [overflow-wrap:anywhere]">
                  {p.description[lang]}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.searching : t.search}
          </button>
        </form>
      </section>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300 break-words">
          <strong>{t.error}</strong> {error}
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 text-center">
          {t.askingTavily}
        </div>
      )}

      {response && !loading && (
        <section className="space-y-6">
          {summary && (
            <div className="rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {summary}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm text-slate-700 dark:text-slate-300">
              {t.sources(response.results.length, response.response_time)}
            </h3>
            <ol className="space-y-3">
              {response.results.map((r, i) => (
                <li
                  key={`${r.url}-${i}`}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 min-w-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sky-700 dark:text-sky-400 hover:underline break-words [overflow-wrap:anywhere] min-w-0"
                    >
                      {i + 1}. {r.title || r.url}
                    </a>
                    <span className="shrink-0 text-[10px] sm:text-xs text-slate-400 tabular-nums">
                      {r.score.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 break-all [overflow-wrap:anywhere]">
                    {r.url}
                    {r.published_date && ` · ${r.published_date}`}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words">
                    {r.content}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {(streaming || thinkingText || analysisText || streamError) && (
            <div className="space-y-3">
              <h3 className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>{t.analyzeHeading}</span>
                {streaming && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    {t.streaming}
                  </span>
                )}
              </h3>

              {(thinkingText || streaming) && (
                <details
                  open
                  className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-3"
                >
                  <summary className="cursor-pointer text-xs text-amber-700 dark:text-amber-300">
                    {thinkingText
                      ? t.thinking(thinkingText.length)
                      : t.thinkingIdle}
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] sm:text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80 font-mono">
                    {thinkingText || "…"}
                  </pre>
                </details>
              )}

              {analysisText && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-2">
                    {t.analysisLabel}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100">
                    {analysisText}
                    {streaming && (
                      <span className="inline-block w-2 h-4 align-text-bottom ml-0.5 bg-emerald-500 animate-pulse" />
                    )}
                  </p>
                </div>
              )}

              {streamError && (
                <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 break-words">
                  {t.streamError} {streamError}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {!response && !loading && !error && (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 sm:p-8 text-center text-xs sm:text-sm text-slate-500">
          {t.emptyHint}
        </div>
      )}

    </main>
  );
}
