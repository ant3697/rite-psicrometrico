import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  StatePoint,
  ProcessConnection,
  ChartBounds,
  ChartLayerVisibility,
  ChartType,
  UnitSystem,
  IsolatedProcessInfo,
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
  computeEnthalpyDeviations,
  ASHRAE_SHR_VALUES,
  getSlopeFromSHR,
  calculateADP,
  getAshraeReferencePoint,
} from '../utils/ashraeScales';
import { FlyCarpetCarrierDiagram } from './FlyCarpetCarrierDiagram';
import { FlyCarpetMollierDiagram } from './FlyCarpetMollierDiagram';
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
  Target,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ChartContextMenu, ContextMenuTarget } from './ChartContextMenu';

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
  isolatedProcessInfo?: IsolatedProcessInfo | null;
  isolatedPointIds?: string[];
  isolatedProcessIds?: string[];
  onSetIsolatedProcessInfo?: (info: IsolatedProcessInfo | null) => void;
  onDeletePoint?: (id: string) => void;
  onDeleteProcess?: (id: string) => void;
  onDuplicatePoint?: (id: string) => void;
  onLocateModuleInAhu?: (moduleIdOrPointId: string) => void;
  onToggleLayer?: (layer: keyof ChartLayerVisibility) => void;
  isSplitView?: boolean;
}

