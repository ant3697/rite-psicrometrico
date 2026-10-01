import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  Sliders,
} from 'lucide-react';
import { IDAE_SYMBOL_DEFINITIONS, IDAESectionSymbol } from './IDAESymbols';
import { AHUModuleType } from '../types/psychrometrics';

interface IDAESymbolGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModuleType?: (type: AHUModuleType) => void;
}

export const IDAESymbolGuideModal: React.FC<IDAESymbolGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectModuleType,
}) => {
  const [selectedType, setSelectedType] = useState<AHUModuleType>('heat_recovery');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredSymbols = IDAE_SYMBOL_DEFINITIONS.filter(
    (sym) =>
      sym.officialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sym.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sym.guideSection.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDef =
    IDAE_SYMBOL_DEFINITIONS.find((s) => s.type === selectedType) || IDAE_SYMBOL_DEFINITIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md select-none font-primary">
      <div className="panel-glass w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0a0a0c]/70 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#fbbf24]/15 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24] shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Simbología Oficial IDAE / UNE-EN 12792 para Esquemas & UTA
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#65a30d]/20 text-[#a3e635] border border-[#65a30d]/40">
                  Guía Técnica IDAE / ATECYR
                </span>
              </div>
              <p className="text-xs text-[#cbd5e1] font-secondary">
                Catálogo de símbolos normalizados según UNE-EN 12792:2004, UNE 1102-1 y UNE-EN 13779
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.idae.es/uploads/documentos/documentos_17_Guia_tecnica_instalaciones_de_climatizacion_con_equipos_autonomos_5bd3407b.pdf"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:btn-secondary text-xs"
            >
              <span>PDF IDAE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar list + Detail Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Symbol List */}
          <div className="w-full md:w-80 border-r border-[rgba(255,255,255,0.1)] bg-[#0a0a0c]/60 p-3 flex flex-col space-y-2 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar componente o sección..."
                className="input-pro w-full pl-9 pr-3 !py-1.5 text-xs text-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredSymbols.map((item) => {
                const isSelected = item.type === selectedType;
                return (
                  <button
                    key={item.type}
                    onClick={() => setSelectedType(item.type)}
                    className={`w-full text-left p-2.5 rounded-[6px] border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#fbbf24]/15 border-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                        : 'bg-[#1a1a1c]/60 border-[rgba(255,255,255,0.06)] hover:bg-[#1a1a1c] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-[#fbbf24]' : 'text-[#f8fafc]'
                        }`}
                      >
                        {item.officialName.split('(')[0]}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#0a0a0c] text-[#cbd5e1]">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#94a3b8] line-clamp-1 font-secondary">
                      {item.guideSection}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Symbol Inspection and Details */}
          <div className="flex-1 bg-slate-900/40 p-6 overflow-y-auto space-y-6">
            {/* Interactive SVG Rendering Preview (Both Technical White & Dark themes) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                  Representación Gráfica Estandarizada
                </span>
                <span className="text-xs text-cyan-400 font-mono font-semibold">
                  Norma {activeDef.normativeReference.split('/')[0]}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Official IDAE Technical Paper Style (Fondo Claro Técnico) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-md flex flex-col items-center justify-center min-h-[220px]">
                  <span className="text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase">
                    Estilo Guía Técnica IDAE (Fondo Claro)
                  </span>
                  <svg width="180" height="200" viewBox="0 0 160 210" className="overflow-visible">
                    <rect x="0" y="0" width="160" height="200" rx="4" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
                    <IDAESectionSymbol
                      mod={{
                        id: 'preview-mod',
                        type: activeDef.type,
                        name: activeDef.officialName,
                        enabled: true,
                        pressureDropPa: 60,
                        params: {
                          outdoorRatio: 0.3,
                          recoveryEfficiency: 0.75,
                          exitTdb: 12.8,
                          heatingTdb: 16.5,
                          staticPressurePa: 450,
                          filterClass: activeDef.type === 'prefilter' ? 'G4' : 'F7',
                        },
                      }}
                      modWidth={160}
                      isFlowActive={true}
                      isWhiteTheme={true}
                    />
                  </svg>
                </div>

                {/* 2. CAD Dark Blueprint Style */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md flex flex-col items-center justify-center min-h-[220px]">
                  <span className="text-[10px] font-mono font-bold text-slate-400 mb-2 uppercase">
                    Estilo Blueprint CAD (Fondo Oscuro)
                  </span>
                  <svg width="180" height="200" viewBox="0 0 160 210" className="overflow-visible">
                    <rect x="0" y="0" width="160" height="200" rx="4" fill="#0B132B" stroke="#475569" strokeWidth="2" />
                    <IDAESectionSymbol
                      mod={{
                        id: 'preview-mod-dark',
                        type: activeDef.type,
                        name: activeDef.officialName,
                        enabled: true,
                        pressureDropPa: 60,
                        params: {
                          outdoorRatio: 0.3,
                          recoveryEfficiency: 0.75,
                          exitTdb: 12.8,
                          heatingTdb: 16.5,
                          staticPressurePa: 450,
                          filterClass: activeDef.type === 'prefilter' ? 'G4' : 'F7',
                        },
                      }}
                      modWidth={160}
                      isFlowActive={true}
                      isWhiteTheme={false}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Technical Information Sheet */}
            <div className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white font-tech">{activeDef.officialName}</h4>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                    {activeDef.normativeReference}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {activeDef.guideSection}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{activeDef.description}</p>

              <div>
                <h5 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
                  Criterios de Diseño y Prescripciones de la Guía IDAE:
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {activeDef.keyFeatures.map((feat, idx) => (
                    <li key={`feat-${idx}`} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action to insert directly into AHU longitudinal cut */}
              {onSelectModuleType && (
                <div className="pt-3 border-t border-[rgba(255,255,255,0.1)] flex items-center justify-between">
                  <div className="text-[11px] text-[#cbd5e1] font-mono">
                    Inserta este elemento normalizado IDAE directamente en el corte longitudinal
                  </div>
                  <button
                    onClick={() => {
                      onSelectModuleType(activeDef.type);
                      onClose();
                    }}
                    className="btn-primary text-xs flex items-center gap-2 !py-2 !px-4 shadow-lg shadow-amber-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Insertar en corte UTA</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
