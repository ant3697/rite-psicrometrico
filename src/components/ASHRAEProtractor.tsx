import React, { useState } from 'react';
import {
  ASHRAE_SHR_VALUES,
  getProtractorAngle,
  getAshraeReferencePoint,
  calculateADP,
} from '../utils/ashraeScales';

interface ASHRAEProtractorProps {
  x0: number; // Origin X in SVG canvas
  y0: number; // Origin Y in SVG canvas
  radius?: number;
  plotWidth: number;
  plotHeight: number;
  spanT: number;
  spanW: number;
  pressure: number;
  theme: 'ashrae_classic' | 'valcon_color' | 'dark_blueprint';
  activeSHR?: number | null;
  onSelectSHR?: (shr: number | null) => void;
  coordToPixel: (tdb: number, w: number) => [number, number];
  selectedPoint?: { id: string; name: string; tdb: number; w: number } | null;
}

export const ASHRAEProtractor: React.FC<ASHRAEProtractorProps> = ({
  x0,
  y0,
  radius = 84,
  plotWidth,
  plotHeight,
  spanT,
  spanW,
  pressure,
  theme,
  activeSHR,
  onSelectSHR,
  coordToPixel,
  selectedPoint,
}) => {
  const [hoveredSHR, setHoveredSHR] = useState<number | null>(null);

  const isGreenTheme = theme === 'ashrae_classic';
  const isDarkTheme = theme === 'dark_blueprint';

  // Theme-aware strokes and text colors
  const primaryColor = isGreenTheme
    ? '#15803D' // Canonical ASHRAE green
    : isDarkTheme
    ? '#38BDF8' // Sky cyan for dark mode
    : '#0284C7'; // Valcon blue

  const secondaryColor = isGreenTheme
    ? '#166534'
    : isDarkTheme
    ? '#94A3B8'
    : '#0369A1';

  const accentColor = isGreenTheme
    ? '#B45309'
    : isDarkTheme
    ? '#FBBF24'
    : '#D97706';

  const textColor = isGreenTheme
    ? '#14532D'
    : isDarkTheme
    ? '#F8FAFC'
    : '#0F172A';

  const currentActiveSHR = hoveredSHR ?? activeSHR ?? null;

  // Inner radius for Delta_h / Delta_W
  const innerRadius = radius * 0.72;

  // Semicircle arc span
  // In our coordinates, rays point down and left (dx <= 0, dy >= 0).
  const maxAngle = Math.PI * 0.58; // Approx 105 degrees down

  // Reference state point (24°C, 50% RH)
  const refPt = getAshraeReferencePoint(pressure);
  const [refX, refY] = coordToPixel(refPt.tdb, refPt.w);

  // Focus point for RCL projection (either selected point or canonical reference point)
  const targetPt = selectedPoint || {
    id: 'ref',
    name: 'Punto Ref. ASHRAE (24°C / 50%)',
    tdb: refPt.tdb,
    w: refPt.w,
  };
  const [targetX, targetY] = coordToPixel(targetPt.tdb, targetPt.w);

  // Exact thermodynamic ADP for the active SHR
  const adpData = currentActiveSHR !== null && currentActiveSHR > 0 && currentActiveSHR <= 1.0
    ? calculateADP(targetPt.tdb, targetPt.w, currentActiveSHR, pressure)
    : null;

  const adpPixel = adpData ? coordToPixel(adpData.tdbAdp, adpData.wAdp) : null;

  return (
    <g className="ashrae-protractor select-none">
      {/* Background backing plate: Generously expanded so all formulas, arcs, ticks, and labels fit comfortably with ample padding */}
      <rect
        x={x0 - radius - 116}
        y={y0 - 44}
        width={radius + 144}
        height={currentActiveSHR !== null ? radius + 104 : radius + 84}
        rx="8"
        fill={
          isGreenTheme
            ? 'rgba(254, 254, 252, 0.96)'
            : isDarkTheme
            ? 'rgba(10, 10, 12, 0.92)'
            : 'rgba(255, 255, 255, 0.96)'
        }
        stroke={
          isGreenTheme
            ? '#15803D'
            : isDarkTheme
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(2, 132, 199, 0.4)'
        }
        strokeWidth="1.2"
        className="pointer-events-none"
      />

      {/* Protractor Titles (perfectly centered and spaced with zero collision) */}
      <g transform={`translate(${x0 - 80}, ${y0 - 24})`} className="pointer-events-none">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fill={primaryColor}
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="Roboto Condensed, sans-serif"
          letterSpacing="0.3"
        >
          SENSIBLE HEAT / TOTAL HEAT = Qs / Qt
        </text>
        <line x1="-74" y1="4" x2="74" y2="4" stroke={primaryColor} strokeWidth="0.6" />
        <text
          x="0"
          y="13"
          textAnchor="middle"
          fill={secondaryColor}
          fontSize="6.5"
          fontWeight="600"
          fontFamily="Roboto Condensed, sans-serif"
        >
          ENTHALPY / HUMIDITY RATIO = Δh / ΔW [kJ/g]
        </text>
      </g>

      {/* Origin Crosshair */}
      <circle cx={x0} cy={y0} r="2.5" fill={primaryColor} />
      <circle cx={x0} cy={y0} r="5" fill="none" stroke={primaryColor} strokeWidth="0.8" />
      <line x1={x0 - 7} y1={y0} x2={x0 + 7} y2={y0} stroke={primaryColor} strokeWidth="0.8" />
      <line x1={x0} y1={y0 - 7} x2={x0} y2={y0 + 7} stroke={primaryColor} strokeWidth="0.8" />

      {/* Outer Arc (Sensible Heat Ratio: Qs/Qt) */}
      <path
        d={`M ${x0 - radius} ${y0} A ${radius} ${radius} 0 0 0 ${(x0 - radius * Math.cos(maxAngle)).toFixed(1)} ${(y0 + radius * Math.sin(maxAngle)).toFixed(1)}`}
        fill="none"
        stroke={primaryColor}
        strokeWidth="1.2"
      />

      {/* Inner Arc (Delta h / Delta W) */}
      <path
        d={`M ${x0 - innerRadius} ${y0} A ${innerRadius} ${innerRadius} 0 0 0 ${(x0 - innerRadius * Math.cos(maxAngle)).toFixed(1)} ${(y0 + innerRadius * Math.sin(maxAngle)).toFixed(1)}`}
        fill="none"
        stroke={secondaryColor}
        strokeWidth="0.9"
        strokeDasharray="2,2"
      />

      {/* Protractor Radial Ticks and Values */}
      {ASHRAE_SHR_VALUES.map((item) => {
        const angle = getProtractorAngle(item.shr, plotWidth, plotHeight, spanT, spanW);
        if (isNaN(angle) || angle < 0 || angle > maxAngle + 0.1) return null;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Outer Tick coordinates (SHR)
        const xOuter = x0 - radius * cosA;
        const yOuter = y0 + radius * sinA;
        const tickLen = item.isMajor ? 8 : 4;
        const xTickIn = x0 - (radius - tickLen) * cosA;
        const yTickIn = y0 + (radius - tickLen) * sinA;

        // Outer Label position (SHR)
        const isNearBottom = angle > 1.05;
        const xLabel = x0 - (radius + (isNearBottom ? 12 : 9)) * cosA;
        const yLabel = y0 + (radius + (isNearBottom ? 12 : 9)) * sinA;

        // Inner Tick coordinates (Delta h / Delta W)
        const xInner = x0 - innerRadius * cosA;
        const yInner = y0 + innerRadius * sinA;
        const xInnerTick = x0 - (innerRadius - 4) * cosA;
        const yInnerTick = y0 + (innerRadius - 4) * sinA;

        // Inner Label position
        const xInnerLabel = x0 - (innerRadius - 10) * cosA;
        const yInnerLabel = y0 + (innerRadius - 10) * sinA;

        const isCurrentHovered = currentActiveSHR === item.shr;
        const showInnerLabel = item.deltaHDeltaW !== undefined && [25.0, 10.0, 5.0, 2.50].includes(item.deltaHDeltaW);

        return (
          <g
            key={`shr-${item.shr}`}
            className="cursor-pointer group"
            onClick={() => {
              if (onSelectSHR) {
                // Toggle off if already selected
                onSelectSHR(activeSHR === item.shr ? null : item.shr);
              }
            }}
            onMouseEnter={() => setHoveredSHR(item.shr)}
            onMouseLeave={() => setHoveredSHR(null)}
          >
            {/* Extended click hit area */}
            <line
              x1={x0}
              y1={y0}
              x2={x0 - (radius + 15) * cosA}
              y2={y0 + (radius + 15) * sinA}
              stroke="transparent"
              strokeWidth="7"
            />

            {/* Outer Tick Mark */}
            <line
              x1={xTickIn}
              y1={yTickIn}
              x2={xOuter}
              y2={yOuter}
              stroke={isCurrentHovered ? accentColor : primaryColor}
              strokeWidth={item.isMajor ? 1.4 : 0.8}
            />

            {/* Inner Tick Mark */}
            {item.deltaHDeltaW !== undefined && (
              <line
                x1={xInnerTick}
                y1={yInnerTick}
                x2={xInner}
                y2={yInner}
                stroke={isCurrentHovered ? accentColor : secondaryColor}
                strokeWidth={0.8}
              />
            )}

            {/* Ray line when hovered or active */}
            {isCurrentHovered && (
              <line
                x1={x0}
                y1={y0}
                x2={xOuter}
                y2={yOuter}
                stroke={accentColor}
                strokeWidth="1.5"
                strokeDasharray="3,2"
              />
            )}

            {/* Outer SHR Label */}
            {item.isMajor && (
              <text
                x={xLabel}
                y={isNearBottom ? yLabel + 7 : yLabel + 2.5}
                textAnchor={isNearBottom ? 'middle' : 'end'}
                fill={isCurrentHovered ? accentColor : textColor}
                fontSize="7.5"
                fontWeight={isCurrentHovered ? 'bold' : 'normal'}
                fontFamily="Fira Code, monospace"
              >
                {item.label}
              </text>
            )}

            {/* Inner Delta_h / Delta_W label */}
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
                {item.deltaHDeltaW}
              </text>
            )}
          </g>
        );
      })}

      {/* Active Ray Extension across diagram from reference point or selected point */}
      {currentActiveSHR !== null && (
        <g className="shr-slope-guide">
          {/* 1. Ray through the Protractor */}
          {(() => {
            const angle = getProtractorAngle(currentActiveSHR, plotWidth, plotHeight, spanT, spanW);
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            return (
              <line
                x1={x0}
                y1={y0}
                x2={x0 - (radius + 22) * cosA}
                y2={y0 + (radius + 22) * sinA}
                stroke={accentColor}
                strokeWidth="2.2"
              />
            );
          })()}

          {/* 2. Room Condition Line (RCL / Recta de Maniobra) through target point */}
          {(() => {
            const angle = getProtractorAngle(currentActiveSHR, plotWidth, plotHeight, spanT, spanW);
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const lineLen = 380;

            return (
              <g>
                <line
                  x1={targetX - lineLen * cosA}
                  y1={targetY + lineLen * sinA}
                  x2={targetX + 130 * cosA}
                  y2={targetY - 130 * sinA}
                  stroke={accentColor}
                  strokeWidth="2"
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
                    width="230"
                    height="18"
                    rx="4"
                    fill={isDarkTheme ? 'rgba(10,10,12,0.92)' : 'rgba(255,255,255,0.95)'}
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
                    Recta Maniobra SHR = {currentActiveSHR.toFixed(2)} · {targetPt.name}
                  </text>
                </g>

                {/* 3. Apparatus Dew Point (ADP) intersection badge if within domain */}
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
                        fill={isDarkTheme ? 'rgba(15,23,42,0.95)' : 'rgba(254,242,242,0.95)'}
                        stroke="#EF4444"
                        strokeWidth="1.2"
                      />
                      <text x="2" y="-1" fill="#DC2626" fontSize="8" fontWeight="bold" fontFamily="Roboto Condensed, sans-serif">
                        ADP (Punto Rocío Aparato)
                      </text>
                      <text x="2" y="9" fill={textColor} fontSize="7.5" fontFamily="Fira Code, monospace">
                        Tadp: {adpData.tdbAdp.toFixed(1)}°C · w: {(adpData.wAdp * 1000).toFixed(1)} g/kg
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
        <g transform={`translate(${x0 - 80}, ${y0 + radius + 22})`} className="pointer-events-none">
          <rect
            x="-82"
            y="-9"
            width="164"
            height="18"
            rx="4"
            fill={isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : isGreenTheme ? 'rgba(240, 253, 244, 0.96)' : 'rgba(254, 243, 199, 0.96)'}
            stroke={accentColor}
            strokeWidth="1"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill={accentColor}
            fontSize="7.8"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
          >
            FCS = {currentActiveSHR.toFixed(2)} · {(currentActiveSHR * 100).toFixed(0)}% Sens. / {((1 - currentActiveSHR) * 100).toFixed(0)}% Lat.
          </text>
        </g>
      )}

      {/* ASHRAE Reference point mark: 24°C, 50% RH */}
      <g transform={`translate(${refX}, ${refY})`} className="pointer-events-none">
        <circle cx="0" cy="0" r="3.5" fill={primaryColor} opacity="0.85" />
        <circle cx="0" cy="0" r="7" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.7" />
        <line x1="-9" y1="0" x2="9" y2="0" stroke={primaryColor} strokeWidth="0.7" opacity="0.6" />
        <line x1="0" y1="-9" x2="0" y2="9" stroke={primaryColor} strokeWidth="0.7" opacity="0.6" />
      </g>
    </g>
  );
};
