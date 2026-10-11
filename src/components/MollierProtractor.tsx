import React, { useState } from 'react';
import {
  calculateADP,
  getSlopeFromSHR,
  getAshraeReferencePoint,
  getMollierProtractorAngle,
  MOLLIER_SHR_VALUES,
} from '../utils/ashraeScales';
import { UnitConvert } from '../utils/psychrolib';

export interface MollierProtractorProps {
  x0?: number; // Origin X in SVG canvas (default 794.0)
  y0?: number; // Origin Y in SVG canvas (default 480.7)
  radius?: number; // default 72
  plotWidth: number;
  plotHeight: number;
  spanT?: number;
  spanW?: number;
  pressure: number;
  isDark?: boolean;
  units?: 'SI' | 'IP';
  activeSHR?: number | null;
  onSelectSHR?: (shr: number | null) => void;
  coordToPixel: (tdb: number, w: number) => [number, number];
  selectedPoint?: { id: string; name: string; tdb: number; w: number } | null;
}

export const MollierProtractor: React.FC<MollierProtractorProps> = ({
  x0 = 794.0,
  y0 = 480.7,
  radius = 72,
  plotWidth,
  plotHeight,
  spanT = 60,
  spanW = 0.030,
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

  // Find coordinates for active ray using exact thermodynamic angle
  let activeRayPoint: { x: number; y: number } | null = null;
  if (currentActiveSHR !== null && currentActiveSHR >= 0 && currentActiveSHR <= 1.0) {
    const gamma = getMollierProtractorAngle(currentActiveSHR, plotWidth, plotHeight, spanT, spanW);
    activeRayPoint = {
      x: x0 - radius * Math.cos(gamma),
      y: y0 + radius * Math.sin(gamma),
    };
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
      {MOLLIER_SHR_VALUES.filter((t) => t.shr >= 0 && t.shr <= 1.0).map((t) => {
        const isHovered = hoveredSHR === t.shr;
        const isSelected = activeSHR === t.shr;
        const isHigh = isHovered || isSelected;

        const gamma = getMollierProtractorAngle(t.shr, plotWidth, plotHeight, spanT, spanW);
        const cosG = Math.cos(gamma);
        const sinG = Math.sin(gamma);

        const xOuter = x0 - radius * cosG;
        const yOuter = y0 + radius * sinG;
        const tickLen = t.isMajor ? 8 : 4;
        const xInner = x0 - (radius - tickLen) * cosG;
        const yInner = y0 + (radius - tickLen) * sinG;

        const isNearBottom = gamma > 1.2;
        const xLabel = x0 - (radius + (isNearBottom ? 14 : 10)) * cosG;
        const yLabel = y0 + (radius + (isNearBottom ? 14 : 10)) * sinG;

        const innerRadius = radius * 0.72;
        const xInnerTick = x0 - (innerRadius - 4) * cosG;
        const yInnerTick = y0 + (innerRadius - 4) * sinG;
        const xInnerOuter = x0 - innerRadius * cosG;
        const yInnerOuter = y0 + innerRadius * sinG;
        const showInnerLabel = t.deltaHDeltaW !== undefined && [25.0, 12.5, 5.0, 2.50].includes(t.deltaHDeltaW);
        const xInnerLabel = x0 - (innerRadius - 10) * cosG;
        const yInnerLabel = y0 + (innerRadius - 10) * sinG;

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
              x2={x0 - (radius + 16) * cosG}
              y2={y0 + (radius + 16) * sinG}
              stroke="transparent"
              strokeWidth="9"
            />

            {/* Tick Mark */}
            <line
              x1={xInner}
              y1={yInner}
              x2={xOuter}
              y2={yOuter}
              stroke={isHigh ? accentColor : primaryColor}
              strokeWidth={t.isMajor ? 1.5 : 0.8}
            />

            {/* Inner Delta_h / Delta_w Tick */}
            {t.deltaHDeltaW !== undefined && (
              <line
                x1={xInnerTick}
                y1={yInnerTick}
                x2={xInnerOuter}
                y2={yInnerOuter}
                stroke={isHigh ? accentColor : secondaryColor}
                strokeWidth={0.8}
              />
            )}

            {/* Ray beam when active or hovered */}
            {isHigh && (
              <line
                x1={x0}
                y1={y0}
                x2={xOuter}
                y2={yOuter}
                stroke={accentColor}
                strokeWidth="1.8"
                strokeDasharray="4,2"
              />
            )}

            {/* Tick Label */}
            {t.isMajor && (
              <text
                x={xLabel}
                y={isNearBottom ? yLabel + 7 : yLabel + 2.5}
                textAnchor={isNearBottom ? 'middle' : 'end'}
                fill={isHigh ? accentColor : textColor}
                fontSize="7"
                fontWeight={isHigh ? 'bold' : 'normal'}
                fontFamily="Fira Code, monospace"
              >
                {t.label}
              </text>
            )}

            {/* Inner Delta_h / Delta_w Label */}
            {showInnerLabel && (
              <text
                x={xInnerLabel}
                y={yInnerLabel + 2}
                textAnchor="middle"
                fill={secondaryColor}
                fontSize="5.5"
                fontFamily="Fira Code, monospace"
                opacity="0.85"
              >
                {t.deltaHDeltaW}
              </text>
            )}
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
