import React from 'react';
import { StatePoint } from '../types/psychrometrics';
import {
  Thermometer,
  Droplets,
  Wind,
  Layers,
  Activity,
  CheckCircle2,
  Building,
  Info,
} from 'lucide-react';

interface BuildingSystemIDAESchematicProps {
  points: StatePoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
  isFlowActive: boolean;
  isWhiteTheme?: boolean;
}

export const BuildingSystemIDAESchematic: React.FC<BuildingSystemIDAESchematicProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  isFlowActive,
  isWhiteTheme = false,
}) => {
  // Key points identification
  const outdoorPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('ext') || n.includes('oda') || n.includes('oa') || n.includes('1');
    }) || points[0] || { id: 'p-oda', tdb: 35.0, rh: 45, w: 0.0158, h: 75.8, name: 'ODA' };

  const supplyPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('imp') || n.includes('sup') || n.includes('sa') || n.includes('4');
    }) || points[points.length - 1] || { id: 'p-sup', tdb: 16.5, rh: 80, w: 0.0094, h: 40.5, name: 'SUP' };

  const roomPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('int') || n.includes('ida') || n.includes('ra') || n.includes('loc');
    }) || { id: 'p-ida', tdb: 24.0, rh: 50, w: 0.0093, h: 47.8, name: 'IDA' };

  const primaryStroke = isWhiteTheme ? '#0F172A' : '#E2E8F0';
  const wallFill = isWhiteTheme ? '#F8FAFC' : '#1E293B';
  const wallBorder = isWhiteTheme ? '#64748B' : '#475569';
  const ceilingFill = isWhiteTheme ? '#F1F5F9' : '#0F172A';
  const glassFill = isWhiteTheme ? '#E0F2FE' : '#072540';

  return (
    <div className="w-full h-full flex flex-col items-center select-none relative">
      <svg
        viewBox="0 0 1120 540"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="technicalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={isWhiteTheme ? '#E2E8F0' : '#1E293B'}
              strokeWidth="0.75"
            />
          </pattern>

          {/* Air stream markers */}
          <marker id="arrowOda" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0,0 6,3 0,6" fill="#10B981" />
          </marker>
          <marker id="arrowSup" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0,0 6,3 0,6" fill="#0284C7" />
          </marker>
          <marker id="arrowEta" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0,0 6,3 0,6" fill="#F59E0B" />
          </marker>
          <marker id="arrowEha" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0,0 6,3 0,6" fill="#B45309" />
          </marker>
        </defs>

        {/* Blueprint Base Background */}
        <rect
          x="10"
          y="10"
          width="1100"
          height="520"
          rx="14"
          fill={isWhiteTheme ? '#FFFFFF' : '#090D16'}
          stroke={isWhiteTheme ? '#CBD5E1' : '#1E293B'}
          strokeWidth="1.5"
        />
        <rect x="10" y="10" width="1100" height="520" fill="url(#technicalGrid)" opacity="0.6" rx="14" />

        {/* Title according to IDAE Autonomous Climate Guide */}
        <text
          x="560"
          y="34"
          textAnchor="middle"
          fill={isWhiteTheme ? '#0F172A' : '#94A3B8'}
          fontSize="11"
          fontWeight="bold"
          fontFamily="JetBrains Mono"
          letterSpacing="1.2"
        >
          SISTEMA MIXTO AUTÓNOMO CON UTA DE AIRE PRIMARIO & RECUPERADOR (GUÍA TÉCNICA IDAE / RITE)
        </text>

        {/* ---------------- 1. BUILDING STRUCTURE SECTION ---------------- */}
        <g className="building-cutaway">
          {/* Ground level foundation */}
          <rect x="40" y="475" width="1040" height="30" fill={wallFill} stroke={wallBorder} strokeWidth="2" />
          <line x1="40" y1="475" x2="1080" y2="475" stroke={primaryStroke} strokeWidth="3" />

          {/* Left Exterior Façade */}
          <rect x="40" y="105" width="28" height="370" fill={wallFill} stroke={wallBorder} strokeWidth="2" />

          {/* Right Exterior Façade */}
          <rect x="1052" y="105" width="28" height="370" fill={wallFill} stroke={wallBorder} strokeWidth="2" />

          {/* Roof Slab / Forjado de Cubierta Técnica */}
          <rect x="40" y="105" width="1040" height="24" fill={wallFill} stroke={wallBorder} strokeWidth="2" />

          {/* Floor Slab / Forjado intermedio */}
          <rect x="40" y="275" width="760" height="20" fill={wallFill} stroke={wallBorder} strokeWidth="1.5" />

          {/* Vertical Technical Shaft Wall (Patinillo vertical de conductos) */}
          <rect x="800" y="129" width="18" height="346" fill={wallFill} stroke={wallBorder} strokeWidth="1.5" />

          {/* Suspended False Ceiling (Falso techo registrable) */}
          <line
            x1="68"
            y1="315"
            x2="800"
            y2="315"
            stroke={isWhiteTheme ? '#94A3B8' : '#475569'}
            strokeWidth="2.5"
            strokeDasharray="8,4"
          />
          <text
            x="90"
            y="310"
            fill={isWhiteTheme ? '#64748B' : '#94A3B8'}
            fontSize="9"
            fontFamily="JetBrains Mono"
          >
            Plenum / Falso Techo Registrable
          </text>

          {/* Office Double-Glazed Windows (Lado Izquierdo) */}
          <rect
            x="44"
            y="335"
            width="20"
            height="110"
            fill={glassFill}
            stroke="#0284C7"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <line x1="54" y1="335" x2="54" y2="445" stroke="#38BDF8" strokeWidth="1" />
        </g>

        {/* ---------------- 2. ROOFTOP / AZOTEA: PRIMARY AIR AHU WITH RECUPERATOR ---------------- */}
        <g transform="translate(100, 36)">
          {/* Concrete Mounting Plinths with antivibration dampers */}
          <rect x="30" y="69" width="35" height="12" fill={wallFill} stroke={wallBorder} strokeWidth="1.5" />
          <rect x="290" y="69" width="35" height="12" fill={wallFill} stroke={wallBorder} strokeWidth="1.5" />
          <rect x="520" y="69" width="35" height="12" fill={wallFill} stroke={wallBorder} strokeWidth="1.5" />

          {/* AHU Outer Insulated Double-Wall Casing */}
          <rect
            x="20"
            y="5"
            width="560"
            height="65"
            rx="5"
            fill={isWhiteTheme ? '#F8FAFC' : '#0B132B'}
            stroke={isWhiteTheme ? '#334155' : '#475569'}
            strokeWidth="2"
          />

          {/* Header text on unit casing */}
          <text
            x="300"
            y="18"
            textAnchor="middle"
            fill={isWhiteTheme ? '#0284C7' : '#38BDF8'}
            fontSize="9"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            UTA DE AIRE PRIMARIO CON RECUPERADOR ENTÁLPICO (100% ODA)
          </text>

          {/* Section 1: ODA Intake Louver & Damper */}
          <g transform="translate(25, 20)">
            {/* Intake grill */}
            <line x1="0" y1="5" x2="10" y2="45" stroke="#10B981" strokeWidth="2.5" />
            <line x1="5" y1="5" x2="15" y2="45" stroke="#10B981" strokeWidth="2.5" />
            {/* Damper with M */}
            <circle cx="20" cy="25" r="7" fill="#10B981" />
            <text x="20" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">
              M
            </text>
          </g>

          {/* Section 2: G4 Prefilter */}
          <g transform="translate(68, 22)">
            <path
              d="M 0 5 L 8 15 L 0 25 L 8 35 L 0 45"
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.5"
            />
            <text x="4" y="-3" textAnchor="middle" fill="#F43F5E" fontSize="7" fontWeight="bold">
              G4
            </text>
          </g>

          {/* Section 3: Heat Recovery Core (Recuperador de Placas Cruzadas según IDAE) */}
          <g transform="translate(100, 18)">
            <rect
              x="0"
              y="2"
              width="70"
              height="48"
              rx="2"
              fill={isWhiteTheme ? '#F0F9FF' : '#0C1B2E'}
              stroke="#0EA5E9"
              strokeWidth="1.5"
            />
            {/* Crossed counterflow paths */}
            <line x1="0" y1="2" x2="70" y2="50" stroke="#38BDF8" strokeWidth="2" />
            <line x1="0" y1="50" x2="70" y2="2" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3,2" />
            <circle cx="35" cy="26" r="9" fill="#0284C7" />
            <text x="35" y="29" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
              η
            </text>
          </g>

          {/* Section 4: Cooling Coil DX / Agua Fría */}
          <g transform="translate(195, 22)">
            <rect x="0" y="0" width="28" height="46" fill="#082F49" stroke="#0284C7" strokeWidth="1.5" rx="2" />
            <line x1="2" y1="44" x2="26" y2="2" stroke="#38BDF8" strokeWidth="2" />
            <circle cx="14" cy="23" r="6" fill="#0284C7" />
            <text x="14" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
              −
            </text>
          </g>

          {/* Section 5: Heating Coil Bomba de Calor */}
          <g transform="translate(242, 22)">
            <rect x="0" y="0" width="28" height="46" fill="#450A0A" stroke="#DC2626" strokeWidth="1.5" rx="2" />
            <line x1="2" y1="44" x2="26" y2="2" stroke="#EF4444" strokeWidth="2" />
            <circle cx="14" cy="23" r="6" fill="#DC2626" />
            <text x="14" y="27" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
              +
            </text>
          </g>

          {/* Section 6: EC Supply Fan (Plug-Fan) */}
          <g transform="translate(295, 22)">
            <circle cx="24" cy="23" r="21" fill={isWhiteTheme ? '#ECFDF5' : '#064E3B'} stroke="#10B981" strokeWidth="2" />
            <polygon points="12,12 36,23 12,34" fill="#10B981" />
            <rect x="42" y="14" width="12" height="18" fill="#1E293B" stroke="#64748B" rx="1" />
            <text x="48" y="26" textAnchor="middle" fill="#10B981" fontSize="6" fontWeight="bold">
              EC
            </text>
          </g>

          {/* Section 7: Final Fine Filter F7 */}
          <g transform="translate(375, 22)">
            <path
              d="M 0 5 Q 18 15 0 25 Q 18 35 0 45"
              fill="none"
              stroke="#EC4899"
              strokeWidth="2.5"
            />
            <text x="6" y="-3" textAnchor="middle" fill="#EC4899" fontSize="7" fontWeight="bold">
              F7
            </text>
          </g>

          {/* Section 8: Exhaust Air EHA Outlet with Motorized Damper */}
          <g transform="translate(425, 22)">
            <line x1="0" y1="23" x2="35" y2="23" stroke="#B45309" strokeWidth="3" markerEnd="url(#arrowEha)" />
            <text x="45" y="27" fill="#B45309" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
              EHA (Expulsión)
            </text>
          </g>

          {/* Outdoor autonomous condenser unit (Bomba de calor exterior autónoma DX) */}
          <g transform="translate(620, 10)">
            <rect
              x="0"
              y="0"
              width="110"
              height="60"
              rx="4"
              fill={isWhiteTheme ? '#F1F5F9' : '#1E293B'}
              stroke="#64748B"
              strokeWidth="2"
            />
            <circle cx="32" cy="30" r="18" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="78" cy="30" r="18" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M 22 30 L 42 30 M 32 20 L 32 40" stroke="#38BDF8" strokeWidth="2" />
            <path d="M 68 30 L 88 30 M 78 20 L 78 40" stroke="#38BDF8" strokeWidth="2" />
            <text
              x="55"
              y="-5"
              textAnchor="middle"
              fill={isWhiteTheme ? '#334155' : '#E2E8F0'}
              fontSize="8"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              UNIDAD EXTERIOR BOMBA DE CALOR INVERTER
            </text>
          </g>
        </g>

        {/* ---------------- 3. TECHNICAL SHAFT (PATINILLO VERTICAL DE CONDUCTOS) ---------------- */}
        {/* Supply Air Duct (SUP, Azul #0284C7) */}
        <g className="duct-sup">
          <path
            d="M 520 80 L 840 80 L 840 330 L 450 330"
            fill="none"
            stroke="#0284C7"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 520 80 L 840 80 L 840 330 L 450 330"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isFlowActive ? 'animate-pulse' : ''}
          />
        </g>

        {/* Extract Air Duct (ETA, Amarillo/Naranja #F59E0B) */}
        <g className="duct-eta">
          <path
            d="M 680 340 L 870 340 L 870 70 L 235 70"
            fill="none"
            stroke="#D97706"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10,4"
          />
          <path
            d="M 680 340 L 870 340 L 870 70 L 235 70"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Refrigerant lines (Líneas de líquido y gas aisladas hacia cassette autónomo interior) */}
        <path
          d="M 770 70 L 910 70 L 910 335 L 620 335"
          fill="none"
          stroke="#EF4444"
          strokeWidth="4"
          strokeDasharray="6,3"
        />
        <path
          d="M 775 74 L 914 74 L 914 339 L 620 339"
          fill="none"
          stroke="#0284C7"
          strokeWidth="4"
          strokeDasharray="6,3"
        />

        {/* ---------------- 4. CONDITIONED OFFICE ROOM (PLANTA DE OFICINA IDA 2) ---------------- */}
        <g className="room-elements">
          {/* Primary Air High-Induction Ceiling Swirl Diffuser (Difusor rotacional SUP) */}
          <g transform="translate(430, 315)">
            {/* Neck connection */}
            <rect x="-16" y="0" width="32" height="10" fill="#0284C7" />
            {/* Diffuser face plate with radial slots */}
            <rect x="-28" y="10" width="56" height="8" rx="2" fill="#E2E8F0" stroke="#0284C7" strokeWidth="1.5" />
            {/* Primary air discharge induction vectors */}
            {[-18, 0, 18].map((dx, i) => (
              <path
                key={`sup-jet-${i}`}
                d={`M ${dx} 18 Q ${dx * 1.5} 35 ${dx * 2} 55`}
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#arrowSup)"
              />
            ))}
            <text x="0" y="32" textAnchor="middle" fill="#0284C7" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono">
              SUP {supplyPoint.tdb.toFixed(1)}°C
            </text>
          </g>

          {/* Autonomous Indoor Equipment: 4-Way Cassette in False Ceiling (Cassette Autónomo DX RITE) */}
          <g transform="translate(560, 305)">
            {/* Cassette chassis in plenum */}
            <rect
              x="-45"
              y="-15"
              width="90"
              height="30"
              rx="3"
              fill={isWhiteTheme ? '#FFFFFF' : '#1E293B'}
              stroke="#64748B"
              strokeWidth="2"
            />
            {/* Internal centrifugal fan & DX expansion coil */}
            <circle cx="0" cy="0" r="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <path d="M -25 2 L -25 -8 L 25 -8 L 25 2" fill="none" stroke="#EF4444" strokeWidth="2" />
            {/* Under-ceiling 4-way discharge fascia panel */}
            <rect x="-55" y="15" width="110" height="10" rx="3" fill="#F8FAFC" stroke="#334155" strokeWidth="1.5" />
            {/* 4-way conditioned air discharge jets */}
            <path d="M -35 25 L -55 45" stroke="#38BDF8" strokeWidth="3" markerEnd="url(#arrowSup)" />
            <path d="M 35 25 L 55 45" stroke="#38BDF8" strokeWidth="3" markerEnd="url(#arrowSup)" />
            {/* Suction return air grille into cassette */}
            <line x1="-15" y1="25" x2="-15" y2="18" stroke="#94A3B8" strokeWidth="2" />
            <line x1="0" y1="25" x2="0" y2="18" stroke="#94A3B8" strokeWidth="2" />
            <line x1="15" y1="25" x2="15" y2="18" stroke="#94A3B8" strokeWidth="2" />

            <text
              x="0"
              y="40"
              textAnchor="middle"
              fill={isWhiteTheme ? '#0284C7' : '#38BDF8'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              CASSETTE AUTÓNOMO DX
            </text>
          </g>

          {/* Extract Air Ceiling Grille (Rejilla de Extracción ETA hacia recuperador) */}
          <g transform="translate(710, 315)">
            <rect x="-18" y="0" width="36" height="10" fill="#D97706" />
            <rect x="-26" y="10" width="52" height="8" rx="2" fill="#E2E8F0" stroke="#D97706" strokeWidth="1.5" />
            {/* Air entering grille */}
            <path d="M -10 35 L -10 20" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrowEta)" />
            <path d="M 10 35 L 10 20" stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrowEta)" />
            <text x="0" y="48" textAnchor="middle" fill="#D97706" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono">
              ETA (Extracción)
            </text>
          </g>

          {/* RITE / IDAE Sensors on Wall: Ambient Comfort (Ta, HR) + IAQ CO2 Probe */}
          <g transform="translate(100, 370)">
            <rect
              x="0"
              y="0"
              width="65"
              height="45"
              rx="6"
              fill={isWhiteTheme ? '#FAF5FF' : '#1E1B4B'}
              stroke="#8B5CF6"
              strokeWidth="1.5"
            />
            <text x="32" y="14" textAnchor="middle" fill="#8B5CF6" fontSize="8" fontWeight="bold">
              SONDAS RITE
            </text>
            <text x="32" y="27" textAnchor="middle" fill={isWhiteTheme ? '#581C87' : '#C4B5FD'} fontSize="8" fontFamily="JetBrains Mono">
              {roomPoint.tdb.toFixed(1)}°C | {roomPoint.rh.toFixed(0)}%
            </text>
            <text x="32" y="38" textAnchor="middle" fill="#10B981" fontSize="7.5" fontWeight="bold" fontFamily="JetBrains Mono">
              CO₂: 580 ppm
            </text>
          </g>

          {/* Architectural Furnishings: Office Desk & Chairs for scale */}
          <g transform="translate(300, 420)">
            {/* Desk */}
            <rect x="0" y="20" width="130" height="8" rx="2" fill={isWhiteTheme ? '#D1D5DB' : '#334155'} />
            <rect x="10" y="28" width="6" height="26" fill={isWhiteTheme ? '#9CA3AF' : '#475569'} />
            <rect x="114" y="28" width="6" height="26" fill={isWhiteTheme ? '#9CA3AF' : '#475569'} />
            {/* Laptop */}
            <rect x="50" y="10" width="30" height="10" rx="1" fill="#0284C7" />
            <line x1="45" y1="20" x2="85" y2="20" stroke="#38BDF8" strokeWidth="2" />
            {/* Person silhouette seated */}
            <circle cx="65" cy="-8" r="8" fill={isWhiteTheme ? '#64748B' : '#94A3B8'} />
            <path d="M 52 18 Q 65 2 78 18 Z" fill={isWhiteTheme ? '#64748B' : '#94A3B8'} />
          </g>
          <g transform="translate(520, 420)">
            {/* Second desk */}
            <rect x="0" y="20" width="130" height="8" rx="2" fill={isWhiteTheme ? '#D1D5DB' : '#334155'} />
            <rect x="10" y="28" width="6" height="26" fill={isWhiteTheme ? '#9CA3AF' : '#475569'} />
            <rect x="114" y="28" width="6" height="26" fill={isWhiteTheme ? '#9CA3AF' : '#475569'} />
            {/* Person silhouette */}
            <circle cx="65" cy="-8" r="8" fill={isWhiteTheme ? '#64748B' : '#94A3B8'} />
            <path d="M 52 18 Q 65 2 78 18 Z" fill={isWhiteTheme ? '#64748B' : '#94A3B8'} />
          </g>
        </g>

        {/* ---------------- 5. INTERACTIVE STATE POINT PILLS (CLIC PARA INSPECCIONAR EN EL DIAGRAMA) ---------------- */}
        {/* ODA Button */}
        <g
          transform="translate(45, 60)"
          className="cursor-pointer group"
          onClick={() => onSelectPoint(outdoorPoint.id)}
        >
          <rect
            x="0"
            y="0"
            width="100"
            height="32"
            rx="8"
            fill={isWhiteTheme ? '#ECFDF5' : '#064E3B'}
            stroke="#10B981"
            strokeWidth="2"
            className="group-hover:scale-105 transition-transform"
          />
          <text x="50" y="14" textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
            AIRE EXTERIOR (ODA)
          </text>
          <text x="50" y="25" textAnchor="middle" fill={isWhiteTheme ? '#065F46' : '#A7F3D0'} fontSize="8" fontFamily="JetBrains Mono">
            {outdoorPoint.tdb.toFixed(1)}°C | {outdoorPoint.rh.toFixed(0)}% HR
          </text>
        </g>

        {/* SUP Button */}
        <g
          transform="translate(360, 260)"
          className="cursor-pointer group"
          onClick={() => onSelectPoint(supplyPoint.id)}
        >
          <rect
            x="0"
            y="0"
            width="105"
            height="32"
            rx="8"
            fill={isWhiteTheme ? '#E0F2FE' : '#082F49'}
            stroke="#0284C7"
            strokeWidth="2"
            className="group-hover:scale-105 transition-transform"
          />
          <text x="52" y="14" textAnchor="middle" fill="#0284C7" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
            IMPULSIÓN (SUP)
          </text>
          <text x="52" y="25" textAnchor="middle" fill={isWhiteTheme ? '#0369A1' : '#7DD3FC'} fontSize="8" fontFamily="JetBrains Mono">
            {supplyPoint.tdb.toFixed(1)}°C | {supplyPoint.rh.toFixed(0)}% HR
          </text>
        </g>

        {/* IDA Button */}
        <g
          transform="translate(435, 475)"
          className="cursor-pointer group"
          onClick={() => onSelectPoint(roomPoint.id)}
        >
          <rect
            x="0"
            y="0"
            width="130"
            height="32"
            rx="8"
            fill={isWhiteTheme ? '#FAF5FF' : '#2E1065'}
            stroke="#8B5CF6"
            strokeWidth="2"
            className="group-hover:scale-105 transition-transform"
          />
          <text x="65" y="14" textAnchor="middle" fill="#8B5CF6" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
            ZONA OCUPADA (IDA 2)
          </text>
          <text x="65" y="25" textAnchor="middle" fill={isWhiteTheme ? '#6B21A8' : '#C4B5FD'} fontSize="8" fontFamily="JetBrains Mono">
            {roomPoint.tdb.toFixed(1)}°C | {roomPoint.rh.toFixed(0)}% HR
          </text>
        </g>

        {/* ---------------- 6. UNE-EN 13779 / IDAE OFFICIAL AIR COLOR-CODING BAR ---------------- */}
        <g transform="translate(40, 500)">
          <rect
            x="0"
            y="0"
            width="1040"
            height="22"
            rx="6"
            fill={isWhiteTheme ? '#F1F5F9' : '#0F172A'}
            stroke={isWhiteTheme ? '#CBD5E1' : '#334155'}
            strokeWidth="1"
          />

          <text x="15" y="15" fill={primaryStroke} fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
            Norma UNE-EN 13779:
          </text>

          {/* ODA */}
          <g transform="translate(160, 6)">
            <circle cx="6" cy="5" r="5" fill="#10B981" />
            <text x="16" y="9" fill={isWhiteTheme ? '#065F46' : '#6EE7B7'} fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono">
              ODA: Exterior
            </text>
          </g>

          {/* SUP */}
          <g transform="translate(300, 6)">
            <circle cx="6" cy="5" r="5" fill="#0284C7" />
            <text x="16" y="9" fill={isWhiteTheme ? '#0369A1' : '#7DD3FC'} fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono">
              SUP: Impulsión
            </text>
          </g>

          {/* ETA */}
          <g transform="translate(450, 6)">
            <circle cx="6" cy="5" r="5" fill="#F59E0B" />
            <text x="16" y="9" fill={isWhiteTheme ? '#B45309' : '#FCD34D'} fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono">
              ETA: Extracción
            </text>
          </g>

          {/* EHA */}
          <g transform="translate(600, 6)">
            <circle cx="6" cy="5" r="5" fill="#B45309" />
            <text x="16" y="9" fill={isWhiteTheme ? '#78350F' : '#FDBA74'} fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono">
              EHA: Expulsión
            </text>
          </g>

          {/* IDA */}
          <g transform="translate(750, 6)">
            <circle cx="6" cy="5" r="5" fill="#8B5CF6" />
            <text x="16" y="9" fill={isWhiteTheme ? '#5B21B6' : '#C4B5FD'} fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono">
              IDA: Interior
            </text>
          </g>

          {/* RCA */}
          <g transform="translate(890, 6)">
            <circle cx="6" cy="5" r="5" fill="#64748B" />
            <text x="16" y="9" fill={isWhiteTheme ? '#334155' : '#CBD5E1'} fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono">
              RCA: Recirculación
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};
