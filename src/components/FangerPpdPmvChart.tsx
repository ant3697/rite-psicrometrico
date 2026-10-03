import React, { useState } from 'react';
import { StatePoint } from '../types/psychrometrics';
import { calculateFangerPMV } from '../utils/psychrolib';

interface FangerPpdPmvChartProps {
  points: StatePoint[];
  selectedPointId?: string | null;
  onSelectPoint: (id: string) => void;
  airVelocity: number;
  met: number;
  clo: number;
}

export function getFangerSensation(pmv: number): {
  label: string;
  level: string;
  color: string;
  badgeBg: string;
} {
  if (pmv >= 2.5) {
    return { label: 'Mucho calor (+3)', level: '+3', color: '#ef4444', badgeBg: 'bg-[#ef4444]/20 text-[#fca5a5] border-[#ef4444]/40' };
  } else if (pmv >= 1.5) {
    return { label: 'Bastante calor (+2)', level: '+2', color: '#f97316', badgeBg: 'bg-[#f97316]/20 text-[#fdba74] border-[#f97316]/40' };
  } else if (pmv > 0.5) {
    return { label: 'Algo de calor (+1)', level: '+1', color: '#fbbf24', badgeBg: 'bg-[#fbbf24]/20 text-[#fde68a] border-[#fbbf24]/40' };
  } else if (pmv >= -0.5) {
    return { label: 'Neutra / Confort (0)', level: '0', color: '#a3e635', badgeBg: 'bg-[#65a30d]/25 text-[#a3e635] border-[#65a30d]/40' };
  } else if (pmv >= -1.5) {
    return { label: 'Algo de frío (-1)', level: '-1', color: '#38bdf8', badgeBg: 'bg-[#0284c7]/20 text-[#7dd3fc] border-[#0284c7]/40' };
  } else if (pmv > -2.5) {
    return { label: 'Bastante frío (-2)', level: '-2', color: '#60a5fa', badgeBg: 'bg-[#2563eb]/20 text-[#93c5fd] border-[#2563eb]/40' };
  } else {
    return { label: 'Mucho frío (-3)', level: '-3', color: '#818cf8', badgeBg: 'bg-[#4f46e5]/20 text-[#c7d2fe] border-[#4f46e5]/40' };
  }
}

