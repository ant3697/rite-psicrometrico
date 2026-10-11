import React, { useState } from 'react';
import { OperatingCondition, UnitSystem } from '../types/psychrometrics';
import { UnitConvert } from '../utils/psychrolib';
import {
  X,
  Layers,
  Eye,
  EyeOff,
  Check,
  Plus,
  Copy,
  Trash2,
  Sliders,
  TrendingDown,
  AlertTriangle,
  Snowflake,
  Activity,
  Flame,
  Droplets,
  Wind,
  Download,
} from 'lucide-react';

interface ConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conditions: OperatingCondition[];
  activeConditionId: string;
  onSelectCondition: (conditionId: string) => void;
  onToggleOverlayCondition: (conditionId: string) => void;
  onAddCondition: (name: string, baseConditionId?: string) => void;
  onDeleteCondition: (conditionId: string) => void;
  onUpdateConditionMultiplier: (conditionId: string, multiplier: number) => void;
  onUpdateConditionColor: (conditionId: string, color: string) => void;
  units: UnitSystem;
}

export const ConditionsModal: React.FC<ConditionsModalProps> = ({
  isOpen,
  onClose,
  conditions,
  activeConditionId,
  onSelectCondition,
  onToggleOverlayCondition,
  onAddCondition,
  onDeleteCondition,
  onUpdateConditionMultiplier,
  onUpdateConditionColor,
  units,
}) => {
  const [activeTab, setActiveTab] = useState<'manager' | 'comparison'>('manager');
  const [newConditionName, setNewConditionName] = useState('');
  const [newConditionBaseId, setNewConditionBaseId] = useState<string>(activeConditionId);

  if (!isOpen) return null;

  // Compute energy footprint metrics for each scenario
  const scenarioMetrics = conditions.map((cond) => {
    const totalCoolingKW = cond.processes.reduce(
      (acc, p) => (p.qTotal < 0 ? acc + Math.abs(p.qTotal) : acc),
      0
    );
    const totalHeatingKW = cond.processes.reduce(
      (acc, p) => (p.qTotal > 0 ? acc + p.qTotal : acc),
      0
    );
    const totalCondensateKgH = cond.processes.reduce(
      (acc, p) => (p.moistureExchange < 0 ? acc + Math.abs(p.moistureExchange) : acc),
      0
    );
    const hasFrostRisk = cond.processes.some((p) => p.isFrostRisk);
    const totalFrostRateKgH = cond.processes.reduce(
      (acc, p) => (p.frostRateKgH ? acc + p.frostRateKgH : acc),
      0
    );

    // Determine supply and outdoor points if found
    const outdoorPt = cond.points.find((p) =>
      p.name.toLowerCase().includes('oda') ||
      p.name.toLowerCase().includes('exterior') ||
      p.name.toLowerCase().includes('oa')
    ) || cond.points[0];

    const supplyPt = cond.points.find((p) =>
      p.name.toLowerCase().includes('sa') ||
      p.name.toLowerCase().includes('impuls') ||
      p.name.toLowerCase().includes('sup')
    ) || cond.points[cond.points.length - 2] || cond.points[0];

    const totalVolumeFlow = cond.points.reduce((max, p) => Math.max(max, p.volumeFlow || 0), 3000);

    return {
      condition: cond,
      outdoorPt,
      supplyPt,
      totalVolumeFlow,
      totalCoolingKW,
      totalHeatingKW,
      totalCondensateKgH,
      hasFrostRisk,
      totalFrostRateKgH,
    };
  });

  // Summer design reference for percentage savings
  const designReference = scenarioMetrics[0]?.totalCoolingKW || 1;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConditionName.trim()) return;
    onAddCondition(newConditionName.trim(), newConditionBaseId);
    setNewConditionName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-primary animate-fade-in">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#18181b]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Escenarios y Condiciones Operativas
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OTS Psychrochart Tool
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diseña, compara y superpone múltiples condiciones de operación (Día de diseño, Carga parcial, Invierno y Free-cooling)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-2 border-b border-white/10 bg-[#161619]">
          <button
            onClick={() => setActiveTab('manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manager'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Gestor de Escenarios ({conditions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Comparativa Energética & Balances</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'manager' ? (
            <>
              {/* Active list */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Condiciones Configuradas</span>
                  <span className="text-[11px] text-slate-500 lowercase font-normal">
                    Haz clic en "Superponer" para proyectar la envolvente en el gráfico
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {conditions.map((cond) => {
                    const isActive = cond.id === activeConditionId;
                    return (
                      <div
                        key={cond.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isActive
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-lg ring-1 ring-amber-500/30'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className="w-4 h-12 rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: cond.color }}
                            title={`Color del escenario: ${cond.color}`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {cond.name}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black uppercase">
                                  Activo (Editando)
                                </span>
                              )}
                              {cond.isOverlayVisible && !isActive && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                  Superpuesto en Gráfico
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 max-w-xl">
                              {cond.description || `${cond.points.length} puntos psicrométricos y ${cond.processes.length} procesos térmicos.`}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-slate-400">
                              <span>Puntos: <strong className="text-white">{cond.points.length}</strong></span>
                              <span>Procesos: <strong className="text-white">{cond.processes.length}</strong></span>
                              <span>
                                Factor Caudal:{' '}
                                <strong className="text-amber-300">
                                  {Math.round((cond.airflowMultiplier ?? 1) * 100)}%
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          {/* Modulate airflow multiplier */}
                          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 text-xs">
                            <span className="text-slate-400 text-[11px]">Caudal:</span>
                            <select
                              value={cond.airflowMultiplier ?? 1.0}
                              onChange={(e) => onUpdateConditionMultiplier(cond.id, parseFloat(e.target.value))}
                              className="bg-transparent text-amber-300 font-mono font-bold text-xs outline-none cursor-pointer"
                            >
                              <option value="1.0" className="bg-[#18181b] text-white">100% (Nominal)</option>
                              <option value="0.8" className="bg-[#18181b] text-white">80%</option>
                              <option value="0.6" className="bg-[#18181b] text-white">60% (Parcial)</option>
                              <option value="0.5" className="bg-[#18181b] text-white">50%</option>
                              <option value="0.3" className="bg-[#18181b] text-white">30% (Mínimo)</option>
                            </select>
                          </div>

                          {/* Overlay toggle */}
                          <button
                            type="button"
                            onClick={() => onToggleOverlayCondition(cond.id)}
                            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              cond.isOverlayVisible
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                            }`}
                            title={cond.isOverlayVisible ? "Ocultar superposición en el gráfico" : "Superponer este escenario en el gráfico para comparar"}
                          >
                            {cond.isOverlayVisible ? (
                              <Eye className="w-4 h-4 text-sky-400" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">
                              {cond.isOverlayVisible ? 'Superpuesto' : 'Superponer'}
                            </span>
                          </button>

                          {/* Set Active */}
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onSelectCondition(cond.id)}
                              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                              title="Activar como escenario de trabajo principal"
                            >
                              Activar
                            </button>
                          )}

                          {/* Delete if more than 1 */}
                          {conditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteCondition(cond.id)}
                              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Eliminar este escenario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form to add a new condition */}
              <form
                onSubmit={handleCreateNew}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center gap-3"
              >
                <div className="flex-1 w-full">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Crear Nuevo Escenario / Condición
                  </label>
                  <input
                    type="text"
                    value={newConditionName}
                    onChange={(e) => setNewConditionName(e.target.value)}
                    placeholder="Ej. Invierno Extremo -5°C, Noche Carga 40%, etc."
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="w-full md:w-56">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Duplicar a partir de:
                  </label>
                  <select
                    value={newConditionBaseId}
                    onChange={(e) => setNewConditionBaseId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {conditions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!newConditionName.trim()}
                  className="w-full md:w-auto px-4 py-2 mt-4 md:mt-5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Escenario</span>
                </button>
              </form>
            </>
          ) : (
            /* Multi-Scenario Energy Comparison Table */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Matriz Comparativa de Capacidades y Consumos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compara potencias térmicas, condensados y riesgo de escarcha entre condiciones de funcionamiento.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-mono text-[11px]">
                      <th className="py-3 px-4">Condición</th>
                      <th className="py-3 px-3">Exterior (ODA)</th>
                      <th className="py-3 px-3">Impulsión (SA)</th>
                      <th className="py-3 px-3 text-right">Caudal Máx.</th>
                      <th className="py-3 px-3 text-right text-sky-400">Pot. Frío</th>
                      <th className="py-3 px-3 text-right text-amber-400">Pot. Calor</th>
                      <th className="py-3 px-3 text-right text-blue-400">Condensados</th>
                      <th className="py-3 px-3 text-center text-rose-400">Escarcha</th>
                      <th className="py-3 px-3 text-right">Variación vs Pico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                    {scenarioMetrics.map(({ condition, outdoorPt, supplyPt, totalVolumeFlow, totalCoolingKW, totalHeatingKW, totalCondensateKgH, hasFrostRisk, totalFrostRateKgH }) => {
                      const isActive = condition.id === activeConditionId;
                      const percentCooling = designReference > 0 ? (totalCoolingKW / designReference) * 100 : 100;
                      const savings = Math.max(0, 100 - percentCooling);

                      return (
                        <tr
                          key={condition.id}
                          className={`hover:bg-white/[0.04] transition-colors ${
                            isActive ? 'bg-amber-500/5 font-semibold text-white' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-primary">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: condition.color }}
                              />
                              <span className="font-bold">{condition.name}</span>
                              {isActive && (
                                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                                  Activo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">
                            {outdoorPt ? `${outdoorPt.tdb.toFixed(1)}°C / ${outdoorPt.rh.toFixed(0)}%` : '-'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">
                            {supplyPt ? `${supplyPt.tdb.toFixed(1)}°C / ${supplyPt.rh.toFixed(0)}%` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {totalVolumeFlow.toLocaleString()} m³/h
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sky-400">
                            {totalCoolingKW.toFixed(2)} kW
                            <div className="text-[10px] text-slate-500 font-normal">
                              ({UnitConvert.kWToTR(totalCoolingKW).toFixed(2)} TR)
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                            {totalHeatingKW.toFixed(2)} kW
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-blue-400">
                            {totalCondensateKgH.toFixed(2)} L/h
                            <div className="text-[10px] text-slate-500 font-normal">
                              ({(totalCondensateKgH * 24).toFixed(0)} L/día)
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {hasFrostRisk ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                title={`Peligro de escarcha activo (${totalFrostRateKgH.toFixed(2)} kg/h hielo)`}
                              >
                                <Snowflake className="w-3 h-3" />
                                <span>{totalFrostRateKgH.toFixed(1)} kg/h</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {condition.id === conditions[0]?.id ? (
                              <span className="text-slate-400">100% (Ref)</span>
                            ) : savings > 0 ? (
                              <span className="text-emerald-400 font-bold">
                                -{savings.toFixed(0)}% consumo
                              </span>
                            ) : (
                              <span className="text-slate-400">0%</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Technical OTS Insight Note */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white">
                    Optimización Psicrométrica Multicondición (Método OTS):
                  </div>
                  <p>
                    Superponer las curvas de <strong>Día de Diseño Verano</strong> con <strong>Carga Parcial (60%)</strong> o <strong>Free-Cooling</strong> permite dimensionar con precisión el rango de modulación de las válvulas de control de batería, verificar que el punto de rocío de aparato (ADP) se mantenga por encima de 0 °C para prevenir escarcha, y garantizar el cumplimiento de los caudales mínimos de ventilación exterior RITE IT 1.1.4.2 en cualquier condición climática.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#161619] flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Escenario Activo:</span>
            <strong className="text-amber-400 font-mono">
              {conditions.find((c) => c.id === activeConditionId)?.name || 'Ninguno'}
            </strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
