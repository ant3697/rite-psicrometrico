import React from 'react';
import { StatePoint, UnitSystem } from '../types/psychrometrics';
import { UnitConvert } from '../utils/psychrolib';
import { Plus, Trash2, Edit2, Target } from 'lucide-react';

interface PointsTableProps {
  points: StatePoint[];
  units: UnitSystem;
  onSelectPoint: (id: string) => void;
  onDeletePoint: (id: string) => void;
  onAddPoint: () => void;
  selectedPointId: string | null;
}

export const PointsTable: React.FC<PointsTableProps> = ({
  points,
  units,
  onSelectPoint,
  onDeletePoint,
  onAddPoint,
  selectedPointId,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] p-6 overflow-hidden select-none font-primary">
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.1)]">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Tabla Termodinámica de Puntos Psicrométricos
          </h2>
          <p className="text-xs text-[#cbd5e1] mt-0.5 font-secondary">
            Propiedades calculadas según formulaciones oficiales ASHRAE Fundamentals 2021
          </p>
        </div>
        <button
          onClick={onAddPoint}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Punto</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto mt-4 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#1a1a1c]/80 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0a0a0c]/90 text-[#cbd5e1] font-semibold border-b border-[rgba(255,255,255,0.1)] uppercase tracking-wider text-[11px] font-mono">
              <th className="py-3 px-4">Punto</th>
              <th className="py-3 px-3 text-right">Tbs [{units === 'IP' ? '°F' : '°C'}]</th>
              <th className="py-3 px-3 text-right">HR [%]</th>
              <th className="py-3 px-3 text-right">Tbh [{units === 'IP' ? '°F' : '°C'}]</th>
              <th className="py-3 px-3 text-right">Tpr [{units === 'IP' ? '°F' : '°C'}]</th>
              <th className="py-3 px-3 text-right">W [{units === 'IP' ? 'gr/lb' : 'g/kg'}]</th>
              <th className="py-3 px-3 text-right">h [{units === 'IP' ? 'BTU/lb' : 'kJ/kg'}]</th>
              <th className="py-3 px-3 text-right">v [{units === 'IP' ? 'ft³/lb' : 'm³/kg'}]</th>
              <th className="py-3 px-3 text-right">ρ [kg/m³]</th>
              <th className="py-3 px-3 text-right">Caudal [{units === 'IP' ? 'CFM' : 'm³/h'}]</th>
              <th className="py-3 px-3 text-right">Flujo [kg/s]</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono tabular-nums text-[#f8fafc]">
            {points.map((pt) => {
              const isSelected = pt.id === selectedPointId;

              const tdbDisplay =
                units === 'IP' ? UnitConvert.cToF(pt.tdb).toFixed(1) : pt.tdb.toFixed(1);
              const twbDisplay =
                units === 'IP' ? UnitConvert.cToF(pt.twb).toFixed(1) : pt.twb.toFixed(1);
              const tdpDisplay =
                units === 'IP' ? UnitConvert.cToF(pt.tdp).toFixed(1) : pt.tdp.toFixed(1);
              const wDisplay =
                units === 'IP'
                  ? (pt.w * 7000).toFixed(1)
                  : (pt.w * 1000).toFixed(2);
              const hDisplay =
                units === 'IP'
                  ? UnitConvert.kJkgToBtuLb(pt.h).toFixed(1)
                  : pt.h.toFixed(1);
              const vDisplay =
                units === 'IP'
                  ? UnitConvert.m3kgToFt3lb(pt.v).toFixed(2)
                  : pt.v.toFixed(3);
              const flowDisplay =
                units === 'IP'
                  ? UnitConvert.m3hToCfm(pt.volumeFlow).toFixed(0)
                  : pt.volumeFlow.toFixed(0);

              return (
                <tr
                  key={pt.id}
                  onClick={() => onSelectPoint(pt.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#fbbf24]/15 border-l-2 border-[#fbbf24]' : 'hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  <td className="py-3 px-4 font-primary font-semibold text-white flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: pt.color }}
                    />
                    <span>{pt.name}</span>
                  </td>
                  <td className="py-3 px-3 text-right text-[#93c5fd] font-semibold">{tdbDisplay}</td>
                  <td className="py-3 px-3 text-right text-[#a3e635] font-semibold">{pt.rh.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right text-[#93c5fd]">{twbDisplay}</td>
                  <td className="py-3 px-3 text-right text-[#c084fc]">{tdpDisplay}</td>
                  <td className="py-3 px-3 text-right text-[#fbbf24] font-semibold">{wDisplay}</td>
                  <td className="py-3 px-3 text-right text-[#f87171] font-semibold">{hDisplay}</td>
                  <td className="py-3 px-3 text-right text-[#67e8f9]">{vDisplay}</td>
                  <td className="py-3 px-3 text-right text-[#cbd5e1]">{pt.rho.toFixed(3)}</td>
                  <td className="py-3 px-3 text-right text-[#cbd5e1]">{flowDisplay}</td>
                  <td className="py-3 px-3 text-right text-[#94a3b8]">{pt.massFlow.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPoint(pt.id);
                        }}
                        className="p-1 hover:text-[#fbbf24] transition-colors"
                        title="Ver en gráfico"
                      >
                        <Target className="w-3.5 h-3.5" />
                      </button>
                      {points.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePoint(pt.id);
                          }}
                          className="p-1 hover:text-[#ef4444] transition-colors"
                          title="Eliminar punto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
