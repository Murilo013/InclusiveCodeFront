"use client";

import { Eye, Github, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import PasswordRecoveryModal from "../components/PasswordRecoveryModal";
import { UPSTREAM_BASE } from "../lib/upstream";

function parseApiResponse(raw: string): Record<string, unknown> {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { message: raw };
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(form);
    const username = String(formData.get("username") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch(isRegisterMode ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isRegisterMode
            ? { username, email, password }
            : { email, password }
        ),
      });

      const raw = await response.text();
  const data = parseApiResponse(raw);

      if (!response.ok) {
        const message =
          typeof data.message === "string" && data.message.trim().length > 0
            ? data.message
            : isRegisterMode
              ? "Falha ao criar conta. Verifique os dados informados."
              : "Falha no login. Verifique seu email e senha.";
        setError(message);
        return;
      }

      if (isRegisterMode) {
        const message =
          typeof data.message === "string" && data.message.trim().length > 0
            ? data.message
            : "Usuario registrado com sucesso!";

        setSuccessMessage(message);
        setIsRegisterMode(false);
        form.reset();
        return;
      }

      const resolvedUsername =
        typeof data.username === "string" && data.username.trim().length > 0
          ? data.username
          : email;

      try {
        sessionStorage.setItem("auth_user", resolvedUsername);
        sessionStorage.setItem("auth_email", email);
      } catch {}

      router.push("/scanner");
    } catch {
      setError(
        isRegisterMode
          ? "Nao foi possivel conectar com a API de cadastro."
          : "Nao foi possivel conectar com a API de login."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubLogin = () => {
    window.location.href = `${UPSTREAM_BASE}/api/auth/github/login`;
  };

  const handleRecoverPassword = () => {
    setError(null);
    setSuccessMessage(null);
    setRecoveryOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
      {recoveryOpen ? (
        <PasswordRecoveryModal onClose={() => setRecoveryOpen(false)} />
      ) : null}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-4">
            <Eye className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            Inclusive<span className="text-cyan-400">Code</span>
          </h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">
            Acessibilidade Terminal v2.4.0
          </p>
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegisterMode ? (
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">
                  Usuario
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    name="username"
                    required={isRegisterMode}
                    placeholder="seu_usuario"
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">
                Email
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="usuario@email.com"
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">
                Chave_Acesso
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                />
              </div>
            </div>

            {!isRegisterMode ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRecoverPassword}
                  className="cursor-pointer text-[10px] font-mono text-cyan-500 hover:text-cyan-300 uppercase tracking-widest transition-colors"
                >
                  Recuperar Senha?
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-70 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]"
            >
              {isSubmitting ? "Carregando" : isRegisterMode ? "Criar Conta" : "Iniciar Sessao"}
            </button>

            {error ? (
              <p className="text-xs font-mono text-red-400 tracking-wide">{error}</p>
            ) : null}

            {successMessage ? (
              <p className="text-xs font-mono text-emerald-400 tracking-wide">{successMessage}</p>
            ) : null}
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <span className="relative px-4 bg-slate-950 text-[10px] font-mono text-slate-600 uppercase tracking-widest italic">
              Integracao_Externa
            </span>
          </div>

          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-70 text-white py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest transition-all"
          >
            <Github className="w-5 h-5" />
            Conectar com GitHub
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          {isRegisterMode ? "Ja possui credenciais? " : "Nao possui credenciais? "}
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode((previous) => !previous);
              setError(null);
              setSuccessMessage(null);
            }}
            className="text-cyan-500 font-bold hover:underline transition-all cursor-pointer"
          >
            {isRegisterMode ? "Voltar para login" : "Criar conta"}
          </button>
        </p>
      </div>
    </div>
  );
}