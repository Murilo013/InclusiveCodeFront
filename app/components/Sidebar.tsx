"use client";
import React from 'react';
import { X, User, Bell, BookOpenText } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[100] transition-opacity duration-500 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />

      {/* drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-slate-950 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[110] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h3 className="text-sm font-mono text-cyan-500 uppercase tracking-[0.3em]">MENU_</h3>
            <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-2">User_Identity</h4>
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/5 transition-all group">
                  <User className="w-5 h-5 text-slate-500 group-hover:text-cyan-400" />
                  <span className="text-sm font-medium">Perfil</span>
                </button>
                <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/5 transition-all group">
                  <Bell className="w-5 h-5 text-slate-500 group-hover:text-cyan-400" />
                  <span className="text-sm font-medium">Análises Anteriores</span>
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-2">Core_Settings</h4>
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/5 transition-all group">
                  <BookOpenText className="w-5 h-5 text-slate-500 group-hover:text-cyan-400" />
                  <span className="text-sm font-medium">Protocolos de acessibilidade</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-black/20">
            <button className="w-full py-4 bg-transparent border border-red-500/30 text-red-500 text-xs font-mono uppercase tracking-[0.2em] rounded-xl hover:bg-red-500/10 transition-all">
              Encerrar Sessão
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
