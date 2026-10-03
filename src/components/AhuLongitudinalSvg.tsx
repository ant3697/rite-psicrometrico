import React, { useState } from 'react';
import {
  StatePoint,
  AHUModuleItem,
  AHUModuleType,
} from '../types/psychrometrics';
import { IDAESectionSymbol } from './IDAESymbols';
import { AHUStepResult } from './HVACSchematicViewer';

export interface AhuLongitudinalSvgProps {
  dynamicSvgViewBoxWidth: number;
  dynamicChassisWidth: number;
  cutViewMode: 'elevation' | 'plan' | 'dual';
  transform: { zoom: number; panX: number; panY: number };
  isWhiteTheme: boolean;
  isOverAhu?: boolean;
  hoveredSlotIndex?: number | null;
  enabledModules: AHUModuleItem[];
  moduleWidths: Record<AHUModuleType, number>;
  moduleDimensionsMeters: Record<AHUModuleType, number>;
  totalLengthMeters: number;
  editingModuleId: string | null;
  ahuSteps: AHUStepResult[];
  selectedPointId: string | null;
  outdoorPoint: StatePoint;
  supplyPoint: StatePoint;
  isFlowActive: boolean;
  onSelectPoint: (id: string) => void;
  onSelectModuleAndPoint: (modId: string, ptId?: string) => void;
  onMoveModule?: (index: number, direction: 'left' | 'right') => void;
  onRemoveModule?: (id: string) => void;
  onDragExistingModule?: (index: number) => void;
  onDragEndExistingModule?: () => void;
  onOpenEducationalGuide?: (moduleId: string) => void;
  getIdaeModuleTitle: (mod: AHUModuleItem) => string;
  isSplit?: boolean;
  propertiesDetailMode?: 'full' | 'compact' | 'hover';
}

export const MODULE_SPACING = 0;

