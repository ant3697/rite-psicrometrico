import {
  StatePoint,
  ProcessConnection,
  ProcessType,
  PresetCycle,
} from '../types/psychrometrics';
import {
  C_PA,
  H_FG,
  P_ATM_STANDARD,
  solveStatePoint,
  getSaturationHumidityRatio,
  getSaturationVaporPressure,
  getHumidityRatioFromPv,
  getDewPoint,
} from './psychrolib';

/**
 * Calculates thermodynamic transfer rates for a process between two points.
 */
export function calculateProcessMetrics(
  fromPoint: StatePoint,
  toPoint: StatePoint,
  massFlowKgS: number = 0.5 // Default dry air mass flow rate (kg/s)
): {
  qSensible: number;
  qLatent: number;
  qTotal: number;
  moistureExchange: number;
  shr: number;
  adp?: number;
  bypassFactor?: number;
} {
  // Mass flow rate dry air (kg/s)
  const mDot = massFlowKgS > 0 ? massFlowKgS : fromPoint.massFlow || 0.5;

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
    let low = -10;
    let high = Math.min(toPoint.tdb, 30);
    for (let i = 0; i < 30; i++) {
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
    if (adp < fromPoint.tdb && adp > -20) {
      bypassFactor = (toPoint.tdb - adp) / (fromPoint.tdb - adp);
      bypassFactor = Math.max(0, Math.min(1, bypassFactor));
    }
  }

  return {
    qSensible,
    qLatent,
    qTotal,
    moistureExchange,
    shr: Math.max(-2, Math.min(2, shr)),
    adp,
    bypassFactor,
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
