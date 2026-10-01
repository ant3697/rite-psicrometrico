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
  // Computed thermodynamic process metrics:
  qSensible: number;             // kW
  qLatent: number;               // kW
  qTotal: number;                // kW
  moistureExchange: number;      // kg/h (positive = added moisture, negative = condensed moisture)
  shr: number;                   // Sensible Heat Ratio = Qs / Qt
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
  processes: boolean;
  pointLabels: boolean;
  shrProtractor: boolean;
  grid: boolean;
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
