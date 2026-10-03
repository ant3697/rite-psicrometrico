import React, { useState } from 'react';
import {
  StatePoint,
  ProcessConnection,
  ProcessType,
  ChartLayerVisibility,
  UnitSystem,
  PsychroInputs,
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
} from 'lucide-react';

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
}) => {
  const [activeTab, setActiveTab] = useState<'points' | 'processes' | 'layers'>('points');

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
      <div className="p-2 border-b border-[rgba(255,255,255,0.1)] bg-[#0a0a0c]/60 shrink-0">
        <div className="tabs-container w-full">
          <button
            onClick={() => setActiveTab('points')}
            className={`tab-item flex-1 justify-center text-[13px] ${
              activeTab === 'points' ? 'active' : ''
            }`}
          >
            Puntos ({points.length})
          </button>
          <button
            onClick={() => setActiveTab('processes')}
            className={`tab-item flex-1 justify-center text-[13px] ${
              activeTab === 'processes' ? 'active' : ''
            }`}
          >
            Procesos ({processes.length})
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`tab-item flex-1 justify-center text-[13px] ${
              activeTab === 'layers' ? 'active' : ''
            }`}
          >
            Capas
          </button>
        </div>
      </div>

      {/* Tab 1: State Points & Selected Point Editor */}
      {activeTab === 'points' && (
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
              <div className="space-y-3 bg-[#0a0a0c]/60 p-3 rounded-[8px] border border-[rgba(255,255,255,0.1)]">
                {/* Dry-Bulb Input */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#94a3b8]">T. Bulbo Seco (Tbs)</span>
                    <span className="font-mono text-[#fbbf24] font-bold">
                      {selectedPoint.tdb.toFixed(1)} °C
                    </span>
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
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94a3b8]">Humedad Relativa (HR)</span>
                      <span className="font-mono text-[#a3e635] font-bold">
                        {selectedPoint.rh.toFixed(1)} %
                      </span>
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
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94a3b8]">T. Bulbo Húmedo (Tbh)</span>
                      <span className="font-mono text-[#93c5fd] font-bold">
                        {selectedPoint.twb.toFixed(1)} °C
                      </span>
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
                    <div className="flex justify-between text-xs">
                      <span className="text-[#94a3b8]">T. Punto Rocío (Tpr)</span>
                      <span className="font-mono text-[#c084fc] font-bold">
                        {selectedPoint.tdp.toFixed(1)} °C
                      </span>
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
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Humedad Específica (W)</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {(selectedPoint.w * 1000).toFixed(2)} g/kg
                      </span>
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
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">
                  Propiedades del Estado
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">Entalpía (h)</div>
                    <div className="font-bold text-rose-300">
                      {selectedPoint.h.toFixed(1)} kJ/kg
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">Volumen Esp. (v)</div>
                    <div className="font-bold text-sky-300">
                      {selectedPoint.v.toFixed(3)} m³/kg
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">Densidad (ρ)</div>
                    <div className="font-bold text-emerald-300">
                      {selectedPoint.rho.toFixed(3)} kg/m³
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">Presión Vapor (Pv)</div>
                    <div className="font-bold text-amber-300">
                      {selectedPoint.pv.toFixed(3)} kPa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: HVAC Processes Builder */}
      {activeTab === 'processes' && (
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
                      <button
                        onClick={() => onDeleteProcess(proc.id)}
                        className="text-[#94a3b8] hover:text-[#ef4444] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
      {activeTab === 'layers' && (
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
    </aside>
  );
};
