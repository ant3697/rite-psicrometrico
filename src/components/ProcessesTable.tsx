import React, { useState } from 'react';
import { ProcessConnection, StatePoint, UnitSystem } from '../types/psychrometrics';
import { UnitConvert } from '../utils/psychrolib';
import { Trash2, ArrowRight, Activity, Snowflake, AlertTriangle, Wind, Info, Check, Edit2, Shuffle, Plus, Target } from 'lucide-react';

interface ProcessesTableProps {
  processes: ProcessConnection[];
  points: StatePoint[];
  units: UnitSystem;
  onDeleteProcess: (id: string) => void;
  onUpdateProcessAirflow?: (id: string, flowM3h: number) => void;
  onOpenCoilModelerModal?: () => void;
  onOpenAirMixingModal?: () => void;
  onOpenShrModal?: () => void;
}

export const ProcessesTable: React.FC<ProcessesTableProps> = ({
  processes,
  points,
  units,
  onDeleteProcess,
  onUpdateProcessAirflow,
  onOpenCoilModelerModal,
  onOpenAirMixingModal,
  onOpenShrModal,
}) => {
  const [editingAirflowProcId, setEditingAirflowProcId] = useState<string | null>(null);
  const [airflowInputVal, setAirflowInputVal] = useState<string>('');

  // Aggregate system summaries
  const totalCoolingKW = processes.reduce((acc, p) => (p.qTotal < 0 ? acc + Math.abs(p.qTotal) : acc), 0);
  const totalHeatingKW = processes.reduce((acc, p) => (p.qTotal > 0 ? acc + p.qTotal : acc), 0);
  const totalCondensateKgH = processes.reduce(
    (acc, p) => (p.moistureExchange < 0 ? acc + Math.abs(p.moistureExchange) : acc),
    0
  );
  const totalHumidificationKgH = processes.reduce(
    (acc, p) => (p.moistureExchange > 0 ? acc + p.moistureExchange : acc),
    0
  );
  const totalFrostRiskKgH = processes.reduce(
    (acc, p) => (p.isFrostRisk && p.frostRateKgH ? acc + p.frostRateKgH : acc),
    0
  );

  const handleCommitAirflow = (procId: string) => {
    const parsed = parseFloat(airflowInputVal);
    if (!isNaN(parsed) && parsed > 0 && onUpdateProcessAirflow) {
      const flowM3h = units === 'IP' ? UnitConvert.cfmToM3h(parsed) : parsed;
      onUpdateProcessAirflow(procId, flowM3h);
    }
    setEditingAirflowProcId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] p-6 overflow-hidden select-none font-primary">
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Balance Energético y Procesos de Climatización
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              OTS Psychrochart Modeling
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] mt-0.5 font-secondary">
            Cálculo de caudales de aire directos, potencias sensibles, latentes, totales, condensados, ADP y detección de escarcha
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCoilModelerModal && (
            <button
              onClick={onOpenCoilModelerModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all flex items-center gap-1.5"
              title="Simulador de Batería: ADP, factor bypass y riesgo de congelación (OTS C)"
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulador Batería ADP</span>
            </button>
          )}

          {onOpenAirMixingModal && (
            <button
              onClick={onOpenAirMixingModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white transition-all flex items-center gap-1.5"
              title="Calculadora de Mezcla de Aire: Repartición de caudales y economizador (OTS D)"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Calculadora de Mezcla</span>
            </button>
          )}

          {onOpenShrModal && (
            <button
              onClick={onOpenShrModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-950/40 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white transition-all flex items-center gap-1.5"
              title="Dimensionador por Líneas de Factor de Calor Sensible (SHR / ADP) y Cargas del Local (OTS E)"
            >
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Dimensionador SHR</span>
            </button>
          )}
        </div>
      </div>

      {/* High-level system summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 my-4">
        <div className="bg-[#1a1a1c]/90 p-3 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Capacidad Frigorífica
          </div>
          <div className="text-xl font-bold font-mono text-[#93c5fd] mt-1">
            {totalCoolingKW.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kW</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            ({UnitConvert.kWToTR(totalCoolingKW).toFixed(2)} TR)
          </div>
        </div>

        <div className="bg-[#1a1a1c]/90 p-3 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Capacidad Calorífica
          </div>
          <div className="text-xl font-bold font-mono text-[#fbbf24] mt-1">
            {totalHeatingKW.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kW</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            ({(totalHeatingKW * 860).toFixed(0)} kcal/h)
          </div>
        </div>

        <div className="bg-[#1a1a1c]/90 p-3 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Condensados (Baterías)
          </div>
          <div className="text-xl font-bold font-mono text-[#60a5fa] mt-1">
            {totalCondensateKgH.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kg/h</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            ({(totalCondensateKgH * 24).toFixed(1)} L/día)
          </div>
        </div>

        <div className="bg-[#1a1a1c]/90 p-3 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Humidificación
          </div>
          <div className="text-xl font-bold font-mono text-[#a3e635] mt-1">
            {totalHumidificationKgH.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kg/h</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            ({(totalHumidificationKgH * 24).toFixed(1)} kg/día)
          </div>
        </div>

        <div className={`p-3 rounded-[8px] border shadow-md transition-all ${
          totalFrostRiskKgH > 0
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-[#1a1a1c]/90 border-[rgba(255,255,255,0.1)] text-[#cbd5e1]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Riesgo de Escarcha
            </span>
            {totalFrostRiskKgH > 0 && (
              <Snowflake className="w-4 h-4 text-rose-400 animate-pulse" />
            )}
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${totalFrostRiskKgH > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {totalFrostRiskKgH > 0 ? `${totalFrostRiskKgH.toFixed(2)} kg/h` : '0.00 kg/h'}
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            {totalFrostRiskKgH > 0 ? '⚠️ Alerta Congelación' : '✓ Aletas libres'}
          </div>
        </div>
      </div>

      {/* Main Process Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#1a1a1c]/80 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0a0a0c]/90 text-[#cbd5e1] font-semibold border-b border-[rgba(255,255,255,0.1)] uppercase tracking-wider text-[11px] font-mono">
              <th className="py-3 px-3">Proceso HVAC</th>
              <th className="py-3 px-3">Trayectoria</th>
              <th className="py-3 px-3 text-right">Caudal Aire</th>
              <th className="py-3 px-3 text-right">ΔTbs [°C]</th>
              <th className="py-3 px-3 text-right">ΔW [g/kg]</th>
              <th className="py-3 px-3 text-right">Q Sensible [kW]</th>
              <th className="py-3 px-3 text-right">Q Latente [kW]</th>
              <th className="py-3 px-3 text-right">Q Total [kW]</th>
              <th className="py-3 px-3 text-right">Agua [kg/h]</th>
              <th className="py-3 px-3 text-right">SHR</th>
              <th className="py-3 px-3 text-right">ADP / BF</th>
              <th className="py-3 px-3 text-center">Escarcha</th>
              <th className="py-3 px-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono tabular-nums text-[#f8fafc]">
            {processes.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-8 text-center text-[#94a3b8] italic">
                  No se han definido transformaciones entre puntos psicrométricos.
                </td>
              </tr>
            ) : (
              processes.map((proc) => {
                const ptFrom = points.find((p) => p.id === proc.fromPointId);
                const ptTo = points.find((p) => p.id === proc.toPointId);
                if (!ptFrom || !ptTo) return null;

                const deltaT = ptTo.tdb - ptFrom.tdb;
                const deltaW = (ptTo.w - ptFrom.w) * 1000;
                const currentFlow = proc.volumeFlow || ptFrom.volumeFlow || 3000;
                const displayFlow = units === 'IP' ? UnitConvert.m3hToCfm(currentFlow) : currentFlow;
                const flowUnit = units === 'IP' ? 'CFM' : 'm³/h';

                return (
                  <tr key={proc.id} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    <td className="py-3 px-3 font-primary font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: proc.color || '#38bdf8' }}
                        />
                        <span>{proc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-secondary text-[#f8fafc]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ptFrom.color }}
                        />
                        <span className="truncate max-w-[85px]">{ptFrom.name}</span>
                        <ArrowRight className="w-3 h-3 text-[#94a3b8] shrink-0" />
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ptTo.color }}
                        />
                        <span className="truncate max-w-[85px]">{ptTo.name}</span>
                      </div>
                    </td>

                    {/* Airflow column with direct inline edit */}
                    <td className="py-3 px-3 text-right">
                      {editingAirflowProcId === proc.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="100"
                            min="100"
                            max="50000"
                            value={airflowInputVal}
                            autoFocus
                            onChange={(e) => setAirflowInputVal(e.target.value)}
                            onBlur={() => handleCommitAirflow(proc.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommitAirflow(proc.id);
                              if (e.key === 'Escape') setEditingAirflowProcId(null);
                            }}
                            className="w-20 px-1 py-0.5 text-right bg-black border border-amber-400 rounded text-amber-300 text-xs font-bold outline-none"
                          />
                          <button
                            onClick={() => handleCommitAirflow(proc.id)}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            if (onUpdateProcessAirflow) {
                              setEditingAirflowProcId(proc.id);
                              setAirflowInputVal(Math.round(displayFlow).toString());
                            }
                          }}
                          className={`font-semibold text-amber-300 ${
                            onUpdateProcessAirflow ? 'cursor-pointer hover:underline' : ''
                          }`}
                          title="Clic para modificar el caudal de este proceso (recalcula potencias en tiempo real)"
                        >
                          {Math.round(displayFlow).toLocaleString()} {flowUnit}
                        </div>
                      )}
                    </td>

                    <td
                      className={`py-3 px-3 text-right font-semibold ${
                        deltaT >= 0 ? 'text-[#fbbf24]' : 'text-[#93c5fd]'
                      }`}
                    >
                      {deltaT >= 0 ? `+${deltaT.toFixed(1)}` : deltaT.toFixed(1)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-semibold ${
                        deltaW >= 0 ? 'text-[#a3e635]' : 'text-[#60a5fa]'
                      }`}
                    >
                      {deltaW >= 0 ? `+${deltaW.toFixed(2)}` : deltaW.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#fb923c]">
                      {proc.qSensible.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#60a5fa]">
                      {proc.qLatent.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {proc.qTotal.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right ${
                        proc.moistureExchange < 0
                          ? 'text-[#93c5fd]'
                          : proc.moistureExchange > 0
                          ? 'text-[#a3e635]'
                          : 'text-[#94a3b8]'
                      }`}
                    >
                      {proc.moistureExchange.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#a3e635]">
                      {proc.shr.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right text-[#c084fc]">
                      {proc.adp !== undefined ? (
                        <span>
                          {proc.adp.toFixed(1)}° / {(proc.bypassFactor ?? 0.1).toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Frost Risk Diagnostic */}
                    <td className="py-3 px-3 text-center">
                      {proc.isFrostRisk ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          title={`⚠️ Peligro de escarcha: ADP <= 0°C o superficie bajo cero con condensación (${proc.frostRateKgH?.toFixed(2)} kg/h hielo). Requiere desescarche.`}
                        >
                          <Snowflake className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{proc.frostRateKgH ? `${proc.frostRateKgH.toFixed(1)}k/h` : 'RIESGO'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onDeleteProcess(proc.id)}
                        className="p-1 hover:text-[#ef4444] text-[#94a3b8] transition-colors cursor-pointer"
                        title="Eliminar proceso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

