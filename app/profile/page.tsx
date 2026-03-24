"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordRecoveryModal from "../components/PasswordRecoveryModal";
import {
  BarChart3,
  ChevronLeft,
  Github,
  History,
  Lock,
  Shield,
  Zap,
} from "lucide-react";
import Layout from "../components/Layout";

type ScoreRingProps = {
  score?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getScoreRingColorClass(score: number) {
  if (score >= 85) {
    return "stroke-emerald-400";
  }

  if (score >= 70) {
    return "stroke-lime-400";
  }

  if (score >= 50) {
    return "stroke-yellow-400";
  }

  if (score >= 30) {
    return "stroke-orange-400";
  }

  return "stroke-red-400";
}

function getScoreTextColorClass(score?: number) {
  if (typeof score !== "number") {
    return "text-slate-300";
  }

  if (score >= 85) {
    return "text-emerald-300";
  }

  if (score >= 70) {
    return "text-lime-300";
  }

  if (score >= 50) {
    return "text-yellow-300";
  }

  if (score >= 30) {
    return "text-orange-300";
  }

  return "text-red-300";
}

function ScoreRing({ score }: ScoreRingProps) {
  const hasScore = typeof score === "number";
  const targetScore = hasScore ? clamp(score, 0, 100) : 0;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!hasScore) {
      setAnimatedScore(0);
      return;
    }

    let frameId = 0;
    const durationMs = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = clamp(elapsed / durationMs, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(targetScore * eased);
      setAnimatedScore(value);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [hasScore, targetScore]);

  const size = 52;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className="relative shrink-0 h-[52px] w-[52px]"
      aria-label={hasScore ? `Score da análise: ${targetScore}` : "Score da análise indisponível"}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "scaleX(-1) rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          className="stroke-slate-700/70"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={hasScore ? dashOffset : circumference}
          className={`${getScoreRingColorClass(targetScore)} transition-[stroke-dashoffset] duration-75`}
        />
      </svg>

      <div
        className={`absolute inset-0 flex items-center justify-center text-[12px] font-black ${getScoreTextColorClass(
          hasScore ? targetScore : undefined
        )}`}
      >
        {hasScore ? animatedScore : "--"}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showRecoveryNotice, setShowRecoveryNotice] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [analyses, setAnalyses] = useState<Array<{ id?: string; repoUrl?: string; createdAt?: string; rawJson?: string; score?: number; scoreLabel?: string }>>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [isGithubLinked, setIsGithubLinked] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubLinkMessage, setGithubLinkMessage] = useState<string | null>(null);

  const parseScore = (item: Record<string, unknown>) => {
    if (typeof item.score === "number") {
      return item.score;
    }

    if (typeof item.Score === "number") {
      return item.Score;
    }

    const rawJsonValue =
      typeof item.rawJson === "string"
        ? item.rawJson
        : typeof item.RawJson === "string"
        ? item.RawJson
        : undefined;

    if (!rawJsonValue) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawJsonValue) as Record<string, unknown>;
      const directScore = parsed.score;

      if (typeof directScore === "number") {
        return directScore;
      }

      const nestedAnalysis =
        parsed.analysis && typeof parsed.analysis === "object"
          ? (parsed.analysis as Record<string, unknown>)
          : null;

      const nestedScore = nestedAnalysis?.score;
      if (typeof nestedScore === "number") {
        return nestedScore;
      }
    } catch {
      return undefined;
    }

    return undefined;
  };

  const parseScoreLabel = (item: Record<string, unknown>) => {
    if (typeof item.scoreLabel === "string") {
      return item.scoreLabel;
    }

    if (typeof item.ScoreLabel === "string") {
      return item.ScoreLabel;
    }

    const rawJsonValue =
      typeof item.rawJson === "string"
        ? item.rawJson
        : typeof item.RawJson === "string"
        ? item.RawJson
        : undefined;

    if (!rawJsonValue) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawJsonValue) as Record<string, unknown>;
      const directLabel = parsed.scoreLabel;

      if (typeof directLabel === "string") {
        return directLabel;
      }

      const nestedAnalysis =
        parsed.analysis && typeof parsed.analysis === "object"
          ? (parsed.analysis as Record<string, unknown>)
          : null;

      const nestedLabel = nestedAnalysis?.scoreLabel;
      if (typeof nestedLabel === "string") {
        return nestedLabel;
      }
    } catch {
      return undefined;
    }

    return undefined;
  };

  const formatDateMinusThreeHours = (value?: string) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const adjustedDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
    return adjustedDate.toLocaleString("pt-BR");
  };

  const openAnalysisLog = (analysis: { repoUrl?: string; rawJson?: string }) => {
    if (!analysis.rawJson) {
      return;
    }

    try {
      sessionStorage.setItem("analysis_result", analysis.rawJson);
      if (analysis.repoUrl) {
        sessionStorage.setItem("repo_url", analysis.repoUrl);
      }
      router.push("/analysis");
    } catch {
      // If storage fails, keep user on profile page.
    }
  };

  const handleConnectGithub = async () => {
    setGithubLinkMessage(null);

    try {
      const storedUserId = sessionStorage.getItem("auth_user_id");

      if (!storedUserId) {
        setGithubLinkMessage("Faca login com sua conta normal antes de conectar o GitHub.");
        return;
      }

      setIsLinkingGithub(true);

      const { auth } = await import("../../lib/firebase");
      const { GithubAuthProvider, getAdditionalUserInfo, signInWithPopup } = await import("firebase/auth");

      const provider = new GithubAuthProvider();
      provider.addScope("repo");
      provider.addScope("read:user");

      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        setGithubLinkMessage("Nao foi possivel obter token do GitHub.");
        return;
      }

      const additionalUserInfo = getAdditionalUserInfo(result);
      const profileLogin =
        additionalUserInfo?.profile && typeof additionalUserInfo.profile === "object"
          ? (additionalUserInfo.profile as Record<string, unknown>).login
          : undefined;

      const resolvedGithubUsername =
        typeof profileLogin === "string" && profileLogin.trim().length > 0
          ? profileLogin
          : result.user.displayName || "GitHub User";

      sessionStorage.setItem("github_access_token", credential.accessToken);
      sessionStorage.setItem("github_linked_user_id", storedUserId);
      sessionStorage.setItem("github_username", resolvedGithubUsername);

      setGithubUsername(resolvedGithubUsername);
      setIsGithubLinked(true);
      setGithubLinkMessage("Conta GitHub conectada com sucesso.");
    } catch {
      setGithubLinkMessage("Falha ao conectar com o GitHub. Tente novamente.");
    } finally {
      setIsLinkingGithub(false);
    }
  };

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("auth_user");
      const storedEmail = sessionStorage.getItem("auth_email");
      const storedUserId = sessionStorage.getItem("auth_user_id");

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      setUsername(storedUser);
      if (storedEmail) {
        setEmail(storedEmail);
      }

      const githubToken = sessionStorage.getItem("github_access_token");
      const linkedUserId = sessionStorage.getItem("github_linked_user_id");
      const storedGithubUsername = sessionStorage.getItem("github_username") ?? "";

      const hasLinkedGithubForCurrentUser =
        !!githubToken && !!storedUserId && linkedUserId === storedUserId;
      const hasGithubSessionFromDirectLogin = !!githubToken && !storedUserId;

      if (hasLinkedGithubForCurrentUser || hasGithubSessionFromDirectLogin) {
        setIsGithubLinked(true);
        setGithubUsername(storedGithubUsername || storedUser);
      } else {
        setIsGithubLinked(false);
        setGithubUsername("");
      }

      // Fetch analyses history
      if (storedUserId) {
        setIsLoadingAnalyses(true);
        fetch(`/api/analyze/history?userId=${storedUserId}`)
          .then(res => res.json())
          .then(data => {
            const source: unknown[] = Array.isArray(data)
              ? data
              : data.analyses && Array.isArray(data.analyses)
                ? data.analyses
                : [];

            const normalized = source
              .filter((item: unknown): item is Record<string, unknown> => !!item && typeof item === "object")
              .map((item: Record<string, unknown>) => ({
                id:
                  typeof item.id === "string" || typeof item.id === "number"
                    ? String(item.id)
                    : typeof item.Id === "string" || typeof item.Id === "number"
                    ? String(item.Id)
                    : undefined,
                repoUrl:
                  typeof item.repoUrl === "string"
                    ? item.repoUrl
                    : typeof item.RepoUrl === "string"
                    ? item.RepoUrl
                    : undefined,
                createdAt:
                  typeof item.createdAt === "string"
                    ? item.createdAt
                    : typeof item.CreatedAt === "string"
                    ? item.CreatedAt
                    : undefined,
                rawJson:
                  typeof item.rawJson === "string"
                    ? item.rawJson
                    : typeof item.RawJson === "string"
                    ? item.RawJson
                    : undefined,
                score: parseScore(item),
                scoreLabel: parseScoreLabel(item),
              }));

            setAnalyses(normalized);
          })
          .catch(err => console.error("Erro ao buscar histórico:", err))
          .finally(() => setIsLoadingAnalyses(false));
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!showRecoveryNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowRecoveryNotice(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showRecoveryNotice]);

  return (
    <Layout>
      {recoveryOpen ? (
        <PasswordRecoveryModal email={email} onClose={() => setRecoveryOpen(false)} />
      ) : null}

      <div className="w-full max-w-5xl space-y-8 pt-2 pb-6">
        <button
          onClick={() => router.push("/scanner")}
          className="cursor-pointer flex items-center gap-2 text-[10px] font-mono text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar ao Terminal
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end bg-slate-950/40 border border-white/5 p-8 rounded-[2rem]">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] shrink-0">
            <img
              src="/silhouette-demo.svg"
              alt="Silhueta de usuario"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">{username || "Usuario"}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <span className="flex items-center gap-2 text-xs font-mono text-cyan-500/80 bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">
                <Shield className="w-3 h-3" /> System_Admin
              </span>           
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-center px-6 py-2 border-l border-white/10 hidden lg:block">
              <span className="block text-[20px] font-black text-white">{analyses.length}</span>
              <span className="text-[15px] font-mono text-slate-500 uppercase">Análises</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-950/40 border border-white/5 p-6 rounded-[2rem] space-y-6">
              <h3 className="flex items-center gap-2 text-sm font-mono text-cyan-500 uppercase tracking-widest">
                <Lock className="w-4 h-4" /> Segurança
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">
                    Senha_Atual
                  </label>
                  <div className="flex items-center justify-between bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3">
                    <span className="font-mono text-slate-400">••••••••••••</span>
                    <button
                      type="button"
                      onClick={() => setRecoveryOpen(true)}
                      className="cursor-pointer text-[10px] font-mono text-cyan-500 hover:text-cyan-400 uppercase font-bold transition-colors"
                    >
                      Alterar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">
                    GitHub
                  </label>
                  <button
                    type="button"
                    onClick={handleConnectGithub}
                    disabled={isLinkingGithub || isGithubLinked}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-70 text-white py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-all"
                  >
                    <Github className="w-4 h-4" />
                    {isGithubLinked ? "CONECTADO" : isLinkingGithub ? "Conectando..." : "Conectar GitHub"}
                  </button>

                  {isGithubLinked ? (
                    <p className="text-[11px] font-mono text-emerald-400">
                      Vinculado com {githubUsername || "GitHub"} para criar Pull Request.
                    </p>
                  ) : (
                    <p className="text-[11px] font-mono text-slate-500">
                      Conecte sua conta GitHub para habilitar Pull Request.
                    </p>
                  )}

                  {githubLinkMessage ? (
                    <p className="text-[11px] font-mono text-cyan-400">{githubLinkMessage}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 p-6 rounded-[2rem] relative overflow-hidden group">
              <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-cyan-500/10 group-hover:scale-110 transition-transform duration-700" />
              <h4 className="text-white font-bold mb-1">Upgrade_Tier</h4>
              <p className="text-xs text-slate-400 mb-4">Acesse analises ilimitadas</p>
              <button className="w-full py-2 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-cyan-400 transition-colors cursor-pointer">
                Virar Pro
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950/40 border border-white/5 p-8 rounded-[2rem] space-y-6 min-h-[500px]">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-mono text-cyan-500 uppercase tracking-widest">
                  <History className="w-4 h-4" /> Log_de_Atividades
                </h3>
                <BarChart3 className="w-4 h-4 text-slate-600" />
              </div>

              <div className="space-y-4">
                {isLoadingAnalyses ? (
                  <div className="w-full py-10 text-center text-[11px] font-mono text-slate-400 uppercase tracking-[0.2em] border border-dashed border-white/10 rounded-2xl">
                    Carregando_Logs...
                  </div>
                ) : analyses.length === 0 ? (
                  <div className="w-full py-10 text-center text-[11px] font-mono text-slate-500 uppercase tracking-[0.2em] border border-dashed border-white/10 rounded-2xl">
                    Sem logs de atividades
                  </div>
                ) : (
                  analyses.map((analysis, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => openAnalysisLog(analysis)}
                      className=" cursor-pointer w-full text-left p-4 bg-slate-900/30 border border-white/5 rounded-lg hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <ScoreRing score={analysis.score} />

                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-mono text-cyan-400 truncate">
                            {analysis.repoUrl || "Análise"}
                          </p>
                          {analysis.createdAt && (
                            <p className="text-[15px] text-slate-500 mt-1">
                              {formatDateMinusThreeHours(analysis.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
