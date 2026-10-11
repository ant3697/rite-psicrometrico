import {
  StatePoint,
  ProcessConnection,
  ProcessType,
  PresetCycle,
  OperatingCondition,
  CoilSimulationResult,
  AirMixingResult,
  ShrSizingResult,
  ElevationPreset,
} from '../types/psychrometrics';
import {
  C_PA,
  H_FG,
  P_ATM_STANDARD,
  solveStatePoint,
  getSaturationHumidityRatio,
  getSaturationVaporPressure,
  getHumidityRatioFromPv,
  getPvFromHumidityRatio,
  getDewPoint,
  getEnthalpy,
  getRelativeHumidity,
  getSpecificVolume,
  getWetBulb,
  getWFromTdbRh,
} from './psychrolib';
import { calculateADP } from './ashraeScales';

/**
 * Calculates thermodynamic transfer rates for a process between two points.
 * Features from OTS Psychrochart: direct airflow input, complete capacities,
 * sensible/latent split, ADP/BF modeling, and coil frost/freeze risk detection.
 */
export function calculateProcessMetrics(
  fromPoint: StatePoint,
  toPoint: StatePoint,
  massFlowKgS: number = 0.5,
  customVolumeFlowM3h?: number
): {
  qSensible: number;
  qLatent: number;
  qTotal: number;
  moistureExchange: number;
  shr: number;
  adp?: number;
  bypassFactor?: number;
  isFrostRisk?: boolean;
  frostRateKgH?: number;
  volumeFlow: number;
  massFlow: number;
} {
  // Determine specific volume of dry air
  const specVol = fromPoint.v && fromPoint.v > 0.1 ? fromPoint.v : 0.83;

  // Determine actual mass flow rate dry air (kg/s)
  let mDot = massFlowKgS > 0 ? massFlowKgS : fromPoint.massFlow || 0.5;
  let resolvedVolumeFlow = fromPoint.volumeFlow || 3000;

  if (customVolumeFlowM3h && customVolumeFlowM3h > 0) {
    resolvedVolumeFlow = customVolumeFlowM3h;
    mDot = resolvedVolumeFlow / (3600 * specVol);
  } else if (fromPoint.volumeFlow && fromPoint.volumeFlow > 0) {
    resolvedVolumeFlow = fromPoint.volumeFlow;
    mDot = resolvedVolumeFlow / (3600 * specVol);
  }

  // Sensible Heat (kW) = mDot * Cpa * (T2 - T1)
  const qSensible = mDot * C_PA * (toPoint.tdb - fromPoint.tdb);

  // Total Heat (kW) = mDot * (h2 - h1)
  const qTotal = mDot * (toPoint.h - fromPoint.h);

  // Latent Heat (kW) = Total - Sensible
  const qLatent = qTotal - qSensible;

  // Moisture rate (kg/h) = mDot * (W2 - W1) * 3600
  const moistureExchange = mDot * (toPoint.w - fromPoint.w) * 3600;

  // Sensible Heat Ratio SHR = |Qs| / (|Qs| + |Ql|) or Qs / Qt
  let shr = 1.0;
  if (Math.abs(qTotal) > 0.001) {
    shr = qSensible / qTotal;
  }

  // Calculate Apparatus Dew Point (ADP) and Bypass Factor (BF) if cooling & dehumidifying
  let adp: number | undefined;
  let bypassFactor: number | undefined;

  if (toPoint.tdb < fromPoint.tdb && toPoint.w < fromPoint.w) {
    // Slope of coil process line: S = (w2 - w1) / (t2 - t1)
    const slope = (toPoint.w - fromPoint.w) / (toPoint.tdb - fromPoint.tdb);
    
    // Find intersection with saturation curve: w_sat(T) = w1 + slope * (T - t1)
    let low = -15;
    let high = Math.min(toPoint.tdb, 30);
    for (let i = 0; i < 35; i++) {
      const mid = (low + high) / 2;
      const wCoilLine = fromPoint.w + slope * (mid - fromPoint.tdb);
      const wSat = getSaturationHumidityRatio(mid);
      if (wCoilLine > wSat) {
        low = mid;
      } else {
        high = mid;
      }
    }
    adp = (low + high) / 2;
    if (adp < fromPoint.tdb && adp > -25) {
      bypassFactor = (toPoint.tdb - adp) / (fromPoint.tdb - adp);
      bypassFactor = Math.max(0, Math.min(1, bypassFactor));
    }
  }

  // Frost / freeze risk detection (OTS Psychrochart feature):
  // Occurs on cooling/dehumidifying coils when surface or ADP operates below 0°C with moisture condensation
  const isFrostRisk = Boolean(
    (toPoint.tdb <= 0 && toPoint.rh >= 80 && moistureExchange < -0.02) ||
    (adp !== undefined && adp <= 0 && moistureExchange < -0.05) ||
    (toPoint.tdb < 1.0 && fromPoint.tdp > 0 && moistureExchange < -0.05)
  );

  const frostRateKgH = isFrostRisk && moistureExchange < 0 ? Math.abs(moistureExchange) : 0;

  return {
    qSensible,
    qLatent,
    qTotal,
    moistureExchange,
    shr: Math.max(-2, Math.min(2, shr)),
    adp,
    bypassFactor,
    isFrostRisk,
    frostRateKgH,
    volumeFlow: resolvedVolumeFlow,
    massFlow: mDot,
  };
}

/**
 * Solves adiabatic mixing of two air streams: Point 1 + Point 2 -> Mixed Point.
 * mixingRatio: fraction of stream 1 (e.g. 0.3 for 30% outdoor air, 70% return air).
 */
export function solveMixingPoint(
  point1: StatePoint,
  point2: StatePoint,
  ratio1: number = 0.3,
  pAtm: number = P_ATM_STANDARD
): StatePoint {
  const r1 = Math.max(0, Math.min(1, ratio1));
  const r2 = 1 - r1;

  const tdbMix = r1 * point1.tdb + r2 * point2.tdb;
  const wMix = r1 * point1.w + r2 * point2.w;

  const totalVolume = point1.volumeFlow + point2.volumeFlow;

  return solveStatePoint(
    { mode: 'tdb_w', tdb: tdbMix, w: wMix },
    pAtm,
    {
      id: `pt-mixed-${Date.now()}`,
      name: 'Aire Mezcla (MA)',
      color: '#F59E0B',
      volumeFlow: totalVolume,
    }
  );
}

/**
 * OTS Psychrochart Feature C:
 * Models a cooling coil by its surface temperature (ADP) and bypass factor (BF).
 * If coil surface >= inlet dew point, process is purely sensible cooling (horizontal w = const).
 * If coil surface < inlet dew point, moisture condenses down toward ADP on the saturation curve.
 * If ADP <= 0°C with condensation, alerts of frost/ice accumulation and calculates frost rate.
 */
