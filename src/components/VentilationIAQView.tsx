import React, { useState } from 'react';
import { StatePoint, UnitSystem, ProcessConnection } from '../types/psychrometrics';
import {
  Wind,
  ShieldCheck,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Flame,
  ArrowRight,
  TrendingDown,
  Info,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';

interface VentilationIAQViewProps {
  points: StatePoint[];
  processes?: ProcessConnection[];
  units: UnitSystem;
  onApplyMixingRatio?: (ratio: number) => void;
}

export type IDACategory = 'IDA 1' | 'IDA 2' | 'IDA 3';
export type BuildingEmissionClass = 'very_low' | 'low' | 'standard';

export interface IDASpec {
  name: IDACategory;
  title: string;
  description: string;
  airflowPerPerson_Lps: number; // dm³/s · persona
  airflowPerPerson_m3h: number; // m³/h · persona
  deltaCO2_ppm: number;         // ppm por encima de exterior
  en16798Category: string;      // Categoría equivalente UNE-EN 16798-1
  typicalUses: string;
}

export const IDA_STANDARDS: Record<IDACategory, IDASpec> = {
  'IDA 1': {
    name: 'IDA 1',
    title: 'Aire de Óptima Calidad',
    description: 'Hospitales, clínicas, quirófanos, laboratorios, salas blancas y guarderías infantiles.',
    airflowPerPerson_Lps: 20.0,
    airflowPerPerson_m3h: 72.0,
    deltaCO2_ppm: 350,
    en16798Category: 'Categoría I (Alta)',
    typicalUses: 'Hospitales, UCIs, guarderías y áreas estériles',
  },
  'IDA 2': {
    name: 'IDA 2',
    title: 'Aire de Buena Calidad',
    description: 'Oficinas, despachos, aulas de enseñanza, residencias de ancianos y salas de lectura.',
    airflowPerPerson_Lps: 12.5,
    airflowPerPerson_m3h: 45.0,
    deltaCO2_ppm: 500,
    en16798Category: 'Categoría II (Normal / RITE)',
    typicalUses: 'Oficinas, colegios, universidades y viviendas',
  },
  'IDA 3': {
    name: 'IDA 3',
    title: 'Aire de Calidad Media',
    description: 'Comercios, supermercados, cines, teatros, restaurantes, cafeterías, hoteles y gimnasios.',
    airflowPerPerson_Lps: 8.0,
    airflowPerPerson_m3h: 28.8,
    deltaCO2_ppm: 800,
    en16798Category: 'Categoría III (Moderada)',
    typicalUses: 'Comercios, restaurantes, cines y gimnasios',
  },
};

export const VentilationIAQView: React.FC<VentilationIAQViewProps> = ({
  points,
  processes = [],
  units,
  onApplyMixingRatio,
}) => {
  // Input parameters
  const [category, setCategory] = useState<IDACategory>('IDA 2');
  const [occupants, setOccupants] = useState<number>(30);
  const [area, setArea] = useState<number>(200); // m²
  const [buildingHeight, setBuildingHeight] = useState<number>(2.7); // m
  const [calcMethod, setCalcMethod] = useState<'person' | 'combined' | 'co2'>('person');
  const [buildingEmissions, setBuildingEmissions] = useState<BuildingEmissionClass>('low');
  const [supplyAirflow, setSupplyAirflow] = useState<number>(4500); // m³/h total de la UTA
  const [outdoorCO2, setOutdoorCO2] = useState<number>(420); // ppm en aire exterior
  const [co2PerPersonLph, setCo2PerPersonLph] = useState<number>(19); // L/h CO2 generado por persona (1.2 met)

  // Heat Recovery options
  const [hasHeatRecovery, setHasHeatRecovery] = useState<boolean>(true);
  const [recoveryEfficiency, setRecoveryEfficiency] = useState<number>(75); // % (mínimo RITE 73%)

  // Selected spec
  const currentIDA = IDA_STANDARDS[category];

  // Specific building emissions rate (L/s · m²) per UNE-EN 16798-1
  const buildingEmissionRate_Lps_m2 =
    buildingEmissions === 'very_low'
      ? category === 'IDA 1' ? 0.5 : category === 'IDA 2' ? 0.35 : 0.2
      : buildingEmissions === 'low'
      ? category === 'IDA 1' ? 1.0 : category === 'IDA 2' ? 0.70 : 0.4
      : category === 'IDA 1' ? 2.0 : category === 'IDA 2' ? 1.40 : 0.8;

  // Calculation of Required Outdoor Airflow (Q_ext)
  let requiredOutdoorAirflow_m3h = 0;
  let requiredOutdoorAirflow_Lps = 0;

  if (calcMethod === 'person') {
    // Método 1 RITE: Caudal por persona
    requiredOutdoorAirflow_Lps = occupants * currentIDA.airflowPerPerson_Lps;
    requiredOutdoorAirflow_m3h = occupants * currentIDA.airflowPerPerson_m3h;
  } else if (calcMethod === 'combined') {
    // Método combinado UNE-EN 16798-1: Personas + Edificio
    const qPerson_Lps = occupants * currentIDA.airflowPerPerson_Lps;
    const qBuilding_Lps = area * buildingEmissionRate_Lps_m2;
    requiredOutdoorAirflow_Lps = qPerson_Lps + qBuilding_Lps;
    requiredOutdoorAirflow_m3h = requiredOutdoorAirflow_Lps * 3.6;
  } else {
    // Método por concentración de CO2 en régimen estacionario
    // Q (L/s) = (G_CO2 (L/s) / Delta_CO2 (ppm)) * 10^6
    const gTotal_Lps = (occupants * co2PerPersonLph) / 3600;
    requiredOutdoorAirflow_Lps = (gTotal_Lps / currentIDA.deltaCO2_ppm) * 1000000;
    requiredOutdoorAirflow_m3h = requiredOutdoorAirflow_Lps * 3.6;
  }

  // Air changes per hour (Renovaciones por hora - RPH)
  const roomVolume = area * buildingHeight;
  const airChangesPerHour = roomVolume > 0 ? requiredOutdoorAirflow_m3h / roomVolume : 0;

  // Outdoor Air Mixing Fraction in AHU (UTA)
  const outdoorAirRatio = supplyAirflow > 0 ? Math.min(1.0, requiredOutdoorAirflow_m3h / supplyAirflow) : 0;
  const recirculationRatio = 1.0 - outdoorAirRatio;

  // Estimated Steady-State Indoor CO2 concentration (ppm)
  // C_int = C_ext + (G_total * 10^6) / Q_m3h
  const totalCo2Generation_m3h = (occupants * co2PerPersonLph) / 1000; // m³/h
  const estimatedDeltaCO2_ppm = requiredOutdoorAirflow_m3h > 0
    ? (totalCo2Generation_m3h / requiredOutdoorAirflow_m3h) * 1000000
    : 9999;
  const estimatedIndoorCO2 = Math.round(outdoorCO2 + estimatedDeltaCO2_ppm);

  const isCo2Compliant = estimatedDeltaCO2_ppm <= currentIDA.deltaCO2_ppm + 5;

  // Find points for outdoor air and return air if available
  const outdoorPoint = points.find((p) => p.name.toLowerCase().includes('ext') || p.name.toLowerCase().includes('oda')) || points[0] || null;
  const returnPoint = points.find((p) => p.name.toLowerCase().includes('ret') || p.name.toLowerCase().includes('amb')) || (points.length > 1 ? points[1] : null);

  // Heat Recovery Thermodynamic Impact
  let pretreatedTemp = 0;
  let powerSaved_kW = 0;
  if (outdoorPoint && returnPoint) {
    const eta = recoveryEfficiency / 100;
    pretreatedTemp = outdoorPoint.tdb + eta * (returnPoint.tdb - outdoorPoint.tdb);
    // Mass flow: m_dot = (Q_m3h * 1.2 kg/m³) / 3600 s
    const massFlowExt = (requiredOutdoorAirflow_m3h * 1.2) / 3600;
    const cpAir = 1.006; // kJ/kg·K
    powerSaved_kW = Math.abs(massFlowExt * cpAir * (pretreatedTemp - outdoorPoint.tdb));
  }

  return (
    <div className="w-full flex flex-col space-y-6 select-none font-primary">
      {/* SODECA & RITE IAQ Banner */}
      <div className="p-4 rounded-[12px] bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-[#38bdf8]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-[#38bdf8]" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Calidad del Aire Interior (CAI / IAQ) & Caudales de Ventilación
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
              RITE IT 1.1.4.2 · UNE-EN 16798-1 · SODECA IAQ
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] font-secondary leading-relaxed">
            Dimensionamiento de aire exterior según ocupación, límites de concentración de CO₂ y su impacto en la recta de mezcla del diagrama psicrométrico.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-[#0a0a0c]/80 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)]">
          <div className="text-right font-mono">
            <span className="text-[10px] text-[#94a3b8] uppercase block">Caudal Exterior</span>
            <strong className="text-sm text-[#38bdf8]">{requiredOutdoorAirflow_m3h.toFixed(0)} m³/h</strong>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-left font-mono">
            <span className="text-[10px] text-[#94a3b8] uppercase block">Fracción Mezcla</span>
            <strong className="text-sm text-[#a3e635]">{(outdoorAirRatio * 100).toFixed(1)}% Ext.</strong>
          </div>
        </div>
      </div>

      {/* 3 IDA Category Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['IDA 1', 'IDA 2', 'IDA 3'] as IDACategory[]).map((catKey) => {
          const spec = IDA_STANDARDS[catKey];
          const isSelected = category === catKey;

          return (
            <div
              key={catKey}
              onClick={() => setCategory(catKey)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                isSelected
                  ? catKey === 'IDA 1'
                    ? 'bg-[#fbbf24]/10 border-[#fbbf24] shadow-lg shadow-[#fbbf24]/10 ring-1 ring-[#fbbf24]'
                    : catKey === 'IDA 2'
                    ? 'bg-[#a3e635]/10 border-[#a3e635] shadow-lg shadow-[#a3e635]/10 ring-1 ring-[#a3e635]'
                    : 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-lg shadow-[#38bdf8]/10 ring-1 ring-[#38bdf8]'
                  : 'bg-[#1a1a1c]/80 border-[rgba(255,255,255,0.1)] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded ${
                    catKey === 'IDA 1'
                      ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                      : catKey === 'IDA 2'
                      ? 'bg-[#a3e635]/20 text-[#a3e635]'
                      : 'bg-[#38bdf8]/20 text-[#38bdf8]'
                  }`}
                >
                  {catKey}
                </span>
                <span className="text-[10px] font-mono text-[#94a3b8]">
                  ΔCO₂ ≤ {spec.deltaCO2_ppm} ppm
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{spec.title}</h4>
                <p className="text-[11px] text-[#cbd5e1] font-secondary mt-0.5 line-clamp-2">
                  {spec.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center text-xs font-mono">
                <span className="text-[#94a3b8]">Caudal normativo:</span>
                <strong className="text-white">
                  {spec.airflowPerPerson_Lps} L/s ({spec.airflowPerPerson_m3h} m³/h·p)
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Calculation & Engineering Parameters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calculation Parameters & Room Geometry */}
        <div className="lg:col-span-2 bg-[#1a1a1c]/90 rounded-xl border border-[rgba(255,255,255,0.1)] p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#fbbf24]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Parámetros del Local y Método de Cálculo RITE
              </h4>
            </div>

            {/* Calculation Method Selector */}
            <div className="flex items-center gap-1 bg-[#0a0a0c] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
              <button
                onClick={() => setCalcMethod('person')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  calcMethod === 'person' ? 'bg-[#38bdf8] text-black font-bold' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Por Persona
              </button>
              <button
                onClick={() => setCalcMethod('combined')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  calcMethod === 'combined' ? 'bg-[#38bdf8] text-black font-bold' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Personas + Edificio
              </button>
              <button
                onClick={() => setCalcMethod('co2')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  calcMethod === 'co2' ? 'bg-[#38bdf8] text-black font-bold' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Dilución CO₂
              </button>
            </div>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Occupants Slider */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#0a0a0c]/60 border border-white/5">
              <div className="flex justify-between items-center text-[#cbd5e1]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-[#fbbf24]" />
                  Ocupación de diseño:
                </span>
                <span className="font-mono text-[#fbbf24] font-bold">{occupants} personas</span>
              </div>
              <input
                type="range"
                min="1"
                max="250"
                step="1"
                value={occupants}
                onChange={(e) => setOccupants(parseInt(e.target.value) || 1)}
                className="w-full accent-[#fbbf24] h-1.5 bg-[#1a1a1c] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>1 p.</span>
                <span>50 p.</span>
                <span>250 p.</span>
              </div>
            </div>

            {/* Total AHU Supply Airflow */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#0a0a0c]/60 border border-white/5">
              <div className="flex justify-between items-center text-[#cbd5e1]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Wind className="w-3.5 h-3.5 text-[#a3e635]" />
                  Caudal total impulsión UTA:
                </span>
                <span className="font-mono text-[#a3e635] font-bold">{supplyAirflow.toLocaleString()} m³/h</span>
              </div>
              <input
                type="range"
                min="500"
                max="30000"
                step="250"
                value={supplyAirflow}
                onChange={(e) => setSupplyAirflow(parseInt(e.target.value) || 500)}
                className="w-full accent-[#a3e635] h-1.5 bg-[#1a1a1c] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>500 m³/h</span>
                <span>15.000 m³/h</span>
                <span>30.000 m³/h</span>
              </div>
            </div>

            {/* Floor Surface Area */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#0a0a0c]/60 border border-white/5">
              <div className="flex justify-between items-center text-[#cbd5e1]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Superficie útil del local:
                </span>
                <span className="font-mono text-[#38bdf8] font-bold">{area} m²</span>
              </div>
              <input
                type="range"
                min="20"
                max="1500"
                step="10"
                value={area}
                onChange={(e) => setArea(parseInt(e.target.value) || 20)}
                className="w-full accent-[#38bdf8] h-1.5 bg-[#1a1a1c] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>20 m²</span>
                <span>500 m²</span>
                <span>1.500 m²</span>
              </div>
            </div>

            {/* Outdoor CO2 Concentration */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#0a0a0c]/60 border border-white/5">
              <div className="flex justify-between items-center text-[#cbd5e1]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Gauge className="w-3.5 h-3.5 text-[#f97316]" />
                  Concentración CO₂ Exterior:
                </span>
                <span className="font-mono text-[#f97316] font-bold">{outdoorCO2} ppm</span>
              </div>
              <input
                type="range"
                min="380"
                max="550"
                step="5"
                value={outdoorCO2}
                onChange={(e) => setOutdoorCO2(parseInt(e.target.value) || 400)}
                className="w-full accent-[#f97316] h-1.5 bg-[#1a1a1c] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>380 (rural)</span>
                <span>420 (estándar)</span>
                <span>550 (urbano denso)</span>
              </div>
            </div>
          </div>

          {/* Building emissions toggle if combined method */}
          {calcMethod === 'combined' && (
            <div className="p-3 rounded-lg bg-[#0a0a0c] border border-white/10 space-y-2 text-xs">
              <span className="text-[#cbd5e1] font-semibold block">
                Tipo de Edificio según tasa de emisiones de materiales (UNE-EN 16798-1):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'very_low', label: 'Muy poco contaminante', sub: 'Materiales ecológicos / bajas emisiones' },
                  { id: 'low', label: 'Poco contaminante', sub: 'Estándar nueva edificación' },
                  { id: 'standard', label: 'Contaminante', sub: 'Edificio existente / moquetas / pinturas' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setBuildingEmissions(item.id as BuildingEmissionClass)}
                    className={`p-2 rounded border text-left transition-all ${
                      buildingEmissions === item.id
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8] font-bold'
                        : 'bg-[#1a1a1c] border-white/10 text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <div className="text-[11px]">{item.label}</div>
                    <div className="text-[9px] text-[#64748b] truncate">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Heat Recovery (Recuperador de Calor de Ventilación) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#0a0a0c] to-[#1e1b4b]/40 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">
                  Recuperador de Calor Aire-Aire (RITE IT 1.2.4.5.2)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Obligatorio &gt; 1.800 m³/h
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasHeatRecovery}
                  onChange={(e) => setHasHeatRecovery(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-[#cbd5e1]">Activar Recuperador</span>
              </label>
            </div>

            {hasHeatRecovery && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                <div>
                  <div className="flex justify-between text-[#cbd5e1] mb-1 font-mono">
                    <span>Eficiencia Térmica Sensible (η):</span>
                    <strong className="text-indigo-400">{recoveryEfficiency}%</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="1"
                    value={recoveryEfficiency}
                    onChange={(e) => setRecoveryEfficiency(parseInt(e.target.value) || 75)}
                    className="w-full accent-indigo-500 h-1.5 bg-[#1a1a1c] rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono mt-0.5">
                    <span>73% (mín. RITE)</span>
                    <span>75% (estándar)</span>
                    <span>85% (alta eficiencia)</span>
                  </div>
                </div>

                {outdoorPoint && returnPoint && (
                  <div className="p-2.5 rounded bg-[#0a0a0c]/80 border border-white/5 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Temp. Aire Exterior (ODA):</span>
                      <strong className="text-[#38bdf8]">{outdoorPoint.tdb.toFixed(1)}°C</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Temp. Pretratada (Salida Rec.):</span>
                      <strong className="text-[#a3e635]">{pretreatedTemp.toFixed(1)}°C</strong>
                    </div>
                    <div className="flex justify-between text-indigo-300 font-bold border-t border-white/5 pt-1">
                      <span>Potencia Térmica Ahorrada:</span>
                      <span>{powerSaved_kW.toFixed(2)} kW</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Results & Psychrometric Mixing Injector */}
        <div className="space-y-4">
          {/* Engineering Results Card */}
          <div className="bg-[#1a1a1c]/90 rounded-xl border border-[rgba(255,255,255,0.1)] p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-white/10 pb-2 flex items-center justify-between">
              <span>Resultados de Ventilación</span>
              <span className="text-[10px] text-[#38bdf8]">{currentIDA.en16798Category}</span>
            </h4>

            {/* Big Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-[#0a0a0c]/80 border border-white/10">
                <span className="text-[10px] text-[#94a3b8] uppercase block">Caudal Exterior</span>
                <div className="text-lg font-bold text-[#38bdf8]">{requiredOutdoorAirflow_m3h.toFixed(0)}</div>
                <span className="text-[10px] text-[#64748b]">m³/h ({requiredOutdoorAirflow_Lps.toFixed(1)} L/s)</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0a0c]/80 border border-white/10">
                <span className="text-[10px] text-[#94a3b8] uppercase block">Fracción de Mezcla</span>
                <div className="text-lg font-bold text-[#a3e635]">{(outdoorAirRatio * 100).toFixed(1)}%</div>
                <span className="text-[10px] text-[#64748b]">Aire Ext. / Total UTA</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0a0c]/80 border border-white/10">
                <span className="text-[10px] text-[#94a3b8] uppercase block">Renovaciones (RPH)</span>
                <div className="text-lg font-bold text-white">{airChangesPerHour.toFixed(2)}</div>
                <span className="text-[10px] text-[#64748b]">renovaciones / hora</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0a0a0c]/80 border border-white/10">
                <span className="text-[10px] text-[#94a3b8] uppercase block">CO₂ Interior Est.</span>
                <div className={`text-lg font-bold ${isCo2Compliant ? 'text-[#a3e635]' : 'text-[#ef4444]'}`}>
                  {estimatedIndoorCO2}
                </div>
                <span className="text-[10px] text-[#64748b]">ppm (Δ={estimatedDeltaCO2_ppm.toFixed(0)} ppm)</span>
              </div>
            </div>

            {/* Regulatory Compliance Badge */}
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                isCo2Compliant
                  ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#a3e635]'
                  : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#fca5a5]'
              }`}
            >
              {isCo2Compliant ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#a3e635]" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#ef4444]" />
              )}
              <div className="leading-tight font-secondary">
                {isCo2Compliant ? (
                  <span>
                    <strong>Conforme con {category}:</strong> Concentración de CO₂ dentro del límite normativo (+
                    {currentIDA.deltaCO2_ppm} ppm).
                  </span>
                ) : (
                  <span>
                    <strong>Caudal insuficiente:</strong> Se superan los +{currentIDA.deltaCO2_ppm} ppm de incremento
                    máximo para {category}.
                  </span>
                )}
              </div>
            </div>

            {/* Direct Injection to Psychrometric Mixing Process */}
            {onApplyMixingRatio && (
              <button
                onClick={() => onApplyMixingRatio(outdoorAirRatio)}
                className="w-full py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white hover:from-[#0369a1] hover:to-[#0284c7] shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>Aplicar {(outdoorAirRatio * 100).toFixed(1)}% al Proceso de Mezcla</span>
              </button>
            )}
          </div>

          {/* SODECA IAQ Regulatory Guidelines Card */}
          <div className="p-4 rounded-xl bg-[#0a0a0c]/80 border border-white/10 space-y-2 text-xs font-secondary">
            <span className="font-bold text-[#cbd5e1] font-primary block uppercase tracking-wider text-[11px]">
              Directrices RITE IT 1.1.4.2 & SODECA
            </span>
            <p className="text-[#94a3b8] leading-normal text-[11px]">
              La tasa de renovación de aire exterior garantiza la dilución de bioefluentes, CO₂ y formaldehídos. El caudal
              mínimo calculado debe ser garantizado por ventiladores mecánicos certificados con recuperación de calor si el caudal
              supera 1.800 m³/h.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
