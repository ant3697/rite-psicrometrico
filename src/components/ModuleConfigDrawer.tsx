import React, { useState } from 'react';
import {
  Snowflake,
  Flame,
  GitMerge,
  RotateCcw,
  Droplets,
  Wind,
  Shield,
  Sliders,
  VolumeX,
  Target,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  Check,
  Edit2,
  Zap,
} from 'lucide-react';
import {
  AHUModuleItem,
  AHUModuleType,
} from '../types/psychrometrics';
import { AHUStepResult } from './HVACSchematicViewer';

interface ModuleConfigDrawerProps {
  module: AHUModuleItem;
  step?: AHUStepResult;
  isolatedModuleId: string | null;
  isDrawerCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateParams: (id: string, params: Partial<AHUModuleItem['params']>) => void;
  onUpdatePressureDrop: (id: string, pa: number) => void;
  onUpdateName?: (id: string, name: string) => void;
  onToggleModule: (id: string) => void;
  onDuplicateModule: (id: string) => void;
  onRemoveModule: (id: string) => void;
  onToggleIsolateModule: (id: string) => void;
  onClose: () => void;
}

const MODULE_TYPE_ICONS: Record<string, React.ElementType> = {
  cooling_coil: Snowflake,
  heating_coil: Flame,
  electric_heater: Flame,
  mixing_box: GitMerge,
  heat_recovery: RotateCcw,
  rotary_wheel: RotateCcw,
  humidifier: Droplets,
  adiabatic_cooling: Droplets,
  fan: Wind,
  belt_fan: Wind,
  return_fan: Wind,
  prefilter: Shield,
  prefilter_flat: Shield,
  final_filter: Shield,
  intake_damper: Sliders,
  exhaust_damper: Sliders,
  silencer: VolumeX,
  droplet_eliminator: Droplets,
  plenum: Sliders,
};

const MODULE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cooling_coil: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  heating_coil: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  electric_heater: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  mixing_box: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  heat_recovery: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  rotary_wheel: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  humidifier: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  adiabatic_cooling: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  fan: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  belt_fan: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  return_fan: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  prefilter: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  prefilter_flat: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  final_filter: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  intake_damper: { bg: 'bg-lime-500/15', text: 'text-lime-400', border: 'border-lime-500/30' },
  exhaust_damper: { bg: 'bg-lime-500/15', text: 'text-lime-400', border: 'border-lime-500/30' },
  silencer: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
  droplet_eliminator: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  plenum: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

/**
 * Compact Dual-Mode Numeric & Slider Field
 */
interface CompactSliderNumberProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  colorClass?: string;
  presets?: Array<{ label: string; value: number }>;
  onChange: (val: number) => void;
}

