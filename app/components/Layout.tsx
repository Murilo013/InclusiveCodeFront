"use client";
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        {children}
      </main>

      <Footer />

      <style>{`.text-glow { text-shadow: 0 0 20px rgba(6, 182, 212, 0.5); }`}</style>
    </div>
  );
}
