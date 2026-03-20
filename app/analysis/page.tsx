"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

type Issue = {
  filename: string;
  line?: number | null;
  snippet?: string;
  issue: string;
  improvement?: string;
  severity?: string;
  evidence_urls?: string[];
};

type AnalysisResult = {
  summary?: string;
  non_conforming_count?: number;
  issues?: Issue[];
  improvementCode?: string;
};

type ApiResponse = {
  status?: string;
  analysis?: AnalysisResult;
  error?: string;
  message?: string;
};

type InclusivityStatus = {
  label: string;
  score: number;
};

type SortMode = "severity_desc" | "severity_asc" | "line_desc" | "line_asc";

/* Removed MOCK_ANALYSIS: always call API (no cache) */

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function computeInclusivityStatus(analysis: AnalysisResult | null): InclusivityStatus {
  if (!analysis?.issues || analysis.issues.length === 0) {
    return { label: "INCLUSIVO", score: 100 };
  }

  const issues = analysis.issues;
  const files = new Map<string, { maxLine: number }>();

  issues.forEach((item) => {
    const filename = item.filename || "arquivo-desconhecido";
    const current = files.get(filename) ?? { maxLine: 0 };
    const lineValue = typeof item.line === "number" && item.line > 0 ? item.line : 0;
    current.maxLine = Math.max(current.maxLine, lineValue);
    files.set(filename, current);
  });

  const fileCount = Math.max(files.size, 1);
  const estimatedTotalLines = Array.from(files.values()).reduce((acc, fileMeta) => {
    const safeEstimate = fileMeta.maxLine > 0 ? Math.max(fileMeta.maxLine, 80) : 120;
    return acc + safeEstimate;
  }, 0);

  const issuesCount = issues.length;
  const issuesPer100Lines = issuesCount / Math.max(estimatedTotalLines / 100, 1);
  const issuesPerFile = issuesCount / fileCount;

  const penalty =
    issuesPer100Lines * 6 +
    issuesPerFile * 12 +
    Math.max(0, issuesCount - 2) * 2;

  const score = Math.round(clamp(100 - penalty, 0, 100));

  if (score >= 85) {
    return { label: "INCLUSIVO", score };
  }

  if (score >= 70) {
    return { label: "BOA INCLUSAO", score };
  }

  if (score >= 50) {
    return { label: "FALTA INCLUSAO", score };
  }

  if (score >= 30) {
    return { label: "POUCO INCLUSIVO", score };
  }

  return { label: "NADA INCLUSIVO", score };
}

function getStatusBadgeClass(label: string) {
  switch (label) {
    case "INCLUSIVO":
      return "bg-emerald-500/20 text-emerald-300";
    case "BOA INCLUSAO":
      return "bg-lime-500/20 text-lime-300";
    case "FALTA INCLUSAO":
      return "bg-yellow-500/20 text-yellow-300";
    case "POUCO INCLUSIVO":
      return "bg-orange-500/20 text-orange-300";
    default:
      return "bg-red-500/20 text-red-300";
  }
}