export function calculateCoilSimulation(
  inletTdb: number,
  inletW: number,
  airflowM3h: number,
  coilSurfaceTemp: number, // °C (Tsurf = ADP)
  bypassFactor: number,    // 0.01 .. 0.80
  pressure: number = P_ATM_STANDARD
): CoilSimulationResult {
  const pvIn = getPvFromHumidityRatio(inletW, pressure);
  const inletTdp = getDewPoint(pvIn);
  const bf = Math.max(0.01, Math.min(0.8, bypassFactor));
  const cf = 1 - bf;

  const inletV = getSpecificVolume(inletTdb, inletW, pressure);
  const massFlowKgS = airflowM3h / (3600 * Math.max(0.1, inletV));
  const inletH = getEnthalpy(inletTdb, inletW);

  // Check if purely sensible cooling or dehumidifying
  const isSensibleOnly = coilSurfaceTemp >= inletTdp;

  let exitTdb: number;
  let exitW: number;
  let adpVal: number;
  let wAdpVal: number;
  let hAdpVal: number;

  if (isSensibleOnly) {
    // Purely sensible cooling: humidity ratio is constant
    exitW = inletW;
    exitTdb = coilSurfaceTemp + bf * (inletTdb - coilSurfaceTemp);
    adpVal = coilSurfaceTemp;
    wAdpVal = getSaturationHumidityRatio(coilSurfaceTemp, pressure);
    hAdpVal = getEnthalpy(coilSurfaceTemp, wAdpVal);
  } else {
    // Dehumidifying & cooling toward ADP on saturation curve
    adpVal = coilSurfaceTemp;
    wAdpVal = getSaturationHumidityRatio(adpVal, pressure);
    hAdpVal = getEnthalpy(adpVal, wAdpVal);
    exitTdb = adpVal + bf * (inletTdb - adpVal);
    exitW = wAdpVal + bf * (inletW - wAdpVal);
  }

  // Leaving air state properties
  const exitRh = getRelativeHumidity(exitTdb, exitW, pressure);
  const exitH = getEnthalpy(exitTdb, exitW);
  const exitPv = getPvFromHumidityRatio(exitW, pressure);
  const exitTdp = getDewPoint(exitPv);
  const exitTwb = getWetBulb(exitTdb, exitW, pressure);
  const exitSpecVol = getSpecificVolume(exitTdb, exitW, pressure);

  // Thermal capacities
  // Convention: positive capacity indicates cooling power removed from the air stream
  const qSensibleKw = massFlowKgS * C_PA * (inletTdb - exitTdb);
  const qTotalKw = massFlowKgS * (inletH - exitH);
  const qLatentKw = isSensibleOnly ? 0 : Math.max(0, qTotalKw - qSensibleKw);
  const shr = qTotalKw > 0.001 ? Math.min(1.0, Math.max(0, qSensibleKw / qTotalKw)) : 1.0;

  // Condensate liquid water rate (kg/h or L/h)
  const condensateRateKgH = isSensibleOnly
    ? 0
    : Math.max(0, massFlowKgS * (inletW - exitW) * 3600);

  // Frost / Freezing risk diagnostics (OTS feature)
  // Occurs if coil surface temperature (ADP) <= 0°C while moisture is condensed out
  const isFrostRisk = !isSensibleOnly && adpVal <= 0.0 && condensateRateKgH > 0.01;
  const frostRateKgH = isFrostRisk ? condensateRateKgH : 0;
  // Latent heat of fusion of water is ~333.5 kJ/kg
  const defrostHeatingLoadKw = isFrostRisk
    ? ((frostRateKgH * 333.5) / 3600) * 1.5 // 50% safety margin for metal structure warmup
    : 0;

  return {
    isSensibleOnly,
    adp: Number(adpVal.toFixed(2)),
    wAdp: Number(wAdpVal.toFixed(5)),
    hAdp: Number(hAdpVal.toFixed(2)),
    bypassFactor: Number(bf.toFixed(3)),
    contactFactor: Number(cf.toFixed(3)),
    exitTdb: Number(exitTdb.toFixed(2)),
    exitW: Number(exitW.toFixed(5)),
    exitRh: Number(Math.min(100, Math.max(1, exitRh)).toFixed(1)),
    exitTwb: Number(exitTwb.toFixed(2)),
    exitTdp: Number(exitTdp.toFixed(2)),
    exitEnthalpy: Number(exitH.toFixed(2)),
    exitSpecVol: Number(exitSpecVol.toFixed(3)),
    massFlowKgS: Number(massFlowKgS.toFixed(3)),
    qSensibleKw: Number(qSensibleKw.toFixed(2)),
    qLatentKw: Number(qLatentKw.toFixed(2)),
    qTotalKw: Number(qTotalKw.toFixed(2)),
    shr: Number(shr.toFixed(3)),
    condensateRateKgH: Number(condensateRateKgH.toFixed(2)),
    isFrostRisk,
    frostRateKgH: Number(frostRateKgH.toFixed(2)),
    defrostHeatingLoadKw: Number(defrostHeatingLoadKw.toFixed(2)),
  };
}

/**
 * OTS Psychrochart Feature D:
 * Solves psychrometric air mixing of two air streams based on volume flow or mass flow.
 * Positions the mixed state along the straight line between Stream 1 and Stream 2,
 * pulled proportionally toward the larger stream.
 * Detects fogging/supersaturation risk and calculates free-cooling potential.
 */
