import React, { useState, useMemo } from 'react';
import { StatePoint, ProcessConnection, UnitSystem } from '../types/psychrometrics';
import { solveStatePoint, P_ATM_STANDARD } from '../utils/psychrolib';
import { calculateShrCoilSizing, calculateProcessMetrics } from '../utils/processEngine';
import {
  X,
  Target,
  Sliders,
  Wind,
  Snowflake,
  Flame,
  Check,
  PlusCircle,
  Activity,
  Layers,
  Info,
  Droplets,
  Mountain,
  Sparkles,
} from 'lucide-react';

interface ShrCoilSizingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pressure: number;
  altitude: number;
  units: UnitSystem;
  onApplyShrCycle: (newPoints: StatePoint[], newProcesses: ProcessConnection[]) => void;
}

export const ShrCoilSizingModal: React.FC<ShrCoilSizingModalProps> = ({
  isOpen,
  onClose,
  pressure,
  altitude,
  units,
  onApplyShrCycle,
}) => {
  if (!isOpen) return null;

  // Thermal Loads in kW
  const [sensibleLoadKw, setSensibleLoadKw] = useState<number>(30.0);
  const [latentLoadKw, setLatentLoadKw] = useState<number>(8.0);

  // Room design state
  const [roomTdb, setRoomTdb] = useState<number>(24.0);
  const [roomRh, setRoomRh] = useState<number>(50.0);

  // Outdoor ventilation state
  const [outdoorTdb, setOutdoorTdb] = useState<number>(35.0);
  const [outdoorRh, setOutdoorRh] = useState<number>(40.0);
  const [outdoorAirPercent, setOutdoorAirPercent] = useState<number>(25.0); // 25% OA

  // Coil Bypass Factor
  const [bypassFactor, setBypassFactor] = useState<number>(0.10);

  // Cycle project naming
  const [cycleName, setCycleName] = useState<string>('Ciclo Climatización por SHR y ADP');

  // Compute thermodynamic SHR sizing
  const sizing = useMemo(() => {
    return calculateShrCoilSizing(
      roomTdb,
      roomRh,
      sensibleLoadKw,
      latentLoadKw,
      outdoorTdb,
      outdoorRh,
      outdoorAirPercent / 100,
      bypassFactor,
      pressure
    );
  }, [
    roomTdb,
    roomRh,
    sensibleLoadKw,
    latentLoadKw,
    outdoorTdb,
    outdoorRh,
    outdoorAirPercent,
    bypassFactor,
    pressure,
  ]);

  // Handle Preset Load Archetypes
  const handleSetPresetLoad = (sensible: number, latent: number) => {
    setSensibleLoadKw(sensible);
    setLatentLoadKw(latent);
  };

  const handleApply = () => {
    const timestamp = Date.now();
    const idOda = `pt-shr-oda-${timestamp}`;
    const idIda = `pt-shr-ida-${timestamp}`;
    const idMix = `pt-shr-mix-${timestamp}`;
    const idSup = `pt-shr-sup-${timestamp}`;

    // 1. Exterior ODA
    const ptOda = solveStatePoint(
      { mode: 'tdb_w', tdb: sizing.outdoorTdb, w: sizing.outdoorW },
      pressure,
      {
        id: idOda,
        name: '1. Exterior ODA',
        color: '#EF4444',
        volumeFlow: Math.round(sizing.requiredAirflowM3h * (outdoorAirPercent / 100)),
        massFlow: Number((sizing.requiredMassFlowKgS * (outdoorAirPercent / 100)).toFixed(3)),
      }
    );

    // 2. Retorno IDA (Local)
    const ptIda = solveStatePoint(
      { mode: 'tdb_w', tdb: sizing.roomTdb, w: sizing.roomW },
      pressure,
      {
        id: idIda,
        name: '2. Retorno Local IDA',
        color: '#10B981',
        volumeFlow: Math.round(sizing.requiredAirflowM3h * (1 - outdoorAirPercent / 100)),
        massFlow: Number((sizing.requiredMassFlowKgS * (1 - outdoorAirPercent / 100)).toFixed(3)),
      }
    );

    // 3. Mezcla MA
    const ptMix = solveStatePoint(
      { mode: 'tdb_w', tdb: sizing.mixedTdb, w: sizing.mixedW },
      pressure,
      {
        id: idMix,
        name: '3. Mezcla Aire MA',
        color: '#F59E0B',
        volumeFlow: sizing.requiredAirflowM3h,
        massFlow: sizing.requiredMassFlowKgS,
      }
    );

    // 4. Impulsión Batería SUP
    const ptSup = solveStatePoint(
      { mode: 'tdb_w', tdb: sizing.supplyTdb, w: sizing.supplyW },
      pressure,
      {
        id: idSup,
        name: '4. Impulsión Batería SUP',
        color: '#06B6D4',
        volumeFlow: sizing.requiredAirflowM3h,
        massFlow: sizing.requiredMassFlowKgS,
      }
    );

    // Processes
    // Proc 1: Mezcla Retorno -> Mezcla
    const procMixRa: ProcessConnection = {
      id: `proc-mix-ra-${timestamp}`,
      name: 'Aporte Retorno → Mezcla',
      type: 'mixing',
      fromPointId: idIda,
      toPointId: idMix,
      volumeFlow: Math.round(sizing.requiredAirflowM3h * (1 - outdoorAirPercent / 100)),
      massFlow: Number((sizing.requiredMassFlowKgS * (1 - outdoorAirPercent / 100)).toFixed(3)),
      qSensible: 0,
      qLatent: 0,
      qTotal: 0,
      moistureExchange: 0,
      shr: 1.0,
      color: '#F59E0B',
    };

    // Proc 2: Mezcla Exterior -> Mezcla
    const procMixOa: ProcessConnection = {
      id: `proc-mix-oa-${timestamp}`,
      name: 'Aporte Exterior → Mezcla',
      type: 'mixing',
      fromPointId: idOda,
      toPointId: idMix,
      volumeFlow: Math.round(sizing.requiredAirflowM3h * (outdoorAirPercent / 100)),
      massFlow: Number((sizing.requiredMassFlowKgS * (outdoorAirPercent / 100)).toFixed(3)),
      qSensible: 0,
      qLatent: 0,
      qTotal: 0,
      moistureExchange: 0,
      shr: 1.0,
      color: '#F59E0B',
    };

    // Proc 3: Batería Fría (Mezcla -> Impulsión) con ADP y BF
    const procCoilMetrics = calculateProcessMetrics(ptMix, ptSup, sizing.requiredMassFlowKgS, sizing.requiredAirflowM3h);
    const procCoil: ProcessConnection = {
      ...procCoilMetrics,
      id: `proc-coil-${timestamp}`,
      name: `Batería Fría CC (ADP: ${sizing.adp.toFixed(1)}°C)`,
      type: 'cooling_dehumid',
      fromPointId: idMix,
      toPointId: idSup,
      adp: sizing.adp,
      bypassFactor: sizing.bypassFactor,
      color: '#0284C7',
    };

    // Proc 4: Recta de Maniobra / Carga de Local (Impulsión -> Local) con RSHR
    const procZoneMetrics = calculateProcessMetrics(ptSup, ptIda, sizing.requiredMassFlowKgS, sizing.requiredAirflowM3h);
    const procZone: ProcessConnection = {
      ...procZoneMetrics,
      id: `proc-zone-${timestamp}`,
      name: `Recta Maniobra Local (RSHR = ${sizing.rshr.toFixed(2)})`,
      type: 'zone_load',
      fromPointId: idSup,
      toPointId: idIda,
      shr: sizing.rshr,
      color: '#A855F7',
    };

    onApplyShrCycle([ptOda, ptIda, ptMix, ptSup], [procMixRa, procMixOa, procCoil, procZone]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-purple-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#1e293b]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Dimensionador de Batería y Caudal por Rectas SHR</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  OTS Feature E
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Líneas de Factor de Calor Sensible (RSHR / GSHR), cálculo de Punto de Rocío del Aparato (ADP), caudal de aire y potencia frigorífica requerida
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
          {/* Technical Alignment Banner */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <span>Alineación Termodinámica de Rectas de Proceso (Método OTS)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 text-purple-200">
                    ASHRAE Ch. 1
                  </span>
                </h4>
                <p className="text-xs text-purple-200/90 mt-1">
                  La pendiente de la recta del local está regida por <strong className="text-white font-mono">RSHR = {sizing.rshr.toFixed(3)}</strong>.
                  Su corte con saturación fija el <strong className="text-cyan-300 font-mono">ADP = {sizing.adp.toFixed(1)}°C</strong>.
                  La recta de la batería evoluciona con <strong className="text-white font-mono">GSHR = {sizing.gshr.toFixed(3)}</strong> desde la mezcla hasta la impulsión a <strong className="text-amber-300 font-mono">{sizing.supplyTdb.toFixed(1)}°C / {sizing.supplyRh.toFixed(0)}% HR</strong>.
                </p>
              </div>
            </div>

            {/* Elevation indicator */}
            <div className="shrink-0 text-right bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-medium flex items-center justify-end gap-1">
                <Mountain className="w-3 h-3 text-[#fbbf24]" />
                Altitud Actual
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {altitude} m ({pressure.toFixed(1)} kPa)
              </span>
              <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                ρ = {sizing.airDensity.toFixed(2)} kg/m³ ({sizing.densityDeratingFactor < 1 ? `${((1 - sizing.densityDeratingFactor) * 100).toFixed(0)}% enrarecido` : '100%'})
              </span>
            </div>
          </div>

          {/* Grid Layout: Loads Input (5 cols) & Sizing Results (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Loads and States Inputs (5 cols) */}
            <div className="lg:col-span-5 space-y-5 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>1. Cargas Térmicas del Local</span>
              </h3>

              {/* Sensible & Latent inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <label className="text-[11px] text-amber-400 block font-medium mb-1">
                    Carga Sensible (Qs):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={sensibleLoadKw}
                      onChange={(e) => setSensibleLoadKw(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      step="1"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                    />
                    <span className="text-xs text-slate-400 font-mono">kW</span>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <label className="text-[11px] text-sky-400 block font-medium mb-1">
                    Carga Latente (Ql):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={latentLoadKw}
                      onChange={(e) => setLatentLoadKw(Math.max(0, parseFloat(e.target.value) || 0))}
                      step="0.5"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                    />
                    <span className="text-xs text-slate-400 font-mono">kW</span>
                  </div>
                </div>
              </div>

              {/* RSHR live slider & presets */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Factor Calor Sensible Local (RSHR):</span>
                  <span className="font-mono font-bold text-purple-300 text-sm">
                    {sizing.rshr.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-400">Preajustes típicos:</span>
                  <button
                    type="button"
                    onClick={() => handleSetPresetLoad(35, 5)}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    Oficinas (0.87)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetLoad(25, 10)}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    Restaurante (0.71)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetLoad(40, 2)}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    CPD / Data (0.95)
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>2. Condiciones de Diseño y Ventilación</span>
                </h3>

                {/* Room condition */}
                <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                  <div>
                    <label className="text-[11px] text-emerald-400 block font-medium mb-1">Local Tbs (°C):</label>
                    <input
                      type="number"
                      value={roomTdb}
                      onChange={(e) => setRoomTdb(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-emerald-400 block font-medium mb-1">Local HR (%):</label>
                    <input
                      type="number"
                      value={roomRh}
                      onChange={(e) => setRoomRh(parseFloat(e.target.value) || 0)}
                      step="1"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Outdoor & Ventilation */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                    <div>
                      <label className="text-[11px] text-rose-400 block font-medium mb-1">Exterior Tbs (°C):</label>
                      <input
                        type="number"
                        value={outdoorTdb}
                        onChange={(e) => setOutdoorTdb(parseFloat(e.target.value) || 0)}
                        step="0.5"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-400 block font-medium mb-1">Exterior HR (%):</label>
                      <input
                        type="number"
                        value={outdoorRh}
                        onChange={(e) => setOutdoorRh(parseFloat(e.target.value) || 0)}
                        step="1"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400">Porcentaje Aire Exterior (Ventilación):</span>
                      <span className="font-mono font-bold text-cyan-300">{outdoorAirPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={outdoorAirPercent}
                      onChange={(e) => setOutdoorAirPercent(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Bypass factor */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400">Factor By-Pass Batería (BF):</span>
                    <span className="font-mono font-bold text-white">{bypassFactor.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.04"
                    max="0.25"
                    step="0.01"
                    value={bypassFactor}
                    onChange={(e) => setBypassFactor(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right: Sizing Outputs (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Airflow and Supply State Card */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  <span>Caudal de Aire Requerido y Estado de Impulsión</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Caudal Volumétrico</span>
                    <span className="text-xl font-mono font-bold text-cyan-300 mt-0.5 block">
                      {sizing.requiredAirflowM3h.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³/h</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      ({sizing.requiredAirflowCfm.toLocaleString()} CFM)
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Flujo Másico Seco</span>
                    <span className="text-xl font-mono font-bold text-white mt-0.5 block">
                      {sizing.requiredMassFlowKgS.toFixed(2)} <span className="text-xs font-normal text-slate-400">kg/s</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      ΔT = {sizing.deltaTSupply.toFixed(1)} °C
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] text-cyan-400 uppercase font-medium block">Punto Rocío Aparato (ADP)</span>
                    <span className="text-xl font-mono font-bold text-cyan-300 mt-0.5 block">
                      {sizing.adp.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      w = {(sizing.wAdp * 1000).toFixed(2)} g/kg
                    </span>
                  </div>
                </div>

                {/* Supply Point Properties */}
                <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tbs Impulsión:</span>
                    <strong className="text-white text-sm">{sizing.supplyTdb.toFixed(1)} °C</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">HR Impulsión:</span>
                    <strong className="text-cyan-300 text-sm">{sizing.supplyRh.toFixed(0)} %</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">w Impulsión:</span>
                    <strong className="text-slate-200 text-sm">{(sizing.supplyW * 1000).toFixed(2)} g/kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Entalpía:</span>
                    <strong className="text-slate-200 text-sm">{sizing.supplyH.toFixed(1)} kJ/kg</strong>
                  </div>
                </div>
              </div>

              {/* Cooling Coil Sizing Card */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <Snowflake className="w-4 h-4" />
                    <span>Dimensionamiento de la Batería Fría Requerida</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    Gran SHR (GSHR): {sizing.gshr.toFixed(3)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Capacidad Total</span>
                    <span className="text-lg font-mono font-bold text-white mt-0.5 block">
                      {sizing.coilCoolingTotalKw.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      ({sizing.coilTonsRefrigeration.toFixed(1)} TR)
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-amber-400 uppercase font-medium block">Sensible Batería</span>
                    <span className="text-lg font-mono font-bold text-amber-300 mt-0.5 block">
                      {sizing.coilCoolingSensibleKw.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Aire mezcla + Local
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-sky-400 uppercase font-medium block">Latente Batería</span>
                    <span className="text-lg font-mono font-bold text-sky-300 mt-0.5 block">
                      {sizing.coilCoolingLatentKw.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Deshumectación
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-cyan-400 uppercase font-medium block">Condensados</span>
                    <span className="text-lg font-mono font-bold text-cyan-300 mt-0.5 block">
                      {sizing.coilCondensateRateKgH.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg/h</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Drenaje bandeja
                    </span>
                  </div>
                </div>

                {/* Mixed air state entering coil */}
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/40 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Aire de Mezcla a la entrada de la batería:
                  </span>
                  <span className="font-mono text-white font-bold">
                    {sizing.mixedTdb.toFixed(1)} °C · {sizing.mixedRh.toFixed(0)}% HR · {(sizing.mixedW * 1000).toFixed(2)} g/kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#1e293b]/70 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-purple-400" />
            <span>
              Genera los 4 estados (ODA, IDA, Mezcla, Impulsión) y conecta la recta de maniobra y la batería con su ADP
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Aplicar Ciclo Completo al Diagrama</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
