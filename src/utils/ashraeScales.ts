import {
  getSaturationHumidityRatio,
  getEnthalpy,
  getWFromEnthalpy,
  getWFromTdbTwb,
  getWFromTdbRh,
  getRelativeHumidity,
  getWetBulb,
  P_ATM_STANDARD,
} from './psychrolib';

/**
 * Thermodynamic and Geometric calculations for official ASHRAE Chart No. 1 and Mollier h-x Chart:
 * - ASHRAE Sensible Heat Ratio (SHR / FCS) Protractor
 * - Mollier Sensible Heat Ratio (SHR / FCS) Protractor
 * - Enthalpy Deviation Lines (Curvas de Desviación de Entalpía)
 * - Apparatus Dew Point (ADP / Punto de Rocío del Aparato) Exact Solver
 * - Perimeter Enthalpy Scale along Saturation boundary
 */

export interface ProtractorRay {
  shr: number;
  label: string;
  angleRad: number; // Angle in radians
  isMajor: boolean;
  deltaHDeltaW?: number; // Inner scale delta_h / delta_w in kJ/g
}

export interface EnthalpyTick {
  h: number; // kJ/kg
  label: string;
  tdbSat: number;
  wSat: number;
  isMajor: boolean;
}

export interface EnthalpyDeviationLine {
  deviation: number; // e.g. -0.2, -0.4, -0.6, -0.8, -1.0 kJ/kg
  points: Array<{ tdb: number; w: number }>;
}

// Canonical ASHRAE Protractor SHR tick values (matching Chart No. 1)
export const ASHRAE_SHR_VALUES: Array<{ shr: number; label: string; isMajor: boolean; deltaHDeltaW?: number }> = [
  { shr: 1.00, label: '1.00', isMajor: true, deltaHDeltaW: Infinity },
  { shr: 0.95, label: '.95', isMajor: false, deltaHDeltaW: 50.0 },
  { shr: 0.90, label: '.90', isMajor: true, deltaHDeltaW: 25.0 },
  { shr: 0.85, label: '.85', isMajor: false, deltaHDeltaW: 16.7 },
  { shr: 0.80, label: '.80', isMajor: true, deltaHDeltaW: 12.5 },
  { shr: 0.75, label: '.75', isMajor: false, deltaHDeltaW: 10.0 },
  { shr: 0.70, label: '.70', isMajor: true, deltaHDeltaW: 8.33 },
  { shr: 0.65, label: '.65', isMajor: false, deltaHDeltaW: 7.14 },
  { shr: 0.60, label: '.60', isMajor: true, deltaHDeltaW: 6.25 },
  { shr: 0.55, label: '.55', isMajor: false, deltaHDeltaW: 5.56 },
  { shr: 0.50, label: '.50', isMajor: true, deltaHDeltaW: 5.0 },
  { shr: 0.45, label: '.45', isMajor: false, deltaHDeltaW: 4.55 },
  { shr: 0.40, label: '.40', isMajor: true, deltaHDeltaW: 4.17 },
  { shr: 0.36, label: '.36', isMajor: true, deltaHDeltaW: 3.91 },
  { shr: 0.30, label: '.30', isMajor: false, deltaHDeltaW: 3.57 },
  { shr: 0.20, label: '.20', isMajor: true, deltaHDeltaW: 3.12 },
  { shr: 0.00, label: '0.0', isMajor: true, deltaHDeltaW: 2.50 },
  { shr: -0.20, label: '-.20', isMajor: false, deltaHDeltaW: 2.08 },
  { shr: -0.50, label: '-.50', isMajor: true, deltaHDeltaW: 1.67 },
  { shr: -1.00, label: '-1.0', isMajor: true, deltaHDeltaW: 1.25 },
];

