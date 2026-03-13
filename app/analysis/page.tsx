"use client";
<<<<<<< Updated upstream
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
=======

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

type Issue = {
  filename: string;
  line?: number | null;
  snippet?: string;
  issue: string;
  improvement?: string;
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
};

type InclusivityStatus = {
  label: string;
  score: number;
};

const MOCK_ANALYSIS: AnalysisResult = {
  summary:
    "Mock de teste visual: falhas agrupadas por arquivo para validar bandejas colapsáveis.",
  non_conforming_count: 7,
  issues: [
    {
      filename: "index.html",
      line: 12,
      snippet: '<img src="banner.png">',
      issue: "Imagem sem texto alternativo (atributo alt ausente).",
      improvement: '<img src="banner.png" alt="Banner principal da pagina">',
    },
    {
      filename: "index.html",
      line: 35,
      snippet: "<button style=\"outline: none\">Enviar</button>",
      issue: "Botao sem indicador visivel de foco para navegacao por teclado.",
      improvement: "<button class=\"btn-primary\">Enviar</button>\n\n.btn-primary:focus-visible {\n  outline: 2px solid #22d3ee;\n  outline-offset: 2px;\n}",
    },
    {
      filename: "index.html",
      line: 57,
      snippet: '<a href="#" onclick="openModal()">Saiba mais</a>',
      issue: "Link com href invalido e acao dependente de JavaScript sem fallback.",
      improvement: '<button type="button" onclick="openModal()">Saiba mais</button>',
    },
    {
      filename: "page2.html",
      line: 9,
      snippet: "<h4>Titulo principal</h4>",
      issue: "Hierarquia de titulos comeca em h4 e prejudica leitores de tela.",
      improvement: "<h1>Titulo principal</h1>",
    },
    {
      filename: "page2.html",
      line: 22,
      snippet: '<label></label><input type="email" id="email">',
      issue: "Campo de formulario sem rotulo associado corretamente.",
      improvement: '<label for="email">E-mail</label>\n<input type="email" id="email" name="email">',
    },
    {
      filename: "components/card.html",
      line: 14,
      snippet: "<p style=\"color:#9aa3ad\">Descricao curta</p>",
      issue: "Contraste de cor insuficiente entre texto e fundo.",
      improvement: "<p class=\"text-readable\">Descricao curta</p>\n\n.text-readable { color: #e2e8f0; }",
    },
    {
      filename: "components/card.html",
      line: 41,
      snippet: "<div role=\"button\" onclick=\"toggle()\">Abrir</div>",
      issue: "Elemento interativo nao nativo sem suporte completo a teclado.",
      improvement: '<button type="button" onclick="toggle()">Abrir</button>',
    },
  ],
};

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
>>>>>>> Stashed changes

export default function AnalysisPage() {
  const [readme, setReadme] = useState<string | null>(null);
  const router = useRouter();

<<<<<<< Updated upstream
  useEffect(() => {
    const value = sessionStorage.getItem('readme_Preview');
    setReadme(value);
=======
  const [status, setStatus] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const rawData: unknown = await res.json();
      const data = normalizeAnalysisResponse(rawData);

      console.log("API RESPONSE:", data);

      if (!res.ok) {
        setError(data?.error || "Erro ao executar análise");
        setLoading(false);
        return;
      }

      if (data.analysis) {
        setStatus(data.status ?? "success");
        setAnalysis(data.analysis);
      } else {
        setError("Resposta da API fora do formato esperado.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }

    setLoading(false);
  }

  useEffect(() => {
    const cachedRaw = sessionStorage.getItem("analysis_result");
    if (cachedRaw) {
      try {
        const normalized = normalizeAnalysisResponse(JSON.parse(cachedRaw));
        if (normalized.analysis) {
          setStatus(normalized.status ?? "cached");
          setAnalysis(normalized.analysis);
          return;
        }
      } catch {
        // If cached data is invalid, keep fallback flow below.
      }
    }

    const repoUrl = sessionStorage.getItem("repo_url");

    if (repoUrl) {
      fetchAnalysis(repoUrl);
      return;
    }

    setAnalysis(MOCK_ANALYSIS);
>>>>>>> Stashed changes
  }, []);

  return (
    <Layout>
      <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Analise do repositorio</h1>

        <div className="mb-2 text-sm font-mono text-cyan-400 uppercase tracking-widest">Readme:</div>

        {readme !== null ? (
          <pre className="whitespace-pre-wrap text-slate-200 text-base leading-relaxed font-mono bg-black/30 rounded-xl p-6">
            {readme || '(vazio)'}
          </pre>
        ) : (
          <p className="text-slate-500">Nenhum resultado encontrado. Volte e analise um repositorio.</p>
        )}

<<<<<<< Updated upstream
        <button
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all"
        >
          Nova Analise
        </button>
=======
        {error && (
          <p className="text-red-400">
            {error}
          </p>
        )}

        {analysis && (
          <div className="space-y-6">

            <div className="flex gap-3 flex-wrap items-center">

              <span
                className={`text-xs px-2 py-1 rounded font-mono uppercase tracking-wider ${getStatusBadgeClass(
                  inclusivityStatus.label
                )}`}
              >
                Classificacao: {inclusivityStatus.label} ({inclusivityStatus.score}/100)
              </span>

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
                      {fileIssues.map((issue, index) => (
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
                          </div>

                          {issue.snippet && (
                            <div className="mt-2">
                              <div className="text-xs text-cyan-300 font-mono">
                                Trecho
                              </div>

                              <pre className="mt-1 bg-black/40 p-3 rounded text-sm text-slate-100 overflow-x-auto">
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

                              <pre className="mt-2 bg-black/40 p-3 rounded text-sm text-emerald-100 overflow-x-auto font-mono">
                                {issue.improvement}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
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

        <div className="mt-10">

          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition"
          >
            Nova Análise
          </button>

        </div>

>>>>>>> Stashed changes
      </div>
    </Layout>
  );
}
