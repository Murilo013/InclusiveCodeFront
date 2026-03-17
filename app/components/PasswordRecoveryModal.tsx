"use client";

import { useEffect, useState } from "react";

type Props = {
  email?: string;
  onClose?: () => void;
};

export default function PasswordRecoveryModal({ email: initialEmail = "", onClose }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const validateLocal = (): string | null => {
    if (newPassword !== newPasswordConfirmation) return "As novas senhas não conferem.";
    if (newPassword === oldPassword) return "A nova senha deve ser diferente da senha atual.";
    if (!email) return "Informe o email.";
    if (!oldPassword) return "Informe a senha atual.";
    if (!newPassword) return "Informe a nova senha.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const localError = validateLocal();
    if (localError) {
      setError(localError);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          oldPassword,
          newPassword,
          newPasswordConfirmation,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data.message = text;
      }

      if (res.status === 200) {
        setSuccess(data.message || "Senha atualizada com sucesso!");
        setTimeout(() => {
          onClose?.();
        }, 1500);
        return;
      }

      if (res.status === 400) {
        setError(data.message || "Nova senha inválida ou igual à anterior.");
        return;
      }

      if (res.status === 401) {
        setError(data.message || "Senha antiga incorreta.");
        return;
      }

      if (res.status === 404) {
        setError(data.message || "Usuário não encontrado.");
        return;
      }

      setError(data.message || "Erro interno do servidor.");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-900/95 p-6 text-center shadow-[0_0_80px_rgba(6,182,212,0.15)]">
        <h3 className="text-lg font-bold text-cyan-300 uppercase tracking-wide mb-2">Recuperar / Alterar Senha</h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="usuario@example.com"
            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 px-4 text-white font-mono text-sm"
          />

          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Senha atual</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            placeholder="senha atual"
            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 px-4 text-white font-mono text-sm"
          />

          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Nova senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="nova senha"
            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 px-4 text-white font-mono text-sm"
          />

          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Confirmar nova senha</label>
          <input
            type="password"
            value={newPasswordConfirmation}
            onChange={(e) => setNewPasswordConfirmation(e.target.value)}
            required
            placeholder="confirme a nova senha"
            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 px-4 text-white font-mono text-sm"
          />

          {error ? <p className="text-xs font-mono text-red-400">{error}</p> : null}
          {success ? <p className="text-xs font-mono text-emerald-400">{success}</p> : null}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest bg-transparent border border-white/10 rounded-xl text-slate-300 hover:bg-white/5"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest bg-cyan-600 text-white rounded-xl disabled:opacity-70"
            >
              {isSubmitting ? "Enviando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
