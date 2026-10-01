import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  StatePoint,
  ProcessConnection,
  ChartBounds,
  ChartLayerVisibility,
  ChartType,
  UnitSystem,
} from '../types/psychrometrics';
import {
  getSaturationHumidityRatio,
  getWFromTdbRh,
  getEnthalpy,
  getWFromEnthalpy,
  getSpecificVolume,
  getWFromTdbTwb,
  getPvFromHumidityRatio,
  getDewPoint,
  getRelativeHumidity,
  getWetBulb,
  UnitConvert,
  ASHRAE55_SUMMER,
  ASHRAE55_WINTER,
  UNE_EN_16798_CAT1_SUMMER,
  UNE_EN_16798_CAT1_WINTER,
  UNE_EN_16798_CAT2_SUMMER,
  UNE_EN_16798_CAT2_WINTER,
  UNE_EN_16798_CAT3_SUMMER,
  UNE_EN_16798_CAT3_WINTER,
} from '../utils/psychrolib';
import {
  computeSaturationEnthalpyTicks,
  computeEnthalpyDeviations,
  ASHRAE_SHR_VALUES,
  getSlopeFromSHR,
} from '../utils/ashraeScales';
import { ASHRAEProtractor } from './ASHRAEProtractor';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  RotateCcw,
  Move,
  Compass,
  FileText,
  Activity,
  Check,
} from 'lucide-react';

interface PsychrometricChartProps {
  points: StatePoint[];
  processes: ProcessConnection[];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onUpdatePointCoordinates: (id: string, tdb: number, w: number) => void;
  onAddPointAtCoordinates: (tdb: number, w: number) => void;
  pressure: number;
  chartType: ChartType;
  units: UnitSystem;
  layers: ChartLayerVisibility;
}

// Standard full psychrometric domain limits
const DEFAULT_BOUNDS: ChartBounds = {
  tdbMin: -10,
  tdbMax: 55,
  wMin: 0,
  wMax: 0.033, // 33 g/kg
};

