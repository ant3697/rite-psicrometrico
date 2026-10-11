import React, { useState, useRef, useEffect } from 'react';
import { UnitSystem, ChartType } from '../types/psychrometrics';
import {
  Download,
  Layers,
  Sparkles,
  FileSpreadsheet,
  AirVent,
  ShieldCheck,
  LineChart,
  Activity,
  Wind,
  PanelLeftOpen,
  PanelLeftClose,
  GraduationCap,
  Snowflake,
  Shuffle,
  Target,
  Wrench,
  Search,
  ChevronDown,
  Compass,
  Gauge,
  Sliders,
} from 'lucide-react';

interface TopBarProps {
  currentView: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic' | 'teaching';
  onChangeView: (view: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic' | 'teaching') => void;
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
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  activeConditionName?: string;
  onOpenConditionsModal?: () => void;
  onOpenCoilModelerModal?: () => void;
  onOpenAirMixingModal?: () => void;
  onOpenShrModal?: () => void;
  onOpenCommandPalette?: () => void;
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
  isSidebarCollapsed,
  onToggleSidebar,
  activeConditionName,
  onOpenConditionsModal,
  onOpenCoilModelerModal,
  onOpenAirMixingModal,
  onOpenShrModal,
  onOpenCommandPalette,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isChartTypeDropdownOpen, setIsChartTypeDropdownOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const chartDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(event.target as Node)) {
        setIsChartTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 bg-[#0a0a0c]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] px-2.5 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 font-primary">
      {/* Zone 1: Logo & Brand + Quick Search Pill */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-[#fbbf24] hover:bg-white/10 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Desplegar panel de puntos psicrométricos" : "Plegar panel de puntos psicrométricos"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#fbbf24]" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChangeView('chart')}>
          <div className="w-7 h-7 rounded-[6px] bg-[#fbbf24] text-black flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(251,191,36,0.35)]">
            Ψ
          </div>
          <span className="text-[14px] sm:text-[15px] font-bold tracking-tight text-white hidden sm:inline">
            PsychroStudio <span className="text-[#fbbf24] font-normal text-xs ml-0.5 font-mono">PRO</span>
          </span>
        </div>

        {/* Global Command Palette / Quick Search Trigger */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400 bg-white/5 hover:bg-white/10 hover:text-slate-200 rounded-lg border border-white/10 transition-all cursor-pointer group ml-1"
            title="Abrir buscador global de vistas, cálculos y puntos (Ctrl+K / ⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-[#fbbf24] group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline text-slate-300">Buscar vista o cálculo...</span>
            <span className="hidden sm:inline font-mono text-[10px] bg-black/40 text-slate-400 px-1.5 py-0.5 rounded border border-white/10">
              ⌘K
            </span>
          </button>
        )}
      </div>

      {/* Zone 2: Primary Workspaces / Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 p-0.5 bg-[#141416] rounded-xl border border-white/10 max-w-full overflow-x-auto">
        {/* 1. Diagrama Psicrométrico with Integrated Carrier / Mollier Selector */}
        <div className="relative" ref={chartDropdownRef}>
          <div
            className={`flex items-center rounded-lg transition-all text-xs font-bold ${
              currentView === 'chart'
                ? 'bg-[#fbbf24] text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <button
              onClick={() => onChangeView('chart')}
              className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
              title="Ver Diagrama Psicrométrico"
            >
              <LineChart className="w-3.5 h-3.5 shrink-0" />
              <span>Diagrama {chartType === 'mollier' ? '(Mollier)' : '(Carrier)'}</span>
            </button>
            <button
              onClick={() => setIsChartTypeDropdownOpen((prev) => !prev)}
              className={`p-1.5 pr-2 rounded-r-lg hover:bg-black/10 transition-colors cursor-pointer border-l ${
                currentView === 'chart' ? 'border-black/20 text-black' : 'border-white/10 text-slate-400'
              }`}
              title="Cambiar proyección psicrométrica (Carrier ASHRAE vs Mollier h-x)"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Carrier vs Mollier dropdown popover */}
          {isChartTypeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#18191d] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 text-slate-200">
              <button
                onClick={() => {
                  onChangeView('chart');
                  onChangeChartType('carrier');
                  setIsChartTypeDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  chartType === 'carrier' && currentView === 'chart'
                    ? 'bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LineChart className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Carrier / ASHRAE</div>
                    <div className="text-[10px] text-slate-400">Tdb horizontal, w vertical</div>
                  </div>
                </div>
                {chartType === 'carrier' && <span className="text-[10px] font-mono font-bold">✓</span>}
              </button>

              <button
                onClick={() => {
                  onChangeView('chart');
                  onChangeChartType('mollier');
                  setIsChartTypeDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer mt-1 ${
                  chartType === 'mollier' && currentView === 'chart'
                    ? 'bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <div className="font-semibold">Mollier h-x</div>
                    <div className="text-[10px] text-slate-400">Eje entálpico oblicuo (DIN)</div>
                  </div>
                </div>
                {chartType === 'mollier' && <span className="text-[10px] font-mono font-bold">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* 2. Esquema Físico & UTA */}
        <button
          onClick={() => onChangeView('schematic')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'schematic'
              ? 'bg-[#fbbf24] text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Esquema físico del climatizador y componentes UTA"
        >
          <AirVent className="w-3.5 h-3.5 shrink-0 text-[#38bdf8]" />
          <span>Esquema UTA</span>
        </button>

        {/* 3. Tabla de Puntos */}
        <button
          onClick={() => onChangeView('points')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'points'
              ? 'bg-[#fbbf24] text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Tabla de estados psicrométricos"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-[#fb923c]" />
          <span>Puntos</span>
        </button>

        {/* 4. Procesos & Balances */}
        <button
          onClick={() => onChangeView('processes')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'processes'
              ? 'bg-[#fbbf24] text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Balances de energía y transformaciones térmicas"
        >
          <Activity className="w-3.5 h-3.5 shrink-0 text-[#c084fc]" />
          <span>Procesos</span>
        </button>

        {/* 5. Confort & Calidad Aire */}
        <button
          onClick={() => onChangeView('comfort')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'comfort'
              ? 'bg-[#fbbf24] text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Zonas bioclimáticas Givoni y Calidad de Aire Interior"
        >
          <Wind className="w-3.5 h-3.5 shrink-0 text-[#a3e635]" />
          <span className="hidden lg:inline">Confort & IAQ</span>
          <span className="lg:hidden">Confort</span>
        </button>

        {/* 6. Aula Docente */}
        <button
          onClick={() => onChangeView('teaching')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'teaching'
              ? 'bg-[#fbbf24] text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-[#f59e0b] hover:text-white hover:bg-white/5'
          }`}
          title="Aula interactiva paso a paso"
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#f59e0b]" />
          <span>Aula</span>
        </button>
      </nav>

      {/* Zone 3: Consolidated Tools Hub + Atmosphere/Units + Export CTA */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Consolidated Tools & Calculations Dropdown (Replaces 6 dense separate buttons) */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setIsToolsMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isToolsMenuOpen
                ? 'bg-[#fbbf24]/15 border-[#fbbf24] text-[#fbbf24]'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200 hover:text-white'
            }`}
            title="Herramientas termodinámicas, cálculos OTS, ciclos y auditoría"
          >
            <Wrench className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span className="font-medium">Herramientas</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isToolsMenuOpen ? 'rotate-180 text-[#fbbf24]' : ''}`} />
          </button>

          {/* Tools Menu Popover */}
          {isToolsMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#16171b] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 divide-y divide-white/10 animate-in fade-in zoom-in-95 duration-100">
              {/* Section 1: Thermodynamic Modeler (OTS C, D, E) */}
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Cálculos Termodinámicos (OTS)
                </div>

                {onOpenCoilModelerModal && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenCoilModelerModal();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                      <Snowflake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                        Simulador Batería & ADP
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">C</span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Punto de rocío del aparato, bypass factor, condensados y riesgo de escarcha.
                      </div>
                    </div>
                  </button>
                )}

                {onOpenAirMixingModal && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenAirMixingModal();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                      <Shuffle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-1.5">
                        Mezcla de Corrientes
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">D</span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Repartición de caudales, balance entálpico, economizador y niebla.
                      </div>
                    </div>
                  </button>
                )}

                {onOpenShrModal && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenShrModal();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                        Líneas SHR & Cargas Local
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">E</span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Factor de calor sensible, caudal requerido e impulsión.
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Section 2: Scenarios & Presets */}
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Ciclos & Escenarios
                </div>

                {onOpenConditionsModal && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenConditionsModal();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-1.5">
                        Escenarios Operativos
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">A</span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Activo: <span className="text-amber-300 font-semibold">{activeConditionName || 'Predeterminado'}</span>
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenPresetsModal();
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-yellow-300">
                      Ciclos HVAC Predefinidos
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Cargar transformaciones de verano, invierno, UTA todo aire y desecante.
                    </div>
                  </div>
                </button>
              </div>

              {/* Section 3: Compliance & AI */}
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Normativa & Auditoría
                </div>

                {onOpenIdaeModal && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenIdaeModal();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-lime-500/10 border border-lime-500/20 text-lime-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-lime-300">
                        Auditoría IDAE / RITE
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Conformidad según Guía Técnica de Equipos Autónomos ATECYR.
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenAiAssistant();
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 text-left transition-colors cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Diagnóstico Termodinámico IA
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Inspección asistida de anomalías térmicas y puntos de rocío.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Scenario Quick Indicator */}
        {onOpenConditionsModal && activeConditionName && (
          <button
            onClick={onOpenConditionsModal}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-colors cursor-pointer max-w-[140px] truncate"
            title={`Condición activa: ${activeConditionName}. Clic para cambiar o comparar.`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="truncate font-semibold">{activeConditionName}</span>
          </button>
        )}

        {/* Combined Atmosphere & Units Widget */}
        <div className="flex items-center rounded-lg border border-white/15 bg-black/40 text-xs overflow-hidden">
          {/* Barometric Button */}
          <button
            onClick={onOpenAtmosphereModal}
            className="flex items-center gap-1 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer font-mono tabular-nums"
            title={`Altitud: ${altitude} m, Presión: ${pressure.toFixed(1)} kPa. Clic para calibrar.`}
          >
            <Gauge className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
            <span className="font-semibold">{pressure.toFixed(1)} <span className="text-[10px] text-slate-400">kPa</span></span>
          </button>

          <div className="w-px h-4 bg-white/10" />

          {/* Unit Switcher */}
          <button
            onClick={onToggleUnits}
            className="px-2 py-1.5 font-mono font-bold text-white hover:text-[#fbbf24] hover:bg-white/10 transition-colors cursor-pointer"
            title="Alternar unidades: SI (°C, kJ/kg) vs IP (°F, BTU/lb)"
          >
            {units}
          </button>
        </div>

        {/* Export Button (Primary CTA) */}
        <button
          onClick={onOpenExportModal}
          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.25)]"
          title="Exportar diagrama en alta resolución, informe técnico o datos CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </header>
  );
};
