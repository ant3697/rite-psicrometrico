import React, { useState, useMemo, useCallback } from 'react';
import {
  AirVent,
  LineChart,
  FileSpreadsheet,
  Activity,
  Wind,
  Sliders,
  X,
  ChevronRight,
  LayoutTemplate,
} from 'lucide-react';
import {
  StatePoint,
  ProcessConnection,
  ProcessType,
  ChartType,
  ChartLayerVisibility,
  UnitSystem,
  AtmosphereConfig,
  PresetCycle,
  IsolatedProcessInfo,
} from './types/psychrometrics';
import {
  solveStatePoint,
  P_ATM_STANDARD,
  pressureFromAltitude,
} from './utils/psychrolib';
import {
  calculateProcessMetrics,
  PRESET_CYCLES,
} from './utils/processEngine';
import { TopBar } from './components/TopBar';
import { PsychrometricChart } from './components/PsychrometricChart';
import { SidebarControls } from './components/SidebarControls';
import { PointsTable } from './components/PointsTable';
import { ProcessesTable } from './components/ProcessesTable';
import { ComfortView } from './components/ComfortView';
import { HVACSchematicViewer, AHU_ARCHETYPES } from './components/HVACSchematicViewer';
import { AtmosphereModal } from './components/AtmosphereModal';
import { PresetsModal } from './components/PresetsModal';
import { ExportModal } from './components/ExportModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { IDAEComplianceModal } from './components/IDAEComplianceModal';

