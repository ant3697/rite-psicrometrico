import React, { useState, useMemo } from 'react';
import { StatePoint, ProcessConnection, UnitSystem } from '../types/psychrometrics';
import { UnitConvert, solveStatePoint, P_ATM_STANDARD } from '../utils/psychrolib';
import { calculateCoilSimulation } from '../utils/processEngine';
import {
  X,
  Snowflake,
  AlertTriangle,
  Droplets,
  Wind,
  Flame,
  Check,
  ChevronRight,
  Info,
  Sliders,
  PlusCircle,
  Activity,
  Layers,
} from 'lucide-react';

interface CoilModelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: StatePoint[];
  pressure: number;
  units: UnitSystem;
  onApplyCoilProcess: (newPoint: StatePoint, newProcess: ProcessConnection) => void;
}

export const CoilModelerModal: React.FC<CoilModelerModalProps> = ({
  isOpen,
  onClose,
  points,
  pressure,
  units,
  onApplyCoilProcess,
}) => {
  if (!isOpen) return null;

  // Selected or custom inlet point
  const [selectedPointId, setSelectedPointId] = useState<string>(() => {
    // Pick first point or default
    return points[0]?.id || 'custom';
  });

  const activeInletPoint = points.find((p) => p.id === selectedPointId);

  const [customTdb, setCustomTdb] = useState<number>(30.0);
  const [customRh, setCustomRh] = useState<number>(50.0);
  const [customFlow, setCustomFlow] = useState<number>(3500);

  // Inlet values (either from chosen point or manual)
  const inletTdb = activeInletPoint ? activeInletPoint.tdb : customTdb;
  const inletRh = activeInletPoint ? activeInletPoint.rh : customRh;
  const inletW = activeInletPoint ? activeInletPoint.w : 0.013;
  const inletFlow = activeInletPoint ? activeInletPoint.volumeFlow || 3500 : customFlow;

  // Coil parameters
  const [coilSurfaceTemp, setCoilSurfaceTemp] = useState<number>(10.0); // °C (ADP)
  const [bypassFactor, setBypassFactor] = useState<number>(0.10); // BF
  const [coilName, setCoilName] = useState<string>('Batería Fría (CC)');

  // Solve inlet state
  const solvedInlet = useMemo<StatePoint>(() => {
    if (activeInletPoint) return activeInletPoint;
    return solveStatePoint(
      { mode: 'tdb_rh', tdb: inletTdb, rh: inletRh },
      pressure,
      {
        id: 'pt-inlet-temp',
        name: 'Aire Entrada Batería',
        color: '#06B6D4',
        volumeFlow: customFlow,
      }
    );
  }, [activeInletPoint, inletTdb, inletRh, customFlow, pressure]);

  // Compute coil simulation result using OTS psychrometric model
  const simulation = useMemo(() => {
    return calculateCoilSimulation(
      solvedInlet.tdb,
      solvedInlet.w,
      inletFlow,
      coilSurfaceTemp,
      bypassFactor,
      pressure
    );
  }, [solvedInlet, inletFlow, coilSurfaceTemp, bypassFactor, pressure]);

  // Handle preset row buttons (typical bypass factors)
  const handleSetRows = (rows: number) => {
    switch (rows) {
      case 2:
        setBypassFactor(0.25);
        break;
      case 4:
        setBypassFactor(0.15);
        break;
      case 6:
        setBypassFactor(0.08);
        break;
      case 8:
        setBypassFactor(0.04);
        break;
      default:
        setBypassFactor(0.10);
    }
  };

  const handleApply = () => {
    const exitPtId = `pt-coil-exit-${Date.now()}`;
    const exitPoint = solveStatePoint(
      { mode: 'tdb_w', tdb: simulation.exitTdb, w: simulation.exitW },
      pressure,
      {
        id: exitPtId,
        name: `${coilName} - Salida`,
        color: simulation.isFrostRisk ? '#06B6D4' : '#0284C7',
        volumeFlow: inletFlow,
        massFlow: simulation.massFlowKgS,
      }
    );

    const newProc: ProcessConnection = {
      id: `proc-coil-${Date.now()}`,
      name: coilName,
      type: simulation.isSensibleOnly ? 'sensible_cooling' : 'cooling_dehumid',
      fromPointId: solvedInlet.id,
      toPointId: exitPtId,
      volumeFlow: inletFlow,
      massFlow: simulation.massFlowKgS,
      adp: simulation.adp,
      bypassFactor: simulation.bypassFactor,
      qSensible: -simulation.qSensibleKw,
      qLatent: -simulation.qLatentKw,
      qTotal: -simulation.qTotalKw,
      moistureExchange: -simulation.condensateRateKgH,
      shr: simulation.shr,
      isFrostRisk: simulation.isFrostRisk,
      frostRateKgH: simulation.frostRateKgH,
      color: simulation.isFrostRisk ? '#06B6D4' : '#0284C7',
    };

    onApplyCoilProcess(exitPoint, newProc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#1e293b]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Snowflake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Simulador de Batería Fría y Punto de Rocío del Aparato (ADP)</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  OTS Feature C
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modelo termodinámico ASHRAE: Temperatura superficial de batería, Factor By-Pass (BF), deshumectación y alerta de escarcha
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
          {/* Status Diagnostic Banner */}
          {simulation.isFrostRisk ? (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/50 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <span>¡ALERTA CRÍTICA DE ESCARCHA / CONGELACIÓN (FROST RISK)!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/30 text-rose-200">
                    RITE IT 1.2.4.3
                  </span>
                </h4>
                <p className="text-xs text-rose-200/90 mt-1">
                  La temperatura superficial de la batería (ADP = <span className="font-mono font-bold">{simulation.adp.toFixed(1)}°C</span>)
                  opera por debajo de 0°C mientras condensa humedad. La humedad condensada formará hielo en las aletas a una tasa de{' '}
                  <strong className="font-mono font-bold">{simulation.frostRateKgH.toFixed(2)} kg/h</strong>.
                  Se recomienda prever desescarche por inversión de ciclo o gas caliente, con una potencia térmica de desescarche de al menos{' '}
                  <strong className="font-mono font-bold">{simulation.defrostHeatingLoadKw?.toFixed(1)} kW</strong>.
                </p>
              </div>
            </div>
          ) : simulation.isSensibleOnly ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <p className="text-xs text-emerald-200/90">
                <strong>Enfriamiento puramente sensible (SHR = 1.000):</strong> La superficie de la batería ({simulation.adp.toFixed(1)}°C)
                está por encima del punto de rocío del aire entrante ({solvedInlet.tdp.toFixed(1)}°C).
                No hay condensación ni deshumectación; el proceso avanza horizontalmente a humedad absoluta constante.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <p className="text-xs text-cyan-200/90">
                <strong>Enfriamiento con deshumectación activa (SHR = {simulation.shr.toFixed(3)}):</strong> La superficie de la batería está por
                debajo del punto de rocío ({solvedInlet.tdp.toFixed(1)}°C). El aire condensa humedad y su estado evoluciona proyectándose
                hacia el Punto de Rocío del Aparato en saturación (ADP = {simulation.adp.toFixed(1)}°C).
              </p>
            </div>
          )}

          {/* Grid Layout: Config Column & Results Column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Configuration Inputs (5 cols) */}
            <div className="lg:col-span-5 space-y-5 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>1. Estado del Aire a la Entrada</span>
              </h3>

              {/* Point selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Punto de Aire Entrante:</label>
                <select
                  value={selectedPointId}
                  onChange={(e) => setSelectedPointId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.tdb.toFixed(1)}°C / {p.rh.toFixed(0)}% HR)
                    </option>
                  ))}
                  <option value="custom">-- Introducir valores personalizados --</option>
                </select>
              </div>

              {selectedPointId === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">T. Seca Entrada (°C)</label>
                    <input
                      type="number"
                      value={customTdb}
                      onChange={(e) => setCustomTdb(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">HR Entrada (%)</label>
                    <input
                      type="number"
                      value={customRh}
                      onChange={(e) => setCustomRh(parseFloat(e.target.value) || 0)}
                      min="1"
                      max="100"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Airflow input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400 font-medium">Caudal Volumétrico de Aire:</label>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {inletFlow.toLocaleString()} {units === 'SI' ? 'm³/h' : 'CFM'}
                  </span>
                </div>
                <input
                  type="number"
                  value={inletFlow}
                  onChange={(e) => setCustomFlow(Math.max(10, parseFloat(e.target.value) || 0))}
                  step="100"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
                  <span>Flujo másico seco: {simulation.massFlowKgS.toFixed(2)} kg/s</span>
                  <span>T. Rocío entrada: {solvedInlet.tdp.toFixed(1)}°C</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-3">
                  <Snowflake className="w-4 h-4" />
                  <span>2. Parámetros de la Batería Fría</span>
                </h3>

                {/* Coil Surface Temperature / ADP */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                      <span>Temp. Superficial / ADP:</span>
                      {coilSurfaceTemp <= 0 && (
                        <span className="text-[10px] font-bold text-rose-400">¡Bajo Cero!</span>
                      )}
                    </label>
                    <span
                      className={`text-sm font-mono font-bold ${
                        coilSurfaceTemp <= 0 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
                      }`}
                    >
                      {coilSurfaceTemp.toFixed(1)} °C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="22"
                    step="0.5"
                    value={coilSurfaceTemp}
                    onChange={(e) => setCoilSurfaceTemp(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span className="text-rose-400">-10°C (Escarcha)</span>
                    <span>0°C</span>
                    <span className="text-cyan-300">+7°C (Agua 7/12°C)</span>
                    <span>+22°C</span>
                  </div>
                </div>

                {/* Bypass Factor (BF) */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium">Factor de By-Pass (BF):</label>
                    <div className="text-xs font-mono text-right">
                      <span className="font-bold text-cyan-300">{bypassFactor.toFixed(2)}</span>
                      <span className="text-slate-500 ml-1.5">(CF = {simulation.contactFactor.toFixed(2)})</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.40"
                    step="0.01"
                    value={bypassFactor}
                    onChange={(e) => setBypassFactor(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                  />

                  {/* Preset rows */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">Filas de tubo:</span>
                    <button
                      type="button"
                      onClick={() => handleSetRows(2)}
                      className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      2 filas (0.25)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetRows(4)}
                      className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      4 filas (0.15)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetRows(6)}
                      className="px-2 py-0.5 text-[10px] rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700"
                    >
                      6 filas (0.08)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetRows(8)}
                      className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      8 filas (0.04)
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="mt-4">
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Nombre del Proceso:</label>
                  <input
                    type="text"
                    value={coilName}
                    onChange={(e) => setCoilName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Right: Results, Coil Performance & Air Exit State (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Thermal Capacities Card */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4" />
                  <span>Potencias Térmicas y Balance de Batería</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Potencia Total</div>
                    <div className="text-lg font-mono font-bold text-white mt-0.5">
                      {simulation.qTotalKw.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {(simulation.qTotalKw * 860).toFixed(0)} kcal/h
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <div className="text-[10px] text-amber-400 uppercase font-medium">Sensible (Qs)</div>
                    <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
                      {simulation.qSensibleKw.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span>
                    </div>
                    <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                      ΔT: {(solvedInlet.tdb - simulation.exitTdb).toFixed(1)} °C
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <div className="text-[10px] text-sky-400 uppercase font-medium">Latente (Ql)</div>
                    <div className="text-lg font-mono font-bold text-sky-300 mt-0.5">
                      {simulation.qLatentKw.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span>
                    </div>
                    <div className="text-[10px] text-sky-400/80 font-mono mt-0.5">
                      SHR: {simulation.shr.toFixed(3)}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      simulation.isFrostRisk
                        ? 'bg-rose-500/10 border-rose-500/40'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-medium flex items-center justify-between">
                      <span className={simulation.isFrostRisk ? 'text-rose-400' : 'text-cyan-400'}>
                        {simulation.isFrostRisk ? 'Escarcha (Hielo)' : 'Condensados'}
                      </span>
                    </div>
                    <div
                      className={`text-lg font-mono font-bold mt-0.5 ${
                        simulation.isFrostRisk ? 'text-rose-400' : 'text-cyan-300'
                      }`}
                    >
                      {simulation.isFrostRisk
                        ? simulation.frostRateKgH.toFixed(2)
                        : simulation.condensateRateKgH.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-400">kg/h</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {simulation.isFrostRisk ? 'P. Desescarche' : 'Drenaje bandeja'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaving Air State Card */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
                  <Wind className="w-4 h-4" />
                  <span>Estado Psicrométrico del Aire de Salida</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
                    <span className="text-[11px] text-slate-400 block">T. Bulbo Seco (Tbs):</span>
                    <span className="text-base font-mono font-bold text-white">
                      {simulation.exitTdb.toFixed(1)} °C
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
                    <span className="text-[11px] text-slate-400 block">Humedad Relativa (HR):</span>
                    <span className="text-base font-mono font-bold text-cyan-300">
                      {simulation.exitRh.toFixed(1)} %
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
                    <span className="text-[11px] text-slate-400 block">Humedad Absoluta (w):</span>
                    <span className="text-base font-mono font-bold text-slate-200">
                      {(simulation.exitW * 1000).toFixed(2)} g/kg
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
                    <span className="text-[11px] text-slate-400 block">T. Bulbo Húmedo (Tbh):</span>
                    <span className="text-base font-mono font-bold text-slate-200">
                      {simulation.exitTwb.toFixed(1)} °C
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
                    <span className="text-[11px] text-slate-400 block">T. de Rocío (Tdp):</span>
                    <span className="text-base font-mono font-bold text-slate-200">
                      {simulation.exitTdp.toFixed(1)} °C
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
                    <span className="text-[11px] text-slate-400 block">Entalpía Específica (h):</span>
                    <span className="text-base font-mono font-bold text-slate-200">
                      {simulation.exitEnthalpy.toFixed(1)} kJ/kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Apparatus Dew Point (ADP) Summary Box */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>Punto de Rocío del Aparato (ADP) en Saturación:</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    T_adp = <strong className="text-white font-mono">{simulation.adp.toFixed(1)} °C</strong> · w_adp ={' '}
                    <strong className="text-white font-mono">{(simulation.wAdp * 1000).toFixed(2)} g/kg</strong> · h_adp ={' '}
                    <strong className="text-white font-mono">{simulation.hAdp.toFixed(1)} kJ/kg</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Eficiencia Contacto</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {(simulation.contactFactor * 100).toFixed(1)} %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#1e293b]/70 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>
              Inserta automáticamente el punto resultante y traza la recta hacia el ADP en el gráfico
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Aplicar Batería al Proyecto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
