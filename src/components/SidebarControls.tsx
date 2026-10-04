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
} from '../types/psychrometrics';
import {
  UnitConvert,
  solveStatePoint,
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
  activeTab?: 'points' | 'processes' | 'layers' | 'archetypes';
  onTabChange?: (tab: 'points' | 'processes' | 'layers' | 'archetypes') => void;
  onLoadArchetype?: (archetypeId: string) => void;
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
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'points' | 'processes' | 'layers' | 'archetypes'>('points');
  const currentTab = activeTabProp ?? internalActiveTab;
  const handleTabChange = (tab: 'points' | 'processes' | 'layers' | 'archetypes') => {
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

  const handleUpdateParameter = (key: 'tdb' | 'rh' | 'twb' | 'tdp' | 'w' | 'h', val: number) => {
    if (!selectedPoint) return;

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
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
              { key: 'volumeLines', label: 'Líneas de Volumen Específico (v)', color: 'text-indigo-400' },
              { key: 'processes', label: 'Vectores y Procesos HVAC', color: 'text-cyan-400' },
              { key: 'pointLabels', label: 'Etiquetas de Nombres de Puntos', color: 'text-slate-200' },
              { key: 'shrProtractor', label: 'Transportador ASHRAE (FCS / SHR y ADP)', color: 'text-amber-400' },
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