export default function App() {
  // Navigation & View: default view is 'schematic' (Esquema Físico & UTA)
  const [currentView, setCurrentView] = useState<'chart' | 'points' | 'processes' | 'comfort' | 'schematic'>('schematic');
  const [chartType, setChartType] = useState<ChartType>('carrier');
  const [units, setUnits] = useState<UnitSystem>('SI');

  // Atmospheric state (Pressure & Altitude)
  const [atmosphere, setAtmosphere] = useState<AtmosphereConfig>({
    pressure: P_ATM_STANDARD,
    altitude: 0,
  });

  // Layer toggles
  const [layers, setLayers] = useState<ChartLayerVisibility>({
    rhCurves: true,
    twbLines: true,
    enthalpyLines: true,
    volumeLines: true,
    comfortSummer: false,
    comfortWinter: false,
    comfortEnCat1: false,
    comfortEnCat2: true, // Nivel normal de diseño RITE (UNE-EN 16798-1 / ISO 7730)
    comfortEnCat3: false,
    comfortEnSeason: 'summer',
    processes: true,
    pointLabels: true,
    shrProtractor: true,
    grid: true,
  });

  // Modals state
  const [isAtmosphereModalOpen, setIsAtmosphereModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isIdaeModalOpen, setIsIdaeModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'points' | 'processes' | 'layers' | 'archetypes'>('points');
  const [pendingArchetypeId, setPendingArchetypeId] = useState<string | null>(null);

  const handleLoadArchetypeFromSidebar = useCallback((archetypeId: string) => {
    setPendingArchetypeId(archetypeId);
    setCurrentView('schematic');
  }, []);

  // Initialize with the standard Summer AC Preset
  const [points, setPoints] = useState<StatePoint[]>(() => {
    const defaultPreset = PRESET_CYCLES[0];
    return defaultPreset.points.map((p, idx) =>
      solveStatePoint(p.inputs, P_ATM_STANDARD, {
        id: `pt-${idx + 1}`,
        name: p.name,
        color: p.color,
        volumeFlow: p.volumeFlow || 3000,
      })
    );
  });

  const [processes, setProcesses] = useState<ProcessConnection[]>(() => {
    const defaultPreset = PRESET_CYCLES[0];
    return defaultPreset.processes.map((proc, idx) => {
      const fromPt = points ? points[proc.fromIndex] : undefined;
      const toPt = points ? points[proc.toIndex] : undefined;

      const metrics =
        fromPt && toPt
          ? calculateProcessMetrics(fromPt, toPt, fromPt.massFlow)
          : {
              qSensible: 0,
              qLatent: 0,
              qTotal: 0,
              moistureExchange: 0,
              shr: 1,
              adp: undefined,
              bypassFactor: proc.bypassFactor,
            };

      return {
        id: `proc-${idx + 1}`,
        name: proc.name,
        type: proc.type,
        fromPointId: `pt-${proc.fromIndex + 1}`,
        toPointId: `pt-${proc.toIndex + 1}`,
        secondaryFromPointId: proc.secondaryFromIndex
          ? `pt-${proc.secondaryFromIndex + 1}`
          : undefined,
        mixingRatio: proc.mixingRatio,
        bypassFactor: proc.bypassFactor,
        color:
          proc.type === 'cooling_dehumid'
            ? '#38BDF8'
            : proc.type === 'sensible_heating'
            ? '#F97316'
            : proc.type === 'mixing'
            ? '#F59E0B'
            : '#8B5CF6',
        ...metrics,
      };
    });
  });

  const [selectedPointId, setSelectedPointId] = useState<string | null>('pt-1');
  const [isolatedProcessInfo, setIsolatedProcessInfo] = useState<IsolatedProcessInfo | null>(null);

  // Recalculate processes when points or atmospheric pressure update
  const updatedProcesses = useMemo(() => {
    return processes.map((proc) => {
      const ptFrom = points.find((p) => p.id === proc.fromPointId);
      const ptTo = points.find((p) => p.id === proc.toPointId);
      if (!ptFrom || !ptTo) return proc;

      const metrics = calculateProcessMetrics(ptFrom, ptTo, ptFrom.massFlow);
      return {
        ...proc,
        ...metrics,
      };
    });
  }, [points, processes]);

  // Recalculate points if atmospheric pressure changes
  const handleUpdateAtmosphere = (newPressure: number, newAltitude: number) => {
    setAtmosphere({ pressure: newPressure, altitude: newAltitude });
    setPoints((prevPoints) =>
      prevPoints.map((pt) =>
        solveStatePoint(
          { mode: 'tdb_w', tdb: pt.tdb, w: pt.w },
          newPressure,
          pt
        )
      )
    );
  };

  // Add new state point
  const handleAddPoint = () => {
    const newIdx = points.length + 1;
    const colors = ['#06B6D4', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
    const assignedColor = colors[(newIdx - 1) % colors.length];

    const newPt = solveStatePoint(
      { mode: 'tdb_rh', tdb: 22, rh: 50 },
      atmosphere.pressure,
      {
        id: `pt-${Date.now()}`,
        name: `Punto ${newIdx}`,
        color: assignedColor,
        volumeFlow: 2000,
      }
    );

    setPoints((prev) => [...prev, newPt]);
    setSelectedPointId(newPt.id);
  };

  // Add state point at exact chart coordinates (double-click on canvas)
  const handleAddPointAtCoordinates = (tdb: number, w: number) => {
    const newIdx = points.length + 1;
    const colors = ['#06B6D4', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
    const assignedColor = colors[(newIdx - 1) % colors.length];

    const newPt = solveStatePoint(
      { mode: 'tdb_w', tdb, w },
      atmosphere.pressure,
      {
        id: `pt-${Date.now()}`,
        name: `Punto ${newIdx}`,
        color: assignedColor,
        volumeFlow: 2000,
      }
    );

    setPoints((prev) => [...prev, newPt]);
    setSelectedPointId(newPt.id);
  };

  // Update state point
  const handleUpdatePoint = (updatedPoint: StatePoint) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === updatedPoint.id ? updatedPoint : p))
    );
  };

  // Dragging point directly on chart
  const handleUpdatePointCoordinates = (id: string, tdb: number, w: number) => {
    setPoints((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return solveStatePoint({ mode: 'tdb_w', tdb, w }, atmosphere.pressure, p);
      })
    );
  };

  // Delete state point
  const handleDeletePoint = (id: string) => {
    if (points.length <= 1) return;
    setPoints((prev) => prev.filter((p) => p.id !== id));
    setProcesses((prev) =>
      prev.filter((pr) => pr.fromPointId !== id && pr.toPointId !== id)
    );
    if (selectedPointId === id) {
      const remaining = points.filter((p) => p.id !== id);
      setSelectedPointId(remaining[0]?.id || null);
    }
  };

  // Add process
  const handleAddProcess = (fromId: string, toId: string, type: ProcessType) => {
    const ptFrom = points.find((p) => p.id === fromId);
    const ptTo = points.find((p) => p.id === toId);
    if (!ptFrom || !ptTo) return;

    const metrics = calculateProcessMetrics(ptFrom, ptTo, ptFrom.massFlow);

    const typeNames: Record<ProcessType, string> = {
      sensible_heating: 'Calentamiento Sensible',
      sensible_cooling: 'Enfriamiento Sensible',
      cooling_dehumid: 'Enfriamiento & Deshumectación',
      steam_humid: 'Humidificación Vapor',
      adiabatic_humid: 'Humidificación Adiabática',
      mixing: 'Mezcla de Caudales',
      heat_recovery: 'Recuperación de Calor',
      zone_load: 'Carga Térmica del Local',
      custom: 'Transformación Personalizada',
    };

    const typeColors: Record<ProcessType, string> = {
      sensible_heating: '#F97316',
      sensible_cooling: '#38BDF8',
      cooling_dehumid: '#0284C7',
      steam_humid: '#A855F7',
      adiabatic_humid: '#10B981',
      mixing: '#F59E0B',
      heat_recovery: '#EC4899',
      zone_load: '#6366F1',
      custom: '#94A3B8',
    };

    const newProc: ProcessConnection = {
      id: `proc-${Date.now()}`,
      name: typeNames[type] || 'Proceso',
      type,
      fromPointId: fromId,
      toPointId: toId,
      color: typeColors[type] || '#38BDF8',
      ...metrics,
    };

    setProcesses((prev) => [...prev, newProc]);
  };

  // Delete process
  const handleDeleteProcess = (id: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  };

  // Load preset cycle
  const handleSelectPreset = (preset: PresetCycle) => {
    const newPoints = preset.points.map((p, idx) =>
      solveStatePoint(p.inputs, atmosphere.pressure, {
        id: `pt-${idx + 1}`,
        name: p.name,
        color: p.color,
        volumeFlow: p.volumeFlow || 3000,
      })
    );

    const newProcesses: ProcessConnection[] = preset.processes.map((proc, idx) => {
      const ptFrom = newPoints[proc.fromIndex];
      const ptTo = newPoints[proc.toIndex];
      const metrics = calculateProcessMetrics(ptFrom, ptTo, ptFrom.massFlow);

      return {
        id: `proc-${idx + 1}`,
        name: proc.name,
        type: proc.type,
        fromPointId: `pt-${proc.fromIndex + 1}`,
        toPointId: `pt-${proc.toIndex + 1}`,
        secondaryFromPointId: proc.secondaryFromIndex
          ? `pt-${proc.secondaryFromIndex + 1}`
          : undefined,
        mixingRatio: proc.mixingRatio,
        bypassFactor: proc.bypassFactor,
        color:
          proc.type === 'cooling_dehumid'
            ? '#38BDF8'
            : proc.type === 'sensible_heating'
            ? '#F97316'
            : proc.type === 'mixing'
            ? '#F59E0B'
            : '#8B5CF6',
        ...metrics,
      };
    });

    setPoints(newPoints);
    setProcesses(newProcesses);
    setSelectedPointId(newPoints[0]?.id || null);
    setCurrentView('chart');
  };

  const handleToggleLayer = (layerKey: keyof ChartLayerVisibility) => {
    setLayers((prev) => {
      if (layerKey === 'comfortEnSeason') {
        return {
          ...prev,
          comfortEnSeason: prev.comfortEnSeason === 'summer' ? 'winter' : 'summer',
        };
      }
      return {
        ...prev,
        [layerKey]: !prev[layerKey],
      };
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0c] text-[#f8fafc] overflow-hidden font-primary">
      {/* 3-Zone Top Bar */}
      <TopBar
        currentView={currentView}
        onChangeView={setCurrentView}
        chartType={chartType}
        onChangeChartType={setChartType}
        units={units}
        onToggleUnits={() => setUnits((prev) => (prev === 'SI' ? 'IP' : 'SI'))}
        pressure={atmosphere.pressure}
        altitude={atmosphere.altitude}
        onOpenAtmosphereModal={() => setIsAtmosphereModalOpen(true)}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenIdaeModal={() => setIsIdaeModalOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Workspace: Left Sidebar + Center Chart/Tables */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Controls: desktop sticky sidebar (collapsible) */}
        <div className="hidden lg:flex h-full shrink-0 transition-all duration-200">
          {isSidebarCollapsed ? (
            <div className="w-11 h-full flex flex-col items-center py-4 bg-[#1a1a1c] border-r border-white/10 select-none justify-between">
              <div className="flex flex-col items-center gap-6 w-full px-1">
                {/* Tab 1: Puntos Psicrométricos (Rotated 180 deg) */}
                <button
                  type="button"
                  onClick={() => {
                    setSidebarActiveTab('points');
                    setIsSidebarCollapsed(false);
                  }}
                  className={`p-1.5 w-full flex flex-col items-center gap-2 group cursor-pointer transition-colors rounded-xl ${
                    sidebarActiveTab === 'points'
                      ? 'bg-[#fbbf24]/15 border border-[#fbbf24]/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  title="Desplegar Puntos Psicrométricos"
                >
                  <ChevronRight className="w-4 h-4 text-[#fbbf24] group-hover:translate-x-0.5 transition-transform" />
                  <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 group-hover:text-[#fbbf24] py-1">
                    Puntos Psicrométricos ({points.length})
                  </span>
                </button>

                <div className="w-6 h-px bg-white/10" />

                {/* Tab 2: Plantillas y Arquetipos UTA (Rotated 180 deg) */}
                <button
                  type="button"
                  onClick={() => {
                    setSidebarActiveTab('archetypes');
                    setIsSidebarCollapsed(false);
                  }}
                  className={`p-1.5 w-full flex flex-col items-center gap-2 group cursor-pointer transition-colors rounded-xl ${
                    sidebarActiveTab === 'archetypes'
                      ? 'bg-[#fbbf24]/15 border border-[#fbbf24]/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  title="Desplegar Plantillas y Arquetipos de UTA"
                >
                  <LayoutTemplate className="w-4 h-4 text-[#fbbf24] group-hover:scale-110 transition-transform" />
                  <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 group-hover:text-[#fbbf24] py-1">
                    Plantillas UTA ({AHU_ARCHETYPES.length - 1})
                  </span>
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 pb-2">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse" title="Sistema activo" />
              </div>
            </div>
          ) : (
            <SidebarControls
              points={points}
              processes={updatedProcesses}
              selectedPointId={selectedPointId}
              onSelectPoint={setSelectedPointId}
              onAddPoint={handleAddPoint}
              onUpdatePoint={handleUpdatePoint}
              onDeletePoint={handleDeletePoint}
              onAddProcess={handleAddProcess}
              onDeleteProcess={handleDeleteProcess}
              pressure={atmosphere.pressure}
              units={units}
              layers={layers}
              onToggleLayer={handleToggleLayer}
              isolatedProcessInfo={isolatedProcessInfo}
              onSetIsolatedProcessInfo={setIsolatedProcessInfo}
              onToggleCollapse={() => setIsSidebarCollapsed(true)}
              activeTab={sidebarActiveTab}
              onTabChange={setSidebarActiveTab}
              onLoadArchetype={handleLoadArchetypeFromSidebar}
            />
          )}
        </div>

        {/* Dynamic Main Stage View with responsive padding for mobile bottom bar */}
        <main className="flex-1 h-full p-1.5 sm:p-2 pb-14 md:pb-2 overflow-hidden flex flex-col bg-[#0a0a0c]">
          {currentView === 'chart' && (
            <PsychrometricChart
              points={points}
              processes={updatedProcesses}
              selectedPointId={selectedPointId}
              onSelectPoint={setSelectedPointId}
              onUpdatePointCoordinates={handleUpdatePointCoordinates}
              onAddPointAtCoordinates={handleAddPointAtCoordinates}
              pressure={atmosphere.pressure}
              chartType={chartType}
              units={units}
              layers={layers}
              onToggleLayer={handleToggleLayer}
              isolatedProcessInfo={isolatedProcessInfo}
              onSetIsolatedProcessInfo={setIsolatedProcessInfo}
              onDeletePoint={handleDeletePoint}
              onDeleteProcess={handleDeleteProcess}
              onDuplicatePoint={(id) => {
                const src = points.find((p) => p.id === id);
                if (!src) return;
                const newPt = solveStatePoint({ mode: 'tdb_w', tdb: src.tdb + 1, w: src.w }, atmosphere.pressure, {
                  name: `${src.name} (Copia)`,
                  color: src.color,
                  massFlow: src.massFlow,
                });
                setPoints((prev) => [...prev, newPt]);
              }}
              onLocateModuleInAhu={(id) => {
                setCurrentView('schematic');
                setSelectedPointId(id);
              }}
              isSplitView={false}
            />
          )}

          {currentView === 'points' && (
            <PointsTable
              points={points}
              units={units}
              onSelectPoint={(id) => {
                setSelectedPointId(id);
                setCurrentView('chart');
              }}
              onDeletePoint={handleDeletePoint}
              onAddPoint={handleAddPoint}
              selectedPointId={selectedPointId}
            />
          )}

          {currentView === 'processes' && (
            <ProcessesTable
              processes={updatedProcesses}
              points={points}
              units={units}
              onDeleteProcess={handleDeleteProcess}
            />
          )}

          {currentView === 'comfort' && (
            <ComfortView
              points={points}
              processes={updatedProcesses}
              units={units}
              selectedPointId={selectedPointId}
              onSelectPoint={(id) => {
                setSelectedPointId(id);
              }}
              onApplyMixingRatio={(ratio) => {
                const mixingProcIndex = processes.findIndex((p) => p.type === 'mixing');
                if (mixingProcIndex >= 0) {
                  const updated = [...processes];
                  updated[mixingProcIndex] = { ...updated[mixingProcIndex], mixingRatio: ratio };
                  setProcesses(updated);
                }
              }}
              onOpenIdaeModal={() => setIsIdaeModalOpen(true)}
            />
          )}

          {currentView === 'schematic' && (
            <HVACSchematicViewer
              points={points}
              processes={updatedProcesses}
              selectedPointId={selectedPointId}
              onSelectPoint={setSelectedPointId}
              units={units}
              pressure={atmosphere.pressure}
              chartType={chartType}
              layers={layers}
              onUpdatePointCoordinates={handleUpdatePointCoordinates}
              onAddPointAtCoordinates={handleAddPointAtCoordinates}
              onUpdatePointsAndProcesses={(newPts, newProcs) => {
                setPoints(newPts);
                setProcesses(newProcs);
              }}
              onOpenIdaeModal={() => setIsIdaeModalOpen(true)}
              onNavigateToView={(v) => setCurrentView(v)}
              isolatedProcessInfo={isolatedProcessInfo}
              onSetIsolatedProcessInfo={setIsolatedProcessInfo}
              pendingArchetypeId={pendingArchetypeId}
              onClearPendingArchetype={() => setPendingArchetypeId(null)}
              onOpenArchetypesSidebar={() => {
                setSidebarActiveTab('archetypes');
                setIsSidebarCollapsed(false);
              }}
            />
          )}
        </main>

        {/* Floating button on smaller screens (< lg) to open Sidebar Controls */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden fixed bottom-18 md:bottom-5 left-3 z-30 px-3 py-2 rounded-full bg-[#1e293b]/95 border border-amber-400/40 text-amber-300 shadow-2xl flex items-center gap-1.5 text-xs font-bold backdrop-blur-md cursor-pointer touch-manipulation hover:bg-[#334155]"
          title="Abrir controles de puntos, procesos y capas"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Puntos & Capas</span>
        </button>

        {/* Mobile / Tablet Drawer for Sidebar Controls (< lg) */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm">
            <div className="w-88 max-w-[88vw] h-full flex flex-col bg-[#1a1a1c] shadow-2xl relative">
              <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/60 shrink-0">
                <span className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                  Puntos, Procesos & Capas
                </span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarControls
                  points={points}
                  processes={updatedProcesses}
                  selectedPointId={selectedPointId}
                  onSelectPoint={(id) => {
                    setSelectedPointId(id);
                    setIsMobileSidebarOpen(false);
                  }}
                  onAddPoint={handleAddPoint}
                  onUpdatePoint={handleUpdatePoint}
                  onDeletePoint={handleDeletePoint}
                  onAddProcess={handleAddProcess}
                  onDeleteProcess={handleDeleteProcess}
                  pressure={atmosphere.pressure}
                  units={units}
                  layers={layers}
                  onToggleLayer={handleToggleLayer}
                  isolatedProcessInfo={isolatedProcessInfo}
                  onSetIsolatedProcessInfo={setIsolatedProcessInfo}
                />
              </div>
            </div>
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden for smartphones and portrait tablets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0a0a0c]/95 border-t border-white/10 z-40 flex items-center justify-around px-2 backdrop-blur-xl touch-manipulation shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => setCurrentView('schematic')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer touch-manipulation ${
            currentView === 'schematic' ? 'text-[#fbbf24] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AirVent className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">UTA</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('chart');
            setChartType('carrier');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer touch-manipulation ${
            currentView === 'chart' && chartType === 'carrier' ? 'text-[#34d399] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Carta</span>
        </button>

        <button
          onClick={() => setCurrentView('points')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer touch-manipulation ${
            currentView === 'points' ? 'text-[#fb923c] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Puntos</span>
        </button>

        <button
          onClick={() => setCurrentView('processes')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer touch-manipulation ${
            currentView === 'processes' ? 'text-[#c084fc] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Procesos</span>
        </button>

        <button
          onClick={() => setCurrentView('comfort')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer touch-manipulation ${
            currentView === 'comfort' ? 'text-[#a3e635] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Confort</span>
        </button>
      </nav>

      {/* Modals */}
      <AtmosphereModal
        isOpen={isAtmosphereModalOpen}
        onClose={() => setIsAtmosphereModalOpen(false)}
        pressure={atmosphere.pressure}
        altitude={atmosphere.altitude}
        onChangeAtmosphere={handleUpdateAtmosphere}
      />

      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        points={points}
        processes={updatedProcesses}
        pressure={atmosphere.pressure}
        altitude={atmosphere.altitude}
        units={units}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        points={points}
        processes={updatedProcesses}
        atmosphere={atmosphere}
      />

      <IDAEComplianceModal
        isOpen={isIdaeModalOpen}
        onClose={() => setIsIdaeModalOpen(false)}
        points={points}
        processes={updatedProcesses}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
