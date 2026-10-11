import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  StatePoint,
  ProcessConnection,
  ChartType,
  ChartLayerVisibility,
  UnitSystem,
  PsychroParamKey,
} from '../types/psychrometrics';
import {
  solveStatePoint,
  solveConstrainedStatePoint,
  PARAM_LABELS_ES,
  P_ATM_STANDARD,
  C_PA,
  H_FG,
  getSaturationHumidityRatio,
  getWFromEnthalpy,
  getWFromTdbTwb,
  getWFromTdbRh,
  getSaturationVaporPressure,
  getHumidityRatioFromPv,
  getRelativeHumidity,
  R_DA,
} from '../utils/psychrolib';
import { calculateProcessMetrics } from '../utils/processEngine';
import { PsychrometricChart } from './PsychrometricChart';
import { FloatingLayersWindow } from './FloatingLayersWindow';
import {
  GraduationCap,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Snowflake,
  Droplets,
  Wind,
  Maximize2,
  Minimize2,
  Compass,
  SunMedium,
  ArrowRight,
  Info,
  Check,
  BookOpen,
  Table,
  Eye,
  EyeOff,
  Pin,
  PinOff,
} from 'lucide-react';

export type TeachingLessonType =
  | 'empty'
  | 'point'
  | 'mixing'
  | 'heating'
  | 'cooling'
  | 'humidification'
  | 'cycle';

interface LiveNumericFieldProps {
  value: number;
  unit: string;
  decimals: number;
  step?: number | string;
  min?: number;
  max?: number;
  paramKey: 'tdb' | 'rh' | 'h' | 'w' | 'twb' | 'tdp' | 'v';
  activeModifyingParam: string | null;
  onActiveParam: (param: 'tdb' | 'rh' | 'h' | 'w' | 'twb' | 'tdp' | 'v' | null) => void;
  onCommit: (val: number) => void;
  borderColor?: string;
  focusRingColor?: string;
  textColor?: string;
  widthClass?: string;
}

const LiveNumericField: React.FC<LiveNumericFieldProps> = ({
  value,
  unit,
  decimals,
  step = 0.1,
  min,
  max,
  paramKey,
  activeModifyingParam,
  onActiveParam,
  onCommit,
  borderColor = 'border-white/20',
  focusRingColor = 'focus:ring-amber-400 focus:border-amber-400',
  textColor = 'text-white',
  widthClass = 'w-11 sm:w-12',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [editStr, setEditStr] = useState(value.toFixed(decimals));

  // Sync with value whenever it changes from outside (e.g. slider or selecting another point)
  useEffect(() => {
    if (!isFocused) {
      setEditStr(value.toFixed(decimals));
    }
  }, [value, decimals, isFocused]);

  const commitValue = (raw: string) => {
    const clean = raw.trim().replace(',', '.');
    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && isFinite(parsed)) {
      let clamped = parsed;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onCommit(clamped);
      setEditStr(clamped.toFixed(decimals));
    } else {
      setEditStr(value.toFixed(decimals));
    }
  };

  const isThisModified = activeModifyingParam === paramKey;

  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={isFocused ? editStr : value.toFixed(decimals)}
        onFocus={(e) => {
          setIsFocused(true);
          setEditStr(value.toFixed(decimals));
          onActiveParam(paramKey);
          e.target.select();
        }}
        onBlur={() => {
          setIsFocused(false);
          commitValue(editStr);
          onActiveParam(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitValue(editStr);
            (e.target as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            setIsFocused(false);
            setEditStr(value.toFixed(decimals));
            (e.target as HTMLInputElement).blur();
          }
        }}
        onChange={(e) => {
          const val = e.target.value;
          setEditStr(val);
          const clean = val.trim().replace(',', '.');
          const parsed = parseFloat(clean);
          if (!isNaN(parsed) && isFinite(parsed)) {
            let clamped = parsed;
            if (min !== undefined) clamped = Math.max(min, clamped);
            if (max !== undefined) clamped = Math.min(max, clamped);
            onCommit(clamped);
          }
        }}
        className={`${widthClass} px-1.5 py-0.5 text-right font-mono font-bold text-xs bg-black/70 border ${
          isThisModified ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-950/40 text-amber-200' : borderColor
        } ${focusRingColor} rounded ${textColor} shadow-inner focus:outline-none focus:ring-1 transition-all cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none select-text`}
        title={`Escribe un valor numérico para ${unit} (Enter o salir para confirmar)`}
      />
      <span className="text-[10px] font-mono text-slate-400 shrink-0 font-medium select-none">
        {unit}
      </span>
    </div>
  );
};

