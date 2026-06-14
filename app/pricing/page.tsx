"use client";

import React from "react";
import { Eye, Check, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();

  const plans = [
    {
      name: "AVULSO",
      description: "Ideal para pequenos projetos.",
      price: "4,99",
      period: "por análise",
      features: [
        "Análise de 1 repositório até (2.000 linhas)",
        "Relatório de acessibilidade",
        "Sugestões de melhoria",
      ],
    },
    {
      name: "PLUS",
      description: "Ideal para equipes em crescimento.",
      price: "19,99",
      period: "a partir de",
      features: [
        "Análise de até 5 repositórios (2.000 linhas)",
        "Relatórios de acessibilidade detalhados",
        "Melhorias com pull request",
      ],
    },
    {
      name: "FULL",
      description: "Ideal para grandes times e empresas.",
      price: "49,99",
      period: "a partir de",
      features: [
        "Análise ilimitada de repositórios",
        "Relatórios de acessibilidade detalhados",
        "Melhorias com pull request",
        "Acesso antecipado a novas funcionalidades",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 relative overflow-hidden bg-[#020617]">
      {/* Gradient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-6xl z-10 mt-16 md:mt-20">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-mono uppercase tracking-widest">Voltar</span>
        </button>

        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-4">
            <Eye className="w-7 h-7 text-cyan-400" />
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase">
            Planos e <span className="text-cyan-400">Preços</span>
          </h1>

          <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.2em]">
            MODELO DE COBRANÇA
          </p>

          <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-transparent mx-auto mt-6" />

          <p className="text-slate-300 text-lg max-w-2xl mx-auto mt-8">
            O <span className="font-bold text-cyan-400">INCLUSIVECODE</span> oferece planos escalaláveis de análise de acessibilidade e qualidade de software, atendendo desde pequenos projetos até sistemas corporativos.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="group relative bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl hover:shadow-[0_0_50px_rgba(6,182,212,0.2)] hover:border-cyan-500/30 transition-all duration-300 flex flex-col"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/10 rounded-3xl transition-all duration-300 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">

                {/* Plan Name */}
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight text-center">
                  {plan.name}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-6 text-center">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">
                    {plan.period}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-cyan-400">
                      R$ {plan.price}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8 pb-8 border-b border-white/5">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-start gap-3 group/feature"
                    >
                      <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-sm leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button - using mt-auto to push to bottom */}
                <button className="mt-auto w-full py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-sm font-bold uppercase tracking-[0.15em] rounded-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:from-cyan-500 hover:to-cyan-400">
                  {index === 0 ? "Comprar Análise" : "Assinar Plano"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center pb-12">
          <p className="text-slate-500 text-sm">
            Dúvidas? Entre em contato com nosso time de suporte
          </p>
        </div>
      </div>
    </div>
  );
}
