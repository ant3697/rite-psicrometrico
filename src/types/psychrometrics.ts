export type UnitSystem = 'SI' | 'IP';

export type ChartType = 'carrier' | 'mollier';

export type ChartTheme = 'dark' | 'light' | 'blueprint';

export interface PsychroInputs {
  mode: 'tdb_rh' | 'tdb_twb' | 'tdb_tdp' | 'tdb_w' | 'tdb_h' | 'h_w' | 'twb_rh';
  tdb?: number; // °C or °F
  rh?: number;  // % (0 - 100)
  twb?: number; // °C or °F
  tdp?: number; // °C or °F
  w?: number;   // g/kg or gr/lb (or kg/kg internally)
  h?: number;   // kJ/kg or BTU/lb
}

export type PsychroParamKey = 'tdb' | 'rh' | 'h' | 'w' | 'twb' | 'tdp' | 'v';

export interface StatePoint {
  id: string;
  name: string;
  color: string;
  // Thermodynamic state stored in SI standard:
  tdb: number;      // Dry-bulb temperature (°C)
  w: number;        // Humidity ratio (kg water / kg dry air)
  twb: number;      // Wet-bulb temperature (°C)
  tdp: number;      // Dew point temperature (°C)
  rh: number;       // Relative humidity (%)
  h: number;        // Specific enthalpy (kJ/kg dry air)
  v: number;        // Specific volume (m³/kg dry air)
  pv: number;       // Vapor partial pressure (kPa)
  rho: number;      // Humid air density (kg/m³)
  // Air flow metrics:
  volumeFlow: number; // m³/h (SI) or CFM (IP)
  massFlow: number;   // kg/s dry air
  isLocked?: boolean;
  hidden?: boolean;   // Whether point is hidden from chart rendering
  fixedParams?: PsychroParamKey[];
  fixedValues?: Partial<Record<PsychroParamKey, number>>;
}

export type ProcessType =
  | 'sensible_heating'
  | 'sensible_cooling'
  | 'cooling_dehumid'
  | 'steam_humid'
  | 'adiabatic_humid'
  | 'mixing'
  | 'heat_recovery'
  | 'zone_load'
  | 'custom';

export interface ProcessConnection {
  id: string;
  name: string;
  type: ProcessType;
  fromPointId: string;
  toPointId: string;
  secondaryFromPointId?: string; // For mixing (e.g., Return Air + Outdoor Air)
  mixingRatio?: number;          // Fraction of fromPointId (0 to 1, e.g. 0.3 for 30% outdoor air)
  bypassFactor?: number;         // Coil bypass factor BF (e.g. 0.1)
  adp?: number;                  // Apparatus Dew Point (°C)
  efficiency?: number;           // Heat recovery efficiency (e.g. 0.75 for 75%)
  color?: string;
  // Specific process airflow & condition tracking (OTS Psychrochart feature):
  volumeFlow?: number;           // Airflow rate for this process (m³/h or CFM)
  massFlow?: number;             // Mass flow dry air (kg/s)
  conditionId?: string;          // Associated operating condition/scenario ID
  // Computed thermodynamic process metrics:
  qSensible: number;             // kW
  qLatent: number;               // kW
  qTotal: number;                // kW
  moistureExchange: number;      // kg/h (positive = added moisture, negative = condensed moisture)
  shr: number;                   // Sensible Heat Ratio = Qs / Qt
  // Frost & coil freeze risk diagnostics:
  isFrostRisk?: boolean;         // True if surface / ADP / exit air < 0°C with condensation
  frostRateKgH?: number;         // kg/h of frost/ice accumulation
}

export interface CoilSimulationResult {
  isSensibleOnly: boolean;       // True if coil surface >= entering dew point (no dehumidification)
  adp: number;                   // Apparatus Dew Point (°C)
  wAdp: number;                  // Saturation humidity ratio at ADP (kg/kg)
  hAdp: number;                  // Saturation enthalpy at ADP (kJ/kg)
  bypassFactor: number;          // Coil Bypass Factor BF (0..1)
  contactFactor: number;         // Contact Factor CF = 1 - BF
  // Leaving air thermodynamic state
  exitTdb: number;               // °C
  exitW: number;                 // kg/kg
  exitRh: number;                // %
  exitTwb: number;               // °C
  exitTdp: number;               // °C
  exitEnthalpy: number;          // kJ/kg
  exitSpecVol: number;           // m³/kg
  // Thermal capacities & sizing
  massFlowKgS: number;           // kg/s dry air
  qSensibleKw: number;           // kW
  qLatentKw: number;             // kW
  qTotalKw: number;              // kW
  shr: number;                   // Sensible Heat Ratio
  condensateRateKgH: number;     // kg/h or L/h of condensed water
  // Frost risk & defrost analysis (OTS feature)
  isFrostRisk: boolean;          // True if ADP <= 0°C with condensation
  frostRateKgH: number;          // kg/h of frost/ice accumulation on fins
  defrostHeatingLoadKw?: number; // kW recommended defrost thermal power
}

