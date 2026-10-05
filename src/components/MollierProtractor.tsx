import React, { useState } from 'react';
import {
  calculateADP,
  getSlopeFromSHR,
  getAshraeReferencePoint,
} from '../utils/ashraeScales';
import { UnitConvert } from '../utils/psychrolib';

export interface MollierProtractorProps {
  x0?: number; // Origin X in SVG canvas (default 794.0)
  y0?: number; // Origin Y in SVG canvas (default 480.7)
  radius?: number; // default 72
  plotWidth: number;
  plotHeight: number;
  pressure: number;
  isDark?: boolean;
  units?: 'SI' | 'IP';
  activeSHR?: number | null;
  onSelectSHR?: (shr: number | null) => void;
  coordToPixel: (tdb: number, w: number) => [number, number];
  selectedPoint?: { id: string; name: string; tdb: number; w: number } | null;
}

interface MollierTick {
  shr: number;
  label: string;
  x: number;
  y: number;
  isMajor: boolean;
}

const MOLLIER_TICKS: MollierTick[] = [
  { shr: 1.0, label: '1.0', x: 794.0, y: 407.8, isMajor: true },
  { shr: 0.9, label: '0.9', x: 787.8, y: 553.3, isMajor: true },
  { shr: 0.8, label: '0.8', x: 780.1, y: 552.2, isMajor: true },
  { shr: 0.7, label: '0.7', x: 771.0, y: 549.8, isMajor: true },
  { shr: 0.6, label: '0.6', x: 760.4, y: 545.3, isMajor: true },
  { shr: 0.5, label: '0.5', x: 749.0, y: 538.0, isMajor: true },
  { shr: 0.4, label: '0.4', x: 738.3, y: 527.6, isMajor: true },
  { shr: 0.3, label: '0.3', x: 729.7, y: 515.0, isMajor: true },
  { shr: 0.2, label: '0.2', x: 724.3, y: 501.8, isMajor: true },
  { shr: 0.1, label: '0.1', x: 721.7, y: 489.6, isMajor: false },
  { shr: 0.0, label: '0.0', x: 721.2, y: 479.1, isMajor: true },
  { shr: -0.2, label: '-0.2', x: 722.1, y: 468.8, isMajor: false },
  { shr: -0.5, label: '-0.5', x: 724.5, y: 458.8, isMajor: true },
  { shr: -1.0, label: '-1.0', x: 727.9, y: 450.0, isMajor: true },
  { shr: -2.0, label: '-2.0', x: 731.9, y: 442.5, isMajor: false },
  { shr: -4.0, label: '-4.0', x: 735.3, y: 437.5, isMajor: false },
];

