import React from 'react';
import { UnitSystem, ChartType } from '../types/psychrometrics';
import {
  Download,
  Settings,
  Layers,
  Sparkles,
  RotateCcw,
  Sliders,
  FileSpreadsheet,
  AirVent,
  ShieldCheck,
  LineChart,
  Compass,
  Activity,
  Wind,
} from 'lucide-react';

interface TopBarProps {
  currentView: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic';
  onChangeView: (view: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic') => void;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  units: UnitSystem;
  onToggleUnits: () => void;
  pressure: number;
  altitude: number;
  onOpenAtmosphereModal: () => void;
  onOpenPresetsModal: () => void;
  onOpenExportModal: () => void;
  onOpenAiAssistant: () => void;
  onOpenIdaeModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onChangeView,
  chartType,
  onChangeChartType,
  units,
  onToggleUnits,
  pressure,
  altitude,
  onOpenAtmosphereModal,
  onOpenPresetsModal,
  onOpenExportModal,
  onOpenAiAssistant,
  onOpenIdaeModal,
}) => {
  return (
    <header className="h-14 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] px-5 flex items-center justify-between shrink-0 select-none z-30 font-primary">
      {/* Zone 1: Brand title, one line wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[6px] bg-[#fbbf24] text-black flex items-center justify-center font-bold text-base shadow-[0_0_10px_rgba(251,191,36,0.3)]">
          Ψ
        </div>
        <span className="text-[17px] font-bold tracking-tight text-white">
          PsychroStudio <span className="text-[#fbbf24] font-normal text-xs ml-1 font-mono">PRO</span>
        </span>
      </div>

      {/* Zone 2: Navigation Links / Primary View Modes with Semantic Colors and Active Yellow */}
      <nav className="hidden md:flex items-center gap-1.5 p-1 bg-[#141416] rounded-xl border border-white/10">
        {/* 1. Esquema Físico & UTA (Default / Position 1) */}
        <button
          onClick={() => onChangeView('schematic')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            currentView === 'schematic'
              ? 'bg-[#fbbf24] text-black font-extrabold shadow-[0_0_14px_rgba(251,191,36,0.35)] border border-[#fbbf24]'
              : 'text-[#38bdf8] bg-[#0284c7]/15 border border-[#38bdf8]/35 hover:bg-[#0284c7]/25 hover:border-[#38bdf8]/60 hover:text-white'
          }`}
        >
          <AirVent className="w-3.5 h-3.5 text-current shrink-0" />
          <span>Esquema Físico & UTA</span>
        </button>

        {/* 2. Diagrama Psicrométrico (Carrier / Position 2) */}
        <button
          onClick={() => {
            onChangeView('chart');
            onChangeChartType('carrier');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            currentView === 'chart' && chartType === 'carrier'
              ? 'bg-[#fbbf24] text-black font-extrabold shadow-[0_0_14px_rgba(251,191,36,0.35)] border border-[#fbbf24]'
              : 'text-[#34d399] bg-[#059669]/15 border border-[#34d399]/35 hover:bg-[#059669]/25 hover:border-[#34d399]/60 hover:text-white'
          }`}
        >
          <LineChart className="w-3.5 h-3.5 text-current shrink-0" />
          <span>Diagrama Psicrométrico</span>
        </button>

        {/* 3. Tabla de Puntos */}
        <button
          onClick={() => onChangeView('points')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            currentView === 'points'
              ? 'bg-[#fbbf24] text-black font-extrabold shadow-[0_0_14px_rgba(251,191,36,0.35)] border border-[#fbbf24]'
              : 'text-[#fb923c] bg-[#ea580c]/15 border border-[#fb923c]/35 hover:bg-[#ea580c]/25 hover:border-[#fb923c]/60 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-current shrink-0" />
          <span>Tabla de Puntos</span>
        </button>

        {/* 4. Procesos & Balances */}
        <button
          onClick={() => onChangeView('processes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            currentView === 'processes'
              ? 'bg-[#fbbf24] text-black font-extrabold shadow-[0_0_14px_rgba(251,191,36,0.35)] border border-[#fbbf24]'
              : 'text-[#c084fc] bg-[#9333ea]/15 border border-[#c084fc]/35 hover:bg-[#9333ea]/25 hover:border-[#c084fc]/60 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-current shrink-0" />
          <span>Procesos & Balances</span>
        </button>

        {/* 5. Confort & Calidad Aire (IAQ) */}
        <button
          onClick={() => onChangeView('comfort')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            currentView === 'comfort'
              ? 'bg-[#fbbf24] text-black font-extrabold shadow-[0_0_14px_rgba(251,191,36,0.35)] border border-[#fbbf24]'
              : 'text-[#a3e635] bg-[#65a30d]/15 border border-[#a3e635]/35 hover:bg-[#65a30d]/25 hover:border-[#a3e635]/60 hover:text-white'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-current shrink-0" />
          <span>Confort & Calidad Aire (IAQ)</span>
        </button>

        {/* 6. Diagrama Mollier h-x (Position 6) */}
        <button
          onClick={() => {
            onChangeView('chart');
            onChangeChartType('mollier');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            currentView === 'chart' && chartType === 'mollier'
              ? 'bg-[#fbbf24] text-black font-extrabold shadow-[0_0_14px_rgba(251,191,36,0.35)] border border-[#fbbf24]'
              : 'text-[#818cf8] bg-[#4f46e5]/15 border border-[#818cf8]/35 hover:bg-[#4f46e5]/25 hover:border-[#818cf8]/60 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-current shrink-0" />
          <span>Diagrama Mollier h-x</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions & Calibration Bar */}
      <div className="flex items-center gap-2">
        {/* Presets button */}
        <button
          onClick={onOpenPresetsModal}
          className="btn-secondary text-[12px] whitespace-nowrap"
          title="Cargar ciclos HVAC predefinidos"
        >
          <Layers className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>Ciclos HVAC</span>
        </button>

        {/* IDAE Compliance Audit button */}
        {onOpenIdaeModal && (
          <button
            onClick={onOpenIdaeModal}
            className="btn-secondary text-[12px] whitespace-nowrap !border-[#65a30d]/40 !text-[#a3e635] hover:!border-[#a3e635]"
            title="Auditoría de conformidad según la Guía Técnica IDAE de Equipos Autónomos (ATECYR / RITE)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#a3e635]" />
            <span className="hidden sm:inline">Auditoría IDAE</span>
          </button>
        )}

        {/* Altitude / Pressure calibration trigger */}
        <button
          onClick={onOpenAtmosphereModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono tabular-nums text-[#cbd5e1] bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(255,255,255,0.1)] rounded-[6px] border border-[rgba(255,255,255,0.15)] transition-colors whitespace-nowrap"
          title="Ajustar altitud y presión atmosférica"
        >
          <span className="text-[#94a3b8]">Alt:</span>
          <span className="text-[#fbbf24] font-semibold">{altitude} m</span>
          <span className="text-slate-600">·</span>
          <span className="text-[#f8fafc] font-semibold">{pressure.toFixed(1)} kPa</span>
        </button>

        {/* Unit switcher (SI / IP) */}
        <button
          onClick={onToggleUnits}
          className="px-2.5 py-1.5 text-[12px] font-mono font-bold text-white bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(255,255,255,0.1)] rounded-[6px] border border-[rgba(255,255,255,0.2)] hover:border-[#fbbf24] transition-colors"
          title="Alternar unidades Sistema Internacional (SI) / Anglosajón (IP)"
        >
          {units === 'SI' ? 'SI (°C)' : 'IP (°F)'}
        </button>

        {/* AI Assistant button */}
        <button
          onClick={onOpenAiAssistant}
          className="btn-secondary text-[12px] whitespace-nowrap !border-[#3b82f6]/40 !text-[#93c5fd] hover:!border-[#93c5fd]"
          title="Asistente de diagnóstico termodinámico IA"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#93c5fd]" />
          <span className="hidden lg:inline">Diagnóstico IA</span>
        </button>

        {/* Export / Report button */}
        <button
          onClick={onOpenExportModal}
          className="btn-primary text-[12px] whitespace-nowrap"
          title="Exportar diagrama, informe o datos CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  );
};