// Geometric helpers for anti-collision label layout
function segmentIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

  function lineIntersects(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
    const denom = (by - ay) * (dx - cx) - (bx - ax) * (dy - cy);
    if (denom === 0) return false;
    const ua = ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / denom;
    const ub = ((dx - cx) * (cy - ay) - (dy - cy) * (cx - ax)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  return (
    lineIntersects(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
    lineIntersects(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
    lineIntersects(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
    lineIntersects(x1, y1, x2, y2, rx, ry + rh, rx, ry)
  );
}

function rectOverlapArea(
  r1x: number, r1y: number, r1w: number, r1h: number,
  r2x: number, r2y: number, r2w: number, r2h: number
): number {
  const overlapX = Math.max(0, Math.min(r1x + r1w, r2x + r2w) - Math.max(r1x, r2x));
  const overlapY = Math.max(0, Math.min(r1y + r1h, r2y + r2h) - Math.max(r1y, r2y));
  return overlapX * overlapY;
}

function pointNearRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number, pad = 8): boolean {
  return px >= rx - pad && px <= rx + rw + pad && py >= ry - pad && py <= ry + rh + pad;
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

interface PlacedPointLabel {
  pointId: string;
  boxX: number;
  boxY: number;
  width: number;
  height: number;
  lineStartX: number;
  lineStartY: number;
  lineEndX: number;
  lineEndY: number;
  hasLeader: boolean;
}

interface PlacedProcessLabel {
  processId: string;
  boxX: number;
  boxY: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  hasLeader: boolean;
  leaderStartX: number;
  leaderStartY: number;
  leaderEndX: number;
  leaderEndY: number;
}

// Standard full psychrometric domain limits
const DEFAULT_BOUNDS: ChartBounds = {
  tdbMin: -10,
  tdbMax: 50,
  wMin: 0,
  wMax: 0.030, // 30 g/kg (matches exact scale of FlyCarpet SVG)
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
  isolatedProcessInfo,
  isolatedPointIds,
  isolatedProcessIds,
  onSetIsolatedProcessInfo,
  onDeletePoint,
  onDeleteProcess,
  onDuplicatePoint,
  onLocateModuleInAhu,
  onToggleLayer,
  isSplitView = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG Canvas dimensions tightly tailored to fill window
  const viewBoxWidth = 902;
  const viewBoxHeight = 652;

  // Toggle to dim rather than completely hide non-isolated cycle points/processes
  const [dimOtherProcesses, setDimOtherProcesses] = useState<boolean>(false);

  // Context Menu State (for right-click on points, processes, or canvas)
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);

  // Check if an active isolation is present
  const hasActiveIsolation = Boolean(
    (isolatedPointIds && isolatedPointIds.length > 0) ||
    (isolatedProcessIds && isolatedProcessIds.length > 0) ||
    isolatedProcessInfo
  );

  // Check if a point belongs to the isolated module process
  const isPointIsolated = useCallback(
    (ptId: string) => {
      if (isolatedPointIds && isolatedPointIds.length > 0) {
        return isolatedPointIds.includes(ptId);
      }
      if (!isolatedProcessInfo) return true;
      if (isolatedProcessInfo.isPassive) {
        return ptId === isolatedProcessInfo.entryPoint.id;
      }
      return (
        ptId === isolatedProcessInfo.entryPoint.id ||
        ptId === isolatedProcessInfo.exitPoint.id ||
        (isolatedProcessInfo.secondaryEntryPoint && ptId === isolatedProcessInfo.secondaryEntryPoint.id)
      );
    },
    [isolatedPointIds, isolatedProcessInfo]
  );

  // Check if a process connection belongs to the isolated module process
  const isProcessIsolated = useCallback(
    (proc: ProcessConnection) => {
      if (isolatedProcessIds && isolatedProcessIds.length > 0) {
        return isolatedProcessIds.includes(proc.id);
      }
      if (!isolatedProcessInfo) return true;
      if (isolatedProcessInfo.isPassive) return false;
      if (isolatedProcessInfo.processId && proc.id === isolatedProcessInfo.processId) {
        return true;
      }
      if (isolatedProcessInfo.process) {
        return proc.id === isolatedProcessInfo.process.id;
      }
      return (
        proc.fromPointId === isolatedProcessInfo.entryPoint.id &&
        proc.toPointId === isolatedProcessInfo.exitPoint.id
      );
    },
    [isolatedProcessIds, isolatedProcessInfo]
  );

  // Official Chart Theme: 'ashrae_classic' (Canonical Green on technical paper), 'valcon_color' (Polychrome), or 'dark_blueprint' (CAD)
  const [chartTheme, setChartTheme] = useState<'ashrae_classic' | 'valcon_color' | 'dark_blueprint'>('ashrae_classic');
  const [localShowProtractor, setLocalShowProtractor] = useState<boolean>(true);
  const showProtractor = layers.shrProtractor !== undefined ? layers.shrProtractor : localShowProtractor;

  const handleToggleProtractor = useCallback(() => {
    if (onToggleLayer) {
      onToggleLayer('shrProtractor');
    }
    setLocalShowProtractor((prev) => !prev);
  }, [onToggleLayer]);

  const [showEnthalpyDeviations, setShowEnthalpyDeviations] = useState<boolean>(true);
  const [selectedSHR, setSelectedSHR] = useState<number | null>(null);
  const [hoveredProtractorSHR, setHoveredProtractorSHR] = useState<number | null>(null);
  const activeSHR = hoveredProtractorSHR ?? selectedSHR;

  // Diagram domain bounds: fixed standard canonical psychrometric domain
  const bounds = DEFAULT_BOUNDS;

  // Unified Diagram Viewport (Zoom and Pan apply synchronously to the container frame, axes, and all contents)
  const DEFAULT_VIEWBOX = useMemo(() => ({ x: 0, y: 0, width: viewBoxWidth, height: viewBoxHeight }), [viewBoxWidth, viewBoxHeight]);
  const [viewBox, setViewBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: viewBoxWidth,
    height: viewBoxHeight,
  });

  useEffect(() => {
    setViewBox({ x: 0, y: 0, width: viewBoxWidth, height: viewBoxHeight });
  }, [chartType, viewBoxWidth, viewBoxHeight]);

  // Optimized margins giving clean clearance for official ASHRAE outer enthalpy scale and FCS scale
  const margin = useMemo(() => {
    if (chartType === 'mollier') {
      return {
        top: 51,
        right: 72,
        bottom: 62,
        left: 70,
      };
    }
    return {
      top: 50,
      right: 73,
      bottom: 62,
      left: 70,
    };
  }, [chartType]);

  const plotWidth = viewBoxWidth - margin.left - margin.right;
  const plotHeight = viewBoxHeight - margin.top - margin.bottom;

  const innerPlotTransform = undefined;

  // Pan & Drag state
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; viewBox: typeof DEFAULT_VIEWBOX }>({
    clientX: 0,
    clientY: 0,
    viewBox: { x: 0, y: 0, width: viewBoxWidth, height: viewBoxHeight },
  });
  const hasMovedRef = useRef<boolean>(false);
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

  // Coordinate mapping: Mollier h-x Diagram (Horizontal: W 0-30 g/kg, Vertical: Tdb -10 to 50 °C)
  const coordToPixelMollier = useCallback(
    (tdb: number, w: number): [number, number] => {
      const px =
        margin.left +
        ((w - bounds.wMin) / (bounds.wMax - bounds.wMin)) * plotWidth;
      const py =
        margin.top +
        plotHeight -
        ((tdb - bounds.tdbMin) / (bounds.tdbMax - bounds.tdbMin)) * plotHeight;
      return [px, py];
    },
    [bounds, margin.left, margin.top, plotWidth, plotHeight]
  );

  const pixelToCoordMollier = useCallback(
    (px: number, py: number): [number, number] => {
      const w =
        bounds.wMin +
        ((px - margin.left) / plotWidth) * (bounds.wMax - bounds.wMin);
      const tdb =
        bounds.tdbMin +
        ((margin.top + plotHeight - py) / plotHeight) * (bounds.tdbMax - bounds.tdbMin);
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

  // ---------------- UNIFIED ZOOM, PAN & FIT OPERATIONS (CONTAINER + CONTENTS) ----------------
  const handleZoomIn = () => {
    setViewBox((prev) => {
      const newWidth = Math.max(120, prev.width * 0.8);
      const newHeight = (newWidth / viewBoxWidth) * viewBoxHeight;
      return {
        x: prev.x + (prev.width - newWidth) / 2,
        y: prev.y + (prev.height - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  const handleZoomOut = () => {
    setViewBox((prev) => {
      const newWidth = Math.min(3600, prev.width * 1.25);
      const newHeight = (newWidth / viewBoxWidth) * viewBoxHeight;
      return {
        x: prev.x + (prev.width - newWidth) / 2,
        y: prev.y + (prev.height - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  const handleZoomAll = () => {
    if (points.length === 0) {
      setViewBox(DEFAULT_VIEWBOX);
      return;
    }
    const pixelCoords = points.map((p) => coordToPixel(p.tdb, p.w));
    const xs = pixelCoords.map(([x]) => x);
    const ys = pixelCoords.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Give comfortable margins around the points, including space for point labels
    const paddingX = Math.max(90, (maxX - minX) * 0.35);
    const paddingY = Math.max(70, (maxY - minY) * 0.35);

    const fitWidth = Math.max(380, (maxX - minX) + paddingX * 2);
    const fitHeight = Math.max(260, (maxY - minY) + paddingY * 2);

    const targetRatio = viewBoxWidth / viewBoxHeight;
    let finalWidth = fitWidth;
    let finalHeight = fitHeight;

    if (fitWidth / fitHeight > targetRatio) {
      finalHeight = fitWidth / targetRatio;
    } else {
      finalWidth = fitHeight * targetRatio;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setViewBox({
      x: centerX - finalWidth / 2,
      y: centerY - finalHeight / 2,
      width: finalWidth,
      height: finalHeight,
    });
  };

  const handleCenterCycle = () => {
    if (points.length === 0) {
      setViewBox(DEFAULT_VIEWBOX);
      return;
    }
    const pixelCoords = points.map((p) => coordToPixel(p.tdb, p.w));
    const xs = pixelCoords.map(([x]) => x);
    const ys = pixelCoords.map(([, y]) => y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    setViewBox((prev) => ({
      ...prev,
      x: centerX - prev.width / 2,
      y: centerY - prev.height / 2,
    }));
  };

  const handleResetBounds = () => {
    setViewBox(DEFAULT_VIEWBOX);
  };

  // Center diagram on a single state point with focused zoom
  const handleCenterPoint = useCallback((tdb: number, w: number) => {
    const [px, py] = coordToPixel(tdb, w);
    setViewBox((prev) => {
      const zoomWidth = Math.min(prev.width, 420);
      const zoomHeight = (zoomWidth / viewBoxWidth) * viewBoxHeight;
      return {
        x: px - zoomWidth / 2,
        y: py - zoomHeight / 2,
        width: zoomWidth,
        height: zoomHeight,
      };
    });
  }, [coordToPixel, viewBoxWidth, viewBoxHeight]);

  // Center diagram on a process connection between two points
  const handleCenterProcess = useCallback((p1: StatePoint, p2: StatePoint) => {
    const [x1, y1] = coordToPixel(p1.tdb, p1.w);
    const [x2, y2] = coordToPixel(p2.tdb, p2.w);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const zoomWidth = Math.max(380, Math.min(750, dist * 2.8));
    const zoomHeight = (zoomWidth / viewBoxWidth) * viewBoxHeight;

    setViewBox({
      x: midX - zoomWidth / 2,
      y: midY - zoomHeight / 2,
      width: zoomWidth,
      height: zoomHeight,
    });
  }, [coordToPixel, viewBoxWidth, viewBoxHeight]);

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
      const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
      const offsetX = (rect.width - viewBox.width * scale) / 2;
      const offsetY = (rect.height - viewBox.height * scale) / 2;
      return {
        x: viewBox.x + (e.clientX - rect.left - offsetX) / scale,
        y: viewBox.y + (e.clientY - rect.top - offsetY) / scale,
      };
    },
    [viewBox]
  );

  // Non-passive wheel zoom listener attached directly to SVG canvas
  // Accurately zooms both container and contents around cursor
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = svg.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 0.85 : 1.18;

      const clientX = e.clientX;
      const clientY = e.clientY;

      setViewBox((prev) => {
        const newWidth = Math.max(120, Math.min(3600, prev.width * factor));
        const newHeight = (newWidth / viewBoxWidth) * viewBoxHeight;

        const mouseRatioX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const mouseRatioY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

        const svgMouseX = prev.x + mouseRatioX * prev.width;
        const svgMouseY = prev.y + mouseRatioY * prev.height;

        return {
          x: svgMouseX - mouseRatioX * newWidth,
          y: svgMouseY - mouseRatioY * newHeight,
          width: newWidth,
          height: newHeight,
        };
      });
    };

    svg.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      svg.removeEventListener('wheel', onWheelNative);
    };
  }, [viewBoxWidth, viewBoxHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggedPointId) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsPanning(true);
    hasMovedRef.current = false;
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      viewBox: { ...viewBox },
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
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;

      const dx = (e.clientX - panStartRef.current.clientX) * scaleX;
      const dy = (e.clientY - panStartRef.current.clientY) * scaleY;

      if (Math.hypot(dx, dy) > 2) {
        hasMovedRef.current = true;
      }

      setViewBox({
        ...panStartRef.current.viewBox,
        x: panStartRef.current.viewBox.x - dx,
        y: panStartRef.current.viewBox.y - dy,
      });
      return;
    }

    // Protractor hover detection (Carrier / Mollier)
    if (showProtractor && !isPanning && !draggedPointId) {
      if (chartType === 'carrier') {
        const d = Math.hypot(rawPx - 194.6, rawPy - 75.6);
        if (d >= 10 && d <= 125 && rawPy >= 65) {
          const dx = rawPx - 194.6;
          const dy = rawPy - 75.6;
          let shrVal: number;
          if (dx <= 0) {
            const alpha = Math.atan2(dy, -dx);
            shrVal = Math.max(0, Math.min(1.0, 1 / (1 + Math.tan(alpha) / 0.5723)));
          } else {
            const beta = Math.atan2(dy, dx);
            shrVal = 1 / (1 - Math.tan(beta) / 0.5723);
          }
          setHoveredProtractorSHR(Number(shrVal.toFixed(2)));
        } else {
          setHoveredProtractorSHR(null);
        }
      } else {
        const d = Math.hypot(rawPx - 794.0, rawPy - 480.7);
        if (d >= 10 && d <= 95 && rawPx <= 800) {
          const dx = 794.0 - rawPx;
          const dy = rawPy - 480.7;
          const gamma = Math.atan2(dy, dx);
          const shrVal = Math.max(0, Math.min(1.0, Math.tan(gamma) / (1.27 + Math.tan(gamma))));
          setHoveredProtractorSHR(Number(shrVal.toFixed(2)));
        } else {
          setHoveredProtractorSHR(null);
        }
      }
    } else {
      setHoveredProtractorSHR(null);
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

  // Touch gesture support: 1-finger pan and 2-finger pinch-to-zoom
  const chartTouchStartRef = useRef<{
    touches: { x: number; y: number }[];
    distance: number;
    viewBox: typeof DEFAULT_VIEWBOX;
  }>({
    touches: [],
    distance: 0,
    viewBox: { x: 0, y: 0, width: viewBoxWidth, height: viewBoxHeight },
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsPanning(true);
      hasMovedRef.current = false;
      chartTouchStartRef.current = {
        touches: [{ x: t.clientX, y: t.clientY }],
        distance: 0,
        viewBox: { ...viewBox },
      };
    } else if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      chartTouchStartRef.current = {
        touches: [
          { x: t0.clientX, y: t0.clientY },
          { x: t1.clientX, y: t1.clientY },
        ],
        distance: dist > 0 ? dist : 1,
        viewBox: { ...viewBox },
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!svgRef.current) return;

    if (e.touches.length === 1 && isPanning) {
      const t = e.touches[0];
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;

      const dx = (t.clientX - chartTouchStartRef.current.touches[0].x) * scaleX;
      const dy = (t.clientY - chartTouchStartRef.current.touches[0].y) * scaleY;

      if (Math.hypot(dx, dy) > 2) {
        hasMovedRef.current = true;
      }

      setViewBox({
        ...chartTouchStartRef.current.viewBox,
        x: chartTouchStartRef.current.viewBox.x - dx,
        y: chartTouchStartRef.current.viewBox.y - dy,
      });
    } else if (e.touches.length === 2 && chartTouchStartRef.current.distance > 0) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const factor = chartTouchStartRef.current.distance / Math.max(10, currentDist);

      const initVb = chartTouchStartRef.current.viewBox;
      const newWidth = Math.max(120, Math.min(3600, initVb.width * factor));
      const newHeight = (newWidth / viewBoxWidth) * viewBoxHeight;

      const midClientX = (t0.clientX + t1.clientX) / 2;
      const midClientY = (t0.clientY + t1.clientY) / 2;
      const rect = svgRef.current.getBoundingClientRect();
      const ratioX = (midClientX - rect.left) / rect.width;
      const ratioY = (midClientY - rect.top) / rect.height;

      const svgMidX = initVb.x + ratioX * initVb.width;
      const svgMidY = initVb.y + ratioY * initVb.height;

      setViewBox({
        x: svgMidX - ratioX * newWidth,
        y: svgMidY - ratioY * newHeight,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsPanning(false);
      setDraggedPointId(null);
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      chartTouchStartRef.current = {
        touches: [{ x: t.clientX, y: t.clientY }],
        distance: 0,
        viewBox: { ...viewBox },
      };
    }
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (draggedPointId || (isPanning && hasMovedRef.current)) return;
    if (hoveredProtractorSHR !== null) {
      setSelectedSHR((prev) => (prev === hoveredProtractorSHR ? null : hoveredProtractorSHR));
      return;
    }
    if (e.detail === 2) {
      if (hoverCoords) {
        onAddPointAtCoordinates(hoverCoords.tdb, hoverCoords.w);
      }
    } else {
      // If clicking directly on empty diagram background, deselect point
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'svg' ||
        target.classList.contains('plot-bg-rect') ||
        target.getAttribute('fill') === themeStyles.plotBg
      ) {
        onSelectPoint(null);
      }
    }
  };

  // ---------------- DYNAMIC AXES TICKS GENERATION -----------------
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let t = -10; t <= 50; t += 5) {
      ticks.push(t);
    }
    return ticks;
  }, []);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let w = 0; w <= 30; w += 2) {
      ticks.push(w);
    }
    return ticks;
  }, []);

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
      // Find where this enthalpy line intersects the 100% saturation curve
      let lowT = -10;
      let highT = 60;
      for (let iter = 0; iter < 16; iter++) {
        const midT = (lowT + highT) / 2;
        const ws = getSaturationHumidityRatio(midT, pressure);
        if (getEnthalpy(midT, ws) < h) {
          lowT = midT;
        } else {
          highT = midT;
        }
      }
      const tSat = (lowT + highT) / 2;
      const wSat = getSaturationHumidityRatio(tSat, pressure);

      const pts: Array<[number, number]> = [];
      // Start directly on the saturation curve (aligned with outer perimeter scale)
      if (tSat <= bounds.tdbMax && wSat <= bounds.wMax * 1.05 && wSat >= bounds.wMin) {
        pts.push(coordToPixel(tSat, Math.min(bounds.wMax, wSat)));
      }

      // Step across dry-bulb temperature only below saturation envelope
      const startT = Math.max(bounds.tdbMin, tSat);
      for (let t = startT + 0.5; t <= bounds.tdbMax; t += 0.5) {
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

  // Enthalpy Deviation Curves (curvas de desviación entálpica)
  const enthalpyDeviations = useMemo(() => {
    return computeEnthalpyDeviations(pressure, bounds.tdbMin, bounds.tdbMax, bounds.wMin, bounds.wMax);
  }, [pressure, bounds.tdbMin, bounds.tdbMax, bounds.wMin, bounds.wMax]);

  // Deduplicate points: remove duplicate IDs or coincident points with identical name/coords
  const deduplicatedPoints = useMemo(() => {
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    return points.filter((pt) => {
      if (seenIds.has(pt.id)) return false;
      const key = `${pt.name}_${pt.tdb.toFixed(2)}_${pt.w.toFixed(5)}`;
      if (seenKeys.has(key)) return false;
      seenIds.add(pt.id);
      seenKeys.add(key);
      return true;
    });
  }, [points]);

  // Pixel coordinates and metadata for all active points
  const pointPixels = useMemo(() => {
    return deduplicatedPoints.map((pt) => {
      const [px, py] = coordToPixel(pt.tdb, pt.w);
      return { id: pt.id, px, py, point: pt };
    });
  }, [deduplicatedPoints, coordToPixel]);

  // Process line segments in pixel coordinates
  const processSegments = useMemo(() => {
    return processes
      .map((proc) => {
        const from = points.find((p) => p.id === proc.fromPointId);
        const to = points.find((p) => p.id === proc.toPointId);
        if (!from || !to) return null;
        const [x1, y1] = coordToPixel(from.tdb, from.w);
        const [x2, y2] = coordToPixel(to.tdb, to.w);
        return { id: proc.id, proc, x1, y1, x2, y2 };
      })
      .filter((s): s is { id: string; proc: ProcessConnection; x1: number; y1: number; x2: number; y2: number } => s !== null);
  }, [processes, points, coordToPixel]);

  // Intelligent Collision-Free Layout Engine for Points and Processes Labels
  const labelLayout = useMemo(() => {
    const minPlotX = margin.left + 8;
    const maxPlotX = margin.left + plotWidth - 8;
    const minPlotY = margin.top + 8;
    const maxPlotY = margin.top + plotHeight - 8;

    // Precompute pixel positions of points
    const pointPixels = new Map<string, [number, number]>();
    points.forEach((pt) => {
      pointPixels.set(pt.id, coordToPixel(pt.tdb, pt.w));
    });

    // Precompute line segments for all visible processes
    const procSegments: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      midX: number;
      midY: number;
      nx: number;
      ny: number;
      len: number;
    }> = [];

    processes.forEach((proc) => {
      const p1 = pointPixels.get(proc.fromPointId);
      const p2 = pointPixels.get(proc.toPointId);
      if (!p1 || !p2) return;
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.hypot(dx, dy);
      const nx = len > 0 ? -dy / len : 0;
      const ny = len > 0 ? dx / len : 0;
      procSegments.push({
        id: proc.id,
        x1: p1[0],
        y1: p1[1],
        x2: p2[0],
        y2: p2[1],
        midX: (p1[0] + p2[0]) / 2,
        midY: (p1[1] + p2[1]) / 2,
        nx,
        ny,
        len,
      });
    });

    // 1. PLACE PROCESS POWER BADGES (offset perpendicularly so they NEVER sit on top of process lines or points)
    const placedProcessLabels: PlacedProcessLabel[] = [];
    const occupiedRects: Array<{ x: number; y: number; w: number; h: number }> = [];

    procSegments.forEach((seg) => {
      const width = 64;
      const height = 18;

      const candidates: Array<{
        boxX: number;
        boxY: number;
        cx: number;
        cy: number;
        cost: number;
        hasLeader: boolean;
        dist: number;
      }> = [];

      const normalDistances = [18, -18, 28, -28, 38, -38];
      const tRatios = [0.5, 0.4, 0.6];

      for (const t of tRatios) {
        const baseX = seg.x1 + t * (seg.x2 - seg.x1);
        const baseY = seg.y1 + t * (seg.y2 - seg.y1);

        for (const dist of normalDistances) {
          const cx = baseX + dist * seg.nx;
          const cy = baseY + dist * seg.ny;
          const boxX = cx - width / 2;
          const boxY = cy - height / 2;

          let cost = Math.abs(dist) * 2;

          // Boundary check
          if (boxX < minPlotX || boxX + width > maxPlotX || boxY < minPlotY || boxY + height > maxPlotY) {
            cost += 1000000;
          }

          // Must NOT intersect ANY process line
          for (const s of procSegments) {
            if (segmentIntersectsRect(s.x1, s.y1, s.x2, s.y2, boxX, boxY, width, height)) {
              cost += 200000;
            }
          }

          // Must NOT overlap any state point
          for (const [, [px, py]] of pointPixels) {
            if (pointNearRect(px, py, boxX, boxY, width, height, 12)) {
              cost += 500000;
            }
          }

          // Must NOT overlap already placed process badges
          for (const occ of occupiedRects) {
            const overlap = rectOverlapArea(boxX, boxY, width, height, occ.x, occ.y, occ.w, occ.h);
            if (overlap > 0) {
              cost += 1000000 + overlap * 50;
            }
          }

          candidates.push({
            boxX,
            boxY,
            cx,
            cy,
            cost,
            hasLeader: Math.abs(dist) > 22,
            dist,
          });
        }
      }

      // Pick candidate with minimum cost
      candidates.sort((a, b) => a.cost - b.cost);
      const best = candidates[0] || {
        boxX: seg.midX - width / 2,
        boxY: seg.midY - height / 2,
        cx: seg.midX,
        cy: seg.midY,
        cost: 0,
        hasLeader: false,
        dist: 0,
      };

      occupiedRects.push({ x: best.boxX, y: best.boxY, w: width, h: height });

      placedProcessLabels.push({
        processId: seg.id,
        boxX: best.boxX,
        boxY: best.boxY,
        width,
        height,
        cx: best.cx,
        cy: best.cy,
        hasLeader: best.hasLeader,
        leaderStartX: seg.midX,
        leaderStartY: seg.midY,
        leaderEndX: best.cx,
        leaderEndY: best.dist > 0 ? best.boxY : best.boxY + height,
      });
    });

    // 2. PLACE STATE POINT LABELS (Anti-overlap & anti-line collision)
    const placedPointLabels: PlacedPointLabel[] = [];

    points.forEach((pt) => {
      const p = pointPixels.get(pt.id);
      if (!p) return;
      const [px, py] = p;

      const width = Math.max(48, pt.name.length * 7.5 + 18);
      const height = 20;

      // 8 radial directions (angles in radians)
      const angles = [
        -Math.PI / 4,       // Top-Right (preferred default)
        -3 * Math.PI / 4,   // Top-Left
        -Math.PI / 2,       // Top
        Math.PI / 4,        // Bottom-Right
        3 * Math.PI / 4,    // Bottom-Left
        0,                  // Right
        Math.PI / 2,        // Bottom
        Math.PI,            // Left
      ];

      // Radial distances from point
      const distances = [22, 34, 48, 64, 80];

      const candidates: Array<{
        boxX: number;
        boxY: number;
        cx: number;
        cy: number;
        cost: number;
        dist: number;
      }> = [];

      for (const dist of distances) {
        for (const angle of angles) {
          const cx = px + dist * Math.cos(angle);
          const cy = py + dist * Math.sin(angle);
          const boxX = cx - width / 2;
          const boxY = cy - height / 2;

          let cost = dist * 2; // small penalty for larger distance

          // Preference for Top-Right or Top
          if (angle === -Math.PI / 4) cost -= 15;
          if (angle === -Math.PI / 2) cost -= 10;

          // Boundary penalty
          if (boxX < minPlotX) cost += 1000000 + (minPlotX - boxX) * 1000;
          if (boxX + width > maxPlotX) cost += 1000000 + (boxX + width - maxPlotX) * 1000;
          if (boxY < minPlotY) cost += 1000000 + (minPlotY - boxY) * 1000;
          if (boxY + height > maxPlotY) cost += 1000000 + (boxY + height - maxPlotY) * 1000;

          // Must NOT overlap any state point circle
          for (const [otherId, [otherPx, otherPy]] of pointPixels) {
            if (otherId === pt.id) {
              if (pointNearRect(otherPx, otherPy, boxX, boxY, width, height, 6)) {
                cost += 300000;
              }
            } else {
              if (pointNearRect(otherPx, otherPy, boxX, boxY, width, height, 14)) {
                cost += 1000000;
              }
            }
          }

          // Must NOT intersect ANY process transformation line
          for (const s of procSegments) {
            if (segmentIntersectsRect(s.x1, s.y1, s.x2, s.y2, boxX, boxY, width, height)) {
              cost += 500000;
            } else {
              const dToLine = distanceToSegment(cx, cy, s.x1, s.y1, s.x2, s.y2);
              if (dToLine < height / 2 + 6) {
                cost += 100000;
              }
            }
          }

          // Must NOT overlap ANY occupied label rectangle (point labels or process badges)
          for (const occ of occupiedRects) {
            const overlap = rectOverlapArea(boxX, boxY, width, height, occ.x, occ.y, occ.w, occ.h);
            if (overlap > 0) {
              cost += 1000000 + overlap * 50;
            }
          }

          // Leader line should avoid crossing other state points
          const leaderEndX = Math.max(boxX, Math.min(boxX + width, px));
          const leaderEndY = Math.max(boxY, Math.min(boxY + height, py));
          for (const [otherId, [otherPx, otherPy]] of pointPixels) {
            if (otherId !== pt.id) {
              const d = distanceToSegment(otherPx, otherPy, px, py, leaderEndX, leaderEndY);
              if (d < 12) cost += 100000;
            }
          }

          candidates.push({
            boxX,
            boxY,
            cx,
            cy,
            cost,
            dist,
          });
        }
      }

      // Pick candidate with minimum cost
      candidates.sort((a, b) => a.cost - b.cost);
      const best = candidates[0] || {
        boxX: px + 12,
        boxY: py - 12 - height,
        cx: px + 12 + width / 2,
        cy: py - 12 - height / 2,
        cost: 0,
        dist: 22,
      };

      occupiedRects.push({ x: best.boxX, y: best.boxY, w: width, h: height });

      // Leader line coordinates
      const dx = best.cx - px;
      const dy = best.cy - py;
      const dLen = Math.hypot(dx, dy) || 1;
      const lineStartX = px + (dx / dLen) * 8;
      const lineStartY = py + (dy / dLen) * 8;
      const lineEndX = Math.max(best.boxX, Math.min(best.boxX + width, px));
      const lineEndY = Math.max(best.boxY, Math.min(best.boxY + height, py));
      const hasLeader = best.dist > 18;

      placedPointLabels.push({
        pointId: pt.id,
        boxX: best.boxX,
        boxY: best.boxY,
        width,
        height,
        lineStartX,
        lineStartY,
        lineEndX,
        lineEndY,
        hasLeader,
      });
    });

    return {
      placedPointLabels,
      placedProcessLabels,
    };
  }, [points, processes, coordToPixel, plotWidth, plotHeight, margin]);

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
          onClick={handleToggleProtractor}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-semibold transition-all ${
            showProtractor
              ? 'bg-[#15803D]/25 text-[#4ade80] border border-[#15803D]/50'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/10'
          }`}
          title="Transportador de Factor de Calor Sensible (SHR / Sensible Heat Ratio)"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className={isSplitView ? 'hidden' : 'hidden xl:inline'}>Transportador SHR</span>
        </button>

        {/* Active SHR Indicator & Quick Presets */}
        {showProtractor && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-mono animate-fadeIn">
            <span className="font-semibold text-amber-400 text-[11px]">
              {selectedSHR !== null ? `SHR: ${selectedSHR.toFixed(2)}` : 'FCS/SHR:'}
            </span>
            <div className="flex items-center gap-0.5">
              {[0.65, 0.70, 0.75, 0.80, 0.85, 1.00].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSelectedSHR((prev) => (prev === preset ? null : preset))}
                  className={`px-1 py-0.2 text-[10px] font-semibold rounded transition-colors ${
                    selectedSHR === preset
                      ? 'bg-amber-400 text-slate-950 font-bold shadow'
                      : 'hover:bg-amber-900/60 text-amber-200/90'
                  }`}
                  title={`Fijar recta de maniobra con SHR = ${preset.toFixed(2)}`}
                >
                  {preset === 1 ? '1.0' : preset.toFixed(2).replace('0.', '.')}
                </button>
              ))}
            </div>
            {selectedSHR !== null && (
              <button
                onClick={() => setSelectedSHR(null)}
                className="text-amber-400 hover:text-white ml-0.5 p-0.5 rounded hover:bg-amber-900/60 transition-colors"
                title="Borrar recta de maniobra SHR"
              >
                ✕
              </button>
            )}
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
          <span className={isSplitView ? 'hidden' : 'hidden xl:inline'}>Desv. Δh</span>
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

        <span className="text-[10px] font-mono text-slate-300 min-w-[32px] text-center select-none" title="Nivel de zoom">
          {Math.round((viewBoxWidth / viewBox.width) * 100)}%
        </span>

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
          <span className={isSplitView ? 'hidden sm:inline' : 'inline'}>Ajustar</span>
        </button>

        {/* Center Cycle */}
        <button
          onClick={handleCenterCycle}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/50 hover:text-white transition-colors"
          title="Centrar el ciclo en la ventana"
        >
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span className={isSplitView ? 'hidden sm:inline' : 'inline'}>Centrar</span>
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
        <div className={`absolute ${isSplitView ? 'bottom-8 right-3' : 'top-2 right-3'} z-20 bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/40 text-xs shadow-2xl pointer-events-none transition-all`}>
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

      {/* Floating Isolated Process HUD Banner: Only in single-chart view, never in splitView where it is placed outside the canvas */}
      {!isSplitView && isolatedProcessInfo && (
        <div className="absolute top-11 right-3 max-w-xl z-30 flex flex-wrap items-center justify-between gap-2 bg-slate-950/95 border border-cyan-500/50 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md text-xs font-mono animate-in fade-in duration-200">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold">
              <Target className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{isolatedProcessInfo.moduleName}</span>
            </div>

            {isolatedProcessInfo.isPassive ? (
              <span className="text-amber-300 text-[11px] bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded">
                Módulo Pasivo (Isentálpico: ΔT=0, Δw=0) · ΔP: {isolatedProcessInfo.pressureDropPa ?? 0} Pa
              </span>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-slate-300 flex-wrap">
                <span className="text-slate-400">
                  {isolatedProcessInfo.entryPoint.name}: <strong className="text-cyan-300">{isolatedProcessInfo.entryPoint.tdb.toFixed(1)}°C, {isolatedProcessInfo.entryPoint.rh.toFixed(0)}%</strong>
                </span>
                <span className="text-cyan-400 font-bold">→</span>
                <span className="text-slate-400">
                  {isolatedProcessInfo.exitPoint.name}: <strong className="text-cyan-300">{isolatedProcessInfo.exitPoint.tdb.toFixed(1)}°C, {isolatedProcessInfo.exitPoint.rh.toFixed(0)}%</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span>
                  ΔT: <strong className={isolatedProcessInfo.exitPoint.tdb - isolatedProcessInfo.entryPoint.tdb < 0 ? 'text-cyan-400' : 'text-rose-400'}>
                    {isolatedProcessInfo.exitPoint.tdb - isolatedProcessInfo.entryPoint.tdb > 0 ? '+' : ''}{(isolatedProcessInfo.exitPoint.tdb - isolatedProcessInfo.entryPoint.tdb).toFixed(1)}°C
                  </strong>
                </span>
                <span>
                  Δw: <strong className="text-emerald-400">
                    {((isolatedProcessInfo.exitPoint.w - isolatedProcessInfo.entryPoint.w) * 1000).toFixed(2)} g/kg
                  </strong>
                </span>
                {isolatedProcessInfo.process && (
                  <span>
                    Q: <strong className="text-amber-400">{Math.abs(isolatedProcessInfo.process.qTotal).toFixed(1)} kW</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setDimOtherProcesses(!dimOtherProcesses)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              title={dimOtherProcesses ? "Ocultar por completo las demás transformaciones" : "Mostrar el resto del ciclo atenuado"}
            >
              {dimOtherProcesses ? <EyeOff className="w-3 h-3 text-cyan-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
              <span>{dimOtherProcesses ? "Solo este proceso" : "Ver contexto"}</span>
            </button>

            {isolatedProcessInfo.onClearIsolation && (
              <button
                onClick={isolatedProcessInfo.onClearIsolation}
                className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-[10px] text-rose-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Volver a mostrar el ciclo completo con todas las transformaciones"
              >
                <span>✕ Ver Ciclo Completo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main SVG Canvas: Diagram takes full container width and height */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className={`w-full h-full touch-none select-none ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={handleSvgClick}
        onDoubleClick={handleZoomAll}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            type: 'canvas',
            clientX: e.clientX,
            clientY: e.clientY,
            tdb: hoverCoords?.tdb,
            w: hoverCoords?.w,
            rh: hoverCoords?.rh,
            h: hoverCoords?.h,
            twb: hoverCoords?.twb,
          });
        }}
        style={{ touchAction: 'none' }}
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

        {/* 1. Official High-Precision Vector Diagram (Carrier / Mollier) from FlyCarpet dataset */}
        {chartType === 'mollier' ? (
          <FlyCarpetMollierDiagram
            layers={{ ...layers, shrProtractor: showProtractor }}
            isDark={themeStyles.isDark}
            innerPlotTransform={innerPlotTransform}
          />
        ) : (
          <FlyCarpetCarrierDiagram
            layers={{ ...layers, shrProtractor: showProtractor }}
            isDark={themeStyles.isDark}
            innerPlotTransform={innerPlotTransform}
          />
        )}

        {/* Interactive 180° Protractor Needle & Click/Hover Overlay for Carrier */}
        {showProtractor && chartType === 'carrier' && (
          <g className="carrier-protractor-interactive">
            {/* Transparent clickable hit area matching the exact 180° semi-circular protractor */}
            <path
              d="M 88 75.6 A 108 108 0 0 0 302 75.6 Z"
              fill="transparent"
              className="cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                if (hoveredProtractorSHR !== null) {
                  setSelectedSHR((prev) => (prev === hoveredProtractorSHR ? null : hoveredProtractorSHR));
                }
              }}
            />

            {/* Active / Hovered Angle Needle on the 180° Protractor */}
            {activeSHR !== null && (() => {
              const shr = activeSHR;
              const isCooling = shr >= 0 && shr <= 1.0;
              const alpha = isCooling
                ? Math.atan(0.5723 * (1 - shr) / Math.max(0.0001, shr))
                : Math.atan(0.5723 * Math.abs((1 - shr) / shr));
              const cosA = Math.cos(alpha);
              const sinA = Math.sin(alpha);
              const rayEndX = isCooling ? 194.6 - 102.0 * cosA : 194.6 + 102.0 * cosA;
              const rayEndY = 75.6 + 102.0 * sinA;

              return (
                <g className="carrier-protractor-needle pointer-events-none">
                  {/* Origin hub */}
                  <circle cx="194.6" cy="75.6" r="4" fill="#F59E0B" />
                  <circle cx="194.6" cy="75.6" r="7" fill="none" stroke="#F59E0B" strokeWidth="1.2" />

                  {/* Needle ray across the 180° protractor */}
                  <line
                    x1="194.6"
                    y1="75.6"
                    x2={rayEndX}
                    y2={rayEndY}
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                  />

                  {/* Pointer bead on the 180° perimeter arc */}
                  <circle cx={rayEndX} cy={rayEndY} r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx={rayEndX} cy={rayEndY} r="8.5" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" />

                  {/* SHR Value Tag near perimeter */}
                  <g transform={`translate(${rayEndX + (isCooling ? -16 : 16)}, ${rayEndY + 16})`}>
                    <rect
                      x="-38"
                      y="-12"
                      width="76"
                      height="18"
                      rx="4"
                      fill={themeStyles.isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)'}
                      stroke="#F59E0B"
                      strokeWidth="1.2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                    />
                    <text
                      x="0"
                      y="1.5"
                      textAnchor="middle"
                      fill="#F59E0B"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      SHR {shr.toFixed(2)}
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>
        )}

        {/* Interactive 180° Protractor Needle & Click/Hover Overlay for Mollier */}
        {showProtractor && chartType === 'mollier' && (
          <g className="mollier-protractor-interactive">
            {/* Transparent clickable hit area matching the exact 180° semi-circular protractor */}
            <path
              d="M 794.0 404 A 78 78 0 0 0 794.0 558 Z"
              fill="transparent"
              className="cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                if (hoveredProtractorSHR !== null) {
                  setSelectedSHR((prev) => (prev === hoveredProtractorSHR ? null : hoveredProtractorSHR));
                }
              }}
            />

            {/* Active / Hovered Angle Needle on the 180° Protractor */}
            {activeSHR !== null && (() => {
              const shr = activeSHR;
              const gamma = Math.atan(1.27 * shr / Math.max(0.001, 1 - shr));
              const rayEndX = 794.0 - 72.0 * Math.cos(gamma);
              const rayEndY = 480.7 + 72.0 * Math.sin(gamma);

              return (
                <g className="mollier-protractor-needle pointer-events-none">
                  {/* Origin hub */}
                  <circle cx="794.0" cy="480.7" r="3.5" fill="#F59E0B" />
                  <circle cx="794.0" cy="480.7" r="6.5" fill="none" stroke="#F59E0B" strokeWidth="1.2" />

                  {/* Needle ray across the 180° protractor */}
                  <line
                    x1="794.0"
                    y1="480.7"
                    x2={rayEndX}
                    y2={rayEndY}
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                  />

                  {/* Pointer bead on the 180° perimeter arc */}
                  <circle cx={rayEndX} cy={rayEndY} r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx={rayEndX} cy={rayEndY} r="8" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" />

                  {/* SHR Value Tag */}
                  <g transform={`translate(${rayEndX - 26}, ${rayEndY})`}>
                    <rect
                      x="-38"
                      y="-10"
                      width="76"
                      height="18"
                      rx="4"
                      fill={themeStyles.isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)'}
                      stroke="#F59E0B"
                      strokeWidth="1.2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#F59E0B"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      SHR {shr.toFixed(2)}
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>
        )}

        {/* 2. Interactive Diagram Contents (Scaled & Panned strictly inside plot area) */}
        <g clipPath="url(#chart-plot-clip)">
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

          {layers.processes && (
            <g className="processes-layer">
              {processes.map((proc) => {
                const isIsolated = isProcessIsolated(proc);
                if (hasActiveIsolation && !isIsolated && !dimOtherProcesses) {
                  return null;
                }

                const ptFrom = points.find((p) => p.id === proc.fromPointId);
                const ptTo = points.find((p) => p.id === proc.toPointId);
                if (!ptFrom || !ptTo) return null;

                const [x1, y1] = coordToPixel(ptFrom.tdb, ptFrom.w);
                const [x2, y2] = coordToPixel(ptTo.tdb, ptTo.w);

                const procColor = proc.color || (themeStyles.isDark ? '#38BDF8' : '#0284C7');
                const placedBadge = labelLayout.placedProcessLabels.find((l) => l.processId === proc.id);
                const lineOpacity = hasActiveIsolation && !isIsolated ? 0.12 : 1;
                const lineWidth = isIsolated && hasActiveIsolation ? '5' : '3.5';

                return (
                  <g
                    key={proc.id}
                    opacity={lineOpacity}
                    className="cursor-pointer group"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        type: 'process',
                        clientX: e.clientX,
                        clientY: e.clientY,
                        processId: proc.id,
                      });
                    }}
                  >
                    {/* Wide Invisible Hit-Area for effortless clicking and right-clicking */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth="18"
                    />

                    {/* Process Line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={procColor}
                      strokeWidth={lineWidth}
                      strokeDasharray={proc.type === 'zone_load' ? '6,3' : undefined}
                      markerEnd={proc.type === 'mixing' ? 'url(#process-arrow-amber)' : 'url(#process-arrow)'}
                      filter={isIsolated && hasActiveIsolation ? 'drop-shadow(0 0 6px rgba(56,189,248,0.8))' : undefined}
                    />

                    {/* Anti-collision Leader Line (if badge is offset from line) */}
                    {placedBadge && placedBadge.hasLeader && (
                      <line
                        x1={placedBadge.leaderStartX}
                        y1={placedBadge.leaderStartY}
                        x2={placedBadge.leaderEndX}
                        y2={placedBadge.leaderEndY}
                        stroke={procColor}
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity="0.65"
                      />
                    )}

                    {/* Anti-Collision Process Power Badge (Never overlaps lines or points) */}
                    {placedBadge && (
                      <g
                        transform={`translate(${placedBadge.cx}, ${placedBadge.cy})`}
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSetIsolatedProcessInfo) {
                            if (isIsolated) {
                              onSetIsolatedProcessInfo(null);
                            } else {
                              onSetIsolatedProcessInfo({
                                processId: proc.id,
                                moduleName: proc.name,
                                moduleType: proc.type,
                                isPassive: false,
                                entryPoint: ptFrom,
                                exitPoint: ptTo,
                                process: proc,
                                onClearIsolation: () => onSetIsolatedProcessInfo(null),
                              });
                            }
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({
                            type: 'process',
                            clientX: e.clientX,
                            clientY: e.clientY,
                            processId: proc.id,
                          });
                        }}
                      >
                        <rect
                          x={-placedBadge.width / 2}
                          y={-placedBadge.height / 2}
                          width={placedBadge.width}
                          height={placedBadge.height}
                          rx="4"
                          fill={themeStyles.plotBg}
                          stroke={procColor}
                          strokeWidth="1.2"
                          opacity="0.96"
                          filter={themeStyles.isDark ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))'}
                        />
                        <text
                          x="0"
                          y="2.5"
                          textAnchor="middle"
                          fill={themeStyles.axisText}
                          fontSize="9"
                          fontWeight="700"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {proc.qTotal.toFixed(1)} kW
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Isolated Process Sensible / Latent Decomposition Triangle */}
          {isolatedProcessInfo && !isolatedProcessInfo.isPassive && (() => {
            const entry = isolatedProcessInfo.entryPoint;
            const exit = isolatedProcessInfo.exitPoint;
            const [p1x, p1y] = coordToPixel(entry.tdb, entry.w);
            const [p2x, p2y] = coordToPixel(exit.tdb, exit.w);
            const [pInterX, pInterY] = coordToPixel(exit.tdb, entry.w);

            const deltaT = exit.tdb - entry.tdb;
            const deltaW = (exit.w - entry.w) * 1000;

            const isSignificantDeltaW = Math.abs(deltaW) > 0.05;
            const isSignificantDeltaT = Math.abs(deltaT) > 0.1;

            return (
              <g className="isolated-decomposition-triangle pointer-events-none">
                {/* Sensible component horizontal leg */}
                {isSignificantDeltaT && (
                  <g>
                    <line
                      x1={p1x}
                      y1={p1y}
                      x2={pInterX}
                      y2={pInterY}
                      stroke={deltaT < 0 ? '#38BDF8' : '#F97316'}
                      strokeWidth="2"
                      strokeDasharray="4,3"
                      opacity="0.9"
                    />
                    <rect
                      x={(p1x + pInterX) / 2 - 45}
                      y={p1y - 18}
                      width="90"
                      height="15"
                      rx="3"
                      fill={themeStyles.plotBg}
                      stroke={deltaT < 0 ? '#38BDF8' : '#F97316'}
                      strokeWidth="1"
                      opacity="0.92"
                    />
                    <text
                      x={(p1x + pInterX) / 2}
                      y={p1y - 7}
                      textAnchor="middle"
                      fill={deltaT < 0 ? '#38BDF8' : '#F97316'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono"
                    >
                      ΔT: {deltaT > 0 ? '+' : ''}{deltaT.toFixed(1)}°C (Sensible)
                    </text>
                  </g>
                )}

                {/* Latent component vertical leg */}
                {isSignificantDeltaW && (
                  <g>
                    <line
                      x1={pInterX}
                      y1={pInterY}
                      x2={p2x}
                      y2={p2y}
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                      opacity="0.9"
                    />
                    <rect
                      x={pInterX + 6}
                      y={(pInterY + p2y) / 2 - 8}
                      width="106"
                      height="15"
                      rx="3"
                      fill={themeStyles.plotBg}
                      stroke="#10B981"
                      strokeWidth="1"
                      opacity="0.92"
                    />
                    <text
                      x={pInterX + 59}
                      y={(pInterY + p2y) / 2 + 3}
                      textAnchor="middle"
                      fill="#10B981"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono"
                    >
                      Δw: {deltaW > 0 ? '+' : ''}{deltaW.toFixed(2)} g/kg (Latente)
                    </text>
                  </g>
                )}

                {/* Corner indicator circle */}
                {isSignificantDeltaW && isSignificantDeltaT && (
                  <circle cx={pInterX} cy={pInterY} r="3" fill="#F59E0B" />
                )}
              </g>
            );
          })()}

          {/* Passive Module Isenthalpic Indicator (Prefilter, damper, silencer) */}
          {isolatedProcessInfo && isolatedProcessInfo.isPassive && (() => {
            const entry = isolatedProcessInfo.entryPoint;
            const [px, py] = coordToPixel(entry.tdb, entry.w);
            const cardW = 210;
            const cardH = 38;
            const cardX = px + 16 + cardW > viewBoxWidth - margin.right ? -cardW - 16 : 16;
            const cardY = py - 40 < margin.top ? 12 : -40;

            return (
              <g className="isolated-passive-indicator pointer-events-none" transform={`translate(${px}, ${py})`}>
                <circle
                  r="18"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                  className="animate-pulse"
                />
                <circle r="11" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5" />
                <circle r="3" fill="#F59E0B" />

                {/* Informative Callout Card */}
                <g transform={`translate(${cardX}, ${cardY})`}>
                  <rect
                    x="0"
                    y="0"
                    width={cardW}
                    height={cardH}
                    rx="5"
                    fill={themeStyles.plotBg}
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                    opacity="0.95"
                    filter={themeStyles.isDark ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))'}
                  />
                  <text
                    x="8"
                    y="15"
                    fill="#F59E0B"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {isolatedProcessInfo.moduleName} (Isentálpico)
                  </text>
                  <text
                    x="8"
                    y="28"
                    fill={themeStyles.axisText}
                    fontSize="8.5"
                    fontFamily="JetBrains Mono"
                  >
                    ΔT = 0 °C · Δw = 0 g/kg · ΔP = {isolatedProcessInfo.pressureDropPa ?? 0} Pa
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Interactive State Points */}
          <g className="state-points-layer">
            {/* 1. Point markers and selection halos */}
            {points.map((pt) => {
              const isPtIsolated = isPointIsolated(pt.id);
              if (hasActiveIsolation && !isPtIsolated && !dimOtherProcesses) {
                return null;
              }
              const ptOpacity = hasActiveIsolation && !isPtIsolated ? 0.15 : 1;
              const [px, py] = coordToPixel(pt.tdb, pt.w);
              const isSelected = pt.id === selectedPointId;

              return (
                <g
                  key={pt.id}
                  transform={`translate(${px}, ${py})`}
                  className={hasActiveIsolation && !isPtIsolated ? 'pointer-events-none' : 'cursor-pointer'}
                  opacity={ptOpacity}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPoint(pt.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedPointId(pt.id);
                    onSelectPoint(pt.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectPoint(pt.id);
                    setContextMenu({
                      type: 'point',
                      clientX: e.clientX,
                      clientY: e.clientY,
                      pointId: pt.id,
                      tdb: pt.tdb,
                      w: pt.w,
                      rh: pt.rh,
                      h: pt.h,
                    });
                  }}
                >
                  {isSelected && (
                    <circle
                      r="13"
                      fill="none"
                      stroke={pt.color}
                      strokeWidth="2"
                      strokeDasharray="3,3"
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    r="8"
                    fill={themeStyles.isDark ? '#0F172A' : '#FFFFFF'}
                    stroke={pt.color}
                    strokeWidth={isSelected ? '3' : '2'}
                  />
                  <circle r="4" fill={pt.color} />
                </g>
              );
            })}

            {/* 2. Anti-collision Point Labels and Leaders (Never overlap each other, lines, or points) */}
            {layers.pointLabels &&
              labelLayout.placedPointLabels.map((lbl) => {
                const pt = points.find((p) => p.id === lbl.pointId);
                if (!pt) return null;
                const isPtIsolated = isPointIsolated(pt.id);
                if (hasActiveIsolation && !isPtIsolated && !dimOtherProcesses) {
                  return null;
                }
                const lblOpacity = hasActiveIsolation && !isPtIsolated ? 0.15 : 1;
                const isSelected = pt.id === selectedPointId;

                return (
                  <g
                    key={`lbl-${pt.id}`}
                    className="cursor-pointer group"
                    opacity={lblOpacity}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPoint(pt.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectPoint(pt.id);
                      setContextMenu({
                        type: 'point',
                        clientX: e.clientX,
                        clientY: e.clientY,
                        pointId: pt.id,
                        tdb: pt.tdb,
                        w: pt.w,
                        rh: pt.rh,
                        h: pt.h,
                      });
                    }}
                  >
                    {/* Leader Line linking Point Circle to Label Badge */}
                    {lbl.hasLeader && (
                      <line
                        x1={lbl.lineStartX}
                        y1={lbl.lineStartY}
                        x2={lbl.lineEndX}
                        y2={lbl.lineEndY}
                        stroke={pt.color}
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        opacity="0.85"
                      />
                    )}

                    {/* Non-overlapping Label Badge */}
                    <g transform={`translate(${lbl.boxX}, ${lbl.boxY})`}>
                      <rect
                        x="0"
                        y="0"
                        width={lbl.width}
                        height={lbl.height}
                        rx="4"
                        fill={themeStyles.isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.97)'}
                        stroke={isSelected ? pt.color : themeStyles.frameStroke}
                        strokeWidth={isSelected ? '2' : '1.2'}
                        filter={themeStyles.isDark ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))'}
                      />
                      <circle cx="8" cy={lbl.height / 2} r="3" fill={pt.color} />
                      <text
                        x="16"
                        y={lbl.height / 2 + 3.5}
                        fill={themeStyles.isDark ? '#F8FAFC' : '#0F172A'}
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {pt.name}
                      </text>
                    </g>
                  </g>
                );
              })}
          </g>

          {/* Room Condition Line (Recta de Maniobra) & ADP intersection */}
          {showProtractor && activeSHR !== null && activeSHR > 0 && activeSHR <= 1.0 && (() => {
            const refPt = getAshraeReferencePoint(pressure);
            const targetPt = selectedPointId
              ? points.find((p) => p.id === selectedPointId) || { id: 'ref', name: 'Punto Ref. ASHRAE (24°C / 50%)', tdb: refPt.tdb, w: refPt.w }
              : { id: 'ref', name: 'Punto Ref. ASHRAE (24°C / 50%)', tdb: refPt.tdb, w: refPt.w };

            const dWdT = getSlopeFromSHR(activeSHR);
            const adp = calculateADP(targetPt.tdb, targetPt.w, activeSHR, pressure);

            // Starting point at ADP on saturation curve
            const [startX, startY] = adp
              ? coordToPixel(adp.tdbAdp, adp.wAdp)
              : coordToPixel(Math.max(-10, targetPt.tdb - 18), Math.max(0, targetPt.w - dWdT * 18));

            // Extend towards warmer temperatures
            const tHigh = Math.min(50, targetPt.tdb + 12);
            const wHigh = targetPt.w + dWdT * (tHigh - targetPt.tdb);
            const [endX, endY] = coordToPixel(tHigh, Math.max(0, wHigh));
            const [targetX, targetY] = coordToPixel(targetPt.tdb, targetPt.w);

            return (
              <g className="shr-maneuver-rcl pointer-events-none">
                {/* Dashed guideline: complete Recta de Maniobra */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#F59E0B"
                  strokeWidth="2.2"
                  strokeDasharray="6,4"
                />

                {/* Solid emphasis line connecting ADP directly to the active room state point */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={targetX}
                  y2={targetY}
                  stroke="#F59E0B"
                  strokeWidth="3.2"
                />

                {/* Room Target Point Highlight */}
                <circle cx={targetX} cy={targetY} r="5" fill="#F59E0B" />
                <circle cx={targetX} cy={targetY} r="9" fill="none" stroke="#F59E0B" strokeWidth="1.5" />

                {/* Target Point Condition Label */}
                <g transform={`translate(${targetX + 16}, ${targetY - 12})`}>
                  <rect
                    x="-4"
                    y="-11"
                    width="200"
                    height="20"
                    rx="4"
                    fill={themeStyles.isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)'}
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                  />
                  <text
                    x="6"
                    y="3"
                    fill="#F59E0B"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Recta Maniobra SHR={activeSHR.toFixed(2)} · {selectedPointId ? (points.find((p) => p.id === selectedPointId)?.name || 'Punto') : '24°C / 50% HR'}
                  </text>
                </g>

                {/* Apparatus Dew Point (ADP / Punto de Rocío del Aparato) Badge on saturation curve */}
                {adp && (
                  <g transform={`translate(${startX}, ${startY})`}>
                    <circle r="5" fill="#EF4444" />
                    <circle r="9" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,2" />
                    <g transform="translate(14, -6)">
                      <rect
                        x="-4"
                        y="-10"
                        width="168"
                        height="20"
                        rx="4"
                        fill={themeStyles.isDark ? 'rgba(15,23,42,0.95)' : 'rgba(254,242,242,0.95)'}
                        stroke="#EF4444"
                        strokeWidth="1.2"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                      />
                      <text x="6" y="4" fill="#EF4444" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        ADP: {adp.tdbAdp.toFixed(1)}°C · {(adp.wAdp * 1000).toFixed(1)}g/kg
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })()}

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

        {/* ============================================================ */}
        {/* 3. DYNAMIC SCALED AXES & PLOT FRAME (Carrier / Mollier)    */}
        {/* ============================================================ */}
        <g className="chart-outer-axes pointer-events-none select-none">
          {/* Outer rectangular plot border */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="none"
            stroke={themeStyles.axisLine}
            strokeWidth="1.5"
          />

          {chartType === 'carrier' ? (
            /* CARRIER: Bottom Tdb Axis & Right W Axis */
            <>
              {/* Bottom Tdb Axis Ticks & Numbers */}
              <g className="carrier-bottom-axis">
                <line
                  x1={margin.left}
                  y1={margin.top + plotHeight}
                  x2={margin.left + plotWidth}
                  y2={margin.top + plotHeight}
                  stroke={themeStyles.axisLine}
                  strokeWidth="1.5"
                />
                {xTicks.map((t) => {
                  const [px] = coordToPixel(t, bounds.wMin);
                  if (px < margin.left - 1 || px > margin.left + plotWidth + 1) return null;
                  const displayT = units === 'IP' ? UnitConvert.cToF(t).toFixed(0) : t;
                  return (
                    <g key={`carrier-xtick-${t}`}>
                      <line
                        x1={px}
                        y1={margin.top + plotHeight}
                        x2={px}
                        y2={margin.top + plotHeight + 6}
                        stroke={themeStyles.axisLine}
                        strokeWidth="1.2"
                      />
                      <text
                        x={px}
                        y={margin.top + plotHeight + 18}
                        textAnchor="middle"
                        fill={themeStyles.axisText}
                        fontSize="10.5"
                        fontWeight="600"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {displayT}
                      </text>
                    </g>
                  );
                })}
                {/* Bottom Axis Label */}
                <text
                  x={margin.left + plotWidth / 2}
                  y={margin.top + plotHeight + 36}
                  textAnchor="middle"
                  fill={themeStyles.axisLabel}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  Temperatura de Bulbo Seco Tbs [{units === 'IP' ? '°F' : '°C'}] · Presión: {pressure} Pa
                </text>

                {/* Dynamic Cursor Indicator on Bottom Axis */}
                {hoverCoords && !isPanning && hoverCoords.x >= margin.left && hoverCoords.x <= margin.left + plotWidth && (
                  <g className="cursor-indicator-x">
                    <polygon
                      points={`${hoverCoords.x},${margin.top + plotHeight} ${hoverCoords.x - 4},${margin.top + plotHeight + 6} ${hoverCoords.x + 4},${margin.top + plotHeight + 6}`}
                      fill={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
                    />
                    <rect
                      x={hoverCoords.x - 22}
                      y={margin.top + plotHeight + 6}
                      width="44"
                      height="15"
                      rx="3"
                      fill={themeStyles.isDark ? '#0F172A' : '#0284C7'}
                      stroke={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
                      strokeWidth="1"
                    />
                    <text
                      x={hoverCoords.x}
                      y={margin.top + plotHeight + 17}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {units === 'IP' ? `${UnitConvert.cToF(hoverCoords.tdb).toFixed(1)}°F` : `${hoverCoords.tdb.toFixed(1)}°C`}
                    </text>
                  </g>
                )}
              </g>

              {/* Right Humidity Ratio Axis Ticks & Numbers */}
              <g className="carrier-right-axis">
                <line
                  x1={margin.left + plotWidth}
                  y1={margin.top}
                  x2={margin.left + plotWidth}
                  y2={margin.top + plotHeight}
                  stroke={themeStyles.axisLine}
                  strokeWidth="1.5"
                />
                {yTicks.map((wG) => {
                  const [, py] = coordToPixel(bounds.tdbMax, wG / 1000);
                  if (py < margin.top - 1 || py > margin.top + plotHeight + 1) return null;
                  const displayW = units === 'IP' ? ((wG / 1000) * 7000).toFixed(0) : wG;
                  return (
                    <g key={`carrier-ytick-${wG}`}>
                      <line
                        x1={margin.left + plotWidth}
                        y1={py}
                        x2={margin.left + plotWidth + 6}
                        y2={py}
                        stroke={themeStyles.axisLine}
                        strokeWidth="1.2"
                      />
                      <text
                        x={margin.left + plotWidth + 9}
                        y={py + 3.5}
                        textAnchor="start"
                        fill={themeStyles.axisText}
                        fontSize="9.5"
                        fontWeight="600"
                        fontFamily="monospace"
                      >
                        {displayW}
                      </text>
                    </g>
                  );
                })}
                {/* Right Axis Label */}
                <text
                  x={margin.left + plotWidth + 50}
                  y={margin.top + plotHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90, ${margin.left + plotWidth + 50}, ${margin.top + plotHeight / 2})`}
                  fill={themeStyles.axisLabel}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  Humedad Específica W [{units === 'IP' ? 'gr/lb' : 'g/kg(a.s.)'}]
                </text>

                {/* Dynamic Cursor Indicator on Right Axis */}
                {hoverCoords && !isPanning && hoverCoords.y >= margin.top && hoverCoords.y <= margin.top + plotHeight && (
                  <g className="cursor-indicator-y">
                    <polygon
                      points={`${margin.left + plotWidth},${hoverCoords.y} ${margin.left + plotWidth + 6},${hoverCoords.y - 4} ${margin.left + plotWidth + 6},${hoverCoords.y + 4}`}
                      fill={themeStyles.isDark ? '#F59E0B' : '#D97706'}
                    />
                    <rect
                      x={margin.left + plotWidth + 6}
                      y={hoverCoords.y - 7}
                      width="40"
                      height="15"
                      rx="3"
                      fill={themeStyles.isDark ? '#0F172A' : '#D97706'}
                      stroke={themeStyles.isDark ? '#F59E0B' : '#D97706'}
                      strokeWidth="1"
                    />
                    <text
                      x={margin.left + plotWidth + 26}
                      y={hoverCoords.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {units === 'IP' ? `${(hoverCoords.w * 7000).toFixed(0)}gr` : `${(hoverCoords.w * 1000).toFixed(1)}g`}
                    </text>
                  </g>
                )}
              </g>
            </>
          ) : (
            /* MOLLIER: Left Tdb Axis & Top W Axis */
            <>
              {/* Left Tdb Axis Ticks & Numbers */}
              <g className="mollier-left-axis">
                <line
                  x1={margin.left}
                  y1={margin.top}
                  x2={margin.left}
                  y2={margin.top + plotHeight}
                  stroke={themeStyles.axisLine}
                  strokeWidth="1.5"
                />
                {xTicks.map((t) => {
                  const [, py] = coordToPixel(t, bounds.wMin);
                  if (py < margin.top - 1 || py > margin.top + plotHeight + 1) return null;
                  const displayT = units === 'IP' ? UnitConvert.cToF(t).toFixed(0) : t;
                  return (
                    <g key={`mollier-xtick-${t}`}>
                      <line
                        x1={margin.left - 6}
                        y1={py}
                        x2={margin.left}
                        y2={py}
                        stroke={themeStyles.axisLine}
                        strokeWidth="1.2"
                      />
                      <text
                        x={margin.left - 9}
                        y={py + 3.5}
                        textAnchor="end"
                        fill={themeStyles.axisText}
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {displayT}
                      </text>
                    </g>
                  );
                })}
                {/* Left Axis Label */}
                <text
                  x={margin.left - 42}
                  y={margin.top + plotHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90, ${margin.left - 42}, ${margin.top + plotHeight / 2})`}
                  fill={themeStyles.axisLabel}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  Temperatura Tbs [{units === 'IP' ? '°F' : '°C'}]
                </text>

                {/* Dynamic Cursor Indicator on Left Axis */}
                {hoverCoords && !isPanning && hoverCoords.y >= margin.top && hoverCoords.y <= margin.top + plotHeight && (
                  <g className="cursor-indicator-mollier-t">
                    <polygon
                      points={`${margin.left},${hoverCoords.y} ${margin.left - 6},${hoverCoords.y - 4} ${margin.left - 6},${hoverCoords.y + 4}`}
                      fill={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
                    />
                    <rect
                      x={margin.left - 46}
                      y={hoverCoords.y - 7}
                      width="40"
                      height="15"
                      rx="3"
                      fill={themeStyles.isDark ? '#0F172A' : '#0284C7'}
                      stroke={themeStyles.isDark ? '#38BDF8' : '#0284C7'}
                      strokeWidth="1"
                    />
                    <text
                      x={margin.left - 26}
                      y={hoverCoords.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {units === 'IP' ? `${UnitConvert.cToF(hoverCoords.tdb).toFixed(1)}°F` : `${hoverCoords.tdb.toFixed(1)}°C`}
                    </text>
                  </g>
                )}
              </g>

              {/* Top W Axis Ticks & Numbers */}
              <g className="mollier-top-axis">
                <line
                  x1={margin.left}
                  y1={margin.top}
                  x2={margin.left + plotWidth}
                  y2={margin.top}
                  stroke={themeStyles.axisLine}
                  strokeWidth="1.5"
                />
                {yTicks.map((wG) => {
                  const [px] = coordToPixel(bounds.tdbMin, wG / 1000);
                  if (px < margin.left - 1 || px > margin.left + plotWidth + 1) return null;
                  const displayW = units === 'IP' ? ((wG / 1000) * 7000).toFixed(0) : wG;
                  return (
                    <g key={`mollier-ytick-${wG}`}>
                      <line
                        x1={px}
                        y1={margin.top - 6}
                        x2={px}
                        y2={margin.top}
                        stroke={themeStyles.axisLine}
                        strokeWidth="1.2"
                      />
                      <text
                        x={px}
                        y={margin.top - 10}
                        textAnchor="middle"
                        fill={themeStyles.axisText}
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="monospace"
                      >
                        {displayW}
                      </text>
                    </g>
                  );
                })}
                {/* Top Axis Label */}
                <text
                  x={margin.left + plotWidth / 2}
                  y={margin.top - 26}
                  textAnchor="middle"
                  fill={themeStyles.axisLabel}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  Humedad Específica W [{units === 'IP' ? 'gr/lb' : 'g/kg(a.s.)'}] · Presión: {pressure} Pa
                </text>

                {/* Dynamic Cursor Indicator on Top Axis */}
                {hoverCoords && !isPanning && hoverCoords.x >= margin.left && hoverCoords.x <= margin.left + plotWidth && (
                  <g className="cursor-indicator-mollier-w">
                    <polygon
                      points={`${hoverCoords.x},${margin.top} ${hoverCoords.x - 4},${margin.top - 6} ${hoverCoords.x + 4},${margin.top - 6}`}
                      fill={themeStyles.isDark ? '#F59E0B' : '#D97706'}
                    />
                    <rect
                      x={hoverCoords.x - 20}
                      y={margin.top - 21}
                      width="40"
                      height="15"
                      rx="3"
                      fill={themeStyles.isDark ? '#0F172A' : '#D97706'}
                      stroke={themeStyles.isDark ? '#F59E0B' : '#D97706'}
                      strokeWidth="1"
                    />
                    <text
                      x={hoverCoords.x}
                      y={margin.top - 10}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {units === 'IP' ? `${(hoverCoords.w * 7000).toFixed(0)}gr` : `${(hoverCoords.w * 1000).toFixed(1)}g`}
                    </text>
                  </g>
                )}
              </g>
            </>
          )}
        </g>
      </svg>

      {/* Bottom Panning and Context Menu Hint */}
      <div className="absolute bottom-2 left-4 z-10 hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 font-mono pointer-events-none">
        <Move className="w-3 h-3 text-cyan-400" />
        <span>Arrastra para mover · Rueda para zoom · Clic dcho. en puntos/procesos para menú contextual</span>
      </div>

      {/* Context Menu (Right-click on Points, Processes, or Canvas) */}
      {contextMenu && (
        <ChartContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          points={points}
          processes={processes}
          selectedPointId={selectedPointId}
          onSelectPoint={onSelectPoint}
          onCenterPoint={handleCenterPoint}
          onCenterProcess={handleCenterProcess}
          onZoomAll={handleZoomAll}
          onCenterCycle={handleCenterCycle}
          onResetBounds={handleResetBounds}
          onAddPointAtCoordinates={onAddPointAtCoordinates}
          onDeletePoint={onDeletePoint}
          onDeleteProcess={onDeleteProcess}
          onDuplicatePoint={onDuplicatePoint}
          isolatedProcessInfo={isolatedProcessInfo}
          onSetIsolatedProcessInfo={onSetIsolatedProcessInfo}
          dimOtherProcesses={dimOtherProcesses}
          onToggleDimOtherProcesses={() => setDimOtherProcesses(!dimOtherProcesses)}
          showProtractor={showProtractor}
          onToggleProtractor={handleToggleProtractor}
          showEnthalpyDeviations={showEnthalpyDeviations}
          onToggleEnthalpyDeviations={() => setShowEnthalpyDeviations(!showEnthalpyDeviations)}
          onLocateModuleInAhu={onLocateModuleInAhu}
          isSplitView={isSplitView}
        />
      )}
    </div>
  );
};
