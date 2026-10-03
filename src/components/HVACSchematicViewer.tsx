import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  StatePoint,
  ProcessConnection,
  ProcessType,
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
import { AhuExampleGuideModal } from './AhuExampleGuideModal';
import { AhuLongitudinalSvg } from './AhuLongitudinalSvg';
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
  TrendingUp,
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
  onNavigateToView?: (view: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic') => void;
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
    title: 'Prefiltro G4 / ISO Coarse 65% (0,40 m)',
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
    type: 'prefilter_flat',
    title: 'Prefiltro Plano G4/G5 (0,15 m)',
    shortName: 'Prefiltro Plano',
    category: 'Filtrado',
    color: '#F43F5E',
    borderColor: '#E11D48',
    bgBadge: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    defaultDropPa: 35,
    description: 'Filtro plano compacto de reducida profundidad (0,15 m según Pág. 18 IDAE), ideal para falso techo.',
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
    id: 'idae_fig2_superior',
    name: 'Guía IDAE Figura 2 (Superior): UTA sin Baterías (1,30 m)',
    description: 'Configuración canónica Fig. 2 (Superior): Aire exterior + Prefiltro (0,40 m) + Filtro de bolsas F7 (0,40 m) + Ventilador directo Plug-Fan (0,50 m). Longitud total: 1,30 m.',
    moduleTypes: ['prefilter', 'final_filter', 'fan'],
  },
  {
    id: 'idae_fig2_inferior',
    name: 'Guía IDAE Figura 2 (Inferior): UTA con Baterías Térmicas (2,10 m)',
    description: 'Configuración canónica Fig. 2 (Inferior): Aire exterior + Prefiltro (0,40 m) + Batería Fría (−) + Batería Calor (+) + Filtro F7 (0,40 m) + Ventilador directo Plug-Fan (0,50 m). Longitud total: 2,10 m.',
    moduleTypes: ['prefilter', 'cooling_coil', 'heating_coil', 'final_filter', 'fan'],
  },
  {
    id: 'idae_fig1_superior_sin_baterias',
    name: 'Guía IDAE Figura 1 (Superior): UTA sin Baterías (1,70 m)',
    description: 'Composición 1 de Fig. 1 IDAE: Aire exterior + Prefiltro + Ventilador + Plenum + Filtro + Aire Impulsado.',
    moduleTypes: ['prefilter', 'fan', 'plenum', 'final_filter'],
  },
  {
    id: 'idae_fig1_inferior_con_baterias',
    name: 'Guía IDAE Figura 1 (Inferior): UTA con Baterías Térmicas (2,50 m)',
    description: 'Composición 2 de Fig. 1 IDAE: Aire exterior + Prefiltro + Baterías (Frío − y Calor +) + Ventilador + Plenum + Filtro + Aire Impulsado.',
    moduleTypes: ['prefilter', 'cooling_coil', 'heating_coil', 'fan', 'plenum', 'final_filter'],
  },
  {
    id: 'idae_fig1_belt_fan',
    name: 'UTA Correas y Poleas (Guía IDAE Fig. 1 con Voluta)',
    description: 'Configuración IDAE con ventilador centrífugo accionado por transmisión de correas y poleas.',
    moduleTypes: ['prefilter', 'cooling_coil', 'heating_coil', 'belt_fan', 'final_filter'],
  },
  {
    id: 'idae_fig2_direct_fan',
    name: 'UTA Acoplamiento Directo (Guía IDAE Fig. 2 Inferior)',
    description: 'Configuración canónica IDAE Fig. 2: Prefiltro + Baterías + Filtro de bolsas + Ventilador de acoplamiento directo al final.',
    moduleTypes: ['prefilter', 'cooling_coil', 'heating_coil', 'final_filter', 'fan'],
  },
  {
    id: 'idae_pag17_standard',
    name: 'UTA 1,7 m con Ventilador Correas (Guía IDAE Pág. 17)',
    description: 'Composición de 1,7 m (Pág. 17 IDAE): Prefiltro F6 (0,4m) + Ventilador de correas (0,5m) + Plenum (0,4m) + Filtro F8 (0,4m).',
    moduleTypes: ['prefilter', 'belt_fan', 'plenum', 'final_filter'],
  },
  {
    id: 'idae_pag18_direct_130',
    name: 'UTA 1,3 m Acoplamiento Directo (Guía IDAE Pág. 18 Superior)',
    description: 'Composición reducida a 1,3 m (Pág. 18 IDAE): Prefiltro F6 (0,4m) + Filtro de bolsas F7 (0,4m) + Ventilador directo (0,5m).',
    moduleTypes: ['prefilter', 'final_filter', 'fan'],
  },
  {
    id: 'idae_pag18_flat_105',
    name: 'UTA 1,05 m Compacta Falso Techo (Guía IDAE Pág. 18 Inferior)',
    description: 'Composición ultracompacta para falso techo (1,05 m): Prefiltro plano G4 (0,15m) + Filtro F7 (0,4m) + Ventilador directo (0,5m).',
    moduleTypes: ['prefilter_flat', 'final_filter', 'fan'],
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

export interface AHUStepResult {
  stepIndex: number;
  module: AHUModuleItem;
  entryPoint: StatePoint;
  exitPoint: StatePoint;
  isTransformation: boolean;
  processType?: ProcessType;
  processName?: string;
  processColor?: string;
  associatedPointId: string;
  associatedPointName: string;
  associatedPointColor: string;
  metrics?: {
    qSensible: number;
    qLatent: number;
    qTotal: number;
    moistureExchange: number;
    shr: number;
    adp?: number;
    bypassFactor?: number;
  };
}

export function computeAHUCycle(
  moduleList: AHUModuleItem[],
  outdoorPoint: StatePoint,
  returnPoint: StatePoint,
  pressure: number
) {
  const enabledList = moduleList.filter((m) => m.enabled);
  const outdoor = { ...outdoorPoint, id: 'pt-1', name: '1. Exterior (ODA)' };
  const returnPt = { ...returnPoint, id: 'pt-2', name: '2. Retorno (RA)' };

  let currentAir = outdoor;
  let ptCounter = 3;
  const newPoints: StatePoint[] = [outdoor, returnPt];
  const newProcesses: ProcessConnection[] = [];
  const steps: AHUStepResult[] = [];

  let totalCoolingKW = 0;
  let totalHeatingKW = 0;
  let totalRecoveredKW = 0;
  let totalCondensateLh = 0;

  enabledList.forEach((mod, idx) => {
    const entry = currentAir;
    let exit = entry;
    let isTransformation = false;
    let processType: ProcessType | undefined;
    let processName: string | undefined;
    let processColor: string | undefined;
    let associatedPointId = entry.id;
    let associatedPointName = entry.name;
    let associatedPointColor = '#64748B';
    let stepMetrics: AHUStepResult['metrics'];

    if (mod.type === 'cooling_coil') {
      const exitT = mod.params.exitTdb ?? 12.8;
      const exitRh = mod.params.exitRh ?? 95;
      exit = solveStatePoint({ mode: 'tdb_rh', tdb: exitT, rh: exitRh }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Batería Fría (CC)`,
        color: '#38BDF8',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'cooling_dehumid';
      processName = 'Enfriamiento & Deshumectación';
      processColor = '#38BDF8';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#38BDF8';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-cool-${mod.id}`,
        name: 'Enfriamiento & Deshumectación',
        type: 'cooling_dehumid',
        fromPointId: entry.id,
        toPointId: exit.id,
        bypassFactor: mod.params.bypassFactor ?? 0.1,
        color: '#38BDF8',
        ...stepMetrics,
      });

      totalCoolingKW += Math.abs(stepMetrics.qTotal);
      totalCondensateLh += Math.abs(stepMetrics.moistureExchange);
      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'heating_coil') {
      const heatT = mod.params.heatingTdb ?? 16.5;
      exit = solveStatePoint({ mode: 'tdb_w', tdb: heatT, w: entry.w }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Batería Calor (HC)`,
        color: '#EF4444',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'sensible_heating';
      processName = 'Calentamiento Sensible';
      processColor = '#EF4444';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#EF4444';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-heat-${mod.id}`,
        name: 'Calentamiento Sensible',
        type: 'sensible_heating',
        fromPointId: entry.id,
        toPointId: exit.id,
        color: '#EF4444',
        ...stepMetrics,
      });

      totalHeatingKW += Math.abs(stepMetrics.qSensible);
      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'electric_heater') {
      const heatT = mod.params.heatingTdb ?? 20.0;
      exit = solveStatePoint({ mode: 'tdb_w', tdb: heatT, w: entry.w }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Resistencias (+ Eléc)`,
        color: '#EF4444',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'sensible_heating';
      processName = 'Calentamiento Eléctrico';
      processColor = '#EF4444';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#EF4444';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-elec-${mod.id}`,
        name: 'Calentamiento Eléctrico Blindado',
        type: 'sensible_heating',
        fromPointId: entry.id,
        toPointId: exit.id,
        color: '#EF4444',
        ...stepMetrics,
      });

      totalHeatingKW += Math.abs(stepMetrics.qSensible);
      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'mixing_box') {
      const r = mod.params.outdoorRatio ?? 0.3;
      const tdbMix = r * entry.tdb + (1 - r) * returnPt.tdb;
      const wMix = r * entry.w + (1 - r) * returnPt.w;
      exit = solveStatePoint({ mode: 'tdb_w', tdb: tdbMix, w: wMix }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Mezcla (MA)`,
        color: '#F59E0B',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'mixing';
      processName = 'Mezcla ODA + RA';
      processColor = '#F59E0B';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#F59E0B';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-mix-${mod.id}`,
        name: 'Mezcla ODA + RA',
        type: 'mixing',
        fromPointId: entry.id,
        toPointId: exit.id,
        secondaryFromPointId: returnPt.id,
        mixingRatio: r,
        color: '#F59E0B',
        ...stepMetrics,
      });

      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'heat_recovery') {
      const eff = mod.params.recoveryEfficiency ?? 0.75;
      const tdbRec = entry.tdb + eff * (returnPt.tdb - entry.tdb);
      exit = solveStatePoint({ mode: 'tdb_w', tdb: tdbRec, w: entry.w }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Post-Recuperador`,
        color: '#0EA5E9',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'heat_recovery';
      processName = 'Recuperación de Calor η';
      processColor = '#0EA5E9';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#0EA5E9';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-rec-${mod.id}`,
        name: 'Recuperador de Calor η',
        type: entry.tdb > returnPt.tdb ? 'sensible_cooling' : 'sensible_heating',
        fromPointId: entry.id,
        toPointId: exit.id,
        color: '#0EA5E9',
        ...stepMetrics,
      });

      totalRecoveredKW += Math.abs(stepMetrics.qSensible);
      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'rotary_wheel') {
      const eff = mod.params.recoveryEfficiency ?? 0.78;
      const effLat = eff * 0.72;
      const tdbRec = entry.tdb + eff * (returnPt.tdb - entry.tdb);
      const wRec = entry.w + effLat * (returnPt.w - entry.w);
      exit = solveStatePoint({ mode: 'tdb_w', tdb: tdbRec, w: wRec }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Rueda Entálpica`,
        color: '#10B981',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'heat_recovery';
      processName = 'Recuperador Rotativo Entálpico';
      processColor = '#10B981';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#10B981';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-wheel-${mod.id}`,
        name: 'Rueda Entálpica Rotativa',
        type: 'heat_recovery',
        fromPointId: entry.id,
        toPointId: exit.id,
        color: '#10B981',
        ...stepMetrics,
      });

      totalRecoveredKW += Math.abs(stepMetrics.qTotal);
      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'adiabatic_cooling') {
      const targetRh = mod.params.targetRh ?? 85;
      exit = solveStatePoint({ mode: 'twb_rh', twb: entry.twb, rh: targetRh }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Adiabático`,
        color: '#0284C7',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'adiabatic_humid';
      processName = 'Enfriamiento Adiabático';
      processColor = '#0284C7';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#0284C7';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-adiab-${mod.id}`,
        name: 'Enfriamiento Adiabático por Aspersión',
        type: 'adiabatic_humid',
        fromPointId: entry.id,
        toPointId: exit.id,
        color: '#0284C7',
        ...stepMetrics,
      });

      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'humidifier') {
      const targetRh = mod.params.targetRh ?? 50;
      const isEvap = mod.params.humidifierType === 'evaporative_pad';
      exit = isEvap
        ? solveStatePoint({ mode: 'twb_rh', twb: entry.twb, rh: targetRh }, pressure, {
            id: `pt-${ptCounter}`,
            name: `${ptCounter}. Humidificación`,
            color: '#A855F7',
            volumeFlow: entry.volumeFlow,
          })
        : solveStatePoint({ mode: 'tdb_rh', tdb: entry.tdb, rh: targetRh }, pressure, {
            id: `pt-${ptCounter}`,
            name: `${ptCounter}. Humidificación`,
            color: '#A855F7',
            volumeFlow: entry.volumeFlow,
          });
      isTransformation = true;
      processType = isEvap ? 'adiabatic_humid' : 'steam_humid';
      processName = isEvap ? 'Humidificación Evaporativa' : 'Humidificación de Vapor';
      processColor = '#A855F7';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#A855F7';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-hum-${mod.id}`,
        name: isEvap ? 'Humidificación Evaporativa' : 'Inyección de Vapor Seco',
        type: isEvap ? 'adiabatic_humid' : 'steam_humid',
        fromPointId: entry.id,
        toPointId: exit.id,
        color: '#A855F7',
        ...stepMetrics,
      });

      currentAir = exit;
      ptCounter++;
    } else if (mod.type === 'fan' || mod.type === 'belt_fan') {
      const fanRise = mod.params.tempRise ?? 0.8;
      const supT = entry.tdb + fanRise;
      exit = solveStatePoint({ mode: 'tdb_w', tdb: supT, w: entry.w }, pressure, {
        id: `pt-${ptCounter}`,
        name: `${ptCounter}. Impulsión (SUP)`,
        color: '#06B6D4',
        volumeFlow: entry.volumeFlow,
      });
      isTransformation = true;
      processType = 'sensible_heating';
      processName = 'Salto Térmico del Rodete';
      processColor = '#10B981';
      associatedPointId = exit.id;
      associatedPointName = exit.name;
      associatedPointColor = '#06B6D4';
      stepMetrics = calculateProcessMetrics(entry, exit, entry.massFlow);

      newPoints.push(exit);
      newProcesses.push({
        id: `proc-fan-${mod.id}`,
        name: 'Salto Ventilador',
        type: 'sensible_heating',
        fromPointId: entry.id,
        toPointId: exit.id,
        color: '#10B981',
        ...stepMetrics,
      });

      totalHeatingKW += Math.abs(stepMetrics.qSensible);
      currentAir = exit;
      ptCounter++;
    } else {
      // Passive module
      associatedPointId = (mod.type === 'prefilter' || mod.type === 'prefilter_flat' || mod.type === 'intake_damper')
        ? outdoor.id
        : entry.id;
      associatedPointName = (mod.type === 'prefilter' || mod.type === 'prefilter_flat' || mod.type === 'intake_damper')
        ? outdoor.name
        : entry.name;
      associatedPointColor = (mod.type === 'prefilter' || mod.type === 'prefilter_flat')
        ? '#F43F5E'
        : mod.type === 'final_filter'
        ? '#EC4899'
        : '#64748B';
    }

    steps.push({
      stepIndex: idx,
      module: mod,
      entryPoint: entry,
      exitPoint: exit,
      isTransformation,
      processType,
      processName,
      processColor,
      associatedPointId,
      associatedPointName,
      associatedPointColor,
      metrics: stepMetrics,
    });
  });

  // Connect supply to room target
  const roomTarget = solveStatePoint({ mode: 'tdb_rh', tdb: 24.5, rh: 50 }, pressure, {
    id: `pt-${ptCounter}`,
    name: `${ptCounter}. Zona Interior (IDA)`,
    color: '#8B5CF6',
    volumeFlow: currentAir.volumeFlow,
  });
  newPoints.push(roomTarget);
  newProcesses.push({
    id: 'proc-room',
    name: 'Carga Térmica del Local (SHR)',
    type: 'zone_load',
    fromPointId: currentAir.id,
    toPointId: roomTarget.id,
    color: '#8B5CF6',
    ...calculateProcessMetrics(currentAir, roomTarget, currentAir.massFlow),
  });

  const totalPressureDrop = enabledList.reduce((acc, m) => acc + (m.pressureDropPa || 0), 0);

  return {
    steps,
    newPoints,
    newProcesses,
    supplyPoint: currentAir,
    totalPressureDrop,
    coolingPowerKW: totalCoolingKW,
    heatingPowerKW: totalHeatingKW,
    recoveredPowerKW: totalRecoveredKW,
    condensateLitersPerHour: totalCondensateLh,
  };
}