export interface AirMixingResult {
  // Mass & flow metrics:
  massFlow1: number;             // kg/s dry air stream 1
  massFlow2: number;             // kg/s dry air stream 2
  totalMassFlow: number;         // kg/s dry air mixed
  totalVolumeFlow: number;       // m³/h total mixed volumetric flow
  volumeRatio2Percent: number;   // % Outdoor air volumetric fraction
  massRatio1: number;            // 0..1 mass fraction stream 1
  massRatio2: number;            // 0..1 mass fraction stream 2
  // Mixed air psychrometric properties:
  mixedTdb: number;              // °C
  mixedW: number;                // kg/kg
  mixedRh: number;               // %
  mixedH: number;                // kJ/kg
  mixedTwb: number;              // °C
  mixedTdp: number;              // °C
  mixedSpecVol: number;          // m³/kg
  // Physical phenomena checks:
  isFogRisk: boolean;            // Supersaturation in mixing chamber (RH > 100%)
  fogMoistureRateKgH: number;    // Condensed fog/mist water rate (kg/h)
  // Economizer / Free-Cooling diagnostic:
  isFreeCoolingViable: boolean;
  freeCoolingPotentialKw: number;
}

export interface ShrSizingResult {
  // SHR metrics
  rshr: number;                  // Room Sensible Heat Ratio (RSHR = Qs_room / Qt_room)
  roomSensibleKw: number;        // kW
  roomLatentKw: number;          // kW
  roomTotalKw: number;           // kW
  gshr: number;                  // Grand Sensible Heat Ratio (GSHR = Qs_total / Qt_total)
  grandSensibleKw: number;       // kW
  grandLatentKw: number;         // kW
  grandTotalKw: number;          // kW
  // Coil Apparatus Dew Point
  adp: number;                   // °C (Coil Apparatus Dew Point)
  wAdp: number;                  // kg/kg
  hAdp: number;                  // kJ/kg
  bypassFactor: number;          // Coil Bypass Factor (BF)
  contactFactor: number;         // Contact Factor (CF = 1 - BF)
  // Room condition
  roomTdb: number;               // °C
  roomW: number;                 // kg/kg
  roomRh: number;                // %
  roomH: number;                 // kJ/kg
  // Supply air condition
  supplyTdb: number;             // °C
  supplyW: number;               // kg/kg
  supplyRh: number;              // %
  supplyTwb: number;             // °C
  supplyH: number;               // kJ/kg
  deltaTSupply: number;          // °C (Troom - Tsupply)
  // Outdoor and mixed air condition
  outdoorTdb: number;            // °C
  outdoorW: number;              // kg/kg
  outdoorRh: number;             // %
  outdoorAirRatio: number;       // 0..1 (fraction of outdoor air)
  mixedTdb: number;              // °C
  mixedW: number;                // kg/kg
  mixedRh: number;               // %
  mixedH: number;                // kJ/kg
  // Airflow rates
  requiredMassFlowKgS: number;   // kg/s dry air
  requiredAirflowM3h: number;    // m³/h
  requiredAirflowCfm: number;    // CFM
  // Coil cooling capacities
  coilCoolingTotalKw: number;    // kW
  coilCoolingSensibleKw: number; // kW
  coilCoolingLatentKw: number;   // kW
  coilCondensateRateKgH: number; // kg/h or L/h
  coilTonsRefrigeration: number; // TR
  // Altitude derating
  airDensity: number;            // kg/m³
  densityDeratingFactor: number; // relative to sea level 1.204 kg/m³
}

export interface ElevationPreset {
  name: string;
  altitudeM: number;
  altitudeFt: number;
  pressureKPa: number;
  pressurePsia: number;
  deratingPercent: number;       // e.g. -7.0%
  description: string;
}

export interface OperatingCondition {
  id: string;
  name: string;
  description?: string;
  color: string;                 // Distinctive color tag & overlay stroke
  isActive: boolean;             // True if currently active / editable
  isOverlayVisible: boolean;     // True if visible on psychrometric chart as comparison overlay
  points: StatePoint[];
  processes: ProcessConnection[];
  airflowMultiplier?: number;    // E.g. 1.0 (100% full design), 0.6 (60% part load)
}

export interface AtmosphereConfig {
  pressure: number;   // kPa (standard 101.325 kPa)
  altitude: number;   // meters (0 m at sea level)
}