export function calculateAirMixingStream(
  tdb1: number,
  w1: number,
  volumeFlow1: number,
  tdb2: number,
  w2: number,
  volumeFlow2: number,
  pressure: number = P_ATM_STANDARD
): AirMixingResult {
  const v1 = getSpecificVolume(tdb1, w1, pressure);
  const v2 = getSpecificVolume(tdb2, w2, pressure);

  const mDot1 = volumeFlow1 / (3600 * Math.max(0.1, v1));
  const mDot2 = volumeFlow2 / (3600 * Math.max(0.1, v2));
  const totalMDot = Math.max(0.0001, mDot1 + mDot2);

  const massRatio1 = mDot1 / totalMDot;
  const massRatio2 = mDot2 / totalMDot;
  const totalVolume = volumeFlow1 + volumeFlow2;
  const volumeRatio2Percent = totalVolume > 0 ? (volumeFlow2 / totalVolume) * 100 : 0;

  const h1 = getEnthalpy(tdb1, w1);
  const h2 = getEnthalpy(tdb2, w2);

  const mixedW = massRatio1 * w1 + massRatio2 * w2;
  const mixedH = massRatio1 * h1 + massRatio2 * h2;

  // Temperature from enthalpy and humidity ratio
  const mixedTdb = (mixedH - 2501 * mixedW) / (1.006 + 1.86 * mixedW);
  const mixedRh = getRelativeHumidity(mixedTdb, mixedW, pressure);
  const mixedPv = getPvFromHumidityRatio(mixedW, pressure);
  const mixedTdp = getDewPoint(mixedPv);
  const mixedTwb = getWetBulb(mixedTdb, mixedW, pressure);
  const mixedSpecVol = getSpecificVolume(mixedTdb, mixedW, pressure);

  // Check supersaturation / fog formation in mixing chamber
  const wSatMix = getSaturationHumidityRatio(mixedTdb, pressure);
  const isFogRisk = mixedW > wSatMix || mixedRh > 100;
  const fogMoistureRateKgH = isFogRisk
    ? Math.max(0, totalMDot * (mixedW - wSatMix) * 3600)
    : 0;

  // Free cooling / economizer diagnostic (assuming stream 2 is outdoor air, stream 1 is return air)
  const isFreeCoolingViable = h2 < h1 && tdb2 < tdb1;
  const freeCoolingPotentialKw = isFreeCoolingViable
    ? Math.max(0, mDot2 * (h1 - h2))
    : 0;

  return {
    massFlow1: Number(mDot1.toFixed(3)),
    massFlow2: Number(mDot2.toFixed(3)),
    totalMassFlow: Number(totalMDot.toFixed(3)),
    totalVolumeFlow: Number(totalVolume.toFixed(0)),
    volumeRatio2Percent: Number(volumeRatio2Percent.toFixed(1)),
    massRatio1: Number(massRatio1.toFixed(3)),
    massRatio2: Number(massRatio2.toFixed(3)),
    mixedTdb: Number(mixedTdb.toFixed(2)),
    mixedW: Number(mixedW.toFixed(5)),
    mixedRh: Number(Math.min(100, Math.max(1, mixedRh)).toFixed(1)),
    mixedH: Number(mixedH.toFixed(2)),
    mixedTwb: Number(mixedTwb.toFixed(2)),
    mixedTdp: Number(mixedTdp.toFixed(2)),
    mixedSpecVol: Number(mixedSpecVol.toFixed(3)),
    isFogRisk,
    fogMoistureRateKgH: Number(fogMoistureRateKgH.toFixed(2)),
    isFreeCoolingViable,
    freeCoolingPotentialKw: Number(freeCoolingPotentialKw.toFixed(2)),
  };
}

/**
 * OTS Psychrochart Feature E (Elevation Presets):
 * Standard high-elevation psychrometric barometric pressures with derating characteristics.
 */
export const OTS_ELEVATION_PRESETS: ElevationPreset[] = [
  {
    name: 'Nivel del Mar (Sea Level 0 ft)',
    altitudeM: 0,
    altitudeFt: 0,
    pressureKPa: 101.325,
    pressurePsia: 14.696,
    deratingPercent: 0.0,
    description: 'Estándar barométrico ASHRAE a nivel del mar (101.325 kPa / 1 atm). Densidad estándar 1.204 kg/m³.',
  },
  {
    name: '2,000 ft (610 m)',
    altitudeM: 610,
    altitudeFt: 2000,
    pressureKPa: 94.2,
    pressurePsia: 13.66,
    deratingPercent: -7.0,
    description: '7% menor presión que el nivel del mar. La curva de saturación se desplaza hacia arriba; el aire retiene más humedad.',
  },
  {
    name: '4,000 ft (1,219 m)',
    altitudeM: 1219,
    altitudeFt: 4000,
    pressureKPa: 87.5,
    pressurePsia: 12.69,
    deratingPercent: -13.6,
    description: '13.6% menor presión barométrica. Requiere ~15% más de caudal volumétrico para la misma potencia sensible.',
  },
  {
    name: '6,000 ft (1,829 m)',
    altitudeM: 1829,
    altitudeFt: 6000,
    pressureKPa: 81.2,
    pressurePsia: 11.78,
    deratingPercent: -19.9,
    description: '19.9% menor presión. Densidad aproximada ~0.97 kg/m³. Desplazamiento visible de líneas de entalpía.',
  },
  {
    name: '8,000 ft (2,438 m)',
    altitudeM: 2438,
    altitudeFt: 8000,
    pressureKPa: 75.3,
    pressurePsia: 10.92,
    deratingPercent: -25.7,
    description: '25.7% por debajo del nivel del mar. Típico de altiplanos y ciudades de gran altitud.',
  },
  {
    name: '10,000 ft (3,048 m)',
    altitudeM: 3048,
    altitudeFt: 10000,
    pressureKPa: 69.7,
    pressurePsia: 10.11,
    deratingPercent: -31.2,
    description: '31.2% menor presión. El aire enrarecido requiere ventiladores dimensionados con mayor caudal para igual masa seca.',
  },
];

/**
 * OTS Psychrochart Feature E:
 * Sensible Heat Ratio (SHR) lines for coil sizing.
 * Computes Room Sensible Heat Ratio (RSHR), Grand Sensible Heat Ratio (GSHR),
 * required Apparatus Dew Point (ADP) on the saturation curve,
 * required supply air state, required airflow rate (m³/h & CFM),
 * and required cooling coil total, sensible, and latent capacities.
 */