export const MollierProtractor: React.FC<MollierProtractorProps> = ({
  x0 = 794.0,
  y0 = 480.7,
  radius = 72,
  pressure,
  isDark = true,
  units = 'SI',
  activeSHR,
  onSelectSHR,
  coordToPixel,
  selectedPoint,
}) => {
  const [hoveredSHR, setHoveredSHR] = useState<number | null>(null);

  const primaryColor = isDark ? '#38BDF8' : '#0284C7';
  const secondaryColor = isDark ? '#94A3B8' : '#0369A1';
  const accentColor = isDark ? '#FBBF24' : '#D97706';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';

  const currentActiveSHR = hoveredSHR ?? activeSHR ?? null;

  // Reference state point (24°C, 50% RH)
  const refPt = getAshraeReferencePoint(pressure);
  const [refX, refY] = coordToPixel(refPt.tdb, refPt.w);

  // Target anchor point for the Room Condition Line (selected point or canonical reference point)
  const targetPt = selectedPoint || {
    id: 'ref',
    name: 'Punto Ref. (24°C / 50%)',
    tdb: refPt.tdb,
    w: refPt.w,
  };
  const [targetX, targetY] = coordToPixel(targetPt.tdb, targetPt.w);

  // Thermodynamic Apparatus Dew Point (ADP)
  const adpData =
    currentActiveSHR !== null && currentActiveSHR > 0 && currentActiveSHR <= 1.0
      ? calculateADP(targetPt.tdb, targetPt.w, currentActiveSHR, pressure)
      : null;

  const adpPixel = adpData ? coordToPixel(adpData.tdbAdp, adpData.wAdp) : null;

  // Find coordinates for active ray
  let activeRayPoint: { x: number; y: number } | null = null;
  if (currentActiveSHR !== null) {
    const matched = MOLLIER_TICKS.find((t) => Math.abs(t.shr - currentActiveSHR) < 0.01);
    if (matched) {
      activeRayPoint = { x: matched.x, y: matched.y };
    } else {
      // Interpolate between closest ticks
      const sorted = [...MOLLIER_TICKS].sort((a, b) => a.shr - b.shr);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (currentActiveSHR >= sorted[i].shr && currentActiveSHR <= sorted[i + 1].shr) {
          const ratio = (currentActiveSHR - sorted[i].shr) / (sorted[i + 1].shr - sorted[i].shr);
          activeRayPoint = {
            x: sorted[i].x + ratio * (sorted[i + 1].x - sorted[i].x),
            y: sorted[i].y + ratio * (sorted[i + 1].y - sorted[i].y),
          };
          break;
        }
      }
    }
  }

  return (
    <g className="mollier-interactive-protractor select-none">
      {/* Background Backing Plate */}
      <rect
        x={x0 - radius - 60}
        y={y0 - radius - 20}
        width={radius + 80}
        height={radius * 2 + 50}
        rx="8"
        fill={isDark ? 'rgba(10, 10, 12, 0.88)' : 'rgba(255, 255, 255, 0.94)'}
        stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(2, 132, 199, 0.35)'}
        strokeWidth="1.2"
        className="pointer-events-none"
      />

      {/* Protractor Titles */}
      <g transform={`translate(${x0 - 55}, ${y0 - radius - 6})`} className="pointer-events-none">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fill={primaryColor}
          fontSize="7"
          fontWeight="bold"
          fontFamily="Roboto Condensed, sans-serif"
        >
          FACTOR DE CALOR SENSIBLE FCS (Qs/Qt)
        </text>
      </g>

      {/* Origin Crosshair */}
      <circle cx={x0} cy={y0} r="2.5" fill={primaryColor} />
      <circle cx={x0} cy={y0} r="5" fill="none" stroke={primaryColor} strokeWidth="0.8" />
      <line x1={x0 - 7} y1={y0} x2={x0 + 7} y2={y0} stroke={primaryColor} strokeWidth="0.8" />
      <line x1={x0} y1={y0 - 7} x2={x0} y2={y0 + 7} stroke={primaryColor} strokeWidth="0.8" />

      {/* Outer Semicircle Arc (left side) */}
      <path
        d={`M ${x0} ${y0 - radius} A ${radius} ${radius} 0 0 0 ${x0} ${y0 + radius}`}
        fill="none"
        stroke={primaryColor}
        strokeWidth="1.2"
      />

      {/* Interactive Ray Click Targets and Ticks */}
      {MOLLIER_TICKS.map((t) => {
        const isHovered = hoveredSHR === t.shr;
        const isSelected = activeSHR === t.shr;
        const isHigh = isHovered || isSelected;

        // Angle from center (x0, y0) to (t.x, t.y)
        const dx = t.x - x0;
        const dy = t.y - y0;
        const dist = Math.hypot(dx, dy) || 1;
        const normX = dx / dist;
        const normY = dy / dist;

        const xInner = x0 + (radius - (t.isMajor ? 8 : 4)) * normX;
        const yInner = y0 + (radius - (t.isMajor ? 8 : 4)) * normY;

        const xLabel = x0 + (radius + 12) * normX;
        const yLabel = y0 + (radius + 12) * normY;

        return (
          <g
            key={`mollier-shr-${t.shr}`}
            className="cursor-pointer group"
            onClick={() => {
              if (onSelectSHR) {
                onSelectSHR(activeSHR === t.shr ? null : t.shr);
              }
            }}
            onMouseEnter={() => setHoveredSHR(t.shr)}
            onMouseLeave={() => setHoveredSHR(null)}
          >
            {/* Extended click area */}
            <line
              x1={x0}
              y1={y0}
              x2={x0 + (radius + 16) * normX}
              y2={y0 + (radius + 16) * normY}
              stroke="transparent"
              strokeWidth="9"
            />

            {/* Tick Mark */}
            <line
              x1={xInner}
              y1={yInner}
              x2={t.x}
              y2={t.y}
              stroke={isHigh ? accentColor : primaryColor}
              strokeWidth={t.isMajor ? 1.5 : 0.8}
            />

            {/* Ray beam when active or hovered */}
            {isHigh && (
              <line
                x1={x0}
                y1={y0}
                x2={t.x}
                y2={t.y}
                stroke={accentColor}
                strokeWidth="1.8"
                strokeDasharray="4,2"
              />
            )}

            {/* Tick Label */}
            <text
              x={xLabel}
              y={yLabel + 2.5}
              textAnchor="middle"
              fill={isHigh ? accentColor : textColor}
              fontSize="7"
              fontWeight={isHigh ? 'bold' : 'normal'}
              fontFamily="Fira Code, monospace"
            >
              {t.label}
            </text>
          </g>
        );
      })}

      {/* Active Ray Extension Beam from center */}
      {activeRayPoint && (
        <line
          x1={x0}
          y1={y0}
          x2={activeRayPoint.x}
          y2={activeRayPoint.y}
          stroke={accentColor}
          strokeWidth="2.2"
        />
      )}

      {/* Maneuvering Line (Recta de Maniobra / RCL) across Mollier diagram */}
      {currentActiveSHR !== null && (
        <g className="mollier-shr-maneuver-line">
          {(() => {
            const dWdT = getSlopeFromSHR(currentActiveSHR);

            let startPx = targetX;
            let startPy = targetY;
            if (adpPixel) {
              startPx = adpPixel[0];
              startPy = adpPixel[1];
            } else {
              const tLow = Math.max(-10, targetPt.tdb - 20);
              const wLow = Math.max(0, targetPt.w - dWdT * (targetPt.tdb - tLow));
              const [sx, sy] = coordToPixel(tLow, wLow);
              startPx = sx;
              startPy = sy;
            }

            const tHigh = targetPt.tdb + Math.max(10, (targetPt.tdb - (adpData?.tdbAdp ?? targetPt.tdb)) * 0.8);
            const wHigh = targetPt.w + dWdT * (tHigh - targetPt.tdb);
            const [endPx, endPy] = coordToPixel(tHigh, Math.max(0, wHigh));

            return (
              <g>
                <line
                  x1={startPx}
                  y1={startPy}
                  x2={endPx}
                  y2={endPy}
                  stroke={accentColor}
                  strokeWidth="2.2"
                  strokeDasharray="6,3"
                />

                {/* Target Point Anchor Circle */}
                <circle cx={targetX} cy={targetY} r="4.5" fill={accentColor} />
                <circle cx={targetX} cy={targetY} r="9" fill="none" stroke={accentColor} strokeWidth="1.3" />

                {/* Target Point Label */}
                <g transform={`translate(${targetX + 14}, ${targetY - 10})`}>
                  <rect
                    x="-4"
                    y="-10"
                    width="220"
                    height="18"
                    rx="4"
                    fill={isDark ? 'rgba(10,10,12,0.92)' : 'rgba(255,255,255,0.95)'}
                    stroke={accentColor}
                    strokeWidth="1"
                  />
                  <text
                    x="4"
                    y="2"
                    fill={accentColor}
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="Roboto Condensed, sans-serif"
                  >
                    Recta Maniobra FCS = {currentActiveSHR.toFixed(2)} · {targetPt.name}
                  </text>
                </g>

                {/* Apparatus Dew Point (ADP) intersection badge */}
                {adpData && adpPixel && (
                  <g transform={`translate(${adpPixel[0]}, ${adpPixel[1]})`}>
                    <circle r="5" fill="#EF4444" />
                    <circle r="10" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,2" />
                    <g transform="translate(12, 14)">
                      <rect
                        x="-4"
                        y="-12"
                        width="180"
                        height="26"
                        rx="4"
                        fill={isDark ? 'rgba(15,23,42,0.95)' : 'rgba(254,242,242,0.95)'}
                        stroke="#EF4444"
                        strokeWidth="1.2"
                      />
                      <text x="2" y="-1" fill="#DC2626" fontSize="8" fontWeight="bold" fontFamily="Roboto Condensed, sans-serif">
                        ADP (Punto Rocío Aparato)
                      </text>
                      <text x="2" y="9" fill={textColor} fontSize="7.5" fontFamily="Fira Code, monospace">
                        {units === 'IP'
                          ? `Tadp: ${UnitConvert.cToF(adpData.tdbAdp).toFixed(1)}°F · w: ${(adpData.wAdp * 7000).toFixed(0)} gr/lb`
                          : `Tadp: ${adpData.tdbAdp.toFixed(1)}°C · w: ${(adpData.wAdp * 1000).toFixed(1)} g/kg`}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })()}
        </g>
      )}

      {/* Active SHR Status Capsule at bottom of protractor */}
      {currentActiveSHR !== null && (
        <g transform={`translate(${x0 - 50}, ${y0 + radius + 14})`} className="pointer-events-none">
          <rect
            x="-75"
            y="-9"
            width="150"
            height="18"
            rx="4"
            fill={isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(254, 243, 199, 0.96)'}
            stroke={accentColor}
            strokeWidth="1"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill={accentColor}
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
          >
            FCS = {currentActiveSHR.toFixed(2)} · {(currentActiveSHR * 100).toFixed(0)}% Sens. / {((1 - currentActiveSHR) * 100).toFixed(0)}% Lat.
          </text>
        </g>
      )}

      {/* Reference point mark: 24°C, 50% RH */}
      <g transform={`translate(${refX}, ${refY})`} className="pointer-events-none">
        <circle cx="0" cy="0" r="3.5" fill={primaryColor} opacity="0.85" />
        <circle cx="0" cy="0" r="7" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.7" />
        <line x1="-9" y1="0" x2="9" y2="0" stroke={primaryColor} strokeWidth="0.7" opacity="0.6" />
        <line x1="0" y1="-9" x2="0" y2="9" stroke={primaryColor} strokeWidth="0.7" opacity="0.6" />
      </g>
    </g>
  );
};
