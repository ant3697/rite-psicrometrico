import React, { useEffect, useRef } from 'react';
import {
  StatePoint,
  ProcessConnection,
  IsolatedProcessInfo,
} from '../types/psychrometrics';
import {
  Target,
  Maximize2,
  Crosshair,
  RotateCcw,
  Compass,
  Activity,
  Plus,
  Trash2,
  Copy,
  Sliders,
  Eye,
  EyeOff,
  AirVent,
  ArrowRight,
  Flame,
  Snowflake,
  Droplets,
  Wind,
  Layers,
  X,
} from 'lucide-react';

export interface ContextMenuTarget {
  type: 'point' | 'process' | 'canvas';
  clientX: number;
  clientY: number;
  pointId?: string;
  processId?: string;
  tdb?: number;
  w?: number;
  rh?: number;
  h?: number;
  twb?: number;
}

interface ChartContextMenuProps {
  menu: ContextMenuTarget;
  onClose: () => void;
  points: StatePoint[];
  processes: ProcessConnection[];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onCenterPoint: (tdb: number, w: number) => void;
  onCenterProcess: (p1: StatePoint, p2: StatePoint) => void;
  onZoomAll: () => void;
  onCenterCycle: () => void;
  onResetBounds: () => void;
  onAddPointAtCoordinates: (tdb: number, w: number) => void;
  onDeletePoint?: (id: string) => void;
  onDeleteProcess?: (id: string) => void;
  onDuplicatePoint?: (id: string) => void;
  isolatedProcessInfo?: IsolatedProcessInfo | null;
  onSetIsolatedProcessInfo?: (info: IsolatedProcessInfo | null) => void;
  dimOtherProcesses: boolean;
  onToggleDimOtherProcesses: () => void;
  showProtractor: boolean;
  onToggleProtractor: () => void;
  showEnthalpyDeviations: boolean;
  onToggleEnthalpyDeviations: () => void;
  onLocateModuleInAhu?: (moduleIdOrPointId: string) => void;
  isSplitView?: boolean;
}