export function calculateShrCoilSizing(
  roomTdb: number,
  roomRh: number,
  roomSensibleKw: number,
  roomLatentKw: number,
  outdoorTdb: number = 34.0,
  outdoorRh: number = 45.0,
  outdoorAirRatio: number = 0.25, // 25% outdoor air ventilation
  bypassFactor: number = 0.10,    // 0.10 for typical cooling coil
  pressure: number = P_ATM_STANDARD
): ShrSizingResult {
  const roomTotalKw = Math.max(0.001, roomSensibleKw + roomLatentKw);
  const rshr = Math.max(0.05, Math.min(1.0, roomSensibleKw / roomTotalKw));

  // Room psychrometric state
  const roomW = getWFromTdbRh(roomTdb, roomRh, pressure);
  const roomH = getEnthalpy(roomTdb, roomW);

  // Outdoor state
  const outdoorW = getWFromTdbRh(outdoorTdb, outdoorRh, pressure);
  const outdoorH = getEnthalpy(outdoorTdb, outdoorW);

  // Calculate ADP from RSHR line through Room point
  const adpResult = calculateADP(roomTdb, roomW, rshr, pressure);
  const adp = adpResult ? adpResult.tdbAdp : 10.0;
  const wAdp = adpResult ? adpResult.wAdp : getSaturationHumidityRatio(adp, pressure);
  const hAdp = adpResult ? adpResult.hAdp : getEnthalpy(adp, wAdp);

  // BF and supply air state on the Room Condition Line
  const bf = Math.max(0.02, Math.min(0.40, bypassFactor));
  const cf = 1 - bf;

  // Tsupply = ADP + BF * (Troom - ADP)
  const supplyTdb = adp + bf * (roomTdb - adp);
  const supplyW = wAdp + bf * (roomW - wAdp);
  const supplyH = getEnthalpy(supplyTdb, supplyW);
  const supplyRh = getRelativeHumidity(supplyTdb, supplyW, pressure);
  const supplyTwb = getWetBulb(supplyTdb, supplyW, pressure);
  const deltaTSupply = Math.max(0.1, roomTdb - supplyTdb);

  // Required airflow: Qs_room = mDot * Cpa * (Troom - Tsupply)
  const requiredMassFlowKgS = roomSensibleKw / (C_PA * deltaTSupply);
  const supplySpecVol = getSpecificVolume(supplyTdb, supplyW, pressure);
  const requiredAirflowM3h = requiredMassFlowKgS * supplySpecVol * 3600;
  const requiredAirflowCfm = requiredAirflowM3h * 0.588578; // m³/h to CFM

  // Mixed air state entering coil (Return + Outdoor Air)
  const fOa = Math.max(0, Math.min(1, outdoorAirRatio));
  const fRa = 1 - fOa;
  const mixedTdb = fRa * roomTdb + fOa * outdoorTdb;
  const mixedW = fRa * roomW + fOa * outdoorW;
  const mixedH = fRa * roomH + fOa * outdoorH;
  const mixedRh = getRelativeHumidity(mixedTdb, mixedW, pressure);

  // Coil capacities
  // Q_coil_total = mDot * (hmix - hsupply)
  const coilCoolingTotalKw = Math.max(0, requiredMassFlowKgS * (mixedH - supplyH));
  const coilCoolingSensibleKw = Math.max(0, requiredMassFlowKgS * C_PA * (mixedTdb - supplyTdb));
  const coilCoolingLatentKw = Math.max(0, coilCoolingTotalKw - coilCoolingSensibleKw);
  const gshr = coilCoolingTotalKw > 0.001 ? coilCoolingSensibleKw / coilCoolingTotalKw : 1.0;

  // Ventilation loads
  const ventSensibleKw = requiredMassFlowKgS * C_PA * fOa * (outdoorTdb - roomTdb);
  const ventLatentKw = requiredMassFlowKgS * H_FG * fOa * (outdoorW - roomW);
  const grandSensibleKw = roomSensibleKw + Math.max(0, ventSensibleKw);
  const grandLatentKw = roomLatentKw + Math.max(0, ventLatentKw);
  const grandTotalKw = grandSensibleKw + grandLatentKw;

  // Condensate rate
  const coilCondensateRateKgH = Math.max(0, requiredMassFlowKgS * (mixedW - supplyW) * 3600);
  const coilTonsRefrigeration = coilCoolingTotalKw / 3.51685;

  // Density & altitude derating
  const mixedSpecVol = getSpecificVolume(mixedTdb, mixedW, pressure);
  const airDensity = 1 / mixedSpecVol;
  const densityDeratingFactor = airDensity / 1.204;

  return {
    rshr: Number(rshr.toFixed(3)),
    roomSensibleKw: Number(roomSensibleKw.toFixed(2)),
    roomLatentKw: Number(roomLatentKw.toFixed(2)),
    roomTotalKw: Number(roomTotalKw.toFixed(2)),
    gshr: Number(gshr.toFixed(3)),
    grandSensibleKw: Number(grandSensibleKw.toFixed(2)),
    grandLatentKw: Number(grandLatentKw.toFixed(2)),
    grandTotalKw: Number(grandTotalKw.toFixed(2)),
    adp: Number(adp.toFixed(2)),
    wAdp: Number(wAdp.toFixed(5)),
    hAdp: Number(hAdp.toFixed(2)),
    bypassFactor: Number(bf.toFixed(3)),
    contactFactor: Number(cf.toFixed(3)),
    roomTdb: Number(roomTdb.toFixed(1)),
    roomW: Number(roomW.toFixed(5)),
    roomRh: Number(roomRh.toFixed(1)),
    roomH: Number(roomH.toFixed(2)),
    supplyTdb: Number(supplyTdb.toFixed(2)),
    supplyW: Number(supplyW.toFixed(5)),
    supplyRh: Number(Math.min(100, supplyRh).toFixed(1)),
    supplyTwb: Number(supplyTwb.toFixed(2)),
    supplyH: Number(supplyH.toFixed(2)),
    deltaTSupply: Number(deltaTSupply.toFixed(2)),
    outdoorTdb: Number(outdoorTdb.toFixed(1)),
    outdoorW: Number(outdoorW.toFixed(5)),
    outdoorRh: Number(outdoorRh.toFixed(1)),
    outdoorAirRatio: Number(fOa.toFixed(2)),
    mixedTdb: Number(mixedTdb.toFixed(2)),
    mixedW: Number(mixedW.toFixed(5)),
    mixedRh: Number(Math.min(100, mixedRh).toFixed(1)),
    mixedH: Number(mixedH.toFixed(2)),
    requiredMassFlowKgS: Number(requiredMassFlowKgS.toFixed(3)),
    requiredAirflowM3h: Number(requiredAirflowM3h.toFixed(0)),
    requiredAirflowCfm: Number(requiredAirflowCfm.toFixed(0)),
    coilCoolingTotalKw: Number(coilCoolingTotalKw.toFixed(2)),
    coilCoolingSensibleKw: Number(coilCoolingSensibleKw.toFixed(2)),
    coilCoolingLatentKw: Number(coilCoolingLatentKw.toFixed(2)),
    coilCondensateRateKgH: Number(coilCondensateRateKgH.toFixed(2)),
    coilTonsRefrigeration: Number(coilTonsRefrigeration.toFixed(2)),
    airDensity: Number(airDensity.toFixed(3)),
    densityDeratingFactor: Number(densityDeratingFactor.toFixed(3)),
  };
}

/**
 * Standard HVAC Presets Library
 */