const CompactSliderNumber: React.FC<CompactSliderNumberProps> = ({
  label,
  value,
  unit,
  min,
  max,
  step,
  decimals = 1,
  colorClass = 'text-cyan-400',
  presets,
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value.toFixed(decimals));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempVal(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const num = parseFloat(tempVal);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onChange(Number(clamped.toFixed(decimals)));
    } else {
      setTempVal(value.toFixed(decimals));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempVal(value.toFixed(decimals));
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-md p-1.5 transition-all space-y-1">
      <div className="flex items-center justify-between text-[11px] leading-tight">
        <span className="text-slate-400 truncate max-w-[140px] font-medium" title={label}>
          {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={tempVal}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              autoFocus
              className="w-14 h-5 px-1 py-0 text-right font-mono text-[11px] font-bold rounded bg-slate-950 border border-cyan-500 text-white focus:outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setTempVal(value.toFixed(decimals));
                setIsEditing(true);
              }}
              title="Clic para editar valor exacto"
              className="font-mono text-[11px] font-bold hover:bg-slate-800 px-1 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-0.5"
            >
              <span className={colorClass}>{value.toFixed(decimals)}</span>
              <span className="text-slate-400 font-normal text-[10px]">{unit}</span>
            </button>
          )}
        </div>
      </div>

      {/* Slim Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(parseFloat(e.target.value).toFixed(decimals)))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
      />

      {/* Optional Quick Preset Chips */}
      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5 overflow-x-auto no-scrollbar">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(p.value)}
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded transition-all shrink-0 cursor-pointer ${
                Math.abs(value - p.value) < step / 2
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ModuleConfigDrawer: React.FC<ModuleConfigDrawerProps> = ({
  module,
  step,
  isolatedModuleId,
  isDrawerCollapsed,
  onToggleCollapse,
  onUpdateParams,
  onUpdatePressureDrop,
  onUpdateName,
  onToggleModule,
  onDuplicateModule,
  onRemoveModule,
  onToggleIsolateModule,
  onClose,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(module.name);

  const Icon = MODULE_TYPE_ICONS[module.type] || Sliders;
  const theme = MODULE_TYPE_COLORS[module.type] || {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  };

  const isIsolated = isolatedModuleId === module.id;

  // Thermodynamic deltas
  const deltaT = step ? step.exitPoint.tdb - step.entryPoint.tdb : 0;
  const deltaRh = step ? step.exitPoint.rh - step.entryPoint.rh : 0;
  const deltaW = step ? (step.exitPoint.w - step.entryPoint.w) * 1000 : 0;
  const deltaH = step ? step.exitPoint.h - step.entryPoint.h : 0;
  const qTotalKw = step?.metrics?.qTotal ?? 0;

  const handleFinishName = () => {
    setIsEditingName(false);
    if (nameVal.trim() && onUpdateName) {
      onUpdateName(module.id, nameVal.trim());
    } else {
      setNameVal(module.name);
    }
  };

  return (
    <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl overflow-hidden shrink-0 transition-all">
      {/* ---------------- 1. COMPACT TOP HEADER ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/80 border-b border-slate-800">
        {/* Left: Icon, Module Name & Type */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${theme.bg} ${theme.text} border ${theme.border}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>

          {isEditingName ? (
            <input
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={handleFinishName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishName();
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setNameVal(module.name);
                }
              }}
              autoFocus
              className="px-1.5 py-0.5 text-xs font-bold text-white bg-slate-950 border border-cyan-400 rounded focus:outline-none w-48"
            />
          ) : (
            <div className="flex items-center gap-1.5 truncate">
              <span
                onClick={() => {
                  setNameVal(module.name);
                  setIsEditingName(true);
                }}
                className="text-xs font-bold text-slate-100 hover:text-white cursor-pointer truncate flex items-center gap-1"
                title="Clic para renombrar este módulo"
              >
                <span>{module.name}</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 hover:text-slate-300" />
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                {module.type}
              </span>
            </div>
          )}
        </div>

        {/* Center / Right: Action Bar */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Active / Bypass Toggle */}
          <button
            onClick={() => onToggleModule(module.id)}
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              module.enabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
            title={module.enabled ? 'Módulo operando' : 'Módulo en bypass (aire pasa directo)'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${module.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span>{module.enabled ? 'Activo' : 'En Bypass'}</span>
          </button>

          {/* Isolate in Psychrometric Chart */}
          <button
            onClick={() => onToggleIsolateModule(module.id)}
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              isIsolated
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30 border border-cyan-400'
                : 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 hover:bg-cyan-900/50'
            }`}
            title="Aislar la transformación termodinámica de este módulo en el Diagrama Psicrométrico"
          >
            <Target className="w-3 h-3" />
            <span>{isIsolated ? 'Aislado 🎯' : 'Aislar Carta'}</span>
          </button>

          {/* Duplicate Button */}
          <button
            onClick={() => onDuplicateModule(module.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Duplicar este módulo en la UTA"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Remove Button */}
          <button
            onClick={() => onRemoveModule(module.id)}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Eliminar este módulo de la UTA"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Collapse / Expand */}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isDrawerCollapsed ? 'Expandir configuración' : 'Minimizar configuración'}
          >
            {isDrawerCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar panel de configuración"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ---------------- 2. EXPANDED CONTENT ---------------- */}
      {!isDrawerCollapsed && (
        <div className="p-2.5 space-y-2">
          {/* Ultra-Compact Telemetry Ribbon */}
          {step && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-y-1 gap-x-3 text-[11px] font-mono tabular-nums">
              {/* Entry -> Exit State */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-slate-400">Entrada:</span>
                <span className="font-semibold text-slate-200">{step.entryPoint.tdb.toFixed(1)}°C</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-300">{step.entryPoint.rh.toFixed(0)}%</span>
                <span className="text-cyan-400 font-bold">→</span>
                <span className="text-slate-400">Salida:</span>
                <span className="font-semibold text-white">{step.exitPoint.tdb.toFixed(1)}°C</span>
                <span className="text-slate-500">/</span>
                <span className="text-white">{step.exitPoint.rh.toFixed(0)}%</span>
              </div>

              {/* Deltas Band */}
              <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">ΔT:</span>
                  <span
                    className={`font-bold ${
                      deltaT < -0.1 ? 'text-cyan-400' : deltaT > 0.1 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {deltaT > 0 ? '+' : ''}
                    {deltaT.toFixed(1)}°C
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400">ΔHR:</span>
                  <span
                    className={`font-bold ${
                      deltaRh > 0.5 ? 'text-cyan-400' : deltaRh < -0.5 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {deltaRh > 0 ? '+' : ''}
                    {deltaRh.toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Δw:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(deltaW) < 0.05
                        ? 'text-slate-400'
                        : deltaW < 0
                        ? 'text-cyan-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {Math.abs(deltaW) < 0.05 ? '0 (cte)' : `${deltaW > 0 ? '+' : ''}${deltaW.toFixed(2)} g/kg`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Δh:</span>
                  <span className="font-bold text-amber-300">
                    {deltaH > 0 ? '+' : ''}
                    {deltaH.toFixed(1)} kJ/kg
                  </span>
                </div>

                {Math.abs(qTotalKw) > 0.05 && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Q:</span>
                    <span className="font-bold text-cyan-300">{Math.abs(qTotalKw).toFixed(1)} kW</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <span className="text-slate-400">ΔP:</span>
                  <span className="font-bold text-rose-300">-{module.pressureDropPa} Pa</span>
                </div>
              </div>
            </div>
          )}

          {/* If passive module */}
          {step && !step.isTransformation && (
            <div className="bg-slate-900/40 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-slate-400 flex items-center justify-between gap-2">
              <span>
                ℹ️ Módulo pasivo isentálpico: el estado psicrométrico no sufre transformación (ΔT = 0, Δw = 0, Δh = 0). Aporta una pérdida de carga de {module.pressureDropPa} Pa.
              </span>
              <button
                type="button"
                onClick={() => onToggleIsolateModule(module.id)}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer shrink-0"
              >
                Ver en Carta
              </button>
            </div>
          )}

          {/* ---------------- 3. COMPACT MODULE CONTROLS GRID ---------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Common: Pérdida de Carga ΔP */}
            <CompactSliderNumber
              label="Pérdida Carga ΔP"
              value={module.pressureDropPa}
              unit="Pa"
              min={0}
              max={600}
              step={5}
              decimals={0}
              colorClass="text-rose-400"
              presets={[
                { label: '30 Pa', value: 30 },
                { label: '80 Pa', value: 80 },
                { label: '140 Pa', value: 140 },
                { label: '220 Pa', value: 220 },
              ]}
              onChange={(val) => onUpdatePressureDrop(module.id, val)}
            />

            {/* Cooling Coil */}
            {module.type === 'cooling_coil' && (
              <>
                <CompactSliderNumber
                  label="Tbs Salida"
                  value={module.params.exitTdb ?? 12.8}
                  unit="°C"
                  min={6.0}
                  max={24.0}
                  step={0.1}
                  decimals={1}
                  colorClass="text-cyan-300"
                  presets={[
                    { label: '10°C', value: 10.0 },
                    { label: '12.8°C', value: 12.8 },
                    { label: '14°C', value: 14.0 },
                    { label: '16°C', value: 16.0 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { exitTdb: val })}
                />

                <CompactSliderNumber
                  label="HR Salida"
                  value={module.params.exitRh ?? 95}
                  unit="%"
                  min={70}
                  max={98}
                  step={1}
                  decimals={0}
                  colorClass="text-emerald-400"
                  presets={[
                    { label: '85%', value: 85 },
                    { label: '90%', value: 90 },
                    { label: '95%', value: 95 },
                    { label: '98%', value: 98 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { exitRh: val })}
                />

                <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
                  <label className="text-[11px] text-slate-400 font-medium">Fluido Caloportador</label>
                  <select
                    value={module.params.fluid ?? 'water_7_12'}
                    onChange={(e) => onUpdateParams(module.id, { fluid: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded px-1.5 py-1 text-slate-200 text-[11px] font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="water_7_12">Agua 7/12°C (Chiller)</option>
                    <option value="dx_r32">Expansión Directa R32</option>
                    <option value="dx_r410a">Expansión Directa R410A</option>
                  </select>
                </div>
              </>
            )}

            {/* Heating Coil / Electric Heater */}
            {(module.type === 'heating_coil' || module.type === 'electric_heater') && (
              <>
                <CompactSliderNumber
                  label="Tbs Objetivo Calefacción"
                  value={module.params.heatingTdb ?? 16.5}
                  unit="°C"
                  min={12.0}
                  max={35.0}
                  step={0.5}
                  decimals={1}
                  colorClass="text-rose-400"
                  presets={[
                    { label: '16.5°C', value: 16.5 },
                    { label: '18°C', value: 18.0 },
                    { label: '21°C', value: 21.0 },
                    { label: '24°C', value: 24.0 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { heatingTdb: val })}
                />

                <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
                  <label className="text-[11px] text-slate-400 font-medium">Fuente de Calor</label>
                  <select
                    value={module.params.heatingSource ?? 'hot_water'}
                    onChange={(e) => onUpdateParams(module.id, { heatingSource: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded px-1.5 py-1 text-slate-200 text-[11px] font-mono focus:border-rose-400 focus:outline-none"
                  >
                    <option value="hot_water">Agua caliente 60/50°C (Caldera)</option>
                    <option value="electric_resistance">Resistencias eléctricas</option>
                    <option value="heat_pump">Gas refrigerante (Bomba calor)</option>
                  </select>
                </div>
              </>
            )}

            {/* Mixing Box */}
            {module.type === 'mixing_box' && (
              <div className="col-span-1 sm:col-span-2">
                <CompactSliderNumber
                  label={`Mezcla ODA (${((module.params.outdoorRatio ?? 0.3) * 100).toFixed(0)}% Ext / ${(100 - (module.params.outdoorRatio ?? 0.3) * 100).toFixed(0)}% Ret)`}
                  value={((module.params.outdoorRatio ?? 0.3) * 100)}
                  unit="%"
                  min={10}
                  max={100}
                  step={5}
                  decimals={0}
                  colorClass="text-amber-300"
                  presets={[
                    { label: '15% IDA3', value: 15 },
                    { label: '30% IDA2', value: 30 },
                    { label: '50%', value: 50 },
                    { label: '100% Free-Cooling', value: 100 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { outdoorRatio: val / 100 })}
                />
              </div>
            )}

            {/* Heat Recovery */}
            {(module.type === 'heat_recovery' || module.type === 'rotary_wheel') && (
              <>
                <CompactSliderNumber
                  label="Eficiencia Térmica η"
                  value={((module.params.recoveryEfficiency ?? 0.75) * 100)}
                  unit="%"
                  min={50}
                  max={90}
                  step={1}
                  decimals={0}
                  colorClass="text-sky-300"
                  presets={[
                    { label: '73% RITE mín', value: 73 },
                    { label: '78%', value: 78 },
                    { label: '82%', value: 82 },
                    { label: '86%', value: 86 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { recoveryEfficiency: val / 100 })}
                />

                <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
                  <label className="text-[11px] text-slate-400 font-medium">Tecnología Intercambio</label>
                  <select
                    value={module.params.recoveryType ?? 'plates'}
                    onChange={(e) => onUpdateParams(module.id, { recoveryType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded px-1.5 py-1 text-slate-200 text-[11px] font-mono focus:border-sky-400 focus:outline-none"
                  >
                    <option value="plates">Placas flujo cruzado (RITE)</option>
                    <option value="rotary_wheel">Rueda entálpica rotativa</option>
                  </select>
                </div>
              </>
            )}

            {/* Humidifier / Adiabatic Cooling */}
            {(module.type === 'humidifier' || module.type === 'adiabatic_cooling') && (
              <>
                <CompactSliderNumber
                  label="HR Objetivo"
                  value={module.params.targetRh ?? 50}
                  unit="%"
                  min={30}
                  max={75}
                  step={1}
                  decimals={0}
                  colorClass="text-purple-300"
                  presets={[
                    { label: '40%', value: 40 },
                    { label: '45%', value: 45 },
                    { label: '50%', value: 50 },
                    { label: '55%', value: 55 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { targetRh: val })}
                />

                <div className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5 flex flex-col justify-between">
                  <label className="text-[11px] text-slate-400 font-medium">Tipo Humidificación</label>
                  <select
                    value={module.params.humidifierType ?? 'steam'}
                    onChange={(e) => onUpdateParams(module.id, { humidifierType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded px-1.5 py-1 text-slate-200 text-[11px] font-mono focus:border-purple-400 focus:outline-none"
                  >
                    <option value="steam">Vapor seco isotérmico (T ≈ cte)</option>
                    <option value="evaporative_pad">Panel evaporativo adiabático (h ≈ cte)</option>
                  </select>
                </div>
              </>
            )}

            {/* Fan */}
            {(module.type === 'fan' || module.type === 'belt_fan' || module.type === 'return_fan') && (
              <>
                <CompactSliderNumber
                  label="Salto Térmico Rodete"
                  value={module.params.tempRise ?? 0.8}
                  unit="°C"
                  min={0.2}
                  max={2.0}
                  step={0.1}
                  decimals={1}
                  colorClass="text-emerald-400"
                  presets={[
                    { label: '+0.5°C', value: 0.5 },
                    { label: '+0.8°C', value: 0.8 },
                    { label: '+1.2°C', value: 1.2 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { tempRise: val })}
                />

                <CompactSliderNumber
                  label="Presión Estática Disponible"
                  value={module.params.staticPressurePa ?? 450}
                  unit="Pa"
                  min={150}
                  max={1200}
                  step={25}
                  decimals={0}
                  colorClass="text-emerald-300"
                  presets={[
                    { label: '300 Pa', value: 300 },
                    { label: '450 Pa', value: 450 },
                    { label: '600 Pa', value: 600 },
                    { label: '800 Pa', value: 800 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { staticPressurePa: val })}
                />
              </>
            )}

            {/* Filters */}
            {(module.type === 'prefilter' || module.type === 'prefilter_flat' || module.type === 'final_filter') && (
              <div className="col-span-1 sm:col-span-2 space-y-1 bg-slate-900/90 border border-slate-800 rounded-md p-1.5">
                <label className="text-[11px] text-slate-400 font-medium block">
                  Clase de Eficiencia de Filtración
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {(['G4', 'M5', 'F7', 'F9', 'HEPA_H13'] as const).map((fClass) => {
                    const active = (module.params.filterClass || (module.type === 'prefilter' ? 'G4' : 'F7')) === fClass;
                    return (
                      <button
                        key={fClass}
                        type="button"
                        onClick={() => onUpdateParams(module.id, { filterClass: fClass })}
                        className={`text-[10px] font-mono py-1 px-1 rounded transition-all cursor-pointer text-center ${
                          active
                            ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {fClass === 'HEPA_H13' ? 'H13' : fClass}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Intake / Exhaust Damper */}
            {(module.type === 'intake_damper' || module.type === 'exhaust_damper') && (
              <div className="col-span-1 sm:col-span-2">
                <CompactSliderNumber
                  label="Apertura Compuerta"
                  value={((module.params.outdoorRatio ?? 0.3) * 100)}
                  unit="%"
                  min={10}
                  max={100}
                  step={5}
                  decimals={0}
                  colorClass="text-emerald-400"
                  presets={[
                    { label: '20%', value: 20 },
                    { label: '30%', value: 30 },
                    { label: '50%', value: 50 },
                    { label: '100% Total', value: 100 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { outdoorRatio: val / 100 })}
                />
              </div>
            )}

            {/* Silencer */}
            {module.type === 'silencer' && (
              <div className="col-span-1 sm:col-span-2">
                <CompactSliderNumber
                  label="Atenuación Acústica Global"
                  value={module.params.attenuationDb ?? 18}
                  unit="dB"
                  min={8}
                  max={32}
                  step={1}
                  decimals={0}
                  colorClass="text-slate-200"
                  presets={[
                    { label: '12 dB', value: 12 },
                    { label: '18 dB', value: 18 },
                    { label: '24 dB', value: 24 },
                    { label: '30 dB', value: 30 },
                  ]}
                  onChange={(val) => onUpdateParams(module.id, { attenuationDb: val })}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
