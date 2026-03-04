"use client";
import React from 'react';
import { Menu, Eye, Cpu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-slate-950/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 sm:px-8 relative z-50">
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5 text-cyan-400 hidden sm:block" />
        <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.2em] hidden sm:block">System Status: Active</span>
      </div>

      <h1 className="text-xl font-black text-white absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 group cursor-default">
        <div className="relative">
          <Eye className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full"></div>
        </div>
        <span className="tracking-tighter">INCLUSIVE<span className="text-cyan-400">CODE</span></span>
      </h1>

      <button
        onClick={onMenuClick}
        aria-label="Abrir menu"
        className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 focus:outline-none"
      >
        <Menu className="w-6 h-6" />
      </button>
    </header>
  );
}
