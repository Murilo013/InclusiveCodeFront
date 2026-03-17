"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordRecoveryModal from "../components/PasswordRecoveryModal";
import {
  BarChart3,
  ChevronLeft,
  History,
  Lock,
  Shield,
  Zap,
} from "lucide-react";
import Layout from "../components/Layout";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showRecoveryNotice, setShowRecoveryNotice] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("auth_user");
      const storedEmail = sessionStorage.getItem("auth_email");

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      setUsername(storedUser);
      if (storedEmail) {
        setEmail(storedEmail);
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
              <span className="block text-xl font-black text-white">0</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Scans</span>
            </div>
            <div className="text-center px-6 py-2 border-l border-white/10 hidden lg:block">
              <span className="block text-xl font-black text-cyan-400">0%</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Avg_Score</span>
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
                <div className="w-full py-10 text-center text-[11px] font-mono text-slate-500 uppercase tracking-[0.2em] border border-dashed border-white/10 rounded-2xl">
                  Sem logs de atividades
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