function normalizeSeverity(severity?: string) {
  if (!severity) return "";

  return severity
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSeverityBadgeClass(severity?: string) {
  const normalized = normalizeSeverity(severity);

  if (normalized.includes("CRITICO")) {
    return "bg-red-500/20 text-red-300";
  }

  if (normalized.includes("MODERADO")) {
    return "bg-yellow-500/20 text-yellow-300";
  }

  if (normalized.includes("BAIXO")) {
    return "bg-blue-500/20 text-blue-300";
  }

  return "bg-slate-500/20 text-slate-300";
}

function getSeverityRank(severity?: string) {
  const normalized = normalizeSeverity(severity);

  if (normalized.includes("CRITICO")) return 3;
  if (normalized.includes("MODERADO")) return 2;
  if (normalized.includes("BAIXO")) return 1;

  return 0;
}

function normalizeAnalysisResponse(raw: unknown): ApiResponse {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const data = raw as Record<string, unknown>;

  const analysisRaw =
    data.analysis && typeof data.analysis === "object"
      ? (data.analysis as Record<string, unknown>)
      : null;

  const issuesRaw = Array.isArray(analysisRaw?.issues)
    ? analysisRaw.issues
    : Array.isArray(data.issues)
    ? (data.issues as unknown[])
    : [];

  const issues: Issue[] = issuesRaw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const issueObj = item as Record<string, unknown>;

      return {
        filename: String(
          issueObj.filename ?? issueObj.file ?? "arquivo-desconhecido"
        ),
        line: typeof issueObj.line === "number" ? issueObj.line : null,
        snippet: typeof issueObj.snippet === "string" ? issueObj.snippet : "",

        severity: (() => {
          const sev =
            issueObj.severity ??
            issueObj.grau ??
            issueObj.level ??
            issueObj.severity_level ??
            issueObj.severity_code ??
            issueObj.severityCode ??
            issueObj.severityLevel ??
            issueObj.severityValue;

          if (!sev) return undefined;

          if (typeof sev === "string") return sev.trim();

          if (typeof sev === "number") return String(sev);

          if (typeof sev === "object") {
            const obj = sev as Record<string, unknown>;

            const possible =
              obj.value ??
              obj.name ??
              obj.label ??
              obj.severity ??
              obj.level;

            if (typeof possible === "string") return possible.trim();
          }

          return undefined;
        })(),

        improvement: String(
          issueObj.improvement ??
          issueObj.fixCode ??
            issueObj.fix_code ??
            issueObj.correctedSnippet ??
            issueObj.corrected_snippet ??
            issueObj.solutionCode ??
            issueObj.solution_code ??
            issueObj.solution ??
            issueObj.recommendation ??
            ""
        ),
        evidence_urls: (() => {
          const rawEvidence = issueObj.evidence_urls ?? issueObj.evidenceUrls;

          if (!Array.isArray(rawEvidence)) {
            return [];
          }

          return rawEvidence
            .filter((value) => typeof value === "string")
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        })(),
        issue: String(
          issueObj.issue ??
            issueObj.description ??
            "Problema sem descrição"
        ),
      };
    });

  const summaryCandidate = analysisRaw?.summary ?? data.summary;
  const countCandidate =
    analysisRaw?.non_conforming_count ?? data.non_conforming_count;
  const improvementCodeCandidate =
    analysisRaw?.improvementCode ??
    analysisRaw?.improvement_code ??
    analysisRaw?.improvementSuggestion ??
    analysisRaw?.improvement_suggestion ??
    analysisRaw?.suggestion ??
    data.improvementCode ??
    data.improvement_code ??
    data.improvementSuggestion ??
    data.improvement_suggestion ??
    data.suggestion;

  return {
    status: typeof data.status === "string" ? data.status : undefined,
    error: typeof data.error === "string" ? data.error : undefined,
    message: typeof data.message === "string" ? data.message : undefined,
    analysis: {
      summary:
        typeof summaryCandidate === "string"
          ? summaryCandidate
          : undefined,
      non_conforming_count:
        typeof countCandidate === "number"
          ? countCandidate
          : issues.length,
      issues,
      improvementCode:
        typeof improvementCodeCandidate === "string"
          ? improvementCodeCandidate
          : undefined,
    },
  };
}