export const PRESET_CYCLES: PresetCycle[] = [
  {
    id: 'idae-rooftop-commercial',
    name: 'Guía IDAE: Rooftop Comercial con Free-Cooling & Recuperador',
    description: 'Ejemplo 1 Guía IDAE: Local comercial con equipo autónomo de cubierta (Rooftop), economizador de mezcla con free-cooling (IT 1.2.4.5.1), batería de expansión directa DX y recuperador de calor de placas (IT 1.2.4.5.2).',
    category: 'IDAE_RITE',
    points: [
      {
        name: '1. Exterior ODA (Verano RITE)',
        color: '#EF4444',
        inputs: { mode: 'tdb_rh', tdb: 34.0, rh: 45 },
        volumeFlow: 1500,
      },
      {
        name: '2. Retorno IDA 3 (Local)',
        color: '#10B981',
        inputs: { mode: 'tdb_rh', tdb: 24.5, rh: 50 },
        volumeFlow: 3500,
      },
      {
        name: '3. Pre-enfriado Recuperador η=72%',
        color: '#0EA5E9',
        inputs: { mode: 'tdb_rh', tdb: 27.2, rh: 66 },
        volumeFlow: 1500,
      },
      {
        name: '4. Mezcla Economizador (Free-Cooling)',
        color: '#F59E0B',
        inputs: { mode: 'tdb_rh', tdb: 25.3, rh: 55 },
        volumeFlow: 5000,
      },
      {
        name: '5. Batería Expansión Directa DX (CC)',
        color: '#06B6D4',
        inputs: { mode: 'tdb_rh', tdb: 12.8, rh: 95 },
        volumeFlow: 5000,
      },
      {
        name: '6. Impulsión tras Ventilador EC (SUP)',
        color: '#3B82F6',
        inputs: { mode: 'tdb_rh', tdb: 13.8, rh: 89 },
        volumeFlow: 5000,
      },
      {
        name: '7. Zona Comercial (IDA 3 RITE)',
        color: '#8B5CF6',
        inputs: { mode: 'tdb_rh', tdb: 24.0, rh: 50 },
        volumeFlow: 5000,
      },
    ],
    processes: [
      { name: 'Recuperación de Calor del Aire Expulsado', type: 'sensible_cooling', fromIndex: 0, toIndex: 2 },
      { name: 'Mezcla Modulada ODA + RA (Free-Cooling)', type: 'mixing', fromIndex: 2, toIndex: 3, secondaryFromIndex: 1, mixingRatio: 0.3 },
      { name: 'Enfriamiento y Deshumectación en Batería DX', type: 'cooling_dehumid', fromIndex: 3, toIndex: 4, bypassFactor: 0.1 },
      { name: 'Calentamiento Rodete Ventilador EC (+1°C)', type: 'sensible_heating', fromIndex: 4, toIndex: 5 },
      { name: 'Evolución en Sala Comercial (Recta RSHR)', type: 'zone_load', fromIndex: 5, toIndex: 6 },
    ],
  },
  {
    id: 'idae-vrf-primary-air',
    name: 'Guía IDAE: Sistema VRF + UTA Aire Primario (Oficinas)',
    description: 'Ejemplo 2 Guía IDAE: Oficinas con climatización zonal por caudal de refrigerante variable (VRF) y ventilación centralizada mediante UTA de aire primario (100% ODA) con recuperador entálpico de placas (IDA 2 / IT 1.1.4.2).',
    category: 'IDAE_RITE',
    points: [
      {
        name: '1. Aire Exterior ODA (Verano)',
        color: '#EF4444',
        inputs: { mode: 'tdb_rh', tdb: 33.0, rh: 48 },
        volumeFlow: 2500,
      },
      {
        name: '2. Aire Expulsión / Retorno (IDA 2)',
        color: '#10B981',
        inputs: { mode: 'tdb_rh', tdb: 24.0, rh: 50 },
        volumeFlow: 2500,
      },
      {
        name: '3. Post-Recuperador Entálpico',
        color: '#0EA5E9',
        inputs: { mode: 'tdb_rh', tdb: 26.5, rh: 59 },
        volumeFlow: 2500,
      },
      {
        name: '4. Batería Fría UTA Primaria',
        color: '#06B6D4',
        inputs: { mode: 'tdb_rh', tdb: 15.0, rh: 92 },
        volumeFlow: 2500,
      },
      {
        name: '5. Impulsión Aire Primario Neutro',
        color: '#3B82F6',
        inputs: { mode: 'tdb_rh', tdb: 18.0, rh: 76 },
        volumeFlow: 2500,
      },
      {
        name: '6. Unidad Interior VRF (Tratamiento Zonal)',
        color: '#F97316',
        inputs: { mode: 'tdb_rh', tdb: 14.0, rh: 85 },
        volumeFlow: 3500,
      },
      {
        name: '7. Ambiente Oficinas (IDA 2 RITE)',
        color: '#8B5CF6',
        inputs: { mode: 'tdb_rh', tdb: 23.5, rh: 50 },
        volumeFlow: 3500,
      },
    ],
    processes: [
      { name: 'Recuperación de Energía (IT 1.2.4.5.2)', type: 'sensible_cooling', fromIndex: 0, toIndex: 2 },
      { name: 'Tratamiento Deshumectador UTA Primaria', type: 'cooling_dehumid', fromIndex: 2, toIndex: 3, bypassFactor: 0.1 },
      { name: 'Atemperamiento Aire Primario (Neutro)', type: 'sensible_heating', fromIndex: 3, toIndex: 4 },
      { name: 'Acondicionamiento Zonal VRF Expansión Directa', type: 'cooling_dehumid', fromIndex: 4, toIndex: 5 },
      { name: 'Carga Térmica Oficinas (PPD < 10%)', type: 'zone_load', fromIndex: 5, toIndex: 6 },
    ],
  },
  {
    id: 'idae-heatpump-winter',
    name: 'Guía IDAE: Bomba de Calor Autónoma Aire-Aire (Invierno)',
    description: 'Ejemplo 3 Guía IDAE: Modo calefacción con bomba de calor aire-aire autónoma, aporte de aire exterior para calidad IDA, ventilador EC y precalentamiento a confort RITE (21-23 °C).',
    category: 'IDAE_RITE',
    points: [
      {
        name: '1. Exterior Frío (Invierno RITE)',
        color: '#3B82F6',
        inputs: { mode: 'tdb_rh', tdb: 3.0, rh: 80 },
        volumeFlow: 1200,
      },
      {
        name: '2. Retorno Local Confort',
        color: '#10B981',
        inputs: { mode: 'tdb_rh', tdb: 21.5, rh: 45 },
        volumeFlow: 2800,
      },
      {
        name: '3. Mezcla ODA + RA',
        color: '#F59E0B',
        inputs: { mode: 'tdb_rh', tdb: 16.0, rh: 55 },
        volumeFlow: 4000,
      },
      {
        name: '4. Condensador Bomba de Calor (+)',
        color: '#EF4444',
        inputs: { mode: 'tdb_rh', tdb: 28.5, rh: 26 },
        volumeFlow: 4000,
      },
      {
        name: '5. Impulsión Aire Caliente (SUP)',
        color: '#F97316',
        inputs: { mode: 'tdb_rh', tdb: 29.5, rh: 25 },
        volumeFlow: 4000,
      },
      {
        name: '6. Local Habitado RITE (22°C)',
        color: '#8B5CF6',
        inputs: { mode: 'tdb_rh', tdb: 22.0, rh: 45 },
        volumeFlow: 4000,
      },
    ],
    processes: [
      { name: 'Mezcla Aire Fresco + Retorno', type: 'mixing', fromIndex: 0, toIndex: 2, secondaryFromIndex: 1, mixingRatio: 0.3 },
      { name: 'Calentamiento en Bomba de Calor Reversible', type: 'sensible_heating', fromIndex: 2, toIndex: 3 },
      { name: 'Salto Térmico del Rodete EC (+1°C)', type: 'sensible_heating', fromIndex: 3, toIndex: 4 },
      { name: 'Difusión y Pérdidas del Local', type: 'zone_load', fromIndex: 4, toIndex: 5 },
    ],
  },
  {
    id: 'summer-ac',
    name: 'Climatización de Verano Completa',
    description: 'Mezcla aire exterior + retorno, enfriamiento y deshumectación en batería fría, ventilador y carga del local.',
    category: 'Commercial',
    points: [
      {
        name: '1. Exterior (OA)',
        color: '#EF4444',
        inputs: { mode: 'tdb_rh', tdb: 35.0, rh: 45 },
        volumeFlow: 1200,
      },
      {
        name: '2. Retorno (RA)',
        color: '#10B981',
        inputs: { mode: 'tdb_rh', tdb: 25.0, rh: 50 },
        volumeFlow: 2800,
      },
      {
        name: '3. Mezcla (MA)',
        color: '#F59E0B',
        inputs: { mode: 'tdb_rh', tdb: 28.0, rh: 50.5 },
        volumeFlow: 4000,
      },
      {
        name: '4. Batería Fría (CC)',
        color: '#3B82F6',
        inputs: { mode: 'tdb_rh', tdb: 12.8, rh: 95 },
        volumeFlow: 4000,
      },
      {
        name: '5. Impulsión (SA)',
        color: '#06B6D4',
        inputs: { mode: 'tdb_rh', tdb: 14.5, rh: 85 },
        volumeFlow: 4000,
      },
      {
        name: '6. Local/Zona (Room)',
        color: '#8B5CF6',
        inputs: { mode: 'tdb_rh', tdb: 24.5, rh: 50 },
        volumeFlow: 4000,
      },
    ],
    processes: [
      { name: 'Mezcla Aire Ext. + Retorno', type: 'mixing', fromIndex: 0, toIndex: 2, secondaryFromIndex: 1, mixingRatio: 0.3 },
      { name: 'Enfriamiento y Deshumectación', type: 'cooling_dehumid', fromIndex: 2, toIndex: 3, bypassFactor: 0.1 },
      { name: 'Ganancia Ventilador / Recalentamiento', type: 'sensible_heating', fromIndex: 3, toIndex: 4 },
      { name: 'Carga Térmica del Local (SHR)', type: 'zone_load', fromIndex: 4, toIndex: 5 },
    ],
  },
  {
    id: 'winter-heating',
    name: 'Calefacción de Invierno con Humidificación',
    description: 'Precalentamiento de mezcla fría, humidificación con lanza de vapor y postcalentamiento a confort.',
    category: 'Commercial',
    points: [
      {
        name: '1. Exterior Frío (OA)',
        color: '#0284C7',
        inputs: { mode: 'tdb_rh', tdb: 2.0, rh: 80 },
        volumeFlow: 1000,
      },
      {
        name: '2. Retorno Confort (RA)',
        color: '#10B981',
        inputs: { mode: 'tdb_rh', tdb: 21.0, rh: 40 },
        volumeFlow: 3000,
      },
      {
        name: '3. Aire Mezcla (MA)',
        color: '#F59E0B',
        inputs: { mode: 'tdb_rh', tdb: 16.2, rh: 49 },
        volumeFlow: 4000,
      },
      {
        name: '4. Batería Calor (HC)',
        color: '#EA580C',
        inputs: { mode: 'tdb_rh', tdb: 24.0, rh: 30 },
        volumeFlow: 4000,
      },
      {
        name: '5. Humidificador Vapor',
        color: '#8B5CF6',
        inputs: { mode: 'tdb_rh', tdb: 24.5, rh: 48 },
        volumeFlow: 4000,
      },
      {
        name: '6. Impulsión Zona (SA)',
        color: '#EC4899',
        inputs: { mode: 'tdb_rh', tdb: 28.0, rh: 39 },
        volumeFlow: 4000,
      },
    ],
    processes: [
      { name: 'Mezcla Aire Fresco + Retorno', type: 'mixing', fromIndex: 0, toIndex: 2, secondaryFromIndex: 1, mixingRatio: 0.25 },
      { name: 'Calentamiento Sensible 1', type: 'sensible_heating', fromIndex: 2, toIndex: 3 },
      { name: 'Inyección de Vapor Isotérmico', type: 'steam_humid', fromIndex: 3, toIndex: 4 },
      { name: 'Postcalentamiento a Impulsión', type: 'sensible_heating', fromIndex: 4, toIndex: 5 },
    ],
  },
  {
    id: 'evaporative-cooling',
    name: 'Enfriamiento Evaporativo Adiabático',
    description: 'Transformación a entalpía constante para climas secos y calurosos (bioclimática y ahorro energético).',
    category: 'Bioclimatic',
    points: [
      {
        name: '1. Exterior Cálido y Seco',
        color: '#EF4444',
        inputs: { mode: 'tdb_rh', tdb: 38.0, rh: 18 },
        volumeFlow: 5000,
      },
      {
        name: '2. Salida Enfriador Evaporativo',
        color: '#06B6D4',
        inputs: { mode: 'tdb_rh', tdb: 22.0, rh: 82 },
        volumeFlow: 5000,
      },
      {
        name: '3. Extracción Sala Bioclimática',
        color: '#10B981',
        inputs: { mode: 'tdb_rh', tdb: 26.5, rh: 64 },
        volumeFlow: 5000,
      },
    ],
    processes: [
      { name: 'Evaporación Adiabática (h = cte)', type: 'adiabatic_humid', fromIndex: 0, toIndex: 1 },
      { name: 'Absorción de Calor Sensible en Sala', type: 'sensible_heating', fromIndex: 1, toIndex: 2 },
    ],
  },
  {
    id: 'heat-recovery-datacenter',
    name: 'Free-Cooling & Recuperación de Calor',
    description: 'Ventilación de CPD / Data Center con recuperador de calor sensible de alta eficiencia (75%).',
    category: 'Industrial',
    points: [
      {
        name: '1. Aire Exterior (OA)',
        color: '#3B82F6',
        inputs: { mode: 'tdb_rh', tdb: 12.0, rh: 70 },
        volumeFlow: 6000,
      },
      {
        name: '2. Aire Salida Servidores (CPD)',
        color: '#EF4444',
        inputs: { mode: 'tdb_rh', tdb: 34.0, rh: 22 },
        volumeFlow: 6000,
      },
      {
        name: '3. Entrada Enfriada al CPD',
        color: '#10B981',
        inputs: { mode: 'tdb_rh', tdb: 20.0, rh: 44 },
        volumeFlow: 6000,
      },
    ],
    processes: [
      { name: 'Enfriamiento de Racks IT', type: 'sensible_heating', fromIndex: 2, toIndex: 1 },
      { name: 'Economizador Directo', type: 'sensible_cooling', fromIndex: 1, toIndex: 2 },
    ],
  },
];