export interface ChartBounds {
  tdbMin: number;     // °C (-10)
  tdbMax: number;     // °C (55)
  wMin: number;       // kg/kg (0)
  wMax: number;       // kg/kg (0.033 = 33 g/kg)
}

export interface ChartLayerVisibility {
  rhCurves: boolean;
  twbLines: boolean;
  enthalpyLines: boolean;
  volumeLines: boolean;
  comfortSummer: boolean;         // ASHRAE 55 Verano
  comfortWinter: boolean;         // ASHRAE 55 Invierno
  comfortEnCat1: boolean;         // UNE-EN 16798-1 / ISO 7730 Cat I (Alta expectativa / PPD < 6%)
  comfortEnCat2: boolean;         // UNE-EN 16798-1 / ISO 7730 Cat II (Nivel normal nuevo/RITE / PPD < 10%)
  comfortEnCat3: boolean;         // UNE-EN 16798-1 / ISO 7730 Cat III (Nivel moderado / PPD < 15%)
  comfortEnSeason: 'summer' | 'winter'; // Temporada Europea
  comfortRite?: boolean;          // Zona Confort RITE Oficial (IT 1.1.4.1.1)
  comfortGivoni?: boolean;        // Confort Bioclimático Givoni (Ventilación y Pasivo)
  processes: boolean;
  pointLabels: boolean;
  shrProtractor: boolean;
  grid: boolean;
  enthalpyDeviations?: boolean;   // Curvas de Desviación de Entalpía ASHRAE
  satEnthalpyScale?: boolean;     // Escala Perimetral de Entalpía de Saturación (kJ/kg)
  shfScale?: boolean;             // Escala Vertical Derecha de Factor de Calor Sensible (FCS / SHR)
  satTempScale?: boolean;         // Graduaciones de Temperatura de Saturación (°C)
  allReferenceRays?: boolean;     // Haz completo de líneas de referencia ASHRAE (FCS / SHR 0.00 a 1.00)
  oversaturatedZone?: boolean;    // Sombreado tramado de la zona supersaturada (W > Wsat) tipo psychrochart
}

export type AHUModuleType =
  | 'intake_damper'
  | 'prefilter'
  | 'prefilter_flat'
  | 'mixing_box'
  | 'heat_recovery'
  | 'rotary_wheel'
  | 'adiabatic_cooling'
  | 'cooling_coil'
  | 'heating_coil'
  | 'electric_heater'
  | 'humidifier'
  | 'droplet_eliminator'
  | 'fan'
  | 'belt_fan'
  | 'return_fan'
  | 'plenum'
  | 'final_filter'
  | 'silencer'
  | 'exhaust_damper';

export interface AHUModuleItem {
  id: string;
  type: AHUModuleType;
  name: string;
  enabled: boolean;
  pressureDropPa: number;
  params: {
    exitTdb?: number;
    exitRh?: number;
    bypassFactor?: number;
    fluid?: 'water_7_12' | 'dx_r410a' | 'dx_r32';
    heatingTdb?: number;
    heatingSource?: 'hot_water' | 'electric_resistance' | 'heat_pump';
    outdoorRatio?: number;
    recoveryEfficiency?: number;
    recoveryType?: 'plates' | 'rotary_wheel';
    humidifierType?: 'steam' | 'evaporative_pad';
    targetRh?: number;
    fanType?: 'plug_fan_ec' | 'centrifugal';
    staticPressurePa?: number;
    motorEfficiency?: number;
    tempRise?: number;
    filterClass?: 'G4' | 'M5' | 'F7' | 'F9' | 'HEPA_H13';
    attenuationDb?: number;
  };
}

export interface PresetCycle {
  id: string;
  name: string;
  description: string;
  category: 'IDAE_RITE' | 'Commercial' | 'Industrial' | 'Bioclimatic' | 'Ventilation';
  points: Array<{
    name: string;
    color: string;
    inputs: PsychroInputs;
    volumeFlow?: number;
  }>;
  processes: Array<{
    name: string;
    type: ProcessType;
    fromIndex: number;
    toIndex: number;
    secondaryFromIndex?: number;
    mixingRatio?: number;
    bypassFactor?: number;
  }>;
}

export interface IsolatedProcessInfo {
  processId?: string;
  moduleId?: string;
  moduleName?: string;
  moduleType?: AHUModuleType | ProcessType | string;
  isPassive?: boolean;
  entryPoint: StatePoint;
  exitPoint: StatePoint;
  secondaryEntryPoint?: StatePoint;
  process?: ProcessConnection;
  pressureDropPa?: number;
  onClearIsolation?: () => void;
}
