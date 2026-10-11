import React, { useState, useMemo } from 'react';
import {
  StatePoint,
  ProcessConnection,
  ProcessType,
  ChartLayerVisibility,
  UnitSystem,
  PsychroInputs,
  IsolatedProcessInfo,
  AHUModuleType,
  PsychroParamKey,
  OperatingCondition,
} from '../types/psychrometrics';
import {
  UnitConvert,
  solveStatePoint,
  solveConstrainedStatePoint,
  PARAM_LABELS_ES,
} from '../utils/psychrolib';
import {
  Plus,
  Trash2,
  Sliders,
  Layers,
  ArrowRight,
  Droplets,
  Flame,
  Wind,
  Shuffle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Target,
  LayoutTemplate,
  Search,
  Check,
  Pin,
  PinOff,
  Snowflake,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import { AHU_ARCHETYPES, AhuArchetype, getIdaeModuleTitle } from './HVACSchematicViewer';

interface SidebarControlsProps {
  points: StatePoint[];
  processes: ProcessConnection[];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onAddPoint: () => void;
  onUpdatePoint: (point: StatePoint) => void;
  onDeletePoint: (id: string) => void;
  onAddProcess: (fromId: string, toId: string, type: ProcessType) => void;
  onDeleteProcess: (id: string) => void;
  pressure: number;
  units: UnitSystem;
  layers: ChartLayerVisibility;
  onToggleLayer: (layerKey: keyof ChartLayerVisibility) => void;
  isolatedProcessInfo?: IsolatedProcessInfo | null;
  onSetIsolatedProcessInfo?: (info: IsolatedProcessInfo | null) => void;
  onToggleCollapse?: () => void;
  activeTab?: 'points' | 'processes' | 'layers' | 'archetypes' | 'scenarios';
  onTabChange?: (tab: 'points' | 'processes' | 'layers' | 'archetypes' | 'scenarios') => void;
  onLoadArchetype?: (archetypeId: string) => void;
  conditions?: OperatingCondition[];
  activeConditionId?: string;
  onSelectCondition?: (id: string) => void;
  onToggleOverlayCondition?: (id: string) => void;
  onOpenConditionsModal?: () => void;
  onUpdateProcessAirflow?: (id: string, flowM3h: number) => void;
  onOpenCoilModelerModal?: () => void;
  onOpenAirMixingModal?: () => void;
  onOpenShrModal?: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  points,
  processes,
  selectedPointId,
  onSelectPoint,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onAddProcess,
  onDeleteProcess,
  pressure,
  units,
  layers,
  onToggleLayer,
  isolatedProcessInfo,
  onSetIsolatedProcessInfo,
  onToggleCollapse,
  activeTab: activeTabProp,
  onTabChange,
  onLoadArchetype,
  conditions = [],
  activeConditionId,
  onSelectCondition,
  onToggleOverlayCondition,
  onOpenConditionsModal,
  onUpdateProcessAirflow,
  onOpenCoilModelerModal,
  onOpenAirMixingModal,
  onOpenShrModal,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'points' | 'processes' | 'layers' | 'archetypes' | 'scenarios'>('points');
  const currentTab = activeTabProp ?? internalActiveTab;
  const handleTabChange = (tab: 'points' | 'processes' | 'layers' | 'archetypes' | 'scenarios') => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const [archetypeSearch, setArchetypeSearch] = useState('');
  const [loadedArchetypeId, setLoadedArchetypeId] = useState<string | null>(null);

  const filteredArchetypes = useMemo(() => {
    const list = AHU_ARCHETYPES.filter((a) => a.id !== 'empty_canvas');
    if (!archetypeSearch.trim()) return list;
    const q = archetypeSearch.toLowerCase();
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [archetypeSearch]);

  // New process creation state
  const [newProcFrom, setNewProcFrom] = useState<string>('');
  const [newProcTo, setNewProcTo] = useState<string>('');
  const [newProcType, setNewProcType] = useState<ProcessType>('cooling_dehumid');

  const selectedPoint = points.find((p) => p.id === selectedPointId) || points[0] || null;

  // Input calculation mode for selected point
  const [inputMode, setInputMode] = useState<PsychroInputs['mode']>('tdb_rh');

  const handleToggleFixParam = (param: PsychroParamKey) => {
    if (!selectedPoint) return;
    const currentFixed = selectedPoint.fixedParams || [];
    const isAlreadyFixed = currentFixed.includes(param);
    let nextFixed: PsychroParamKey[];
    const nextValues = { ...(selectedPoint.fixedValues || {}) };

    if (isAlreadyFixed) {
      nextFixed = currentFixed.filter((k) => k !== param);
      delete nextValues[param];
    } else {
      if (currentFixed.length >= 2) {
        delete nextValues[currentFixed[0]];
        nextFixed = [currentFixed[1], param];
      } else {
        nextFixed = [...currentFixed, param];
      }
      nextValues[param] = param === 'w' ? selectedPoint.w : (selectedPoint as any)[param];
    }

    const updated: StatePoint = {
      ...selectedPoint,
      fixedParams: nextFixed,
      fixedValues: nextValues,
      isLocked: nextFixed.length >= 2,
    };
    onUpdatePoint(updated);
  };

  const handleClearFixedParams = () => {
    if (!selectedPoint) return;
    onUpdatePoint({
      ...selectedPoint,
      fixedParams: [],
      fixedValues: {},
      isLocked: false,
    });
  };

  const handleUpdateParameter = (key: 'tdb' | 'rh' | 'twb' | 'tdp' | 'w' | 'h', val: number) => {
    if (!selectedPoint) return;

    // If point has fixed parameters, solve respecting constraints
    if (selectedPoint.fixedParams && selectedPoint.fixedParams.length > 0) {
      const updated = solveConstrainedStatePoint(selectedPoint, key, val, pressure);
      onUpdatePoint(updated);
      return;
    }

    let inputs: PsychroInputs;

    if (inputMode === 'tdb_rh') {
      const tdb = key === 'tdb' ? val : selectedPoint.tdb;
      const rh = key === 'rh' ? val : selectedPoint.rh;
      inputs = { mode: 'tdb_rh', tdb, rh };
    } else if (inputMode === 'tdb_twb') {
      const tdb = key === 'tdb' ? val : selectedPoint.tdb;
      const twb = key === 'twb' ? val : selectedPoint.twb;
      inputs = { mode: 'tdb_twb', tdb, twb: Math.min(tdb, twb) };
    } else if (inputMode === 'tdb_tdp') {
      const tdb = key === 'tdb' ? val : selectedPoint.tdb;
      const tdp = key === 'tdp' ? val : selectedPoint.tdp;
      inputs = { mode: 'tdb_tdp', tdb, tdp: Math.min(tdb, tdp) };
    } else if (inputMode === 'tdb_w') {
      const tdb = key === 'tdb' ? val : selectedPoint.tdb;
      const w = key === 'w' ? val : selectedPoint.w;
      inputs = { mode: 'tdb_w', tdb, w };
    } else {
      const tdb = key === 'tdb' ? val : selectedPoint.tdb;
      const h = key === 'h' ? val : selectedPoint.h;
      inputs = { mode: 'tdb_h', tdb, h };
    }

    const updated = solveStatePoint(inputs, pressure, selectedPoint);
    onUpdatePoint(updated);
  };

  const handleCreateProcess = () => {
    if (!newProcFrom || !newProcTo || newProcFrom === newProcTo) return;
    onAddProcess(newProcFrom, newProcTo, newProcType);
  };

  return (
    <aside className="w-84 lg:w-96 h-full flex flex-col bg-[#1a1a1c] border-r border-[rgba(255,255,255,0.1)] shrink-0 select-none overflow-hidden font-primary">
      {/* Sidebar Tabs (tabs component from Design System) */}
      <div className="p-2 border-b border-[rgba(255,255,255,0.1)] bg-[#0a0a0c]/60 shrink-0 flex items-center gap-1.5">
        <div className="tabs-container flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => handleTabChange('points')}
            className={`tab-item flex-1 justify-center text-[12px] !px-1.5 ${
              currentTab === 'points' ? 'active' : ''
            }`}
          >
            Puntos ({points.length})
          </button>
          <button
            onClick={() => handleTabChange('processes')}
            className={`tab-item flex-1 justify-center text-[12px] !px-1.5 ${
              currentTab === 'processes' ? 'active' : ''
            }`}
          >
            Procesos ({processes.length})
          </button>
          <button
            onClick={() => handleTabChange('layers')}
            className={`tab-item flex-1 justify-center text-[12px] !px-1.5 ${
              currentTab === 'layers' ? 'active' : ''
            }`}
          >
            Capas
          </button>
          <button
            onClick={() => handleTabChange('archetypes')}
            className={`tab-item flex-1 justify-center text-[12px] !px-1.5 flex items-center gap-1 ${
              currentTab === 'archetypes' ? 'active' : ''
            }`}
            title="Plantillas y arquetipos canónicos de UTA (Guía IDAE / ATECYR)"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
            <span>Plantillas</span>
          </button>
          <button
            onClick={() => handleTabChange('scenarios')}
            className={`tab-item flex-1 justify-center text-[12px] !px-1.5 flex items-center gap-1 ${
              currentTab === 'scenarios' ? 'active' : ''
            }`}
            title="Escenarios y condiciones operativas (Día de diseño, carga parcial, invierno)"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Escenarios</span>
          </button>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#fbbf24] hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Plegar panel de puntos psicrométricos"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab 1: State Points & Selected Point Editor */}
      {currentTab === 'points' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Points List Header & Add Button */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] uppercase font-bold tracking-wider text-[#cbd5e1]">
              Puntos Psicrométricos
            </span>
            <button
              onClick={onAddPoint}
              className="btn-primary text-[12px] !py-1 !px-2.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Punto</span>
            </button>
          </div>

          {/* Quick list chips */}
          <div className="space-y-1.5">
            {points.map((pt) => {
              const isSelected = pt.id === selectedPoint?.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => onSelectPoint(pt.id)}
                  className={`p-2 rounded-[8px] cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#fbbf24]/15 border-[#fbbf24] text-white shadow-[0_0_12px_rgba(251,191,36,0.2)] ring-1 ring-[#fbbf24]/40'
                      : 'bg-[#0a0a0c]/50 border-[rgba(255,255,255,0.08)] text-[#cbd5e1] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.16)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: pt.color }}
                      />
                      <span className="text-xs font-semibold truncate">{pt.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tabular-nums text-cyan-300 shrink-0">
                      <span>{pt.tdb.toFixed(1)}°C</span>
                      <span className="text-slate-500 font-normal">|</span>
                      <span className="text-emerald-400 font-medium">{pt.rh.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8] mt-1 pl-4.5">
                    <span>w: {(pt.w * 1000).toFixed(1)} g/kg</span>
                    <span>h: {pt.h.toFixed(1)} kJ/kg</span>
                    <span>Q: {pt.volumeFlow || 3000} m³/h</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Point Detailed Editor */}
          {selectedPoint && (
            <div className="pt-3 border-t border-[rgba(255,255,255,0.1)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedPoint.color}
                    onChange={(e) =>
                      onUpdatePoint({ ...selectedPoint, color: e.target.value })
                    }
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    title="Color del punto"
                  />
                  <input
                    type="text"
                    value={selectedPoint.name}
                    onChange={(e) =>
                      onUpdatePoint({ ...selectedPoint, name: e.target.value })
                    }
                    className="input-pro !py-1 text-xs font-semibold text-white w-44"
                  />
                </div>
                {points.length > 1 && (
                  <button
                    onClick={() => onDeletePoint(selectedPoint.id)}
                    className="p-1 text-[#94a3b8] hover:text-[#ef4444] transition-colors"
                    title="Eliminar este punto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#cbd5e1]">
                  Definir estado termodinámico por:
                </label>
                <select
                  value={inputMode}
                  onChange={(e) => setInputMode(e.target.value as PsychroInputs['mode'])}
                  className="w-full input-pro text-xs text-[#f8fafc]"
                >
                  <option value="tdb_rh">T. Bulbo Seco (Tbs) + Humedad Relativa (HR)</option>
                  <option value="tdb_twb">T. Bulbo Seco (Tbs) + T. Bulbo Húmedo (Tbh)</option>
                  <option value="tdb_tdp">T. Bulbo Seco (Tbs) + T. Punto de Rocío (Tpr)</option>
                  <option value="tdb_w">T. Bulbo Seco (Tbs) + Humedad Específica (W)</option>
                  <option value="tdb_h">T. Bulbo Seco (Tbs) + Entalpía Específica (h)</option>
                </select>
              </div>

              {/* Interactive Sliders / Inputs based on mode */}
              <div className="space-y-2.5 bg-[#0a0a0c]/60 p-2.5 rounded-[8px] border border-[rgba(255,255,255,0.1)]">
                {/* Dry-Bulb Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94a3b8] font-medium">T. Bulbo Seco (Tbs)</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-10"
                        max="50"
                        step="0.5"
                        value={selectedPoint.tdb}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) handleUpdateParameter('tdb', val);
                        }}
                        className="w-16 h-5 px-1 py-0 text-right font-mono text-[11px] font-bold rounded bg-slate-950 border border-slate-700 text-[#fbbf24] focus:outline-none focus:border-[#fbbf24]"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">°C</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="50"
                    step="0.5"
                    value={selectedPoint.tdb}
                    onChange={(e) => handleUpdateParameter('tdb', parseFloat(e.target.value))}
                    className="w-full accent-[#fbbf24] cursor-pointer h-1.5 bg-[rgba(255,255,255,0.15)] rounded-lg"
                  />
                </div>

                {/* Secondary input based on mode */}
                {inputMode === 'tdb_rh' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8] font-medium">Humedad Relativa (HR)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="100"
                          step="1"
                          value={selectedPoint.rh}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleUpdateParameter('rh', val);
                          }}
                          className="w-16 h-5 px-1 py-0 text-right font-mono text-[11px] font-bold rounded bg-slate-950 border border-slate-700 text-[#a3e635] focus:outline-none focus:border-[#a3e635]"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={selectedPoint.rh}
                      onChange={(e) => handleUpdateParameter('rh', parseFloat(e.target.value))}
                      className="w-full accent-[#a3e635] cursor-pointer h-1.5 bg-[rgba(255,255,255,0.15)] rounded-lg"
                    />
                  </div>
                )}

                {inputMode === 'tdb_twb' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8] font-medium">T. Bulbo Húmedo (Tbh)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="-10"
                          max={selectedPoint.tdb}
                          step="0.5"
                          value={selectedPoint.twb}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleUpdateParameter('twb', val);
                          }}
                          className="w-16 h-5 px-1 py-0 text-right font-mono text-[11px] font-bold rounded bg-slate-950 border border-slate-700 text-[#93c5fd] focus:outline-none focus:border-[#93c5fd]"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">°C</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max={selectedPoint.tdb}
                      step="0.5"
                      value={selectedPoint.twb}
                      onChange={(e) => handleUpdateParameter('twb', parseFloat(e.target.value))}
                      className="w-full accent-[#93c5fd] cursor-pointer h-1.5 bg-[rgba(255,255,255,0.15)] rounded-lg"
                    />
                  </div>
                )}

                {inputMode === 'tdb_tdp' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8] font-medium">T. Punto Rocío (Tpr)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="-20"
                          max={selectedPoint.tdb}
                          step="0.5"
                          value={selectedPoint.tdp}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleUpdateParameter('tdp', val);
                          }}
                          className="w-16 h-5 px-1 py-0 text-right font-mono text-[11px] font-bold rounded bg-slate-950 border border-slate-700 text-[#c084fc] focus:outline-none focus:border-[#c084fc]"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">°C</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max={selectedPoint.tdb}
                      step="0.5"
                      value={selectedPoint.tdp}
                      onChange={(e) => handleUpdateParameter('tdp', parseFloat(e.target.value))}
                      className="w-full accent-[#c084fc] cursor-pointer h-1.5 bg-[rgba(255,255,255,0.15)] rounded-lg"
                    />
                  </div>
                )}

                {inputMode === 'tdb_w' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Humedad Específica (W)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.5"
                          max="30"
                          step="0.2"
                          value={parseFloat((selectedPoint.w * 1000).toFixed(2))}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleUpdateParameter('w', val / 1000);
                          }}
                          className="w-16 h-5 px-1 py-0 text-right font-mono text-[11px] font-bold rounded bg-slate-950 border border-slate-700 text-amber-400 focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-slate-500 font-mono">g/kg</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="30"
                      step="0.2"
                      value={selectedPoint.w * 1000}
                      onChange={(e) =>
                        handleUpdateParameter('w', parseFloat(e.target.value) / 1000)
                      }
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Air flow parameter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Caudal Volumétrico de Aire</span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {selectedPoint.volumeFlow} m³/h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={selectedPoint.volumeFlow}
                    onChange={(e) => {
                      const v = Math.max(10, parseFloat(e.target.value) || 1000);
                      const mDot = (v / 3600) * (1 / selectedPoint.v);
                      onUpdatePoint({
                        ...selectedPoint,
                        volumeFlow: v,
                        massFlow: mDot,
                      });
                    }}
                    className="w-full bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-white rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs text-slate-500 font-mono">
                    ({selectedPoint.massFlow.toFixed(2)} kg/s)
                  </span>
                </div>
              </div>

              {/* Pin / Fix Psychrometric Values Section */}
              <div className="space-y-2 bg-[#0a0a0c]/80 p-2.5 rounded-[8px] border border-[rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-amber-400" />
                    <span>Fijar Valores Psicrométricos</span>
                  </span>
                  {selectedPoint.fixedParams && selectedPoint.fixedParams.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFixedParams}
                      className="text-[9.5px] text-amber-300 hover:text-white underline font-semibold cursor-pointer"
                    >
                      Desfijar todos
                    </button>
                  )}
                </div>

                {selectedPoint.fixedParams && selectedPoint.fixedParams.length > 0 ? (
                  <div className="bg-amber-500/15 border border-amber-400/40 rounded px-2 py-1 text-[10px] text-amber-200 font-mono flex items-center justify-between">
                    <span>
                      <strong>{selectedPoint.fixedParams.length} fijado{selectedPoint.fixedParams.length > 1 ? 's' : ''}:</strong>{' '}
                      {selectedPoint.fixedParams.map((k) => PARAM_LABELS_ES[k]?.short).join(' y ')} (constante)
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Fija 1 o 2 variables (ej. <strong className="text-sky-300">w</strong> para procesos sensibles) para mantenerlas constantes al modificar otros parámetros.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {/* Humedad específica w */}
                  <button
                    type="button"
                    onClick={() => handleToggleFixParam('w')}
                    className={`px-2 py-1 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedPoint.fixedParams?.includes('w')
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm ring-1 ring-sky-400/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-sky-400/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Pin className={`w-2.5 h-2.5 ${selectedPoint.fixedParams?.includes('w') ? 'text-sky-400 fill-sky-400' : 'text-slate-500'}`} />
                      <span className="font-bold">w:</span>
                    </div>
                    <span className="text-[10px]">
                      {selectedPoint.fixedParams?.includes('w') ? 'FIJADO' : `${(selectedPoint.w * 1000).toFixed(1)} g/kg`}
                    </span>
                  </button>

                  {/* Tbs Bulbo seco */}
                  <button
                    type="button"
                    onClick={() => handleToggleFixParam('tdb')}
                    className={`px-2 py-1 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedPoint.fixedParams?.includes('tdb')
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm ring-1 ring-amber-400/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-amber-400/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Pin className={`w-2.5 h-2.5 ${selectedPoint.fixedParams?.includes('tdb') ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                      <span className="font-bold">Tbs:</span>
                    </div>
                    <span className="text-[10px]">
                      {selectedPoint.fixedParams?.includes('tdb') ? 'FIJADO' : `${selectedPoint.tdb.toFixed(1)} °C`}
                    </span>
                  </button>

                  {/* HR Humedad Relativa */}
                  <button
                    type="button"
                    onClick={() => handleToggleFixParam('rh')}
                    className={`px-2 py-1 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedPoint.fixedParams?.includes('rh')
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200 shadow-sm ring-1 ring-rose-400/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-rose-400/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Pin className={`w-2.5 h-2.5 ${selectedPoint.fixedParams?.includes('rh') ? 'text-rose-400 fill-rose-400' : 'text-slate-500'}`} />
                      <span className="font-bold">HR:</span>
                    </div>
                    <span className="text-[10px]">
                      {selectedPoint.fixedParams?.includes('rh') ? 'FIJADO' : `${selectedPoint.rh.toFixed(1)} %`}
                    </span>
                  </button>

                  {/* Entalpía h */}
                  <button
                    type="button"
                    onClick={() => handleToggleFixParam('h')}
                    className={`px-2 py-1 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedPoint.fixedParams?.includes('h')
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm ring-1 ring-emerald-400/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-emerald-400/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Pin className={`w-2.5 h-2.5 ${selectedPoint.fixedParams?.includes('h') ? 'text-emerald-400 fill-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-bold">h:</span>
                    </div>
                    <span className="text-[10px]">
                      {selectedPoint.fixedParams?.includes('h') ? 'FIJADO' : `${selectedPoint.h.toFixed(1)} kJ/kg`}
                    </span>
                  </button>

                  {/* Tbh Bulbo Húmedo */}
                  <button
                    type="button"
                    onClick={() => handleToggleFixParam('twb')}
                    className={`px-2 py-1 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedPoint.fixedParams?.includes('twb')
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-sm ring-1 ring-purple-400/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-purple-400/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Pin className={`w-2.5 h-2.5 ${selectedPoint.fixedParams?.includes('twb') ? 'text-purple-400 fill-purple-400' : 'text-slate-500'}`} />
                      <span className="font-bold">Tbh:</span>
                    </div>
                    <span className="text-[10px]">
                      {selectedPoint.fixedParams?.includes('twb') ? 'FIJADO' : `${selectedPoint.twb.toFixed(1)} °C`}
                    </span>
                  </button>

                  {/* Tpr Punto de Rocío */}
                  <button
                    type="button"
                    onClick={() => handleToggleFixParam('tdp')}
                    className={`px-2 py-1 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedPoint.fixedParams?.includes('tdp')
                        ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-sm ring-1 ring-teal-400/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-teal-400/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Pin className={`w-2.5 h-2.5 ${selectedPoint.fixedParams?.includes('tdp') ? 'text-teal-400 fill-teal-400' : 'text-slate-500'}`} />
                      <span className="font-bold">Tpr:</span>
                    </div>
                    <span className="text-[10px]">
                      {selectedPoint.fixedParams?.includes('tdp') ? 'FIJADO' : `${selectedPoint.tdp.toFixed(1)} °C`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Readout of all 8 calculated psychrometric variables */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Propiedades del Estado
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono tabular-nums">
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-center">
                    <div className="text-[9px] text-slate-400">Entalpía (h)</div>
                    <div className="font-bold text-rose-300 text-[11px]">
                      {selectedPoint.h.toFixed(1)} <span className="text-[8px] font-normal text-slate-500">kJ/kg</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-center">
                    <div className="text-[9px] text-slate-400">Volumen (v)</div>
                    <div className="font-bold text-sky-300 text-[11px]">
                      {selectedPoint.v.toFixed(3)} <span className="text-[8px] font-normal text-slate-500">m³/kg</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-center">
                    <div className="text-[9px] text-slate-400">Densidad (ρ)</div>
                    <div className="font-bold text-emerald-300 text-[11px]">
                      {selectedPoint.rho.toFixed(2)} <span className="text-[8px] font-normal text-slate-500">kg/m³</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-center">
                    <div className="text-[9px] text-slate-400">Pres. Vapor (Pv)</div>
                    <div className="font-bold text-amber-300 text-[11px]">
                      {selectedPoint.pv.toFixed(2)} <span className="text-[8px] font-normal text-slate-500">kPa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: HVAC Processes Builder */}
      {currentTab === 'processes' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* OTS Thermodynamic Modeler Tools (Features C, D & E) */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-300">
                Simuladores Termodinámicos OTS
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                OTS C, D & E
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {onOpenCoilModelerModal && (
                <button
                  type="button"
                  onClick={onOpenCoilModelerModal}
                  className="p-2.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1">
                    <Snowflake className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Batería & ADP</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Superficie, bypass (BF), condensados y riesgo de escarcha
                  </p>
                </button>
              )}

              {onOpenAirMixingModal && (
                <button
                  type="button"
                  onClick={onOpenAirMixingModal}
                  className="p-2.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 hover:border-amber-400 text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1">
                    <Shuffle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Mezcla Aire</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    2 corrientes, balance entálpico, niebla y free-cooling
                  </p>
                </button>
              )}

              {onOpenShrModal && (
                <button
                  type="button"
                  onClick={onOpenShrModal}
                  className="p-2.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/40 hover:border-purple-400 text-left transition-all group sm:col-span-1 col-span-2"
                >
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs mb-1">
                    <Target className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>SHR & Cargas</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Rectas RSHR/GSHR, cálculo de ADP y dimensionado
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* Create new process box */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-300">
              Crear Nuevo Proceso HVAC
            </span>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={newProcFrom}
                  onChange={(e) => setNewProcFrom(e.target.value)}
                  className="flex-1 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 rounded border border-slate-700"
                >
                  <option value="">Desde punto...</option>
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={newProcTo}
                  onChange={(e) => setNewProcTo(e.target.value)}
                  className="flex-1 input-pro text-xs text-[#f8fafc]"
                >
                  <option value="">Hacia punto...</option>
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={newProcType}
                onChange={(e) => setNewProcType(e.target.value as ProcessType)}
                className="w-full input-pro text-xs text-[#f8fafc]"
              >
                <option value="cooling_dehumid">Enfriamiento y Deshumectación (Batería fría)</option>
                <option value="sensible_heating">Calentamiento Sensible (Batería calor)</option>
                <option value="sensible_cooling">Enfriamiento Sensible</option>
                <option value="steam_humid">Humidificación con Vapor</option>
                <option value="adiabatic_humid">Humidificación Evaporativa Adiabática</option>
                <option value="mixing">Mezcla Adiabática de Caudales</option>
                <option value="zone_load">Carga Térmica del Local (SHR)</option>
              </select>

              <button
                onClick={handleCreateProcess}
                disabled={!newProcFrom || !newProcTo || newProcFrom === newProcTo}
                className="w-full btn-primary text-xs justify-center disabled:opacity-40 disabled:pointer-events-none"
              >
                Vincular Proceso
              </button>
            </div>
          </div>

          {/* Active Processes Cards */}
          <div className="space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-[#cbd5e1]">
              Transformaciones Activas
            </span>

            {processes.length === 0 ? (
              <p className="text-xs text-[#94a3b8] italic">No hay procesos definidos aún.</p>
            ) : (
              processes.map((proc) => {
                const ptFrom = points.find((p) => p.id === proc.fromPointId);
                const ptTo = points.find((p) => p.id === proc.toPointId);
                if (!ptFrom || !ptTo) return null;

                return (
                  <div
                    key={proc.id}
                    className="p-3 bg-[#0a0a0c]/80 rounded-[8px] border border-[rgba(255,255,255,0.1)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-[#f8fafc] truncate">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ptFrom.color }}
                        />
                        <span className="truncate">{ptFrom.name}</span>
                        <ArrowRight className="w-3 h-3 text-[#94a3b8] shrink-0" />
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ptTo.color }}
                        />
                        <span className="truncate">{ptTo.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (!onSetIsolatedProcessInfo) return;
                            const isIso =
                              isolatedProcessInfo?.processId === proc.id ||
                              isolatedProcessInfo?.process?.id === proc.id;
                            if (isIso) {
                              onSetIsolatedProcessInfo(null);
                            } else {
                              onSetIsolatedProcessInfo({
                                processId: proc.id,
                                moduleName: proc.name,
                                moduleType: proc.type,
                                isPassive: false,
                                entryPoint: ptFrom,
                                exitPoint: ptTo,
                                process: proc,
                                onClearIsolation: () => onSetIsolatedProcessInfo(null),
                              });
                            }
                          }}
                          className={`p-1 rounded transition-colors ${
                            isolatedProcessInfo?.processId === proc.id ||
                            isolatedProcessInfo?.process?.id === proc.id
                              ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-500/50'
                              : 'text-[#94a3b8] hover:text-cyan-400 hover:bg-white/5'
                          }`}
                          title={
                            isolatedProcessInfo?.processId === proc.id ||
                            isolatedProcessInfo?.process?.id === proc.id
                              ? 'Quitar aislamiento (Ver ciclo completo)'
                              : 'Aislar esta transformación en la carta psicrométrica'
                          }
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProcess(proc.id)}
                          className="text-[#94a3b8] hover:text-[#ef4444] transition-colors p-1 rounded hover:bg-white/5"
                          title="Eliminar transformación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#fbbf24] font-semibold">
                      {proc.name}
                    </div>

                    {/* Thermodynamic Process Metrics Grid */}
                    <div className="grid grid-cols-2 gap-1.5 font-mono tabular-nums text-[11px] pt-1 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400">Q Total: </span>
                        <span className="font-bold text-slate-200">
                          {Math.abs(proc.qTotal).toFixed(2)} kW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Q Sensible: </span>
                        <span className="text-orange-300">
                          {Math.abs(proc.qSensible).toFixed(2)} kW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Q Latente: </span>
                        <span className="text-blue-300">
                          {Math.abs(proc.qLatent).toFixed(2)} kW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">SHR: </span>
                        <span className="text-emerald-300">{proc.shr.toFixed(2)}</span>
                      </div>
                      {proc.moistureExchange !== 0 && (
                        <div className="col-span-2 text-slate-300">
                          <span className="text-slate-400">
                            {proc.moistureExchange < 0 ? 'Condensado: ' : 'Vapor aportado: '}
                          </span>
                          <span className="font-bold text-cyan-300">
                            {Math.abs(proc.moistureExchange).toFixed(2)} kg/h
                          </span>
                        </div>
                      )}
                      {proc.adp !== undefined && (
                        <div className="col-span-2 text-slate-300">
                          <span className="text-slate-400">Pto. Rocío Batería (ADP): </span>
                          <span className="font-bold text-indigo-300">
                            {proc.adp.toFixed(1)} °C
                          </span>
                          {proc.bypassFactor !== undefined && (
                            <span className="text-slate-400 ml-2">
                              (BF: {proc.bypassFactor.toFixed(2)})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Process Airflow Input & Conversion */}
                      <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-400">Caudal de Aire:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="100"
                            min="100"
                            max="50000"
                            defaultValue={Math.round(proc.volumeFlow || ptFrom.volumeFlow || 3000)}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0 && onUpdateProcessAirflow) {
                                onUpdateProcessAirflow(proc.id, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(val) && val > 0 && onUpdateProcessAirflow) {
                                  onUpdateProcessAirflow(proc.id, val);
                                }
                              }
                            }}
                            className="w-20 px-1.5 py-0.5 text-right bg-black border border-slate-700 rounded text-amber-300 font-mono font-bold text-[11px] focus:border-amber-400 focus:outline-none"
                            title="Modifica el caudal para recalcular potencias sensibles, latentes y totales"
                          />
                          <span className="text-slate-500 font-mono text-[10px]">{units === 'IP' ? 'CFM' : 'm³/h'}</span>
                        </div>
                      </div>

                      {/* Frost Risk Diagnostics */}
                      {proc.isFrostRisk && (
                        <div className="col-span-2 mt-1 p-2 rounded bg-rose-950/70 border border-rose-500/50 text-[11px] text-rose-200 flex items-start gap-1.5">
                          <Snowflake className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-bold text-rose-300">Riesgo de Escarcha (Frost Alert):</span>
                            <p className="text-[10px] text-rose-300/80 mt-0.5">
                              Superficie o ADP ≤ 0°C con deshumectación ({proc.frostRateKgH?.toFixed(2)} kg/h hielo). Requiere ciclo de desescarche o batería de precalentamiento (RITE IT 1.2.4.3).
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Scenarios & Operating Conditions (OTS Psychrochart Feature A) */}
      {currentTab === 'scenarios' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
              Escenarios de Operación
            </span>
            {onOpenConditionsModal && (
              <button
                type="button"
                onClick={onOpenConditionsModal}
                className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>Matriz Completa</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Alterna entre condiciones de cálculo o superponlas en el diagrama psicrométrico para comparar envolventes.
          </p>

          <div className="space-y-2.5">
            {conditions.map((cond) => {
              const isActive = cond.id === activeConditionId;
              return (
                <div
                  key={cond.id}
                  className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-black/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cond.color }}
                      />
                      <span className="font-bold text-white truncate max-w-[150px]">{cond.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onToggleOverlayCondition && (
                        <button
                          type="button"
                          onClick={() => onToggleOverlayCondition(cond.id)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            cond.isOverlayVisible
                              ? 'text-sky-300 bg-sky-500/20'
                              : 'text-slate-500 hover:text-white'
                          }`}
                          title={cond.isOverlayVisible ? 'Ocultar superposición en el gráfico' : 'Superponer en el gráfico'}
                        >
                          {cond.isOverlayVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {!isActive && onSelectCondition && (
                        <button
                          type="button"
                          onClick={() => onSelectCondition(cond.id)}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {cond.description || `${cond.points.length} puntos, ${cond.processes.length} procesos.`}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                    <span>Puntos: {cond.points.length} | Proc: {cond.processes.length}</span>
                    <span className="text-amber-400">Factor: {Math.round((cond.airflowMultiplier ?? 1) * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {onOpenConditionsModal && (
            <button
              type="button"
              onClick={onOpenConditionsModal}
              className="w-full btn-secondary text-xs justify-center gap-1.5 !text-amber-300 !border-amber-400/40 hover:!border-amber-400 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Ver Matriz Comparativa Energética</span>
            </button>
          )}
        </div>
      )}

      {/* Tab 3: Chart Layers & Visual Options */}
      {currentTab === 'layers' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Capas y Curvas Visibles
          </span>

          <div className="space-y-2">
            {[
              { key: 'rhCurves', label: 'Curvas de Humedad Relativa (10% - 90%)', color: 'text-sky-400' },
              { key: 'twbLines', label: 'Líneas de Bulbo Húmedo (Twb)', color: 'text-blue-400' },
              { key: 'enthalpyLines', label: 'Líneas de Entalpía Específica (h)', color: 'text-slate-300' },
              { key: 'satEnthalpyScale', label: 'Escala Perimetral de Entalpía de Saturación', color: 'text-emerald-400' },
              { key: 'volumeLines', label: 'Líneas de Volumen Específico (v)', color: 'text-indigo-400' },
              { key: 'enthalpyDeviations', label: 'Curvas de Desviación de Entalpía ASHRAE', color: 'text-amber-300' },
              { key: 'satTempScale', label: 'Graduaciones Temp. Saturación en Curva', color: 'text-cyan-300' },
              { key: 'shrProtractor', label: 'Transportador ASHRAE (FCS / SHR y ADP)', color: 'text-amber-400' },
              { key: 'allReferenceRays', label: 'Haz Completo de Líneas de Referencia ASHRAE (0.00 - 1.00)', color: 'text-amber-300' },
              { key: 'oversaturatedZone', label: 'Zona Supersaturada / Niebla (W > Wsat)', color: 'text-sky-300' },
              { key: 'shfScale', label: 'Escala Vertical FCS / SHR (Margen Derecho)', color: 'text-orange-400' },
              { key: 'processes', label: 'Vectores y Procesos HVAC', color: 'text-cyan-400' },
              { key: 'pointLabels', label: 'Etiquetas de Nombres de Puntos', color: 'text-slate-200' },
              { key: 'grid', label: 'Rejilla Ortogonal (Tbs / W)', color: 'text-slate-400' },
            ].map(({ key, label, color }) => {
              const active = layers[key as keyof ChartLayerVisibility];
              return (
                <label
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <span className={`text-xs font-medium ${color}`}>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(active)}
                    onChange={() => onToggleLayer(key as keyof ChartLayerVisibility)}
                    className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 accent-cyan-400 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>

          {/* Marco Europeo: UNE-EN ISO 7730 & UNE-EN 16798-1 */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-cyan-400">
                Marco Europeo: UNE-EN 16798-1 & ISO 7730
              </span>
            </div>

            {/* European Season selector */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] gap-1">
              <button
                type="button"
                onClick={() => {
                  if (layers.comfortEnSeason !== 'summer') onToggleLayer('comfortEnSeason' as any);
                }}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  layers.comfortEnSeason === 'summer'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verano (0.5 clo)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (layers.comfortEnSeason !== 'winter') onToggleLayer('comfortEnSeason' as any);
                }}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  layers.comfortEnSeason === 'winter'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Invierno (1.0 clo)
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                {
                  key: 'comfortEnCat1',
                  label: 'Cat. I - Alta exigencia (PPD < 6%, PMV ±0.2)',
                  badge: 'Hospitales / Niños',
                  color: 'text-purple-300',
                },
                {
                  key: 'comfortEnCat2',
                  label: 'Cat. II - Normal / RITE (PPD < 10%, PMV ±0.5)',
                  badge: 'Estándar Obra Nueva',
                  color: 'text-cyan-300',
                },
                {
                  key: 'comfortEnCat3',
                  label: 'Cat. III - Moderada (PPD < 15%, PMV ±0.7)',
                  badge: 'Edificios Existentes',
                  color: 'text-blue-300',
                },
              ].map(({ key, label, badge, color }) => {
                const active = layers[key as keyof ChartLayerVisibility];
                return (
                  <label
                    key={key}
                    className="flex flex-col p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${color}`}>{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(active)}
                        onChange={() => onToggleLayer(key as keyof ChartLayerVisibility)}
                        className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{badge}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Estándar Americano: ASHRAE 55 */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
              Estándar Americano: ASHRAE 55
            </span>
            <div className="space-y-1.5">
              {[
                { key: 'comfortSummer', label: 'ASHRAE 55 Verano (0.5 clo)', color: 'text-emerald-400' },
                { key: 'comfortWinter', label: 'ASHRAE 55 Invierno (1.0 clo)', color: 'text-amber-400' },
              ].map(({ key, label, color }) => {
                const active = layers[key as keyof ChartLayerVisibility];
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(active)}
                      onChange={() => onToggleLayer(key as keyof ChartLayerVisibility)}
                      className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 accent-cyan-400 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Normativa Española RITE y Confort Bioclimático */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-amber-400">
              RITE & Confort Bioclimático (Givoni)
            </span>
            <div className="space-y-1.5">
              {[
                { key: 'comfortRite', label: 'Zona Confort RITE Oficial (IT 1.1.4.1)', color: 'text-amber-400', badge: 'Verano: 23-25°C 45-60% · Invierno: 21-23°C 40-50%' },
                { key: 'comfortGivoni', label: 'Confort Bioclimático Givoni', color: 'text-emerald-300', badge: 'Envolvente pasiva y ventilación natural (20-27°C)' },
              ].map(({ key, label, color, badge }) => {
                const active = layers[key as keyof ChartLayerVisibility];
                return (
                  <label
                    key={key}
                    className="flex flex-col p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${color}`}>{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(active)}
                        onChange={() => onToggleLayer(key as keyof ChartLayerVisibility)}
                        className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{badge}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: UTA Archetypes & Templates */}
      {currentTab === 'archetypes' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] uppercase font-bold tracking-wider text-white flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Plantillas UTA (IDAE / ATECYR)</span>
              </span>
              <span className="text-[10px] font-mono text-[#fbbf24] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded border border-[#fbbf24]/20 font-semibold">
                {filteredArchetypes.length} canónicas
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Configuraciones estándar basadas en la Guía Técnica IDAE de Climatización. Haz clic para cargar en la máquina.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={archetypeSearch}
              onChange={(e) => setArchetypeSearch(e.target.value)}
              placeholder="Buscar por nombre, batería, ventilador..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a0a0c] border border-white/15 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#fbbf24] transition-colors"
            />
          </div>

          {/* List of Archetypes */}
          <div className="space-y-2">
            {filteredArchetypes.map((arch: AhuArchetype) => {
              const isJustLoaded = loadedArchetypeId === arch.id;
              return (
                <div
                  key={arch.id}
                  onClick={() => {
                    if (onLoadArchetype) {
                      onLoadArchetype(arch.id);
                      setLoadedArchetypeId(arch.id);
                      setTimeout(() => setLoadedArchetypeId(null), 2000);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 group ${
                    isJustLoaded
                      ? 'bg-emerald-950/40 border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-[#0a0a0c]/60 hover:bg-white/5 border-white/10 hover:border-[#fbbf24]/60 shadow-sm hover:shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-[#fbbf24] transition-colors leading-snug">
                      {arch.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#fbbf24] border border-[#fbbf24]/30 shrink-0 font-semibold">
                      {arch.moduleTypes.length} secciones
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {arch.description}
                  </p>

                  {/* Modules sequence tags */}
                  {arch.moduleTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {arch.moduleTypes.map((type: AHUModuleType, i: number) => (
                        <span
                          key={i}
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-300 border border-white/10"
                        >
                          {getIdaeModuleTitle({ type, id: '', name: type, enabled: true, pressureDropPa: 0, params: {} })}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                    <span className="text-slate-400 font-mono">
                      Guía IDAE / ATECYR
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      isJustLoaded ? 'text-emerald-400' : 'text-[#fbbf24] group-hover:translate-x-0.5 transition-transform'
                    }`}>
                      {isJustLoaded ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>¡Cargado en UTA!</span>
                        </>
                      ) : (
                        <>
                          <span>Cargar en máquina</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