/**
 * Creates the initial set of Operating Conditions / Scenarios (OTS Psychrochart feature)
 * allows side-by-side comparison of full operational cycles on the chart.
 */
export function createDefaultOperatingConditions(pressure: number = P_ATM_STANDARD): OperatingCondition[] {
  // Scenario 1: Summer Design (100% Peak Load)
  const summerPts = [
    solveStatePoint({ mode: 'tdb_rh', tdb: 34.0, rh: 45 }, pressure, {
      id: 'sc1-pt-1',
      name: '1. ODA Exterior (Verano 34°C)',
      color: '#EF4444',
      volumeFlow: 1500,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 24.5, rh: 50 }, pressure, {
      id: 'sc1-pt-2',
      name: '2. RA Retorno (24.5°C)',
      color: '#10B981',
      volumeFlow: 3000,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 27.7, rh: 52 }, pressure, {
      id: 'sc1-pt-3',
      name: '3. MA Mezcla ODA+RA',
      color: '#F59E0B',
      volumeFlow: 4500,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 12.8, rh: 95 }, pressure, {
      id: 'sc1-pt-4',
      name: '4. CC Batería Fría DX',
      color: '#06B6D4',
      volumeFlow: 4500,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 14.0, rh: 88 }, pressure, {
      id: 'sc1-pt-5',
      name: '5. SA Impulsión Rodete',
      color: '#3B82F6',
      volumeFlow: 4500,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 24.0, rh: 50 }, pressure, {
      id: 'sc1-pt-6',
      name: '6. Confort Zona Local',
      color: '#8B5CF6',
      volumeFlow: 4500,
    }),
  ];

  const summerProcs: ProcessConnection[] = [
    {
      id: 'sc1-pr-1',
      name: 'Mezcla ODA 33% + RA 67%',
      type: 'mixing',
      fromPointId: 'sc1-pt-1',
      toPointId: 'sc1-pt-3',
      secondaryFromPointId: 'sc1-pt-2',
      mixingRatio: 0.33,
      conditionId: 'sc-summer-design',
      color: '#F59E0B',
      ...calculateProcessMetrics(summerPts[0], summerPts[2], undefined, 4500),
    },
    {
      id: 'sc1-pr-2',
      name: 'Enfriamiento y Deshumectación (CC)',
      type: 'cooling_dehumid',
      fromPointId: 'sc1-pt-3',
      toPointId: 'sc1-pt-4',
      bypassFactor: 0.1,
      conditionId: 'sc-summer-design',
      color: '#06B6D4',
      ...calculateProcessMetrics(summerPts[2], summerPts[3], undefined, 4500),
    },
    {
      id: 'sc1-pr-3',
      name: 'Recalentamiento Ventilador (+1.2°C)',
      type: 'sensible_heating',
      fromPointId: 'sc1-pt-4',
      toPointId: 'sc1-pt-5',
      conditionId: 'sc-summer-design',
      color: '#3B82F6',
      ...calculateProcessMetrics(summerPts[3], summerPts[4], undefined, 4500),
    },
    {
      id: 'sc1-pr-4',
      name: 'Evolución en Zona (Carga Térmica Local)',
      type: 'zone_load',
      fromPointId: 'sc1-pt-5',
      toPointId: 'sc1-pt-6',
      conditionId: 'sc-summer-design',
      color: '#8B5CF6',
      ...calculateProcessMetrics(summerPts[4], summerPts[5], undefined, 4500),
    },
  ];

  // Scenario 2: Part Load (Modulation 60%)
  const partLoadPts = [
    solveStatePoint({ mode: 'tdb_rh', tdb: 26.0, rh: 52 }, pressure, {
      id: 'sc2-pt-1',
      name: '1. ODA Exterior (26°C Carga Parcial)',
      color: '#0284C7',
      volumeFlow: 900,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 23.5, rh: 48 }, pressure, {
      id: 'sc2-pt-2',
      name: '2. RA Retorno (23.5°C)',
      color: '#10B981',
      volumeFlow: 1800,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 24.3, rh: 49 }, pressure, {
      id: 'sc2-pt-3',
      name: '3. MA Mezcla 60% Caudal',
      color: '#F59E0B',
      volumeFlow: 2700,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 16.5, rh: 85 }, pressure, {
      id: 'sc2-pt-4',
      name: '4. CC Batería Modulada (60%)',
      color: '#0EA5E9',
      volumeFlow: 2700,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 17.5, rh: 80 }, pressure, {
      id: 'sc2-pt-5',
      name: '5. SA Impulsión Regulada',
      color: '#38BDF8',
      volumeFlow: 2700,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 23.5, rh: 48 }, pressure, {
      id: 'sc2-pt-6',
      name: '6. Zona Local Confort',
      color: '#8B5CF6',
      volumeFlow: 2700,
    }),
  ];

  const partLoadProcs: ProcessConnection[] = [
    {
      id: 'sc2-pr-1',
      name: 'Mezcla ODA 33% + RA 67% (Carga Parcial)',
      type: 'mixing',
      fromPointId: 'sc2-pt-1',
      toPointId: 'sc2-pt-3',
      secondaryFromPointId: 'sc2-pt-2',
      mixingRatio: 0.33,
      conditionId: 'sc-part-load',
      color: '#F59E0B',
      ...calculateProcessMetrics(partLoadPts[0], partLoadPts[2], undefined, 2700),
    },
    {
      id: 'sc2-pr-2',
      name: 'Enfriamiento Modulado Batería Parcial',
      type: 'cooling_dehumid',
      fromPointId: 'sc2-pt-3',
      toPointId: 'sc2-pt-4',
      bypassFactor: 0.15,
      conditionId: 'sc-part-load',
      color: '#0EA5E9',
      ...calculateProcessMetrics(partLoadPts[2], partLoadPts[3], undefined, 2700),
    },
    {
      id: 'sc2-pr-3',
      name: 'Ganancia Ventilador EC (+1°C)',
      type: 'sensible_heating',
      fromPointId: 'sc2-pt-4',
      toPointId: 'sc2-pt-5',
      conditionId: 'sc-part-load',
      color: '#38BDF8',
      ...calculateProcessMetrics(partLoadPts[3], partLoadPts[4], undefined, 2700),
    },
    {
      id: 'sc2-pr-4',
      name: 'Disipación Carga Parcial Sala',
      type: 'zone_load',
      fromPointId: 'sc2-pt-5',
      toPointId: 'sc2-pt-6',
      conditionId: 'sc-part-load',
      color: '#8B5CF6',
      ...calculateProcessMetrics(partLoadPts[4], partLoadPts[5], undefined, 2700),
    },
  ];

  // Scenario 3: Winter Design (Calefacción & Humectación)
  const winterPts = [
    solveStatePoint({ mode: 'tdb_rh', tdb: 2.0, rh: 82 }, pressure, {
      id: 'sc3-pt-1',
      name: '1. ODA Exterior Invierno (2°C)',
      color: '#3B82F6',
      volumeFlow: 1200,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 21.5, rh: 45 }, pressure, {
      id: 'sc3-pt-2',
      name: '2. RA Retorno Sala (21.5°C)',
      color: '#10B981',
      volumeFlow: 2800,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 15.6, rh: 56 }, pressure, {
      id: 'sc3-pt-3',
      name: '3. MA Mezcla ODA+RA',
      color: '#F59E0B',
      volumeFlow: 4000,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 26.0, rh: 29 }, pressure, {
      id: 'sc3-pt-4',
      name: '4. HC Batería Caliente',
      color: '#EF4444',
      volumeFlow: 4000,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 26.2, rh: 48 }, pressure, {
      id: 'sc3-pt-5',
      name: '5. HUM Inyección Vapor',
      color: '#A855F7',
      volumeFlow: 4000,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 21.5, rh: 45 }, pressure, {
      id: 'sc3-pt-6',
      name: '6. Confort Zona Invierno',
      color: '#8B5CF6',
      volumeFlow: 4000,
    }),
  ];

  const winterProcs: ProcessConnection[] = [
    {
      id: 'sc3-pr-1',
      name: 'Mezcla Aire Fresco + Retorno',
      type: 'mixing',
      fromPointId: 'sc3-pt-1',
      toPointId: 'sc3-pt-3',
      secondaryFromPointId: 'sc3-pt-2',
      mixingRatio: 0.3,
      conditionId: 'sc-winter-design',
      color: '#F59E0B',
      ...calculateProcessMetrics(winterPts[0], winterPts[2], undefined, 4000),
    },
    {
      id: 'sc3-pr-2',
      name: 'Calentamiento Sensible (HC)',
      type: 'sensible_heating',
      fromPointId: 'sc3-pt-3',
      toPointId: 'sc3-pt-4',
      conditionId: 'sc-winter-design',
      color: '#EF4444',
      ...calculateProcessMetrics(winterPts[2], winterPts[3], undefined, 4000),
    },
    {
      id: 'sc3-pr-3',
      name: 'Humidificación por Lanza de Vapor',
      type: 'steam_humid',
      fromPointId: 'sc3-pt-4',
      toPointId: 'sc3-pt-5',
      conditionId: 'sc-winter-design',
      color: '#A855F7',
      ...calculateProcessMetrics(winterPts[3], winterPts[4], undefined, 4000),
    },
    {
      id: 'sc3-pr-4',
      name: 'Pérdidas Térmicas y Confort Sala',
      type: 'zone_load',
      fromPointId: 'sc3-pt-5',
      toPointId: 'sc3-pt-6',
      conditionId: 'sc-winter-design',
      color: '#8B5CF6',
      ...calculateProcessMetrics(winterPts[4], winterPts[5], undefined, 4000),
    },
  ];

  // Scenario 4: Free-Cooling Directo (Economizador 100% ODA)
  const freeCoolingPts = [
    solveStatePoint({ mode: 'tdb_rh', tdb: 19.0, rh: 58 }, pressure, {
      id: 'sc4-pt-1',
      name: '1. ODA Exterior Ideal (19°C Free-Cooling)',
      color: '#10B981',
      volumeFlow: 4000,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 20.0, rh: 55 }, pressure, {
      id: 'sc4-pt-2',
      name: '2. SA Impulsión Directa con Rodete',
      color: '#059669',
      volumeFlow: 4000,
    }),
    solveStatePoint({ mode: 'tdb_rh', tdb: 24.0, rh: 46 }, pressure, {
      id: 'sc4-pt-3',
      name: '3. Confort Zona Local (Economizador)',
      color: '#8B5CF6',
      volumeFlow: 4000,
    }),
  ];

  const freeCoolingProcs: ProcessConnection[] = [
    {
      id: 'sc4-pr-1',
      name: 'Ganancia Ventilador EC (+1°C)',
      type: 'sensible_heating',
      fromPointId: 'sc4-pt-1',
      toPointId: 'sc4-pt-2',
      conditionId: 'sc-free-cooling',
      color: '#10B981',
      ...calculateProcessMetrics(freeCoolingPts[0], freeCoolingPts[1], undefined, 4000),
    },
    {
      id: 'sc4-pr-2',
      name: 'Disipación Carga Térmica Sala',
      type: 'zone_load',
      fromPointId: 'sc4-pt-2',
      toPointId: 'sc4-pt-3',
      conditionId: 'sc-free-cooling',
      color: '#8B5CF6',
      ...calculateProcessMetrics(freeCoolingPts[1], freeCoolingPts[2], undefined, 4000),
    },
  ];

  return [
    {
      id: 'sc-summer-design',
      name: 'Día de Diseño Verano (100% Carga)',
      description: 'Pico de verano: 34°C / 45% HR exterior. Caudal 4500 m³/h. Batería fría DX con condensación activa.',
      color: '#EF4444',
      isActive: true,
      isOverlayVisible: false,
      points: summerPts,
      processes: summerProcs,
      airflowMultiplier: 1.0,
    },
    {
      id: 'sc-part-load',
      name: 'Carga Parcial (Modulación 60%)',
      description: 'Día moderado: 26°C / 52% HR exterior. Caudal 2700 m³/h (60%). Batería con bajo salto térmico.',
      color: '#0EA5E9',
      isActive: false,
      isOverlayVisible: true, // Superpuesta de inicio para comparación inmediata
      points: partLoadPts,
      processes: partLoadProcs,
      airflowMultiplier: 0.6,
    },
    {
      id: 'sc-winter-design',
      name: 'Diseño Invierno (Calefacción & Vapor)',
      description: 'Invernal: 2°C / 82% HR exterior. Caudal 4000 m³/h. Batería caliente y lanza de vapor.',
      color: '#A855F7',
      isActive: false,
      isOverlayVisible: false,
      points: winterPts,
      processes: winterProcs,
      airflowMultiplier: 0.9,
    },
    {
      id: 'sc-free-cooling',
      name: 'Free Cooling / Economizador (100% ODA)',
      description: 'Exterior ideal: 19°C / 58% HR. 100% aire exterior sin encendido de enfriadora mecánica.',
      color: '#10B981',
      isActive: false,
      isOverlayVisible: false,
      points: freeCoolingPts,
      processes: freeCoolingProcs,
      airflowMultiplier: 0.9,
    },
  ];
}
