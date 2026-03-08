"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

type Issue = {
  filename: string;
  line?: number | null;
  snippet?: string;
  issue: string;
};

type AnalysisResult = {
  summary?: string;
  non_conforming_count?: number;
  issues?: Issue[];
};

type ApiResponse = {
  status?: string;
  analysis?: AnalysisResult;
  error?: string;
};

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
    ? analysisRaw?.issues
    : Array.isArray(data.issues)
      ? (data.issues as unknown[])
      : [];

  const issues: Issue[] = issuesRaw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const issueObj = item as Record<string, unknown>;
      return {
        filename: String(issueObj.filename ?? issueObj.file ?? "arquivo-desconhecido"),
        line: typeof issueObj.line === "number" ? issueObj.line : null,
        snippet: typeof issueObj.snippet === "string" ? issueObj.snippet : "",
        issue: String(issueObj.issue ?? issueObj.description ?? "Problema sem descricao"),
      };
    });

  const summaryCandidate = analysisRaw?.summary ?? data.summary;
  const countCandidate = analysisRaw?.non_conforming_count ?? data.non_conforming_count;

  return {
    status: typeof data.status === "string" ? data.status : undefined,
    error: typeof data.error === "string" ? data.error : undefined,
    analysis: {
      summary: typeof summaryCandidate === "string" ? summaryCandidate : undefined,
      non_conforming_count:
        typeof countCandidate === "number" ? countCandidate : issues.length,
      issues,
    },
  };
}

export default function AnalysisPage() {
  const router = useRouter();

  const [status, setStatus] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (data?.status === "success" && data.analysis) {
        setStatus(data.status);
        setAnalysis(data.analysis);
        sessionStorage.setItem("analysis_result", JSON.stringify(rawData));
      } else {
        setError("Resposta da API fora do formato esperado.");
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }

    setLoading(false);
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("analysis_result");

    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        const normalized = normalizeAnalysisResponse(parsed);

        if (normalized.status === "success" && normalized.analysis) {
          setStatus(normalized.status);
          setAnalysis(normalized.analysis);
          return;
        }
      } catch {
        // If storage is corrupted, fallback to new API call.
      }
    }

    const repoUrl = sessionStorage.getItem("repo_url");
    if (repoUrl) {
      fetchAnalysis(repoUrl);
      return;
    }

    setError("Nenhum resultado de análise encontrado. Volte e execute uma nova análise.");
  }, []);

  return (
    <Layout>
      <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl p-8">

        <h1 className="text-2xl font-bold text-white mb-6">
          Análise do Repositório
        </h1>

        {loading && (
          <p className="text-slate-400">
            Executando análise do repositório...
          </p>
        )}

        {error && (
          <p className="text-red-400">
            {error}
          </p>
        )}

        {analysis && (
          <div className="space-y-6">

            <div className="flex gap-3 flex-wrap items-center">
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded font-mono uppercase tracking-wider">
                Status: {status ?? "unknown"}
              </span>
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded font-mono uppercase tracking-wider">
                Falhas Encontradas: {analysis.non_conforming_count ?? analysis.issues?.length ?? 0}
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

                {analysis.issues.map((issue, index) => (

                  <div
                    key={index}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg"
                  >

                    <div className="flex gap-4 flex-wrap mb-2">

                      <span className="text-cyan-200 font-mono text-sm">
                        <strong>Arquivo:</strong> {issue.filename}
                      </span>

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

                  </div>

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

      </div>
    </Layout>
  );
}