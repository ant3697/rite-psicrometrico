import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChartLayerVisibility } from '../types/psychrometrics';
import {
  Layers,
  X,
  Minus,
  Maximize2,
  GripHorizontal,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  CheckSquare,
  Square,
  Compass,
} from 'lucide-react';

interface FloatingLayersWindowProps {
  layers: ChartLayerVisibility;
  onToggleLayer: (layer: keyof ChartLayerVisibility) => void;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  defaultPosition?: { x: number; y: number };
}

export const FloatingLayersWindow: React.FC<FloatingLayersWindowProps> = ({
  layers,
  onToggleLayer,
  onClose,
  containerRef,
  defaultPosition,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'psychro' | 'analysis' | 'comfort'>('all');

  const storageKey = 'psychro_layers_window_pos';
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
    return defaultPosition || { x: 24, y: 56 };
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const windowRef = useRef<HTMLDivElement>(null);

  // Clamp position within chart container
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, a, label')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    const newX = dragStartRef.current.startX + dx;
    const newY = dragStartRef.current.startY + dy;
    setPosition(clampPosition(newX, newY));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(position));
    } catch {
      // ignore
    }
  };

  // Keep inside container on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Count active layers
  const activeCount = Object.entries(layers).filter(([key, val]) => {
    if (key === 'comfortEnSeason') return false;
    return Boolean(val);
  }).length;

  return (
    <div
      ref={windowRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className={`absolute z-50 top-0 left-0 transition-shadow select-none duration-75 ${
        isDragging ? 'shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-2 ring-amber-400/50' : 'shadow-2xl'
      }`}
    >
      <div className="w-84 sm:w-96 rounded-xl border border-white/15 bg-[#0f172a]/95 backdrop-blur-xl text-white overflow-hidden flex flex-col font-sans">
        {/* Window Title Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`px-3 py-2 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950/95 border-b border-white/10 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          title="Arrastra para desplazar la ventana de capas por el gráfico"
        >
          {/* Left Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 shrink-0" />
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Capas del Diagrama</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
              {activeCount} activas
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Minimizar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized((prev) => !prev);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isMinimized
                  ? 'text-amber-300 bg-amber-400/20'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
              }`}
              title={isMinimized ? 'Restaurar ventana' : 'Minimizar ventana'}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Cerrar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer ml-0.5"
              title="Cerrar ventana de capas"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized View Header Pill */}
        {isMinimized && (
          <div
            onClick={() => setIsMinimized(false)}
            className="p-2 bg-black/60 text-xs flex items-center justify-between cursor-pointer hover:bg-black/80 transition-colors"
          >
            <span className="text-slate-400 text-[11px]">Haz clic para desplegar los controles de capas</span>
            <span className="text-amber-400 font-bold text-[11px] underline">Abrir</span>
          </div>
        )}

        {/* Window Body (When Not Minimized) */}
        {!isMinimized && (
          <div className="flex flex-col max-h-[75vh] sm:max-h-[80vh] overflow-hidden">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-1.5 bg-black/40 border-b border-white/5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                  activeCategory === 'all'
                    ? 'bg-amber-400 text-black shadow font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('psychro')}
                className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                  activeCategory === 'psychro'
                    ? 'bg-amber-400 text-black shadow font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Curvas
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('analysis')}
                className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                  activeCategory === 'analysis'
                    ? 'bg-amber-400 text-black shadow font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Análisis
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('comfort')}
                className={`flex-1 py-1 px-2 rounded-md font-semibold transition-all cursor-pointer text-center ${
                  activeCategory === 'comfort'
                    ? 'bg-amber-400 text-black shadow font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Confort
              </button>
            </div>

            {/* Scrollable Layers List */}
            <div className="p-3 overflow-y-auto space-y-3 divide-y divide-white/5 text-xs">
              {/* 1. Curvas Psicrométricas */}
              {(activeCategory === 'all' || activeCategory === 'psychro') && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 font-mono flex items-center gap-1">
                    <span>Curvas y Escalas Psicrométricas</span>
                  </span>
                  <div className="space-y-1">
                    {[
                      { key: 'rhCurves', label: 'Curvas de Humedad Relativa (10% - 90%)', color: 'text-sky-400' },
                      { key: 'twbLines', label: 'Líneas de Bulbo Húmedo (Tbh)', color: 'text-blue-400' },
                      { key: 'enthalpyLines', label: 'Líneas de Entalpía Específica (h)', color: 'text-emerald-400' },
                      { key: 'satEnthalpyScale', label: 'Escala Perimetral de Entalpía de Saturación', color: 'text-emerald-300' },
                      { key: 'volumeLines', label: 'Líneas de Volumen Específico (v)', color: 'text-indigo-400' },
                      { key: 'grid', label: 'Rejilla Ortogonal (Tbs / W)', color: 'text-slate-300' },
                      { key: 'satTempScale', label: 'Graduaciones Temp. Saturación en Curva', color: 'text-cyan-300' },
                      { key: 'enthalpyDeviations', label: 'Curvas de Desviación de Entalpía ASHRAE', color: 'text-amber-300' },
                    ].map(({ key, label, color }) => {
                      const active = Boolean(layers[key as keyof ChartLayerVisibility]);
                      return (
                        <label
                          key={key}
                          className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/15 cursor-pointer hover:bg-white/5 transition-all"
                        >
                          <span className={`text-[11.5px] font-medium ${color}`}>{label}</span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => onToggleLayer(key as keyof ChartLayerVisibility)}
                            className="w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Elementos de Análisis y Etiquetas */}
              {(activeCategory === 'all' || activeCategory === 'analysis') && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 font-mono flex items-center gap-1">
                    <span>Etiquetas y Herramientas de Análisis</span>
                  </span>
                  <div className="space-y-1">
                    {[
                      { key: 'pointLabels', label: 'Etiquetas de Nombres de Puntos (P1, P2...)', color: 'text-amber-300' },
                      { key: 'processes', label: 'Vectores y Procesos de Climatización', color: 'text-cyan-400' },
                      { key: 'shrProtractor', label: 'Transportador ASHRAE (FCS / SHR y ADP)', color: 'text-amber-400' },
                      { key: 'allReferenceRays', label: 'Haz Completo de Referencia ASHRAE (0.00-1.00)', color: 'text-amber-200' },
                      { key: 'shfScale', label: 'Escala Vertical Derecha FCS / SHR', color: 'text-orange-400' },
                      { key: 'oversaturatedZone', label: 'Zona Supersaturada / Niebla (W > Wsat)', color: 'text-sky-300' },
                    ].map(({ key, label, color }) => {
                      const active = Boolean(layers[key as keyof ChartLayerVisibility]);
                      return (
                        <label
                          key={key}
                          className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/15 cursor-pointer hover:bg-white/5 transition-all"
                        >
                          <span className={`text-[11.5px] font-medium ${color}`}>{label}</span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => onToggleLayer(key as keyof ChartLayerVisibility)}
                            className="w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Confort Térmico */}
              {(activeCategory === 'all' || activeCategory === 'comfort') && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400/90 font-mono">
                      Envolventes de Confort
                    </span>
                    {/* Season switcher */}
                    <div className="flex bg-black/60 p-0.5 rounded border border-white/10 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (layers.comfortEnSeason !== 'summer') onToggleLayer('comfortEnSeason' as any);
                        }}
                        className={`px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                          layers.comfortEnSeason === 'summer'
                            ? 'bg-amber-400 text-black font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Verano
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (layers.comfortEnSeason !== 'winter') onToggleLayer('comfortEnSeason' as any);
                        }}
                        className={`px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                          layers.comfortEnSeason === 'winter'
                            ? 'bg-amber-400 text-black font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Invierno
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {[
                      {
                        key: 'comfortEnCat1',
                        label: 'Cat. I - Alta exigencia (PPD < 6%, PMV ±0.2)',
                        badge: 'Hospitales / Guarderías',
                        color: 'text-purple-300',
                      },
                      {
                        key: 'comfortEnCat2',
                        label: 'Cat. II - Normal / RITE (PPD < 10%, PMV ±0.5)',
                        badge: 'Estándar Edificios Nuevos',
                        color: 'text-cyan-300',
                      },
                      {
                        key: 'comfortEnCat3',
                        label: 'Cat. III - Moderada (PPD < 15%, PMV ±0.7)',
                        badge: 'Edificios Existentes',
                        color: 'text-blue-300',
                      },
                      {
                        key: 'comfortSummer',
                        label: 'Envolvente ASHRAE 55 Verano',
                        badge: '0.5 clo',
                        color: 'text-amber-300',
                      },
                      {
                        key: 'comfortWinter',
                        label: 'Envolvente ASHRAE 55 Invierno',
                        badge: '1.0 clo',
                        color: 'text-sky-300',
                      },
                    ].map(({ key, label, badge, color }) => {
                      const active = Boolean(layers[key as keyof ChartLayerVisibility]);
                      return (
                        <label
                          key={key}
                          className="flex flex-col p-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/15 cursor-pointer hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[11.5px] font-medium ${color}`}>{label}</span>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => onToggleLayer(key as keyof ChartLayerVisibility)}
                              className="w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer shrink-0 ml-2"
                            />
                          </div>
                          <span className="text-[9.5px] text-slate-400 mt-0.5">{badge}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <span className="text-[10px] text-slate-400 font-mono">
                Actualizado en tiempo real
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-md bg-amber-400 text-black font-bold hover:bg-amber-300 transition-colors cursor-pointer text-xs"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