// Canonical Mollier Protractor SHR tick values
export const MOLLIER_SHR_VALUES: Array<{ shr: number; label: string; isMajor: boolean; deltaHDeltaW?: number }> = [
  { shr: 1.00, label: '1.0', isMajor: true, deltaHDeltaW: Infinity },
  { shr: 0.90, label: '0.9', isMajor: true, deltaHDeltaW: 25.0 },
  { shr: 0.80, label: '0.8', isMajor: true, deltaHDeltaW: 12.5 },
  { shr: 0.70, label: '0.7', isMajor: true, deltaHDeltaW: 8.33 },
  { shr: 0.60, label: '0.6', isMajor: true, deltaHDeltaW: 6.25 },
  { shr: 0.50, label: '0.5', isMajor: true, deltaHDeltaW: 5.0 },
  { shr: 0.40, label: '0.4', isMajor: true, deltaHDeltaW: 4.17 },
  { shr: 0.30, label: '0.3', isMajor: true, deltaHDeltaW: 3.57 },
  { shr: 0.20, label: '0.2', isMajor: true, deltaHDeltaW: 3.12 },
  { shr: 0.10, label: '0.1', isMajor: false, deltaHDeltaW: 2.78 },
  { shr: 0.00, label: '0.0', isMajor: true, deltaHDeltaW: 2.50 },
  { shr: -0.20, label: '-0.2', isMajor: false, deltaHDeltaW: 2.08 },
  { shr: -0.50, label: '-0.5', isMajor: true, deltaHDeltaW: 1.67 },
  { shr: -1.00, label: '-1.0', isMajor: true, deltaHDeltaW: 1.25 },
  { shr: -2.00, label: '-2.0', isMajor: false, deltaHDeltaW: 0.83 },
  { shr: -4.00, label: '-4.0', isMajor: false, deltaHDeltaW: 0.50 },
];

/**
 * Calculates physical slope dW / dT for a given Sensible Heat Ratio (SHR = Qs / Qt).
 * Based on exact thermodynamic formulation:
 * Qs = mDot * cpa * deltaT
 * Qt = mDot * deltaH = mDot * (cpa * deltaT + hfg * deltaW)
 * SHR = Qs / Qt => deltaW / deltaT = (cpa / hfg) * (1 - SHR) / SHR
 */
export function getSlopeFromSHR(shr: number): number {
  if (Math.abs(shr) < 0.0001) return 1e6; // Pure latent process: vertical line (infinite dW/dT)
  const cpa = 1.006;   // kJ/(kg*K)
  const hfg = 2501.0;  // kJ/kg at 0°C
  return (cpa / hfg) * ((1 - shr) / shr);
}

/**
 * Calculates angle in SVG space for an SHR ray on Carrier psychrometric chart (Tdb on X, W on Y).
 * 0 radians = pure sensible cooling (horizontal left: dx < 0, dy = 0).
 * PI / 2 radians = pure latent cooling (vertical down: dx = 0, dy > 0).
 */
export function getProtractorAngle(
  shr: number,
  plotWidth: number,
  plotHeight: number,
  spanT: number,
  spanW: number
): number {
  if (Math.abs(shr) < 0.0001) {
    return Math.PI / 2; // Exact 90 degrees straight down in SVG
  }
  const dWdT = getSlopeFromSHR(shr);
  const scaleX = plotWidth / spanT;
  const scaleY = plotHeight / spanW;

  return Math.atan2(dWdT * scaleY, scaleX);
}

/**
 * Inverts angle in SVG space back to Sensible Heat Ratio for Carrier chart.
 */
export function getCarrierSHRFromAngle(
  angleRad: number,
  plotWidth: number,
  plotHeight: number,
  spanT: number,
  spanW: number
): number {
  const scaleX = plotWidth / spanT;
  const scaleY = plotHeight / spanW;
  const cpa = 1.006;
  const hfg = 2501.0;
  const factor = (cpa / hfg) * (scaleY / scaleX);
  const tanA = Math.tan(angleRad);
  if (tanA <= 0) return 1.0;
  const shr = factor / (factor + tanA);
  return Math.max(-2.0, Math.min(1.0, shr));
}

/**
 * Calculates angle in SVG space for an SHR ray on Mollier h-x diagram (W on X, Tdb on Y).
 * 0 radians = pure latent dehumidification (horizontal left: dx < 0, dy = 0).
 * PI / 2 radians = pure sensible cooling (vertical down: dx = 0, dy > 0).
 * 100% strictly parallel to process line on Mollier screen.
 */
export function getMollierProtractorAngle(
  shr: number,
  plotWidth: number,
  plotHeight: number,
  spanT: number,
  spanW: number
): number {
  if (shr >= 1.0) {
    return Math.PI / 2; // Exact 90 degrees straight down in SVG (pure sensible cooling)
  }
  if (shr <= 0.0) {
    return 0; // Pure latent
  }
  const scaleX = plotWidth / spanW;
  const scaleY = plotHeight / spanT;
  const cpa = 1.006;
  const hfg = 2501.0;
  // dy / -dx = (dT * scaleY) / (dW * scaleX) = (scaleY / scaleX) * (hfg / cpa) * (shr / (1 - shr))
  const factor = (hfg / cpa) * (scaleY / scaleX);
  return Math.atan(factor * (shr / Math.max(0.0001, 1 - shr)));
}

