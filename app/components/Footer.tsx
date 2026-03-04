import React from 'react';
import { Eye } from 'lucide-react';

const footerLinks = [
  'Sobre Nós', 'Documentação', 'API', 'Termos de Uso', 'Privacidade',
  'Blog', 'Carreiras', 'Suporte', 'Comunidade', 'Contato',
];

export default function Footer() {
  return (
    <footer className="bg-slate-950/80 border-t border-white/5 pt-12 pb-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {footerLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white tracking-tighter uppercase">Inclusive Code</span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest text-center">
            &copy; {new Date().getFullYear()} INCLUSIVE_CODE. ALL_RIGHTS_RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
