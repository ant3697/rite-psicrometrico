/**
 * Psychrometric Engine based on ASHRAE Fundamentals 2021 formulation.
 * All core thermodynamic calculations are performed internally in standard SI units:
 * - Temperature: °C (converted to Kelvin for thermodynamic equations: T_K = T + 273.15)
 * - Humidity Ratio (W): kg H2O / kg dry air
 * - Pressure: kPa
 * - Enthalpy: kJ/kg dry air
 * - Specific Volume: m³/kg dry air
 * - Relative Humidity: % (0 to 100)
 */

import { StatePoint, PsychroInputs } from '../types/psychrometrics';

// Constants
export const P_ATM_STANDARD = 101.325; // kPa standard atmospheric pressure at sea level
export const R_DA = 0.287042;          // Gas constant for dry air in kJ/(kg·K)
export const C_PA = 1.006;             // Specific heat of dry air in kJ/(kg·K)
export const C_PW = 1.86;              // Specific heat of water vapor in kJ/(kg·K)
export const H_FG = 2501.0;            // Latent heat of vaporization of water at 0°C in kJ/kg
export const C_PL = 4.186;             // Specific heat of liquid water in kJ/(kg·K)

/**
 * Atmospheric pressure as a function of altitude (m) using standard international barometric formula.
 */
export function pressureFromAltitude(altitudeMeters: number): number {
  if (altitudeMeters <= 0) return P_ATM_STANDARD;
  return P_ATM_STANDARD * Math.pow(1 - 2.25577e-5 * altitudeMeters, 5.2559);
}

/**
 * Altitude (m) as a function of atmospheric pressure (kPa).
 */
export function altitudeFromPressure(pressureKPa: number): number {
  if (pressureKPa >= P_ATM_STANDARD) return 0;
  return (1 - Math.pow(pressureKPa / P_ATM_STANDARD, 1 / 5.2559)) / 2.25577e-5;
}

/**
 * Saturation vapor pressure P_ws (kPa) over liquid water or ice as a function of dry-bulb temperature (°C).
 * Formulas from ASHRAE Handbook - Fundamentals (2021), Chapter 1.
 */
export function getSaturationVaporPressure(tCelsius: number): number {
  const T = tCelsius + 273.15; // Temperature in Kelvin
  let lnPws = 0;

  if (tCelsius < 0) {
    // Over ice: -100°C to 0°C
    const c1 = -5.6745359e3;
    const c2 = 6.3925247;
    const c3 = -9.677843e-3;
    const c4 = 6.2215701e-7;
    const c5 = 2.0747825e-9;
    const c6 = -9.484024e-13;
    const c7 = 4.1635019;
    lnPws =
      c1 / T +
      c2 +
      c3 * T +
      c4 * T * T +
      c5 * Math.pow(T, 3) +
      c6 * Math.pow(T, 4) +
      c7 * Math.log(T);
  } else {
    // Over liquid water: 0°C to 200°C
    const c8 = -5.8002206e3;
    const c9 = 1.3914993;
    const c10 = -4.8640239e-2;
    const c11 = 4.1764768e-5;
    const c12 = -1.4452093e-8;
    const c13 = 6.5459673;
    lnPws =
      c8 / T +
      c9 +
      c10 * T +
      c11 * T * T +
      c12 * Math.pow(T, 3) +
      c13 * Math.log(T);
  }

  // Equation gives Pa, convert to kPa (1 kPa = 1000 Pa)
  const pPa = Math.exp(lnPws);
  return pPa / 1000.0;
}

/**
 * Derivative of P_ws with respect to temperature (°C) for fast Newton-Raphson inversion.
 */
export function getSaturationVaporPressureDerivative(tCelsius: number): number {
  const dt = 0.001;
  const p1 = getSaturationVaporPressure(tCelsius - dt);
  const p2 = getSaturationVaporPressure(tCelsius + dt);
  return (p2 - p1) / (2 * dt);
}

/**
 * Humidity ratio W (kg H2O / kg dry air) from partial vapor pressure Pv (kPa) and atmospheric pressure P (kPa).
 */
export function getHumidityRatioFromPv(pv: number, pAtm: number = P_ATM_STANDARD): number {
  if (pv >= pAtm) {
    return 0.1; // Safety clamp to prevent division by zero or negative
  }
  return (0.621945 * pv) / Math.max(0.001, pAtm - pv);
}

/**
 * Partial vapor pressure Pv (kPa) from humidity ratio W (kg/kg) and atmospheric pressure P (kPa).
 */
export function getPvFromHumidityRatio(w: number, pAtm: number = P_ATM_STANDARD): number {
  return (pAtm * w) / (0.621945 + w);
}

