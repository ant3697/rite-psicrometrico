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

      {/* Zone 2: Navigation Links / Primary View Modes (tabs component from Design System) */}
      <nav className="hidden md:flex items-center tabs-container">
        <button
          onClick={() => {
            onChangeView('chart');
            onChangeChartType('carrier');
          }}
          className={`tab-item ${
            currentView === 'chart' && chartType === 'carrier' ? 'active' : ''
          }`}
        >
          Diagrama Psicrométrico
        </button>

        <button
          onClick={() => {
            onChangeView('chart');
            onChangeChartType('mollier');
          }}
          className={`tab-item ${
            currentView === 'chart' && chartType === 'mollier' ? 'active' : ''
          }`}
        >
          Diagrama Mollier h-x
        </button>

        <button
          onClick={() => onChangeView('points')}
          className={`tab-item ${currentView === 'points' ? 'active' : ''}`}
        >
          Tabla de Puntos
        </button>

        <button
          onClick={() => onChangeView('processes')}
          className={`tab-item ${currentView === 'processes' ? 'active' : ''}`}
        >
          Procesos & Balances
        </button>

        <button
          onClick={() => onChangeView('comfort')}
          className={`tab-item ${currentView === 'comfort' ? 'active' : ''}`}
        >
          Confort (UNE-EN)
        </button>

        <button
          onClick={() => onChangeView('schematic')}
          className={`tab-item flex items-center gap-1.5 ${
            currentView === 'schematic' ? 'active' : ''
          }`}
        >
          <AirVent className="w-3.5 h-3.5" />
          <span>Esquema Físico & UTA</span>
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