export const PsychrometricChart: React.FC<PsychrometricChartProps> = ({
  points,
  processes,
  selectedPointId,
  onSelectPoint,
  onUpdatePointCoordinates,
  onAddPointAtCoordinates,
  pressure,
  chartType,
  units,
  layers,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG Canvas dimensions tightly tailored to fill window
  const viewBoxWidth = 1200;
  const viewBoxHeight = 740;

  // Optimized margins giving clean clearance for official ASHRAE outer enthalpy scale and FCS scale
  const margin = useMemo(
    () => ({
      top: 36,    // Clearance for top perimeter enthalpy scale
      right: 80,  // Space for Humidity Ratio scale W and Sensible Heat Factor scale
      bottom: 46, // Space for Dry Bulb Temp scale Tbs and tick numbers
      left: 52,   // Space for -10 tick and outer saturation enthalpy scale
    }),
    []
  );

  const plotWidth = viewBoxWidth - margin.left - margin.right;
  const plotHeight = viewBoxHeight - margin.top - margin.bottom;

  // Active visible domain bounds (Zoom and Pan apply directly to the diagram coordinates, not the outer window)
  const [bounds, setBounds] = useState<ChartBounds>(DEFAULT_BOUNDS);

  // Official Chart Theme: 'ashrae_classic' (Canonical Green on technical paper), 'valcon_color' (Polychrome), or 'dark_blueprint' (CAD)
  const [chartTheme, setChartTheme] = useState<'ashrae_classic' | 'valcon_color' | 'dark_blueprint'>('ashrae_classic');
  const [showProtractor, setShowProtractor] = useState<boolean>(true);
  const [showEnthalpyDeviations, setShowEnthalpyDeviations] = useState<boolean>(true);
  const [selectedSHR, setSelectedSHR] = useState<number | null>(null);

  // Pan & Drag state
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; bounds: ChartBounds }>({
    clientX: 0,
    clientY: 0,
    bounds: DEFAULT_BOUNDS,
  });
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);

  // Cursor hover thermodynamic state
  const [hoverCoords, setHoverCoords] = useState<{
    x: number;
    y: number;
    tdb: number;
    w: number;
    rh: number;
    h: number;
    twb: number;
    tdp: number;
    v: number;
  } | null>(null);

  // Coordinate mapping: Tdb, W -> SVG X, Y (Carrier Chart)
  const coordToPixelCarrier = useCallback(
    (tdb: number, w: number): [number, number] => {
      const px =
        margin.left +
        ((tdb - bounds.tdbMin) / (bounds.tdbMax - bounds.tdbMin)) * plotWidth;
      const py =
        margin.top +
        plotHeight -
        ((w - bounds.wMin) / (bounds.wMax - bounds.wMin)) * plotHeight;
      return [px, py];
    },
    [bounds, margin.left, margin.top, plotWidth, plotHeight]
  );

  // Inverse Coordinate mapping: SVG X, Y -> Tdb, W (Carrier Chart)
  const pixelToCoordCarrier = useCallback(
    (px: number, py: number): [number, number] => {
      const tdb =
        bounds.tdbMin +
        ((px - margin.left) / plotWidth) * (bounds.tdbMax - bounds.tdbMin);
      const w =
        bounds.wMin +
        ((margin.top + plotHeight - py) / plotHeight) * (bounds.wMax - bounds.wMin);
      return [tdb, w];
    },
    [bounds, margin.left, margin.top, plotWidth, plotHeight]
  );

  // Coordinate mapping: Mollier h-x Diagram
  const coordToPixelMollier = useCallback(
    (tdb: number, w: number): [number, number] => {
      const h = getEnthalpy(tdb, w);
      const hMin = -10;
      const hMax = 140;
      const px =
        margin.left +
        ((w - bounds.wMin) / (bounds.wMax - bounds.wMin)) * plotWidth;
      const py =
        margin.top +
        plotHeight -
        ((h - hMin) / (hMax - hMin)) * plotHeight;
      return [px, py];
    },
    [bounds, margin.left, margin.top, plotWidth, plotHeight]
  );

  const pixelToCoordMollier = useCallback(
    (px: number, py: number): [number, number] => {
      const w =
        bounds.wMin +
        ((px - margin.left) / plotWidth) * (bounds.wMax - bounds.wMin);
      const hMin = -10;
      const hMax = 140;
      const h =
        hMin +
        ((margin.top + plotHeight - py) / plotHeight) * (hMax - hMin);
      const tdb = (h - 2501 * w) / (1.006 + 1.86 * w);
      return [tdb, w];
    },
    [bounds, margin.left, margin.top, plotWidth, plotHeight]
  );

  const coordToPixel = useCallback(
    (tdb: number, w: number): [number, number] => {
      if (chartType === 'mollier') {
        return coordToPixelMollier(tdb, w);
      }
      return coordToPixelCarrier(tdb, w);
    },
    [chartType, coordToPixelCarrier, coordToPixelMollier]
  );

  const pixelToCoord = useCallback(
    (px: number, py: number): [number, number] => {
      if (chartType === 'mollier') {
        return pixelToCoordMollier(px, py);
      }
      return pixelToCoordCarrier(px, py);
    },
    [chartType, pixelToCoordCarrier, pixelToCoordMollier]
  );

  // ---------------- ZOOM, PAN & FIT OPERATIONS (APPLIED EXCLUSIVELY TO DIAGRAM DOMAIN) ----------------
  const handleZoomIn = () => {
    const spanT = (bounds.tdbMax - bounds.tdbMin) * 0.8;
    const spanW = (bounds.wMax - bounds.wMin) * 0.8;
    const midT = (bounds.tdbMin + bounds.tdbMax) / 2;
    const midW = (bounds.wMin + bounds.wMax) / 2;
    setBounds({
      tdbMin: Number((midT - spanT / 2).toFixed(2)),
      tdbMax: Number((midT + spanT / 2).toFixed(2)),
      wMin: Number(Math.max(0, midW - spanW / 2).toFixed(5)),
      wMax: Number((midW + spanW / 2).toFixed(5)),
    });
  };

  const handleZoomOut = () => {
    const spanT = Math.min(90, (bounds.tdbMax - bounds.tdbMin) * 1.25);
    const spanW = Math.min(0.05, (bounds.wMax - bounds.wMin) * 1.25);
    const midT = (bounds.tdbMin + bounds.tdbMax) / 2;
    const midW = (bounds.wMin + bounds.wMax) / 2;
    setBounds({
      tdbMin: Number((midT - spanT / 2).toFixed(2)),
      tdbMax: Number((midT + spanT / 2).toFixed(2)),
      wMin: Number(Math.max(0, midW - spanW / 2).toFixed(5)),
      wMax: Number((midW + spanW / 2).toFixed(5)),
    });
  };

  const handleZoomAll = () => {
    if (points.length === 0) {
      setBounds(DEFAULT_BOUNDS);
      return;
    }
    const tVals = points.map((p) => p.tdb);
    const wVals = points.map((p) => p.w);
    const minT = Math.min(...tVals);
    const maxT = Math.max(...tVals);
    const minW = Math.min(...wVals);
    const maxW = Math.max(...wVals);

    const marginT = Math.max(5, (maxT - minT) * 0.25);
    const marginW = Math.max(0.003, (maxW - minW) * 0.25);

    setBounds({
      tdbMin: Number((minT - marginT).toFixed(1)),
      tdbMax: Number((maxT + marginT).toFixed(1)),
      wMin: Number(Math.max(0, minW - marginW).toFixed(5)),
      wMax: Number((maxW + marginW).toFixed(5)),
    });
  };

  const handleCenterCycle = () => {
    if (points.length === 0) return;
    const tVals = points.map((p) => p.tdb);
    const wVals = points.map((p) => p.w);
    const centerT = (Math.min(...tVals) + Math.max(...tVals)) / 2;
    const centerW = (Math.min(...wVals) + Math.max(...wVals)) / 2;
    const spanT = bounds.tdbMax - bounds.tdbMin;
    const spanW = bounds.wMax - bounds.wMin;
    setBounds({
      tdbMin: Number((centerT - spanT / 2).toFixed(2)),
      tdbMax: Number((centerT + spanT / 2).toFixed(2)),
      wMin: Number(Math.max(0, centerW - spanW / 2).toFixed(5)),
      wMax: Number((centerW + spanW / 2).toFixed(5)),
    });
  };

  const handleResetBounds = () => {
    setBounds(DEFAULT_BOUNDS);
  };

  // Mathematically exact SVG cursor coordinate resolution via SVG CTM (accounts for viewBox, preserveAspectRatio letterboxing and DPI)
  const getSvgCursorPoint = useCallback(
    (e: React.MouseEvent | MouseEvent | React.WheelEvent): { x: number; y: number } => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const transformed = pt.matrixTransform(ctm.inverse());
        return { x: transformed.x, y: transformed.y };
      }
      // Geometric fallback
      const rect = svg.getBoundingClientRect();
      const scale = Math.min(rect.width / viewBoxWidth, rect.height / viewBoxHeight);
      const offsetX = (rect.width - viewBoxWidth * scale) / 2;
      const offsetY = (rect.height - viewBoxHeight * scale) / 2;
      return {
        x: (e.clientX - rect.left - offsetX) / scale,
        y: (e.clientY - rect.top - offsetY) / scale,
      };
    },
    [viewBoxWidth, viewBoxHeight]
  );

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const { x: rawPx, y: rawPy } = getSvgCursorPoint(e);

    const normX = Math.max(0, Math.min(1, (rawPx - margin.left) / plotWidth));
    const normY = Math.max(0, Math.min(1, (margin.top + plotHeight - rawPy) / plotHeight));

    const factor = e.deltaY < 0 ? 0.88 : 1.14;

    const spanT = bounds.tdbMax - bounds.tdbMin;
    const spanW = bounds.wMax - bounds.wMin;

    const newSpanT = Math.min(90, Math.max(6, spanT * factor));
    const newSpanW = Math.min(0.05, Math.max(0.002, spanW * factor));

    const cursorT = bounds.tdbMin + normX * spanT;
    const cursorW = bounds.wMin + normY * spanW;

    setBounds({
      tdbMin: Number((cursorT - normX * newSpanT).toFixed(2)),
      tdbMax: Number((cursorT + (1 - normX) * newSpanT).toFixed(2)),
      wMin: Number(Math.max(0, cursorW - normY * newSpanW).toFixed(5)),
      wMax: Number((cursorW + (1 - normY) * newSpanW).toFixed(5)),
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggedPointId) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsPanning(true);
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      bounds: { ...bounds },
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const { x: rawPx, y: rawPy } = getSvgCursorPoint(e);

    if (draggedPointId) {
      const [tdb, w] = pixelToCoord(rawPx, rawPy);
      onUpdatePointCoordinates(draggedPointId, tdb, Math.max(0, w));
      return;
    }

    if (isPanning) {
      const rect = svgRef.current.getBoundingClientRect();
      const scale = Math.min(rect.width / viewBoxWidth, rect.height / viewBoxHeight);
      const plotPixelWidth = Math.max(10, plotWidth * scale);
      const plotPixelHeight = Math.max(10, plotHeight * scale);

      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;

      const spanT = panStartRef.current.bounds.tdbMax - panStartRef.current.bounds.tdbMin;
      const spanW = panStartRef.current.bounds.wMax - panStartRef.current.bounds.wMin;

      const deltaT = -(dx / plotPixelWidth) * spanT;
      const deltaW = (dy / plotPixelHeight) * spanW;

      setBounds({
        tdbMin: Number((panStartRef.current.bounds.tdbMin + deltaT).toFixed(2)),
        tdbMax: Number((panStartRef.current.bounds.tdbMax + deltaT).toFixed(2)),
        wMin: Number(Math.max(0, panStartRef.current.bounds.wMin + deltaW).toFixed(5)),
        wMax: Number((panStartRef.current.bounds.wMax + deltaW).toFixed(5)),
      });
      return;
    }

    // Inspect thermodynamics under cursor if inside plot
    if (
      rawPx >= margin.left &&
      rawPx <= margin.left + plotWidth &&
      rawPy >= margin.top &&
      rawPy <= margin.top + plotHeight
    ) {
      const [tdb, w] = pixelToCoord(rawPx, rawPy);
      const rawW = Math.max(0, w);
      const wSat = getSaturationHumidityRatio(tdb, pressure);
      const safeW = Math.min(wSat, rawW);
      const isSuperSaturated = rawW > wSat * 1.002;

      const rh = isSuperSaturated ? 100 : getRelativeHumidity(tdb, safeW, pressure);
      const h = getEnthalpy(tdb, safeW);
      const twb = getWetBulb(tdb, safeW, pressure);
      const pv = getPvFromHumidityRatio(safeW, pressure);
      const tdp = getDewPoint(pv);
      const v = getSpecificVolume(tdb, safeW, pressure);

      setHoverCoords({
        x: rawPx,
        y: rawPy,
        tdb: Number(tdb.toFixed(2)),
        w: Number(rawW.toFixed(5)),
        rh,
        h,
        twb,
        tdp,
        v,
      });
    } else {
      setHoverCoords(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedPointId(null);
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (draggedPointId || isPanning) return;
    if (e.detail === 2) {
      if (hoverCoords) {
        onAddPointAtCoordinates(hoverCoords.tdb, hoverCoords.w);
      }
    }
  };

  // ---------------- DYNAMIC AXES TICKS GENERATION ----------------
  const xTicks = useMemo(() => {
    const span = bounds.tdbMax - bounds.tdbMin;
    const step = span > 50 ? 10 : span > 25 ? 5 : span > 12 ? 2 : 1;
    const start = Math.ceil(bounds.tdbMin / step) * step;
    const ticks: number[] = [];
    for (let t = start; t <= bounds.tdbMax; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [bounds.tdbMin, bounds.tdbMax]);

  const yTicks = useMemo(() => {
    const span = bounds.wMax - bounds.wMin;
    const step = span > 0.02 ? 0.005 : span > 0.01 ? 0.002 : span > 0.004 ? 0.001 : 0.0005;
    const start = Math.max(0, Math.ceil(bounds.wMin / step) * step);
    const ticks: number[] = [];
    for (let w = start; w <= bounds.wMax; w += step) {
      ticks.push(Number(w.toFixed(5)));
    }
    return ticks;
  }, [bounds.wMin, bounds.wMax]);

  // Generate curves data (cached and strictly bounded)
  const chartCurves = useMemo(() => {
    // 1. Saturation curve (RH = 100%) - strictly bounded to bounds.wMax
    const satPoints: Array<[number, number]> = [];
    const tStep = 0.5;
    for (let t = bounds.tdbMin; t <= bounds.tdbMax; t += tStep) {
      const ws = getSaturationHumidityRatio(t, pressure);
      if (ws <= bounds.wMax) {
        satPoints.push(coordToPixel(t, ws));
      } else {
        let low = t - tStep;
        let high = t;
        for (let iter = 0; iter < 10; iter++) {
          const mid = (low + high) / 2;
          if (getSaturationHumidityRatio(mid, pressure) < bounds.wMax) {
            low = mid;
          } else {
            high = mid;
          }
        }
        satPoints.push(coordToPixel((low + high) / 2, bounds.wMax));
        break;
      }
    }
    const satPath =
      satPoints.length > 0
        ? `M ${satPoints.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`
        : '';

    // 2. Relative Humidity curves (10% to 90%)
    const rhCurves: Array<{ rh: number; path: string }> = [];
    for (let rh = 10; rh <= 90; rh += 10) {
      const pts: Array<[number, number]> = [];
      for (let t = bounds.tdbMin; t <= bounds.tdbMax; t += 0.5) {
        const w = getWFromTdbRh(t, rh, pressure);
        if (w <= bounds.wMax && w >= bounds.wMin) {
          pts.push(coordToPixel(t, w));
        } else if (pts.length > 0 && pts[pts.length - 1][1] > margin.top) {
          let low = t - 0.5;
          let high = t;
          for (let iter = 0; iter < 8; iter++) {
            const mid = (low + high) / 2;
            if (getWFromTdbRh(mid, rh, pressure) < bounds.wMax) {
              low = mid;
            } else {
              high = mid;
            }
          }
          pts.push(coordToPixel((low + high) / 2, bounds.wMax));
          break;
        }
      }
      if (pts.length > 1) {
        rhCurves.push({
          rh,
          path: `M ${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`,
        });
      }
    }

    // 3. Wet-Bulb Temperature lines (Twb)
    const twbLines: Array<{ twb: number; path: string }> = [];
    for (let twb = -10; twb <= 40; twb += 5) {
      const pts: Array<[number, number]> = [];
      const wSat = getSaturationHumidityRatio(twb, pressure);

      if (wSat <= bounds.wMax && wSat >= bounds.wMin) {
        pts.push(coordToPixel(twb, wSat));
      }

      for (let t = twb + 0.5; t <= bounds.tdbMax; t += 0.5) {
        const w = getWFromTdbTwb(t, twb, pressure);
        if (w >= bounds.wMin && w <= bounds.wMax) {
          if (pts.length === 0) {
            let low = t - 0.5;
            let high = t;
            for (let iter = 0; iter < 8; iter++) {
              const mid = (low + high) / 2;
              if (getWFromTdbTwb(mid, twb, pressure) > bounds.wMax) {
                low = mid;
              } else {
                high = mid;
              }
            }
            pts.push(coordToPixel((low + high) / 2, bounds.wMax));
          }
          pts.push(coordToPixel(t, w));
        }
      }
      if (pts.length > 1) {
        twbLines.push({
          twb,
          path: `M ${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`,
        });
      }
    }

    // 4. Specific Enthalpy lines (h: 10 to 140 kJ/kg)
    const enthalpyLines: Array<{ h: number; path: string }> = [];
    for (let h = 10; h <= 140; h += 10) {
      const pts: Array<[number, number]> = [];
      for (let t = bounds.tdbMin; t <= bounds.tdbMax; t += 1) {
        const w = getWFromEnthalpy(t, h);
        if (w >= bounds.wMin && w <= bounds.wMax) {
          pts.push(coordToPixel(t, w));
        }
      }
      if (pts.length > 1) {
        enthalpyLines.push({
          h,
          path: `M ${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`,
        });
      }
    }

    // 5. Specific Volume lines (v: 0.78 to 0.96 m³/kg)
    const volumeLines: Array<{ v: number; path: string }> = [];
    for (let v = 0.78; v <= 0.98; v += 0.02) {
      const pts: Array<[number, number]> = [];
      for (let t = bounds.tdbMin; t <= bounds.tdbMax; t += 1) {
        const tK = t + 273.15;
        const Rda = 287.058;
        const pPa = pressure * 1000;
        const w = Math.max(0, (v * pPa) / (461.5 * tK) - (Rda / 461.5));
        if (w >= bounds.wMin && w <= bounds.wMax) {
          pts.push(coordToPixel(t, w));
        }
      }
      if (pts.length > 1) {
        volumeLines.push({
          v: Number(v.toFixed(2)),
          path: `M ${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`,
        });
      }
    }

    // Comfort Polygons
    const buildComfortPoly = (ptsList: Array<{ tdb: number; rh: number }>) => {
      const pts = ptsList.map((p) => {
        const w = getWFromTdbRh(p.tdb, p.rh, pressure);
        return coordToPixel(p.tdb, Math.min(bounds.wMax, Math.max(bounds.wMin, w)));
      });
      return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    };

    const summerComfortPoly = buildComfortPoly(ASHRAE55_SUMMER);
    const winterComfortPoly = buildComfortPoly(ASHRAE55_WINTER);

    const isEnWinter = layers.comfortEnSeason === 'winter';
    const enCat1Poly = buildComfortPoly(
      isEnWinter ? UNE_EN_16798_CAT1_WINTER : UNE_EN_16798_CAT1_SUMMER
    );
    const enCat2Poly = buildComfortPoly(
      isEnWinter ? UNE_EN_16798_CAT2_WINTER : UNE_EN_16798_CAT2_SUMMER
    );
    const enCat3Poly = buildComfortPoly(
      isEnWinter ? UNE_EN_16798_CAT3_WINTER : UNE_EN_16798_CAT3_SUMMER
    );

    return {
      satPath,
      rhCurves,
      twbLines,
      enthalpyLines,
      volumeLines,
      summerComfortPoly,
      winterComfortPoly,
      enCat1Poly,
      enCat2Poly,
      enCat3Poly,
    };
  }, [bounds, coordToPixel, pressure, layers.comfortEnSeason]);

  // Technical Theme Styling Definition
  const themeStyles = useMemo(() => {
    if (chartTheme === 'ashrae_classic') {
      return {
        canvasBg: '#FEFEFA',
        plotBg: '#FAF9F4',
        frameStroke: '#15803D',
        gridTdbMajor: '#86EFAC',
        gridTdbMinor: '#DCFCE7',
        gridWMajor: '#86EFAC',
        gridWMinor: '#DCFCE7',
        satStroke: '#15803D',
        satWidth: 2.4,
        rhStroke: '#166534',
        rhMajorWidth: 1.8,
        rhMinorWidth: 1.1,
        twbStroke: '#15803D',
        twbWidth: 1.1,
        twbDash: '4,2',
        enthalpyStroke: '#14532D',
        enthalpyWidth: 1.0,
        volumeStroke: '#166534',
        volumeWidth: 0.9,
        volumeDash: '6,3',
        deviationStroke: '#D97706',
        axisLine: '#15803D',
        axisText: '#14532D',
        axisLabel: '#14532D',
        titleColor: '#14532D',
        hudBg: 'rgba(254, 254, 250, 0.95)',
        hudBorder: 'rgba(21, 128, 61, 0.4)',
        hudText: '#14532D',
        isDark: false,
      };
    } else if (chartTheme === 'valcon_color') {
      return {
        canvasBg: '#FFFFFF',
        plotBg: '#F8FAFC',
        frameStroke: '#0F172A',
        gridTdbMajor: '#94A3B8',
        gridTdbMinor: '#E2E8F0',
        gridWMajor: '#94A3B8',
        gridWMinor: '#E2E8F0',
        satStroke: '#0284C7',
        satWidth: 2.5,
        rhStroke: '#7C3AED',
        rhMajorWidth: 1.8,
        rhMinorWidth: 1.2,
        twbStroke: '#16A34A',
        twbWidth: 1.2,
        twbDash: undefined,
        enthalpyStroke: '#0284C7',
        enthalpyWidth: 1.0,
        volumeStroke: '#B45309',
        volumeWidth: 1.0,
        volumeDash: '6,3',
        deviationStroke: '#EA580C',
        axisLine: '#0F172A',
        axisText: '#0F172A',
        axisLabel: '#0F172A',
        titleColor: '#0F172A',
        hudBg: 'rgba(255, 255, 255, 0.95)',
        hudBorder: 'rgba(2, 132, 199, 0.4)',
        hudText: '#0F172A',
        isDark: false,
      };
    } else {
      // dark_blueprint
      return {
        canvasBg: '#0A0A0C',
        plotBg: '#090D16',
        frameStroke: '#334155',
        gridTdbMajor: '#1E293B',
        gridTdbMinor: '#131B2E',
        gridWMajor: '#1E293B',
        gridWMinor: '#131B2E',
        satStroke: '#38BDF8',
        satWidth: 2.5,
        rhStroke: '#0284C7',
        rhMajorWidth: 1.8,
        rhMinorWidth: 1.2,
        twbStroke: '#1E40AF',
        twbWidth: 1.2,
        twbDash: undefined,
        enthalpyStroke: '#334155',
        enthalpyWidth: 1.0,
        volumeStroke: '#1E3A5F',
        volumeWidth: 1.0,
        volumeDash: '5,3',
        deviationStroke: '#F59E0B',
        axisLine: '#64748B',
        axisText: '#94A3B8',
        axisLabel: '#E2E8F0',
        titleColor: '#F8FAFC',
        hudBg: 'rgba(15, 23, 42, 0.95)',
        hudBorder: 'rgba(56, 189, 248, 0.4)',
        hudText: '#F8FAFC',
        isDark: true,
      };
    }
  }, [chartTheme]);

  // Saturated Enthalpy Ticks along the 100% RH boundary and top margin
  const satEnthalpyTicks = useMemo(() => {
    return computeSaturationEnthalpyTicks(pressure, bounds.tdbMin, bounds.tdbMax, bounds.wMax);
  }, [pressure, bounds.tdbMin, bounds.tdbMax, bounds.wMax]);

  // Enthalpy Deviation Curves (curvas de desviación entálpica)
  const enthalpyDeviations = useMemo(() => {
    return computeEnthalpyDeviations(pressure, bounds.tdbMin, bounds.tdbMax, bounds.wMin, bounds.wMax);
  }, [pressure, bounds.tdbMin, bounds.tdbMax, bounds.wMin, bounds.wMax]);

  // Saturation Line Wet-Bulb Temperature Ticks
  const satTempTicks = useMemo(() => {
    const temps = [-10, -5, 0, 5, 10, 15, 20, 25, 30, 35];
    return temps
      .filter((t) => t >= bounds.tdbMin && t <= bounds.tdbMax)
      .map((t) => {
        const ws = getSaturationHumidityRatio(t, pressure);
        if (ws > bounds.wMax) return null;
        const [px, py] = coordToPixel(t, ws);
        return { t, px, py };
      })
      .filter(Boolean) as Array<{ t: number; px: number; py: number }>;
  }, [bounds.tdbMin, bounds.tdbMax, bounds.wMax, coordToPixel, pressure]);

  // Sensible Heat Factor (SHF / FCS) scale on the far right vertical border (Images 1 and 2)
  const shfScaleTicks = useMemo(() => {
    const values = [0.36, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00];
    const tRef = 24.0;
    const wRef = getWFromTdbRh(tRef, 50, pressure);
    const tMax = bounds.tdbMax;
    const deltaT = tMax - tRef;

    return values.map((shr) => {
      const dWdT = getSlopeFromSHR(shr);
      const wIntersect = wRef + dWdT * deltaT;
      const [, py] = coordToPixel(tMax, wIntersect);
      const isMajor = [0.36, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00].includes(shr);
      return {
        shr,
        label: shr === 1.0 ? '1.00' : shr.toFixed(2),
        py,
        isMajor,
        inRange: py >= margin.top - 5 && py <= margin.top + plotHeight + 5,
      };
    });
  }, [bounds.tdbMax, coordToPixel, margin.top, plotHeight, pressure]);

  return (
    <div
      className="relative w-full h-full flex flex-col select-none overflow-hidden rounded-xl border transition-colors"
      style={{
        backgroundColor: themeStyles.canvasBg,
        borderColor: themeStyles.frameStroke,
      }}
    >
      {/* Top Floating Glassmorphism Controls Toolbar */}
      <div className="absolute top-2 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-[#0a0a0c]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.15)] text-xs shadow-2xl">
        <span className="text-white font-primary font-bold text-xs">
          {chartType === 'carrier' ? 'Diagrama Carrier (ASHRAE)' : 'Diagrama Mollier (h-x)'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="font-mono text-[#fbbf24] font-semibold">P = {pressure.toFixed(1)} kPa</span>

        <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

        {/* Technical Theme Switcher */}
        <div className="flex items-center gap-1 bg-[#1a1a1c] p-0.5 rounded-[6px] border border-[rgba(255,255,255,0.1)]">
          <button
            onClick={() => setChartTheme('ashrae_classic')}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold transition-all ${
              chartTheme === 'ashrae_classic'
                ? 'bg-[#15803D] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Carta Oficial ASHRAE Nº 1 (Papel Técnico / Verde Canónico)"
          >
            ASHRAE Oficial
          </button>
          <button
            onClick={() => setChartTheme('valcon_color')}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold transition-all ${
              chartTheme === 'valcon_color'
                ? 'bg-[#0284C7] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Carta Valcon (Polícromo Técnico)"
          >
            Valcon
          </button>
          <button
            onClick={() => setChartTheme('dark_blueprint')}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold transition-all ${
              chartTheme === 'dark_blueprint'
                ? 'bg-[#334155] text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Blueprint CAD (Modo Oscuro)"
          >
            CAD
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

        {/* ASHRAE Protractor Toggle */}
        <button
          onClick={() => setShowProtractor((prev) => !prev)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-semibold transition-all ${
            showProtractor
              ? 'bg-[#15803D]/25 text-[#4ade80] border border-[#15803D]/50'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/10'
          }`}
          title="Transportador de Factor de Calor Sensible (SHR / Sensible Heat Ratio)"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Transportador SHR</span>
        </button>

        {/* Active SHR Indicator */}
        {selectedSHR !== null && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#d97706]/30 border border-[#d97706]/60 text-amber-300 text-xs font-mono font-bold animate-fadeIn">
            <span>SHR = {selectedSHR.toFixed(2)}</span>
            <button
              onClick={() => setSelectedSHR(null)}
              className="text-amber-400 hover:text-white ml-0.5 p-0.5 rounded hover:bg-amber-900/50"
              title="Borrar recta de maniobra SHR"
            >
              ✕
            </button>
          </div>
        )}

        {/* Enthalpy Deviations Toggle */}
        <button
          onClick={() => setShowEnthalpyDeviations((prev) => !prev)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-semibold transition-all ${
            showEnthalpyDeviations
              ? 'bg-[#d97706]/25 text-[#fbbf24] border border-[#d97706]/50'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/10'
          }`}
          title="Curvas de Desviación de Entalpía (Enthalpy Deviation Curves)"
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Desv. Δh</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

        {/* Zoom All / Fit to Active Cycle */}
        <button
          onClick={handleZoomAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/50 hover:text-white transition-colors"
          title="Ajustar el diagrama al ciclo activo de puntos"
        >
          <Maximize2 className="w-3 h-3 text-amber-400" />
          <span>Ajustar Todo</span>
        </button>

        {/* Center Cycle */}
        <button
          onClick={handleCenterCycle}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/50 hover:text-white transition-colors"
          title="Centrar el ciclo en la ventana"
        >
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span>Centrar</span>
        </button>

        {/* Reset 1:1 Default */}
        <button
          onClick={handleResetBounds}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Restablecer diagrama estándar completo (-10°C a 55°C)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Thermodynamic Inspector HUD (under cursor) */}
      {hoverCoords && (
        <div className="absolute top-2 right-3 z-20 bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/40 text-xs shadow-2xl pointer-events-none">
          <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
            <div>
              <span className="text-slate-400">Tbs: </span>
              <span className="text-cyan-300 font-bold">
                {units === 'IP'
                  ? `${UnitConvert.cToF(hoverCoords.tdb).toFixed(1)}°F`
                  : `${hoverCoords.tdb.toFixed(1)}°C`}
              </span>
            </div>
            <div>
              <span className="text-slate-400">HR: </span>
              <span className="text-emerald-400 font-bold">{hoverCoords.rh.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">Tbh: </span>
              <span className="text-blue-300 font-medium">
                {units === 'IP'
                  ? `${UnitConvert.cToF(hoverCoords.twb).toFixed(1)}°F`
                  : `${hoverCoords.twb.toFixed(1)}°C`}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Tpr: </span>
              <span className="text-indigo-300 font-medium">
                {units === 'IP'
                  ? `${UnitConvert.cToF(hoverCoords.tdp).toFixed(1)}°F`
                  : `${hoverCoords.tdp.toFixed(1)}°C`}
              </span>
            </div>
            <div>
              <span className="text-slate-400">W: </span>
              <span className="text-amber-300 font-bold">
                {units === 'IP'
                  ? `${(hoverCoords.w * 7000).toFixed(1)} gr/lb`
                  : `${(hoverCoords.w * 1000).toFixed(2)} g/kg`}
              </span>
            </div>
            <div>
              <span className="text-slate-400">h: </span>
              <span className="text-rose-300 font-medium">
                {units === 'IP'
                  ? `${UnitConvert.kJkgToBtuLb(hoverCoords.h).toFixed(1)} BTU/lb`
                  : `${hoverCoords.h.toFixed(1)} kJ/kg`}
              </span>
            </div>
            <div>
              <span className="text-slate-400">v: </span>
              <span className="text-purple-300 font-medium">
                {units === 'IP'
                  ? `${(hoverCoords.v * 16.0185).toFixed(2)} ft³/lb`
                  : `${hoverCoords.v.toFixed(3)} m³/kg`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main SVG Canvas: Diagram takes full container width and height */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleSvgClick}
        onDoubleClick={handleZoomAll}
      >
        <defs>
          {/* Strict plot area clipPath to guarantee zero line leaks outside plot frame */}
          <clipPath id="chart-plot-clip">
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
            />
          </clipPath>

          {/* Arrow markers for process lines */}
          <marker
            id="process-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
          </marker>
          <marker
            id="process-arrow-amber"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F59E0B" />
          </marker>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Fixed Plot Background Rectangle (Anchored tightly to window) */}
        <rect
          x={margin.left}
          y={margin.top}
          width={plotWidth}
          height={plotHeight}
          fill={themeStyles.plotBg}
          stroke={themeStyles.frameStroke}
          strokeWidth="1.5"
        />

        {/* 2. Diagram Contents (Scaled & Panned strictly inside plot area) */}
        <g clipPath="url(#chart-plot-clip)">
          {/* Grid lines: Dry-bulb Temperature vertical lines */}
          {layers.grid && (
            <g className="grid-tdb" strokeWidth="0.8">
              {xTicks.map((t) => {
                const [x1] = coordToPixel(t, bounds.wMin);
                const isMajor = t % 10 === 0;
                return (
                  <line
                    key={`grid-t-${t}`}
                    x1={x1}
                    y1={margin.top}
                    x2={x1}
                    y2={margin.top + plotHeight}
                    stroke={isMajor ? themeStyles.gridTdbMajor : themeStyles.gridTdbMinor}
                    strokeDasharray={isMajor ? undefined : '2,4'}
                  />
                );
              })}
            </g>
          )}

          {/* Grid lines: Humidity Ratio horizontal lines */}
          {layers.grid && (
            <g className="grid-w" strokeWidth="0.8">
              {yTicks.map((w) => {
                const [, y1] = coordToPixel(bounds.tdbMin, w);
                const isMajor = Math.round(w * 1000) % 5 === 0;
                return (
                  <line
                    key={`grid-w-${w}`}
                    x1={margin.left}
                    y1={y1}
                    x2={margin.left + plotWidth}
                    y2={y1}
                    stroke={isMajor ? themeStyles.gridWMajor : themeStyles.gridWMinor}
                    strokeDasharray={isMajor ? undefined : '2,4'}
                  />
                );
              })}
            </g>
          )}

          {/* Specific Volume Lines (v) */}
          {layers.volumeLines && (
            <g className="volume-lines" stroke={themeStyles.volumeStroke} strokeWidth={themeStyles.volumeWidth} strokeDasharray={themeStyles.volumeDash}>
              {chartCurves.volumeLines.map(({ v, path }) => (
                <path key={`v-${v}`} d={path} fill="none" opacity="0.65" />
              ))}
            </g>
          )}

          {/* Specific Enthalpy Lines (h) */}
          {layers.enthalpyLines && (
            <g className="enthalpy-lines" stroke={themeStyles.enthalpyStroke} strokeWidth={themeStyles.enthalpyWidth}>
              {chartCurves.enthalpyLines.map(({ h, path }) => (
                <path key={`h-${h}`} d={path} fill="none" opacity="0.55" />
              ))}
            </g>
          )}

          {/* Wet Bulb Lines (Twb) */}
          {layers.twbLines && (
            <g className="twb-lines" stroke={themeStyles.twbStroke} strokeWidth={themeStyles.twbWidth} strokeDasharray={themeStyles.twbDash}>
              {chartCurves.twbLines.map(({ twb, path }) => (
                <path key={`twb-${twb}`} d={path} fill="none" opacity="0.75" />
              ))}
            </g>
          )}

          {/* Enthalpy Deviation Lines (Curvas de Desviación de Entalpía ASHRAE) */}
          {showEnthalpyDeviations && (
            <g className="enthalpy-deviation-lines">
              {enthalpyDeviations.map(({ deviation, points: pts }) => {
                if (pts.length < 2) return null;
                const pixelPts = pts.map((p) => coordToPixel(p.tdb, p.w));
                const pathD = `M ${pixelPts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`;
                const midPt = pixelPts[Math.floor(pixelPts.length * 0.45)];
                return (
                  <g key={`dev-${deviation}`}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={themeStyles.deviationStroke}
                      strokeWidth="1.1"
                      strokeDasharray="4,3"
                      opacity="0.85"
                    />
                    {midPt && (
                      <g transform={`translate(${midPt[0]}, ${midPt[1]})`}>
                        <rect x="-14" y="-7" width="28" height="13" rx="3" fill={themeStyles.plotBg} stroke={themeStyles.deviationStroke} strokeWidth="0.8" opacity="0.9" />
                        <text x="0" y="2.5" textAnchor="middle" fill={themeStyles.deviationStroke} fontSize="7.5" fontWeight="bold" fontFamily="Fira Code, monospace">
                          {deviation.toFixed(1)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Comfort Zones: ASHRAE 55 */}
          {layers.comfortSummer && (
            <polygon
              points={chartCurves.summerComfortPoly}
              fill="rgba(16, 185, 129, 0.15)"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
          )}

          {layers.comfortWinter && (
            <polygon
              points={chartCurves.winterComfortPoly}
              fill="rgba(245, 158, 11, 0.15)"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
          )}

          {/* Comfort Zones: Marco Europeo UNE-EN ISO 7730 & UNE-EN 16798-1 */}
          {layers.comfortEnCat3 && (
            <polygon
              points={chartCurves.enCat3Poly}
              fill="rgba(99, 102, 241, 0.12)"
              stroke="#6366F1"
              strokeWidth="1.2"
              strokeDasharray="3,3"
            />
          )}

          {layers.comfortEnCat2 && (
            <polygon
              points={chartCurves.enCat2Poly}
              fill="rgba(6, 182, 212, 0.18)"
              stroke="#06B6D4"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          )}

          {layers.comfortEnCat1 && (
            <polygon
              points={chartCurves.enCat1Poly}
              fill="rgba(168, 85, 247, 0.2)"
              stroke="#A855F7"
              strokeWidth="1.6"
            />
          )}

          {/* Relative Humidity Curves (10% to 90%) */}
          {layers.rhCurves && (
            <g className="rh-curves" stroke={themeStyles.rhStroke}>
              {chartCurves.rhCurves.map(({ rh, path }) => (
                <g key={`rh-${rh}`}>
                  <path
                    d={path}
                    fill="none"
                    opacity={rh === 50 ? 0.95 : 0.65}
                    strokeWidth={rh === 50 ? themeStyles.rhMajorWidth : themeStyles.rhMinorWidth}
                  />
                </g>
              ))}
            </g>
          )}

          {/* Saturation Curve (RH = 100%) */}
          <path
            d={chartCurves.satPath}
            fill="none"
            stroke={themeStyles.satStroke}
            strokeWidth={themeStyles.satWidth}
            filter={themeStyles.isDark ? 'url(#glow)' : undefined}
          />

          {/* Saturation Line Wet-Bulb Temperature Graduations */}
          <g className="sat-temp-ticks pointer-events-none">
            {satTempTicks.map(({ t, px, py }) => {
              const displayVal = units === 'IP' ? UnitConvert.cToF(t).toFixed(0) : t;
              return (
                <g key={`sat-temp-${t}`} transform={`translate(${px}, ${py})`}>
                  <line x1="-5" y1="-5" x2="3" y2="3" stroke={themeStyles.satStroke} strokeWidth="1.2" />
                  <text
                    x="-8"
                    y="-4"
                    textAnchor="end"
                    fill={themeStyles.axisText}
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="Fira Code, monospace"
                  >
                    {displayVal}°
                  </text>
                </g>
              );
            })}
          </g>

          {/* Processes lines layer */}
          {layers.processes && (
            <g className="processes-layer">
              {processes.map((proc) => {
                const ptFrom = points.find((p) => p.id === proc.fromPointId);
                const ptTo = points.find((p) => p.id === proc.toPointId);
                if (!ptFrom || !ptTo) return null;

                const [x1, y1] = coordToPixel(ptFrom.tdb, ptFrom.w);
                const [x2, y2] = coordToPixel(ptTo.tdb, ptTo.w);

                const procColor = proc.color || (themeStyles.isDark ? '#38BDF8' : '#0284C7');
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                return (
                  <g key={proc.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={procColor}
                      strokeWidth="3.5"
                      strokeDasharray={proc.type === 'zone_load' ? '6,3' : undefined}
                      markerEnd={proc.type === 'mixing' ? 'url(#process-arrow-amber)' : 'url(#process-arrow)'}
                    />
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-30"
                        y="-10"
                        width="60"
                        height="18"
                        rx="4"
                        fill={themeStyles.plotBg}
                        stroke={procColor}
                        strokeWidth="1"
                        opacity="0.92"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fill={themeStyles.axisText}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {proc.qTotal.toFixed(1)} kW
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* Interactive State Points */}
          <g className="state-points-layer">
            {points.map((pt) => {
              const [px, py] = coordToPixel(pt.tdb, pt.w);
              const isSelected = pt.id === selectedPointId;

              return (
                <g
                  key={pt.id}
                  transform={`translate(${px}, ${py})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPoint(pt.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedPointId(pt.id);
                    onSelectPoint(pt.id);
                  }}
                >
                  {isSelected && (
                    <circle
                      r="14"
                      fill="none"
                      stroke={pt.color}
                      strokeWidth="2"
                      strokeDasharray="3,3"
                      className="animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                  )}
                  <circle
                    r="8"
                    fill={themeStyles.isDark ? '#0F172A' : '#FFFFFF'}
                    stroke={pt.color}
                    strokeWidth={isSelected ? '3' : '2'}
                  />
                  <circle r="4" fill={pt.color} />

                  {layers.pointLabels && (
                    <g transform="translate(12, -12)">
                      <rect
                        x="0"
                        y="-12"
                        width={pt.name.length * 7 + 16}
                        height="20"
                        rx="4"
                        fill={themeStyles.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)'}
                        stroke={isSelected ? pt.color : themeStyles.frameStroke}
                        strokeWidth="1"
                      />
                      <text
                        x="8"
                        y="2"
                        fill={themeStyles.isDark ? '#F8FAFC' : '#0F172A'}
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {pt.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Official ASHRAE / Valcon Title Block inside plot in upper left */}
          {(chartTheme === 'ashrae_classic' || chartTheme === 'valcon_color') && (
            <g className="official-title-block pointer-events-none" transform={`translate(${margin.left + 16}, ${margin.top + 18})`}>
              <rect
                x="0"
                y="0"
                width="230"
                height="50"
                rx="4"
                fill={themeStyles.canvasBg}
                stroke={themeStyles.frameStroke}
                strokeWidth="1"
                opacity="0.92"
              />
              <text x="12" y="15" fill={themeStyles.titleColor} fontSize="10.5" fontWeight="bold" fontFamily="Roboto Condensed, sans-serif" letterSpacing="0.4">
                ASHRAE PSYCHROMETRIC CHART NO. 1
              </text>
              <text x="12" y="27" fill={themeStyles.axisText} fontSize="8" fontWeight="600" fontFamily="Roboto Condensed, sans-serif">
                NORMAL TEMPERATURE · SI UNITS · 101.325 kPa (NIVEL DEL MAR)
              </text>
              <text x="12" y="38" fill={themeStyles.axisText} fontSize="6.8" fontFamily="Roboto Condensed, sans-serif" opacity="0.8">
                BAROMÉTRICA: {pressure.toFixed(3)} kPa · ASHRAE FUNDAMENTALS 2021
              </text>
            </g>
          )}

          {/* Interactive Official ASHRAE Protractor in Top-Left Area */}
          {showProtractor && chartType === 'carrier' && (
            <ASHRAEProtractor
              x0={margin.left + 235}
              y0={margin.top + 80}
              radius={72}
              plotWidth={plotWidth}
              plotHeight={plotHeight}
              spanT={bounds.tdbMax - bounds.tdbMin}
              spanW={bounds.wMax - bounds.wMin}
              pressure={pressure}
              theme={chartTheme}
              activeSHR={selectedSHR}
              onSelectSHR={(shr) => setSelectedSHR(shr)}
              coordToPixel={coordToPixel}
              selectedPoint={points.find((p) => p.id === selectedPointId) || null}
            />
          )}

          {/* Ray line from ASHRAE Reference Point to right SHF Scale when selected */}
          {selectedSHR !== null && (() => {
            const tRef = 24.0;
            const wRef = getWFromTdbRh(tRef, 50, pressure);
            const [rx, ry] = coordToPixel(tRef, wRef);
            const dWdT = getSlopeFromSHR(selectedSHR);
            const deltaT = bounds.tdbMax - tRef;
            const wTarget = wRef + dWdT * deltaT;
            const [tx, ty] = coordToPixel(bounds.tdbMax, wTarget);

            return (
              <g className="shf-reference-ray pointer-events-none">
                <line
                  x1={rx}
                  y1={ry}
                  x2={tx}
                  y2={ty}
                  stroke="#F59E0B"
                  strokeWidth="1.6"
                  strokeDasharray="4,2"
                />
                <circle cx={tx} cy={ty} r="3" fill="#F59E0B" />
              </g>
            );
          })()}
        </g>

        {/* Outer Perimeter Enthalpy Scale (Escala Perimetral de Entalpía ASHRAE) */}
        <g className="perimeter-enthalpy-scale pointer-events-none">
          {satEnthalpyTicks.map((tick) => {
            const [px, py] = coordToPixel(tick.tdbSat, tick.wSat);
            const len = tick.isMajor ? 10 : 5;
            const xOut = px - len * 0.7;
            const yOut = py - len * 0.7;
            const xLabel = px - 18 * 0.7;
            const yLabel = py - 18 * 0.7;

            if (px < margin.left - 15 || py < margin.top - 15) return null;

            return (
              <g key={`sat-h-${tick.h}`}>
                <line
                  x1={px}
                  y1={py}
                  x2={xOut}
                  y2={yOut}
                  stroke={themeStyles.axisLine}
                  strokeWidth={tick.isMajor ? 1.2 : 0.7}
                />
                {tick.isMajor && (
                  <text
                    x={xLabel}
                    y={yLabel}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill={themeStyles.axisText}
                    fontSize="7.5"
                    fontWeight="bold"
                    fontFamily="Fira Code, monospace"
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            );
          })}
          <text
            x={margin.left + 90}
            y={margin.top - 14}
            fill={themeStyles.axisLabel}
            fontSize="8"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
            letterSpacing="0.4"
          >
            ENTALPÍA DE SATURACIÓN kJ/kg DE AIRE SECO
          </text>
        </g>

        {/* Sensible Heat Factor Vertical Scale (Margen Derecho - Carta Valcon / ASHRAE) */}
        <g className="shf-vertical-scale" transform={`translate(${margin.left + plotWidth + 34}, 0)`}>
          <line
            x1="0"
            y1={margin.top}
            x2="0"
            y2={margin.top + plotHeight}
            stroke={themeStyles.axisLine}
            strokeWidth="1.2"
          />
          {shfScaleTicks.map((tick) => {
            if (!tick.inRange) return null;
            const isSelected = selectedSHR === tick.shr;
            return (
              <g
                key={`shf-${tick.shr}`}
                transform={`translate(0, ${tick.py})`}
                className="cursor-pointer group"
                onClick={() => setSelectedSHR(isSelected ? null : tick.shr)}
              >
                {/* Hit area for clicking */}
                <line x1="-8" x2="26" stroke="transparent" strokeWidth="8" />
                <line
                  x1="0"
                  x2={tick.isMajor ? 6 : 3}
                  stroke={isSelected ? '#F59E0B' : themeStyles.axisLine}
                  strokeWidth={isSelected ? 2 : tick.isMajor ? 1.2 : 0.7}
                />
                {tick.isMajor && (
                  <text
                    x="9"
                    y="2.5"
                    fill={isSelected ? '#F59E0B' : themeStyles.axisText}
                    fontSize="7"
                    fontFamily="Fira Code, monospace"
                    fontWeight={isSelected ? 'bold' : '600'}
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            );
          })}
          <text
            x="26"
            y={margin.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(90, 26, ${margin.top + plotHeight / 2})`}
            fill={themeStyles.axisLabel}
            fontSize="8"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
          >
            FACTOR DE CALOR SENSIBLE (FCS / SHR)
          </text>
        </g>

        {/* Dynamic Precision Crosshairs and Alignment Indicators */}
        {hoverCoords && !isPanning && (
          <g className="precision-crosshairs pointer-events-none">
            {/* Vertical crosshair line to X-axis */}
            <line
              x1={hoverCoords.x}
              y1={margin.top}
              x2={hoverCoords.x}
              y2={margin.top + plotHeight}
              stroke={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
              strokeWidth="1.2"
              strokeDasharray="3,3"
              opacity="0.85"
            />
            {/* Horizontal crosshair line to Y-axis */}
            <line
              x1={margin.left}
              y1={hoverCoords.y}
              x2={margin.left + plotWidth}
              y2={hoverCoords.y}
              stroke={themeStyles.isDark ? '#F59E0B' : '#D97706'}
              strokeWidth="1.2"
              strokeDasharray="3,3"
              opacity="0.85"
            />
            {/* Cursor target reticle */}
            <circle
              cx={hoverCoords.x}
              cy={hoverCoords.y}
              r="4.5"
              fill="none"
              stroke={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
              strokeWidth="1.5"
            />
            <circle
              cx={hoverCoords.x}
              cy={hoverCoords.y}
              r="1.5"
              fill={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
            />

            {/* Compact On-Cursor Tag */}
            <g transform={`translate(${hoverCoords.x + 14}, ${hoverCoords.y - 12})`}>
              <rect
                x="0"
                y="-13"
                width="142"
                height="22"
                rx="4"
                fill={themeStyles.isDark ? 'rgba(10, 10, 12, 0.94)' : 'rgba(255, 255, 255, 0.95)'}
                stroke={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
                strokeWidth="1"
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.35))"
              />
              <text
                x="6"
                y="1.5"
                fill={themeStyles.isDark ? '#F8FAFC' : '#0F172A'}
                fontSize="8.5"
                fontFamily="Fira Code, monospace"
                fontWeight="600"
              >
                {units === 'IP'
                  ? `${UnitConvert.cToF(hoverCoords.tdb).toFixed(1)}°F · ${(hoverCoords.w * 7000).toFixed(0)}gr`
                  : `${hoverCoords.tdb.toFixed(1)}°C · ${(hoverCoords.w * 1000).toFixed(1)}g · ${hoverCoords.rh.toFixed(0)}%`}
              </text>
            </g>
          </g>
        )}

        {/* 3. Anchored Fixed X-Axis at Bottom of Plot */}
        <g className="x-axis" transform={`translate(0, ${margin.top + plotHeight})`}>
          <line
            x1={margin.left}
            y1="0"
            x2={margin.left + plotWidth}
            y2="0"
            stroke={themeStyles.axisLine}
            strokeWidth="1.5"
          />
          {xTicks.map((t) => {
            const [x] = coordToPixel(t, bounds.wMin);
            const displayVal = units === 'IP' ? UnitConvert.cToF(t).toFixed(0) : t;
            return (
              <g key={`x-tick-${t}`} transform={`translate(${x}, 0)`}>
                <line y1="0" y2="6" stroke={themeStyles.axisLine} strokeWidth="1.5" />
                <text
                  y="20"
                  textAnchor="middle"
                  fill={themeStyles.axisText}
                  fontSize="11"
                  fontFamily="Fira Code, monospace"
                >
                  {displayVal}
                </text>
              </g>
            );
          })}

          {/* Dynamic Active X Marker under cursor */}
          {hoverCoords && !isPanning && (
            <g transform={`translate(${hoverCoords.x}, 0)`} className="pointer-events-none">
              <polygon points="0,0 -4,6 4,6" fill={themeStyles.isDark ? '#38BDF8' : '#0284C7'} />
              <rect
                x="-26"
                y="6"
                width="52"
                height="16"
                rx="3"
                fill={themeStyles.isDark ? '#0F172A' : '#0284C7'}
                stroke={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
                strokeWidth="1"
              />
              <text
                x="0"
                y="17.5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="9"
                fontWeight="bold"
                fontFamily="Fira Code, monospace"
              >
                {units === 'IP'
                  ? `${UnitConvert.cToF(hoverCoords.tdb).toFixed(1)}°F`
                  : `${hoverCoords.tdb.toFixed(1)}°C`}
              </text>
            </g>
          )}

          <text
            x={margin.left + plotWidth / 2}
            y="38"
            textAnchor="middle"
            fill={themeStyles.axisLabel}
            fontSize="12"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
          >
            Temperatura de Bulbo Seco Tbs [{units === 'IP' ? '°F' : '°C'}]
          </text>
        </g>

        {/* 4. Anchored Fixed Y-Axis at Right of Plot */}
        <g className="y-axis" transform={`translate(${margin.left + plotWidth}, 0)`}>
          <line
            x1="0"
            y1={margin.top}
            x2="0"
            y2={margin.top + plotHeight}
            stroke={themeStyles.axisLine}
            strokeWidth="1.5"
          />
          {yTicks.map((w) => {
            const [, y] = coordToPixel(bounds.tdbMin, w);
            const displayVal =
              units === 'IP' ? (w * 7000).toFixed(0) : (w * 1000).toFixed(0);
            return (
              <g key={`y-tick-${w}`} transform={`translate(0, ${y})`}>
                <line x1="0" x2="6" stroke={themeStyles.axisLine} strokeWidth="1.5" />
                <text
                  x="10"
                  y="4"
                  fill={themeStyles.axisText}
                  fontSize="11"
                  fontFamily="Fira Code, monospace"
                >
                  {displayVal}
                </text>
              </g>
            );
          })}

          {/* Dynamic Active Y Marker under cursor */}
          {hoverCoords && !isPanning && (
            <g transform={`translate(0, ${hoverCoords.y})`} className="pointer-events-none">
              <polygon points="0,0 6,-4 6,4" fill={themeStyles.isDark ? '#F59E0B' : '#D97706'} />
              <rect
                x="6"
                y="-8"
                width="48"
                height="16"
                rx="3"
                fill={themeStyles.isDark ? '#0F172A' : '#D97706'}
                stroke={themeStyles.isDark ? '#F59E0B' : '#D97706'}
                strokeWidth="1"
              />
              <text
                x="30"
                y="3.5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="9"
                fontWeight="bold"
                fontFamily="Fira Code, monospace"
              >
                {units === 'IP'
                  ? `${(hoverCoords.w * 7000).toFixed(0)}gr`
                  : `${(hoverCoords.w * 1000).toFixed(2)}g`}
              </text>
            </g>
          )}
          <text
            x="48"
            y={margin.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(90, 48, ${margin.top + plotHeight / 2})`}
            fill={themeStyles.axisLabel}
            fontSize="12"
            fontWeight="bold"
            fontFamily="Roboto Condensed, sans-serif"
          >
            Humedad Específica W [{units === 'IP' ? 'gr/lb' : 'g/kg'}]
          </text>
        </g>
      </svg>

      {/* Bottom Panning Hint */}
      <div className="absolute bottom-2 left-4 z-10 hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 font-mono pointer-events-none">
        <Move className="w-3 h-3 text-cyan-400" />
        <span>Arrastra para mover diagrama · Rueda para zoom · Doble clic para ajustar todo</span>
      </div>
    </div>
  );
};