/**
 * Specific enthalpy h (kJ/kg dry air) from dry bulb T (°C) and humidity ratio W (kg/kg).
 */
export function getEnthalpy(tdb: number, w: number): number {
  return C_PA * tdb + w * (H_FG + C_PW * tdb);
}

/**
 * Humidity ratio W from dry bulb T (°C) and enthalpy h (kJ/kg).
 */
export function getWFromEnthalpy(tdb: number, h: number): number {
  const denom = H_FG + C_PW * tdb;
  return Math.max(0, (h - C_PA * tdb) / denom);
}

/**
 * Specific volume v (m³/kg dry air) from dry bulb T (°C), humidity ratio W, and atmospheric pressure P (kPa).
 */
export function getSpecificVolume(tdb: number, w: number, pAtm: number = P_ATM_STANDARD): number {
  const TK = tdb + 273.15;
  return (R_DA * TK * (1 + 1.6078 * w)) / pAtm;
}

/**
 * Moist air density rho (kg/m³) from specific volume and humidity ratio.
 */
export function getAirDensity(v: number, w: number): number {
  if (v <= 0) return 1.2;
  return (1 + w) / v;
}

/**
 * Dew point temperature T_dp (°C) from partial vapor pressure Pv (kPa).
 * Solved via Newton-Raphson with guaranteed convergence.
 */
export function getDewPoint(pv: number): number {
  if (pv <= 0.001) return -50;
  // Initial estimate using Magnus-Tetens formula approximation
  const alpha = Math.log(pv / 0.61078);
  let tdp = (237.3 * alpha) / (17.27 - alpha);

  // 3 iterations of Newton-Raphson to reach ASHRAE exact precision
  for (let i = 0; i < 6; i++) {
    const pCurrent = getSaturationVaporPressure(tdp);
    const diff = pCurrent - pv;
    if (Math.abs(diff) < 1e-6) break;
    const dpDt = getSaturationVaporPressureDerivative(tdp);
    if (Math.abs(dpDt) < 1e-9) break;
    tdp = tdp - diff / dpDt;
  }
  return tdp;
}

/**
 * Humidity ratio at saturation W_s (kg/kg) at given temperature and pressure.
 */
export function getSaturationHumidityRatio(tdb: number, pAtm: number = P_ATM_STANDARD): number {
  const pws = getSaturationVaporPressure(tdb);
  return getHumidityRatioFromPv(pws, pAtm);
}

/**
 * Wet bulb temperature T_wb (°C) from dry bulb T_db (°C), humidity ratio W, and pressure P (kPa).
 * Solves thermodynamic wet-bulb equation:
 * W = ((2501 - 2.326*Twb)*Ws(Twb) - 1.006*(Tdb - Twb)) / (2501 + 1.86*Tdb - 4.186*Twb)
 */
