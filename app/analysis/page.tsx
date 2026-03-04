"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';

export default function AnalysisPage() {
  const [readme, setReadme] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const value = sessionStorage.getItem('readme_Preview');
    setReadme(value);
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

        <button
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all"
        >
          Nova Analise
        </button>
      </div>
    </Layout>
  );
}