// Width definition for each section (Proportional to official IDAE 0,40m / 0,50m lengths)
export const AHU_MODULE_WIDTHS: Record<AHUModuleType, number> = {
  intake_damper: 95,
  prefilter: 120,
  prefilter_flat: 65,
  mixing_box: 135,
  heat_recovery: 155,
  rotary_wheel: 145,
  cooling_coil: 90,
  heating_coil: 90,
  electric_heater: 90,
  adiabatic_cooling: 135,
  humidifier: 115,
  droplet_eliminator: 75,
  fan: 150,
  belt_fan: 150,
  return_fan: 150,
  plenum: 120,
  final_filter: 120,
  silencer: 125,
  exhaust_damper: 95,
};

// Dimensions in meters matching the official IDAE guide (Págs. 16, 17, 18, 71, 73, 81)
export const AHU_MODULE_DIMENSIONS_METERS: Record<AHUModuleType, number> = {
  intake_damper: 0.35,
  prefilter: 0.40,
  prefilter_flat: 0.15,
  mixing_box: 0.45,
  heat_recovery: 0.60,
  rotary_wheel: 0.60,
  cooling_coil: 0.40,
  heating_coil: 0.40,
  electric_heater: 0.35,
  adiabatic_cooling: 0.45,
  humidifier: 0.35,
  droplet_eliminator: 0.20,
  fan: 0.50,
  belt_fan: 0.50,
  return_fan: 0.50,
  plenum: 0.40,
  final_filter: 0.40,
  silencer: 0.45,
  exhaust_damper: 0.35,
};

