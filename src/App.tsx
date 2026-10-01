import React, { useState, useMemo, useCallback } from 'react';
import {
  StatePoint,
  ProcessConnection,
  ProcessType,
  ChartType,
  ChartLayerVisibility,
  UnitSystem,
  AtmosphereConfig,
  PresetCycle,
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
import { HVACSchematicViewer } from './components/HVACSchematicViewer';
import { AtmosphereModal } from './components/AtmosphereModal';
import { PresetsModal } from './components/PresetsModal';
import { ExportModal } from './components/ExportModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { IDAEComplianceModal } from './components/IDAEComplianceModal';

export default function App() {
  // Navigation & View
  const [currentView, setCurrentView] = useState<'chart' | 'points' | 'processes' | 'comfort' | 'schematic'>('chart');
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
    shrProtractor: false,
    grid: true,
  });

  // Modals state
  const [isAtmosphereModalOpen, setIsAtmosphereModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isIdaeModalOpen, setIsIdaeModalOpen] = useState(false);

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
      />

      {/* Main Workspace: Left Sidebar + Center Chart/Tables */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
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
        />

        {/* Dynamic Main Stage View */}
        <main className="flex-1 h-full p-3 overflow-hidden flex flex-col bg-[#0a0a0c]">
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
              units={units}
              onSelectPoint={(id) => {
                setSelectedPointId(id);
                setCurrentView('chart');
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
            />
          )}
        </main>
      </div>

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