export default function AnalysisPage() {
  
  const router = useRouter();
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [errorPopupMessage, setErrorPopupMessage] = useState<string | null>(null);
  const [fileSortOptions, setFileSortOptions] = useState<Record<string, SortMode>>({});

  function showErrorPopup(message: string) {
    setErrorPopupMessage(message);

    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }

    popupTimeoutRef.current = setTimeout(() => {
      setErrorPopupMessage(null);
      popupTimeoutRef.current = null;
    }, 5000);
  }

  const groupedIssues = useMemo(() => {
    const issues = analysis?.issues ?? [];
    const groups = new Map<string, Issue[]>();

    issues.forEach((issue) => {
      const filename = issue.filename || "arquivo-desconhecido";
      const existing = groups.get(filename) ?? [];
      existing.push(issue);
      groups.set(filename, existing);
    });

    return Array.from(groups.entries()).sort(([fileA], [fileB]) =>
      fileA.localeCompare(fileB)
    );
  }, [analysis?.issues]);

  const inclusivityStatus = useMemo(() => {
    return computeInclusivityStatus(analysis);
  }, [analysis]);

  async function fetchAnalysis(url: string) {
    setLoading(true);
    setErrorPopupMessage(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const rawData: unknown = await res.json();

      // detect API response that reports no web files found
      if (rawData && typeof rawData === "object") {
        const asObj = rawData as Record<string, unknown>;
        const msg = typeof asObj.message === "string" ? asObj.message : "";
        if (msg.toLowerCase().includes("nenhum arquivo web") || msg.toLowerCase().includes("no web files")) {
          setApiMessage(msg || "Nenhum arquivo web encontrado");
          setLoading(false);
          try { sessionStorage.removeItem('analysis_running'); } catch {}
          return;
        }
      }

      const data = normalizeAnalysisResponse(rawData);

      if (data.status?.toLowerCase() === "error" && data.message) {
        showErrorPopup(data.message);
        setLoading(false);
        try { sessionStorage.removeItem('analysis_running'); } catch {}
        return;
      }

      console.log("API RESPONSE:", data);

      if (!res.ok) {
        showErrorPopup(data?.error || data?.message || "Erro ao executar analise");
        setLoading(false);
        return;
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        showErrorPopup("Resposta da API fora do formato esperado.");
      }
    } catch (err: unknown) {
      showErrorPopup(err instanceof Error ? err.message : "Erro inesperado");
    }

    // clear running flag so any loaders stop
    try {
      sessionStorage.removeItem('analysis_running');
    } catch {}

    setLoading(false);
  }

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem("auth_user")) {
        router.replace("/login");
        return;
      }
    } catch {
      router.replace("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    const loadAnalysis = async () => {

      const cachedRaw = sessionStorage.getItem("analysis_result");
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw) as Record<string, unknown>;
          const msg = typeof parsed.message === "string" ? parsed.message : "";
          if (msg.toLowerCase().includes("nenhum arquivo web") || msg.toLowerCase().includes("no web files")) {
            setApiMessage(msg || "Nenhum arquivo web encontrado");
            try { sessionStorage.removeItem('analysis_running'); } catch {}
            setLoading(false);
            return;
          }

          const normalized = normalizeAnalysisResponse(parsed);
          if (normalized.status?.toLowerCase() === "error" && normalized.message) {
            showErrorPopup(normalized.message);
            try { sessionStorage.removeItem('analysis_running'); } catch {}
            setLoading(false);
            return;
          }

          if (normalized.analysis) {
            setAnalysis(normalized.analysis);
            try {
              sessionStorage.removeItem("analysis_running");
            } catch {}
            setLoading(false);
            return;
          }
        } catch {
          // invalid cached data -> fall through to fetch
        }
      }

      const repoUrl = sessionStorage.getItem("repo_url");
      if (repoUrl) {
        await fetchAnalysis(repoUrl);
      }
    };

    void loadAnalysis();
  }, []);

  return (
    <Layout>
      <div className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl p-8">
        {errorPopupMessage && (
          <div className="fixed top-5 right-5 z-[70] max-w-md rounded-lg border border-red-300/50 bg-red-600 text-white px-4 py-3 shadow-lg">
            <div className="text-sm font-semibold">Erro de analise</div>
            <p className="mt-1 text-sm text-red-100">{errorPopupMessage}</p>
          </div>
        )}

        {(loading || (typeof window !== 'undefined' && sessionStorage.getItem('analysis_running'))) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm px-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-live="polite"
              className="w-full max-w-xl rounded-2xl border border-cyan-400/20 bg-slate-900/95 p-6 shadow-[0_0_80px_rgba(6,182,212,0.15)]"
            >
              <div className="flex items-center gap-3 text-cyan-300">
                <span className="inline-block w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
                <h3 className="text-lg font-bold">Analisando repositório</h3>
              </div>

              <p className="mt-2 text-sm text-slate-300">Aguarde enquanto a análise é finalizada.</p>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-white mb-6">Analise do repositorio</h1>

        {apiMessage ? (
          <div className="py-16 text-center">
            <p className="text-lg text-slate-300">{apiMessage}</p>
          </div>
        ) : (
          <>
            {analysis && (
          <div className="space-y-6">

            <div className="flex gap-3 flex-wrap items-center">

              <div className="relative inline-block group">
                <span
                  className={`text-xs px-2 py-1 rounded font-mono uppercase tracking-wider ${getStatusBadgeClass(
                    inclusivityStatus.label
                  )}`}
                  aria-describedby="inclusivity-tooltip"
                >
                  Classificacao: {inclusivityStatus.label} ({inclusivityStatus.score}/100)
                </span>

                <div
                  id="inclusivity-tooltip"
                  role="tooltip"
                  className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 mt-2 w-150 bg-slate-800 text-sm text-slate-200 p-3 rounded shadow-lg z-50 break-words ml-36"
                >
                  A pontuação de acessibilidade é calculada com base nos problemas encontrados no código.

                  <br /><br />

                  Consideramos três fatores principais:
                  <br />
                  <strong>1.</strong> Quantidade de falhas a cada 100 linhas de código<br />
                  <strong>2.</strong> Quantidade média de falhas por arquivo<br />
                  <strong>3.</strong> Penalidade extra quando existem mais de 2 falhas

                  <br /><br />

                  Quanto mais problemas forem encontrados, maior será a penalidade e menor será a pontuação final.
                </div>
              </div>

              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded font-mono uppercase tracking-wider">
                Falhas Encontradas: {analysis.issues?.length ?? 0}
              </span>

            </div>

            {analysis.summary && (
              <div className="bg-black/30 p-4 rounded-lg text-slate-200">
                <strong>Resumo:</strong>
                <p className="mt-2">{analysis.summary}</p>
              </div>
            )}

            <div className="text-cyan-300 font-semibold">
              Falhas:
            </div>

            {analysis.issues && analysis.issues.length > 0 ? (
              <div className="grid gap-4">
                {groupedIssues.map(([filename, fileIssues]) => (
                  <details
                    key={filename}
                    className="bg-white/5 border border-white/10 rounded-lg open:border-cyan-400/30"
                  >
                    <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-4">
                      <div className="text-cyan-200 font-mono text-sm break-all">
                        {filename}
                      </div>
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded whitespace-nowrap">
                        {fileIssues.length} falha{fileIssues.length > 1 ? "s" : ""}
                      </span>
                    </summary>

                    <div className="px-4 pb-4 space-y-4 border-t border-white/10">
                      {(() => {
                        const sortOption =
                          fileSortOptions[filename] ??
                          "severity_desc";

                        const sortedIssues = [...fileIssues].sort((a, b) => {
                          const severityDiff = getSeverityRank(a.severity) - getSeverityRank(b.severity);
                          const aLine = typeof a.line === "number" ? a.line : -1;
                          const bLine = typeof b.line === "number" ? b.line : -1;
                          const lineDiff = aLine - bLine;

                          if (sortOption === "severity_desc") {
                            return severityDiff !== 0 ? -severityDiff : lineDiff;
                          }

                          if (sortOption === "severity_asc") {
                            return severityDiff !== 0 ? severityDiff : lineDiff;
                          }

                          if (sortOption === "line_desc") {
                            return lineDiff !== 0 ? -lineDiff : -severityDiff;
                          }

                          return lineDiff !== 0 ? lineDiff : -severityDiff;
                        });

                        return (
                          <>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <label className="text-xs text-slate-300 flex items-center gap-2">
                                Ordenar por
                                <select
                                  className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-slate-100"
                                  value={sortOption}
                                  onChange={(event) => {
                                    const nextSortMode = event.target.value as SortMode;
                                    setFileSortOptions((previous) => ({
                                      ...previous,
                                      [filename]: nextSortMode,
                                    }));
                                  }}
                                >
                                  <option value="severity_desc">Grau: maior para menor</option>
                                  <option value="severity_asc">Grau: menor para maior</option>
                                  <option value="line_desc">Linha: maior para menor</option>
                                  <option value="line_asc">Linha: menor para maior</option>
                                </select>
                              </label>
                            </div>

                            {sortedIssues.map((issue, index) => (
                        <div
                          key={`${filename}-${index}`}
                          className="p-4 mt-4 bg-black/20 border border-white/10 rounded-lg"
                        >
                          <div className="flex gap-4 flex-wrap mb-2">
                            <span className="text-cyan-200 font-mono text-sm">
                              <strong>Linha:</strong> {issue.line ?? "-"}
                            </span>

                            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                              Falha #{index + 1}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded font-mono uppercase tracking-wider ${getSeverityBadgeClass(
                                issue.severity
                              )}`}
                            >
                              Grau: {issue.severity ?? "-"}
                            </span>
                          </div>

                          {issue.snippet && (
                            <div className="mt-2">
                              <div className="text-xs text-cyan-300 font-mono">
                                Trecho
                              </div>

                              <pre className="mt-1 bg-black/40 p-3 rounded text-sm text-slate-100 whitespace-pre-wrap break-words">
                                {issue.snippet}
                              </pre>
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="text-xs text-cyan-300 font-mono">
                              Descrição
                            </div>

                            <p className="text-slate-200 mt-1">
                              {issue.issue}
                            </p>
                          </div>

                          {issue.improvement && issue.improvement.trim() !== "" && (
                            <div className="mt-3 p-3 rounded border border-emerald-400/20 bg-emerald-500/10">
                              <div className="text-xs text-emerald-300 font-mono uppercase tracking-wide">
                                Melhoria sugerida
                              </div>

                              <pre className="mt-2 bg-black/40 p-3 rounded text-sm text-emerald-100 whitespace-pre-wrap break-words font-mono">
                                {issue.improvement}
                              </pre>
                            </div>
                          )}

                          {issue.evidence_urls && issue.evidence_urls.length > 0 && (
                            <div className="mt-3 p-3 rounded border border-cyan-400/20 bg-cyan-500/10">
                              <div className="text-xs text-cyan-300 font-mono uppercase tracking-wide">
                                Referencias
                              </div>

                              <ul className="mt-2 space-y-2">
                                {issue.evidence_urls.map((url, urlIndex) => (
                                  <li key={`${filename}-${index}-evidence-${urlIndex}`}>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-cyan-200 hover:text-cyan-100 underline break-all"
                                    >
                                      {url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </details>
                ))}

              </div>
            ) : (
              <p className="text-slate-400">
                Nenhum problema encontrado.
              </p>
            )}
          </div>
            )}
          </>
        )}

        <div className="mt-10">

          <button
            onClick={() => router.push("/scanner")}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition"
          >
            Nova Análise
          </button>

        </div>

      </div>
    </Layout>
  );
}