export const AhuLongitudinalSvg: React.FC<AhuLongitudinalSvgProps> = ({
  dynamicSvgViewBoxWidth,
  dynamicChassisWidth,
  cutViewMode,
  transform,
  isWhiteTheme,
  isOverAhu = false,
  hoveredSlotIndex = null,
  enabledModules,
  moduleWidths,
  moduleDimensionsMeters,
  totalLengthMeters,
  editingModuleId,
  ahuSteps,
  selectedPointId,
  outdoorPoint,
  supplyPoint,
  isFlowActive,
  onSelectPoint,
  onSelectModuleAndPoint,
  onMoveModule,
  onRemoveModule,
  onDragExistingModule,
  onDragEndExistingModule,
  onOpenEducationalGuide,
  getIdaeModuleTitle,
  isSplit = false,
  propertiesDetailMode = 'hover',
}) => {
  const [hoveredTransition, setHoveredTransition] = useState<number | null>(null);

  const effZoom = isSplit ? 1 : transform.zoom;
  const effPanX = isSplit ? 0 : transform.panX;
  const effPanY = isSplit ? 0 : transform.panY;

  // ViewBox height adapts tightly to content and unified tags between auxiliary cota lines
  const viewBoxHeight =
    cutViewMode === 'dual'
      ? 650
      : propertiesDetailMode === 'full'
      ? 365
      : 335;

  const centerOffsetY = viewBoxHeight / 2;

  // Exact anchor positions for elements in single view
  const chassisY = 46;
  const chassisHeight = 186;

  // Bottom cotas position: clean spacing below the unified section transition tag
  const cotasY = propertiesDetailMode === 'full' ? 262 : 232;
  const totalCotaSpacing = 36;
  const totalCotaY = cotasY + totalCotaSpacing;

  // Clamping for smooth natural panning without locking at zoom 1.0
  const maxSafePanX = Math.max(300, (dynamicSvgViewBoxWidth * Math.max(0, effZoom - 0.5)) / 2 + 150);
  const maxSafePanY = Math.max(150, (viewBoxHeight * Math.max(0, effZoom - 0.5)) / 2 + 80);
  const safePanX = Math.max(-maxSafePanX, Math.min(maxSafePanX, effPanX));
  const safePanY = Math.max(-maxSafePanY, Math.min(maxSafePanY, effPanY));

  // Base X positions
  const ahuStartX = 135;

  // Data for active hovered transition
  const activeTransitionIndex = hoveredTransition !== null ? hoveredTransition - 1 : null;
  const activeTransitionMod =
    activeTransitionIndex !== null && activeTransitionIndex >= 0 && activeTransitionIndex < enabledModules.length
      ? enabledModules[activeTransitionIndex]
      : null;
  const activeTransitionStep =
    activeTransitionMod !== null ? ahuSteps.find((s) => s.module.id === activeTransitionMod.id) : null;

  return (
    <svg
      viewBox={`0 0 ${dynamicSvgViewBoxWidth} ${viewBoxHeight}`}
      className="w-full h-full drop-shadow-2xl overflow-hidden select-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Strict ClipPath bounding all schematic content to the white window area */}
        <clipPath id="ahuWhiteWindowClip">
          <rect x="0" y="0" width={dynamicSvgViewBoxWidth} height={viewBoxHeight} rx="6" />
        </clipPath>

        {/* Subtle luminous aerodynamic airflow gradient through the continuous duct tunnel */}
        <linearGradient id="ahuTunnelAirGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
          <stop offset="30%" stopColor="#0EA5E9" stopOpacity="0.08" />
          <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.12" />
        </linearGradient>

        <linearGradient id="casingWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>

        <linearGradient id="canvasBellowsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="25%" stopColor="#475569" />
          <stop offset="50%" stopColor="#1E293B" />
          <stop offset="75%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <pattern id="cadGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.9" fill={isWhiteTheme ? '#CBD5E1' : '#1E293B'} opacity="0.45" />
        </pattern>

        <filter id="glowDrop" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="hudCardShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* STATIC WINDOW BACKGROUND (Does NOT pan/zoom, stays solidly bounded in the window with clean CAD sheet frame) */}
      <rect
        x="0"
        y="0"
        width={dynamicSvgViewBoxWidth}
        height={viewBoxHeight}
        rx="6"
        fill={isWhiteTheme ? '#FFFFFF' : '#070B14'}
        stroke={isWhiteTheme ? '#94A3B8' : '#1E293B'}
        strokeWidth="1.5"
      />
      <rect
        x="0"
        y="0"
        width={dynamicSvgViewBoxWidth}
        height={viewBoxHeight}
        rx="6"
        fill="url(#cadGrid)"
        clipPath="url(#ahuWhiteWindowClip)"
      />

      {/* STATIC NON-TRANSFORMED CLIP CONTAINER: Strictly bounds ALL dynamic elements to the white window area */}
      <g clipPath="url(#ahuWhiteWindowClip)">
        <g
          transform={`translate(${dynamicSvgViewBoxWidth / 2 + safePanX}, ${
            centerOffsetY + safePanY
          }) scale(${effZoom}) translate(${-dynamicSvgViewBoxWidth / 2}, ${
            -centerOffsetY
          })`}
          className="transition-transform duration-75"
        >
        {/* Canvas Header Subtitle */}
        <text
          x={dynamicSvgViewBoxWidth / 2}
          y="22"
          textAnchor="middle"
          fill={isWhiteTheme ? '#475569' : '#64748B'}
          fontSize="10"
          fontWeight="bold"
          fontFamily="JetBrains Mono"
          letterSpacing="1.2"
        >
          {cutViewMode === 'elevation'
            ? 'CORTE LONGITUDINAL UTA EN ALZADO · PROPIEDADES EN CAMBIOS DE SECCIÓN'
            : cutViewMode === 'plan'
            ? 'CORTE LONGITUDINAL UTA EN PLANTA (PÁGINAS 17 Y 18 GUÍA IDAE)'
            : 'CORTE LONGITUDINAL UTA · VISTA DUAL ALZADO & PLANTA NORMALIZADA'}
        </text>

        {/* ---------------- AIR INTAKE: AIRE EXTERIOR (01.png / ATECYR) ---------------- */}
        <g transform={`translate(${ahuStartX - 110}, ${cutViewMode === 'dual' ? 48 : chassisY})`}>
          {/* 5 Canonical Green Arrows entering intake (01.png) */}
          {[46, 68, 93, 118, 140].map((dy, i) => (
            <g key={`arrow-in-${i}`}>
              <line x1="12" y1={dy} x2="86" y2={dy} stroke="#10B981" strokeWidth="2.8" strokeLinecap="round" />
              <polygon points={`86,${dy} 76,${dy - 4.5} 76,${dy + 4.5}`} fill="#10B981" />
            </g>
          ))}

          {/* Stepped Duct Intake Collar (01.png) */}
          <path
            d="M 86 35 L 110 35 L 110 151 L 86 151"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          {/* Technical label matching 01.png: 'Aire exterior' in blue */}
          <text
            x="48"
            y="210"
            textAnchor="middle"
            fill={isWhiteTheme ? '#1E3A8A' : '#60A5FA'}
            fontSize="14"
            fontWeight="bold"
            fontFamily="Plus Jakarta Sans"
          >
            Aire exterior
          </text>

          {/* ODA State Badge */}
          <g
            transform="translate(48, 235)"
            className="cursor-pointer group"
            onClick={() => onSelectPoint(outdoorPoint.id)}
          >
            <rect
              x="-54"
              y="-12"
              width="108"
              height="24"
              rx="12"
              fill={isWhiteTheme ? '#FFFFFF' : '#0B132B'}
              stroke="#EF4444"
              strokeWidth="1.6"
              filter={isWhiteTheme ? undefined : 'url(#glowDrop)'}
            />
            <circle cx="-42" cy="0" r="3.5" fill="#EF4444" />
            <text
              x="5"
              y="0"
              dominantBaseline="central"
              textAnchor="middle"
              fill={isWhiteTheme ? '#DC2626' : '#FCA5A5'}
              fontSize="9.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              {outdoorPoint.tdb.toFixed(1)}°C | {outdoorPoint.rh.toFixed(0)}%
            </text>
          </g>
        </g>

        {/* ---------------- TRAIN 1: ELEVATION (OR ACTIVE VIEW) ---------------- */}
        <g transform={`translate(${ahuStartX}, ${cutViewMode === 'dual' ? 48 : chassisY})`}>
          {cutViewMode === 'dual' && (
            <text
              x="10"
              y="-14"
              fill="#38BDF8"
              fontSize="10"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              letterSpacing="1"
            >
              ▲ ALZADO (CORTE LONGITUDINAL)
            </text>
          )}

          {/* Stepped Discharge Collar on Right (01.png) */}
          <path
            d={`M ${dynamicChassisWidth} 35 L ${dynamicChassisWidth + 24} 35 L ${dynamicChassisWidth + 24} 151 L ${dynamicChassisWidth} 151`}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          {/* 4 Canonical Green Arrows exiting to supply duct (01.png) */}
          {[56, 82, 108, 134].map((dy, i) => (
            <g key={`arrow-out-${i}`}>
              <line
                x1={dynamicChassisWidth + 24}
                y1={dy}
                x2={dynamicChassisWidth + 98}
                y2={dy}
                stroke="#10B981"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <polygon
                points={`${dynamicChassisWidth + 98},${dy} ${dynamicChassisWidth + 88},${dy - 4.5} ${dynamicChassisWidth + 88},${dy + 4.5}`}
                fill="#10B981"
              />
            </g>
          ))}

          {/* Technical label matching 01.png: 'Aire Impulsado' in blue */}
          <text
            x={dynamicChassisWidth + 62}
            y="210"
            textAnchor="middle"
            fill={isWhiteTheme ? '#1E3A8A' : '#60A5FA'}
            fontSize="14"
            fontWeight="bold"
            fontFamily="Plus Jakarta Sans"
          >
            Aire Impulsado
          </text>

          {/* Chassis mounting pedestals / bancada from Cuerpo-contenedor.svg */}
          {[25, Math.floor(dynamicChassisWidth * 0.35), Math.floor(dynamicChassisWidth * 0.7), dynamicChassisWidth - 45].map((lx, i) => (
            <g key={`leg-${i}`} transform={`translate(${lx}, 186)`}>
              <rect
                x="0"
                y="0"
                width="36"
                height="15"
                fill={isWhiteTheme ? '#CBD5E1' : '#1E293B'}
                stroke={isWhiteTheme ? '#000000' : '#475569'}
                strokeWidth="1.6"
                rx="2"
              />
              <circle cx="18" cy="7.5" r="2.5" fill="#64748B" />
            </g>
          ))}

          {/* Canonical Double-Wall Casing (Cuerpo Contenedor de 01.png & Cuerpo-contenedor.svg) */}
          {/* Outer thick structural line */}
          <rect
            x="0"
            y="0"
            width={dynamicChassisWidth}
            height="186"
            fill={isWhiteTheme ? '#FFFFFF' : '#070B14'}
            stroke={isWhiteTheme ? '#000000' : '#475569'}
            strokeWidth="3.4"
          />

          {/* Inner double-wall insulation profile */}
          <rect
            x="5"
            y="5"
            width={dynamicChassisWidth - 10}
            height="176"
            fill={isWhiteTheme ? '#F8FAFC' : '#0B1120'}
            stroke={isWhiteTheme ? '#000000' : '#334155'}
            strokeWidth="1.6"
          />

          {/* Luminous Continuous Airflow Stream Background (Fusión aerodinámica) */}
          <rect
            x="3"
            y="3"
            width={dynamicChassisWidth - 6}
            height="180"
            fill="url(#ahuTunnelAirGrad)"
            pointerEvents="none"
          />

          {/* Continuous Upper and Lower Perimeter Profiles (Perfilería de aluminio extruido RITE) */}
          <rect x="0" y="0" width={dynamicChassisWidth} height="6" fill={isWhiteTheme ? '#E2E8F0' : '#1E293B'} opacity="0.9" />
          <rect x="0" y="180" width={dynamicChassisWidth} height="6" fill={isWhiteTheme ? '#E2E8F0' : '#1E293B'} opacity="0.9" />

          {/* Insertion Drop Guides when dragging from palette or reordering */}
          {isOverAhu && (
            <g className="insertion-guides" pointerEvents="none">
              {(() => {
                let runningX = 6;
                const slots = [runningX];
                enabledModules.forEach((m) => {
                  runningX += (moduleWidths[m.type] || 120) + MODULE_SPACING;
                  slots.push(runningX);
                });

                return slots.map((sx, sIdx) => {
                  const isHovered = hoveredSlotIndex === sIdx;
                  return (
                    <g key={`drop-slot-${sIdx}`} transform={`translate(${sx - 4}, 6)`}>
                      <rect
                        x="0"
                        y="0"
                        width="8"
                        height="174"
                        fill={isHovered ? '#38BDF8' : '#0284C7'}
                        opacity={isHovered ? 0.95 : 0.35}
                        stroke="#38BDF8"
                        strokeDasharray="4,3"
                      />
                      {isHovered && (
                        <g transform="translate(4, 87)">
                          <circle cx="0" cy="0" r="14" fill="#0284C7" stroke="#38BDF8" strokeWidth="2.5" />
                          <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">
                            +
                          </text>
                        </g>
                      )}
                    </g>
                  );
                });
              })()}
            </g>
          )}

          {/* ---------------- MODULES LOOP & TRANSITIONS AT EACH SECTION CHANGE ---------------- */}
          {(() => {
            let currentOffset = 6;

            return enabledModules.map((mod, index) => {
              const modWidth = moduleWidths[mod.type] || 120;
              const modX = currentOffset;
              currentOffset += modWidth + MODULE_SPACING;
              const isModActive = editingModuleId === mod.id;
              const step = ahuSteps.find((s) => s.module.id === mod.id);
              const isStepPointSelected =
                step && (selectedPointId === step.associatedPointId || selectedPointId === step.exitPoint.id);

              // Thermodynamic properties and modifications for this section change
              const entry = step ? step.entryPoint : outdoorPoint;
              const exit = step ? step.exitPoint : outdoorPoint;

              const tdb = exit.tdb;
              const rh = exit.rh;
              const wGrams = exit.w * 1000;
              const hKj = exit.h;

              const deltaTdb = exit.tdb - entry.tdb;
              const deltaRh = exit.rh - entry.rh;
              const deltaWGrams = (exit.w - entry.w) * 1000;

              const pressureDropPa = mod.pressureDropPa;

              // Compute modifications labels depending on module nature
              let deltaText = '';
              let badgeThemeColor = '#38BDF8';

              if (mod.type === 'cooling_coil') {
                badgeThemeColor = '#0284C7';
                deltaText = `❄ ΔT: ${deltaTdb.toFixed(1)}° · ΔHR: +${Math.abs(deltaRh).toFixed(0)}%`;
              } else if (mod.type === 'heating_coil' || mod.type === 'electric_heater') {
                badgeThemeColor = '#EF4444';
                deltaText = `🔥 ΔT: +${deltaTdb.toFixed(1)}° · w=cte`;
              } else if (mod.type === 'mixing_box') {
                badgeThemeColor = '#F59E0B';
                const rPct = Math.round((mod.params.outdoorRatio ?? 0.3) * 100);
                deltaText = `🔀 Mezcla (${rPct}% ODA)`;
              } else if (mod.type === 'heat_recovery' || mod.type === 'rotary_wheel') {
                badgeThemeColor = '#0EA5E9';
                deltaText = `♻ Recup · ΔT: ${deltaTdb.toFixed(1)}°`;
              } else if (mod.type === 'fan' || mod.type === 'belt_fan' || mod.type === 'return_fan') {
                badgeThemeColor = '#10B981';
                deltaText = `💨 Rodete: +${mod.params.staticPressurePa ?? 450} Pa`;
              } else if (mod.type === 'prefilter' || mod.type === 'prefilter_flat' || mod.type === 'final_filter') {
                badgeThemeColor = '#E11D48';
                deltaText = `🛡 Filtro · ΔP: -${pressureDropPa} Pa`;
              } else if (mod.type === 'intake_damper' || mod.type === 'exhaust_damper') {
                badgeThemeColor = '#10B981';
                deltaText = `🚪 Compuerta · ΔP: -${pressureDropPa} Pa`;
              } else if (mod.type === 'humidifier' || mod.type === 'adiabatic_cooling') {
                badgeThemeColor = '#06B6D4';
                deltaText = `💧 Humidif. · Δw: +${deltaWGrams.toFixed(1)}g`;
              } else if (mod.type === 'silencer') {
                badgeThemeColor = '#64748B';
                deltaText = `🔇 Silenciador -${mod.params.attenuationDb ?? 18} dB`;
              } else {
                badgeThemeColor = '#38BDF8';
                deltaText = `ΔP: -${pressureDropPa} Pa`;
              }

              // X coordinate of the section change joint
              const transitionJointX = modX + modWidth;
              const isTransitionHovered = hoveredTransition === index + 1;

              // Unified Tag strictly situated between auxiliary cota lines of this module section
              // Guaranteed ZERO overlap between adjacent sections
              const tagMargin = 3;
              const tagX = modX + tagMargin;
              const tagWidth = Math.max(76, modWidth - tagMargin * 2);
              const tagY = 192;
              const isCompact = propertiesDetailMode === 'compact';
              const tagHeight = isCompact ? 24 : 52;

              return (
                <g key={mod.id}>
                  {/* ---------------- 1. THE MODULE SECTION ITSELF ---------------- */}
                  <g
                    transform={`translate(${modX}, 6)`}
                    className="cursor-pointer group"
                    onClick={() => onSelectModuleAndPoint(mod.id, step?.associatedPointId)}
                  >
                    {/* Section Casing Compartment Frame (Sharp CAD alignment matching 01.png) */}
                    <rect
                      x="0"
                      y="0"
                      width={modWidth}
                      height="174"
                      fill={
                        isModActive || isStepPointSelected
                          ? isWhiteTheme
                            ? '#F0F9FF'
                            : '#1E293B'
                          : isWhiteTheme
                          ? '#FFFFFF'
                          : '#090E1A'
                      }
                      fillOpacity={isModActive || isStepPointSelected ? 0.95 : 0.5}
                      stroke={
                        isStepPointSelected
                          ? '#0284C7'
                          : isModActive
                          ? '#F59E0B'
                          : isWhiteTheme
                          ? '#CBD5E1'
                          : '#1E293B'
                      }
                      strokeWidth={isModActive || isStepPointSelected ? '2' : '1'}
                    />

                    {/* Official IDAE Section Technical Symbol */}
                    <g className="transition-transform group-hover:scale-[1.005] transform-origin-center">
                      <IDAESectionSymbol
                        mod={mod}
                        modWidth={modWidth}
                        isFlowActive={isFlowActive}
                        isWhiteTheme={isWhiteTheme}
                        viewMode={cutViewMode === 'plan' ? 'plan' : 'elevation'}
                      />
                    </g>

                    {/* UPPER LAYER NAVIGATION & DRAG CONTROLS (Appears ONLY on hover so drawing stays clean like 01.png) */}
                    {!isSplit && (
                      <g className="module-upper-controls opacity-0 group-hover:opacity-100 transition-opacity">
                        <g transform="translate(4, 5)">
                          <rect
                            x="0"
                            y="0"
                            width={onMoveModule ? (index > 0 && index < enabledModules.length - 1 ? 64 : 46) : 22}
                            height="19"
                            rx="9.5"
                            fill="#0A0F1D"
                            stroke="#38BDF8"
                            strokeWidth="1"
                            filter="url(#glowDrop)"
                          />

                          {/* Drag Grip Handle (⋮⋮) */}
                          <g
                            transform="translate(4, 1.5)"
                            className="cursor-grab active:cursor-grabbing hover:opacity-100"
                            {...({ draggable: true } as any)}
                            onDragStart={(e: React.DragEvent<SVGGElement>) => {
                              e.stopPropagation();
                              e.dataTransfer.setData('application/ahu-existing-index', String(index));
                              e.dataTransfer.effectAllowed = 'move';
                              onDragExistingModule?.(index);
                            }}
                            onDragEnd={() => {
                              onDragEndExistingModule?.();
                            }}
                          >
                            <rect x="-2" y="-1" width="14" height="17" fill="transparent" />
                            <circle cx="2.5" cy="3.5" r="1.3" fill="#38BDF8" />
                            <circle cx="7.5" cy="3.5" r="1.3" fill="#38BDF8" />
                            <circle cx="2.5" cy="8" r="1.3" fill="#38BDF8" />
                            <circle cx="7.5" cy="8" r="1.3" fill="#38BDF8" />
                            <circle cx="2.5" cy="12.5" r="1.3" fill="#38BDF8" />
                            <circle cx="7.5" cy="12.5" r="1.3" fill="#38BDF8" />
                          </g>

                          {/* Reorder Left Button (◀) */}
                          {onMoveModule && index > 0 && (
                            <g
                              transform="translate(17, 1.5)"
                              className="cursor-pointer hover:scale-110 transition-transform"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveModule(index, 'left');
                              }}
                            >
                              <circle cx="7.5" cy="7.5" r="7" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                              <text x="7.5" y="10.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">◀</text>
                            </g>
                          )}

                          {/* Reorder Right Button (▶) */}
                          {onMoveModule && index < enabledModules.length - 1 && (
                            <g
                              transform={`translate(${index > 0 ? 35 : 17}, 1.5)`}
                              className="cursor-pointer hover:scale-110 transition-transform"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveModule(index, 'right');
                              }}
                            >
                              <circle cx="7.5" cy="7.5" r="7" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                              <text x="7.5" y="10.5" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">▶</text>
                            </g>
                          )}
                        </g>

                        {/* Direct Removal Button (✕) */}
                        {onRemoveModule && (
                          <g
                            transform={`translate(${modWidth - 23}, 5)`}
                            className="cursor-pointer hover:scale-110 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveModule(mod.id);
                            }}
                          >
                            <circle cx="9.5" cy="9.5" r="8.5" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1.2" filter="url(#glowDrop)" />
                            <text x="9.5" y="13" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="bold">✕</text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Canonical IDAE Header Title on top of module with 💡 Educational trigger */}
                    {getIdaeModuleTitle(mod) && (
                      <g>
                        <text
                          x={modWidth / 2}
                          y="-12"
                          textAnchor="middle"
                          fill={isStepPointSelected ? '#0284C7' : isWhiteTheme ? '#000000' : '#E2E8F0'}
                          fontSize="13.5"
                          fontWeight="bold"
                          fontFamily="Plus Jakarta Sans"
                        >
                          {getIdaeModuleTitle(mod)}
                        </text>

                        {/* Educational Lightbulb Trigger 💡 */}
                        <g
                          transform={`translate(${modWidth / 2 + Math.min(54, getIdaeModuleTitle(mod).length * 4.4) + 4}, -22)`}
                          className="cursor-pointer hover:scale-125 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEducationalGuide?.(mod.id);
                          }}
                        >
                          <rect
                            x="-2"
                            y="0"
                            width="18"
                            height="15"
                            rx="4"
                            fill={isWhiteTheme ? '#FEF3C7' : '#0B132B'}
                            stroke="#F59E0B"
                            strokeWidth="0.8"
                            opacity="0.9"
                          />
                          <text x="7" y="11" textAnchor="middle" fontSize="9.5">💡</text>
                        </g>
                      </g>
                    )}
                  </g>

                  {/* ---------------- 2. SECTION CHANGE PARTITION SEAM LINE & INFORMATIVE PIN ---------------- */}
                  <g
                    className="cursor-pointer group/trans touch-manipulation"
                    onMouseEnter={() => setHoveredTransition(index + 1)}
                    onMouseLeave={() => setHoveredTransition(null)}
                    onClick={() => {
                      setHoveredTransition((prev) => (prev === index + 1 ? null : index + 1));
                      onSelectModuleAndPoint(mod.id, step?.associatedPointId);
                    }}
                  >
                    {/* Vertical structural partition wall between modules (Solid black in 01.png) */}
                    {index < enabledModules.length - 1 && (
                      <line
                        x1={transitionJointX}
                        y1="5"
                        x2={transitionJointX}
                        y2="181"
                        stroke={isTransitionHovered || isStepPointSelected ? '#EF4444' : isWhiteTheme ? '#000000' : '#475569'}
                        strokeWidth={isTransitionHovered || isStepPointSelected ? '2.4' : '1.8'}
                      />
                    )}

                    {/* Numbered Pin Badge at the top of the joint: ALWAYS VISIBLE across all modules */}
                    <g transform={`translate(${transitionJointX}, -6)`}>
                      {/* Generous 44px touch hit circle for touchscreens */}
                      <circle
                        cx="0"
                        cy="0"
                        r="22"
                        fill="transparent"
                        className="cursor-pointer touch-manipulation"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={isTransitionHovered || isStepPointSelected ? 12 : 9.5}
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth="1.6"
                        filter="url(#glowDrop)"
                        className="transition-transform pointer-events-none"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize={isTransitionHovered || isStepPointSelected ? '10' : '9'}
                        fontWeight="bold"
                        fontFamily="JetBrains Mono"
                        className="pointer-events-none select-none"
                      >
                        {index + 1}
                      </text>
                    </g>
                  </g>

                  {/* ---------------- 3. UNIFIED SECTION TRANSITION TAG (BETWEEN AUXILIARY COTA LINES) ---------------- */}
                  {/* Positioned strictly between the auxiliary witness lines of this section with 3px clearance. ZERO OVERLAP guaranteed */}
                  <g
                    transform={`translate(${tagX}, ${tagY})`}
                    className="cursor-pointer group/card"
                    onClick={() => onSelectModuleAndPoint(mod.id, step?.associatedPointId)}
                    onMouseEnter={() => setHoveredTransition(index + 1)}
                    onMouseLeave={() => setHoveredTransition(null)}
                  >
                    {/* Unified Tag Background Frame */}
                    <rect
                      x="0"
                      y="0"
                      width={tagWidth}
                      height={tagHeight}
                      rx="5"
                      fill={
                        isStepPointSelected || isModActive
                          ? isWhiteTheme
                            ? '#EFF6FF'
                            : '#0B172E'
                          : isWhiteTheme
                          ? '#FFFFFF'
                          : '#070C18'
                      }
                      stroke={
                        isStepPointSelected
                          ? '#0284C7'
                          : isModActive
                          ? '#F59E0B'
                          : isTransitionHovered
                          ? '#38BDF8'
                          : isWhiteTheme
                          ? '#CBD5E1'
                          : '#1E293B'
                      }
                      strokeWidth={isStepPointSelected || isModActive || isTransitionHovered ? '2' : '1.2'}
                      filter={isStepPointSelected || isModActive || isTransitionHovered ? (isWhiteTheme ? undefined : 'url(#glowDrop)') : undefined}
                    />

                    {/* Row 1: Pin Number Badge + Tbs and HR */}
                    <g transform="translate(4, 4)">
                      <rect
                        x="0"
                        y="0"
                        width="15"
                        height="14"
                        rx="3"
                        fill={step?.associatedPointColor || '#EF4444'}
                      />
                      <text
                        x="7.5"
                        y="10.5"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono"
                      >
                        {index + 1}
                      </text>
                      <text
                        x="19"
                        y="10.5"
                        fill={isWhiteTheme ? '#0F172A' : '#F8FAFC'}
                        fontSize={tagWidth < 90 ? '8' : '8.5'}
                        fontWeight="bold"
                        fontFamily="JetBrains Mono"
                      >
                        {tdb.toFixed(1)}° <tspan fill={isWhiteTheme ? '#64748B' : '#94A3B8'} fontWeight="normal">·</tspan> <tspan fill={isWhiteTheme ? '#059669' : '#34D399'}>{rh.toFixed(0)}%</tspan>
                      </text>
                    </g>

                    {!isCompact && (
                      <>
                        {/* Row 2: Specific Humidity (w) & Enthalpy (h) */}
                        <text
                          x="5"
                          y="28"
                          fill={isWhiteTheme ? '#475569' : '#94A3B8'}
                          fontSize={tagWidth < 95 ? '7.2' : '7.8'}
                          fontFamily="JetBrains Mono"
                        >
                          w: <tspan fill={isWhiteTheme ? '#0284C7' : '#38BDF8'} fontWeight="bold">{wGrams.toFixed(1)}g</tspan> · h: <tspan fill={isWhiteTheme ? '#0F766E' : '#2DD4BF'} fontWeight="bold">{hKj.toFixed(1)}kJ</tspan>
                        </text>

                        {/* Row 3: Action / Differential Strip */}
                        <g transform="translate(3, 33)">
                          <rect
                            x="0"
                            y="0"
                            width={tagWidth - 6}
                            height="15"
                            rx="3"
                            fill={isWhiteTheme ? '#F8FAFC' : '#030712'}
                            stroke={badgeThemeColor}
                            strokeWidth="0.8"
                            strokeOpacity="0.6"
                          />
                          <text
                            x={(tagWidth - 6) / 2}
                            y="10.5"
                            dominantBaseline="central"
                            textAnchor="middle"
                            fill={badgeThemeColor}
                            fontSize={tagWidth < 90 ? '6.8' : '7.4'}
                            fontWeight="bold"
                            fontFamily="JetBrains Mono"
                          >
                            {deltaText}
                          </text>
                        </g>
                      </>
                    )}
                  </g>
                </g>
              );
            });
          })()}

          {/* ---------------- 4. SPACED COTAS (DIMENSIONS) ---------------- */}
          {cutViewMode !== 'dual' && (
            <>
              {/* Individual Section Dimensions in canonical IDAE Magenta (#E11D48) */}
              <g transform={`translate(0, ${cotasY})`}>
                {(() => {
                  let currentX = 6;
                  return enabledModules.map((mod, idx) => {
                    const w = moduleWidths[mod.type] || 120;
                    const xStart = currentX;
                    const xEnd = currentX + w;
                    const xMid = currentX + w / 2;
                    const dimMeters = (moduleDimensionsMeters[mod.type] || 0.4).toFixed(2).replace('.', ',');
                    currentX += w + MODULE_SPACING;

                    // Relative witness line top: starts precisely at the casing bottom (Y = 186)
                    const witnessTopY = propertiesDetailMode === 'full' ? -76 : -46;

                    return (
                      <g key={`dim-mod-${mod.id}-${idx}`}>
                        {/* Witness Reference Lines (Extending from casing bottom past unified tag to dimension line) */}
                        <line x1={xStart} y1={witnessTopY} x2={xStart} y2="8" stroke="#E11D48" strokeWidth="1.2" strokeOpacity="0.75" />
                        <line x1={xEnd} y1={witnessTopY} x2={xEnd} y2="8" stroke="#E11D48" strokeWidth="1.2" strokeOpacity="0.75" />

                        {/* Dimension Line with Arrows */}
                        <line x1={xStart} y1="0" x2={xEnd} y2="0" stroke="#E11D48" strokeWidth="1.3" />
                        <polygon points={`${xStart},0 ${xStart + 5},-3 ${xStart + 5},3`} fill="#E11D48" />
                        <polygon points={`${xEnd},0 ${xEnd - 5},-3 ${xEnd - 5},3`} fill="#E11D48" />

                        {/* Enclosed Value Badge: generous frame containing 100% of text */}
                        <rect
                          x={xMid - 25}
                          y="-9"
                          width="50"
                          height="18"
                          fill={isWhiteTheme ? '#FFFFFF' : '#070B14'}
                          stroke="#E11D48"
                          strokeWidth="1"
                          rx="3.5"
                        />
                        <text
                          x={xMid}
                          y="0"
                          dominantBaseline="central"
                          textAnchor="middle"
                          fill="#E11D48"
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono"
                        >
                          {dimMeters}
                        </text>
                      </g>
                    );
                  });
                })()}

                {/* Overall Total Length Dimension spaced cleanly underneath (Cota 2) */}
                <g transform={`translate(0, ${totalCotaSpacing})`}>
                  {/* Extension Witness Lines connecting all the way up */}
                  {(() => {
                    const totalWitnessTopY = -(totalCotaSpacing + (cotasY - 186));
                    return (
                      <>
                        <line x1="6" y1={totalWitnessTopY} x2="6" y2="8" stroke={isWhiteTheme ? '#0F172A' : '#E2E8F0'} strokeWidth="1.4" strokeOpacity="0.8" />
                        <line
                          x1={dynamicChassisWidth - 6}
                          y1={totalWitnessTopY}
                          x2={dynamicChassisWidth - 6}
                          y2="8"
                          stroke={isWhiteTheme ? '#0F172A' : '#E2E8F0'}
                          strokeWidth="1.4"
                          strokeOpacity="0.8"
                        />
                      </>
                    );
                  })()}

                  {/* Main Length Dimension Line */}
                  <line
                    x1="6"
                    y1="0"
                    x2={dynamicChassisWidth - 6}
                    y2="0"
                    stroke={isWhiteTheme ? '#0F172A' : '#E2E8F0'}
                    strokeWidth="1.5"
                  />
                  <polygon points="6,0 13,-3.5 13,3.5" fill={isWhiteTheme ? '#0F172A' : '#E2E8F0'} />
                  <polygon
                    points={`${dynamicChassisWidth - 6},0 ${dynamicChassisWidth - 13},-3.5 ${dynamicChassisWidth - 13},3.5`}
                    fill={isWhiteTheme ? '#0F172A' : '#E2E8F0'}
                  />

                  {/* Center Total Value Plaque: 210px wide to hold entire string with ample margin */}
                  <rect
                    x={dynamicChassisWidth / 2 - 105}
                    y="-11"
                    width="210"
                    height="22"
                    fill={isWhiteTheme ? '#FFFFFF' : '#070B14'}
                    stroke={isWhiteTheme ? '#CBD5E1' : '#334155'}
                    strokeWidth="1.2"
                    rx="4"
                  />
                  <text
                    x={dynamicChassisWidth / 2}
                    y="0"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill={isWhiteTheme ? '#0F172A' : '#F8FAFC'}
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono"
                  >
                    Longitud Total: {totalLengthMeters.toFixed(2).replace('.', ',')} m
                  </text>
                </g>
              </g>

              {/* Vertical Height Dimension on Left (Cota vertical 0,62 / 0,42 m) spaced to left of arrows */}
              <g transform="translate(-118, 0)">
                <line x1="118" y1="8" x2="-8" y2="8" stroke="#059669" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="3,3" />
                <line x1="118" y1="178" x2="-8" y2="178" stroke="#059669" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="3,3" />

                {/* Vertical line top segment */}
                <line x1="0" y1="8" x2="0" y2="47" stroke="#059669" strokeWidth="1.4" />
                <polygon points="0,8 -3.5,15 3.5,15" fill="#059669" />

                {/* Vertical line bottom segment */}
                <line x1="0" y1="139" x2="0" y2="178" stroke="#059669" strokeWidth="1.4" />
                <polygon points="0,178 -3.5,171 3.5,171" fill="#059669" />

                {/* Badge */}
                <rect
                  x="-15"
                  y="49"
                  width="30"
                  height="88"
                  fill={isWhiteTheme ? '#FFFFFF' : '#070B14'}
                  stroke="#059669"
                  strokeWidth="1.2"
                  rx="4"
                />
                <text
                  x="0"
                  y="93"
                  dominantBaseline="central"
                  textAnchor="middle"
                  fill="#059669"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  transform="rotate(-90, 0, 93)"
                >
                  0,62 / 0,42 m
                </text>
              </g>
            </>
          )}
        </g>

        {/* ---------------- TRAIN 2: PLAN VIEW (WHEN IN DUAL MODE PÁG. 17-18) ---------------- */}
        {cutViewMode === 'dual' && (
          <g transform={`translate(${ahuStartX}, 320)`}>
            <text
              x="10"
              y="-14"
              fill="#10B981"
              fontSize="10"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              letterSpacing="1"
            >
              ▼ PLANTA (VISTA SUPERIOR NORMALIZADA PÁG. 17-18 IDAE)
            </text>

            <rect x="-18" y="8" width="18" height="170" fill="url(#canvasBellowsGrad)" stroke="#475569" strokeWidth="1.2" rx="2" />
            <rect x={dynamicChassisWidth} y="8" width="18" height="170" fill="url(#canvasBellowsGrad)" stroke="#475569" strokeWidth="1.2" rx="2" />

            <rect x="0" y="0" width={dynamicChassisWidth} height="186" fill="url(#casingWallGrad)" stroke="#334155" strokeWidth="3" rx="5" />
            <rect x="3" y="3" width={dynamicChassisWidth - 6} height="180" fill={isWhiteTheme ? '#F1F5F9' : '#070B14'} stroke="#1E293B" strokeWidth="1.2" />
            <rect x="3" y="3" width={dynamicChassisWidth - 6} height="180" fill="url(#ahuTunnelAirGrad)" pointerEvents="none" />

            {(() => {
              let currentOffset = 10;
              return enabledModules.map((mod) => {
                const modWidth = moduleWidths[mod.type] || 100;
                const modX = currentOffset;
                currentOffset += modWidth + MODULE_SPACING;
                const isModActive = editingModuleId === mod.id;

                return (
                  <g
                    key={`plan-${mod.id}`}
                    transform={`translate(${modX}, 6)`}
                    className="cursor-pointer"
                    onClick={() => onSelectModuleAndPoint(mod.id)}
                  >
                    <rect
                      x="0"
                      y="0"
                      width={modWidth}
                      height="174"
                      rx="4"
                      fill={
                        isModActive
                          ? isWhiteTheme
                            ? '#E0F2FE'
                            : '#1E293B'
                          : isWhiteTheme
                          ? '#FFFFFF'
                          : '#090E1A'
                      }
                      stroke={
                        isModActive
                          ? '#0284C7'
                          : isWhiteTheme
                          ? '#CBD5E1'
                          : '#273449'
                      }
                      strokeWidth={isModActive ? '2.5' : '1.2'}
                    />
                    <IDAESectionSymbol
                      mod={mod}
                      modWidth={modWidth}
                      isFlowActive={isFlowActive}
                      isWhiteTheme={isWhiteTheme}
                      viewMode="plan"
                    />
                  </g>
                );
              });
            })()}

            {/* Dual Mode Dimension Lines */}
            <g transform="translate(0, 246)">
              {(() => {
                let currentX = 10;
                return enabledModules.map((mod, idx) => {
                  const w = moduleWidths[mod.type] || 100;
                  const xStart = currentX;
                  const xEnd = currentX + w;
                  const xMid = currentX + w / 2;
                  const dimMeters = (moduleDimensionsMeters[mod.type] || 0.4).toFixed(2).replace('.', ',');
                  currentX += w + MODULE_SPACING;

                  return (
                    <g key={`dim-plan-mod-${mod.id}-${idx}`}>
                      <line x1={xStart} y1="-56" x2={xStart} y2="8" stroke="#E11D48" strokeWidth="1.2" strokeOpacity="0.75" />
                      <line x1={xEnd} y1="-56" x2={xEnd} y2="8" stroke="#E11D48" strokeWidth="1.2" strokeOpacity="0.75" />
                      <line x1={xStart} y1="0" x2={xEnd} y2="0" stroke="#E11D48" strokeWidth="1.3" />
                      <polygon points={`${xStart},0 ${xStart + 5},-3 ${xStart + 5},3`} fill="#E11D48" />
                      <polygon points={`${xEnd},0 ${xEnd - 5},-3 ${xEnd - 5},3`} fill="#E11D48" />
                      <rect
                        x={xMid - 25}
                        y="-9"
                        width="50"
                        height="18"
                        fill={isWhiteTheme ? '#FFFFFF' : '#070B14'}
                        stroke="#E11D48"
                        strokeWidth="1"
                        rx="3.5"
                      />
                      <text
                        x={xMid}
                        y="0"
                        dominantBaseline="central"
                        textAnchor="middle"
                        fill="#E11D48"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono"
                      >
                        {dimMeters}
                      </text>
                    </g>
                  );
                });
              })()}

              <g transform="translate(0, 46)">
                <line x1="10" y1="-102" x2="10" y2="8" stroke={isWhiteTheme ? '#0F172A' : '#E2E8F0'} strokeWidth="1.4" strokeOpacity="0.8" />
                <line
                  x1={dynamicChassisWidth - 10}
                  y1="-102"
                  x2={dynamicChassisWidth - 10}
                  y2="8"
                  stroke={isWhiteTheme ? '#0F172A' : '#E2E8F0'}
                  strokeWidth="1.4"
                  strokeOpacity="0.8"
                />
                <line
                  x1="10"
                  y1="0"
                  x2={dynamicChassisWidth - 10}
                  y2="0"
                  stroke={isWhiteTheme ? '#0F172A' : '#E2E8F0'}
                  strokeWidth="1.5"
                />
                <polygon points="10,0 17,-3.5 17,3.5" fill={isWhiteTheme ? '#0F172A' : '#E2E8F0'} />
                <polygon
                  points={`${dynamicChassisWidth - 10},0 ${dynamicChassisWidth - 17},-3.5 ${dynamicChassisWidth - 17},3.5`}
                  fill={isWhiteTheme ? '#0F172A' : '#E2E8F0'}
                />
                <rect
                  x={dynamicChassisWidth / 2 - 105}
                  y="-11"
                  width="210"
                  height="22"
                  fill={isWhiteTheme ? '#FFFFFF' : '#070B14'}
                  stroke={isWhiteTheme ? '#CBD5E1' : '#334155'}
                  strokeWidth="1.2"
                  rx="4"
                />
                <text
                  x={dynamicChassisWidth / 2}
                  y="0"
                  dominantBaseline="central"
                  textAnchor="middle"
                  fill={isWhiteTheme ? '#0F172A' : '#F8FAFC'}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                >
                  Longitud Total: {totalLengthMeters.toFixed(2).replace('.', ',')} m
                </text>
              </g>
            </g>
          </g>
        )}

        {/* ---------------- AIR OUTLET: SUP STATE BADGE (01.png) ---------------- */}
        <g transform={`translate(${ahuStartX + dynamicChassisWidth + 62}, ${cutViewMode === 'dual' ? 112 : chassisY + 235})`}>
          {/* SUP State Badge */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectPoint(supplyPoint.id)}
          >
            <rect
              x="-54"
              y="-12"
              width="108"
              height="24"
              rx="12"
              fill={isWhiteTheme ? '#FFFFFF' : '#0B132B'}
              stroke="#06B6D4"
              strokeWidth="1.6"
              filter={isWhiteTheme ? undefined : 'url(#glowDrop)'}
            />
            <circle cx="-42" cy="0" r="3.5" fill="#06B6D4" />
            <text
              x="5"
              y="0"
              dominantBaseline="central"
              textAnchor="middle"
              fill={isWhiteTheme ? '#0284C7' : '#67E8F9'}
              fontSize="9.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              {supplyPoint.tdb.toFixed(1)}°C | {supplyPoint.rh.toFixed(0)}%
            </text>
          </g>
        </g>

        </g>
      </g>
    </svg>
  );
};
