import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StatePoint, UnitSystem, PsychroParamKey } from '../types/psychrometrics';
import { calculateFangerPMV, UnitConvert, isPointInASHRAE55Comfort, PARAM_LABELS_ES } from '../utils/psychrolib';
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
  Eye,
  EyeOff,
  Trash2,
  Thermometer,
  Droplets,
  Activity,
  Wind,
  Layers,
  Sparkles,
  Pin,
  Edit2,
  Check,
} from 'lucide-react';

interface FloatingPointWindowProps {
  point: StatePoint;
  allPoints?: StatePoint[];
  onSelectPoint?: (id: string) => void;
  onClose: () => void;
  onToggleHidePoint?: (id: string) => void;
  onDeletePoint?: (id: string) => void;
  onToggleFixParam?: (pointId: string, param: PsychroParamKey) => void;
  onClearFixedParams?: (pointId: string) => void;
  onCommitParamValue?: (pointId: string, param: PsychroParamKey, val: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  units?: UnitSystem;
  storageKey?: string;
  defaultPosition?: { x: number; y: number };
}

export const FloatingPointWindow: React.FC<FloatingPointWindowProps> = ({
  point,
  allPoints = [],
  onSelectPoint,
  onClose,
  onToggleHidePoint,
  onDeletePoint,
  onToggleFixParam,
  onClearFixedParams,
  onCommitParamValue,
  containerRef,
  units = 'SI',
  storageKey = 'psychro_point_window_pos',
  defaultPosition,
}) => {
  // Window states: 'normal' | 'minimized' | 'maximized'
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Inline numeric edit state
  const [editingParam, setEditingParam] = useState<PsychroParamKey | null>(null);
  const [editVal, setEditVal] = useState<string>('');

  // Position on chart canvas
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return defaultPosition || { x: 20, y: 120 };
  });

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const windowRef = useRef<HTMLDivElement>(null);

  // Clamp position inside container
  const clampPosition = useCallback(
    (x: number, y: number) => {
      const container = containerRef?.current;
      const windowEl = windowRef.current;
      if (!container || !windowEl) return { x, y };

      const containerRect = container.getBoundingClientRect();
      const windowRect = windowEl.getBoundingClientRect();

      const minX = 8;
      const minY = 8;
      const maxX = Math.max(minX, containerRect.width - windowRect.width - 8);
      const maxY = Math.max(minY, containerRect.height - windowRect.height - 8);

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    },
    [containerRef]
  );

  // Handle drag start
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent dragging when clicking interactive buttons
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    const newX = dragStartRef.current.startX + dx;
    const newY = dragStartRef.current.startY + dy;

    const clamped = clampPosition(newX, newY);
    setPosition(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch {
        // ignore
      }
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Keep inside bounds on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Calculated thermal comfort estimate (Fanger PMV & PPD)
  const fangerEstimate = calculateFangerPMV(point.tdb, point.rh, point.tdb, 0.15, 1.2, 0.5);
  const isAshraeSummer = isPointInASHRAE55Comfort(point.tdb, point.w, 'summer');
  const isAshraeWinter = isPointInASHRAE55Comfort(point.tdb, point.w, 'winter');

  return (
    <div
      ref={windowRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      className={`absolute top-0 left-0 z-30 transition-shadow select-none ${
        isMaximized
          ? 'w-[440px] max-w-[94vw]'
          : isMinimized
          ? 'w-auto min-w-[280px] max-w-md'
          : 'w-[370px] max-w-[92vw]'
      }`}
    >
      <div
        className={`bg-slate-950/95 backdrop-blur-md rounded-2xl border transition-all shadow-2xl text-xs overflow-hidden ${
          isDragging ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)]' : 'border-amber-400/50'
        }`}
      >
        {/* Window Title Bar & Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`px-3 py-2 bg-gradient-to-r from-slate-900/90 to-slate-950/90 border-b border-white/10 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          title="Arrastra para mover la ventana por el área del gráfico"
        >
          {/* Left: Drag grip, Point Color, Title & Live Summary */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 shrink-0" />
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: point.color }}
            />
            <div className="truncate flex items-center gap-1.5 font-bold text-amber-300 min-w-0">
              <span className="truncate">{point.name}</span>
              {point.hidden && (
                <span className="text-[9.5px] font-mono text-amber-400 bg-amber-400/15 px-1 rounded border border-amber-400/30 shrink-0">
                  Etiquetas ocultas
                </span>
              )}
              {isMinimized ? (
                <span className="text-[10px] text-emerald-400 font-mono bg-black/50 px-1.5 py-0.5 rounded border border-emerald-500/30 truncate">
                  {units === 'IP'
                    ? `${UnitConvert.cToF(point.tdb).toFixed(1)}°F · ${point.rh.toFixed(0)}%`
                    : `${point.tdb.toFixed(1)}°C · ${point.rh.toFixed(0)}% · ${point.h.toFixed(1)} kJ/kg`}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-normal hidden sm:inline shrink-0">
                  · Propiedades
                </span>
              )}
            </div>
          </div>

          {/* Right: Window Controls (Ocultar/Mostrar Etiquetas de Valores, Eliminar, Minimizar, Maximizar, Cerrar) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Ocultar / Mostrar Etiquetas de Valores sobre el Diagrama */}
            {onToggleHidePoint && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHidePoint(point.id);
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  point.hidden
                    ? 'text-amber-400 bg-amber-400/20 hover:bg-amber-400/30 ring-1 ring-amber-400/40'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-white/10'
                }`}
                title={point.hidden ? 'Mostrar etiquetas de valores en el diagrama' : 'Ocultar etiquetas de valores sobre el diagrama'}
              >
                {point.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Eliminar Punto del Gráfico */}
            {onDeletePoint && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePoint(point.id);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                title="Eliminar punto del gráfico"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Separator */}
            <span className="w-px h-3.5 bg-white/15 mx-0.5 shrink-0" />

            {/* Minimizar / Restaurar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized((prev) => !prev);
                if (isMaximized) setIsMaximized(false);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isMinimized
                  ? 'text-amber-300 bg-amber-400/20'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
              }`}
              title={isMinimized ? 'Restaurar tamaño' : 'Minimizar ventana'}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Maximizar / Normal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized((prev) => !prev);
                if (isMinimized) setIsMinimized(false);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isMaximized
                  ? 'text-amber-300 bg-amber-400/20'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
              }`}
              title={isMaximized ? 'Restaurar tamaño estándar' : 'Maximizar ventana (análisis extendido)'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Cerrar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer ml-0.5"
              title="Cerrar ventana de puntos"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Point Switcher Tabs (Shown when multiple points exist and not minimized) */}
        {allPoints.length > 1 && !isMinimized && (
          <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto text-[10px]">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">Puntos:</span>
              <div className="flex items-center gap-1">
                {allPoints.map((p) => {
                  const isSelected = p.id === point.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPoint && onSelectPoint(p.id);
                      }}
                      className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-black shadow-sm font-extrabold'
                          : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                      title={`Ver punto ${p.name}${p.hidden ? ' (Oculto)' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/20" style={{ backgroundColor: p.color }} />
                      <span>{p.name.split(':')[0]}</span>
                      {p.hidden && <EyeOff className="w-2.5 h-2.5 opacity-60 text-slate-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Window Body: Not rendered when minimized */}
        {!isMinimized && (() => {
          const isFixed = (param: PsychroParamKey) => point.fixedParams?.includes(param) ?? false;

          const handleCommit = (param: PsychroParamKey, raw: string) => {
            const clean = raw.trim().replace(',', '.');
            const val = parseFloat(clean);
            if (!isNaN(val) && isFinite(val) && onCommitParamValue) {
              onCommitParamValue(point.id, param, val);
            }
            setEditingParam(null);
          };

          return (
            <div className="p-3 space-y-2">
              {/* Pinned parameters banner */}
              {point.fixedParams && point.fixedParams.length > 0 && (
                <div className="bg-amber-500/15 border border-amber-400/40 rounded-lg px-2 py-1 flex items-center justify-between text-[10px] text-amber-200 font-mono">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="truncate">
                      <strong>{point.fixedParams.length} {point.fixedParams.length === 1 ? 'parámetro fijado' : 'parámetros fijados'}:</strong>{' '}
                      {point.fixedParams.map((k) => PARAM_LABELS_ES[k]?.short).join(' y ')}
                    </span>
                  </div>
                  {onClearFixedParams && (
                    <button
                      type="button"
                      onClick={() => onClearFixedParams(point.id)}
                      className="text-amber-300 hover:text-white underline text-[9.5px] cursor-pointer ml-1 shrink-0"
                    >
                      Desfijar
                    </button>
                  )}
                </div>
              )}

              {/* 7 Core Psychrometric Properties Grid (Matching Exactly User Image) */}
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                {/* 1. Tbs */}
                <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all ${
                  isFixed('tdb')
                    ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/50'
                    : 'bg-black/50 border-amber-400/30'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 font-bold">1. Tbs:</span>
                    {onToggleFixParam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFixParam(point.id, 'tdb');
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isFixed('tdb')
                            ? 'text-amber-300 bg-amber-400/30'
                            : 'text-slate-500 hover:text-amber-300'
                        }`}
                        title={isFixed('tdb') ? 'Tbs fijado constante (clic para desfijar)' : 'Fijar Tbs constante'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed('tdb') ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    )}
                  </div>
                  {editingParam === 'tdb' ? (
                    <input
                      type="number"
                      step="0.1"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommit('tdb', editVal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommit('tdb', editVal);
                        if (e.key === 'Escape') setEditingParam(null);
                      }}
                      className="w-16 px-1 py-0 text-right bg-black border border-amber-400 rounded text-amber-300 text-[11px] font-bold outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (onCommitParamValue) {
                          setEditingParam('tdb');
                          setEditVal(point.tdb.toFixed(1));
                        }
                      }}
                      className={`text-white font-bold ${onCommitParamValue ? 'cursor-pointer hover:text-amber-300 hover:underline' : ''}`}
                      title={onCommitParamValue ? 'Clic para editar numéricamente' : undefined}
                    >
                      {units === 'IP' ? `${UnitConvert.cToF(point.tdb).toFixed(1)} °F` : `${point.tdb.toFixed(1)} °C`}
                    </span>
                  )}
                </div>

                {/* 2. HR */}
                <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all ${
                  isFixed('rh')
                    ? 'bg-rose-500/15 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)] ring-1 ring-rose-400/50'
                    : 'bg-black/50 border-rose-400/40'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="text-rose-400 font-bold" title="Humedad Relativa (HR)">2. HR:</span>
                    {onToggleFixParam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFixParam(point.id, 'rh');
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isFixed('rh')
                            ? 'text-rose-300 bg-rose-400/30'
                            : 'text-slate-500 hover:text-rose-300'
                        }`}
                        title={isFixed('rh') ? 'HR fijada constante (clic para desfijar)' : 'Fijar HR constante'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed('rh') ? 'fill-rose-400 text-rose-400' : ''}`} />
                      </button>
                    )}
                  </div>
                  {editingParam === 'rh' ? (
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="100"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommit('rh', editVal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommit('rh', editVal);
                        if (e.key === 'Escape') setEditingParam(null);
                      }}
                      className="w-16 px-1 py-0 text-right bg-black border border-rose-400 rounded text-rose-300 text-[11px] font-bold outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (onCommitParamValue) {
                          setEditingParam('rh');
                          setEditVal(point.rh.toFixed(1));
                        }
                      }}
                      className={`text-rose-300 font-bold ${onCommitParamValue ? 'cursor-pointer hover:underline' : ''}`}
                      title={onCommitParamValue ? 'Clic para editar numéricamente' : undefined}
                    >
                      {point.rh.toFixed(1)} %
                    </span>
                  )}
                </div>

                {/* 3. h (Entalpía) */}
                <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all ${
                  isFixed('h')
                    ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400/50'
                    : 'bg-black/50 border-emerald-400/40'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold" title="Entalpía específica (h)">3. h:</span>
                    {onToggleFixParam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFixParam(point.id, 'h');
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isFixed('h')
                            ? 'text-emerald-300 bg-emerald-400/30'
                            : 'text-slate-500 hover:text-emerald-300'
                        }`}
                        title={isFixed('h') ? 'Entalpía h fijada constante (clic para desfijar)' : 'Fijar Entalpía h constante'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed('h') ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                      </button>
                    )}
                  </div>
                  {editingParam === 'h' ? (
                    <input
                      type="number"
                      step="0.5"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommit('h', editVal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommit('h', editVal);
                        if (e.key === 'Escape') setEditingParam(null);
                      }}
                      className="w-16 px-1 py-0 text-right bg-black border border-emerald-400 rounded text-emerald-300 text-[11px] font-bold outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (onCommitParamValue) {
                          setEditingParam('h');
                          setEditVal(point.h.toFixed(1));
                        }
                      }}
                      className={`text-emerald-300 font-bold ${onCommitParamValue ? 'cursor-pointer hover:underline' : ''}`}
                      title={onCommitParamValue ? 'Clic para editar numéricamente' : undefined}
                    >
                      {units === 'IP' ? `${UnitConvert.kJkgToBtuLb(point.h).toFixed(1)} BTU/lb` : `${point.h.toFixed(1)} kJ/kg`}
                    </span>
                  )}
                </div>

                {/* 4. w (Humedad específica) */}
                <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all ${
                  isFixed('w')
                    ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/50'
                    : 'bg-black/50 border-sky-400/30'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="text-sky-400 font-bold" title="Humedad específica (w)">4. w:</span>
                    {onToggleFixParam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFixParam(point.id, 'w');
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isFixed('w')
                            ? 'text-sky-300 bg-sky-400/30'
                            : 'text-slate-500 hover:text-sky-300'
                        }`}
                        title={isFixed('w') ? 'Humedad w fijada constante (clic para desfijar)' : 'Fijar Humedad w constante'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed('w') ? 'fill-sky-400 text-sky-400' : ''}`} />
                      </button>
                    )}
                  </div>
                  {editingParam === 'w' ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="35"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommit('w', (parseFloat(editVal) / 1000).toString())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommit('w', (parseFloat(editVal) / 1000).toString());
                        if (e.key === 'Escape') setEditingParam(null);
                      }}
                      className="w-16 px-1 py-0 text-right bg-black border border-sky-400 rounded text-sky-300 text-[11px] font-bold outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (onCommitParamValue) {
                          setEditingParam('w');
                          setEditVal((point.w * 1000).toFixed(2));
                        }
                      }}
                      className={`text-white font-bold ${onCommitParamValue ? 'cursor-pointer hover:text-sky-300 hover:underline' : ''}`}
                      title={onCommitParamValue ? 'Clic para editar numéricamente' : undefined}
                    >
                      {units === 'IP' ? `${(point.w * 7000).toFixed(1)} gr/lb` : `${(point.w * 1000).toFixed(2)} g/kg`}
                    </span>
                  )}
                </div>

                {/* 5. Tbh (Bulbo húmedo) */}
                <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all ${
                  isFixed('twb')
                    ? 'bg-purple-500/15 border-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.2)] ring-1 ring-purple-400/50'
                    : 'bg-black/50 border-purple-400/40'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="text-purple-400 font-bold">5. Tbh:</span>
                    {onToggleFixParam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFixParam(point.id, 'twb');
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isFixed('twb')
                            ? 'text-purple-300 bg-purple-400/30'
                            : 'text-slate-500 hover:text-purple-300'
                        }`}
                        title={isFixed('twb') ? 'Tbh fijada constante (clic para desfijar)' : 'Fijar Tbh constante'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed('twb') ? 'fill-purple-400 text-purple-400' : ''}`} />
                      </button>
                    )}
                  </div>
                  {editingParam === 'twb' ? (
                    <input
                      type="number"
                      step="0.1"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommit('twb', editVal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommit('twb', editVal);
                        if (e.key === 'Escape') setEditingParam(null);
                      }}
                      className="w-16 px-1 py-0 text-right bg-black border border-purple-400 rounded text-purple-300 text-[11px] font-bold outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (onCommitParamValue) {
                          setEditingParam('twb');
                          setEditVal(point.twb.toFixed(1));
                        }
                      }}
                      className={`text-purple-300 font-bold ${onCommitParamValue ? 'cursor-pointer hover:underline' : ''}`}
                      title={onCommitParamValue ? 'Clic para editar numéricamente' : undefined}
                    >
                      {units === 'IP' ? `${UnitConvert.cToF(point.twb).toFixed(1)} °F` : `${point.twb.toFixed(1)} °C`}
                    </span>
                  )}
                </div>

                {/* 6. Tpr (Punto de rocío) */}
                <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all ${
                  isFixed('tdp')
                    ? 'bg-teal-500/15 border-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.2)] ring-1 ring-teal-400/50'
                    : 'bg-black/50 border-teal-400/40'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="text-teal-400 font-bold">6. Tpr:</span>
                    {onToggleFixParam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFixParam(point.id, 'tdp');
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isFixed('tdp')
                            ? 'text-teal-300 bg-teal-400/30'
                            : 'text-slate-500 hover:text-teal-300'
                        }`}
                        title={isFixed('tdp') ? 'Tpr fijada constante (clic para desfijar)' : 'Fijar Tpr constante'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed('tdp') ? 'fill-teal-400 text-teal-400' : ''}`} />
                      </button>
                    )}
                  </div>
                  {editingParam === 'tdp' ? (
                    <input
                      type="number"
                      step="0.1"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommit('tdp', editVal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommit('tdp', editVal);
                        if (e.key === 'Escape') setEditingParam(null);
                      }}
                      className="w-16 px-1 py-0 text-right bg-black border border-teal-400 rounded text-teal-300 text-[11px] font-bold outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (onCommitParamValue) {
                          setEditingParam('tdp');
                          setEditVal(point.tdp.toFixed(1));
                        }
                      }}
                      className={`text-teal-300 font-bold ${onCommitParamValue ? 'cursor-pointer hover:underline' : ''}`}
                      title={onCommitParamValue ? 'Clic para editar numéricamente' : undefined}
                    >
                      {units === 'IP' ? `${UnitConvert.cToF(point.tdp).toFixed(1)} °F` : `${point.tdp.toFixed(1)} °C`}
                    </span>
                  )}
                </div>

                {/* 7. Volumen específico v y Densidad ρ */}
                <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all col-span-2 ${
                  isFixed('v')
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/50'
                    : 'bg-black/50 border-cyan-400/30'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="text-cyan-400 font-bold" title="Volumen específico (v)">7. v:</span>
                    {onToggleFixParam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFixParam(point.id, 'v');
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isFixed('v')
                            ? 'text-cyan-300 bg-cyan-400/30'
                            : 'text-slate-500 hover:text-cyan-300'
                        }`}
                        title={isFixed('v') ? 'Volumen v fijado constante (clic para desfijar)' : 'Fijar Volumen v constante'}
                      >
                        <Pin className={`w-2.5 h-2.5 ${isFixed('v') ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                      </button>
                    )}
                  </div>
                  {editingParam === 'v' ? (
                    <input
                      type="number"
                      step="0.001"
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => handleCommit('v', editVal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommit('v', editVal);
                        if (e.key === 'Escape') setEditingParam(null);
                      }}
                      className="w-20 px-1 py-0 text-right bg-black border border-cyan-400 rounded text-cyan-300 text-[11px] font-bold outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (onCommitParamValue) {
                          setEditingParam('v');
                          setEditVal(point.v.toFixed(3));
                        }
                      }}
                      className={`text-white font-bold ${onCommitParamValue ? 'cursor-pointer hover:text-cyan-300 hover:underline' : ''}`}
                      title={onCommitParamValue ? 'Clic para editar numéricamente' : undefined}
                    >
                      {units === 'IP'
                        ? `${(point.v * 16.0185).toFixed(2)} ft³/lb · ρ = ${(point.rho / 16.0185).toFixed(3)} lb/ft³`
                        : `${point.v.toFixed(3)} m³/kg · ρ = ${point.rho.toFixed(2)} kg/m³`}
                    </span>
                  )}
                </div>
              </div>

            {/* Extended Technical Analytics (Shown in Maximized Mode) */}
            {isMaximized && (
              <div className="pt-2 border-t border-white/10 space-y-2 font-mono text-[11px] animate-fadeIn">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Presión de Vapor (Pv):</span>
                    <span className="text-white font-bold">{point.pv.toFixed(3)} kPa</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Presión Sat. (Pws):</span>
                    <span className="text-white font-bold">{(point.pv / Math.max(0.01, point.rh / 100)).toFixed(3)} kPa</span>
                  </div>
                </div>

                {/* Thermal Comfort Fanger audit preview */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-indigo-500/30 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-indigo-300 font-bold">
                    <span>Evaluación ISO 7730 / ASHRAE 55:</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9.5px] ${
                        fangerEstimate.category === 'Cat I'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : fangerEstimate.category === 'Cat II'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : fangerEstimate.category === 'Cat III'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {fangerEstimate.category}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-slate-400">Voto Medio Estimado (PMV):</span>
                    <strong className="text-amber-300">{fangerEstimate.pmv.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-slate-400">Porcentaje Insatisfechos (PPD):</span>
                    <strong className="text-rose-300">{fangerEstimate.ppd.toFixed(1)} %</strong>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] pt-1 border-t border-white/5">
                    <span className="text-slate-400">Confort ASHRAE 55:</span>
                    <div className="flex items-center gap-1 font-sans">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                          isAshraeSummer
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/5 text-slate-500 border border-white/10'
                        }`}
                        title={isAshraeSummer ? 'Cumple ASHRAE 55 en Verano (0.5 clo)' : 'Fuera de zona verano'}
                      >
                        Verano {isAshraeSummer ? '✓' : '✗'}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                          isAshraeWinter
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-white/5 text-slate-500 border border-white/10'
                        }`}
                        title={isAshraeWinter ? 'Cumple ASHRAE 55 en Invierno (1.0 clo)' : 'Fuera de zona invierno'}
                      >
                        Invierno {isAshraeWinter ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Point Mass Flow if available */}
                {point.massFlow !== undefined && point.massFlow > 0 && (
                  <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded-lg border border-white/5 text-[10.5px]">
                    <span className="text-slate-400">Caudal Másico / Volumétrico:</span>
                    <span className="text-amber-300 font-bold">
                      {point.massFlow.toFixed(3)} kg/s ({point.volumeFlow?.toFixed(0) ?? 0} m³/h)
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
      </div>
    </div>
  );
};
