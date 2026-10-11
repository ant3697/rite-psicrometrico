import React, { useState, useMemo } from 'react';
import { StatePoint, ProcessConnection, UnitSystem } from '../types/psychrometrics';
import { solveStatePoint, P_ATM_STANDARD } from '../utils/psychrolib';
import { calculateAirMixingStream } from '../utils/processEngine';
import {
  X,
  Shuffle,
  AlertTriangle,
  Wind,
  Check,
  PlusCircle,
  Activity,
  Layers,
  Sparkles,
  Info,
  Droplets,
} from 'lucide-react';

interface AirMixingModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: StatePoint[];
  pressure: number;
  units: UnitSystem;
  onApplyMixingProcess: (
    mixedPoint: StatePoint,
    procFromStream1: ProcessConnection,
    procFromStream2: ProcessConnection
  ) => void;
}

export const AirMixingModal: React.FC<AirMixingModalProps> = ({
  isOpen,
  onClose,
  points,
  pressure,
  units,
  onApplyMixingProcess,
}) => {
  if (!isOpen) return null;

  // Stream 1 (Typically Return Air / Retorno IDA)
  const [stream1PointId, setStream1PointId] = useState<string>(() => {
    const returnPt = points.find((p) => p.name.toLowerCase().includes('retorno') || p.name.includes('IDA'));
    return returnPt ? returnPt.id : points[1]?.id || points[0]?.id || 'custom';
  });
  const [s1CustomTdb, setS1CustomTdb] = useState<number>(24.0);
  const [s1CustomRh, setS1CustomRh] = useState<number>(50.0);
  const [s1Flow, setS1Flow] = useState<number>(3500);

  // Stream 2 (Typically Outdoor Air / Exterior ODA)
  const [stream2PointId, setStream2PointId] = useState<string>(() => {
    const outdoorPt = points.find((p) => p.name.toLowerCase().includes('exterior') || p.name.includes('ODA'));
    return outdoorPt ? outdoorPt.id : points[0]?.id || 'custom';
  });
  const [s2CustomTdb, setS2CustomTdb] = useState<number>(34.0);
  const [s2CustomRh, setS2CustomRh] = useState<number>(40.0);
  const [s2Flow, setS2Flow] = useState<number>(1500);

  const [mixedPointName, setMixedPointName] = useState<string>('Aire Mezcla Economizador (MA)');

  // Resolve points
  const activePt1 = points.find((p) => p.id === stream1PointId);
  const activePt2 = points.find((p) => p.id === stream2PointId);

  const solvedStream1 = useMemo<StatePoint>(() => {
    if (activePt1) return activePt1;
    return solveStatePoint(
      { mode: 'tdb_rh', tdb: s1CustomTdb, rh: s1CustomRh },
      pressure,
      {
        id: 'pt-s1-temp',
        name: 'Retorno Personalizado',
        color: '#10B981',
        volumeFlow: s1Flow,
      }
    );
  }, [activePt1, s1CustomTdb, s1CustomRh, s1Flow, pressure]);

  const solvedStream2 = useMemo<StatePoint>(() => {
    if (activePt2) return activePt2;
    return solveStatePoint(
      { mode: 'tdb_rh', tdb: s2CustomTdb, rh: s2CustomRh },
      pressure,
      {
        id: 'pt-s2-temp',
        name: 'Exterior Personalizado',
        color: '#06B6D4',
        volumeFlow: s2Flow,
      }
    );
  }, [activePt2, s2CustomTdb, s2CustomRh, s2Flow, pressure]);

  // Airflow rates
  const flow1 = activePt1?.volumeFlow && activePt1.volumeFlow > 0 ? activePt1.volumeFlow : s1Flow;
  const flow2 = activePt2?.volumeFlow && activePt2.volumeFlow > 0 ? activePt2.volumeFlow : s2Flow;

  // Total airflow
  const totalFlow = flow1 + flow2;
  const outdoorPercentage = totalFlow > 0 ? (flow2 / totalFlow) * 100 : 30;

  // Quick preset ratio updater
  const handleSetOutdoorRatio = (percent: number) => {
    const newTotal = totalFlow > 0 ? totalFlow : 5000;
    const newFlow2 = Math.round((percent / 100) * newTotal);
    const newFlow1 = newTotal - newFlow2;
    setS2Flow(newFlow2);
    setS1Flow(newFlow1);
  };

  // Thermodynamic mixing calculation
  const mixingResult = useMemo(() => {
    return calculateAirMixingStream(
      solvedStream1.tdb,
      solvedStream1.w,
      flow1,
      solvedStream2.tdb,
      solvedStream2.w,
      flow2,
      pressure
    );
  }, [solvedStream1, flow1, solvedStream2, flow2, pressure]);

  const handleApply = () => {
    const mixedPtId = `pt-mixed-${Date.now()}`;
    const mixedPoint = solveStatePoint(
      { mode: 'tdb_w', tdb: mixingResult.mixedTdb, w: mixingResult.mixedW },
      pressure,
      {
        id: mixedPtId,
        name: mixedPointName,
        color: '#F59E0B',
        volumeFlow: mixingResult.totalVolumeFlow,
        massFlow: mixingResult.totalMassFlow,
      }
    );

    // Process from Stream 1 (Return Air) to Mixed Point
    const proc1: ProcessConnection = {
      id: `proc-mix-1-${Date.now()}`,
      name: `Aporte ${solvedStream1.name.slice(0, 15)} → Mezcla`,
      type: 'mixing',
      fromPointId: solvedStream1.id,
      toPointId: mixedPtId,
      volumeFlow: flow1,
      massFlow: mixingResult.massFlow1,
      mixingRatio: mixingResult.massRatio1,
      qSensible: 0,
      qLatent: 0,
      qTotal: 0,
      moistureExchange: 0,
      shr: 1.0,
      color: '#F59E0B',
    };

    // Process from Stream 2 (Outdoor Air) to Mixed Point
    const proc2: ProcessConnection = {
      id: `proc-mix-2-${Date.now()}`,
      name: `Aporte ${solvedStream2.name.slice(0, 15)} → Mezcla`,
      type: 'mixing',
      fromPointId: solvedStream2.id,
      toPointId: mixedPtId,
      volumeFlow: flow2,
      massFlow: mixingResult.massFlow2,
      mixingRatio: mixingResult.massRatio2,
      qSensible: 0,
      qLatent: 0,
      qTotal: 0,
      moistureExchange: 0,
      shr: 1.0,
      color: '#F59E0B',
    };

    onApplyMixingProcess(mixedPoint, proc1, proc2);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#1e293b]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Calculadora y Mezclador de Corrientes de Aire</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OTS Feature D
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Balance psicrométrico estricto de masa y entalpía: Cámara de mezcla, economizador de aire exterior y detección de niebla
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Fogging supersaturation warning */}
          {mixingResult.isFogRisk ? (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/50 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <span>¡PELIGRO DE CONDENSACIÓN EN CÁMARA DE MEZCLA (NIEBLA / SUPERSATURACIÓN)!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/30 text-rose-200">
                    HR &gt; 100%
                  </span>
                </h4>
                <p className="text-xs text-rose-200/90 mt-1">
                  La línea recta de mezcla termodinámica atraviesa la zona de sobresaturación. Se condensarán microgotas de agua líquida
                  (niebla) en la cámara de mezcla a un ritmo de{' '}
                  <strong className="font-mono font-bold text-white">{mixingResult.fogMoistureRateKgH.toFixed(2)} kg/h</strong>,
                  mojando filtros y conductos. Se requiere precalentar el aire exterior (batería de precalentamiento o recuperador) según el RITE.
                </p>
              </div>
            </div>
          ) : mixingResult.isFreeCoolingViable ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-300">
                    Economizador Activo: Free-Cooling Directo Viable (RITE IT 1.2.4.5.1)
                  </h5>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    El aire exterior tiene menor entalpía que el retorno. La introducción de aire exterior alivia la carga de refrigeración mecánica.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-emerald-400 block font-medium">Ahorro Térmico Estimado</span>
                <span className="text-sm font-mono font-bold text-white">
                  {mixingResult.freeCoolingPotentialKw.toFixed(1)} kW
                </span>
              </div>
            </div>
          ) : null}

          {/* Interactive Flow Ratio Slider */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Repartición de Caudal / Porcentaje de Aire Exterior
                </span>
              </div>
              <div className="text-xs font-mono">
                <span className="text-cyan-400 font-bold">{mixingResult.volumeRatio2Percent.toFixed(0)}% Aire Exterior</span>
                <span className="text-slate-500 mx-1.5">/</span>
                <span className="text-emerald-400 font-bold">{(100 - mixingResult.volumeRatio2Percent).toFixed(0)}% Retorno</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={mixingResult.volumeRatio2Percent}
              onChange={(e) => handleSetOutdoorRatio(parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-700 h-2.5 rounded-lg cursor-pointer"
            />

            {/* Presets */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-500">Ajustes rápidos:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetOutdoorRatio(15)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                >
                  15% Mínimo Higiénico (IDA 2)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetOutdoorRatio(30)}
                  className="px-2.5 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-700 text-xs font-semibold"
                >
                  30% Estándar Oficinas
                </button>
                <button
                  type="button"
                  onClick={() => handleSetOutdoorRatio(50)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                >
                  50% Mixto
                </button>
                <button
                  type="button"
                  onClick={() => handleSetOutdoorRatio(100)}
                  className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-700 text-xs font-semibold"
                >
                  100% Free-Cooling Total
                </button>
              </div>
            </div>
          </div>

          {/* Two Streams Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stream 1 (Retorno) */}
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Corriente 1: Aire de Retorno (IDA)</span>
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {flow1.toLocaleString()} {units === 'SI' ? 'm³/h' : 'CFM'}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Seleccionar Punto Existente:</label>
                <select
                  value={stream1PointId}
                  onChange={(e) => setStream1PointId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.tdb.toFixed(1)}°C / {p.rh.toFixed(0)}% HR)
                    </option>
                  ))}
                  <option value="custom">-- Introducir valores personalizados --</option>
                </select>
              </div>

              {stream1PointId === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">T. Seca (°C)</label>
                    <input
                      type="number"
                      value={s1CustomTdb}
                      onChange={(e) => setS1CustomTdb(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">HR (%)</label>
                    <input
                      type="number"
                      value={s1CustomRh}
                      onChange={(e) => setS1CustomRh(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Caudal Corriente 1 (m³/h):</label>
                <input
                  type="number"
                  value={flow1}
                  onChange={(e) => setS1Flow(Math.max(0, parseFloat(e.target.value) || 0))}
                  step="100"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono p-2.5 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div>
                  <span className="text-slate-500 block">Tbs:</span>
                  <span className="text-white font-bold">{solvedStream1.tdb.toFixed(1)}°C</span>
                </div>
                <div>
                  <span className="text-slate-500 block">HR:</span>
                  <span className="text-white font-bold">{solvedStream1.rh.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Entalpía:</span>
                  <span className="text-white font-bold">{solvedStream1.h.toFixed(1)} kJ/kg</span>
                </div>
              </div>
            </div>

            {/* Stream 2 (Exterior) */}
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span>Corriente 2: Aire Exterior (ODA)</span>
                </h4>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {flow2.toLocaleString()} {units === 'SI' ? 'm³/h' : 'CFM'}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Seleccionar Punto Existente:</label>
                <select
                  value={stream2PointId}
                  onChange={(e) => setStream2PointId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.tdb.toFixed(1)}°C / {p.rh.toFixed(0)}% HR)
                    </option>
                  ))}
                  <option value="custom">-- Introducir valores personalizados --</option>
                </select>
              </div>

              {stream2PointId === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">T. Seca (°C)</label>
                    <input
                      type="number"
                      value={s2CustomTdb}
                      onChange={(e) => setS2CustomTdb(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">HR (%)</label>
                    <input
                      type="number"
                      value={s2CustomRh}
                      onChange={(e) => setS2CustomRh(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Caudal Corriente 2 (m³/h):</label>
                <input
                  type="number"
                  value={flow2}
                  onChange={(e) => setS2Flow(Math.max(0, parseFloat(e.target.value) || 0))}
                  step="100"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono p-2.5 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div>
                  <span className="text-slate-500 block">Tbs:</span>
                  <span className="text-white font-bold">{solvedStream2.tdb.toFixed(1)}°C</span>
                </div>
                <div>
                  <span className="text-slate-500 block">HR:</span>
                  <span className="text-white font-bold">{solvedStream2.rh.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Entalpía:</span>
                  <span className="text-white font-bold">{solvedStream2.h.toFixed(1)} kJ/kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mixed Air Result Card */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-amber-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Estado Termodinámico del Aire Resultante de la Mezcla (MA)</span>
              </h3>
              <div className="text-xs font-mono text-slate-300">
                Caudal Total: <strong className="text-amber-400">{mixingResult.totalVolumeFlow.toLocaleString()} m³/h</strong>{' '}
                ({mixingResult.totalMassFlow.toFixed(2)} kg/s)
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">T. Bulbo Seco</span>
                <span className="text-lg font-mono font-bold text-amber-300 mt-0.5 block">
                  {mixingResult.mixedTdb.toFixed(1)} °C
                </span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Humedad Relativa</span>
                <span className="text-lg font-mono font-bold text-cyan-300 mt-0.5 block">
                  {mixingResult.mixedRh.toFixed(1)} %
                </span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Humedad Absoluta</span>
                <span className="text-lg font-mono font-bold text-white mt-0.5 block">
                  {(mixingResult.mixedW * 1000).toFixed(2)} g/kg
                </span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Entalpía</span>
                <span className="text-lg font-mono font-bold text-white mt-0.5 block">
                  {mixingResult.mixedH.toFixed(1)} kJ/kg
                </span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">T. Bulbo Húmedo</span>
                <span className="text-lg font-mono font-bold text-slate-200 mt-0.5 block">
                  {mixingResult.mixedTwb.toFixed(1)} °C
                </span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">T. de Rocío</span>
                <span className="text-lg font-mono font-bold text-slate-200 mt-0.5 block">
                  {mixingResult.mixedTdp.toFixed(1)} °C
                </span>
              </div>
            </div>

            {/* Name input */}
            <div className="pt-2">
              <label className="block text-xs text-slate-400 mb-1 font-medium">Nombre del Punto Mezclado:</label>
              <input
                type="text"
                value={mixedPointName}
                onChange={(e) => setMixedPointName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#1e293b]/70 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400" />
            <span>
              Crea el punto intermedio en la recta entre ambas corrientes y enlaza los dos vectores de proceso
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Punto de Mezcla y Trazar Procesos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
