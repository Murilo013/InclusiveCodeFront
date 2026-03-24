"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, Globe, Shield, Zap } from "lucide-react";
import Layout from "./Layout";

const PROGRESS_STEPS = [
  "Validando URL do repositório",
  "Coletando estrutura de arquivos",
  "Executando varredura de acessibilidade",
  "Gerando recomendações de melhoria",
  "Finalizando relatório para exibição",
];

export default function ScannerHome() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiErrorHiding, setIsApiErrorHiding] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    try {
      if (!sessionStorage.getItem("auth_user")) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const getApiMessage = (data: Record<string, unknown>, fallback: string) => {
    if (typeof data.error === "string") {
      return data.error;
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return fallback;
  };

  React.useEffect(() => {
    if (!isLoading) {
      setActiveStep(0);
      return;
    }

    setActiveStep(0);

    const intervalId = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= PROGRESS_STEPS.length - 1) {
          return prev;
        }

        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(intervalId);
  }, [isLoading]);

  React.useEffect(() => {
    if (!apiError) {
      setIsApiErrorHiding(false);
      return;
    }

    setIsApiErrorHiding(false);

    const hideTimeoutId = setTimeout(() => {
      setIsApiErrorHiding(true);
    }, 4500);

    const removeTimeoutId = setTimeout(() => {
      setApiError(null);
      setIsApiErrorHiding(false);
    }, 5000);

    return () => {
      clearTimeout(hideTimeoutId);
      clearTimeout(removeTimeoutId);
    };
  }, [apiError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;
    setIsLoading(true);

    try {
      sessionStorage.setItem("analysis_running", "1");
    } catch {}

    try {
      const userId = sessionStorage.getItem("auth_user_id");

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl, id: userId }),
      });
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          data = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
        } catch {
          throw new Error("Resposta da API não é JSON válido: " + raw);
        }
      }

      if (!res.ok) {
        throw new Error(getApiMessage(data, `Status ${res.status}`));
      }

      // Detect API message indicating no web files were found and show a clearer error
      const apiMessage = typeof data.message === "string" ? data.message : "";
      if (apiMessage.toLowerCase().includes("nenhum arquivo web")) {
        throw new Error("O repositório não parece conter páginas web (html/jsx/tsx/css/php)");
      }

      const readme = typeof data.readme_Preview === "string" ? data.readme_Preview : "";
      sessionStorage.setItem("readme_Preview", readme);
      sessionStorage.setItem("repo_url", repoUrl);
      try {
        sessionStorage.setItem("analysis_result", JSON.stringify(data));
      } catch {}
      router.push("/analysis");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Erro ao analisar:", error);
      setIsApiErrorHiding(false);
      setApiError(message);
      try {
        sessionStorage.removeItem("analysis_running");
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {apiError && (
        <div
          className={`fixed top-20 z-[70] rounded-lg border border-rose-400/50 bg-rose-700 text-white px-4 py-3 text-center shadow-lg transition-all duration-500 ${
            isApiErrorHiding ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="text-sm font-semibold">Erro na analise</div>
          <p className="mt-1 text-sm text-rose-100 break-words">{apiError.slice(17)}</p>
        </div>
      )}

      {isLoading && (
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

            <p className="mt-2 text-sm text-slate-300">
              Estamos processando sua análise. Isso pode levar alguns segundos.
            </p>

            <div className="mt-5 space-y-3">
              {PROGRESS_STEPS.map((step, index) => {
                const isDone = index < activeStep;
                const isCurrent = index === activeStep;

                return (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    {isDone ? (
                      <span className="text-emerald-300 text-sm">✓</span>
                    ) : isCurrent ? (
                      <span className="inline-block w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
                    ) : (
                      <span className="inline-block w-4 h-4 rounded-full border border-slate-500/50" />
                    )}

                    <span
                      className={`text-sm ${
                        isDone
                          ? "text-emerald-300"
                          : isCurrent
                            ? "text-cyan-200"
                            : "text-slate-400"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Zap className="w-3 h-3" /> AI Accessibility Engine
          </div>

          <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-white">
            Escaneie. Analise.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Inclua.
            </span>
          </h2>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Torne sua aplicação mais acessível. Nossa engine de varredura profunda identifica falhas de
            acessibilidade e gera patches corretivos em tempo real.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl group">
          <div className="relative p-px rounded-2xl bg-gradient-to-r from-white/10 via-cyan-500/50 to-white/10 transition-all duration-500 group-focus-within:from-cyan-500">
            <div className="relative flex items-center bg-slate-950 rounded-[15px] overflow-hidden">
              <div className="absolute left-5 text-cyan-500/50">
                <Github className="w-6 h-6" />
              </div>

              <input
                type="url"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repository"
                className="w-full pl-14 pr-40 py-5 bg-transparent text-white placeholder:text-slate-600 focus:outline-none text-lg font-mono"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer absolute right-2 top-2 bottom-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-8 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline uppercase text-xs tracking-widest">Analisar</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> WCAG 2.1 Compliant</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Auth</span>
          </div>
        </form>
      </div>
    </Layout>
  );
}