export const ChartContextMenu: React.FC<ChartContextMenuProps> = ({
  menu,
  onClose,
  points,
  processes,
  selectedPointId,
  onSelectPoint,
  onCenterPoint,
  onCenterProcess,
  onZoomAll,
  onCenterCycle,
  onResetBounds,
  onAddPointAtCoordinates,
  onDeletePoint,
  onDeleteProcess,
  onDuplicatePoint,
  isolatedProcessInfo,
  onSetIsolatedProcessInfo,
  dimOtherProcesses,
  onToggleDimOtherProcesses,
  showProtractor,
  onToggleProtractor,
  showEnthalpyDeviations,
  onToggleEnthalpyDeviations,
  onLocateModuleInAhu,
  isSplitView,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust menu position to keep it completely within screen viewport bounds
  const menuWidth = 270;
  const menuHeight = 340;
  const adjustedX = Math.max(10, Math.min(window.innerWidth - menuWidth - 16, menu.clientX));
  const adjustedY = Math.max(10, Math.min(window.innerHeight - menuHeight - 16, menu.clientY));

  // ---------------- 1. POINT CONTEXT MENU ----------------
  if (menu.type === 'point') {
    const pt = points.find((p) => p.id === menu.pointId);
    if (!pt) return null;

    const incomingProcs = processes.filter((p) => p.toPointId === pt.id);
    const outgoingProcs = processes.filter((p) => p.fromPointId === pt.id);
    const allConnectedProcs = [...incomingProcs, ...outgoingProcs];

    return (
      <div
        ref={menuRef}
        style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
        className="fixed z-50 w-[270px] bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl p-1.5 text-xs font-primary space-y-1 animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        {/* Point Header */}
        <div className="px-2.5 py-1.5 bg-slate-900/90 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: pt.color }}
            />
            <div className="truncate">
              <span className="font-bold text-white text-[12px] truncate block font-mono">
                {pt.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {pt.tdb.toFixed(1)}°C · {pt.rh.toFixed(0)}% HR · {(pt.w * 1000).toFixed(2)} g/kg
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section 1: Isolate Processes connected to this point */}
        {allConnectedProcs.length > 0 && (
          <div className="pt-0.5 space-y-0.5 border-b border-slate-800/80 pb-1">
            <div className="px-2 py-0.5 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              <span>Aislar Transformación:</span>
            </div>
            {allConnectedProcs.map((proc) => {
              const isIso =
                isolatedProcessInfo?.process?.id === proc.id ||
                isolatedProcessInfo?.processId === proc.id;
              const otherPtId = proc.fromPointId === pt.id ? proc.toPointId : proc.fromPointId;
              const otherPt = points.find((p) => p.id === otherPtId);

              return (
                <button
                  key={proc.id}
                  onClick={() => {
                    if (isIso) {
                      if (onSetIsolatedProcessInfo) onSetIsolatedProcessInfo(null);
                    } else {
                      const ptFrom = points.find((p) => p.id === proc.fromPointId) || pt;
                      const ptTo = points.find((p) => p.id === proc.toPointId) || pt;
                      if (onSetIsolatedProcessInfo) {
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
                    }
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer ${
                    isIso
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span className="truncate">
                    {proc.fromPointId === pt.id ? 'Saliente → ' : 'Entrante ← '}
                    {otherPt ? otherPt.name : proc.name}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold ml-1 shrink-0">
                    {Math.abs(proc.qTotal).toFixed(1)} kW
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Section 2: Point Actions */}
        <div className="space-y-0.5 pt-0.5">
          {/* Center Point */}
          <button
            onClick={() => {
              onCenterPoint(pt.tdb, pt.w);
              onClose();
            }}
            className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Centrar Punto en Carta</span>
          </button>

          {/* Select Point */}
          <button
            onClick={() => {
              onSelectPoint(pt.id);
              onClose();
            }}
            className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Seleccionar y Editar Coordenadas</span>
          </button>

          {/* Locate in AHU / IDAE cut if in split view */}
          {onLocateModuleInAhu && (
            <button
              onClick={() => {
                onLocateModuleInAhu(pt.id);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-cyan-300 hover:bg-cyan-950/40 hover:text-cyan-200 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
            >
              <AirVent className="w-3.5 h-3.5 text-cyan-400" />
              <span>Localizar Sección en Corte UTA</span>
            </button>
          )}

          {/* Duplicate Point */}
          {onDuplicatePoint && (
            <button
              onClick={() => {
                onDuplicatePoint(pt.id);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>Duplicar Punto</span>
            </button>
          )}

          {/* Delete Point (if not protected) */}
          {onDeletePoint && (
            <button
              onClick={() => {
                onDeletePoint(pt.id);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Eliminar Punto</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------- 2. PROCESS CONTEXT MENU ----------------
  if (menu.type === 'process') {
    const proc = processes.find((p) => p.id === menu.processId);
    if (!proc) return null;

    const ptFrom = points.find((p) => p.id === proc.fromPointId);
    const ptTo = points.find((p) => p.id === proc.toPointId);

    const isIsolated =
      isolatedProcessInfo?.process?.id === proc.id ||
      isolatedProcessInfo?.processId === proc.id;

    const deltaT = ptFrom && ptTo ? ptTo.tdb - ptFrom.tdb : 0;
    const deltaW = ptFrom && ptTo ? (ptTo.w - ptFrom.w) * 1000 : 0;
    const deltaH = ptFrom && ptTo ? ptTo.h - ptFrom.h : 0;

    return (
      <div
        ref={menuRef}
        style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
        className="fixed z-50 w-[270px] bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl p-1.5 text-xs font-primary space-y-1.5 animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        {/* Process Header */}
        <div className="px-2.5 py-1.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-white text-[12px] font-mono truncate">
              {proc.name}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {ptFrom && ptTo && (
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span>{ptFrom.name}</span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
              <span>{ptTo.name}</span>
            </div>
          )}
        </div>

        {/* Thermodynamic Metrics Card */}
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 font-mono text-[10px] grid grid-cols-2 gap-1.5">
          <div>
            <span className="text-slate-500 block">Q Total:</span>
            <span className="text-amber-300 font-bold text-[11px]">
              {Math.abs(proc.qTotal).toFixed(1)} kW
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">SHR Sensible:</span>
            <span className="text-emerald-400 font-bold text-[11px]">
              {proc.shr !== undefined ? proc.shr.toFixed(2) : '1.00'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Salto Térmico ΔT:</span>
            <span className={deltaT < 0 ? 'text-cyan-400 font-bold' : 'text-rose-400 font-bold'}>
              {deltaT > 0 ? '+' : ''}{deltaT.toFixed(1)} °C
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Humedad Δw:</span>
            <span className={deltaW < 0 ? 'text-blue-300 font-bold' : 'text-emerald-400 font-bold'}>
              {deltaW > 0 ? '+' : ''}{deltaW.toFixed(2)} g/kg
            </span>
          </div>
          <div className="col-span-2 pt-1 border-t border-slate-800/80 flex justify-between">
            <span className="text-slate-500">Salto Entálpico Δh:</span>
            <span className="text-amber-400 font-bold">{deltaH.toFixed(1)} kJ/kg</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-0.5 pt-0.5">
          {/* Toggle Isolate Process */}
          <button
            onClick={() => {
              if (isIsolated) {
                if (onSetIsolatedProcessInfo) onSetIsolatedProcessInfo(null);
              } else if (ptFrom && ptTo) {
                if (onSetIsolatedProcessInfo) {
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
              }
              onClose();
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-mono font-bold flex items-center justify-between transition-colors cursor-pointer ${
              isIsolated
                ? 'bg-rose-950/70 border border-rose-800/70 text-rose-300'
                : 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isIsolated ? 'Quitar Aislamiento' : 'Aislar Transformación'}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {isIsolated ? 'Ver Todo' : 'ΔT + Δw'}
            </span>
          </button>

          {/* Toggle Dimming */}
          {isIsolated && (
            <button
              onClick={() => {
                onToggleDimOtherProcesses();
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              {dimOtherProcesses ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{dimOtherProcesses ? 'Solo este proceso (Ocultar demás)' : 'Ver resto del ciclo atenuado'}</span>
            </button>
          )}

          {/* Center on this process */}
          {ptFrom && ptTo && (
            <button
              onClick={() => {
                onCenterProcess(ptFrom, ptTo);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Centrar Transformación en Carta</span>
            </button>
          )}

          {/* Delete Process */}
          {onDeleteProcess && (
            <button
              onClick={() => {
                onDeleteProcess(proc.id);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Eliminar Transformación</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------- 3. CANVAS BACKGROUND CONTEXT MENU ----------------
  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-[270px] bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl p-1.5 text-xs font-primary space-y-1 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Thermodynamic cursor status */}
      {menu.tdb !== undefined && menu.w !== undefined && (
        <div className="px-2.5 py-1.5 bg-slate-900/90 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Coordenadas del Cursor:
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] font-mono text-slate-200 font-bold mt-0.5">
            Tbs = {menu.tdb.toFixed(1)} °C · HR = {menu.rh !== undefined ? menu.rh.toFixed(0) : '--'}%
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            w = {(menu.w * 1000).toFixed(2)} g/kg · h = {menu.h !== undefined ? menu.h.toFixed(1) : '--'} kJ/kg
          </div>
        </div>
      )}

      {/* Actions list */}
      <div className="space-y-0.5 pt-0.5">
        {menu.tdb !== undefined && menu.w !== undefined && (
          <button
            onClick={() => {
              onAddPointAtCoordinates(menu.tdb!, menu.w!);
              onClose();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] text-amber-300 font-bold hover:bg-amber-950/50 hover:text-amber-200 flex items-center gap-2 transition-colors cursor-pointer border border-amber-800/40 bg-amber-950/20"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Añadir Punto de Estado Aquí</span>
          </button>
        )}

        <button
          onClick={() => {
            onZoomAll();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Ajustar Carta al Ciclo (Zoom Fit)</span>
        </button>

        <button
          onClick={() => {
            onCenterCycle();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Centrar Ciclo</span>
        </button>

        <button
          onClick={() => {
            onResetBounds();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Restablecer Diagrama Estándar 1:1 (-10 a 55°C)</span>
        </button>

        <div className="h-[1px] bg-slate-800 my-1" />

        <button
          onClick={() => {
            onToggleProtractor();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showProtractor ? 'Ocultar' : 'Mostrar'} Transportador SHR</span>
        </button>

        <button
          onClick={() => {
            onToggleEnthalpyDeviations();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>{showEnthalpyDeviations ? 'Ocultar' : 'Mostrar'} Curvas Desviación Δh</span>
        </button>

        {isolatedProcessInfo && (
          <button
            onClick={() => {
              if (onSetIsolatedProcessInfo) onSetIsolatedProcessInfo(null);
              onClose();
            }}
            className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-rose-300 font-bold hover:bg-rose-950/60 hover:text-rose-200 flex items-center gap-2 transition-colors cursor-pointer pt-1 border-t border-slate-800"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Ver Ciclo Completo (Quitar Aislamiento)</span>
          </button>
        )}
      </div>
    </div>
  );
};
