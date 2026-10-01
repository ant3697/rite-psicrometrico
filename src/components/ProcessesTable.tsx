import React from 'react';
import { ProcessConnection, StatePoint, UnitSystem } from '../types/psychrometrics';
import { UnitConvert } from '../utils/psychrolib';
import { Trash2, ArrowRight, Activity } from 'lucide-react';

interface ProcessesTableProps {
  processes: ProcessConnection[];
  points: StatePoint[];
  units: UnitSystem;
  onDeleteProcess: (id: string) => void;
}

export const ProcessesTable: React.FC<ProcessesTableProps> = ({
  processes,
  points,
  units,
  onDeleteProcess,
}) => {
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

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] p-6 overflow-hidden select-none font-primary">
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.1)]">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Balance Energético y Procesos de Climatización
          </h2>
          <p className="text-xs text-[#cbd5e1] mt-0.5 font-secondary">
            Cálculo de potencias sensibles, latentes, totales, condensados y factor de calor sensible (SHR)
          </p>
        </div>
      </div>

      {/* High-level system summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
        <div className="bg-[#1a1a1c]/90 p-3.5 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Capacidad Frigorífica Total
          </div>
          <div className="text-xl font-bold font-mono text-[#93c5fd] mt-1">
            {totalCoolingKW.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kW</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            ({UnitConvert.kWToTR(totalCoolingKW).toFixed(2)} TR)
          </div>
        </div>

        <div className="bg-[#1a1a1c]/90 p-3.5 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Capacidad Calorífica Total
          </div>
          <div className="text-xl font-bold font-mono text-[#fbbf24] mt-1">
            {totalHeatingKW.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kW</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            ({(totalHeatingKW * 860).toFixed(0)} kcal/h)
          </div>
        </div>

        <div className="bg-[#1a1a1c]/90 p-3.5 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Caudal de Condensados (Baterías)
          </div>
          <div className="text-xl font-bold font-mono text-[#60a5fa] mt-1">
            {totalCondensateKgH.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kg/h (L/h)</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            {(totalCondensateKgH * 24).toFixed(1)} L/día
          </div>
        </div>

        <div className="bg-[#1a1a1c]/90 p-3.5 rounded-[8px] border border-[rgba(255,255,255,0.1)] shadow-md">
          <div className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wider">
            Aporte de Humidificación
          </div>
          <div className="text-xl font-bold font-mono text-[#a3e635] mt-1">
            {totalHumidificationKgH.toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#94a3b8]">kg/h vapor</span>
          </div>
          <div className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
            {(totalHumidificationKgH * 24).toFixed(1)} kg/día
          </div>
        </div>
      </div>

      {/* Main Process Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#1a1a1c]/80 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0a0a0c]/90 text-[#cbd5e1] font-semibold border-b border-[rgba(255,255,255,0.1)] uppercase tracking-wider text-[11px] font-mono">
              <th className="py-3 px-4">Proceso HVAC</th>
              <th className="py-3 px-3">Trayectoria</th>
              <th className="py-3 px-3 text-right">ΔTbs [°C]</th>
              <th className="py-3 px-3 text-right">ΔW [g/kg]</th>
              <th className="py-3 px-3 text-right">Q Sensible [kW]</th>
              <th className="py-3 px-3 text-right">Q Latente [kW]</th>
              <th className="py-3 px-3 text-right">Q Total [kW]</th>
              <th className="py-3 px-3 text-right">Agua [kg/h]</th>
              <th className="py-3 px-3 text-right">SHR</th>
              <th className="py-3 px-3 text-right">ADP [°C]</th>
              <th className="py-3 px-3 text-right">BF</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono tabular-nums text-[#f8fafc]">
            {processes.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-[#94a3b8] italic">
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

                return (
                  <tr key={proc.id} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    <td className="py-3 px-4 font-primary font-semibold text-white">
                      {proc.name}
                    </td>
                    <td className="py-3 px-3 font-secondary text-[#f8fafc]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ptFrom.color }}
                        />
                        <span className="truncate max-w-[100px]">{ptFrom.name}</span>
                        <ArrowRight className="w-3 h-3 text-[#94a3b8]" />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ptTo.color }}
                        />
                        <span className="truncate max-w-[100px]">{ptTo.name}</span>
                      </div>
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
                      {proc.adp !== undefined ? proc.adp.toFixed(1) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right text-[#cbd5e1]">
                      {proc.bypassFactor !== undefined
                        ? proc.bypassFactor.toFixed(2)
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteProcess(proc.id)}
                        className="p-1 hover:text-[#ef4444] text-[#94a3b8] transition-colors"
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