export const FangerPpdPmvChart: React.FC<FangerPpdPmvChartProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  airVelocity,
  met,
  clo,
}) => {
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  // SVG Chart Dimensions
  const width = 640;
  const height = 300;
  const margin = { top: 32, right: 36, bottom: 42, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Domain: PMV [-3, +3], PPD [0, 100]
  const pmvToX = (pmv: number) => {
    const clamped = Math.max(-3, Math.min(3, pmv));
    return margin.left + ((clamped + 3) / 6) * plotWidth;
  };

  const ppdToY = (ppd: number) => {
    const clamped = Math.max(0, Math.min(100, ppd));
    return margin.top + (1 - clamped / 100) * plotHeight;
  };

  // Generate analytical Fanger curve path
  const curvePoints: Array<[number, number]> = [];
  for (let pmv = -3.0; pmv <= 3.001; pmv += 0.05) {
    const ppd = 100 - 95 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2));
    curvePoints.push([pmvToX(pmv), ppdToY(ppd)]);
  }
  const curvePath = `M ${curvePoints.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`;

  // Evaluated points
  const evaluatedPoints = points.map((pt) => {
    const fanger = calculateFangerPMV(pt.tdb, pt.rh, pt.tdb, airVelocity, met, clo);
    const sensation = getFangerSensation(fanger.pmv);
    return {
      ...pt,
      pmv: fanger.pmv,
      ppd: fanger.ppd,
      category: fanger.category,
      sensation,
      x: pmvToX(fanger.pmv),
      y: ppdToY(fanger.ppd),
    };
  });

  const activePoint = evaluatedPoints.find((p) => p.id === (hoveredPointId || selectedPointId)) || null;

  return (
    <div className="flex flex-col bg-[#1a1a1c]/90 rounded-xl border border-[rgba(255,255,255,0.1)] p-5 shadow-2xl space-y-4">
      {/* Title & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide font-primary">
              Curva Analítica de Fanger: PPD vs. PMV (ISO 7730)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
              PPD mín = 5%
            </span>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-0.5 font-secondary">
            Relación funcional entre el Voto Medio Previsto (PMV) y el Porcentaje Predicho de Insatisfechos (PPD).
          </p>
        </div>

        {/* Categories Micro-Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#fbbf24]/30 border border-[#fbbf24]" />
            <span className="text-[#fbbf24]">Cat. I (&lt;6%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#65a30d]/30 border border-[#a3e635]" />
            <span className="text-[#a3e635]">Cat. II (&lt;10%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]/30 border border-[#93c5fd]" />
            <span className="text-[#93c5fd]">Cat. III (&lt;15%)</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Fanger Chart */}
      <div className="w-full relative overflow-hidden flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[720px] h-auto select-none overflow-visible"
        >
          <defs>
            {/* Background gradient for the Fanger curve */}
            <linearGradient id="fanger-curve-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#0ea5e9" />
              <stop offset="47%" stopColor="#a3e635" />
              <stop offset="50%" stopColor="#84cc16" />
              <stop offset="53%" stopColor="#a3e635" />
              <stop offset="65%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            {/* Pattern for Cat II normal comfort zone */}
            <linearGradient id="comfort-cat2-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#65a30d" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#65a30d" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="comfort-cat1-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines (Horizontal PPD) */}
          {[10, 20, 40, 60, 80, 100].map((val) => {
            const y = ppdToY(val);
            return (
              <g key={`ppd-grid-${val}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="2,3"
                  opacity="0.45"
                />
                <text
                  x={margin.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="Fira Code, monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Background Grid Lines (Vertical PMV) */}
          {[-3, -2, -1, 0, 1, 2, 3].map((val) => {
            const x = pmvToX(val);
            return (
              <g key={`pmv-grid-${val}`}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + plotHeight}
                  stroke={val === 0 ? '#475569' : '#334155'}
                  strokeWidth={val === 0 ? '1.2' : '0.8'}
                  strokeDasharray={val === 0 ? undefined : '2,3'}
                  opacity={val === 0 ? '0.8' : '0.4'}
                />
                <text
                  x={x}
                  y={margin.top + plotHeight + 15}
                  textAnchor="middle"
                  fill={val === 0 ? '#f8fafc' : '#94a3b8'}
                  fontSize="10"
                  fontWeight={val === 0 ? 'bold' : 'normal'}
                  fontFamily="Fira Code, monospace"
                >
                  {val > 0 ? `+${val}` : val}
                </text>
              </g>
            );
          })}

          {/* Shaded Comfort Bands */}
          {/* Cat. III: PMV [-0.7, +0.7], PPD <= 15% */}
          <rect
            x={pmvToX(-0.7)}
            y={ppdToY(15)}
            width={pmvToX(0.7) - pmvToX(-0.7)}
            height={plotHeight - (ppdToY(15) - margin.top)}
            fill="#3b82f6"
            opacity="0.08"
            stroke="#3b82f6"
            strokeWidth="0.8"
            strokeDasharray="3,3"
            rx="2"
          />

          {/* Cat. II (RITE / Normal): PMV [-0.5, +0.5], PPD <= 10% */}
          <rect
            x={pmvToX(-0.5)}
            y={ppdToY(10)}
            width={pmvToX(0.5) - pmvToX(-0.5)}
            height={plotHeight - (ppdToY(10) - margin.top)}
            fill="url(#comfort-cat2-fill)"
            stroke="#a3e635"
            strokeWidth="1"
            strokeDasharray="4,2"
            rx="3"
          />

          {/* Cat. I (Alta exigencia): PMV [-0.2, +0.2], PPD <= 6% */}
          <rect
            x={pmvToX(-0.2)}
            y={ppdToY(6)}
            width={pmvToX(0.2) - pmvToX(-0.2)}
            height={plotHeight - (ppdToY(6) - margin.top)}
            fill="url(#comfort-cat1-fill)"
            stroke="#fbbf24"
            strokeWidth="1.2"
            rx="3"
          />

          {/* Residual 5% Minimum PPD Line (ISO 7730 Key Physical Limit) */}
          <line
            x1={margin.left}
            y1={ppdToY(5)}
            x2={margin.left + plotWidth}
            y2={ppdToY(5)}
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4,3"
            opacity="0.9"
          />
          <text
            x={margin.left + plotWidth - 4}
            y={ppdToY(5) - 4}
            textAnchor="end"
            fill="#f59e0b"
            fontSize="8.5"
            fontFamily="Roboto Condensed, sans-serif"
            fontWeight="bold"
          >
            PPD mín. teórico = 5% (Neutralidad Fanger)
          </text>

          {/* Analytical Fanger Curve Path */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#fanger-curve-grad)"
            strokeWidth="2.8"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
          />

          {/* Zero Neutral Axis Indicator */}
          <circle cx={pmvToX(0)} cy={ppdToY(5)} r="4" fill="#a3e635" stroke="#14532d" strokeWidth="1.5" />
          <text
            x={pmvToX(0)}
            y={ppdToY(5) + 14}
            textAnchor="middle"
            fill="#a3e635"
            fontSize="8"
            fontFamily="Roboto Condensed, sans-serif"
            fontWeight="bold"
          >
            PMV = 0 (PPD = 5%)
          </text>

          {/* Evaluated State Points overlaid on Fanger curve */}
          {evaluatedPoints.map((pt) => {
            const isSelected = pt.id === selectedPointId;
            const isHovered = pt.id === hoveredPointId;

            return (
              <g
                key={`fanger-pt-${pt.id}`}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectPoint(pt.id)}
                onMouseEnter={() => setHoveredPointId(pt.id)}
                onMouseLeave={() => setHoveredPointId(null)}
              >
                {/* Crosshair guide lines when selected or hovered */}
                {(isSelected || isHovered) && (
                  <g className="pointer-events-none">
                    <line
                      x1={pt.x}
                      y1={margin.top}
                      x2={pt.x}
                      y2={margin.top + plotHeight}
                      stroke={pt.color}
                      strokeWidth="1.2"
                      strokeDasharray="3,2"
                      opacity="0.8"
                    />
                    <line
                      x1={margin.left}
                      y1={pt.y}
                      x2={margin.left + plotWidth}
                      y2={pt.y}
                      stroke={pt.color}
                      strokeWidth="1.2"
                      strokeDasharray="3,2"
                      opacity="0.8"
                    />
                  </g>
                )}

                {/* Point Halo */}
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="10"
                    fill="none"
                    stroke={pt.color}
                    strokeWidth="2"
                    strokeDasharray="3,2"
                    className="animate-spin"
                    style={{ animationDuration: '6s', transformOrigin: `${pt.x}px ${pt.y}px` }}
                  />
                )}

                {/* Outer Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected || isHovered ? 7 : 5}
                  fill="#0f172a"
                  stroke={pt.color}
                  strokeWidth="2"
                />

                {/* Center dot */}
                <circle cx={pt.x} cy={pt.y} r={3} fill={pt.color} />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={margin.left + plotWidth / 2}
            y={margin.top + plotHeight + 32}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="10.5"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
          >
            Voto Medio Previsto PMV [-3 (Mucho Frío) a +3 (Mucho Calor)]
          </text>

          <text
            x="12"
            y={margin.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 12, ${margin.top + plotHeight / 2})`}
            fill="#cbd5e1"
            fontSize="10"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
          >
            Insatisfechos PPD [%]
          </text>
        </svg>
      </div>

      {/* 7-Point Fanger Sensation Scale (Barra Continua Normalizada ISO 7730) */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#cbd5e1] mb-1.5 font-primary">
          <span>Escala Normalizada de Sensación Térmica (ISO 7730 / Fanger)</span>
          {activePoint && (
            <span className="font-mono text-xs text-white">
              Punto Activo: <strong style={{ color: activePoint.color }}>{activePoint.name}</strong> · PMV{' '}
              {activePoint.pmv > 0 ? `+${activePoint.pmv.toFixed(2)}` : activePoint.pmv.toFixed(2)} (
              {activePoint.sensation.label})
            </span>
          )}
        </div>

        {/* 7-Segment Color Bar */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono">
          {[
            { level: '-3', label: 'Mucho frío', bg: 'bg-[#4f46e5]/25 border-[#4f46e5]/40 text-[#c7d2fe]' },
            { level: '-2', label: 'Bastante frío', bg: 'bg-[#2563eb]/25 border-[#2563eb]/40 text-[#93c5fd]' },
            { level: '-1', label: 'Algo de frío', bg: 'bg-[#0284c7]/25 border-[#0284c7]/40 text-[#7dd3fc]' },
            { level: '0', label: 'Neutra (Confort)', bg: 'bg-[#65a30d]/35 border-[#65a30d]/60 text-[#a3e635] font-bold ring-1 ring-[#a3e635]/40' },
            { level: '+1', label: 'Algo de calor', bg: 'bg-[#fbbf24]/25 border-[#fbbf24]/40 text-[#fde68a]' },
            { level: '+2', label: 'Bastante calor', bg: 'bg-[#f97316]/25 border-[#f97316]/40 text-[#fdba74]' },
            { level: '+3', label: 'Mucho calor', bg: 'bg-[#ef4444]/25 border-[#ef4444]/40 text-[#fca5a5]' },
          ].map((seg) => {
            const isMatch = activePoint && activePoint.sensation.level === seg.level;
            return (
              <div
                key={`scale-seg-${seg.level}`}
                className={`py-1 px-1 rounded border transition-all ${seg.bg} ${
                  isMatch ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-85'
                }`}
              >
                <div className="text-[11px] font-bold">{seg.level}</div>
                <div className="text-[9px] truncate font-sans">{seg.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Point Detail Tooltip Bar */}
      {activePoint && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0f172a]/90 border border-[rgba(255,255,255,0.12)] text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activePoint.color }} />
            <span className="font-bold text-white text-sm">{activePoint.name}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${activePoint.sensation.badgeBg}`}>
              {activePoint.sensation.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[#94a3b8]">PMV: </span>
              <strong className="text-white">
                {activePoint.pmv > 0 ? `+${activePoint.pmv.toFixed(2)}` : activePoint.pmv.toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">PPD: </span>
              <strong className="text-[#f59e0b]">{activePoint.ppd.toFixed(1)}%</strong>
            </div>
            <div>
              <span className="text-[#94a3b8]">Categoría: </span>
              <strong
                className={
                  activePoint.category === 'Cat I'
                    ? 'text-[#fbbf24]'
                    : activePoint.category === 'Cat II'
                    ? 'text-[#a3e635]'
                    : activePoint.category === 'Cat III'
                    ? 'text-[#93c5fd]'
                    : 'text-[#f87171]'
                }
              >
                {activePoint.category}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
