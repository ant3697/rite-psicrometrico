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
 * Thermodynamic and Geometric calculations for official ASHRAE Chart No. 1:
 * - ASHRAE Sensible Heat Ratio (SHR) Protractor
 * - Enthalpy Deviation Lines (Curvas de Desviación de Entalpía)
 * - Perimeter Enthalpy Scale along Saturation boundary
 * - Sensible Heat Factor vertical scale
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
  { shr: 0.70, label: '.70', isMajor: true, deltaHDeltaW: 8.3 },
  { shr: 0.65, label: '.65', isMajor: false, deltaHDeltaW: 7.1 },
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
 * Calculates angle in SVG space for an SHR ray taking into account the canvas scaling.
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
  // Scale factors (pixels per unit)
  const scaleX = plotWidth / spanT;
  const scaleY = plotHeight / spanW;

  // In SVG coordinates, moving towards cooler temperatures (left, -X) and lower moisture (down, +Y in SVG).
  // The physical angle of the process vector:
  const angle = Math.atan2(dWdT * scaleY, scaleX);
  return angle;
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
        const twb = getWetBulb(tdb, getRelativeHumidity(tdb, w, pressure), pressure);
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
  const twb = getWetBulb(tdb, rh, pressure);
  return { tdb, rh, w, h, twb };
}

/**
 * Calculates the exact thermodynamic Apparatus Dew Point (ADP / Punto de Rocío del Aparato)
 * for a room state (tdb, w) and a Sensible Heat Ratio (SHR).
 * Finds the intersection of the Room Condition Line with the 100% saturation curve.
 */
export function calculateADP(
  tdb: number,
  w: number,
  shr: number,
  pressure: number = P_ATM_STANDARD
): { tdbAdp: number; wAdp: number; hAdp: number } | null {
  if (shr <= 0 || shr > 1.0) {
    // Pure latent or unconventional process
    const wSat = getSaturationHumidityRatio(tdb, pressure);
    if (w >= wSat) {
      return { tdbAdp: tdb, wAdp: wSat, hAdp: getEnthalpy(tdb, wSat) };
    }
  }

  const dWdT = getSlopeFromSHR(shr);

  // Line equation: wLine(T) = w - dWdT * (tdb - T)
  // We search for T in [-10, tdb] such that wSat(T) - wLine(T) = 0
  let lowT = -10;
  let highT = tdb;

  // Check if at tdb state is already saturated
  const wSatTdb = getSaturationHumidityRatio(tdb, pressure);
  if (w >= wSatTdb) {
    return { tdbAdp: tdb, wAdp: wSatTdb, hAdp: getEnthalpy(tdb, wSatTdb) };
  }

  // Value at highT: wSat(tdb) - w > 0
  const fHigh = wSatTdb - w;

  // Check if there is an intersection in range
  const wLineLow = w - dWdT * (tdb - lowT);
  const wSatLow = getSaturationHumidityRatio(lowT, pressure);
  const fLow = wSatLow - wLineLow;

  if (fHigh * fLow > 0) {
    // If no sign change down to -10°C, search lower down to -30°C
    lowT = -30;
  }

  // Bisection search
  for (let i = 0; i < 28; i++) {
    const midT = (lowT + highT) / 2;
    const wLineMid = w - dWdT * (tdb - midT);
    const wSatMid = getSaturationHumidityRatio(midT, pressure);
    const diff = wSatMid - wLineMid;

    if (diff > 0) {
      // Saturation is above the line, root is at lower T
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