// Canonical IDAE Module Header Titles (Figures 1, 2, 11, 16, Pages 73 & 81)
export const getIdaeModuleTitle = (mod: AHUModuleItem): string => {
  switch (mod.type) {
    case 'prefilter':
      return 'Prefiltro';
    case 'prefilter_flat':
      return 'Prefiltro';
    case 'cooling_coil':
      return 'Baterías (−)';
    case 'heating_coil':
      return 'Baterías (+)';
    case 'electric_heater':
      return 'Baterías (+ Eléc.)';
    case 'belt_fan':
      return 'Ventilador';
    case 'fan':
      return 'Ventilador';
    case 'return_fan':
      return 'Vent. Retorno';
    case 'final_filter':
      return 'Filtro';
    case 'plenum':
      return 'Plenum';
    case 'heat_recovery':
      return 'Recuperador';
    case 'rotary_wheel':
      return 'Rotor η';
    case 'adiabatic_cooling':
      return 'Enfriam. adiabático';
    case 'droplet_eliminator':
      return 'Sep. Gotas';
    case 'mixing_box':
      return 'Cám. Mezcla';
    case 'intake_damper':
      return 'Toma ODA';
    case 'exhaust_damper':
      return 'Expulsión EHA';
    case 'silencer':
      return 'Silenciador';
    case 'humidifier':
      return 'Humidificador';
    default:
      return mod.name.split(' ')[0];
  }
};

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
  onNavigateToView,
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

  // Filter out disabled modules for physical layout representation
  const enabledModules = useMemo(() => modules.filter((m) => m.enabled), [modules]);
  const moduleWidths = AHU_MODULE_WIDTHS;
  const moduleDimensionsMeters = AHU_MODULE_DIMENSIONS_METERS;

  // Total AHU length in meters
  const totalLengthMeters = useMemo(() => {
    return Number(
      enabledModules
        .reduce((sum, m) => sum + (moduleDimensionsMeters[m.type] || 0.40), 0)
        .toFixed(2)
    );
  }, [enabledModules, moduleDimensionsMeters]);

  // Calculate dynamic chassis width based on assembled modules (tight engineering fit matching 01.png)
  const dynamicChassisWidth = useMemo(() => {
    if (enabledModules.length === 0) return 400;
    const totalContentWidth = enabledModules.reduce(
      (sum, mod) => sum + (moduleWidths[mod.type] || 120),
      0
    );
    return totalContentWidth + 12; // 6px wall thickness inset on each side
  }, [enabledModules, moduleWidths]);

  // Dynamic SVG ViewBox width (tight fit without dead space)
  const dynamicSvgViewBoxWidth = useMemo(() => {
    return dynamicChassisWidth + 280;
  }, [dynamicChassisWidth]);

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

  // Longitudinal section view mode: 'elevation' (Alzado), 'plan' (Planta), 'dual' (Alzado + Planta - Págs 17/18)
  const [cutViewMode, setCutViewMode] = useState<'elevation' | 'plan' | 'dual'>('elevation');

  // Properties detail mode in section joints: 'full' (all properties %HR, T, w, h, ΔT, ΔHR, Δw, ΔP, Q), 'compact' (T, HR), or 'hover' (floating HUD on hover)
  const [propertiesDetailMode, setPropertiesDetailMode] = useState<'full' | 'compact' | 'hover'>('hover');

  // Dynamic SVG ViewBox height (tight fit for assembly and spaced cotas)
  const dynamicSvgViewBoxHeight = useMemo(() => {
    return cutViewMode === 'dual'
      ? 650
      : propertiesDetailMode === 'full'
      ? 480
      : propertiesDetailMode === 'compact'
      ? 430
      : 395;
  }, [cutViewMode, propertiesDetailMode]);

  // Boundaries for pan: strict clamping so content NEVER moves outside the white background window
  const getPanBounds = useCallback((zoom: number) => {
    const totalWidth = dynamicSvgViewBoxWidth;
    const totalHeight = dynamicSvgViewBoxHeight;

    // When zoom <= 1.05, content fits completely inside the white window and is locked
    // When zoom > 1.05, panning is permitted only up to the sheet boundaries
    const maxPanX = Math.max(0, (totalWidth * (zoom - 1.0)) / 2);
    const maxPanY = Math.max(0, (totalHeight * (zoom - 1.0)) / 2);

    return { maxPanX, maxPanY };
  }, [dynamicSvgViewBoxWidth, dynamicSvgViewBoxHeight]);

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
  const archetypesDropdownRef = useRef<HTMLDivElement>(null);

  // Close archetypes dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        archetypesDropdownRef.current &&
        !archetypesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsArchetypesOpen(false);
      }
    };

    if (isArchetypesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isArchetypesOpen]);

  // IDAE Symbol Guide Modal state
  const [isSymbolGuideOpen, setIsSymbolGuideOpen] = useState<boolean>(false);

  // Anatomía y Ejemplo Didáctico de UTA Modal state
  const [isAhuExampleOpen, setIsAhuExampleOpen] = useState<boolean>(false);

  // Zoom / Pan actions with strict pan clamping
  const handleZoomIn = () => {
    setTransform((prev) => {
      const newZoom = Math.min(3.5, Number((prev.zoom * 1.2).toFixed(2)));
      const { maxPanX, maxPanY } = getPanBounds(newZoom);
      return {
        zoom: newZoom,
        panX: Math.max(-maxPanX, Math.min(maxPanX, prev.panX)),
        panY: Math.max(-maxPanY, Math.min(maxPanY, prev.panY)),
      };
    });
  };

  const handleZoomOut = () => {
    setTransform((prev) => {
      const newZoom = Math.max(0.35, Number((prev.zoom / 1.2).toFixed(2)));
      const { maxPanX, maxPanY } = getPanBounds(newZoom);
      return {
        zoom: newZoom,
        panX: Math.max(-maxPanX, Math.min(maxPanX, prev.panX)),
        panY: Math.max(-maxPanY, Math.min(maxPanY, prev.panY)),
      };
    });
  };

  // Zoom All fits the entire content tightly into the window dimensions
  const handleZoomAll = useCallback(() => {
    if (!ahuContainerRef.current) {
      setTransform({ zoom: 1.0, panX: 0, panY: 0 });
      return;
    }
    const container = ahuContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const totalWidth = dynamicSvgViewBoxWidth;
    const totalHeight = dynamicSvgViewBoxHeight;

    const scaleX = (containerWidth - 32) / totalWidth;
    const scaleY = (containerHeight - 32) / totalHeight;
    const fitScale = Math.min(scaleX, scaleY);
    const optimalZoom = Number(Math.min(2.5, Math.max(0.4, fitScale)).toFixed(2));

    setTransform({
      zoom: optimalZoom,
      panX: 0,
      panY: 0,
    });
  }, [dynamicSvgViewBoxWidth, dynamicSvgViewBoxHeight]);

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

  // Mouse wheel zoom with pan clamping
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setTransform((prev) => {
      const newZoom = Math.min(3.5, Math.max(0.35, Number((prev.zoom * factor).toFixed(2))));
      const { maxPanX, maxPanY } = getPanBounds(newZoom);
      return {
        zoom: newZoom,
        panX: Math.max(-maxPanX, Math.min(maxPanX, prev.panX)),
        panY: Math.max(-maxPanY, Math.min(maxPanY, prev.panY)),
      };
    });
  };

  // Canvas pan handlers with strict clamping preventing content from escaping outside the container
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
    const containerWidth = ahuContainerRef.current?.clientWidth || 1000;
    const svgScale = dynamicSvgViewBoxWidth / containerWidth;
    const factor = svgScale / transform.zoom;

    const { maxPanX, maxPanY } = getPanBounds(transform.zoom);
    const targetPanX = dragStartRef.current.panX + dx * factor;
    const targetPanY = dragStartRef.current.panY + dy * factor;

    // Strict clamping so content NEVER escapes outside container (leaving blank screen)
    const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, targetPanX));
    const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, targetPanY));

    setTransform((prev) => ({
      ...prev,
      panX: clampedPanX,
      panY: clampedPanY,
    }));
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // Touch gesture support: 1-finger pan and 2-finger pinch-to-zoom
  const touchStartRef = useRef<{
    touches: { x: number; y: number }[];
    distance: number;
    initialZoom: number;
    panX: number;
    panY: number;
  }>({
    touches: [],
    distance: 0,
    initialZoom: 1,
    panX: 0,
    panY: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDraggingCanvas(true);
      touchStartRef.current = {
        touches: [{ x: t.clientX, y: t.clientY }],
        distance: 0,
        initialZoom: transform.zoom,
        panX: transform.panX,
        panY: transform.panY,
      };
    } else if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      touchStartRef.current = {
        touches: [
          { x: t0.clientX, y: t0.clientY },
          { x: t1.clientX, y: t1.clientY },
        ],
        distance: dist > 0 ? dist : 1,
        initialZoom: transform.zoom,
        panX: transform.panX,
        panY: transform.panY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingCanvas) {
      const t = e.touches[0];
      const dx = t.clientX - touchStartRef.current.touches[0].x;
      const dy = t.clientY - touchStartRef.current.touches[0].y;
      const containerWidth = ahuContainerRef.current?.clientWidth || 1000;
      const svgScale = dynamicSvgViewBoxWidth / containerWidth;
      const factor = svgScale / transform.zoom;

      const { maxPanX, maxPanY } = getPanBounds(transform.zoom);
      const targetPanX = touchStartRef.current.panX + dx * factor;
      const targetPanY = touchStartRef.current.panY + dy * factor;

      const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, targetPanX));
      const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, targetPanY));

      setTransform((prev) => ({
        ...prev,
        panX: clampedPanX,
        panY: clampedPanY,
      }));
    } else if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const scaleFactor = currentDist / touchStartRef.current.distance;
      const newZoom = Math.min(
        3.5,
        Math.max(0.35, Number((touchStartRef.current.initialZoom * scaleFactor).toFixed(2)))
      );

      const { maxPanX, maxPanY } = getPanBounds(newZoom);
      const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, transform.panX));
      const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, transform.panY));

      setTransform({
        zoom: newZoom,
        panX: clampedPanX,
        panY: clampedPanY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDraggingCanvas(false);
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = {
        touches: [{ x: t.clientX, y: t.clientY }],
        distance: 0,
        initialZoom: transform.zoom,
        panX: transform.panX,
        panY: transform.panY,
      };
    }
  };

  // Identify active module being edited
  const activeEditingModule = useMemo(() => {
    return modules.find((m) => m.id === editingModuleId) || null;
  }, [modules, editingModuleId]);

  // Identify key points from cycle
  const outdoorPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('ext') || n.includes('oa') || n.includes('oda') || n.includes('1');
    }) || points[0] || solveStatePoint({ mode: 'tdb_rh', tdb: 9.0, rh: 36 }, pressure);

  const returnPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('ret') || n.includes('ra') || n.includes('ida') || n.includes('2');
    }) || points[1] || solveStatePoint({ mode: 'tdb_rh', tdb: 24.5, rh: 50 }, pressure);

  const lastPointsSigRef = useRef<string>('');
  const isInternalSyncRef = useRef<boolean>(false);

  // Synchronize AHU module train with global StatePoints and Processes
  const triggerSyncWithModules = (currentModList?: AHUModuleItem[]) => {
    if (!onUpdatePointsAndProcesses) return;
    const targetModules = currentModList || modules;
    const result = computeAHUCycle(targetModules, outdoorPoint, returnPoint, pressure);
    isInternalSyncRef.current = true;
    onUpdatePointsAndProcesses(result.newPoints, result.newProcesses);
    setLastSyncTimestamp(Date.now());
  };

  // Full sequential thermodynamic results along the AHU
  const ahuStepResults = useMemo(() => {
    return computeAHUCycle(modules, outdoorPoint, returnPoint, pressure);
  }, [modules, outdoorPoint, returnPoint, pressure]);

  const ahuSteps = ahuStepResults.steps;
  const supplyPoint = ahuStepResults.supplyPoint;
  const coolingPowerKW = ahuStepResults.coolingPowerKW;
  const heatingPowerKW = ahuStepResults.heatingPowerKW;
  const recoveredPowerKW = ahuStepResults.recoveredPowerKW;
  const condensateLitersPerHour = ahuStepResults.condensateLitersPerHour;
  const totalPressureDropPa = ahuStepResults.totalPressureDrop;

  // Bidirectional sync: when selectedPointId changes from the left sidebar, highlight the corresponding module in the cut
  useEffect(() => {
    if (!selectedPointId) return;
    const matchedStep = ahuStepResults.steps.find(
      (s) =>
        s.associatedPointId === selectedPointId ||
        s.entryPoint.id === selectedPointId ||
        s.exitPoint.id === selectedPointId
    );
    if (matchedStep) {
      setEditingModuleId(matchedStep.module.id);
    }
  }, [selectedPointId, ahuStepResults.steps]);

  // When outdoor (pt-1) or return (pt-2) points change in the sidebar, propagate along the AHU train
  useEffect(() => {
    if (!autoSyncCycle || !onUpdatePointsAndProcesses) return;
    if (isInternalSyncRef.current) {
      isInternalSyncRef.current = false;
      return;
    }
    const currentSig = `${points[0]?.tdb.toFixed(2)}_${points[0]?.w.toFixed(5)}_${points[1]?.tdb.toFixed(2)}_${points[1]?.w.toFixed(5)}`;
    if (lastPointsSigRef.current && lastPointsSigRef.current !== currentSig) {
      lastPointsSigRef.current = currentSig;
      triggerSyncWithModules(modules);
    } else {
      lastPointsSigRef.current = currentSig;
    }
  }, [points, autoSyncCycle]);

  // Auto-fit AHU content to window viewport when view mode or properties detail mode changes
  useEffect(() => {
    if (schematicMode === 'ahu_section') {
      const timer = setTimeout(() => {
        handleZoomAll();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [cutViewMode, propertiesDetailMode, schematicMode, handleZoomAll]);

  // Click handler to select module and point simultaneously
  const handleSelectModuleAndPoint = (modId: string, ptId?: string) => {
    setEditingModuleId(modId);
    if (ptId) {
      onSelectPoint(ptId);
    } else {
      const step = ahuStepResults.steps.find((s) => s.module.id === modId);
      if (step?.associatedPointId) {
        onSelectPoint(step.associatedPointId);
      }
    }
  };

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

    let updatedList: AHUModuleItem[] = [];
    setModules((prev) => {
      const copy = [...prev];
      const targetPos = Math.min(copy.length, Math.max(0, slotIndex));
      copy.splice(targetPos, 0, newMod);
      updatedList = copy;
      return copy;
    });

    // Automatically open parameters card for the newly inserted module!
    setEditingModuleId(newMod.id);

    // Sync to cycle if autoSync is active
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(updatedList), 30);
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
    let updatedList: AHUModuleItem[] = [];
    setModules((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicate);
      updatedList = copy;
      return copy;
    });
    setEditingModuleId(duplicate.id);
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(updatedList), 30);
    }
  };

  const handleMoveModule = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    let updatedList: AHUModuleItem[] = [];
    setModules((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = item;
      updatedList = copy;
      return copy;
    });
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(updatedList), 30);
    }
  };

  const handleRemoveModule = (id: string) => {
    let updatedList: AHUModuleItem[] = [];
    setModules((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      updatedList = filtered;
      return filtered;
    });
    if (editingModuleId === id) {
      const remaining = modules.filter((m) => m.id !== id);
      setEditingModuleId(remaining.length > 0 ? remaining[0].id : null);
    }
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(updatedList), 30);
    }
  };

  const handleToggleModule = (id: string) => {
    let updatedList: AHUModuleItem[] = [];
    setModules((prev) => {
      const toggled = prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
      updatedList = toggled;
      return toggled;
    });
    if (autoSyncCycle) {
      setTimeout(() => triggerSyncWithModules(updatedList), 30);
    }
  };

  const handleUpdateModuleParams = (id: string, newParams: Partial<AHUModuleItem['params']>) => {
    const updated = modules.map((m) =>
      m.id === id ? { ...m, params: { ...m.params, ...newParams } } : m
    );
    setModules(updated);
    if (autoSyncCycle) {
      triggerSyncWithModules(updated);
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

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto space-y-4 font-primary pr-1 scrollbar-thin">
      {/* ---------------- 1. HEADER & MODE SWITCHER BAR ---------------- */}
      <div className="panel-glass p-3 flex flex-wrap items-center justify-between gap-3 relative z-40">
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
          <div className="relative" ref={archetypesDropdownRef}>
            <button
              onClick={() => setIsArchetypesOpen(!isArchetypesOpen)}
              className="btn-secondary text-[12px]"
              title="Cargar configuraciones predefinidas de UTA"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Plantillas UTA</span>
            </button>

            {isArchetypesOpen && (
              <div className="absolute right-0 mt-2 w-92 bg-[#121215] border border-white/20 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl p-2 z-[100] space-y-1">
                <div className="px-3 py-2 text-[11px] font-bold text-[#fbbf24] font-mono uppercase tracking-wider border-b border-white/10 flex justify-between items-center bg-black/40 rounded-t-lg">
                  <span className="flex items-center gap-1.5">
                    <LayoutTemplate className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>Arquetipos de UTA (Guía IDAE / ATECYR)</span>
                  </span>
                  <button
                    onClick={() => setIsArchetypesOpen(false)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {AHU_ARCHETYPES.map((arch) => (
                    <button
                      key={arch.id}
                      onClick={() => handleLoadArchetype(arch.id)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-white/10 border border-transparent hover:border-[#fbbf24]/40 transition-all group flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-[#fbbf24] transition-colors">
                          {arch.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#fbbf24] transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </div>
                      <span className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                        {arch.description}
                      </span>
                    </button>
                  ))}
                </div>
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

          {/* Anatomía y Esquema Ejemplo UTA button */}
          <button
            onClick={() => setIsAhuExampleOpen(true)}
            className="btn-secondary text-[12px] !border-[#38bdf8]/40 !text-[#38bdf8] hover:!border-[#38bdf8] hover:!bg-[#38bdf8]/10"
            title="Conoce los componentes y la estructura principal de una UTA (Infografía didáctica)"
          >
            <Info className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Anatomía UTA</span>
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
        <div className="panel-glass p-3 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-[#fbbf24]" />
              <span>Paleta de Módulos (Arrastra a la UTA o pulsa '+' para añadir):</span>
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsAhuExampleOpen(true)}
                className="text-[11px] font-mono text-[#38bdf8] hover:text-[#7dd3fc] flex items-center gap-1.5 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 px-2.5 py-1 rounded border border-[#38bdf8]/30 transition-all cursor-pointer shadow-sm"
                title="Ver infografía con los componentes principales que componen una UTA"
              >
                <Info className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>¿Cómo se compone una UTA? (Ejemplo)</span>
              </button>
              <button
                onClick={() => handleLoadArchetype('empty_canvas')}
                className="text-[11px] font-mono text-[#fca5a5] hover:text-[#ef4444] flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                title="Vaciar la UTA para montar desde cero"
              >
                <Trash2 className="w-3 h-3" />
                <span>Vaciar UTA</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin touch-pan-x">
            {MODULE_CATALOG.map((cat) => (
              <div
                key={cat.type}
                draggable={true}
                onDragStart={(e) => handlePaletteDragStart(e, cat.type)}
                onClick={() => insertModuleAt(cat.type, enabledModules.length)}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#1a1a1c] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] hover:border-[#fbbf24] cursor-pointer active:scale-95 touch-manipulation transition-all shadow-[0_4px_6px_rgba(0,0,0,0.3)] group select-none relative hover:scale-[1.02]"
                title={`${cat.title}: ${cat.description}\n(Toca para añadir o arrastra a la posición deseada en el corte)`}
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

            {/* Projection Mode Switcher (Alzado / Planta / Dual IDAE Pág. 17-18) */}
            {schematicMode === 'ahu_section' && (
              <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
                <span className="text-[10px] font-mono text-slate-400 uppercase mr-1 hidden sm:inline">Proyección:</span>
                <button
                  onClick={() => setCutViewMode('elevation')}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                    cutViewMode === 'elevation'
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Corte longitudinal en alzado (Figuras 1 y 2 de la Guía IDAE)"
                >
                  Alzado
                </button>
                <button
                  onClick={() => setCutViewMode('plan')}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                    cutViewMode === 'plan'
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Vista en planta de la UTA (Páginas 17 y 18 de la Guía IDAE)"
                >
                  Planta
                </button>
                <button
                  onClick={() => setCutViewMode('dual')}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                    cutViewMode === 'dual'
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Vista simultánea Alzado + Planta (Páginas 17 y 18 de la Guía IDAE)"
                >
                  Dual (Alzado+Planta)
                </button>
              </div>
            )}

            {/* Properties Detail Mode Segmented Selector */}
            <div className="flex items-center bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-xs">
              <div className="flex items-center gap-1 px-2 py-0.5 text-slate-400 font-mono text-[11px] font-semibold border-r border-slate-800 mr-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Puntos:</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setPropertiesDetailMode('full')}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    propertiesDetailMode === 'full'
                      ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Ficha técnica detallada con todas las modificaciones en cada cambio de sección (%HR, T, w, h, ΔT, ΔHR, ΔP, Q)"
                >
                  Detalle
                </button>
                <button
                  onClick={() => setPropertiesDetailMode('compact')}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    propertiesDetailMode === 'compact'
                      ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Píldoras compactas con T y %HR en cada junta intermedia"
                >
                  Píldoras
                </button>
                <button
                  onClick={() => setPropertiesDetailMode('hover')}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    propertiesDetailMode === 'hover'
                      ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Pines numerados discretos y HUD flotante al pasar el cursor"
                >
                  Flotante
                </button>
              </div>
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
                title="Ajustar Todo al Contenido de la Ventana"
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onDoubleClick={handleZoomAll}
            style={{ touchAction: 'none' }}
            className={`w-full relative overflow-hidden rounded-xl touch-none ${
              isWhiteTheme ? 'bg-slate-100/90 border-slate-300' : 'bg-slate-950/70 border-slate-800/80'
            } border transition-all flex items-center justify-center select-none ${
              cutViewMode === 'dual'
                ? 'min-h-[620px] h-[670px]'
                : propertiesDetailMode === 'full'
                ? 'min-h-[480px] h-[520px]'
                : propertiesDetailMode === 'compact'
                ? 'min-h-[420px] h-[460px]'
                : 'min-h-[390px] h-[420px]'
            } ${
              isOverAhu ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-2xl shadow-cyan-500/20' : ''
            } ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {/* Visual Drag & Drop Active Banner */}
            {isOverAhu && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-cyan-950/95 text-cyan-300 border border-cyan-400 px-5 py-2 rounded-full text-xs font-mono font-bold shadow-2xl pointer-events-none flex items-center gap-2 animate-pulse">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>
                  Soltar para insertar o reordenar en la posición #{hoveredSlotIndex !== null ? hoveredSlotIndex + 1 : 'final'}
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
                    Arrastra módulos desde la paleta superior para comenzar a armar el tren de tratamiento o carga una plantilla predefinida de la Guía IDAE.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 justify-center">
                  <button
                    onClick={() => handleLoadArchetype('idae_fig2_superior')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10b981] text-slate-950 hover:bg-[#059669] transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Fig. 2 Superior (Sin Baterías - 1,3 m)</span>
                  </button>
                  <button
                    onClick={() => handleLoadArchetype('idae_fig2_inferior')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#38bdf8] text-slate-950 hover:bg-[#0284c7] transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Fig. 2 Inferior (Con Baterías - 2,1 m)</span>
                  </button>
                  <button
                    onClick={() => handleLoadArchetype('idae_fig1_belt_fan')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
                  >
                    <span>UTA Fig. 1 Correas</span>
                  </button>
                </div>
              </div>
            )}

            <AhuLongitudinalSvg
              dynamicSvgViewBoxWidth={dynamicSvgViewBoxWidth}
              dynamicChassisWidth={dynamicChassisWidth}
              cutViewMode={cutViewMode}
              transform={transform}
              isWhiteTheme={isWhiteTheme}
              isOverAhu={isOverAhu}
              hoveredSlotIndex={hoveredSlotIndex}
              enabledModules={enabledModules}
              moduleWidths={moduleWidths}
              moduleDimensionsMeters={moduleDimensionsMeters}
              totalLengthMeters={totalLengthMeters}
              editingModuleId={editingModuleId}
              ahuSteps={ahuSteps}
              selectedPointId={selectedPointId}
              outdoorPoint={outdoorPoint}
              supplyPoint={supplyPoint}
              isFlowActive={isFlowActive}
              onSelectPoint={onSelectPoint}
              onSelectModuleAndPoint={handleSelectModuleAndPoint}
              onMoveModule={handleMoveModule}
              onRemoveModule={handleRemoveModule}
              onDragExistingModule={(idx) => {
                setDraggedExistingIndex(idx);
                setIsOverAhu(true);
              }}
              onDragEndExistingModule={() => {
                setIsOverAhu(false);
                setHoveredSlotIndex(null);
              }}
              getIdaeModuleTitle={getIdaeModuleTitle}
              propertiesDetailMode={propertiesDetailMode}
            />

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
          <div className="w-full flex flex-col xl:flex-row gap-4 min-h-[640px] xl:h-[680px]">
            {/* Left Column: Interactive Psychrometric Chart */}
            <div className="flex-1 h-full min-h-[380px] bg-slate-950/80 rounded-xl border border-slate-800 p-2 relative overflow-hidden flex flex-col shadow-xl">
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

            {/* Right Column: Assembled Modular Sections of AHU & Thermodynamic Balance */}
            <div className="flex-1 h-full min-h-[460px] bg-slate-950/90 rounded-xl border border-slate-800 p-3 flex flex-col shadow-xl gap-2.5 overflow-y-auto scrollbar-thin">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <AirVent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-tech flex items-center gap-2">
                      <span>Corte Longitudinal UTA Ensamblada</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                        {enabledModules.length} secciones modulares · {totalLengthMeters.toFixed(2)} m
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                    <button
                      onClick={() => setCutViewMode('elevation')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        cutViewMode === 'elevation'
                          ? 'bg-amber-400 text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Alzado"
                    >
                      Alzado
                    </button>
                    <button
                      onClick={() => setCutViewMode('plan')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        cutViewMode === 'plan'
                          ? 'bg-amber-400 text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Planta"
                    >
                      Planta
                    </button>
                    <button
                      onClick={() => setCutViewMode('dual')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        cutViewMode === 'dual'
                          ? 'bg-amber-400 text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Dual (Alzado + Planta)"
                    >
                      Dual
                    </button>
                  </div>

                  <button
                    onClick={() => setSchematicMode('ahu_section')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/40 transition-colors shadow-sm"
                    title="Abrir vista completa del Corte Longitudinal UTA"
                  >
                    <span>Corte Completo</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Longitudinal Cut Graphic (SVG Canvas) */}
              <div className={`w-full flex-1 min-h-[240px] max-h-[340px] relative overflow-hidden rounded-lg ${
                isWhiteTheme ? 'bg-slate-100/90 border-slate-300' : 'bg-slate-950/70 border-slate-800/80'
              } border flex items-center justify-center p-1`}>
                <AhuLongitudinalSvg
                  dynamicSvgViewBoxWidth={dynamicSvgViewBoxWidth}
                  dynamicChassisWidth={dynamicChassisWidth}
                  cutViewMode={cutViewMode}
                  transform={{ zoom: 1, panX: 0, panY: 0 }}
                  isWhiteTheme={isWhiteTheme}
                  isOverAhu={false}
                  hoveredSlotIndex={null}
                  enabledModules={enabledModules}
                  moduleWidths={moduleWidths}
                  moduleDimensionsMeters={moduleDimensionsMeters}
                  totalLengthMeters={totalLengthMeters}
                  editingModuleId={editingModuleId}
                  ahuSteps={ahuSteps}
                  selectedPointId={selectedPointId}
                  outdoorPoint={outdoorPoint}
                  supplyPoint={supplyPoint}
                  isFlowActive={isFlowActive}
                  onSelectPoint={onSelectPoint}
                  onSelectModuleAndPoint={handleSelectModuleAndPoint}
                  onMoveModule={handleMoveModule}
                  onRemoveModule={handleRemoveModule}
                  getIdaeModuleTitle={getIdaeModuleTitle}
                  isSplit={true}
                  propertiesDetailMode={propertiesDetailMode}
                />
              </div>

              {/* Horizontal Strip of Assembled Modular Sections with Step Points */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>Secciones y Transformaciones en Cascada</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Clic en módulo para editar parámetros</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {ahuSteps.map((step, idx) => {
                    const isSelected = editingModuleId === step.module.id || selectedPointId === step.associatedPointId;
                    return (
                      <div
                        key={`split-step-${step.module.id}-${idx}`}
                        onClick={() => handleSelectModuleAndPoint(step.module.id, step.associatedPointId)}
                        className={`flex-shrink-0 cursor-pointer p-2 rounded-lg border transition-all flex flex-col justify-between w-[130px] ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/40'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                          <span
                            className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${step.associatedPointColor}20`,
                              color: step.associatedPointColor,
                              border: `1px solid ${step.associatedPointColor}40`,
                            }}
                          >
                            {step.isTransformation ? 'Transform.' : 'Paso'}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white truncate font-tech" title={step.module.name}>
                          {getIdaeModuleTitle(step.module)}
                        </div>

                        <div className="text-[10px] font-mono text-cyan-300 mt-1 flex items-center justify-between">
                          <span>{step.exitPoint.tdb.toFixed(1)}°C</span>
                          <span className="text-slate-400">{step.exitPoint.rh.toFixed(0)}% HR</span>
                        </div>

                        {step.isTransformation && (
                          <div className="text-[9px] font-mono text-amber-400 mt-0.5 truncate">
                            {step.processType === 'cooling_dehumid'
                              ? `−${(step.metrics?.qTotal ?? 0).toFixed(1)} kW Frío`
                              : step.processType === 'sensible_heating'
                              ? `+${(step.metrics?.qSensible ?? 0).toFixed(1)} kW Calor`
                              : step.processType === 'heat_recovery'
                              ? `η ${step.module.params.recoveryEfficiency ?? 75}% Recup.`
                              : step.processType === 'mixing'
                              ? `${Math.round((step.module.params.outdoorRatio ?? 0.3) * 100)}% ODA`
                              : `${step.module.pressureDropPa} Pa`}
                          </div>
                        )}
                        {!step.isTransformation && (
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                            ΔP: {step.module.pressureDropPa} Pa
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Thermodynamic Balance Summary */}
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Potencia Frío:</span>
                    <span className="text-xs font-bold text-cyan-400">{coolingPowerKW.toFixed(1)} kW</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Potencia Calor:</span>
                    <span className="text-xs font-bold text-amber-400">{heatingPowerKW.toFixed(1)} kW</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Condensados:</span>
                    <span className="text-xs font-bold text-emerald-400">{condensateLitersPerHour.toFixed(2)} L/h</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Pérdida Carga Total:</span>
                    <span className="text-xs font-bold text-rose-400">{totalPressureDropPa} Pa</span>
                  </div>
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

          {/* Detailed Thermodynamic Changes Generated by this Module */}
          {(() => {
            const step = ahuStepResults.steps.find((s) => s.module.id === activeEditingModule.id);
            if (!step) return null;
            const deltaT = step.exitPoint.tdb - step.entryPoint.tdb;
            const deltaRh = step.exitPoint.rh - step.entryPoint.rh;
            const deltaW = (step.exitPoint.w - step.entryPoint.w) * 1000;
            const deltaH = step.exitPoint.h - step.entryPoint.h;

            return (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono font-bold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Propiedades Termodinámicas que modifica este Módulo:</span>
                  </span>
                  <span className="text-slate-400 font-normal">
                    Entrada: {step.entryPoint.tdb.toFixed(1)}°C, {step.entryPoint.rh.toFixed(0)}% HR → Salida: {step.exitPoint.tdb.toFixed(1)}°C, {step.exitPoint.rh.toFixed(0)}% HR
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Salto Térmico ΔT:</span>
                    <span className={`font-bold text-xs ${deltaT < 0 ? 'text-cyan-400' : deltaT > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {deltaT > 0 ? '+' : ''}{deltaT.toFixed(1)} °C
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Variación ΔHR:</span>
                    <span className={`font-bold text-xs ${deltaRh > 0 ? 'text-cyan-400' : deltaRh < 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {deltaRh > 0 ? '+' : ''}{deltaRh.toFixed(0)} %
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Humedad Δw:</span>
                    <span className={`font-bold text-xs ${Math.abs(deltaW) < 0.05 ? 'text-slate-400' : deltaW < 0 ? 'text-cyan-300' : 'text-emerald-400'}`}>
                      {Math.abs(deltaW) < 0.05 ? '0 (cte)' : `${deltaW > 0 ? '+' : ''}${deltaW.toFixed(2)} g/kg`}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Salto Entálpico Δh:</span>
                    <span className="font-bold text-xs text-amber-300">
                      {deltaH > 0 ? '+' : ''}{deltaH.toFixed(1)} kJ/kg
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Pérdida Carga ΔP:</span>
                    <span className="font-bold text-xs text-rose-300">
                      -{activeEditingModule.pressureDropPa} Pa
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

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
        onSelectModuleType={(modType) => {
          insertModuleAt(modType, enabledModules.length);
        }}
        onOpenAhuExample={() => setIsAhuExampleOpen(true)}
      />

      {/* Anatomía y Componentes Principales de una UTA (Infografía con uta_ejemplo.png) */}
      <AhuExampleGuideModal
        isOpen={isAhuExampleOpen}
        onClose={() => setIsAhuExampleOpen(false)}
        onLoadStandardSetup={() => handleLoadArchetype('arch-idae-complete')}
        onSelectComponent={(modType) => {
          insertModuleAt(modType, enabledModules.length);
        }}
      />
    </div>
  );
};