interface TeachingWorkspaceProps {
  pressure: number;
  units: UnitSystem;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  onNavigateToView?: (view: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic') => void;
}

export const TeachingWorkspace: React.FC<TeachingWorkspaceProps> = ({
  pressure,
  units,
  chartType,
  onChangeChartType,
  onNavigateToView,
}) => {
  // Current pedagogical lesson / mode - start with 'point' so the teacher immediately sees a fully solved state point with all properties
  const [activeLesson, setActiveLesson] = useState<TeachingLessonType>('point');

  // Progressive pedagogical chart layers - default to 'advanced' (3. Avanzado +Bulbo Húmedo)
  const [pedagogicalLevel, setPedagogicalLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'complete'>('advanced');
  const [isClassroomProjectorMode, setIsClassroomProjectorMode] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  // Diagram labels visibility on canvas (3 estados: 1. Sin etiquetas, 2. Tbs y w [por defecto], 3. Todas)
  const [labelDisplayMode, setLabelDisplayMode] = useState<'none' | 'basic' | 'all'>('basic');
  const handleCycleLabelMode = useCallback(() => {
    setLabelDisplayMode((prev) => {
      if (prev === 'basic') return 'all';
      if (prev === 'all') return 'none';
      return 'basic';
    });
  }, []);
  // Layer toggles/overrides when teacher customized individual layers from floating window
  const [layerOverrides, setLayerOverrides] = useState<Partial<ChartLayerVisibility>>({});

  // Teaching state points and processes - initialized with default point P1 so values are visible immediately
  const [points, setPoints] = useState<StatePoint[]>(() => [
    solveStatePoint(
      { mode: 'tdb_rh', tdb: 25, rh: 50 },
      pressure,
      {
        id: 'teach-pt-1',
        name: 'P1: Estado del Aire',
        color: '#F59E0B',
        volumeFlow: 2000,
      }
    ),
  ]);
  const [processes, setProcesses] = useState<ProcessConnection[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>('teach-pt-1');
  const chartStageRef = useRef<HTMLDivElement>(null);

  // Lesson 1: Single Point state
  const [guidePointTdb, setGuidePointTdb] = useState<number>(25);
  const [guidePointRh, setGuidePointRh] = useState<number>(50);

  // Interactive Panel Collapsed State (Collapsed by default as requested)
  const [isInteractivePanelCollapsed, setIsInteractivePanelCollapsed] = useState<boolean>(true);

  // Diagram Maximized State (Occupying entire application screen)
  const [isDiagramMaximized, setIsDiagramMaximized] = useState<boolean>(false);

  // Floating Layers Window State (Accessible when maximized or normal)
  const [showLayersWindow, setShowLayersWindow] = useState<boolean>(false);

  // Active parameter currently being edited in 1. Punto interactive panel
  const [activeModifyingParam, setActiveModifyingParam] = useState<'tdb' | 'rh' | 'h' | 'w' | 'twb' | 'tdp' | 'v' | null>(null);

  // Global release listener to reset activeModifyingParam when mouse/touch is released anywhere
  React.useEffect(() => {
    if (!activeModifyingParam) return;
    const handleGlobalRelease = () => {
      setActiveModifyingParam(null);
    };
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, [activeModifyingParam]);

  // Listen for Escape key to exit diagram maximized view
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDiagramMaximized) {
        setIsDiagramMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDiagramMaximized]);

  // Lesson 2: Air Mixture interactive parameters
  // Stream A: Outdoor Air (Exterior)
  const [mixA_Tdb, setMixA_Tdb] = useState<number>(34);
  const [mixA_Rh, setMixA_Rh] = useState<number>(40);
  const [mixA_Flow, setMixA_Flow] = useState<number>(1000); // m3/h

  // Stream B: Return Air (Retorno)
  const [mixB_Tdb, setMixB_Tdb] = useState<number>(24);
  const [mixB_Rh, setMixB_Rh] = useState<number>(50);
  const [mixB_Flow, setMixB_Flow] = useState<number>(2333); // m3/h

  // Mixture Ratio (Fraction of Outdoor Air: 0 to 1)
  const [outdoorAirRatio, setOutdoorAirRatio] = useState<number>(0.30); // 30% Outdoor Air

  // Lesson 3: Sensible Heating parameters
  const [heatTdbIn, setHeatTdbIn] = useState<number>(10);
  const [heatRhIn, setHeatRhIn] = useState<number>(80);
  const [heatDeltaT, setHeatDeltaT] = useState<number>(15);

  // Lesson 4: Cooling & Dehumidification parameters
  const [coolTdbIn, setCoolTdbIn] = useState<number>(30);
  const [coolRhIn, setCoolRhIn] = useState<number>(60);
  const [coolAdp, setCoolAdp] = useState<number>(10);
  const [coolBypass, setCoolBypass] = useState<number>(0.15); // BF = 15%

  // Lesson 5: Humidification mode ('adiabatic' vs 'steam')
  const [humidType, setHumidType] = useState<'adiabatic' | 'steam'>('adiabatic');
  const [humidTdbIn, setHumidTdbIn] = useState<number>(28);
  const [humidRhIn, setHumidRhIn] = useState<number>(25);
  const [humidDeltaW, setHumidDeltaW] = useState<number>(4); // g/kg added

  // Compute Layer Visibility based on selected pedagogical level and label visibility toggle
  const layers: ChartLayerVisibility = useMemo(() => {
    const baseLabels = labelDisplayMode !== 'none';
    switch (pedagogicalLevel) {
      case 'beginner':
        // Only axes and saturation curve (cleanest possible canvas for newcomers)
        return {
          rhCurves: false,
          twbLines: false,
          enthalpyLines: false,
          volumeLines: false,
          comfortSummer: false,
          comfortWinter: false,
          comfortEnCat1: false,
          comfortEnCat2: false,
          comfortEnCat3: false,
          comfortEnSeason: 'summer',
          processes: true,
          pointLabels: baseLabels,
          shrProtractor: false,
          grid: true,
        };
      case 'intermediate':
        // Axes + Saturation + RH Curves + Enthalpy lines
        return {
          rhCurves: true,
          twbLines: false,
          enthalpyLines: true,
          volumeLines: false,
          comfortSummer: false,
          comfortWinter: false,
          comfortEnCat1: false,
          comfortEnCat2: false,
          comfortEnCat3: false,
          comfortEnSeason: 'summer',
          processes: true,
          pointLabels: baseLabels,
          shrProtractor: false,
          grid: true,
        };
      case 'advanced':
        // + Wet bulb lines and specific volume (SHR protractor collapsed by default)
        return {
          rhCurves: true,
          twbLines: true,
          enthalpyLines: true,
          volumeLines: true,
          comfortSummer: false,
          comfortWinter: false,
          comfortEnCat1: false,
          comfortEnCat2: false,
          comfortEnCat3: false,
          comfortEnSeason: 'summer',
          processes: true,
          pointLabels: baseLabels,
          shrProtractor: false,
          grid: true,
        };
      case 'complete':
      default:
        // Full engineering diagram (SHR protractor collapsed by default)
        return {
          rhCurves: true,
          twbLines: true,
          enthalpyLines: true,
          volumeLines: true,
          comfortSummer: true,
          comfortWinter: false,
          comfortEnCat1: false,
          comfortEnCat2: true,
          comfortEnCat3: false,
          comfortEnSeason: 'summer',
          processes: true,
          pointLabels: baseLabels,
          shrProtractor: false,
          grid: true,
        };
    }
  }, [pedagogicalLevel, labelDisplayMode]);

  // Combined layers with teacher overrides from floating window
  const effectiveLayers: ChartLayerVisibility = useMemo(() => {
    return {
      ...layers,
      ...layerOverrides,
      pointLabels: layerOverrides.pointLabels !== undefined ? layerOverrides.pointLabels : (labelDisplayMode !== 'none'),
    };
  }, [layers, layerOverrides, labelDisplayMode]);

  const handleToggleLayer = useCallback((layer: keyof ChartLayerVisibility) => {
    if (layer === 'pointLabels') {
      handleCycleLabelMode();
    } else if (layer === 'comfortEnSeason') {
      setLayerOverrides((prev) => ({
        ...prev,
        comfortEnSeason: (prev.comfortEnSeason || 'summer') === 'summer' ? 'winter' : 'summer',
      }));
    } else {
      setLayerOverrides((prev) => {
        const current = prev[layer] !== undefined ? prev[layer] : layers[layer];
        return {
          ...prev,
          [layer]: !current,
        };
      });
    }
  }, [layers, handleCycleLabelMode]);

  // Handler: Set Empty Diagram (Clean Canvas)
  const handleSetEmptyDiagram = useCallback(() => {
    setActiveLesson('empty');
    setPoints([]);
    setProcesses([]);
    setSelectedPointId(null);
  }, []);

  // Handler: Setup Lesson 1 (Point Reading)
  const handleSetupPointLesson = useCallback(() => {
    setActiveLesson('point');
    const pt1 = solveStatePoint(
      { mode: 'tdb_rh', tdb: guidePointTdb, rh: guidePointRh },
      pressure,
      {
        id: 'teach-pt-1',
        name: 'P1: Estado del Aire',
        color: '#F59E0B',
        volumeFlow: 2000,
      }
    );
    setPoints([pt1]);
    setProcesses([]);
    setSelectedPointId('teach-pt-1');
  }, [guidePointTdb, guidePointRh, pressure]);

  // Handler: Setup Lesson 2 (Air Mixture)
  const handleSetupMixingLesson = useCallback(() => {
    setActiveLesson('mixing');

    // 1. Solve Point A (Outdoor Air)
    const ptA = solveStatePoint(
      { mode: 'tdb_rh', tdb: mixA_Tdb, rh: mixA_Rh },
      pressure,
      {
        id: 'mix-pt-a',
        name: 'E: Aire Exterior',
        color: '#38BDF8',
        volumeFlow: mixA_Flow,
      }
    );

    // 2. Solve Point B (Return Air)
    const ptB = solveStatePoint(
      { mode: 'tdb_rh', tdb: mixB_Tdb, rh: mixB_Rh },
      pressure,
      {
        id: 'mix-pt-b',
        name: 'R: Aire Retorno',
        color: '#10B981',
        volumeFlow: mixB_Flow,
      }
    );

    // 3. Thermodynamic Mixture Calculation (M = alpha * A + (1 - alpha) * B)
    const alpha = outdoorAirRatio;
    const mixW = alpha * ptA.w + (1 - alpha) * ptB.w;
    const mixH = alpha * ptA.h + (1 - alpha) * ptB.h;

    // Approximate dry-bulb temperature from energy balance
    const mixTdb = alpha * ptA.tdb + (1 - alpha) * ptB.tdb;

    // Solve Point M (Mixture)
    const ptM = solveStatePoint(
      { mode: 'tdb_w', tdb: mixTdb, w: mixW },
      pressure,
      {
        id: 'mix-pt-m',
        name: `M: Mezcla (${(alpha * 100).toFixed(0)}% Ext)`,
        color: '#F59E0B',
        volumeFlow: mixA_Flow + mixB_Flow,
      }
    );

    // Connect with Mixing Process
    const procAM: ProcessConnection = {
      id: 'teach-proc-mix-1',
      name: 'Aporte Aire Exterior',
      type: 'mixing',
      fromPointId: 'mix-pt-a',
      toPointId: 'mix-pt-m',
      mixingRatio: alpha,
      color: '#38BDF8',
      ...calculateProcessMetrics(ptA, ptM, ptA.massFlow),
    };

    const procBM: ProcessConnection = {
      id: 'teach-proc-mix-2',
      name: 'Aporte Aire Retorno',
      type: 'mixing',
      fromPointId: 'mix-pt-b',
      toPointId: 'mix-pt-m',
      mixingRatio: 1 - alpha,
      color: '#10B981',
      ...calculateProcessMetrics(ptB, ptM, ptB.massFlow),
    };

    setPoints([ptA, ptB, ptM]);
    setProcesses([procAM, procBM]);
    setSelectedPointId('mix-pt-m');
  }, [mixA_Tdb, mixA_Rh, mixA_Flow, mixB_Tdb, mixB_Rh, mixB_Flow, outdoorAirRatio, pressure]);

  // Handler: Setup Lesson 3 (Sensible Heating)
  const handleSetupHeatingLesson = useCallback(() => {
    setActiveLesson('heating');
    const ptIn = solveStatePoint(
      { mode: 'tdb_rh', tdb: heatTdbIn, rh: heatRhIn },
      pressure,
      {
        id: 'heat-in',
        name: '1: Entrada Batería',
        color: '#38BDF8',
        volumeFlow: 2500,
      }
    );

    const ptOut = solveStatePoint(
      { mode: 'tdb_w', tdb: heatTdbIn + heatDeltaT, w: ptIn.w },
      pressure,
      {
        id: 'heat-out',
        name: '2: Salida Caliente',
        color: '#F97316',
        volumeFlow: 2500,
      }
    );

    const proc: ProcessConnection = {
      id: 'teach-proc-heat',
      name: 'Calentamiento Sensible (w = cte)',
      type: 'sensible_heating',
      fromPointId: 'heat-in',
      toPointId: 'heat-out',
      color: '#F97316',
      ...calculateProcessMetrics(ptIn, ptOut, ptIn.massFlow),
    };

    setPoints([ptIn, ptOut]);
    setProcesses([proc]);
    setSelectedPointId('heat-out');
  }, [heatTdbIn, heatRhIn, heatDeltaT, pressure]);

  // Handler: Setup Lesson 4 (Cooling & Dehumidification)
  const handleSetupCoolingLesson = useCallback(() => {
    setActiveLesson('cooling');
    const ptIn = solveStatePoint(
      { mode: 'tdb_rh', tdb: coolTdbIn, rh: coolRhIn },
      pressure,
      {
        id: 'cool-in',
        name: '1: Entrada Batería Fría',
        color: '#F97316',
        volumeFlow: 3000,
      }
    );

    // Apparatus Dew Point (ADP) at saturation (100% RH)
    const adpPoint = solveStatePoint(
      { mode: 'tdb_rh', tdb: coolAdp, rh: 100 },
      pressure,
      {
        id: 'cool-adp',
        name: 'ADP: Temp. Superficie Batería',
        color: '#06B6D4',
        volumeFlow: 3000,
      }
    );

    // Real Leaving Coil Condition via Bypass Factor (BF):
    // T_out = ADP + BF * (T_in - ADP)
    // W_out = W_adp + BF * (W_in - W_adp)
    const tOut = coolAdp + coolBypass * (ptIn.tdb - coolAdp);
    const wOut = adpPoint.w + coolBypass * (ptIn.w - adpPoint.w);

    const ptOut = solveStatePoint(
      { mode: 'tdb_w', tdb: tOut, w: wOut },
      pressure,
      {
        id: 'cool-out',
        name: `2: Salida Batería (BF = ${(coolBypass * 100).toFixed(0)}%)`,
        color: '#0284C7',
        volumeFlow: 3000,
      }
    );

    const proc: ProcessConnection = {
      id: 'teach-proc-cool',
      name: 'Enfriamiento y Deshumectación',
      type: 'cooling_dehumid',
      fromPointId: 'cool-in',
      toPointId: 'cool-out',
      bypassFactor: coolBypass,
      adp: coolAdp,
      color: '#0284C7',
      ...calculateProcessMetrics(ptIn, ptOut, ptIn.massFlow),
    };

    setPoints([ptIn, adpPoint, ptOut]);
    setProcesses([proc]);
    setSelectedPointId('cool-out');
  }, [coolTdbIn, coolRhIn, coolAdp, coolBypass, pressure]);

  // Handler: Setup Lesson 5 (Humidification)
  const handleSetupHumidLesson = useCallback(() => {
    setActiveLesson('humidification');
    const ptIn = solveStatePoint(
      { mode: 'tdb_rh', tdb: humidTdbIn, rh: humidRhIn },
      pressure,
      {
        id: 'humid-in',
        name: '1: Aire Seco Inicial',
        color: '#F59E0B',
        volumeFlow: 2000,
      }
    );

    let ptOut: StatePoint;
    let procName: string;
    let procType: ProcessConnection['type'];

    if (humidType === 'adiabatic') {
      // Adiabatic humidification follows constant enthalpy / wet-bulb line (h = cte)
      // h2 = h1, w2 = w1 + deltaW
      const targetW = ptIn.w + humidDeltaW / 1000;
      // Solve dry bulb temperature at same enthalpy: h = cpa * T + w * (hfg + cpv * T)
      // T = (h - w * hfg) / (cpa + w * 1.86)
      const targetTdb = (ptIn.h - targetW * H_FG) / (C_PA + targetW * 1.86);

      ptOut = solveStatePoint(
        { mode: 'tdb_w', tdb: targetTdb, w: targetW },
        pressure,
        {
          id: 'humid-out',
          name: '2: Salida Lavador (h ≈ cte)',
          color: '#10B981',
          volumeFlow: 2000,
        }
      );
      procName = 'Humidificación Adiabática (Evaporativa)';
      procType = 'adiabatic_humid';
    } else {
      // Steam humidification is almost isothermal (Tdb approx cte, pure water injection)
      const targetW = ptIn.w + humidDeltaW / 1000;
      ptOut = solveStatePoint(
        { mode: 'tdb_w', tdb: ptIn.tdb, w: targetW },
        pressure,
        {
          id: 'humid-out',
          name: '2: Salida Inyección Vapor',
          color: '#8B5CF6',
          volumeFlow: 2000,
        }
      );
      procName = 'Humidificación Isotérmica (Vapor)';
      procType = 'steam_humid';
    }

    const proc: ProcessConnection = {
      id: 'teach-proc-humid',
      name: procName,
      type: procType,
      fromPointId: 'humid-in',
      toPointId: 'humid-out',
      color: humidType === 'adiabatic' ? '#10B981' : '#8B5CF6',
      ...calculateProcessMetrics(ptIn, ptOut, ptIn.massFlow),
    };

    setPoints([ptIn, ptOut]);
    setProcesses([proc]);
    setSelectedPointId('humid-out');
  }, [humidType, humidTdbIn, humidRhIn, humidDeltaW, pressure]);

  // Re-run setup when parameters change for active lesson
  React.useEffect(() => {
    if (activeLesson === 'point') {
      // Point lesson is directly controlled by sliders and state; do NOT re-run setup here to preserve fixedParams
    } else if (activeLesson === 'mixing') {
      handleSetupMixingLesson();
    } else if (activeLesson === 'heating') {
      handleSetupHeatingLesson();
    } else if (activeLesson === 'cooling') {
      handleSetupCoolingLesson();
    } else if (activeLesson === 'humidification') {
      handleSetupHumidLesson();
    }
  }, [activeLesson, mixA_Tdb, mixA_Rh, mixA_Flow, mixB_Tdb, mixB_Rh, mixB_Flow, outdoorAirRatio, heatTdbIn, heatRhIn, heatDeltaT, coolTdbIn, coolRhIn, coolAdp, coolBypass, humidType, humidTdbIn, humidRhIn, humidDeltaW]);

  // Add Point at canvas double click or click
  const handleAddPointAtCoordinates = useCallback(
    (tdb: number, w: number) => {
      const idx = points.length + 1;
      const colors = ['#F59E0B', '#38BDF8', '#10B981', '#EC4899', '#8B5CF6'];
      const newPt = solveStatePoint(
        { mode: 'tdb_w', tdb, w },
        pressure,
        {
          id: `teach-custom-${Date.now()}`,
          name: `P${idx}`,
          color: colors[(idx - 1) % colors.length],
          volumeFlow: 2000,
        }
      );
      setPoints((prev) => [...prev, newPt]);
      setSelectedPointId(newPt.id);
    },
    [points.length, pressure]
  );

  // Dragging point coordinates directly on chart or adjusting with keyboard arrow keys
  const handleUpdatePointCoordinates = useCallback(
    (id: string, tdb: number, w: number) => {
      setPoints((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          if (p.isLocked || (p.fixedParams && p.fixedParams.length >= 2)) {
            return p;
          }
          let targetTdb = tdb;
          let targetW = w;
          const ws = getSaturationHumidityRatio(targetTdb, pressure);

          if (p.fixedParams?.includes('w')) {
            targetW = p.fixedValues?.w ?? p.w;
          } else if (p.fixedParams?.includes('tdb')) {
            targetTdb = p.fixedValues?.tdb ?? p.tdb;
          } else if (p.fixedParams?.includes('rh')) {
            const fixedRh = p.fixedValues?.rh ?? p.rh;
            targetW = getWFromTdbRh(targetTdb, fixedRh, pressure);
          } else if (p.fixedParams?.includes('h')) {
            const fixedH = p.fixedValues?.h ?? p.h;
            targetW = getWFromEnthalpy(targetTdb, fixedH);
          } else if (p.fixedParams?.includes('twb')) {
            const fixedTwb = p.fixedValues?.twb ?? p.twb;
            targetW = getWFromTdbTwb(targetTdb, Math.min(targetTdb, fixedTwb), pressure);
          }

          targetW = Math.max(0.0001, Math.min(ws, targetW));
          const updated = solveStatePoint({ mode: 'tdb_w', tdb: targetTdb, w: targetW }, pressure, p);
          if (id === 'teach-pt-1') {
            setGuidePointTdb(updated.tdb);
            setGuidePointRh(updated.rh);
          }
          return updated;
        })
      );
    },
    [pressure]
  );

  // Delete point from teaching canvas
  const handleDeletePoint = useCallback((id: string) => {
    if (points.length <= 1) return;
    setPoints((prev) => prev.filter((p) => p.id !== id));
    setProcesses((prev) =>
      prev.filter((pr) => pr.fromPointId !== id && pr.toPointId !== id)
    );
    if (selectedPointId === id) {
      const remaining = points.filter((p) => p.id !== id);
      setSelectedPointId(remaining[0]?.id || null);
    }
  }, [points, selectedPointId]);

  // Toggle point visibility on chart canvas
  const handleToggleHidePoint = useCallback((id: string) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p))
    );
  }, []);

  // Selected state point details for didactic inspection
  const activeSelectedPoint = useMemo(() => {
    return points.find((p) => p.id === selectedPointId) || points[0] || null;
  }, [points, selectedPointId]);

  // Toggle fixing/pinning a psychrometric parameter (e.g. w, tdb, rh, h, twb, tdp, v)
  const handleToggleFixParam = useCallback(
    (paramKey: PsychroParamKey) => {
      if (!activeSelectedPoint) return;
      setPoints((prev) =>
        prev.map((p) => {
          if (p.id !== activeSelectedPoint.id) return p;
          const currentFixed = p.fixedParams || [];
          const isAlreadyFixed = currentFixed.includes(paramKey);
          let nextFixed: PsychroParamKey[];
          const nextValues = { ...(p.fixedValues || {}) };

          if (isAlreadyFixed) {
            nextFixed = currentFixed.filter((k) => k !== paramKey);
            delete nextValues[paramKey];
          } else {
            // Can fix up to 2 parameters (the 2 independent degrees of freedom of moist air)
            if (currentFixed.length >= 2) {
              const oldest = currentFixed[0];
              delete nextValues[oldest];
              nextFixed = [currentFixed[1], paramKey];
            } else {
              nextFixed = [...currentFixed, paramKey];
            }
            nextValues[paramKey] = paramKey === 'w' ? p.w : (p as any)[paramKey];
          }

          return {
            ...p,
            fixedParams: nextFixed,
            fixedValues: nextValues,
            isLocked: nextFixed.length >= 2,
          };
        })
      );
    },
    [activeSelectedPoint]
  );

  // Clear all fixed parameters on the active point
  const handleClearFixedParams = useCallback(() => {
    if (!activeSelectedPoint) return;
    setPoints((prev) =>
      prev.map((p) => {
        if (p.id !== activeSelectedPoint.id) return p;
        return {
          ...p,
          fixedParams: [],
          fixedValues: {},
          isLocked: false,
        };
      })
    );
  }, [activeSelectedPoint]);

  // Master handler for psychrometric parameter changes respecting any fixed parameter constraints
  const handleParamChange = useCallback(
    (paramKey: PsychroParamKey, newVal: number) => {
      if (!activeSelectedPoint) return;
      const updated = solveConstrainedStatePoint(activeSelectedPoint, paramKey, newVal, pressure);
      setPoints((prev) =>
        prev.map((p) => (p.id === activeSelectedPoint.id ? updated : p))
      );
      if (activeSelectedPoint.id === 'teach-pt-1') {
        setGuidePointTdb(updated.tdb);
        setGuidePointRh(updated.rh);
      }
    },
    [activeSelectedPoint, pressure]
  );

  // Dedicated handlers for each of the 7 sliders and numeric fields
  const handleSliderChangeTdb = useCallback(
    (newTdb: number) => handleParamChange('tdb', newTdb),
    [handleParamChange]
  );

  const handleSliderChangeRh = useCallback(
    (newRh: number) => handleParamChange('rh', newRh),
    [handleParamChange]
  );

  const handleSliderChangeEnthalpy = useCallback(
    (newH: number) => handleParamChange('h', newH),
    [handleParamChange]
  );

  const handleSliderChangeHumidity = useCallback(
    (newW_g: number) => handleParamChange('w', newW_g / 1000),
    [handleParamChange]
  );

  const handleSliderChangeTwb = useCallback(
    (newTwb: number) => handleParamChange('twb', newTwb),
    [handleParamChange]
  );

  const handleSliderChangeTdp = useCallback(
    (newTdp: number) => handleParamChange('tdp', newTdp),
    [handleParamChange]
  );

  const handleSliderChangeVolume = useCallback(
    (newV: number) => handleParamChange('v', newV),
    [handleParamChange]
  );

  // Mixture info for SVG visual lever rule
  const teachingMixtureInfo = useMemo(() => {
    if (activeLesson !== 'mixing') return null;
    const ptA = points.find((p) => p.id === 'mix-pt-a');
    const ptB = points.find((p) => p.id === 'mix-pt-b');
    const ptM = points.find((p) => p.id === 'mix-pt-m');
    if (!ptA || !ptB || !ptM) return null;
    return {
      point1: ptA,
      point2: ptB,
      mixturePoint: ptM,
      ratio: outdoorAirRatio,
    };
  }, [activeLesson, points, outdoorAirRatio]);

  // Questions bank for class engagement
  const CLASSROOM_QUESTIONS = [
    {
      question: '¿Por qué la recta de mezcla entre dos corrientes de aire es estrictamente una línea recta en la carta psicrométrica?',
      answer: 'Porque las ecuaciones de conservación de la masa de aire seco, de vapor de agua y de conservación de la energía (entalpía) son lineales respecto a la fracción de caudal másico alpha: w_M = alpha·w_1 + (1-alpha)·w_2 y h_M = alpha·h_1 + (1-alpha)·h_2.',
    },
    {
      question: '¿Qué significa físicamente la "Regla de la Palanca Inversa" en una mezcla de aire?',
      answer: 'Significa que la distancia en el diagrama desde el punto de mezcla M hasta el punto 1 es inversamente proporcional al caudal de la corriente 1. Si el caudal de retorno es mucho mayor (ej. 70%), el punto de mezcla M estará mucho más próximo (70% más cerca) del punto de retorno.',
    },
    {
      question: '¿Por qué al calentar el aire con una batería caliente la humedad relativa disminuye drásticamente si no se le ha extraído nada de agua?',
      answer: 'Porque la humedad relativa es el cociente entre la presión de vapor real (que no cambia, w = cte) y la presión de saturación. Al aumentar la temperatura, la presión de vapor saturante del aire crece exponencialmente, haciendo que el denominador se dispare y la humedad relativa baje.',
    },
    {
      question: '¿En qué situación una mezcla adiabática de dos corrientes de aire no saturadas (HR < 100%) puede llegar a condensar o producir niebla?',
      answer: 'Cuando se mezclan dos corrientes con gran diferencia de temperatura y altas humedades relativas (ejemplo: aire exterior muy frío y húmedo con aire de retorno caliente y húmedo). Al ser la curva de saturación convexa hacia arriba, la cuerda recta que une ambos puntos puede cortar la curva de saturación entrando en la zona de sobresaturación.',
    },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c] text-slate-100 overflow-hidden font-primary select-none">
      {/* 1. Header Toolbar for Professor */}
      <div className="h-14 bg-[#141416] border-b border-white/10 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2">
        {/* Left: Mode Title & Lesson Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                <span>Aula Psicrométrica</span>
                <span className="text-[10px] text-amber-400 font-mono font-semibold">DOCENCIA</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">Pizarra interactiva</div>
            </div>
          </div>

          {/* Lesson Selector Buttons (Anti-slop segmented style) */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 shrink-0">
            {/* 0. Pizarra Vacía */}
            <button
              onClick={handleSetEmptyDiagram}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLesson === 'empty'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Iniciar con diagrama 100% limpio y vacío"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Diagrama Vacío</span>
            </button>

            {/* 1. Punto de Estado */}
            <button
              onClick={handleSetupPointLesson}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLesson === 'point'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Explicar las 7 coordenadas psicrométricas de un punto"
            >
              <Info className="w-3.5 h-3.5" />
              <span>1. Punto de Estado</span>
            </button>

            {/* 2. Mezcla de Aire (The user's explicit request!) */}
            <button
              onClick={handleSetupMixingLesson}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLesson === 'mixing'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Explicar mezcla adiabática de dos caudales y regla de la palanca"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>2. Mezcla de Aire</span>
            </button>

            {/* 3. Calentamiento */}
            <button
              onClick={handleSetupHeatingLesson}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLesson === 'heating'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Explicar calentamiento sensible con humedad específica constante"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>3. Calentamiento</span>
            </button>

            {/* 4. Enfriamiento y ADP */}
            <button
              onClick={handleSetupCoolingLesson}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLesson === 'cooling'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Explicar batería fría, ADP y factor de bypass"
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>4. Batería Fría</span>
            </button>

            {/* 5. Humidificación */}
            <button
              onClick={handleSetupHumidLesson}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLesson === 'humidification'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Explicar humidificación adiabática vs con vapor"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>5. Humidificación</span>
            </button>
          </div>
        </div>

        {/* Right: Blackboard tools & View settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Chart Type switcher: Carrier vs Mollier */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => onChangeChartType('carrier')}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${
                chartType === 'carrier'
                  ? 'bg-[#0284c7] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ver en Diagrama Carrier (Tbs horizontal, w vertical)"
            >
              Carrier
            </button>
            <button
              onClick={() => onChangeChartType('mollier')}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${
                chartType === 'mollier'
                  ? 'bg-[#4f46e5] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ver en Diagrama Mollier h-x (x horizontal, T oblicuo)"
            >
              Mollier h-x
            </button>
          </div>

          {/* Pedagogical level dropdown */}
          <div className="hidden lg:flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10 text-xs">
            <span className="text-slate-400 text-[11px]">Nivel:</span>
            <select
              value={pedagogicalLevel}
              onChange={(e) => setPedagogicalLevel(e.target.value as any)}
              className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer text-xs"
              title="Graduar la complejidad de las líneas de la carta para los alumnos"
            >
              <option value="beginner" className="bg-[#141416] text-white">1. Iniciación (Solo Ejes)</option>
              <option value="intermediate" className="bg-[#141416] text-white">2. Intermedio (+HR y Entalpía)</option>
              <option value="advanced" className="bg-[#141416] text-white">3. Avanzado (+Bulbo Húmedo)</option>
              <option value="complete" className="bg-[#141416] text-white">4. Completo (Profesional)</option>
            </select>
          </div>

          {/* Botón Mostrar Etiquetas (3 Estados: 1. Sin etiquetas, 2. Tbs y w [por defecto], 3. Todas) */}
          <button
            onClick={handleCycleLabelMode}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              labelDisplayMode === 'basic'
                ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] font-extrabold'
                : labelDisplayMode === 'all'
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] font-extrabold'
                : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-amber-400/40'
            }`}
            title={
              labelDisplayMode === 'basic'
                ? 'Estado 2: Mostrando etiquetas de Tbs y humedad específica (Por defecto) · Clic para mostrar todas las etiquetas'
                : labelDisplayMode === 'all'
                ? 'Estado 3: Mostrando todas las etiquetas de propiedades · Clic para ocultar etiquetas'
                : 'Estado 1: Etiquetas ocultadas · Clic para mostrar etiquetas de Tbs y w'
            }
          >
            {labelDisplayMode === 'none' ? (
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-black" />
            )}
            <span className="hidden sm:inline">
              {labelDisplayMode === 'basic' && 'Etiquetas: Tbs y w'}
              {labelDisplayMode === 'all' && 'Etiquetas: Todas'}
              {labelDisplayMode === 'none' && 'Ocultar Etiquetas'}
            </span>
          </button>

          {/* Toggle Floating Layers Window (Ventana de Capas del Diagrama) */}
          <button
            onClick={() => setShowLayersWindow((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showLayersWindow
                ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] font-extrabold'
                : 'bg-black/30 border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40'
            }`}
            title="Abrir ventana flotante de capas del diagrama (Líneas, Escalas, Confort)"
          >
            <Layers className={`w-3.5 h-3.5 ${showLayersWindow ? 'text-black' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">Capas</span>
          </button>

          {/* Toggle Interactive Class Panel (Solapsable / Colapsable) */}
          <button
            onClick={() => setIsInteractivePanelCollapsed((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              !isInteractivePanelCollapsed
                ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] font-extrabold'
                : 'bg-black/30 border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40'
            }`}
            title={!isInteractivePanelCollapsed ? 'Colapsar Panel Interactivo de Clase' : 'Desplegar Panel Interactivo de Clase'}
          >
            {isInteractivePanelCollapsed ? (
              <PanelRightOpen className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <PanelRightClose className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Panel Interactivo</span>
            <span className="text-[10px] font-mono opacity-80">
              {isInteractivePanelCollapsed ? '(Colapsado)' : ''}
            </span>
          </button>

          {/* Maximize / Contract Diagram to Full Screen (Ocupar toda la pantalla de la aplicación) */}
          <button
            onClick={() => setIsDiagramMaximized((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isDiagramMaximized
                ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.4)] font-extrabold'
                : 'bg-black/30 border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40'
            }`}
            title={isDiagramMaximized ? 'Contraer diagrama (Restaurar tamaño estándar)' : 'Maximizar diagrama (Ocupar toda la pantalla de la aplicación)'}
          >
            {isDiagramMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{isDiagramMaximized ? 'Contraer Diagrama' : 'Maximizar Diagrama'}</span>
          </button>

          {/* Classroom Projector Mode */}
          <button
            onClick={() => setIsClassroomProjectorMode((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isClassroomProjectorMode
                ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] font-extrabold'
                : 'bg-black/30 border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40'
            }`}
            title={
              isClassroomProjectorMode
                ? 'Modo Proyector de Aula (Fondo blanco de alto contraste activo). Clic para volver a pizarra oscura'
                : 'Activar Modo Proyector PDI (Fondo blanco nítido y alto contraste para aulas con luz ambiental)'
            }
          >
            <SunMedium className="w-3.5 h-3.5 text-current" />
            <span className="hidden sm:inline">
              {isClassroomProjectorMode ? 'Proyector Claro' : 'Modo Proyector'}
            </span>
          </button>

          {/* Clear blackboard button */}
          <button
            onClick={handleSetEmptyDiagram}
            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
            title="Limpiar toda la pizarra psicrométrica"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Stage: Left/Center Chart + Right Didactic Panel */}
      <div
        className={`${
          isDiagramMaximized
            ? 'fixed inset-0 z-50 w-screen h-screen'
            : 'flex-1 relative'
        } flex overflow-hidden bg-[#0a0a0c] transition-all`}
      >
        {/* Center: The Psychrometric Chart Canvas (Expands to fill available viewport space) */}
        <div
          ref={chartStageRef}
          className="flex-1 h-full relative overflow-hidden flex flex-col bg-[#0a0a0c] transition-all"
        >
          {/* Floating Exit Maximize Button when diagram is maximized */}
          {isDiagramMaximized && (
            <button
              type="button"
              onClick={() => setIsDiagramMaximized(false)}
              className="absolute top-3 right-4 z-40 bg-black/85 hover:bg-amber-400 hover:text-black text-amber-300 px-3.5 py-1.5 rounded-lg border border-amber-400/50 shadow-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer select-none"
              title="Contraer diagrama a vista normal (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Contraer Diagrama</span>
            </button>
          )}

          {/* Floating Layers Window (Accessible when maximized or normal) */}
          {showLayersWindow && (
            <FloatingLayersWindow
              layers={effectiveLayers}
              onToggleLayer={handleToggleLayer}
              onClose={() => setShowLayersWindow(false)}
              containerRef={chartStageRef}
              defaultPosition={{ x: 24, y: 70 }}
            />
          )}

          {/* Indicador de modo de trabajo sobre el diagrama (Posicionado en la parte inferior izquierda) */}
          <div className="absolute bottom-9 left-4 z-20 pointer-events-none bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs flex items-center gap-2 max-w-lg shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-300 font-medium">
              {activeLesson === 'empty' && 'Pizarra limpia: Haz doble clic en la carta para colocar puntos o arrástralos libremente.'}
              {activeLesson === 'point' && 'Modo Punto: Observa todas las propiedades proyectadas (Tbs, HR, h, w, Tbh, Tpr, v) en tiempo real.'}
              {activeLesson === 'mixing' && 'Modo Mezcla: Arrastra el deslizador de % de Aire Exterior para ver la Regla de la Palanca y propiedades.'}
              {activeLesson === 'heating' && 'Modo Calentamiento: Trayectoria horizontal (w = cte). Observa el salto térmico y aumento de entalpía.'}
              {activeLesson === 'cooling' && 'Modo Batería Fría: Enfriamiento y deshumectación hacia el ADP con factor de bypass.'}
              {activeLesson === 'humidification' && `Modo Humidificación: ${humidType === 'adiabatic' ? 'Lavador adiabático a lo largo de h = cte' : 'Inyección de vapor isotérmica Tbs = cte'}.`}
            </span>
          </div>

          <PsychrometricChart
            points={points}
            processes={processes}
            selectedPointId={selectedPointId}
            onSelectPoint={setSelectedPointId}
            onUpdatePointCoordinates={handleUpdatePointCoordinates}
            onAddPointAtCoordinates={handleAddPointAtCoordinates}
            onDeletePoint={handleDeletePoint}
            onToggleHidePoint={handleToggleHidePoint}
            onToggleLayer={handleToggleLayer}
            pressure={pressure}
            chartType={chartType}
            units={units}
            layers={effectiveLayers}
            labelDisplayMode={labelDisplayMode}
            onChangeLabelDisplayMode={setLabelDisplayMode}
            teachingMode={true}
            teachingGuidePointId={selectedPointId}
            teachingGuideParam={activeModifyingParam}
            teachingMixtureInfo={teachingMixtureInfo}
            projectorHighContrast={isClassroomProjectorMode}
            showWhiteboardByDefault={true}
          />

          {/* Floating Expand Tab for Collapsible Interactive Panel (When collapsed) */}
          {isInteractivePanelCollapsed && (
            <button
              type="button"
              onClick={() => setIsInteractivePanelCollapsed(false)}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-20 bg-[#141416]/95 hover:bg-amber-400 hover:text-black text-amber-400 py-3.5 px-2 rounded-l-xl border-y border-l border-amber-400/50 shadow-[-4px_0_16px_rgba(0,0,0,0.6)] flex flex-col items-center gap-2 cursor-pointer transition-all group select-none"
              title="Desplegar Panel Interactivo de Clase"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <Sliders className="w-3.5 h-3.5" />
              <span
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                className="text-[9.5px] font-bold font-mono uppercase tracking-wider"
              >
                Panel Interactivo
              </span>
            </button>
          )}
        </div>

        {/* Right: Interactive Didactic Lesson Drawer (Integrated on the right side in both normal and maximized views) */}
        <div
          className={`${
            isInteractivePanelCollapsed
              ? 'w-0 overflow-hidden border-l-0 opacity-0 pointer-events-none p-0'
              : 'w-96 max-w-[92vw] border-l border-white/10 opacity-100'
          } h-full bg-[#141416] flex flex-col shrink-0 overflow-y-auto transition-all duration-300 relative z-30`}
        >
          {/* Section 1: Lesson Header & Interactive Sliders */}
          <div className="p-4 border-b border-white/10 bg-black/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Panel Interactivo de Clase</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">P = {pressure.toFixed(1)} kPa</span>
                <button
                  type="button"
                  onClick={() => setIsInteractivePanelCollapsed(true)}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-amber-400 hover:text-black text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title="Colapsar Panel Interactivo"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Colapsar</span>
                </button>
              </div>
            </div>

            {/* LESSON: EMPTY DIAGRAM */}
            {activeLesson === 'empty' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Estás en un <span className="text-amber-400 font-semibold">diagrama completamente vacío</span>.
                  Ideal para explicar la cuadrícula desde cero sin puntos que distraigan a los estudiantes.
                </p>
                <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                  <div className="font-semibold text-white">¿Cómo empezar la clase?</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>Haz doble clic en cualquier punto del diagrama para fijar un punto de estado.</li>
                    <li>Selecciona el punto para ver sus líneas guía hacia los ejes.</li>
                    <li>O haz clic en los botones superiores para cargar una lección estructurada.</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddPointAtCoordinates(24, 0.0098)}
                    className="flex-1 py-2 rounded-lg bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Punto Ejemplo (24°C, 50%)</span>
                  </button>
                </div>
              </div>
            )}

            {/* LESSON: POINT READING */}
            {activeLesson === 'point' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Ajusta cualquiera de los parámetros con su deslizador para ver cómo se proyectan las <span className="text-amber-400 font-semibold">7 propiedades psicrométricas</span> en tiempo real en la carta.
                </p>

                {/* Prominent Live Thermodynamic Values Card with interactive sliders directly under each parameter window */}
                {activeSelectedPoint && (
                  <div className="bg-black/60 border border-amber-400/40 rounded-xl p-3 space-y-3 shadow-lg">
                    <div className="text-[11px] font-bold text-amber-300 font-mono flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Valores Psicrométricos en Vivo</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Sliders & Entrada Numérica</span>
                    </div>

                    {(() => {
                      const isModifyingAny = activeModifyingParam !== null;
                      const activeFixed = activeSelectedPoint.fixedParams || [];
                      const isFixed = (param: PsychroParamKey) => activeFixed.includes(param);

                      const getCardClasses = (param: PsychroParamKey, baseBorder: string, colSpan = '') => {
                        const isThisModified = activeModifyingParam === param;
                        const isThisFixed = isFixed(param);
                        const isOtherShaded = isModifyingAny && !isThisModified;

                        if (isThisModified) {
                          return `${colSpan} p-2 rounded-lg border-2 border-amber-400 bg-amber-500/20 shadow-[0_0_18px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/60 scale-[1.02] z-10 transition-all duration-200 flex flex-col justify-between`;
                        }
                        if (isThisFixed) {
                          return `${colSpan} p-2 rounded-lg border-2 border-amber-400/90 bg-amber-400/10 shadow-[0_0_14px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/50 transition-all duration-200 flex flex-col justify-between`;
                        }
                        if (isOtherShaded) {
                          return `${colSpan} p-2 rounded-lg border border-white/5 bg-black/70 opacity-30 grayscale-[70%] brightness-75 shadow-none transition-all duration-200 flex flex-col justify-between`;
                        }
                        return `${colSpan} p-2 rounded-lg bg-white/5 border ${baseBorder} hover:border-white/20 transition-all duration-200 flex flex-col justify-between`;
                      };

                      const getLabelClasses = (param: PsychroParamKey, baseColor: string) => {
                        const isThisModified = activeModifyingParam === param;
                        const isOtherShaded = isModifyingAny && !isThisModified;

                        if (isThisModified) {
                          return 'text-amber-300 font-black text-[10.5px] drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] flex items-center gap-1';
                        }
                        if (isOtherShaded) {
                          return 'text-slate-600 font-normal text-[10px]';
                        }
                        return `${baseColor} text-[10px] font-bold block`;
                      };

                      return (
                        <div className="space-y-2">
                          {/* Banner when parameters are fixed / pinned */}
                          {activeFixed.length > 0 ? (
                            <div className="bg-amber-500/15 border border-amber-400/40 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[10.5px] text-amber-200 font-mono">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                <span className="truncate">
                                  <strong>{activeFixed.length} {activeFixed.length === 1 ? 'Parámetro fijado' : 'Parámetros fijados'}:</strong>{' '}
                                  {activeFixed.map((k) => PARAM_LABELS_ES[k]?.short).join(' y ')} (constante)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleClearFixedParams}
                                className="text-amber-300 hover:text-white underline font-semibold cursor-pointer text-[10px] ml-2 shrink-0"
                              >
                                Desfijar todos
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-mono">
                              💡 Fija 1 o 2 valores (ej. <strong className="text-sky-300">w</strong> o <strong className="text-amber-300">Tbs</strong>) con 📌 para mantenerlos constantes.
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                          {/* 1. Tbs (Seco) */}
                          <div className={getCardClasses('tdb', 'border-amber-400/30')}>
                            <div>
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={getLabelClasses('tdb', 'text-amber-400')} title="Temperatura de Bulbo Seco (Tbs)">
                                    1. Tbs
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFixParam('tdb')}
                                    className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isFixed('tdb')
                                        ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 shadow-sm'
                                        : 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
                                    }`}
                                    title={
                                      isFixed('tdb')
                                        ? 'Tbs fijado constante. Clic para desfijar.'
                                        : 'Fijar Tbs constante al variar otros valores'
                                    }
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isFixed('tdb') ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <LiveNumericField
                                  value={activeSelectedPoint.tdb}
                                  unit="°C"
                                  decimals={1}
                                  step={0.1}
                                  min={-10}
                                  max={50}
                                  paramKey="tdb"
                                  activeModifyingParam={activeModifyingParam}
                                  onActiveParam={setActiveModifyingParam}
                                  onCommit={handleSliderChangeTdb}
                                  borderColor="border-amber-400/40"
                                  focusRingColor="focus:ring-amber-400 focus:border-amber-400"
                                  textColor="text-amber-300"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="-5"
                              max="45"
                              step="0.5"
                              value={activeSelectedPoint.tdb}
                              onPointerDown={() => setActiveModifyingParam('tdb')}
                              onMouseDown={() => setActiveModifyingParam('tdb')}
                              onTouchStart={() => setActiveModifyingParam('tdb')}
                              onFocus={() => setActiveModifyingParam('tdb')}
                              onBlur={() => setActiveModifyingParam(null)}
                              onChange={(e) => {
                                setActiveModifyingParam('tdb');
                                handleSliderChangeTdb(parseFloat(e.target.value));
                              }}
                              className={`w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700/60 rounded-lg mt-1 ${
                                isModifyingAny && activeModifyingParam !== 'tdb' ? 'opacity-20' : ''
                              }`}
                              title="Deslizar para ajustar Temperatura de Bulbo Seco (°C)"
                            />
                          </div>

                          {/* 2. HR (Relativa) */}
                          <div className={getCardClasses('rh', 'border-rose-400/30')}>
                            <div>
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={getLabelClasses('rh', 'text-rose-400')} title="Humedad Relativa (HR)">
                                    2. HR
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFixParam('rh')}
                                    className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isFixed('rh')
                                        ? 'bg-rose-400 text-slate-950 ring-1 ring-rose-300 shadow-sm'
                                        : 'text-slate-400 hover:text-rose-300 hover:bg-white/10'
                                    }`}
                                    title={
                                      isFixed('rh')
                                        ? 'HR fijada constante. Clic para desfijar.'
                                        : 'Fijar HR constante al variar otros valores'
                                    }
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isFixed('rh') ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <LiveNumericField
                                  value={activeSelectedPoint.rh}
                                  unit="%"
                                  decimals={1}
                                  step={0.5}
                                  min={1}
                                  max={100}
                                  paramKey="rh"
                                  activeModifyingParam={activeModifyingParam}
                                  onActiveParam={setActiveModifyingParam}
                                  onCommit={handleSliderChangeRh}
                                  borderColor="border-rose-400/40"
                                  focusRingColor="focus:ring-rose-400 focus:border-rose-400"
                                  textColor="text-rose-300"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="100"
                              step="1"
                              value={activeSelectedPoint.rh}
                              onPointerDown={() => setActiveModifyingParam('rh')}
                              onMouseDown={() => setActiveModifyingParam('rh')}
                              onTouchStart={() => setActiveModifyingParam('rh')}
                              onFocus={() => setActiveModifyingParam('rh')}
                              onBlur={() => setActiveModifyingParam(null)}
                              onChange={(e) => {
                                setActiveModifyingParam('rh');
                                handleSliderChangeRh(parseFloat(e.target.value));
                              }}
                              className={`w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-700/60 rounded-lg mt-1 ${
                                isModifyingAny && activeModifyingParam !== 'rh' ? 'opacity-20' : ''
                              }`}
                              title="Deslizar para ajustar Humedad Relativa (%)"
                            />
                          </div>

                          {/* 3. h (Entalpía) */}
                          <div className={getCardClasses('h', 'border-emerald-400/30')}>
                            <div>
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={getLabelClasses('h', 'text-emerald-400')} title="Entalpía específica (h)">
                                    3. h
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFixParam('h')}
                                    className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isFixed('h')
                                        ? 'bg-emerald-400 text-slate-950 ring-1 ring-emerald-300 shadow-sm'
                                        : 'text-slate-400 hover:text-emerald-300 hover:bg-white/10'
                                    }`}
                                    title={
                                      isFixed('h')
                                        ? 'Entalpía h fijada constante. Clic para desfijar.'
                                        : 'Fijar Entalpía h constante (proceso adiabático)'
                                    }
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isFixed('h') ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <LiveNumericField
                                  value={activeSelectedPoint.h}
                                  unit="kJ/kg"
                                  decimals={1}
                                  step={0.5}
                                  min={5}
                                  max={130}
                                  paramKey="h"
                                  activeModifyingParam={activeModifyingParam}
                                  onActiveParam={setActiveModifyingParam}
                                  onCommit={handleSliderChangeEnthalpy}
                                  borderColor="border-emerald-400/40"
                                  focusRingColor="focus:ring-emerald-400 focus:border-emerald-400"
                                  textColor="text-emerald-300"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="120"
                              step="0.5"
                              value={activeSelectedPoint.h}
                              onPointerDown={() => setActiveModifyingParam('h')}
                              onMouseDown={() => setActiveModifyingParam('h')}
                              onTouchStart={() => setActiveModifyingParam('h')}
                              onFocus={() => setActiveModifyingParam('h')}
                              onBlur={() => setActiveModifyingParam(null)}
                              onChange={(e) => {
                                setActiveModifyingParam('h');
                                handleSliderChangeEnthalpy(parseFloat(e.target.value));
                              }}
                              className={`w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-700/60 rounded-lg mt-1 ${
                                isModifyingAny && activeModifyingParam !== 'h' ? 'opacity-20' : ''
                              }`}
                              title="Deslizar para ajustar Entalpía específica h (kJ/kg)"
                            />
                          </div>

                          {/* 4. w (Humedad específica) */}
                          <div className={getCardClasses('w', 'border-sky-400/30')}>
                            <div>
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={getLabelClasses('w', 'text-sky-400')} title="Humedad específica (w)">
                                    4. w
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFixParam('w')}
                                    className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isFixed('w')
                                        ? 'bg-sky-400 text-slate-950 ring-1 ring-sky-300 shadow-sm'
                                        : 'text-slate-400 hover:text-sky-300 hover:bg-white/10'
                                    }`}
                                    title={
                                      isFixed('w')
                                        ? 'Humedad w fijada constante. Clic para desfijar.'
                                        : 'Fijar Humedad w constante (calentamiento/enfriamiento sensible)'
                                    }
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isFixed('w') ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <LiveNumericField
                                  value={activeSelectedPoint.w * 1000}
                                  unit="g/kg"
                                  decimals={2}
                                  step={0.1}
                                  min={0.2}
                                  max={30}
                                  paramKey="w"
                                  activeModifyingParam={activeModifyingParam}
                                  onActiveParam={setActiveModifyingParam}
                                  onCommit={handleSliderChangeHumidity}
                                  borderColor="border-sky-400/40"
                                  focusRingColor="focus:ring-sky-400 focus:border-sky-400"
                                  textColor="text-sky-300"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="26"
                              step="0.1"
                              value={Number((activeSelectedPoint.w * 1000).toFixed(2))}
                              onPointerDown={() => setActiveModifyingParam('w')}
                              onMouseDown={() => setActiveModifyingParam('w')}
                              onTouchStart={() => setActiveModifyingParam('w')}
                              onFocus={() => setActiveModifyingParam('w')}
                              onBlur={() => setActiveModifyingParam(null)}
                              onChange={(e) => {
                                setActiveModifyingParam('w');
                                handleSliderChangeHumidity(parseFloat(e.target.value));
                              }}
                              className={`w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-700/60 rounded-lg mt-1 ${
                                isModifyingAny && activeModifyingParam !== 'w' ? 'opacity-20' : ''
                              }`}
                              title="Deslizar para ajustar Humedad específica w (g/kg)"
                            />
                          </div>

                          {/* 5. Tbh (Húmedo) */}
                          <div className={getCardClasses('twb', 'border-purple-400/30')}>
                            <div>
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={getLabelClasses('twb', 'text-purple-400')} title="Temperatura de Bulbo Húmedo (Tbh)">
                                    5. Tbh
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFixParam('twb')}
                                    className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isFixed('twb')
                                        ? 'bg-purple-400 text-slate-950 ring-1 ring-purple-300 shadow-sm'
                                        : 'text-slate-400 hover:text-purple-300 hover:bg-white/10'
                                    }`}
                                    title={
                                      isFixed('twb')
                                        ? 'Tbh fijada constante. Clic para desfijar.'
                                        : 'Fijar Tbh constante al variar otros valores'
                                    }
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isFixed('twb') ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <LiveNumericField
                                  value={Math.min(activeSelectedPoint.tdb, activeSelectedPoint.twb)}
                                  unit="°C"
                                  decimals={1}
                                  step={0.1}
                                  min={-5}
                                  max={Math.max(-5, Math.min(38, activeSelectedPoint.tdb))}
                                  paramKey="twb"
                                  activeModifyingParam={activeModifyingParam}
                                  onActiveParam={setActiveModifyingParam}
                                  onCommit={handleSliderChangeTwb}
                                  borderColor="border-purple-400/40"
                                  focusRingColor="focus:ring-purple-400 focus:border-purple-400"
                                  textColor="text-purple-300"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="-5"
                              max={Math.max(-5, Math.min(38, activeSelectedPoint.tdb))}
                              step="0.5"
                              value={Math.min(activeSelectedPoint.tdb, activeSelectedPoint.twb)}
                              onPointerDown={() => setActiveModifyingParam('twb')}
                              onMouseDown={() => setActiveModifyingParam('twb')}
                              onTouchStart={() => setActiveModifyingParam('twb')}
                              onFocus={() => setActiveModifyingParam('twb')}
                              onBlur={() => setActiveModifyingParam(null)}
                              onChange={(e) => {
                                setActiveModifyingParam('twb');
                                handleSliderChangeTwb(parseFloat(e.target.value));
                              }}
                              className={`w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-700/60 rounded-lg mt-1 ${
                                isModifyingAny && activeModifyingParam !== 'twb' ? 'opacity-20' : ''
                              }`}
                              title="Deslizar para ajustar Temperatura de Bulbo Húmedo (°C)"
                            />
                          </div>

                          {/* 6. Tpr (Rocío) */}
                          <div className={getCardClasses('tdp', 'border-teal-400/30')}>
                            <div>
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={getLabelClasses('tdp', 'text-teal-400')} title="Temperatura de Rocío (Tpr)">
                                    6. Tpr
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFixParam('tdp')}
                                    className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isFixed('tdp')
                                        ? 'bg-teal-400 text-slate-950 ring-1 ring-teal-300 shadow-sm'
                                        : 'text-slate-400 hover:text-teal-300 hover:bg-white/10'
                                    }`}
                                    title={
                                      isFixed('tdp')
                                        ? 'Tpr fijada constante. Clic para desfijar.'
                                        : 'Fijar Tpr constante (presión de vapor fija)'
                                    }
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isFixed('tdp') ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <LiveNumericField
                                  value={Math.min(activeSelectedPoint.tdb, activeSelectedPoint.tdp)}
                                  unit="°C"
                                  decimals={1}
                                  step={0.1}
                                  min={-15}
                                  max={Math.max(-15, Math.min(35, activeSelectedPoint.tdb))}
                                  paramKey="tdp"
                                  activeModifyingParam={activeModifyingParam}
                                  onActiveParam={setActiveModifyingParam}
                                  onCommit={handleSliderChangeTdp}
                                  borderColor="border-teal-400/40"
                                  focusRingColor="focus:ring-teal-400 focus:border-teal-400"
                                  textColor="text-teal-300"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="-15"
                              max={Math.max(-15, Math.min(35, activeSelectedPoint.tdb))}
                              step="0.5"
                              value={Math.min(activeSelectedPoint.tdb, activeSelectedPoint.tdp)}
                              onPointerDown={() => setActiveModifyingParam('tdp')}
                              onMouseDown={() => setActiveModifyingParam('tdp')}
                              onTouchStart={() => setActiveModifyingParam('tdp')}
                              onFocus={() => setActiveModifyingParam('tdp')}
                              onBlur={() => setActiveModifyingParam(null)}
                              onChange={(e) => {
                                setActiveModifyingParam('tdp');
                                handleSliderChangeTdp(parseFloat(e.target.value));
                              }}
                              className={`w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-700/60 rounded-lg mt-1 ${
                                isModifyingAny && activeModifyingParam !== 'tdp' ? 'opacity-20' : ''
                              }`}
                              title="Deslizar para ajustar Temperatura de Rocío (°C)"
                            />
                          </div>

                          {/* 7. v (Volumen específico) */}
                          <div className={getCardClasses('v', 'border-cyan-400/30', 'col-span-2')}>
                            <div>
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={getLabelClasses('v', 'text-cyan-400')} title="Volumen específico (v)">
                                    7. v
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFixParam('v')}
                                    className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                      isFixed('v')
                                        ? 'bg-cyan-400 text-slate-950 ring-1 ring-cyan-300 shadow-sm'
                                        : 'text-slate-400 hover:text-cyan-300 hover:bg-white/10'
                                    }`}
                                    title={
                                      isFixed('v')
                                        ? 'Volumen v fijado constante. Clic para desfijar.'
                                        : 'Fijar Volumen v constante'
                                    }
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isFixed('v') ? 'fill-current' : ''}`} />
                                  </button>
                                  <span className={`text-[9.5px] font-mono hidden sm:inline ${isModifyingAny && activeModifyingParam !== 'v' ? 'text-slate-600' : 'text-slate-400'}`}>
                                    (ρ={activeSelectedPoint.rho.toFixed(2)} · Pv={activeSelectedPoint.pv.toFixed(2)} kPa)
                                  </span>
                                </div>
                                <LiveNumericField
                                  value={activeSelectedPoint.v}
                                  unit="m³/kg"
                                  decimals={3}
                                  step={0.001}
                                  min={0.78}
                                  max={0.96}
                                  paramKey="v"
                                  activeModifyingParam={activeModifyingParam}
                                  onActiveParam={setActiveModifyingParam}
                                  onCommit={handleSliderChangeVolume}
                                  borderColor="border-cyan-400/40"
                                  focusRingColor="focus:ring-cyan-400 focus:border-cyan-400"
                                  textColor="text-cyan-200"
                                  widthClass="w-13 sm:w-16"
                                />
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0.78"
                              max="0.96"
                              step="0.002"
                              value={activeSelectedPoint.v}
                              onPointerDown={() => setActiveModifyingParam('v')}
                              onMouseDown={() => setActiveModifyingParam('v')}
                              onTouchStart={() => setActiveModifyingParam('v')}
                              onFocus={() => setActiveModifyingParam('v')}
                              onBlur={() => setActiveModifyingParam(null)}
                              onChange={(e) => {
                                setActiveModifyingParam('v');
                                handleSliderChangeVolume(parseFloat(e.target.value));
                              }}
                              className={`w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700/60 rounded-lg mt-1 ${
                                isModifyingAny && activeModifyingParam !== 'v' ? 'opacity-20' : ''
                              }`}
                              title="Deslizar para ajustar Volumen específico v (m³/kg)"
                            />
                          </div>
                        </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* LESSON: AIR MIXTURE (The core user request) */}
            {activeLesson === 'mixing' && (() => {
              const ptA = points.find((p) => p.id === 'mix-pt-a');
              const ptB = points.find((p) => p.id === 'mix-pt-b');
              const ptM = points.find((p) => p.id === 'mix-pt-m');

              return (
                <div className="space-y-4">
                  <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3">
                    <div className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                      <span>⚖️ Regla de la Palanca Inversa</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Mueve el deslizador para ver cómo el punto de mezcla <span className="text-amber-400 font-bold">M</span> se desplaza en tiempo real a lo largo de la recta entre el <span className="text-sky-400 font-bold">Aire Exterior (E)</span> y el <span className="text-emerald-400 font-bold">Aire de Retorno (R)</span>.
                    </p>
                  </div>

                  {/* Slider: Outdoor Air Fraction (alpha) */}
                  <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white font-bold">Porcentaje de Aire Exterior (α):</span>
                      <span className="text-amber-400 font-extrabold text-sm">{(outdoorAirRatio * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={outdoorAirRatio}
                      onChange={(e) => setOutdoorAirRatio(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0% (100% Retorno)</span>
                      <span>50% (Mitad y mitad)</span>
                      <span>100% (100% Exterior)</span>
                    </div>
                  </div>

                  {/* Mixture Point M Live Card with ALL values */}
                  {ptM && (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-400/50 space-y-1.5 font-mono shadow-md">
                      <div className="flex justify-between items-center text-xs font-bold text-amber-400 pb-1 border-b border-white/10">
                        <span>Punto Mezcla M ({(outdoorAirRatio * 100).toFixed(0)}% Ext)</span>
                        <span className="text-[10px] text-emerald-400">Todos los Valores</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
                        <div className="bg-black/40 p-1.5 rounded border border-white/5">
                          <span className="text-amber-300 font-bold block">Tbs</span>
                          <span className="text-white font-bold text-xs">{ptM.tdb.toFixed(1)}°C</span>
                        </div>
                        <div className="bg-black/40 p-1.5 rounded border border-rose-400/30">
                          <span className="text-rose-400 font-bold block">HR (φ)</span>
                          <span className="text-rose-300 font-bold text-xs">{ptM.rh.toFixed(1)}%</span>
                        </div>
                        <div className="bg-black/40 p-1.5 rounded border border-emerald-400/30">
                          <span className="text-emerald-400 font-bold block">Entalpía (h)</span>
                          <span className="text-emerald-300 font-bold text-xs">{ptM.h.toFixed(1)} kJ</span>
                        </div>
                        <div className="bg-black/40 p-1.5 rounded border border-sky-400/20">
                          <span className="text-sky-300 font-bold block">Humedad (w)</span>
                          <span className="text-white font-bold">{(ptM.w * 1000).toFixed(2)} g</span>
                        </div>
                        <div className="bg-black/40 p-1.5 rounded border border-purple-400/30">
                          <span className="text-purple-400 font-bold block">Tbh</span>
                          <span className="text-purple-300 font-bold">{ptM.twb.toFixed(1)}°C</span>
                        </div>
                        <div className="bg-black/40 p-1.5 rounded border border-teal-400/30">
                          <span className="text-teal-400 font-bold block">Tpr</span>
                          <span className="text-teal-300 font-bold">{ptM.tdp.toFixed(1)}°C</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stream Controls */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Stream A: Outdoor */}
                    <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/30 space-y-1.5">
                      <div className="font-bold text-sky-400 font-mono text-[11px] flex justify-between items-center">
                        <span>Aire Exterior (E)</span>
                        {ptA && <span className="text-[10px] text-emerald-400 font-normal">{ptA.h.toFixed(0)} kJ/kg</span>}
                      </div>
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Tbs:</span>
                        <span className="text-white font-bold">{mixA_Tdb}°C</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="42"
                        value={mixA_Tdb}
                        onChange={(e) => setMixA_Tdb(parseFloat(e.target.value))}
                        className="w-full accent-sky-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">HR:</span>
                        <span className="text-rose-300 font-bold">{mixA_Rh}%</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="90"
                        value={mixA_Rh}
                        onChange={(e) => setMixA_Rh(parseFloat(e.target.value))}
                        className="w-full accent-rose-400 cursor-pointer"
                      />
                      {ptA && (
                        <div className="pt-1 border-t border-white/10 text-[10px] text-slate-300 font-mono space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-emerald-400">Entalpía h:</span>
                            <span className="text-emerald-300 font-bold">{ptA.h.toFixed(1)} kJ/kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sky-300">Humedad w:</span>
                            <span>{(ptA.w * 1000).toFixed(2)} g/kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300">Tbh:</span>
                            <span>{ptA.twb.toFixed(1)}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-teal-300">Tpr:</span>
                            <span>{ptA.tdp.toFixed(1)}°C</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stream B: Return */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                      <div className="font-bold text-emerald-400 font-mono text-[11px] flex justify-between items-center">
                        <span>Aire Retorno (R)</span>
                        {ptB && <span className="text-[10px] text-emerald-300 font-normal">{ptB.h.toFixed(0)} kJ/kg</span>}
                      </div>
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Tbs:</span>
                        <span className="text-white font-bold">{mixB_Tdb}°C</span>
                      </div>
                      <input
                        type="range"
                        min="18"
                        max="28"
                        value={mixB_Tdb}
                        onChange={(e) => setMixB_Tdb(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">HR:</span>
                        <span className="text-rose-300 font-bold">{mixB_Rh}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="70"
                        value={mixB_Rh}
                        onChange={(e) => setMixB_Rh(parseFloat(e.target.value))}
                        className="w-full accent-rose-400 cursor-pointer"
                      />
                      {ptB && (
                        <div className="pt-1 border-t border-white/10 text-[10px] text-slate-300 font-mono space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-emerald-400">Entalpía h:</span>
                            <span className="text-emerald-300 font-bold">{ptB.h.toFixed(1)} kJ/kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sky-300">Humedad w:</span>
                            <span>{(ptB.w * 1000).toFixed(2)} g/kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-300">Tbh:</span>
                            <span>{ptB.twb.toFixed(1)}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-teal-300">Tpr:</span>
                            <span>{ptB.tdp.toFixed(1)}°C</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* LESSON: SENSIBLE HEATING */}
            {activeLesson === 'heating' && (() => {
              const ptIn = points[0];
              const ptOut = points[1];

              return (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    En un calentamiento sensible con batería de agua caliente o eléctrica, <span className="text-amber-400 font-bold">no se añade ni quita agua</span>. Por tanto, la humedad específica <span className="text-sky-400 font-mono">w = cte</span> (recta estrictamente horizontal).
                  </p>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300">Temperatura Entrada (T1)</span>
                      <span className="text-white font-bold">{heatTdbIn}°C</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="25"
                      value={heatTdbIn}
                      onChange={(e) => setHeatTdbIn(parseFloat(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-amber-400 font-bold">Salto Térmico (+ΔT)</span>
                      <span className="text-amber-300 font-bold">+{heatDeltaT}°C</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={heatDeltaT}
                      onChange={(e) => setHeatDeltaT(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Live Values for Heating */}
                  {ptIn && ptOut && (
                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                      <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 space-y-1">
                        <div className="font-bold text-sky-400 text-xs">Entrada (P1)</div>
                        <div>Tbs: <strong className="text-white">{ptIn.tdb.toFixed(1)}°C</strong></div>
                        <div>HR: <strong className="text-rose-300">{ptIn.rh.toFixed(1)}%</strong></div>
                        <div>h: <strong className="text-emerald-300">{ptIn.h.toFixed(1)} kJ/kg</strong></div>
                        <div>w: {(ptIn.w * 1000).toFixed(2)} g/kg</div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
                        <div className="font-bold text-amber-400 text-xs">Salida (P2)</div>
                        <div>Tbs: <strong className="text-white">{ptOut.tdb.toFixed(1)}°C</strong></div>
                        <div>HR: <strong className="text-rose-300">{ptOut.rh.toFixed(1)}%</strong></div>
                        <div>h: <strong className="text-emerald-300">{ptOut.h.toFixed(1)} kJ/kg</strong></div>
                        <div>w: {(ptOut.w * 1000).toFixed(2)} g/kg</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* LESSON: COOLING & DEHUMIDIFICATION */}
            {activeLesson === 'cooling' && (() => {
              const ptIn = points[0];
              const ptAdp = points[1];
              const ptOut = points[2];

              return (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    La batería fría desciende por debajo de la temperatura de rocío. El aire se dirige hacia el <span className="text-cyan-400 font-bold">ADP</span> (Punto de Rocío del Aparato en la saturación).
                  </p>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-cyan-400 font-bold">Temp. Superficie Batería (ADP)</span>
                      <span className="text-white font-bold">{coolAdp}°C</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="16"
                      step="0.5"
                      value={coolAdp}
                      onChange={(e) => setCoolAdp(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-amber-400 font-bold">Factor de Bypass (BF)</span>
                      <span className="text-amber-300 font-bold">{(coolBypass * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.30"
                      step="0.02"
                      value={coolBypass}
                      onChange={(e) => setCoolBypass(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      {coolBypass === 0 ? 'Batería ideal infinita (aire alcanza ADP)' : 'Batería real: parte del aire pasa sin contactar los tubos.'}
                    </div>
                  </div>

                  {/* Live Values for Cooling */}
                  {ptIn && ptOut && (
                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                      <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 space-y-1">
                        <div className="font-bold text-sky-400 text-xs">Entrada (P1)</div>
                        <div>Tbs: <strong className="text-white">{ptIn.tdb.toFixed(1)}°C</strong></div>
                        <div>HR: <strong className="text-rose-300">{ptIn.rh.toFixed(1)}%</strong></div>
                        <div>h: <strong className="text-emerald-300">{ptIn.h.toFixed(1)} kJ/kg</strong></div>
                        <div>w: {(ptIn.w * 1000).toFixed(2)} g/kg</div>
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                        <div className="font-bold text-cyan-400 text-xs">Salida (P2)</div>
                        <div>Tbs: <strong className="text-white">{ptOut.tdb.toFixed(1)}°C</strong></div>
                        <div>HR: <strong className="text-rose-300">{ptOut.rh.toFixed(1)}%</strong></div>
                        <div>h: <strong className="text-emerald-300">{ptOut.h.toFixed(1)} kJ/kg</strong></div>
                        <div>w: {(ptOut.w * 1000).toFixed(2)} g/kg</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* LESSON: HUMIDIFICATION */}
            {activeLesson === 'humidification' && (() => {
              const ptIn = points[0];
              const ptOut = points[1];

              return (
                <div className="space-y-4">
                  <div className="flex rounded-lg bg-black/40 p-1 border border-white/10 text-xs">
                    <button
                      onClick={() => setHumidType('adiabatic')}
                      className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                        humidType === 'adiabatic'
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Lavador Adiabático (h = cte)
                    </button>
                    <button
                      onClick={() => setHumidType('steam')}
                      className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                        humidType === 'steam'
                          ? 'bg-purple-500 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Inyección Vapor (Tbs = cte)
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-white font-bold">Humedad Añadida (+Δw)</span>
                      <span className="text-emerald-400 font-bold">+{humidDeltaW} g/kg</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={humidDeltaW}
                      onChange={(e) => setHumidDeltaW(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  {/* Live Values for Humidification */}
                  {ptIn && ptOut && (
                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                      <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 space-y-1">
                        <div className="font-bold text-sky-400 text-xs">Entrada (P1)</div>
                        <div>Tbs: <strong className="text-white">{ptIn.tdb.toFixed(1)}°C</strong></div>
                        <div>HR: <strong className="text-rose-300">{ptIn.rh.toFixed(1)}%</strong></div>
                        <div>h: <strong className="text-emerald-300">{ptIn.h.toFixed(1)} kJ/kg</strong></div>
                        <div>w: {(ptIn.w * 1000).toFixed(2)} g/kg</div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1">
                        <div className="font-bold text-purple-400 text-xs">Salida (P2)</div>
                        <div>Tbs: <strong className="text-white">{ptOut.tdb.toFixed(1)}°C</strong></div>
                        <div>HR: <strong className="text-rose-300">{ptOut.rh.toFixed(1)}%</strong></div>
                        <div>h: <strong className="text-emerald-300">{ptOut.h.toFixed(1)} kJ/kg</strong></div>
                        <div>w: {(ptOut.w * 1000).toFixed(2)} g/kg</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Section 2: Didactic Output & Mathematical Formulation */}
          <div className="p-4 border-b border-white/10 space-y-4">
            {/* Permanent Complete Thermodynamic Table for ALL points in the current scenario */}
            {points.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                    <Table className="w-3.5 h-3.5" />
                    <span>Todos los Valores Termodinámicos ({points.length} {points.length === 1 ? 'Punto' : 'Puntos'})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">P = {pressure.toFixed(1)} kPa</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/60 shadow-inner">
                  <table className="w-full text-left font-mono text-[10.5px]">
                    <thead className="bg-white/5 text-slate-400 border-b border-white/10 text-[9.5px]">
                      <tr>
                        <th className="py-1.5 px-2">Punto</th>
                        <th className="py-1.5 px-1.5 text-amber-300">Tbs (°C)</th>
                        <th className="py-1.5 px-1.5 text-rose-300">HR (%)</th>
                        <th className="py-1.5 px-1.5 text-emerald-300">h (kJ/kg)</th>
                        <th className="py-1.5 px-1.5 text-sky-300">w (g/kg)</th>
                        <th className="py-1.5 px-1.5 text-purple-300">Tbh (°C)</th>
                        <th className="py-1.5 px-1.5 text-teal-300">Tpr (°C)</th>
                        <th className="py-1.5 px-1.5 text-cyan-300">v (m³/kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {points.map((pt) => {
                        const isSelected = pt.id === selectedPointId;
                        return (
                          <tr
                            key={pt.id}
                            onClick={() => setSelectedPointId(pt.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-400/15' : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="py-1.5 px-2 flex items-center gap-1.5 font-bold text-white whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pt.color }} />
                              <span>{pt.name.split(':')[0]}</span>
                            </td>
                            <td className="py-1.5 px-1.5 text-amber-300 font-bold">{pt.tdb.toFixed(1)}</td>
                            <td className="py-1.5 px-1.5 text-rose-300 font-bold">{pt.rh.toFixed(1)}%</td>
                            <td className="py-1.5 px-1.5 text-emerald-300 font-bold">{pt.h.toFixed(1)}</td>
                            <td className="py-1.5 px-1.5 text-sky-300">{(pt.w * 1000).toFixed(2)}</td>
                            <td className="py-1.5 px-1.5 text-purple-300">{pt.twb.toFixed(1)}</td>
                            <td className="py-1.5 px-1.5 text-teal-300">{pt.tdp.toFixed(1)}</td>
                            <td className="py-1.5 px-1.5 text-cyan-300">{pt.v.toFixed(3)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* If in Mixture mode: display step-by-step balances */}
            {activeLesson === 'mixing' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Balances de Conservación en Vivo</span>
                </div>

                {/* Mathematical Formula breakdown */}
                <div className="bg-black/60 rounded-xl p-3 border border-white/10 space-y-2.5 font-mono text-xs">
                  {/* Balance de Humedad */}
                  <div>
                    <div className="text-[11px] text-slate-400">Balance de Vapor de Agua:</div>
                    <div className="text-sky-300 font-bold">
                      w_M = α·w_E + (1-α)·w_R
                    </div>
                    {points[2] && points[0] && points[1] && (
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {(points[2].w * 1000).toFixed(2)} = {outdoorAirRatio.toFixed(2)}·{(points[0].w * 1000).toFixed(2)} + {(1 - outdoorAirRatio).toFixed(2)}·{(points[1].w * 1000).toFixed(2)} g/kg
                      </div>
                    )}
                  </div>

                  {/* Balance de Entalpía */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[11px] text-slate-400">Balance de Energía (Entalpía):</div>
                    <div className="text-purple-300 font-bold">
                      h_M = α·h_E + (1-α)·h_R
                    </div>
                    {points[2] && points[0] && points[1] && (
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {points[2].h.toFixed(1)} = {outdoorAirRatio.toFixed(2)}·{points[0].h.toFixed(1)} + {(1 - outdoorAirRatio).toFixed(2)}·{points[1].h.toFixed(1)} kJ/kg
                      </div>
                    )}
                  </div>

                  {/* Temperatura resultante */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[11px] text-slate-400">Temperatura Seca Resultante:</div>
                    <div className="text-amber-300 font-bold">
                      Tbs_M ≈ α·Tbs_E + (1-α)·Tbs_R
                    </div>
                    {points[2] && points[0] && points[1] && (
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {points[2].tdb.toFixed(1)}°C = {outdoorAirRatio.toFixed(2)}·{points[0].tdb.toFixed(1)} + {(1 - outdoorAirRatio).toFixed(2)}·{points[1].tdb.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lever Rule Summary */}
                <div className="p-3 bg-amber-400/10 rounded-xl border border-amber-400/20 text-xs space-y-1">
                  <div className="font-bold text-amber-300">Demostración de la Regla de la Palanca:</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    Segmento <span className="text-sky-400 font-bold">EM</span> = {((1 - outdoorAirRatio) * 100).toFixed(0)}% del total.<br />
                    Segmento <span className="text-emerald-400 font-bold">MR</span> = {(outdoorAirRatio * 100).toFixed(0)}% del total.<br />
                    <span className="text-amber-400 font-semibold">EM / MR = m_R / m_E</span> (Inversamente proporcional a los caudales).
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Classroom Interactive Quiz & Teacher Prompts */}
          <div className="p-4 space-y-3 flex-1">
            <div className="text-xs font-bold text-amber-400 font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Preguntas de Clase para Alumnos</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Interactivo</span>
            </div>

            <div className="space-y-2">
              {CLASSROOM_QUESTIONS.map((q, idx) => {
                const isOpen = activeQuestionIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-xs transition-colors"
                  >
                    <button
                      onClick={() => {
                        if (isOpen) {
                          setActiveQuestionIndex(null);
                        } else {
                          setActiveQuestionIndex(idx);
                          setShowAnswer(false);
                        }
                      }}
                      className="w-full p-2.5 text-left flex items-start justify-between gap-2 hover:bg-white/5 cursor-pointer"
                    >
                      <span className="font-semibold text-slate-200">
                        {idx + 1}. {q.question}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-amber-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="p-3 bg-amber-400/5 border-t border-white/10 space-y-2">
                        {!showAnswer ? (
                          <button
                            onClick={() => setShowAnswer(true)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold hover:bg-amber-400/30 transition-colors cursor-pointer"
                          >
                            👁️ Revelar Respuesta Didáctica
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-300 leading-relaxed bg-black/60 p-2.5 rounded-lg border border-amber-400/20">
                            <span className="font-bold text-amber-400">Explicación para el aula: </span>
                            {q.answer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
