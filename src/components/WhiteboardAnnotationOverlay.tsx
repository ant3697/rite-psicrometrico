import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Zap,
  Eraser,
  Undo2,
  Trash2,
  Maximize,
  Minimize,
  MousePointer,
  Minus,
  MoveRight,
  Sparkles,
  Compass,
  ArrowUpDown,
  X,
} from 'lucide-react';

export type WhiteboardTool = 'pointer' | 'pen' | 'line' | 'arrow' | 'highlighter' | 'laser' | 'eraser';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  id: string;
  tool: 'pen' | 'line' | 'arrow' | 'highlighter';
  color: string;
  width: number;
  points: StrokePoint[];
}

export interface WhiteboardAnnotationOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isProjectorHighContrast?: boolean;
  onToggleProjectorHighContrast?: () => void;
  className?: string;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const WhiteboardAnnotationOverlay: React.FC<WhiteboardAnnotationOverlayProps> = ({
  containerRef,
  isProjectorHighContrast = false,
  onToggleProjectorHighContrast,
  className = '',
  onClose,
  isFullscreen: isFullscreenProp,
  onToggleFullscreen,
}) => {
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pointer');
  const [selectedColor, setSelectedColor] = useState<string>('#F59E0B'); // Bright Amber
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<WhiteboardStroke | null>(null);
  const [isOrthoSnapEnabled, setIsOrthoSnapEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);
  const [dockPosition, setDockPosition] = useState<'top' | 'bottom'>('top');
  const [laserPoint, setLaserPoint] = useState<{ x: number; y: number } | null>(null);

  const svgOverlayRef = useRef<SVGSVGElement | null>(null);
  const laserTimerRef = useRef<number | null>(null);

  // Monitor fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  }, [containerRef]);

  // Convert client coordinates to overlay SVG coordinates
  const getCoordinates = (e: React.PointerEvent<SVGSVGElement>): StrokePoint | null => {
    if (!svgOverlayRef.current) return null;
    const rect = svgOverlayRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Orthogonal Snapping helper for straight lines & arrows
  const applyOrthoSnap = (start: StrokePoint, rawEnd: StrokePoint, forceOrtho: boolean): StrokePoint => {
    if (!forceOrtho) return rawEnd;
    const dx = rawEnd.x - start.x;
    const dy = rawEnd.y - start.y;
    // Calculate angle in degrees
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    const absDeg = Math.abs(angleDeg);

    // Snap to pure horizontal (0 or 180 deg) or vertical (90 deg) or 45 deg
    if (absDeg <= 22.5 || absDeg >= 157.5) {
      // Horizontal (w = cte)
      return { x: rawEnd.x, y: start.y };
    } else if (absDeg >= 67.5 && absDeg <= 112.5) {
      // Vertical (Tdb = cte)
      return { x: start.x, y: rawEnd.y };
    } else {
      // 45 degrees slope (diagonal)
      const signX = dx >= 0 ? 1 : -1;
      const signY = dy >= 0 ? 1 : -1;
      const diagLen = Math.max(Math.abs(dx), Math.abs(dy));
      return { x: start.x + signX * diagLen, y: start.y + signY * diagLen };
    }
  };

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'pointer') return;

    // Prevent default touch gestures (scrolling/pinch) while drawing on the board
    e.preventDefault();
    e.stopPropagation();

    const pt = getCoordinates(e);
    if (!pt) return;

    if (activeTool === 'laser') {
      setLaserPoint(pt);
      return;
    }

    if (activeTool === 'eraser') {
      eraseNear(pt);
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      const newStroke: WhiteboardStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tool: activeTool,
        color: selectedColor,
        width: activeTool === 'highlighter' ? strokeWidth * 3.5 : strokeWidth,
        points: [pt],
      };
      setCurrentStroke(newStroke);
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      const newStroke: WhiteboardStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tool: activeTool,
        color: selectedColor,
        width: strokeWidth,
        points: [pt, pt], // [start, currentEnd]
      };
      setCurrentStroke(newStroke);
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'pointer') return;
    e.preventDefault();

    const pt = getCoordinates(e);
    if (!pt) return;

    if (activeTool === 'laser') {
      setLaserPoint(pt);
      if (laserTimerRef.current) window.clearTimeout(laserTimerRef.current);
      laserTimerRef.current = window.setTimeout(() => {
        setLaserPoint(null);
      }, 1500);
      return;
    }

    if (activeTool === 'eraser' && (e.buttons === 1 || e.pressure > 0)) {
      eraseNear(pt);
      return;
    }

    if (currentStroke) {
      if (activeTool === 'pen' || activeTool === 'highlighter') {
        setCurrentStroke((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...prev.points, pt],
          };
        });
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        // Straight line or vector arrow
        const startPt = currentStroke.points[0];
        const snappedEnd = applyOrthoSnap(startPt, pt, isOrthoSnapEnabled || e.shiftKey);
        setCurrentStroke((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [startPt, snappedEnd],
          };
        });
      }
    }
  };

  // Pointer Up handler
  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'pointer') return;
    e.preventDefault();

    if (currentStroke) {
      if (currentStroke.tool === 'pen' || currentStroke.tool === 'highlighter') {
        if (currentStroke.points.length > 1) {
          setStrokes((prev) => [...prev, currentStroke]);
        }
      } else if (currentStroke.tool === 'line' || currentStroke.tool === 'arrow') {
        const p1 = currentStroke.points[0];
        const p2 = currentStroke.points[1];
        if (p1 && p2 && Math.hypot(p2.x - p1.x, p2.y - p1.y) > 4) {
          setStrokes((prev) => [...prev, currentStroke]);
        }
      }
      setCurrentStroke(null);
    }

    if (activeTool === 'laser') {
      if (laserTimerRef.current) window.clearTimeout(laserTimerRef.current);
      laserTimerRef.current = window.setTimeout(() => {
        setLaserPoint(null);
      }, 800);
    }
  };

  // Erase strokes near a point (hit testing with generous tolerance for fingers)
  const eraseNear = (pt: StrokePoint) => {
    const threshold = 28; // 28px hit test radius for touch stylus/finger
    setStrokes((prev) =>
      prev.filter((stroke) => {
        if (stroke.tool === 'line' || stroke.tool === 'arrow') {
          const p1 = stroke.points[0];
          const p2 = stroke.points[stroke.points.length - 1];
          if (!p1 || !p2) return true;
          // Distance from touch point to straight line segment
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const lenSq = dx * dx + dy * dy;
          if (lenSq === 0) return Math.hypot(pt.x - p1.x, pt.y - p1.y) >= threshold;
          const t = Math.max(0, Math.min(1, ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq));
          const projX = p1.x + t * dx;
          const projY = p1.y + t * dy;
          return Math.hypot(pt.x - projX, pt.y - projY) >= threshold;
        }
        return !stroke.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < threshold);
      })
    );
  };

  // Undo last stroke
  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  // Clear all annotations
  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setLaserPoint(null);
  };

  // Path SVG generator with smooth quadratic beziers
  const renderPathD = (points: StrokePoint[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      d += ` Q ${p1.x} ${p1.y}, ${midX} ${midY}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };

  // Helper to render straight line or vector arrow
  const renderLineOrArrow = (stroke: WhiteboardStroke) => {
    const p1 = stroke.points[0];
    const p2 = stroke.points[stroke.points.length - 1];
    if (!p1 || !p2) return null;

    if (stroke.tool === 'line') {
      return (
        <line
          key={stroke.id}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap="round"
        />
      );
    }

    if (stroke.tool === 'arrow') {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const headLen = Math.max(14, stroke.width * 2.8);
      const headAngle = Math.PI / 6; // 30 deg
      const aX = p2.x - headLen * Math.cos(angle - headAngle);
      const aY = p2.y - headLen * Math.sin(angle - headAngle);
      const bX = p2.x - headLen * Math.cos(angle + headAngle);
      const bY = p2.y - headLen * Math.sin(angle + headAngle);

      return (
        <g key={stroke.id}>
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
          />
          {dist > 4 && (
            <polygon
              points={`${p2.x},${p2.y} ${aX},${aY} ${bX},${bY}`}
              fill={stroke.color}
            />
          )}
        </g>
      );
    }

    return null;
  };

  const colors = [
    { name: 'Amarillo flúor', hex: '#FACC15' },
    { name: 'Cian brillante', hex: '#38BDF8' },
    { name: 'Rojo rotulador', hex: '#EF4444' },
    { name: 'Verde lima', hex: '#4ADE80' },
    { name: 'Blanco tiza', hex: '#FFFFFF' },
    { name: 'Magenta aula', hex: '#E879F9' },
  ];

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-30 ${className}`}
      style={{ touchAction: activeTool === 'pointer' ? 'auto' : 'none' }}
    >
      {/* SVG Canvas Layer for drawing strokes & laser pointer */}
      <svg
        ref={svgOverlayRef}
        className={`w-full h-full absolute inset-0 ${
          activeTool !== 'pointer' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Existing committed strokes */}
        {strokes.map((stroke) => {
          if (stroke.tool === 'line' || stroke.tool === 'arrow') {
            return renderLineOrArrow(stroke);
          }
          return (
            <path
              key={stroke.id}
              d={renderPathD(stroke.points)}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={stroke.tool === 'highlighter' ? 0.42 : 0.95}
              style={{
                mixBlendMode: stroke.tool === 'highlighter' ? 'screen' : 'normal',
              }}
            />
          );
        })}

        {/* Current stroke in progress */}
        {currentStroke && (
          currentStroke.tool === 'line' || currentStroke.tool === 'arrow' ? (
            renderLineOrArrow(currentStroke)
          ) : (
            <path
              d={renderPathD(currentStroke.points)}
              fill="none"
              stroke={currentStroke.color}
              strokeWidth={currentStroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={currentStroke.tool === 'highlighter' ? 0.42 : 0.95}
              style={{
                mixBlendMode: currentStroke.tool === 'highlighter' ? 'screen' : 'normal',
              }}
            />
          )
        )}

        {/* Virtual Laser Pointer with bright pulsing halo */}
        {laserPoint && (
          <g transform={`translate(${laserPoint.x}, ${laserPoint.y})`}>
            {/* Outer halo */}
            <circle r="22" fill="#EF4444" fillOpacity="0.25" filter="url(#laserGlow)" />
            {/* Middle beam */}
            <circle r="10" fill="#EF4444" fillOpacity="0.75" />
            {/* Intense core */}
            <circle r="4" fill="#FFFFFF" />
          </g>
        )}
      </svg>

      {/* Floating Whiteboard Dockable Toolbar (Optimized for finger & stylus touch interaction) */}
      <div
        className={`absolute pointer-events-auto flex flex-wrap items-center gap-1.5 p-1.5 bg-[#0e1015]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 select-none touch-manipulation transition-all ${
          dockPosition === 'top' ? 'top-14 left-3' : 'bottom-4 left-1/2 -translate-x-1/2'
        }`}
      >
        {/* Toggle Collapse */}
        <button
          type="button"
          onClick={() => setIsToolbarCollapsed((prev) => !prev)}
          className="p-2 rounded-xl text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
          title={isToolbarCollapsed ? 'Desplegar herramientas de pizarra' : 'Plegar barra de pizarra'}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {!isToolbarCollapsed && (
          <>
            <div className="w-px h-6 bg-white/10" />

            {/* 1. Pointer / Interactivity Mode */}
            <button
              type="button"
              onClick={() => setActiveTool('pointer')}
              className={`p-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs ${
                activeTool === 'pointer'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Modo Puntero: Tocar y mover puntos o interactuar libremente con el diagrama"
            >
              <MousePointer className="w-4 h-4" />
              <span className="hidden sm:inline">Puntero</span>
            </button>

            {/* 2. Stylus Pen (Rotulador mano alzada) */}
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`p-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs ${
                activeTool === 'pen'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Lápiz / Rotulador: Dibujo a mano alzada sobre la pizarra"
            >
              <Pen className="w-4 h-4" />
              <span className="hidden sm:inline">Lápiz</span>
            </button>

            {/* 3. Straight Line Tool (Línea Recta) */}
            <button
              type="button"
              onClick={() => setActiveTool('line')}
              className={`p-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs ${
                activeTool === 'line'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Línea Recta: Trazar segmentos rectos limpios (proyecciones a ejes o cuerdas)"
            >
              <Minus className="w-4 h-4" />
              <span className="hidden sm:inline">Línea</span>
            </button>

            {/* 4. Arrow Vector Tool (Flecha de Proceso) */}
            <button
              type="button"
              onClick={() => setActiveTool('arrow')}
              className={`p-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs ${
                activeTool === 'arrow'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Flecha / Vector: Trazar vectores de evolución psicrométrica con punta"
            >
              <MoveRight className="w-4 h-4" />
              <span className="hidden sm:inline">Flecha</span>
            </button>

            {/* 5. Highlighter (Subrayador Fluorescente) */}
            <button
              type="button"
              onClick={() => setActiveTool('highlighter')}
              className={`p-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs ${
                activeTool === 'highlighter'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Subrayador semitransparente: Resaltar zonas de confort o curvas"
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Resaltador</span>
            </button>

            {/* 6. Laser Pointer (Puntero Láser Virtual) */}
            <button
              type="button"
              onClick={() => setActiveTool('laser')}
              className={`p-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs ${
                activeTool === 'laser'
                  ? 'bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.5)]'
                  : 'text-red-400 hover:text-white hover:bg-red-500/20'
              }`}
              title="Puntero Láser: Tocar y señalar puntos en la pizarra interactiva"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Láser</span>
            </button>

            {/* 7. Eraser (Borrador) */}
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              className={`p-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs ${
                activeTool === 'eraser'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Borrador táctil: Tocar cualquier trazo o línea para eliminarla"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Borrar</span>
            </button>

            <div className="w-px h-6 bg-white/10" />

            {/* Orthogonal Snap Toggle (When line or arrow is active) */}
            {(activeTool === 'line' || activeTool === 'arrow') && (
              <button
                type="button"
                onClick={() => setIsOrthoSnapEnabled((prev) => !prev)}
                className={`p-2 rounded-xl flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                  isOrthoSnapEnabled
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-cyan-400 hover:text-white hover:bg-cyan-950/40 border border-cyan-800/40'
                }`}
                title={
                  isOrthoSnapEnabled
                    ? 'Bloqueo Orto ACTIVO (Líneas exactamente horizontales w=cte o verticales T=cte)'
                    : 'Activar Bloqueo Orto H/V (Fuerza líneas rectas horizontales w=cte o verticales T=cte)'
                }
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Orto H/V</span>
              </button>
            )}

            {/* Color Palette (When drawing, lines, or highlighting) */}
            {(activeTool === 'pen' || activeTool === 'line' || activeTool === 'arrow' || activeTool === 'highlighter') && (
              <div className="flex items-center gap-1 px-1">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                      selectedColor === c.hex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e1015] scale-110 border-white'
                        : 'border-black/40 hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}

                {/* Stroke thickness toggle */}
                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-white/10">
                  {[3, 6, 12].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setStrokeWidth(w)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        strokeWidth === w ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={`Grosor ${w === 3 ? 'Fino' : w === 6 ? 'Medio' : 'Grueso'}`}
                    >
                      <div
                        className="rounded-full bg-current"
                        style={{ width: `${Math.min(10, w + 1)}px`, height: `${Math.min(10, w + 1)}px` }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions: Undo & Clear */}
            {strokes.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Deshacer último trazo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                  title="Borrar todas las anotaciones de la pizarra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mover barra de posición (Arriba / Abajo) */}
            <button
              type="button"
              onClick={() => setDockPosition((prev) => (prev === 'top' ? 'bottom' : 'top'))}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
              title={dockPosition === 'top' ? 'Mover barra de pizarra abajo' : 'Mover barra de pizarra arriba'}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Fused PDI Fullscreen Button */}
            <button
              type="button"
              onClick={onToggleFullscreen || toggleFullscreen}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                (isFullscreenProp !== undefined ? isFullscreenProp : isFullscreen)
                  ? 'bg-[#fbbf24] text-black font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={
                (isFullscreenProp !== undefined ? isFullscreenProp : isFullscreen)
                  ? 'Salir de Pantalla Completa PDI (Esc)'
                  : 'Modo Pantalla Completa PDI (Ocupar toda la pantalla sin navegador)'
              }
            >
              {(isFullscreenProp !== undefined ? isFullscreenProp : isFullscreen) ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>

            {/* Close whiteboard button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer"
                title="Cerrar barra de pizarra"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