/**
 * Inverts angle in SVG space back to Sensible Heat Ratio for Mollier chart.
 */
export function getMollierSHRFromAngle(
  gammaRad: number,
  plotWidth: number,
  plotHeight: number,
  spanT: number,
  spanW: number
): number {
  if (gammaRad >= Math.PI / 2 - 0.001) return 1.0;
  if (gammaRad <= 0.001) return 0.0;
  const scaleX = plotWidth / spanW;
  const scaleY = plotHeight / spanT;
  const cpa = 1.006;
  const hfg = 2501.0;
  const factor = (hfg / cpa) * (scaleY / scaleX);
  const tanG = Math.tan(gammaRad);
  const shr = tanG / (factor + tanG);
  return Math.max(0.0, Math.min(1.0, shr));
}

/**
 * Computes the official ASHRAE Enthalpy Deviation Lines.
 * Deviation D = h_actual - h_saturation(Twb).
 * Returns array of coordinates for deviations: -0.1, -0.2, -0.4, -0.6, -0.8, -1.0, -1.2 kJ/kg
 */
export function computeEnthalpyDeviations(
  pressure: number,
  tdbMin: number,
  tdbMax: number,
  wMin: number,
  wMax: number
): EnthalpyDeviationLine[] {
  const targetDeviations = [-0.1, -0.2, -0.4, -0.6, -0.8, -1.0, -1.2];
  const lines: EnthalpyDeviationLine[] = [];

  for (const dev of targetDeviations) {
    const pts: Array<{ tdb: number; w: number }> = [];

    // Sample across dry-bulb range where this deviation occurs (typically 20°C to 55°C)
    for (let tdb = Math.max(15, tdbMin); tdb <= Math.min(55, tdbMax); tdb += 1.0) {
      // Find the humidity ratio w that yields this deviation:
      // We search for Twb such that getEnthalpy(tdb, w(tdb, Twb)) - getEnthalpy(Twb, wSat(Twb)) = dev
      // For a fixed tdb, as w decreases (lower RH), deviation becomes more negative.
      let lowW = 0.0001;
      const highW = Math.min(wMax, getSaturationHumidityRatio(tdb, pressure) * 0.95);

      if (highW <= lowW) continue;

      let bestW: number | null = null;
      let minDiff = Infinity;

      for (let w = lowW; w <= highW; w += 0.0004) {
        const hActual = getEnthalpy(tdb, w);
        const twb = getWetBulb(tdb, w, pressure);
        const wSatTwb = getSaturationHumidityRatio(twb, pressure);
        const hSatTwb = getEnthalpy(twb, wSatTwb);
        const curDev = hActual - hSatTwb;

        const diff = Math.abs(curDev - dev);
        if (diff < minDiff && diff < 0.05) {
          minDiff = diff;
          bestW = w;
        }
      }

      if (bestW !== null && bestW >= wMin && bestW <= wMax) {
        pts.push({ tdb, w: bestW });
      }
    }

    if (pts.length > 3) {
      lines.push({ deviation: dev, points: pts });
    }
  }

  return lines;
}

/**
 * Computes exact graduation ticks for Enthalpy of Saturation along the 100% RH boundary
 */
export function computeSaturationEnthalpyTicks(
  pressure: number,
  tdbMin: number,
  tdbMax: number,
  wMax: number
): EnthalpyTick[] {
  const ticks: EnthalpyTick[] = [];

  // Enthalpy range from 10 to 140 kJ/kg
  for (let h = 10; h <= 140; h += 5) {
    // Find the saturation temperature where h_sat(T) = h
    let lowT = tdbMin;
    let highT = Math.min(60, tdbMax + 10);

    for (let iter = 0; iter < 18; iter++) {
      const midT = (lowT + highT) / 2;
      const ws = getSaturationHumidityRatio(midT, pressure);
      const hSat = getEnthalpy(midT, ws);
      if (hSat < h) {
        lowT = midT;
      } else {
        highT = midT;
      }
    }

    const tdbSat = (lowT + highT) / 2;
    const wSat = getSaturationHumidityRatio(tdbSat, pressure);

    if (tdbSat >= tdbMin && tdbSat <= tdbMax + 5 && wSat <= wMax * 1.05) {
      ticks.push({
        h,
        label: `${h}`,
        tdbSat,
        wSat,
        isMajor: h % 10 === 0,
      });
    }
  }

  return ticks;
}