export function getWetBulb(tdb: number, w: number, pAtm: number = P_ATM_STANDARD): number {
  const tdp = getDewPoint(getPvFromHumidityRatio(w, pAtm));
  if (Math.abs(tdb - tdp) < 0.05) {
    return tdb; // Saturation condition
  }

  // Wet bulb lies between dew point and dry bulb: T_dp <= T_wb <= T_db
  let low = Math.min(tdp, tdb);
  let high = Math.max(tdp, tdb);

  // Expand bounds slightly to ensure bracket
  low = low - 0.5;
  high = high + 0.5;

  const residual = (twbCandidate: number): number => {
    const ws = getSaturationHumidityRatio(twbCandidate, pAtm);
    const num = (H_FG - 2.326 * twbCandidate) * ws - C_PA * (tdb - twbCandidate);
    const den = H_FG + C_PW * tdb - C_PL * twbCandidate;
    const wCalc = num / den;
    return wCalc - w;
  };

  // Bracketed bisection solver
  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const fMid = residual(mid);
    if (Math.abs(fMid) < 1e-7 || Math.abs(high - low) < 1e-5) {
      return mid;
    }
    const fLow = residual(low);
    if (fLow * fMid < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Humidity ratio W calculated from dry bulb T_db (°C) and wet bulb T_wb (°C).
 */
export function getWFromTdbTwb(tdb: number, twb: number, pAtm: number = P_ATM_STANDARD): number {
  if (twb >= tdb) {
    return getSaturationHumidityRatio(tdb, pAtm);
  }
  const wsTwb = getSaturationHumidityRatio(twb, pAtm);
  const num = (H_FG - 2.326 * twb) * wsTwb - C_PA * (tdb - twb);
  const den = H_FG + C_PW * tdb - C_PL * twb;
  return Math.max(0, num / den);
}

/**
 * Relative humidity RH (%) from dry bulb and humidity ratio.
 */
export function getRelativeHumidity(tdb: number, w: number, pAtm: number = P_ATM_STANDARD): number {
  const pv = getPvFromHumidityRatio(w, pAtm);
  const pws = getSaturationVaporPressure(tdb);
  const rh = (pv / pws) * 100;
  return Math.min(100, Math.max(0, rh));
}

/**
 * Humidity ratio W from dry bulb and relative humidity RH (%).
 */
export function getWFromTdbRh(tdb: number, rh: number, pAtm: number = P_ATM_STANDARD): number {
  const clampedRh = Math.min(100, Math.max(0.1, rh));
  const pws = getSaturationVaporPressure(tdb);
  const pv = (clampedRh / 100.0) * pws;
  return getHumidityRatioFromPv(pv, pAtm);
}

/**
 * Universal Psychrometric Solver:
 * Computes all 9 properties for a state point from ANY valid pair of inputs.
 */
export function solveStatePoint(
  inputs: PsychroInputs,
  pAtm: number = P_ATM_STANDARD,
  existingPoint?: Partial<StatePoint>
): StatePoint {
  let tdb = 20;
  let w = 0.007;

  switch (inputs.mode) {
    case 'tdb_rh': {
      tdb = inputs.tdb ?? 24;
      const rh = inputs.rh ?? 50;
      w = getWFromTdbRh(tdb, rh, pAtm);
      break;
    }
    case 'tdb_twb': {
      tdb = inputs.tdb ?? 24;
      const twb = inputs.twb ?? 17;
      w = getWFromTdbTwb(tdb, Math.min(tdb, twb), pAtm);
      break;
    }
    case 'tdb_tdp': {
      tdb = inputs.tdb ?? 24;
      const tdp = Math.min(tdb, inputs.tdp ?? 12);
      const pv = getSaturationVaporPressure(tdp);
      w = getHumidityRatioFromPv(pv, pAtm);
      break;
    }
    case 'tdb_w': {
      tdb = inputs.tdb ?? 24;
      // w in kg/kg (or g/kg if > 2.0)
      const rawW = inputs.w ?? 0.008;
      w = rawW > 2.0 ? rawW / 1000 : rawW;
      const wMax = getSaturationHumidityRatio(tdb, pAtm);
      w = Math.min(wMax, Math.max(0, w));
      break;
    }
    case 'tdb_h': {
      tdb = inputs.tdb ?? 24;
      const h = inputs.h ?? 50;
      w = getWFromEnthalpy(tdb, h);
      const wMax = getSaturationHumidityRatio(tdb, pAtm);
      w = Math.min(wMax, Math.max(0, w));
      break;
    }
    case 'h_w': {
      const rawW = inputs.w ?? 0.008;
      w = rawW > 2.0 ? rawW / 1000 : rawW;
      const h = inputs.h ?? 50;
      // h = C_PA * T + W * (H_FG + C_PW * T) = T * (C_PA + W * C_PW) + W * H_FG
      tdb = (h - w * H_FG) / (C_PA + w * C_PW);
      break;
    }
    case 'twb_rh': {
      const twb = inputs.twb ?? 18;
      const rh = inputs.rh ?? 50;
      // Solve for Tdb such that getRelativeHumidity(Tdb, W(Tdb, Twb)) === rh
      let low = twb;
      let high = twb + 40;
      for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        const wCandidate = getWFromTdbTwb(mid, twb, pAtm);
        const rhCandidate = getRelativeHumidity(mid, wCandidate, pAtm);
        if (rhCandidate > rh) {
          low = mid;
        } else {
          high = mid;
        }
      }
      tdb = (low + high) / 2;
      w = getWFromTdbTwb(tdb, twb, pAtm);
      break;
    }
    default: {
      tdb = inputs.tdb ?? 20;
      w = getWFromTdbRh(tdb, 50, pAtm);
    }
  }

  // Clamp w to saturation if higher
  const ws = getSaturationHumidityRatio(tdb, pAtm);
  if (w > ws) {
    w = ws;
  }

  const pv = getPvFromHumidityRatio(w, pAtm);
  const rh = getRelativeHumidity(tdb, w, pAtm);
  const twb = getWetBulb(tdb, w, pAtm);
  const tdp = getDewPoint(pv);
  const h = getEnthalpy(tdb, w);
  const v = getSpecificVolume(tdb, w, pAtm);
  const rho = getAirDensity(v, w);

  const volumeFlow = existingPoint?.volumeFlow ?? 1000; // m³/h
  const massFlow = (volumeFlow / 3600) * (1 / v);       // kg/s dry air

  return {
    id: existingPoint?.id ?? `pt-${Date.now()}`,
    name: existingPoint?.name ?? 'Punto',
    color: existingPoint?.color ?? '#06B6D4',
    tdb,
    w,
    twb,
    tdp,
    rh,
    h,
    v,
    pv,
    rho,
    volumeFlow,
    massFlow,
    isLocked: existingPoint?.isLocked ?? false,
  };
}

/**
 * Unit Conversion Helpers
 */
export const UnitConvert = {
  // Temperature
  cToF: (c: number) => (c * 9) / 5 + 32,
  fToC: (f: number) => ((f - 32) * 5) / 9,

  // Humidity Ratio: kg/kg <-> g/kg <-> gr/lb (grains/lb)
  kgkgToGkg: (w: number) => w * 1000,
  gkgToKgkg: (g: number) => g / 1000,
  kgkgToGrainsLb: (w: number) => w * 7000,
  grainsLbToKgkg: (gr: number) => gr / 7000,

  // Enthalpy: kJ/kg <-> BTU/lb
  kJkgToBtuLb: (h: number) => h * 0.429923,
  btuLbToKJkg: (btu: number) => btu / 0.429923,

  // Specific Volume: m³/kg <-> ft³/lb
  m3kgToFt3lb: (v: number) => v * 16.0185,
  ft3lbToM3kg: (ft3: number) => ft3 / 16.0185,

  // Pressure: kPa <-> psi, inHg
  kPaToPsi: (kpa: number) => kpa * 0.145038,
  psiToKPa: (psi: number) => psi / 0.145038,
  kPaToInHg: (kpa: number) => kpa * 0.2953,
  inHgToKPa: (inhg: number) => inhg / 0.2953,

  // Flow: m³/h <-> CFM
  m3hToCfm: (m3h: number) => m3h * 0.588578,
  cfmToM3h: (cfm: number) => cfm / 0.588578,

  // Power / Capacity: kW <-> Ton of Refrigeration (TR), BTU/h
  kWToTR: (kw: number) => kw * 0.284345,
  trToKW: (tr: number) => tr / 0.284345,
  kWToBtuH: (kw: number) => kw * 3412.14,
  btuHToKW: (btu: number) => btu / 3412.14,
};

/**
 * Standard Comfort Zones (ASHRAE 55-2020)
 * Polygons defined in (Tdb, W in kg/kg) coordinates.
 */
export const ASHRAE55_SUMMER = [
  { tdb: 23.0, rh: 80 },
  { tdb: 26.0, rh: 65 },
  { tdb: 27.5, rh: 40 },
  { tdb: 25.5, rh: 20 },
  { tdb: 22.5, rh: 25 },
  { tdb: 21.8, rh: 60 },
];

export const ASHRAE55_WINTER = [
  { tdb: 20.0, rh: 80 },
  { tdb: 23.5, rh: 60 },
  { tdb: 24.5, rh: 35 },
  { tdb: 23.0, rh: 18 },
  { tdb: 19.5, rh: 25 },
  { tdb: 19.0, rh: 60 },
];

/**
 * Marco Conjunto Europeo: UNE-EN ISO 7730 & UNE-EN 16798-1
 * Establece categorías de calidad del ambiente térmico interior (IEQ):
 * - Cat. I: Alto nivel de confort (personas vulnerables, hospitales, guarderías; PPD < 6%, |PMV| < 0.2)
 * - Cat. II: Nivel normal de diseño (edificios nuevos y reformas, estándar RITE; PPD < 10%, |PMV| < 0.5)
 * - Cat. III: Nivel moderado aceptable (edificios existentes; PPD < 15%, |PMV| < 0.7)
 */
export const UNE_EN_16798_CAT1_SUMMER = [
  { tdb: 24.5, rh: 50 },
  { tdb: 26.0, rh: 45 },
  { tdb: 26.0, rh: 30 },
  { tdb: 24.5, rh: 30 },
];

export const UNE_EN_16798_CAT1_WINTER = [
  { tdb: 21.0, rh: 50 },
  { tdb: 23.0, rh: 45 },
  { tdb: 23.0, rh: 30 },
  { tdb: 21.0, rh: 30 },
];

export const UNE_EN_16798_CAT2_SUMMER = [
  { tdb: 23.5, rh: 60 },
  { tdb: 26.0, rh: 55 },
  { tdb: 26.0, rh: 25 },
  { tdb: 23.5, rh: 25 },
];

export const UNE_EN_16798_CAT2_WINTER = [
  { tdb: 20.0, rh: 60 },
  { tdb: 24.0, rh: 50 },
  { tdb: 24.0, rh: 25 },
  { tdb: 20.0, rh: 25 },
];

export const UNE_EN_16798_CAT3_SUMMER = [
  { tdb: 23.0, rh: 70 },
  { tdb: 27.0, rh: 60 },
  { tdb: 27.0, rh: 20 },
  { tdb: 23.0, rh: 20 },
];

export const UNE_EN_16798_CAT3_WINTER = [
  { tdb: 19.0, rh: 70 },
  { tdb: 25.0, rh: 55 },
  { tdb: 25.0, rh: 20 },
  { tdb: 19.0, rh: 20 },
];

/**
 * Analytical Fanger Model (ISO 7730) for PMV and PPD calculation
 * ta: Dry bulb temperature (°C)
 * rh: Relative humidity (%)
 * tr: Mean radiant temperature (°C, default = ta)
 * vel: Relative air velocity (m/s, default = 0.15 m/s)
 * met: Metabolic rate (met units, default = 1.2 met = 70 W/m² sedentary office)
 * clo: Clothing thermal insulation (clo units, default = 0.5 summer / 1.0 winter)
 */
export function calculateFangerPMV(
  ta: number,
  rh: number,
  tr: number = ta,
  vel: number = 0.15,
  met: number = 1.2,
  clo: number = 0.5
): { pmv: number; ppd: number; category: 'Cat I' | 'Cat II' | 'Cat III' | 'Fuera de norma' } {
  const pa = (rh / 100) * getSaturationVaporPressure(ta) * 10; // hPa to Pa/100 -> Pa conversion for Fanger eq
  const m = met * 58.15; // W/m²
  const w = 0; // External mechanical work (W/m²)
  const mw = m - w;
  const icl = 0.155 * clo; // m²·K/W

  const fcl = icl <= 0.078 ? 1.0 + 1.29 * icl : 1.05 + 0.645 * icl;
  const tra = tr + 273.15;
  const taa = ta + 273.15;

  let tcl = taa + (35.5 - ta) / (3.5 * (6.45 * icl + 0.1));
  let p1 = icl * fcl;
  let p2 = p1 * 3.96;
  let p3 = p1 * 100;
  let p4 = p1 * taa;
  let p5 = 308.7 - 0.028 * mw + p2 * Math.pow(tra / 100, 4);

  // Iterative calculation for clothing surface temperature (Tcl)
  let xn = tcl / 100;
  let xf = xn;
  for (let i = 0; i < 150; i++) {
    xf = (xf + xn) / 2;
    const hcf = 12.1 * Math.sqrt(vel);
    const hc = Math.max(2.38 * Math.pow(Math.abs(100 * xf - taa), 0.25), hcf);
    xn = (p5 + p4 * hc - p2 * Math.pow(xf, 4)) / (100 + p3 * hc);
    if (Math.abs(xn - xf) < 0.00015) break;
  }
  tcl = 100 * xn - 273.15;

  // Heat loss components
  const hl1 = 3.05 * 0.001 * (5733 - 6.99 * mw - pa * 100);
  const hl2 = mw > 58.15 ? 0.42 * (mw - 58.15) : 0;
  const hl3 = 1.7 * 0.00001 * m * (5867 - pa * 100);
  const hl4 = 0.0014 * m * (34 - ta);
  const hl5 = 3.96 * fcl * (Math.pow(xn, 4) - Math.pow(tra / 100, 4));
  const hcf = 12.1 * Math.sqrt(vel);
  const hc = Math.max(2.38 * Math.pow(Math.abs(tcl - ta), 0.25), hcf);
  const hl6 = fcl * hc * (tcl - ta);

  // Thermal sensation index (PMV)
  const ts = 0.303 * Math.exp(-0.036 * m) + 0.028;
  const pmv = ts * (mw - hl1 - hl2 - hl3 - hl4 - hl5 - hl6);

  // Predicted Percentage of Dissatisfied (PPD) according to ISO 7730
  const ppd = 100 - 95 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2));

  let category: 'Cat I' | 'Cat II' | 'Cat III' | 'Fuera de norma' = 'Fuera de norma';
  const absPmv = Math.abs(pmv);
  if (ppd < 6 && absPmv < 0.2) {
    category = 'Cat I';
  } else if (ppd < 10 && absPmv < 0.5) {
    category = 'Cat II';
  } else if (ppd < 15 && absPmv < 0.7) {
    category = 'Cat III';
  }

  return {
    pmv: Math.max(-3, Math.min(3, pmv)),
    ppd: Math.max(5, Math.min(100, ppd)),
    category,
  };
}
