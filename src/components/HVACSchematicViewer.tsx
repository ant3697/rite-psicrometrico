import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StatePoint,
  ProcessConnection,
  UnitSystem,
  ChartType,
  ChartLayerVisibility,
  AHUModuleItem,
  AHUModuleType,
} from '../types/psychrometrics';
import {
  solveStatePoint,
  P_ATM_STANDARD,
  C_PA,
  H_FG,
} from '../utils/psychrolib';
import { calculateProcessMetrics } from '../utils/processEngine';
import { PsychrometricChart } from './PsychrometricChart';
import { IDAESectionSymbol } from './IDAESymbols';
import { BuildingSystemIDAESchematic } from './BuildingSystemIDAESchematic';
import { IDAESymbolGuideModal } from './IDAESymbolGuideModal';
import {
  AirVent,
  Sliders,
  Info,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Droplets,
  Flame,
  Snowflake,
  Wind,
  Layers,
  HelpCircle,
  Building,
  Split,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Activity,
  Gauge,
  Zap,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Move,
  Wrench,
  Plus,
  Trash2,
  Settings,
  ArrowLeft,
  X,
  Volume2,
  Check,
  RefreshCw,
  GripVertical,
  Shuffle,
  Copy,
  LayoutTemplate,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';

interface HVACSchematicViewerProps {
  points: StatePoint[];
  processes: ProcessConnection[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
  onUpdatePointCoordinates?: (id: string, tdb: number, w: number) => void;
  onAddPointAtCoordinates?: (tdb: number, w: number) => void;
  onUpdatePointsAndProcesses?: (points: StatePoint[], processes: ProcessConnection[]) => void;
  onOpenIdaeModal?: () => void;
  units: UnitSystem;
  pressure: number;
  chartType: ChartType;
  layers: ChartLayerVisibility;
}

interface ViewTransform {
  zoom: number;
  panX: number;
  panY: number;
}

// Technical Catalog of Modular Sections Available to Drag & Drop into the AHU
export const MODULE_CATALOG: Array<{
  type: AHUModuleType;
  title: string;
  shortName: string;
  category: 'Aire' | 'Filtrado' | 'Térmico' | 'Tracción' | 'Acústica';
  color: string;
  borderColor: string;
  bgBadge: string;
  defaultDropPa: number;
  description: string;
  defaultParams: AHUModuleItem['params'];
}> = [
  {
    type: 'intake_damper',
    title: 'Compuerta Toma Aire Exterior (ODA)',
    shortName: 'Toma ODA',
    category: 'Aire',
    color: '#10B981',
    borderColor: '#059669',
    bgBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    defaultDropPa: 30,
    description: 'Compuerta motorizada de lamas opuestas para regulación del caudal de aire exterior (ODA).',
    defaultParams: { outdoorRatio: 0.3 },
  },
  {
    type: 'prefilter',
    title: 'Prefiltro G4 / ISO Coarse 65%',
    shortName: 'Prefiltro G4',
    category: 'Filtrado',
    color: '#F43F5E',
    borderColor: '#E11D48',
    bgBadge: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    defaultDropPa: 60,
    description: 'Retiene partículas gruesas de polvo, polen e insectos, protegiendo baterías y componentes internos.',
    defaultParams: { filterClass: 'G4' },
  },
  {
    type: 'mixing_box',
    title: 'Cámara de Mezcla (ODA + RA)',
    shortName: 'Cámara Mezcla',
    category: 'Aire',
    color: '#F59E0B',
    borderColor: '#D97706',
    bgBadge: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    defaultDropPa: 40,
    description: 'Mezcla aire exterior fresco con aire de retorno recirculado para optimizar la eficiencia térmica.',
    defaultParams: { outdoorRatio: 0.3 },
  },
  {
    type: 'heat_recovery',
    title: 'Recuperador de Calor / Entálpico',
    shortName: 'Recuperador η',
    category: 'Térmico',
    color: '#0EA5E9',
    borderColor: '#0284C7',
    bgBadge: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
    defaultDropPa: 160,
    description: 'Intercambiador de placas cruzadas o rueda para pre-acondicionar el aire exterior con el de extracción.',
    defaultParams: { recoveryEfficiency: 0.75, recoveryType: 'plates' },
  },
  {
    type: 'cooling_coil',
    title: 'Batería Fría (−) Deshumectación',
    shortName: 'Batería Fría (−)',
    category: 'Térmico',
    color: '#38BDF8',
    borderColor: '#0284C7',
    bgBadge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
    defaultDropPa: 120,
    description: 'Enfría por debajo del punto de rocío y deshumecta el aire con bandeja inclinada de condensados y sifón P.',
    defaultParams: { exitTdb: 12.8, exitRh: 95, bypassFactor: 0.1, fluid: 'water_7_12' },
  },
  {
    type: 'heating_coil',
    title: 'Batería de Calor (+) Agua/Eléctrica',
    shortName: 'Batería Calor (+)',
    category: 'Térmico',
    color: '#EF4444',
    borderColor: '#DC2626',
    bgBadge: 'bg-red-950/80 text-red-300 border-red-800/80',
    defaultDropPa: 90,
    description: 'Aporte de calor sensible para calefacción invernal o recalentamiento de control estival.',
    defaultParams: { heatingTdb: 16.5, heatingSource: 'hot_water' },
  },
  {
    type: 'humidifier',
    title: 'Humidificador (Vapor / Evaporativo)',
    shortName: 'Humidificador',
    category: 'Térmico',
    color: '#A855F7',
    borderColor: '#9333EA',
    bgBadge: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
    defaultDropPa: 50,
    description: 'Inyección de vapor seco isotérmico o panel húmedo evaporativo adiabático para confort higrotérmico.',
    defaultParams: { humidifierType: 'steam', targetRh: 50 },
  },
  {
    type: 'fan',
    title: 'Ventilador Plug-Fan EC con Variador',
    shortName: 'Ventilador EC',
    category: 'Tracción',
    color: '#10B981',
    borderColor: '#059669',
    bgBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    defaultDropPa: 0,
    description: 'Rodete centrífugo de alta eficiencia con motor EC que aporta la presión estática para toda la red de conductos.',
    defaultParams: { staticPressurePa: 450, motorEfficiency: 0.72, tempRise: 0.8, fanType: 'plug_fan_ec' },
  },
  {
    type: 'final_filter',
    title: 'Filtro Fino Terminal F7/F9/ePM1',
    shortName: 'Filtro F7/F9',
    category: 'Filtrado',
    color: '#EC4899',
    borderColor: '#DB2777',
    bgBadge: 'bg-pink-950/80 text-pink-300 border-pink-800/80',
    defaultDropPa: 140,
    description: 'Filtrado fino de partículas microscópicas antes de impulsar a zonas habitadas (IDA).',
    defaultParams: { filterClass: 'F7' },
  },
  {
    type: 'adiabatic_cooling',
    title: 'Enfriamiento Adiabático (Toberas de Agua)',
    shortName: 'Adiabático',
    category: 'Térmico',
    color: '#0284C7',
    borderColor: '#0369A1',
    bgBadge: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
    defaultDropPa: 70,
    description: 'Rampa de pulverización de agua atomizada para enfriamiento evaporativo directo o indirecto (Guía IDAE Pág. 79/81).',
    defaultParams: { targetRh: 85 },
  },
  {
    type: 'belt_fan',
    title: 'Ventilador con Correas y Poleas (Fig. 1 IDAE)',
    shortName: 'Vent. Correas',
    category: 'Tracción',
    color: '#10B981',
    borderColor: '#059669',
    bgBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    defaultDropPa: 0,
    description: 'Ventilador centrífugo accionado por motor exterior con poleas y correas trapezoidales (Guía IDAE Fig. 1 Pág. 16).',
    defaultParams: { staticPressurePa: 550, motorEfficiency: 0.70, tempRise: 0.9, fanType: 'centrifugal' },
  },
  {
    type: 'plenum',
    title: 'Sección Plenum de Inspección / Paso',
    shortName: 'Plenum',
    category: 'Aire',
    color: '#94A3B8',
    borderColor: '#64748B',
    bgBadge: 'bg-slate-900 text-slate-300 border-slate-700',
    defaultDropPa: 15,
    description: 'Cámara intermedia para mantenimiento, mirilla de inspección y distribución uniforme de flujo (Guía IDAE Pág. 71/73).',
    defaultParams: {},
  },
  {
    type: 'electric_heater',
    title: 'Batería Resistencias Eléctricas (Fig. 11)',
    shortName: 'Resistencias (+)',
    category: 'Térmico',
    color: '#EF4444',
    borderColor: '#DC2626',
    bgBadge: 'bg-red-950/80 text-red-300 border-red-800/80',
    defaultDropPa: 40,
    description: 'Aporte de calor rápido mediante resistencias eléctricas blindadas con termostato de seguridad (Guía IDAE Fig. 11 Pág. 24).',
    defaultParams: { heatingTdb: 20.0, heatingSource: 'electric_resistance' },
  },
  {
    type: 'silencer',
    title: 'Silenciador Acústico (Bafles)',
    shortName: 'Silenciador',
    category: 'Acústica',
    color: '#94A3B8',
    borderColor: '#64748B',
    bgBadge: 'bg-slate-900 text-slate-300 border-slate-700',
    defaultDropPa: 45,
    description: 'Atenuador acústico de celdas fonoabsorbentes para reducir niveles sonoros del ventilador en conductos.',
    defaultParams: { attenuationDb: 18 },
  },
  {
    type: 'rotary_wheel',
    title: 'Rueda Entálpica Rotativa (Fig. 3 IDAE)',
    shortName: 'Rueda Rotor η',
    category: 'Térmico',
    color: '#10B981',
    borderColor: '#059669',
    bgBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    defaultDropPa: 140,
    description: 'Recuperador rotativo de matriz higroscópica que intercambia calor sensible y humedad latente con sector de purga (Guía IDAE Fig. 3 Pág. 18).',
    defaultParams: { recoveryEfficiency: 0.78, recoveryType: 'rotary_wheel' },
  },
  {
    type: 'return_fan',
    title: 'Ventilador de Retorno / Extracción (Fig. 3)',
    shortName: 'Vent. Retorno',
    category: 'Tracción',
    color: '#D97706',
    borderColor: '#B45309',
    bgBadge: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    defaultDropPa: 0,
    description: 'Ventilador para vencer pérdidas del circuito de retorno y evacuar aire viciado hacia EHA o mezcla RCA (Guía IDAE Fig. 3 Pág. 18).',
    defaultParams: { staticPressurePa: 380, motorEfficiency: 0.70, tempRise: 0.7, fanType: 'plug_fan_ec' },
  },
  {
    type: 'exhaust_damper',
    title: 'Compuerta Expulsión Aire Viciado (EHA)',
    shortName: 'Expulsión EHA',
    category: 'Aire',
    color: '#92400E',
    borderColor: '#78350F',
    bgBadge: 'bg-stone-900 text-stone-300 border-stone-700',
    defaultDropPa: 25,
    description: 'Compuerta motorizada de descarga de aire viciado al exterior coordinada con la compuerta de toma ODA para free-cooling.',
    defaultParams: { outdoorRatio: 0.3 },
  },
  {
    type: 'droplet_eliminator',
    title: 'Separador de Gotas Alveolar (Lamas)',
    shortName: 'Separador Gotas',
    category: 'Filtrado',
    color: '#0284C7',
    borderColor: '#0369A1',
    bgBadge: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
    defaultDropPa: 20,
    description: 'Lamas alveolares en onda sinusoidal para retener gotas de agua condensadas tras batería fría o adiabático (Guía IDAE Pág. 79).',
    defaultParams: {},
  },
];

// Presets archetypes to easily load or reset AHU setups
const AHU_ARCHETYPES: Array<{
  id: string;
  name: string;
  description: string;
  moduleTypes: AHUModuleType[];
}> = [
  {
    id: 'idae_fig1_belt_fan',
    name: 'UTA Correas y Poleas (Guía IDAE Fig. 1, Pág. 16)',
    description: 'Configuración canónica IDAE Fig. 1: Prefiltro G4/F6 + Baterías Térmicas (+) + Ventilador accionado por correas y poleas + Filtro final de bolsas F7.',
    moduleTypes: ['prefilter', 'cooling_coil', 'heating_coil', 'belt_fan', 'final_filter'],
  },
  {
    id: 'idae_fig2_direct_fan',
    name: 'UTA Acoplamiento Directo (Guía IDAE Fig. 2, Pág. 16)',
    description: 'Configuración canónica IDAE Fig. 2: Prefiltro + Baterías + Filtro de bolsas + Ventilador de acoplamiento directo al final de la climatizadora.',
    moduleTypes: ['prefilter', 'cooling_coil', 'heating_coil', 'final_filter', 'fan'],
  },
  {
    id: 'idae_fig3_double_deck_wheel',
    name: 'UTA Doble Piso + Rueda Entálpica (Guía IDAE Fig. 3, Pág. 18)',
    description: 'Unidad de dos pisos con recuperador rotativo de rueda entálpica, ventilador de impulsión, ventilador de retorno/extracción y compuertas de regulación.',
    moduleTypes: ['intake_damper', 'prefilter', 'rotary_wheel', 'cooling_coil', 'heating_coil', 'fan', 'final_filter', 'return_fan', 'exhaust_damper'],
  },
  {
    id: 'idae_fig4_double_deck_plates',
    name: 'UTA Doble Piso + Placas y Free-Cooling (Guía IDAE Fig. 4, Pág. 19)',
    description: 'Unidad de dos pisos con recuperador de placas a contracorriente, cámara de mezcla de 3 compuertas, doble ventilador y free-cooling.',
    moduleTypes: ['intake_damper', 'prefilter', 'heat_recovery', 'mixing_box', 'cooling_coil', 'heating_coil', 'fan', 'final_filter', 'return_fan', 'exhaust_damper'],
  },
  {
    id: 'idae_fig11_electric',
    name: 'UTA con Batería Resistencias Eléctricas (Guía IDAE Fig. 11)',
    description: 'Tratamiento de aire exterior con prefiltración, enfriamiento y atemperamiento rápido mediante resistencias eléctricas blindadas con termostato de seguridad.',
    moduleTypes: ['intake_damper', 'prefilter', 'cooling_coil', 'electric_heater', 'fan', 'final_filter'],
  },
  {
    id: 'idae_restaurante_adiab',
    name: 'UTA Restaurante + Adiabático (Guía IDAE Pág. 79)',
    description: 'Ejemplo 4.4 Restaurante: Toma ODA + Prefiltro F6 + Enfriamiento Adiabático + Separador de gotas + Recuperador de calor η + Filtro F7 + Ventilador de impulsión.',
    moduleTypes: ['intake_damper', 'prefilter', 'adiabatic_cooling', 'droplet_eliminator', 'heat_recovery', 'final_filter', 'fan'],
  },
  {
    id: 'idae_oficinas_plenum',
    name: 'UTA Oficinas con Sección Plenum (Guía IDAE Pág. 71)',
    description: 'Ejemplo 4.3 Oficinas: Prefiltro F6 + Ventilador + Sección Plenum intermedia de inspección + Filtro F8.',
    moduleTypes: ['prefilter', 'fan', 'plenum', 'final_filter'],
  },
  {
    id: 'idae_rooftop_freecooling',
    name: 'Rooftop Comercial Free-Cooling (Guía IDAE)',
    description: 'Ejemplo 1 Guía IDAE: Equipo autónomo de cubierta con economizador modulante para free-cooling (IT 1.2.4.5.1), filtrado G4+F7, batería DX y recuperación de calor (IT 1.2.4.5.2).',
    moduleTypes: ['intake_damper', 'prefilter', 'heat_recovery', 'mixing_box', 'cooling_coil', 'heating_coil', 'fan', 'final_filter'],
  },
  {
    id: 'idae_vrf_primary_air',
    name: 'Sistema VRF + UTA Aire Primario (Guía IDAE)',
    description: 'Ejemplo 2 Guía IDAE: Climatización de oficinas con VRF zonal y UTA de aire primario (100% ODA) con recuperador entálpico (IDA 2 / IT 1.1.4.2).',
    moduleTypes: ['intake_damper', 'prefilter', 'heat_recovery', 'cooling_coil', 'heating_coil', 'fan', 'final_filter', 'silencer'],
  },
  {
    id: 'idae_split_heatpump',
    name: 'Bomba de Calor Aire-Aire Autónoma (Guía IDAE)',
    description: 'Ejemplo 3 Guía IDAE: Pequeño terciario con bomba de calor aire-aire autónoma, aporte de aire exterior conforme a RITE y ventilador EC.',
    moduleTypes: ['intake_damper', 'prefilter', 'mixing_box', 'cooling_coil', 'heating_coil', 'fan', 'final_filter'],
  },
  {
    id: 'standard_4pipe',
    name: 'UTA Clima Completa (4 Tubos)',
    description: 'Toma ODA + Prefiltro G4 + Mezcla + Batería Fría + Batería Calor + Ventilador EC + Filtro F7',
    moduleTypes: ['intake_damper', 'prefilter', 'mixing_box', 'cooling_coil', 'heating_coil', 'fan', 'final_filter'],
  },
  {
    id: 'heat_recovery_100oda',
    name: 'UTA 100% Aire Exterior con Recuperador',
    description: 'Toma ODA + Prefiltro G4 + Recuperador η + Batería Fría + Batería Calor + Ventilador EC + Filtro F7',
    moduleTypes: ['intake_damper', 'prefilter', 'heat_recovery', 'cooling_coil', 'heating_coil', 'fan', 'final_filter'],
  },
  {
    id: 'hospital_cleanroom',
    name: 'UTA Hospitalaria / Quirófanos',
    description: 'Toma ODA + G4 + Mezcla + F7 + Batería Fría + Calor + Humidificador + Ventilador EC + HEPA H13 + Silenciador',
    moduleTypes: ['intake_damper', 'prefilter', 'mixing_box', 'cooling_coil', 'heating_coil', 'humidifier', 'fan', 'final_filter', 'silencer'],
  },
  {
    id: 'empty_canvas',
    name: 'Lienzo Vacío (Montar desde cero)',
    description: 'Chasis vacío listo para arrastrar y montar componentes paso a paso',
    moduleTypes: [],
  },
];

export const HVACSchematicViewer: React.FC<HVACSchematicViewerProps> = ({
  points,
  processes,
  selectedPointId,
  onSelectPoint,
  onUpdatePointCoordinates,
  onAddPointAtCoordinates,
  onUpdatePointsAndProcesses,
  onOpenIdaeModal,
  units,
  pressure,
  chartType,
  layers,
}) => {
  // Schematic mode: 'ahu_section', 'building_system', 'split_sync'
  const [schematicMode, setSchematicMode] = useState<'ahu_section' | 'building_system' | 'split_sync'>('ahu_section');

  // Initial Assembled Train (Standard AHU)
  const [modules, setModules] = useState<AHUModuleItem[]>([
    {
      id: 'mod-intake',
      type: 'intake_damper',
      name: 'Toma ODA',
      enabled: true,
      pressureDropPa: 30,
      params: { outdoorRatio: 0.3 },
    },
    {
      id: 'mod-prefilter',
      type: 'prefilter',
      name: 'Prefiltro G4',
      enabled: true,
      pressureDropPa: 60,
      params: { filterClass: 'G4' },
    },
    {
      id: 'mod-mixing',
      type: 'mixing_box',
      name: 'Cámara Mezcla',
      enabled: true,
      pressureDropPa: 40,
      params: { outdoorRatio: 0.3 },
    },
    {
      id: 'mod-cooling',
      type: 'cooling_coil',
      name: 'Batería Fría (−)',
      enabled: true,
      pressureDropPa: 120,
      params: { exitTdb: 12.8, exitRh: 95, bypassFactor: 0.1, fluid: 'water_7_12' },
    },
    {
      id: 'mod-heating',
      type: 'heating_coil',
      name: 'Batería Calor (+)',
      enabled: true,
      pressureDropPa: 90,
      params: { heatingTdb: 16.5, heatingSource: 'hot_water' },
    },
    {
      id: 'mod-fan',
      type: 'fan',
      name: 'Ventilador EC',
      enabled: true,
      pressureDropPa: 0,
      params: { staticPressurePa: 450, motorEfficiency: 0.72, tempRise: 0.8 },
    },
    {
      id: 'mod-finalfilter',
      type: 'final_filter',
      name: 'Filtro Fino F7',
      enabled: true,
      pressureDropPa: 140,
      params: { filterClass: 'F7' },
    },
  ]);

  // Selected module for parameters configuration
  const [editingModuleId, setEditingModuleId] = useState<string | null>('mod-cooling');

  // Real-time synchronization toggle (auto-sync psychrometric points on slider move)
  const [autoSyncCycle, setAutoSyncCycle] = useState<boolean>(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());

  // Drag & Drop State
  const [draggedCatalogType, setDraggedCatalogType] = useState<AHUModuleType | null>(null);
  const [draggedExistingIndex, setDraggedExistingIndex] = useState<number | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const [isOverAhu, setIsOverAhu] = useState<boolean>(false);
  const ahuContainerRef = useRef<HTMLDivElement | null>(null);

  // Animation active state
  const [isFlowActive, setIsFlowActive] = useState<boolean>(true);

  // IDAE Visual Theme: 'idae_white' (authentic scanned IDAE PDF style) or 'dark_blueprint'
  const [idaeTheme, setIdaeTheme] = useState<'idae_white' | 'dark_blueprint'>('idae_white');
  const isWhiteTheme = idaeTheme === 'idae_white';

  // Viewport Transform State (Zoom, Pan, Center)
  const [transform, setTransform] = useState<ViewTransform>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
  });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Archetypes selector modal/popover
  const [isArchetypesOpen, setIsArchetypesOpen] = useState<boolean>(false);

  // IDAE Symbol Guide Modal state
  const [isSymbolGuideOpen, setIsSymbolGuideOpen] = useState<boolean>(false);

  // Zoom / Pan actions
  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.min(3.5, Number((prev.zoom * 1.2).toFixed(2))),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.max(0.35, Number((prev.zoom / 1.2).toFixed(2))),
    }));
  };

  const handleZoomAll = () => {
    setTransform({
      zoom: 0.92,
      panX: 0,
      panY: 0,
    });
  };

  const handleCenterUnit = () => {
    setTransform((prev) => ({
      zoom: prev.zoom,
      panX: 0,
      panY: 0,
    }));
  };

  const handleResetView = () => {
    setTransform({
      zoom: 1.0,
      panX: 0,
      panY: 0,
    });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setTransform((prev) => ({
      ...prev,
      zoom: Math.min(3.5, Math.max(0.35, Number((prev.zoom * factor).toFixed(2)))),
    }));
  };

  // Canvas pan handlers (only when not interacting with draggable items or buttons)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: transform.panX,
      panY: transform.panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCanvas) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setTransform((prev) => ({
      ...prev,
      panX: dragStartRef.current.panX + dx,
      panY: dragStartRef.current.panY + dy,
    }));
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // Filter out disabled modules for physical layout representation
  const enabledModules = useMemo(() => modules.filter((m) => m.enabled), [modules]);

  // Width definition for each section
  const moduleWidths: Record<AHUModuleType, number> = {
    intake_damper: 95,
    prefilter: 85,
    mixing_box: 135,
    heat_recovery: 155,
    rotary_wheel: 145,
    cooling_coil: 140,
    heating_coil: 125,
    electric_heater: 125,
    adiabatic_cooling: 135,
    humidifier: 115,
    droplet_eliminator: 75,
    fan: 160,
    belt_fan: 165,
    return_fan: 160,
    plenum: 105,
    final_filter: 95,
    silencer: 125,
    exhaust_damper: 95,
  };

  // Calculate dynamic chassis width based on assembled modules
  const dynamicChassisWidth = useMemo(() => {
    if (enabledModules.length === 0) return 400;
    const totalContentWidth = enabledModules.reduce(
      (sum, mod) => sum + (moduleWidths[mod.type] || 100) + 10,
      10
    );
    return Math.max(700, totalContentWidth + 30);
  }, [enabledModules]);

  // Dynamic SVG ViewBox width
  const dynamicSvgViewBoxWidth = useMemo(() => {
    return Math.max(1150, dynamicChassisWidth + 360);
  }, [dynamicChassisWidth]);

  // Identify active module being edited
  const activeEditingModule = useMemo(() => {
    return modules.find((m) => m.id === editingModuleId) || null;
  }, [modules, editingModuleId]);

  // Total pressure drop
  const totalPressureDropPa = useMemo(() => {
    return enabledModules.reduce((acc, m) => acc + (m.pressureDropPa || 0), 0);
  }, [enabledModules]);

  // Identify key points from cycle
  const outdoorPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('ext') || n.includes('oa') || n.includes('oda') || n.includes('1');
    }) || points[0] || solveStatePoint({ mode: 'tdb_rh', tdb: 35, rh: 45 }, pressure);

  const supplyPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('imp') || n.includes('sup') || n.includes('sa') || n.includes('4');
    }) || points[points.length - 1] || solveStatePoint({ mode: 'tdb_rh', tdb: 15, rh: 85 }, pressure);

  const roomPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('int') || n.includes('ida') || n.includes('ra') || n.includes('loc');
    }) || solveStatePoint({ mode: 'tdb_rh', tdb: 24, rh: 50 }, pressure);

  // ---------------- MODULE CREATION AND MANAGEMENT ----------------
  const insertModuleAt = (type: AHUModuleType, slotIndex: number) => {
    const catalogItem = MODULE_CATALOG.find((m) => m.type === type);
    const newMod: AHUModuleItem = {
      id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      name: catalogItem ? catalogItem.shortName : 'Nuevo Módulo',
      enabled: true,
      pressureDropPa: catalogItem ? catalogItem.defaultDropPa : 60,
      params: catalogItem ? { ...catalogItem.defaultParams } : {},
    };

    setModules((prev) => {
      const copy = [...prev];
      const targetPos = Math.min(copy.length, Math.max(0, slotIndex));
      copy.splice(targetPos, 0, newMod);
      return copy;
    });

    // Automatically open parameters card for the newly inserted module!
    setEditingModuleId(newMod.id);

    // Sync to cycle if autoSync is active
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(), 50);
    }
  };

  const handleDuplicateModule = (id: string) => {
    const source = modules.find((m) => m.id === id);
    if (!source) return;
    const index = modules.findIndex((m) => m.id === id);
    const duplicate: AHUModuleItem = {
      ...source,
      id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Copia)`,
      params: { ...source.params },
    };
    setModules((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicate);
      return copy;
    });
    setEditingModuleId(duplicate.id);
  };

  const handleMoveModule = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    setModules((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = item;
      return copy;
    });
  };

  const handleRemoveModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    if (editingModuleId === id) {
      const remaining = modules.filter((m) => m.id !== id);
      setEditingModuleId(remaining.length > 0 ? remaining[0].id : null);
    }
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(), 50);
    }
  };

  const handleToggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(), 50);
    }
  };

  const handleUpdateModuleParams = (id: string, newParams: Partial<AHUModuleItem['params']>) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, params: { ...m.params, ...newParams } } : m))
    );
    if (autoSyncCycle) {
      triggerSyncWithModules();
    }
  };

  const handleLoadArchetype = (archetypeId: string) => {
    const arch = AHU_ARCHETYPES.find((a) => a.id === archetypeId);
    if (!arch) return;

    const newMods: AHUModuleItem[] = arch.moduleTypes.map((type, idx) => {
      const cat = MODULE_CATALOG.find((c) => c.type === type);
      return {
        id: `mod-${Date.now()}-${idx}`,
        type,
        name: cat ? cat.shortName : type,
        enabled: true,
        pressureDropPa: cat ? cat.defaultDropPa : 50,
        params: cat ? { ...cat.defaultParams } : {},
      };
    });

    setModules(newMods);
    setEditingModuleId(newMods.length > 0 ? newMods[0].id : null);
    setIsArchetypesOpen(false);

    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(newMods), 50);
    }
  };

  // ---------------- DRAG AND DROP HANDLERS TO BUILD AHU ----------------
  const handlePaletteDragStart = (e: React.DragEvent, type: AHUModuleType) => {
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.setData('application/ahu-module-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedCatalogType(type);
  };

  const handleExistingModuleDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/ahu-existing-index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedExistingIndex(index);
  };

  const handleAhuDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOverAhu(true);

    if (!ahuContainerRef.current) return;
    const rect = ahuContainerRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;

    // Calculate nearest insertion slot between 0 and enabledModules.length
    const numSlots = enabledModules.length + 1;
    const slotIdx = Math.min(
      enabledModules.length,
      Math.max(0, Math.floor(relativeX * numSlots))
    );
    setHoveredSlotIndex(slotIdx);
  };

  const handleAhuDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsOverAhu(false);
    setHoveredSlotIndex(null);
  };

  const handleAhuDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverAhu(false);

    const moduleType = (e.dataTransfer.getData('application/ahu-module-type') ||
      e.dataTransfer.getData('text/plain')) as AHUModuleType;
    const existingIndexStr = e.dataTransfer.getData('application/ahu-existing-index');

    if (existingIndexStr !== '') {
      // Reordering an existing module
      const fromIdx = parseInt(existingIndexStr, 10);
      const toIdx = hoveredSlotIndex !== null ? hoveredSlotIndex : enabledModules.length;
      if (!isNaN(fromIdx) && fromIdx !== toIdx) {
        setModules((prev) => {
          const copy = [...prev];
          const [item] = copy.splice(fromIdx, 1);
          const adjustedTo = toIdx > fromIdx ? toIdx - 1 : toIdx;
          copy.splice(adjustedTo, 0, item);
          return copy;
        });
      }
    } else if (moduleType && MODULE_CATALOG.some((c) => c.type === moduleType)) {
      // Inserting a new module from the palette
      const insertAt = hoveredSlotIndex !== null ? hoveredSlotIndex : enabledModules.length;
      insertModuleAt(moduleType, insertAt);
    }

    setDraggedCatalogType(null);
    setDraggedExistingIndex(null);
    setHoveredSlotIndex(null);
  };

  // ---------------- PSYCHROMETRIC CYCLE SYNCHRONIZATION ----------------
  const triggerSyncWithModules = (currentModList?: AHUModuleItem[]) => {
    if (!onUpdatePointsAndProcesses) return;

    const list = (currentModList || modules).filter((m) => m.enabled);
    const outdoor = points[0] || solveStatePoint({ mode: 'tdb_rh', tdb: 35, rh: 45 }, pressure);
    const returnPt = points[1] || solveStatePoint({ mode: 'tdb_rh', tdb: 25, rh: 50 }, pressure);

    let currentPt = outdoor;
    const newPoints: StatePoint[] = [
      { ...outdoor, id: 'pt-1', name: '1. Exterior (ODA)' },
      { ...returnPt, id: 'pt-2', name: '2. Retorno (RA)' },
    ];
    const newProcesses: ProcessConnection[] = [];
    let ptCounter = 3;

    // 1. Mixing box
    const mixingMod = list.find((m) => m.type === 'mixing_box');
    const outdoorRatio = mixingMod?.params.outdoorRatio ?? 0.3;

    if (mixingMod) {
      const tdbMix = outdoorRatio * outdoor.tdb + (1 - outdoorRatio) * returnPt.tdb;
      const wMix = outdoorRatio * outdoor.w + (1 - outdoorRatio) * returnPt.w;
      const mixPt = solveStatePoint({ mode: 'tdb_w', tdb: tdbMix, w: wMix }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Mezcla (MA)`,
        color: '#F59E0B',
        volumeFlow: outdoor.volumeFlow || 3000,
      });
      newPoints.push(mixPt);
      newProcesses.push({
        id: `proc-mix`,
        name: 'Mezcla ODA + RA',
        type: 'mixing',
        fromPointId: 'pt-1',
        toPointId: mixPt.id,
        secondaryFromPointId: 'pt-2',
        mixingRatio: outdoorRatio,
        color: '#F59E0B',
        ...calculateProcessMetrics(outdoor, mixPt, outdoor.massFlow),
      });
      currentPt = mixPt;
      ptCounter++;
    }

    // 2. Heat recovery (if present before coils)
    const recMod = list.find((m) => m.type === 'heat_recovery');
    if (recMod) {
      const eff = recMod.params.recoveryEfficiency ?? 0.75;
      const tdbRec = currentPt.tdb + eff * (returnPt.tdb - currentPt.tdb);
      const recPt = solveStatePoint({ mode: 'tdb_w', tdb: tdbRec, w: currentPt.w }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Post-Recuperador`,
        color: '#0EA5E9',
        volumeFlow: currentPt.volumeFlow,
      });
      newPoints.push(recPt);
      newProcesses.push({
        id: `proc-rec`,
        name: 'Recuperación de Calor η',
        type: 'sensible_cooling',
        fromPointId: currentPt.id,
        toPointId: recPt.id,
        color: '#0EA5E9',
        ...calculateProcessMetrics(currentPt, recPt, currentPt.massFlow),
      });
      currentPt = recPt;
      ptCounter++;
    }

    // 3. Cooling coil
    const coolMod = list.find((m) => m.type === 'cooling_coil');
    if (coolMod) {
      const exitT = coolMod.params.exitTdb ?? 12.8;
      const exitRh = coolMod.params.exitRh ?? 95;
      const coolPt = solveStatePoint({ mode: 'tdb_rh', tdb: exitT, rh: exitRh }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Batería Fría (CC)`,
        color: '#38BDF8',
        volumeFlow: currentPt.volumeFlow,
      });
      newPoints.push(coolPt);
      newProcesses.push({
        id: `proc-cool`,
        name: 'Enfriamiento & Deshumectación',
        type: 'cooling_dehumid',
        fromPointId: currentPt.id,
        toPointId: coolPt.id,
        bypassFactor: coolMod.params.bypassFactor ?? 0.1,
        color: '#38BDF8',
        ...calculateProcessMetrics(currentPt, coolPt, currentPt.massFlow),
      });
      currentPt = coolPt;
      ptCounter++;
    }

    // 4. Heating coil
    const heatMod = list.find((m) => m.type === 'heating_coil');
    if (heatMod) {
      const heatT = heatMod.params.heatingTdb ?? 16.5;
      const heatPt = solveStatePoint({ mode: 'tdb_w', tdb: heatT, w: currentPt.w }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Batería Calor (HC)`,
        color: '#EF4444',
        volumeFlow: currentPt.volumeFlow,
      });
      newPoints.push(heatPt);
      newProcesses.push({
        id: `proc-heat`,
        name: 'Calentamiento Sensible',
        type: 'sensible_heating',
        fromPointId: currentPt.id,
        toPointId: heatPt.id,
        color: '#EF4444',
        ...calculateProcessMetrics(currentPt, heatPt, currentPt.massFlow),
      });
      currentPt = heatPt;
      ptCounter++;
    }

    // 5. Humidifier
    const humMod = list.find((m) => m.type === 'humidifier');
    if (humMod) {
      const targetRh = humMod.params.targetRh ?? 50;
      const humPt = solveStatePoint({ mode: 'tdb_rh', tdb: currentPt.tdb, rh: targetRh }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Humidificación`,
        color: '#A855F7',
        volumeFlow: currentPt.volumeFlow,
      });
      newPoints.push(humPt);
      newProcesses.push({
        id: `proc-hum`,
        name: 'Humidificación de Vapor',
        type: 'steam_humid',
        fromPointId: currentPt.id,
        toPointId: humPt.id,
        color: '#A855F7',
        ...calculateProcessMetrics(currentPt, humPt, currentPt.massFlow),
      });
      currentPt = humPt;
      ptCounter++;
    }

    // 6. Fan temperature rise
    const fanMod = list.find((m) => m.type === 'fan');
    const fanRise = fanMod?.params.tempRise ?? 0.8;
    const supPt = solveStatePoint({ mode: 'tdb_w', tdb: currentPt.tdb + fanRise, w: currentPt.w }, pressure, {
      id: `pt-${ptCounter}`,
      name: `${ptCounter}. Impulsión (SUP)`,
      color: '#06B6D4',
      volumeFlow: currentPt.volumeFlow,
    });
    newPoints.push(supPt);
    newProcesses.push({
      id: `proc-fan`,
      name: 'Salto Ventilador',
      type: 'sensible_heating',
      fromPointId: currentPt.id,
      toPointId: supPt.id,
      color: '#10B981',
      ...calculateProcessMetrics(currentPt, supPt, currentPt.massFlow),
    });

    // 7. Room target point
    const roomTarget = solveStatePoint({ mode: 'tdb_rh', tdb: 24.5, rh: 50 }, pressure, {
      id: `pt-${ptCounter + 1}`,
      name: `${ptCounter + 1}. Zona Interior (IDA)`,
      color: '#8B5CF6',
      volumeFlow: currentPt.volumeFlow,
    });
    newPoints.push(roomTarget);
    newProcesses.push({
      id: `proc-room`,
      name: 'Carga Térmica del Local (SHR)',
      type: 'zone_load',
      fromPointId: supPt.id,
      toPointId: roomTarget.id,
      color: '#8B5CF6',
      ...calculateProcessMetrics(supPt, roomTarget, supPt.massFlow),
    });

    onUpdatePointsAndProcesses(newPoints, newProcesses);
    setLastSyncTimestamp(Date.now());
  };

  // Thermal metrics
  const coolingProcess = processes.find((p) => p.type === 'cooling_dehumid');
  const heatingProcess = processes.find((p) => p.type === 'sensible_heating');

  const coolingCoilPoint =
    points.find((p) => p.name.includes('Fría') || p.name.includes('CC') || p.name.includes('3')) ||
    solveStatePoint({ mode: 'tdb_rh', tdb: 12.8, rh: 95 }, pressure);

  const mixedPoint =
    points.find((p) => p.name.includes('Mezcla') || p.name.includes('MA') || p.name.includes('2')) ||
    solveStatePoint({ mode: 'tdb_rh', tdb: 28, rh: 50 }, pressure);

  const coolingPowerKW = useMemo(() => {
    if (coolingProcess?.qTotal) return Math.abs(coolingProcess.qTotal);
    const deltaH = Math.max(0, mixedPoint.h - coolingCoilPoint.h);
    return (deltaH * (mixedPoint.massFlow || 1.1)) / 1000;
  }, [coolingProcess, mixedPoint, coolingCoilPoint]);

  const condensateLitersPerHour = useMemo(() => {
    if (coolingProcess?.moistureExchange) return Math.abs(coolingProcess.moistureExchange);
    const deltaW = Math.max(0, mixedPoint.w - coolingCoilPoint.w);
    return deltaW * (mixedPoint.massFlow || 1.1) * 3600;
  }, [coolingProcess, mixedPoint, coolingCoilPoint]);

  const heatingPowerKW = useMemo(() => {
    if (heatingProcess?.qSensible) return Math.abs(heatingProcess.qSensible);
    return 14.5;
  }, [heatingProcess]);

  return (
    <div className="space-y-4 font-primary">
      {/* ---------------- 1. HEADER & MODE SWITCHER BAR ---------------- */}
      <div className="panel-glass p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#fbbf24] text-black flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.3)]">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Corte Longitudinal UTA & Montador Modular
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-[4px] font-mono bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30 font-semibold">
                Arrastra y Suelta Activo
              </span>
            </div>
            <p className="text-xs text-[#cbd5e1] hidden sm:block">
              Monta la unidad arrastrando componentes desde la paleta superior y ajusta sus parámetros termodinámicos
            </p>
          </div>
        </div>

        {/* View mode toggle & Quick Templates */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Archetypes / Templates Dropdown button */}
          <div className="relative">
            <button
              onClick={() => setIsArchetypesOpen(!isArchetypesOpen)}
              className="btn-secondary text-[12px]"
              title="Cargar configuraciones predefinidas de UTA"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Plantillas UTA</span>
            </button>

            {isArchetypesOpen && (
              <div className="absolute right-0 mt-2 w-80 panel-glass p-2 z-50 space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-[#cbd5e1] font-mono uppercase tracking-wider border-b border-[rgba(255,255,255,0.1)] flex justify-between items-center">
                  <span>Arquetipos de UTA</span>
                  <X className="w-3.5 h-3.5 cursor-pointer text-slate-400 hover:text-white" onClick={() => setIsArchetypesOpen(false)} />
                </div>
                {AHU_ARCHETYPES.map((arch) => (
                  <button
                    key={arch.id}
                    onClick={() => handleLoadArchetype(arch.id)}
                    className="w-full text-left p-2 rounded-[6px] hover:bg-[rgba(255,255,255,0.08)] transition-colors group flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-semibold text-white group-hover:text-[#fbbf24]">
                      {arch.name}
                    </span>
                    <span className="text-[10px] text-[#cbd5e1] line-clamp-2">
                      {arch.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* IDAE Compliance Audit button */}
          {onOpenIdaeModal && (
            <button
              onClick={onOpenIdaeModal}
              className="btn-secondary text-[12px] !border-[#65a30d]/40 !text-[#a3e635] hover:!border-[#a3e635]"
              title="Auditoría de conformidad según la Guía Técnica IDAE de Equipos Autónomos (ATECYR / RITE)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#a3e635]" />
              <span>Auditoría IDAE</span>
            </button>
          )}

          {/* IDAE Symbol Guide button */}
          <button
            onClick={() => setIsSymbolGuideOpen(true)}
            className="btn-secondary text-[12px] !border-[#fbbf24]/30 !text-[#fbbf24] hover:!border-[#fbbf24]"
            title="Catálogo de simbología normalizada según Guía IDAE y UNE-EN 12792:2004"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Simbología IDAE</span>
          </button>

          {/* Theme switcher: IDAE White (authentic guide technical drawing) vs Dark Blueprint */}
          <button
            onClick={() => setIdaeTheme(isWhiteTheme ? 'dark_blueprint' : 'idae_white')}
            className={`btn-secondary text-[12px] ${
              isWhiteTheme ? '!bg-white !text-black !border-slate-300' : ''
            }`}
            title={
              isWhiteTheme
                ? 'Cambiar a Estilo Blueprint Oscuro'
                : 'Cambiar a Estilo Guía IDAE (Fondo Claro Técnico)'
            }
          >
            <Layers className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>{isWhiteTheme ? 'Estilo Guía IDAE' : 'Estilo Oscuro'}</span>
          </button>

          {/* Sync status & Manual trigger */}
          <button
            onClick={() => triggerSyncWithModules()}
            className="btn-primary text-[12px]"
            title="Sincronizar puntos y procesos psicrométricos con el diseño de la UTA"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar</span>
          </button>

          {/* View switcher tabs */}
          <div className="tabs-container">
            <button
              onClick={() => setSchematicMode('ahu_section')}
              className={`tab-item !py-1 !text-xs ${
                schematicMode === 'ahu_section' ? 'active' : ''
              }`}
            >
              <AirVent className="w-3.5 h-3.5" />
              <span>Corte UTA</span>
            </button>
            <button
              onClick={() => setSchematicMode('building_system')}
              className={`tab-item !py-1 !text-xs ${
                schematicMode === 'building_system' ? 'active' : ''
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Edificio RITE</span>
            </button>
            <button
              onClick={() => setSchematicMode('split_sync')}
              className={`tab-item !py-1 !text-xs ${
                schematicMode === 'split_sync' ? 'active' : ''
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Dividida</span>
            </button>
          </div>

          {/* Air flow animation toggle */}
          <button
            onClick={() => setIsFlowActive(!isFlowActive)}
            className="btn-secondary text-[12px]"
            title="Activar o pausar animación del flujo de aire"
          >
            <Wind className={`w-3.5 h-3.5 ${isFlowActive ? 'text-[#a3e635]' : 'text-slate-500'}`} />
            <span>{isFlowActive ? 'Flujo Activo' : 'Pausado'}</span>
          </button>
        </div>
      </div>

      {/* ---------------- 2. DRAGGABLE COMPONENT PALETTE (PALETA DE COMPONENTES) ---------------- */}
      {schematicMode === 'ahu_section' && (
        <div className="panel-glass p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-[#fbbf24]" />
              <span>Paleta de Módulos (Arrastra a la UTA o pulsa '+' para añadir):</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#cbd5e1] font-mono hidden md:inline">
                Arrastra cualquier sección directamente sobre el corte longitudinal
              </span>
              <button
                onClick={() => handleLoadArchetype('empty_canvas')}
                className="text-[11px] font-mono text-[#fca5a5] hover:text-[#ef4444] flex items-center gap-1"
                title="Vaciar la UTA para montar desde cero"
              >
                <Trash2 className="w-3 h-3" />
                <span>Vaciar UTA</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            {MODULE_CATALOG.map((cat) => (
              <div
                key={cat.type}
                draggable={true}
                onDragStart={(e) => handlePaletteDragStart(e, cat.type)}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#1a1a1c] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] hover:border-[#fbbf24] cursor-grab active:cursor-grabbing transition-all shadow-[0_4px_6px_rgba(0,0,0,0.3)] group select-none relative hover:scale-[1.02]"
                title={`${cat.title}: ${cat.description}\n(Arrastra a la posición deseada en el corte)`}
              >
                <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#fbbf24] shrink-0" />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white group-hover:text-[#fbbf24] whitespace-nowrap">
                    {cat.shortName}
                  </span>
                  <span className="text-[9px] font-mono text-[#cbd5e1]">
                    ΔP: {cat.defaultDropPa} Pa
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    insertModuleAt(cat.type, enabledModules.length);
                  }}
                  className="ml-1 p-1 rounded-[4px] bg-[#0a0a0c] hover:bg-[#fbbf24] hover:text-black text-slate-400 transition-colors"
                  title={`Añadir ${cat.shortName} al final del tren`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 3. MAIN SVG CANVAS WITH VISUAL DROP TARGETS & REORDERING ---------------- */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Top Floating Viewport Control HUD */}
        {schematicMode !== 'split_sync' && (
          <div className="w-full flex items-center justify-between mb-3 px-1 z-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                {schematicMode === 'ahu_section'
                  ? `Corte Longitudinal UTA (${enabledModules.length} secciones montadas · ΔP Total: ${totalPressureDropPa} Pa)`
                  : 'Sistema Mixto en Edificio RITE'}
              </span>
            </div>

            {/* Navigation HUD */}
            <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Alejar (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="px-2 py-1 rounded-md text-xs font-mono font-semibold text-cyan-300 hover:bg-slate-800 transition-colors"
                title="Restablecer al 100%"
              >
                {Math.round(transform.zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Acercar (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-[1px] bg-slate-700 mx-1" />
              <button
                onClick={handleZoomAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/50 hover:text-white transition-colors"
                title="Ajustar Todo a la Pantalla"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajustar Todo</span>
              </button>
              <button
                onClick={handleCenterUnit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/50 hover:text-white transition-colors"
                title="Centrar Unidad"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>Centrar</span>
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Restablecer Posición y Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Interactive SVG Canvas for AHU */}
        {schematicMode === 'ahu_section' && (
          <div
            ref={ahuContainerRef}
            onDragOver={handleAhuDragOver}
            onDragLeave={handleAhuDragLeave}
            onDrop={handleAhuDrop}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleZoomAll}
            className={`w-full relative overflow-hidden rounded-xl bg-slate-950/70 border transition-all flex items-center justify-center min-h-[480px] h-[520px] select-none ${
              isOverAhu ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-2xl shadow-cyan-500/20' : 'border-slate-800/80'
            } ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {/* Visual Drag & Drop Active Banner */}
            {isOverAhu && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-cyan-950/95 text-cyan-300 border border-cyan-400 px-5 py-2 rounded-full text-xs font-mono font-bold shadow-2xl pointer-events-none flex items-center gap-2 animate-pulse">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>
                  Soltar para insertar en la posición #{hoveredSlotIndex !== null ? hoveredSlotIndex + 1 : 'final'}
                </span>
              </div>
            )}

            {/* Empty state overlay when 0 modules are assembled */}
            {enabledModules.length === 0 && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 animate-bounce shadow-xl shadow-cyan-500/10">
                  <AirVent className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-tech">Chasis de la UTA Vacío</h4>
                  <p className="text-xs text-slate-400 max-w-md mt-1">
                    Arrastra módulos desde la paleta superior para comenzar a armar el tren de tratamiento o carga una plantilla predefinida.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleLoadArchetype('standard_4pipe')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cargar UTA 4 Tubos Estándar</span>
                  </button>
                  <button
                    onClick={() => handleLoadArchetype('heat_recovery_100oda')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-700"
                  >
                    <span>100% Aire Exterior</span>
                  </button>
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${dynamicSvgViewBoxWidth} 440`}
              className="w-full h-full drop-shadow-2xl overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="ahuAirGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glowDrop" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Centered pan/zoom group */}
              <g
                transform={`translate(${dynamicSvgViewBoxWidth / 2 + transform.panX}, ${220 + transform.panY}) scale(${transform.zoom}) translate(${-dynamicSvgViewBoxWidth / 2}, -220)`}
                className="transition-transform duration-75"
              >
                {/* Background Plate */}
                <rect
                  x="10"
                  y="10"
                  width={dynamicSvgViewBoxWidth - 20}
                  height="420"
                  rx="14"
                  fill="#090D16"
                  stroke={isOverAhu ? '#0284C7' : '#1E293B'}
                  strokeWidth={isOverAhu ? '2.5' : '1.5'}
                />

                {/* Canvas header title */}
                <text
                  x={dynamicSvgViewBoxWidth / 2}
                  y="34"
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono"
                  letterSpacing="1.5"
                >
                  CORTE LONGITUDINAL UTA · ENSAMBLAJE MODULAR & PARÁMETROS TERMODINÁMICOS
                </text>

                {/* Air Intake arrows: Aire Exterior (ODA) */}
                <g transform="translate(35, 110)">
                  <text x="35" y="-15" textAnchor="middle" fill="#E2E8F0" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                    Aire exterior (ODA)
                  </text>
                  <g
                    transform="translate(35, 110)"
                    className="cursor-pointer"
                    onClick={() => onSelectPoint(outdoorPoint.id)}
                  >
                    <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#0B132B" stroke="#EF4444" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#FCA5A5" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">
                      {outdoorPoint.tdb.toFixed(1)}°C | {outdoorPoint.rh.toFixed(0)}%
                    </text>
                  </g>
                  {[0, 16, 32, 48, 64].map((dy, i) => (
                    <g key={`arrow-in-${i}`} transform={`translate(0, ${dy})`}>
                      <line x1="0" y1="0" x2="65" y2="0" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                      <polygon points="65,0 55,-4 57,0 55,4" fill="#10B981" />
                    </g>
                  ))}
                </g>

                {/* Dynamic AHU Chassis Enclosure */}
                <g transform="translate(145, 55)">
                  {/* Chassis mounting legs with antivibration blocks */}
                  {[30, Math.floor(dynamicChassisWidth * 0.35), Math.floor(dynamicChassisWidth * 0.7), dynamicChassisWidth - 40].map((lx, i) => (
                    <g key={`leg-${i}`} transform={`translate(${lx}, 220)`}>
                      <rect x="0" y="0" width="22" height="28" fill="#1E293B" stroke="#475569" strokeWidth="1.5" rx="2" />
                      <rect x="-6" y="24" width="34" height="8" fill="#0F172A" stroke="#334155" strokeWidth="1.5" rx="2" />
                      <circle cx="11" cy="14" r="3" fill="#64748B" />
                    </g>
                  ))}

                  {/* Outer double-wall insulated metal casing */}
                  <rect x="0" y="0" width={dynamicChassisWidth} height="220" fill="#0B132B" stroke="#334155" strokeWidth="4" rx="6" />
                  <rect x="4" y="4" width={dynamicChassisWidth - 8} height="212" fill="#070B14" stroke="#1E293B" strokeWidth="2" />

                  {/* Render Insertion Drop Slots (visible when dragging) */}
                  {isOverAhu && (
                    <g className="insertion-guides">
                      {(() => {
                        let runningX = 10;
                        const slots = [runningX];
                        enabledModules.forEach((m) => {
                          runningX += (moduleWidths[m.type] || 100) + 10;
                          slots.push(runningX);
                        });

                        return slots.map((sx, sIdx) => {
                          const isHovered = hoveredSlotIndex === sIdx;
                          return (
                            <g key={`drop-slot-${sIdx}`} transform={`translate(${sx - 5}, 10)`}>
                              <rect
                                x="0"
                                y="0"
                                width="10"
                                height="200"
                                rx="2"
                                fill={isHovered ? '#38BDF8' : '#0284C7'}
                                opacity={isHovered ? 0.9 : 0.4}
                                stroke="#38BDF8"
                                strokeDasharray="4,3"
                              />
                              {isHovered && (
                                <g transform="translate(5, 100)">
                                  <circle cx="0" cy="0" r="14" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
                                  <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
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

                  {/* Render Each Modular Section Dynamically */}
                  {(() => {
                    let currentOffset = 10;
                    return enabledModules.map((mod, index) => {
                      const modWidth = moduleWidths[mod.type] || 100;
                      const modX = currentOffset;
                      currentOffset += modWidth + 10;
                      const isModActive = editingModuleId === mod.id;

                      return (
                        <g
                          key={mod.id}
                          transform={`translate(${modX}, 10)`}
                          className="cursor-pointer group"
                          onClick={() => setEditingModuleId(mod.id)}
                        >
                          {/* Module casing with active glow and theme styling */}
                          <rect
                            x="0"
                            y="0"
                            width={modWidth}
                            height="200"
                            rx="4"
                            fill={
                              isModActive
                                ? isWhiteTheme
                                  ? '#E0F2FE'
                                  : '#1E293B'
                                : isWhiteTheme
                                ? '#FFFFFF'
                                : '#070B14'
                            }
                            stroke={
                              isModActive
                                ? '#0284C7'
                                : isWhiteTheme
                                ? '#CBD5E1'
                                : '#334155'
                            }
                            strokeWidth={isModActive ? '3' : '1.5'}
                            filter={isModActive && !isWhiteTheme ? 'url(#glowDrop)' : undefined}
                          />

                          {/* Reordering and Quick Action Overlay Buttons inside SVG on Hover */}
                          <g transform="translate(4, 6)" className="opacity-60 group-hover:opacity-100 transition-opacity">
                            {/* Reorder Left */}
                            {index > 0 && (
                              <g
                                transform="translate(0, 0)"
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveModule(index, 'left');
                                }}
                              >
                                <circle cx="7" cy="7" r="7" fill={isWhiteTheme ? '#E2E8F0' : '#334155'} />
                                <text x="7" y="10" textAnchor="middle" fill={isWhiteTheme ? '#0F172A' : '#E2E8F0'} fontSize="8" fontWeight="bold">◀</text>
                              </g>
                            )}
                            {/* Reorder Right */}
                            {index < enabledModules.length - 1 && (
                              <g
                                transform="translate(18, 0)"
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveModule(index, 'right');
                                }}
                              >
                                <circle cx="7" cy="7" r="7" fill={isWhiteTheme ? '#E2E8F0' : '#334155'} />
                                <text x="7" y="10" textAnchor="middle" fill={isWhiteTheme ? '#0F172A' : '#E2E8F0'} fontSize="8" fontWeight="bold">▶</text>
                              </g>
                            )}
                          </g>

                          {/* Delete Button top-right */}
                          <g
                            transform={`translate(${modWidth - 18}, 6)`}
                            className="opacity-70 group-hover:opacity-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveModule(mod.id);
                            }}
                          >
                            <circle cx="7" cy="7" r="7" fill="#EF4444" />
                            <text x="7" y="10" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">✕</text>
                          </g>

                          {/* Standardized IDAE / UNE-EN 12792 Section Symbol */}
                          <IDAESectionSymbol
                            mod={mod}
                            modWidth={modWidth}
                            isFlowActive={isFlowActive}
                            isWhiteTheme={isWhiteTheme}
                          />

                          {/* Module Title & Parameters Labels */}
                          <text
                            x={modWidth / 2}
                            y="-18"
                            textAnchor="middle"
                            fill={isWhiteTheme ? '#0F172A' : '#E2E8F0'}
                            fontSize="12"
                            fontWeight="bold"
                            fontFamily="Plus Jakarta Sans"
                          >
                            {mod.name.split(' ')[0]}
                          </text>
                          <text
                            x={modWidth / 2}
                            y="214"
                            textAnchor="middle"
                            fill={isWhiteTheme ? '#475569' : '#94A3B8'}
                            fontSize="10"
                            fontFamily="JetBrains Mono"
                          >
                            {mod.params.filterClass || (mod.type === 'cooling_coil' ? `${mod.params.exitTdb}°C` : mod.type === 'heating_coil' ? `${mod.params.heatingTdb}°C` : `${mod.pressureDropPa} Pa`)}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </g>

                {/* Air Outlet arrows: Aire Impulsado (SUP) */}
                <g transform={`translate(${160 + dynamicChassisWidth + 25}, 110)`}>
                  <text x="45" y="-15" textAnchor="middle" fill="#E2E8F0" fontSize="12" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                    Aire Impulsado (SUP)
                  </text>
                  <g
                    transform="translate(45, 110)"
                    className="cursor-pointer"
                    onClick={() => onSelectPoint(supplyPoint.id)}
                  >
                    <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#0B132B" stroke="#06B6D4" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#67E8F9" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">
                      {supplyPoint.tdb.toFixed(1)}°C | {supplyPoint.rh.toFixed(0)}%
                    </text>
                  </g>
                  {[0, 16, 32, 48, 64].map((dy, i) => (
                    <g key={`arrow-out-${i}`} transform={`translate(0, ${dy})`}>
                      <line x1="0" y1="0" x2="65" y2="0" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                      <polygon points="65,0 55,-4 57,0 55,4" fill="#10B981" />
                    </g>
                  ))}
                </g>
              </g>
            </svg>

            {/* Bottom Floating Hint Overlay */}
            <div className="absolute bottom-3 left-4 z-10 hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800/80 pointer-events-none shadow-md">
              <Move className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arrastra componentes de la paleta superior para soltarlos en la UTA · Clic en cualquier módulo para ajustar sus parámetros</span>
            </div>
          </div>
        )}

        {/* Building System View according to IDAE Guide */}
        {schematicMode === 'building_system' && (
          <div className="w-full relative overflow-hidden rounded-xl min-h-[500px] h-[540px]">
            <BuildingSystemIDAESchematic
              points={points}
              selectedPointId={selectedPointId}
              onSelectPoint={onSelectPoint}
              isFlowActive={isFlowActive}
              isWhiteTheme={isWhiteTheme}
            />
          </div>
        )}

        {/* Split View */}
        {schematicMode === 'split_sync' && (
          <div className="w-full flex flex-col xl:flex-row gap-4 h-[620px]">
            <div className="flex-1 h-full min-h-[380px] bg-slate-950/80 rounded-xl border border-slate-800 p-2 relative overflow-hidden flex flex-col">
              <PsychrometricChart
                points={points}
                processes={processes}
                selectedPointId={selectedPointId}
                onSelectPoint={(id) => id && onSelectPoint(id)}
                onUpdatePointCoordinates={onUpdatePointCoordinates || (() => {})}
                onAddPointAtCoordinates={onAddPointAtCoordinates || (() => {})}
                pressure={pressure}
                chartType={chartType}
                units={units}
                layers={layers}
              />
            </div>
            <div className="flex-1 h-full min-h-[380px] bg-slate-950/80 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {enabledModules.length} secciones modulares ensambladas
              </span>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>Potencia Frío: {coolingPowerKW.toFixed(1)} kW</div>
                  <div>Condensados: {condensateLitersPerHour.toFixed(2)} L/h</div>
                  <div>Potencia Calor: {heatingPowerKW.toFixed(1)} kW</div>
                  <div>Pérdida Carga: {totalPressureDropPa} Pa</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- 4. PARAMETER CONFIGURATION DRAWER (FOR CLICKED / DROPPED MODULE) ---------------- */}
      {activeEditingModule && (
        <div className="panel-glass p-4 border border-[#fbbf24]/40 shadow-glow space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.1)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[4px] bg-[#fbbf24] text-black flex items-center justify-center font-bold">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Configuración de Parámetros: {activeEditingModule.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#0a0a0c] text-[#fbbf24] border border-[#fbbf24]/30">
                    Tipo: {activeEditingModule.type}
                  </span>
                </h4>
                <p className="text-[11px] text-[#cbd5e1]">
                  Ajusta los valores de diseño termodinámico; se calculan potencias y se sincronizan con el diagrama psicrométrico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDuplicateModule(activeEditingModule.id)}
                className="btn-secondary text-[11px] !py-1"
                title="Duplicar este módulo"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Duplicar</span>
              </button>

              <button
                onClick={() => handleToggleModule(activeEditingModule.id)}
                className={`text-xs px-2.5 py-1 rounded-[6px] font-mono font-semibold transition-colors ${
                  activeEditingModule.enabled
                    ? 'bg-[#65a30d]/20 text-[#a3e635] border border-[#65a30d]/60'
                    : 'bg-[#1a1a1c] text-slate-500 border border-[rgba(255,255,255,0.1)]'
                }`}
              >
                {activeEditingModule.enabled ? 'Activo' : 'En Bypass'}
              </button>

              <button
                onClick={() => handleRemoveModule(activeEditingModule.id)}
                className="btn-secondary text-[11px] !py-1 !text-[#fca5a5] !border-[#ef4444]/40 hover:!border-[#ef4444]"
                title="Eliminar este módulo de la UTA"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setEditingModuleId(null)}
                className="p-1.5 rounded-[6px] text-[#cbd5e1] hover:text-white hover:bg-[rgba(255,255,255,0.1)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Module-Specific Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
            {/* Pérdida de carga */}
            <div className="space-y-1 bg-[#0a0a0c]/80 p-2.5 rounded-[6px] border border-[rgba(255,255,255,0.1)]">
              <label className="text-[11px] font-semibold text-[#cbd5e1]">Pérdida de Carga ΔP (Pa):</label>
              <input
                type="number"
                value={activeEditingModule.pressureDropPa}
                onChange={(e) =>
                  setModules((prev) =>
                    prev.map((m) =>
                      m.id === activeEditingModule.id
                        ? { ...m, pressureDropPa: Math.max(0, Number(e.target.value)) }
                        : m
                    )
                  )
                }
                className="w-full input-pro !py-1 font-mono text-[#fbbf24]"
              />
            </div>

            {/* Intake Damper */}
            {activeEditingModule.type === 'intake_damper' && (
              <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 col-span-2">
                <div className="flex justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">Apertura Compuerta ODA:</label>
                  <span className="font-mono text-emerald-300 font-bold">
                    {((activeEditingModule.params.outdoorRatio ?? 0.3) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={activeEditingModule.params.outdoorRatio ?? 0.3}
                  onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { outdoorRatio: Number(e.target.value) })}
                  className="w-full accent-emerald-400"
                />
              </div>
            )}

            {/* Prefilter / Final Filter */}
            {(activeEditingModule.type === 'prefilter' || activeEditingModule.type === 'final_filter') && (
              <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 col-span-2">
                <label className="text-[11px] font-semibold text-slate-300">Clase de Eficiencia de Filtrado:</label>
                <select
                  value={activeEditingModule.params.filterClass || (activeEditingModule.type === 'prefilter' ? 'G4' : 'F7')}
                  onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { filterClass: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                >
                  <option value="G4">G4 / ISO Coarse 65% (Prefiltrado polvo y polen)</option>
                  <option value="M5">M5 / ePM10 50% (Media eficacia)</option>
                  <option value="F7">F7 / ePM1 70% (Filtro fino estándar RITE)</option>
                  <option value="F9">F9 / ePM1 85% (Alta eficacia partículas finas)</option>
                  <option value="HEPA_H13">HEPA H13 (99.95% Salas blancas / Hospitales)</option>
                </select>
              </div>
            )}

            {/* Cooling Coil */}
            {activeEditingModule.type === 'cooling_coil' && (
              <>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">T. Salida Bulbo Seco:</label>
                    <span className="font-mono text-cyan-300 font-bold">{activeEditingModule.params.exitTdb ?? 12.8}°C</span>
                  </div>
                  <input
                    type="range"
                    min="8.0"
                    max="20.0"
                    step="0.1"
                    value={activeEditingModule.params.exitTdb ?? 12.8}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { exitTdb: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">HR Salida:</label>
                    <span className="font-mono text-emerald-300 font-bold">{activeEditingModule.params.exitRh ?? 95}%</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="98"
                    step="1"
                    value={activeEditingModule.params.exitRh ?? 95}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { exitRh: Number(e.target.value) })}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="text-[11px] font-semibold text-slate-300">Fluido Caloportador:</label>
                  <select
                    value={activeEditingModule.params.fluid ?? 'water_7_12'}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { fluid: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                  >
                    <option value="water_7_12">Agua enfriada 7 / 12 °C (Chiller)</option>
                    <option value="dx_r32">Expansión Directa R32</option>
                    <option value="dx_r410a">Expansión Directa R410A</option>
                  </select>
                </div>
              </>
            )}

            {/* Heating Coil */}
            {activeEditingModule.type === 'heating_coil' && (
              <>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">T. Objetivo Calefacción:</label>
                    <span className="font-mono text-rose-300 font-bold">{activeEditingModule.params.heatingTdb ?? 16.5}°C</span>
                  </div>
                  <input
                    type="range"
                    min="14.0"
                    max="35.0"
                    step="0.5"
                    value={activeEditingModule.params.heatingTdb ?? 16.5}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { heatingTdb: Number(e.target.value) })}
                    className="w-full accent-rose-400"
                  />
                </div>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">Fuente de Calor:</label>
                  <select
                    value={activeEditingModule.params.heatingSource ?? 'hot_water'}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { heatingSource: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                  >
                    <option value="hot_water">Agua caliente 60/50°C (Caldera / Aerotermia)</option>
                    <option value="electric_resistance">Resistencias eléctricas modulantes</option>
                    <option value="heat_pump">Gas refrigerante (Bomba de calor)</option>
                  </select>
                </div>
              </>
            )}

            {/* Mixing Box */}
            {activeEditingModule.type === 'mixing_box' && (
              <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 col-span-2">
                <div className="flex justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Proporción Aire Exterior (ODA):
                  </label>
                  <span className="font-mono text-amber-300 font-bold">
                    {((activeEditingModule.params.outdoorRatio ?? 0.3) * 100).toFixed(0)}% ODA / {(100 - (activeEditingModule.params.outdoorRatio ?? 0.3) * 100).toFixed(0)}% RA
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={activeEditingModule.params.outdoorRatio ?? 0.3}
                  onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { outdoorRatio: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            )}

            {/* Heat Recovery */}
            {activeEditingModule.type === 'heat_recovery' && (
              <>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Eficiencia Térmica η:</label>
                    <span className="font-mono text-sky-300 font-bold">
                      {((activeEditingModule.params.recoveryEfficiency ?? 0.75) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.88"
                    step="0.01"
                    value={activeEditingModule.params.recoveryEfficiency ?? 0.75}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { recoveryEfficiency: Number(e.target.value) })}
                    className="w-full accent-sky-400"
                  />
                </div>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="text-[11px] font-semibold text-slate-300">Tecnología:</label>
                  <select
                    value={activeEditingModule.params.recoveryType ?? 'plates'}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { recoveryType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                  >
                    <option value="plates">Placas de flujo cruzado (RITE)</option>
                    <option value="rotary_wheel">Rueda entálpica rotativa</option>
                  </select>
                </div>
              </>
            )}

            {/* Humidifier */}
            {activeEditingModule.type === 'humidifier' && (
              <>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Humedad Relativa Objetivo:</label>
                    <span className="font-mono text-purple-300 font-bold">{activeEditingModule.params.targetRh ?? 50}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="75"
                    step="1"
                    value={activeEditingModule.params.targetRh ?? 50}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { targetRh: Number(e.target.value) })}
                    className="w-full accent-purple-400"
                  />
                </div>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="text-[11px] font-semibold text-slate-300">Tipo de Humidificación:</label>
                  <select
                    value={activeEditingModule.params.humidifierType ?? 'steam'}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { humidifierType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                  >
                    <option value="steam">Vapor seco isotérmico (T ≈ cte)</option>
                    <option value="evaporative_pad">Panel evaporativo adiabático (h ≈ cte)</option>
                  </select>
                </div>
              </>
            )}

            {/* Fan */}
            {activeEditingModule.type === 'fan' && (
              <>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">Salto Térmico del Rodete:</label>
                    <span className="font-mono text-emerald-300 font-bold">+{activeEditingModule.params.tempRise ?? 0.8}°C</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.6"
                    step="0.1"
                    value={activeEditingModule.params.tempRise ?? 0.8}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { tempRise: Number(e.target.value) })}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <label className="text-[11px] font-semibold text-slate-300">Presión Estática Disponible (Pa):</label>
                  <input
                    type="number"
                    value={activeEditingModule.params.staticPressurePa ?? 450}
                    onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { staticPressurePa: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 font-mono text-emerald-300"
                  />
                </div>
              </>
            )}

            {/* Silencer */}
            {activeEditingModule.type === 'silencer' && (
              <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 col-span-2">
                <div className="flex justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">Atenuación Acústica Global:</label>
                  <span className="font-mono text-slate-300 font-bold">{activeEditingModule.params.attenuationDb ?? 18} dB</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  step="1"
                  value={activeEditingModule.params.attenuationDb ?? 18}
                  onChange={(e) => handleUpdateModuleParams(activeEditingModule.id, { attenuationDb: Number(e.target.value) })}
                  className="w-full accent-slate-400"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- 5. SYNCHRONIZED STATE POINTS BAR ---------------- */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider font-tech flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Puntos Psicrométricos Mapeados en el Circuito Físico</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Haz clic en cualquier punto para seleccionarlo e inspeccionar sus propiedades
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {points.map((pt) => {
            const isSelected = pt.id === selectedPointId;
            return (
              <div
                key={pt.id}
                onClick={() => onSelectPoint(pt.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pt.color }} />
                  <span className="text-xs font-semibold text-white truncate">{pt.name}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono text-[11px] tabular-nums">
                  <span className="text-cyan-300 font-bold">{pt.tdb.toFixed(1)}°C</span>
                  <span className="text-emerald-400 font-medium">{pt.rh.toFixed(0)}%</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  {(pt.w * 1000).toFixed(1)} g/kg | {pt.volumeFlow} m³/h
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* IDAE & UNE-EN 12792 Symbol Guide Modal */}
      <IDAESymbolGuideModal
        isOpen={isSymbolGuideOpen}
        onClose={() => setIsSymbolGuideOpen(false)}
      />
    </div>
  );
};