/**
 * Standard ASHRAE Reference State Point:
 * Tdb = 24.0°C (75.2°F), RH = 50%
 */
export function getAshraeReferencePoint(pressure: number = P_ATM_STANDARD) {
  const tdb = 24.0;
  const rh = 50.0;
  const w = getWFromTdbRh(tdb, rh, pressure);
  const h = getEnthalpy(tdb, w);
  const twb = getWetBulb(tdb, w, pressure);
  return { tdb, rh, w, h, twb };
}

/**
 * Calculates the exact thermodynamic Apparatus Dew Point (ADP / Punto de Rocío del Aparato)
 * for a room state (tdb, w) and a Sensible Heat Ratio (SHR).
 * Finds the intersection of the Room Condition Line with the 100% saturation curve.
 * Returns null if no physical intersection exists (e.g. coil requires reheat or chemical drying).
 */
export function calculateADP(
  tdb: number,
  w: number,
  shr: number,
  pressure: number = P_ATM_STANDARD
): { tdbAdp: number; wAdp: number; hAdp: number } | null {
  if (shr <= 0 || shr > 1.0) {
    const wSat = getSaturationHumidityRatio(tdb, pressure);
    if (w >= wSat) {
      return { tdbAdp: Number(tdb.toFixed(2)), wAdp: Number(wSat.toFixed(5)), hAdp: Number(getEnthalpy(tdb, wSat).toFixed(2)) };
    }
    return null;
  }

  const wSatTdb = getSaturationHumidityRatio(tdb, pressure);
  if (w >= wSatTdb) {
    return { tdbAdp: Number(tdb.toFixed(2)), wAdp: Number(wSatTdb.toFixed(5)), hAdp: Number(getEnthalpy(tdb, wSatTdb).toFixed(2)) };
  }

  const dWdT = getSlopeFromSHR(shr);
  if (dWdT <= 0) {
    // Pure sensible process (SHR = 1.0): horizontal line w = const
    let lowT = -25;
    let highT = tdb;
    if (getSaturationHumidityRatio(lowT, pressure) > w) return null;
    for (let i = 0; i < 30; i++) {
      const midT = (lowT + highT) / 2;
      if (getSaturationHumidityRatio(midT, pressure) < w) lowT = midT;
      else highT = midT;
    }
    const tAdp = (lowT + highT) / 2;
    return {
      tdbAdp: Number(tAdp.toFixed(2)),
      wAdp: Number(w.toFixed(5)),
      hAdp: Number(getEnthalpy(tAdp, w).toFixed(2)),
    };
  }

  // Temperature where the line hits w = 0 (absolute dryness)
  const tZero = tdb - w / dWdT;
  const minT = Math.max(-25, tZero);

  // Search for bracket where f(T) = wSat(T) - wLine(T) crosses 0
  // At tdb: wSat(tdb) > w (room is unsaturated), so f(tdb) > 0
  let bracketFound = false;
  let lowT = minT;
  let highT = tdb;

  const steps = 60;
  const dt = (tdb - minT) / steps;
  let prevT = tdb;

  for (let i = 1; i <= steps; i++) {
    const curT = tdb - i * dt;
    const curWLine = w - dWdT * (tdb - curT);
    if (curWLine < 0) break;
    const curWSat = getSaturationHumidityRatio(curT, pressure);
    const curF = curWSat - curWLine;

    if (curF <= 0) {
      lowT = curT;
      highT = prevT;
      bracketFound = true;
      break;
    }
    prevT = curT;
  }

  if (!bracketFound) {
    // Room condition line does not cross 100% saturation in the physical zone
    return null;
  }

  // Refine intersection root with bisection
  for (let i = 0; i < 30; i++) {
    const midT = (lowT + highT) / 2;
    const wLineMid = w - dWdT * (tdb - midT);
    const wSatMid = getSaturationHumidityRatio(midT, pressure);
    const diff = wSatMid - wLineMid;

    if (diff > 0) {
      highT = midT;
    } else {
      lowT = midT;
    }
  }

  const tdbAdp = (lowT + highT) / 2;
  const wAdp = getSaturationHumidityRatio(tdbAdp, pressure);
  const hAdp = getEnthalpy(tdbAdp, wAdp);

  return {
    tdbAdp: Number(tdbAdp.toFixed(2)),
    wAdp: Number(wAdp.toFixed(5)),
    hAdp: Number(hAdp.toFixed(2)),
  };
}
