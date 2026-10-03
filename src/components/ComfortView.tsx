import React, { useState } from 'react';
import { StatePoint, UnitSystem } from '../types/psychrometrics';
import { calculateFangerPMV, UnitConvert } from '../utils/psychrolib';
import { FangerPpdPmvChart, getFangerSensation } from './FangerPpdPmvChart';
import { VentilationIAQView } from './VentilationIAQView';
import { ProcessConnection } from '../types/psychrometrics';
import {
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  User,
  Wind,
  Sliders,
  Layers,
  Sparkles,
  HelpCircle,
  Activity,
} from 'lucide-react';

interface ComfortViewProps {
  points: StatePoint[];
  processes?: ProcessConnection[];
  units: UnitSystem;
  selectedPointId?: string | null;
  onSelectPoint: (id: string) => void;
  onApplyMixingRatio?: (ratio: number) => void;
  onOpenIdaeModal?: () => void;
}

export const ComfortView: React.FC<ComfortViewProps> = ({
  points,
  processes = [],
  units,
  selectedPointId,
  onSelectPoint,
  onApplyMixingRatio,
  onOpenIdaeModal,
}) => {
  // Navigation between Thermal Comfort (Fanger) and Indoor Air Quality (Ventilation/IDA)
  const [activeTab, setActiveTab] = useState<'thermal_comfort' | 'iaq_ventilation'>('thermal_comfort');

  // Environmental simulation parameters
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');
  const [clo, setClo] = useState<number>(0.5); // 0.5 verano, 1.0 invierno
  const [met, setMet] = useState<number>(1.2); // 1.2 met = oficina sedentaria
  const [airVelocity, setAirVelocity] = useState<number>(0.15); // 0.15 m/s estándar

  const handleSeasonChange = (s: 'summer' | 'winter') => {
    setSeason(s);
    setClo(s === 'summer' ? 0.5 : 1.0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] p-6 overflow-y-auto select-none space-y-6 font-primary">
      {/* Header with Title and Regulatory Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.1)] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Evaluación de Confort Térmico & Calidad de Ambiente Interior
            </h2>
            <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30">
              UNE-EN 16798-1 & ISO 7730
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] mt-1 font-secondary">
            Auditoría de confort térmico según el modelo analítico de Fanger (ISO 7730 / RITE) y calidad de aire interior (SODECA / IDA 1-2-3)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Season Selector */}
          {activeTab === 'thermal_comfort' && (
            <div className="tabs-container shrink-0">
              <button
                onClick={() => handleSeasonChange('summer')}
                className={`tab-item text-xs ${season === 'summer' ? 'active' : ''}`}
              >
                Verano (0.5 clo)
              </button>
              <button
                onClick={() => handleSeasonChange('winter')}
                className={`tab-item text-xs ${season === 'winter' ? 'active' : ''}`}
              >
                Invierno (1.0 clo)
              </button>
            </div>
          )}

          {/* IDAE Compliance Audit button */}
          {onOpenIdaeModal && (
            <button
              onClick={onOpenIdaeModal}
              className="btn-secondary text-xs !border-[#65a30d]/40 !text-[#a3e635] hover:!border-[#a3e635] shrink-0"
              title="Auditoría según la Guía Técnica IDAE de Equipos Autónomos (ATECYR / RITE)"
            >
              <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
              <span>Auditoría IDAE</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs: Thermal Comfort vs. Ventilation & IAQ */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('thermal_comfort')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'thermal_comfort'
              ? 'bg-[#38bdf8] text-black shadow-lg shadow-[#38bdf8]/20'
              : 'bg-[#1a1a1c] text-[#94a3b8] hover:text-white border border-white/5'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          <span>1. Confort Térmico & Fanger (PMV / PPD)</span>
        </button>

        <button
          onClick={() => setActiveTab('iaq_ventilation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'iaq_ventilation'
              ? 'bg-[#38bdf8] text-black shadow-lg shadow-[#38bdf8]/20'
              : 'bg-[#1a1a1c] text-[#94a3b8] hover:text-white border border-white/5'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>2. Calidad de Aire & Ventilación (IDA / CO₂ / SODECA)</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 ml-1">
            Nuevo
          </span>
        </button>
      </div>

      {activeTab === 'iaq_ventilation' ? (
        <VentilationIAQView
          points={points}
          processes={processes}
          units={units}
          onApplyMixingRatio={onApplyMixingRatio}
        />
      ) : (
        <>

      {/* ISO 7730 Conceptual Mind Map & Normative Framework */}
      <div className="p-4 rounded-[12px] bg-[#1a1a1c]/80 border border-[rgba(255,255,255,0.1)] space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#fbbf24] font-semibold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Marco Normativo ISO 7730:2005 · Ergonomía del Entorno Térmico</span>
          </div>
          <span className="text-[11px] text-[#94a3b8] font-mono">
            RITE IT 1.1.4.1 · CTE DB-HE · UNE-EN 16798-1
          </span>
        </div>

        {/* 6 Factors of Thermal Balance Map */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* 4 Environmental Parameters */}
          <div className="p-3 bg-[#0a0a0c]/85 rounded-[8px] border border-[rgba(255,255,255,0.08)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#38bdf8] font-bold">
              <Thermometer className="w-3.5 h-3.5" />
              <span>4 Parámetros Ambientales</span>
            </div>
            <ul className="text-[11px] text-[#cbd5e1] space-y-1 font-secondary pl-1">
              <li>• <strong>Temperatura del aire (T_aire)</strong> y de superficies</li>
              <li>• <strong>Temperatura radiante media (T_mr)</strong></li>
              <li>• <strong>Humedad relativa (HR)</strong> del aire</li>
              <li>• <strong>Velocidad del aire (v)</strong> / ventilación</li>
            </ul>
          </div>

          {/* 2 Personal Parameters */}
          <div className="p-3 bg-[#0a0a0c]/85 rounded-[8px] border border-[rgba(255,255,255,0.08)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold">
              <User className="w-3.5 h-3.5" />
              <span>2 Parámetros Personales</span>
            </div>
            <ul className="text-[11px] text-[#cbd5e1] space-y-1 font-secondary pl-1">
              <li>• <strong>Tasa metabólica (met)</strong>: actividad y esfuerzo físico</li>
              <li>• <strong>Aislamiento de la ropa (clo)</strong>: vestimenta de verano o invierno</li>
              <li>• <em>Adaptación</em>: Cláusula 10 de ISO 7730</li>
            </ul>
          </div>

          {/* Output Indices PMV & PPD */}
          <div className="p-3 bg-[#0a0a0c]/85 rounded-[8px] border border-[rgba(255,255,255,0.08)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#a3e635] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Índices Resultantes (Fanger)</span>
            </div>
            <p className="text-[11px] text-[#cbd5e1] leading-relaxed font-secondary">
              <strong>PMV (Voto Medio Previsto)</strong>: escala de sensación entre -3 y +3.
              <br />
              <strong>PPD (Insatisfechos Previstos)</strong>: curva analítica derivada del balance térmico.
            </p>
          </div>
        </div>

        {/* Fanger's 5% Residual Law Callout */}
        <div className="p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-start gap-2.5 text-xs text-[#fde68a]">
          <HelpCircle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
          <div className="leading-relaxed font-secondary">
            <strong className="text-[#fbbf24] font-primary">Principio del 5% Residual de Fanger (ISO 7730):</strong>{' '}
            Aunque el índice PMV = 0 (sensación térmica perfectamente neutra), <strong>siempre existe un PPD = 5% de personas insatisfechas</strong>. Debido a las diferencias metabólicas y fisiológicas naturales entre individuos, no es posible satisfacer al 100% de los ocupantes al mismo tiempo. Por ello, el objetivo de confort térmico en climatización es alcanzar la <strong>Categoría II (|PMV| ≤ 0.5 → PPD ≤ 10%)</strong> o <strong>Categoría I (|PMV| ≤ 0.2 → PPD ≤ 6%)</strong>.
          </div>
        </div>
      </div>

      {/* Quick Simulation Parameter Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1a1a1c]/80 p-4 rounded-[12px] border border-[rgba(255,255,255,0.1)] text-xs shadow-md">
        <div>
          <div className="flex justify-between text-[#cbd5e1] mb-1 font-secondary">
            <span>Aislamiento Vestimenta (clo):</span>
            <span className="font-mono text-[#fbbf24] font-bold">{clo.toFixed(2)} clo</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.05"
            value={clo}
            onChange={(e) => setClo(parseFloat(e.target.value))}
            className="w-full accent-[#fbbf24] cursor-pointer h-1.5 bg-[#0a0a0c] rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono mt-1">
            <span>0.3 (ligero)</span>
            <span>0.5 (verano)</span>
            <span>1.0 (invierno)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[#cbd5e1] mb-1 font-secondary">
            <span>Tasa Metabólica (met):</span>
            <span className="font-mono text-[#fbbf24] font-bold">{met.toFixed(1)} met</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={met}
            onChange={(e) => setMet(parseFloat(e.target.value))}
            className="w-full accent-[#fbbf24] cursor-pointer h-1.5 bg-[#0a0a0c] rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono mt-1">
            <span>0.8 (reposo)</span>
            <span>1.2 (oficina)</span>
            <span>2.0 (pie/movimiento)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[#cbd5e1] mb-1 font-secondary">
            <span>Velocidad del Aire (v):</span>
            <span className="font-mono text-[#a3e635] font-bold">{airVelocity.toFixed(2)} m/s</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={airVelocity}
            onChange={(e) => setAirVelocity(parseFloat(e.target.value))}
            className="w-full accent-[#a3e635] cursor-pointer h-1.5 bg-[#0a0a0c] rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono mt-1">
            <span>0.05 m/s</span>
            <span>0.15 m/s (confort)</span>
            <span>0.50 m/s</span>
          </div>
        </div>
      </div>

      {/* Interactive Fanger PPD vs. PMV Analytical Curve Chart */}
      <FangerPpdPmvChart
        points={points}
        selectedPointId={selectedPointId}
        onSelectPoint={onSelectPoint}
        airVelocity={airVelocity}
        met={met}
        clo={clo}
      />

      {/* Points Thermal Audit Table */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#1a1a1c]/80 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0a0a0c]/90 text-[#cbd5e1] font-semibold border-b border-[rgba(255,255,255,0.1)] uppercase tracking-wider text-[11px] font-mono">
              <th className="py-3 px-4">Punto Psicrométrico</th>
              <th className="py-3 px-3 text-right">Tbs [{units === 'IP' ? '°F' : '°C'}]</th>
              <th className="py-3 px-3 text-right">HR [%]</th>
              <th className="py-3 px-3 text-right">W [g/kg]</th>
              <th className="py-3 px-3 text-center">Índice PMV</th>
              <th className="py-3 px-3 text-center">Sensación (7 Puntos)</th>
              <th className="py-3 px-3 text-center">Insatisfechos PPD</th>
              <th className="py-3 px-3 text-center">Categoría UNE-EN 16798-1</th>
              <th className="py-3 px-3 text-center">Confort ASHRAE 55</th>
              <th className="py-3 px-4 text-center">Estado RITE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-mono tabular-nums text-[#f8fafc]">
            {points.map((pt) => {
              const fanger = calculateFangerPMV(pt.tdb, pt.rh, pt.tdb, airVelocity, met, clo);
              const pmv = fanger.pmv;
              const ppd = fanger.ppd;
              const sensation = getFangerSensation(pmv);
              const isSelected = pt.id === selectedPointId;

              // ASHRAE 55 zone evaluation (approximate boundaries)
              const ashraeOk =
                season === 'summer'
                  ? pt.tdb >= 22.5 && pt.tdb <= 27.5 && pt.rh >= 25 && pt.rh <= 80 && pt.w <= 0.012
                  : pt.tdb >= 19.5 && pt.tdb <= 24.5 && pt.rh >= 20 && pt.rh <= 80 && pt.w <= 0.012;

              // European categories styling
              const catBadge =
                fanger.category === 'Cat I'
                  ? { label: 'Cat. I (Alta)', bg: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30' }
                  : fanger.category === 'Cat II'
                  ? { label: 'Cat. II (Normal/RITE)', bg: 'bg-[#65a30d]/20 text-[#a3e635] border-[#65a30d]/40' }
                  : fanger.category === 'Cat III'
                  ? { label: 'Cat. III (Moderada)', bg: 'bg-[#3b82f6]/20 text-[#93c5fd] border-[#3b82f6]/40' }
                  : { label: 'Fuera de rango', bg: 'bg-[#ef4444]/20 text-[#fca5a5] border-[#ef4444]/40' };

              return (
                <tr
                  key={pt.id}
                  onClick={() => onSelectPoint(pt.id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected ? 'bg-[rgba(56,189,248,0.12)] ring-1 ring-[#38bdf8]/40' : 'hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  <td className="py-3 px-4 font-primary font-semibold text-white flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: pt.color }}
                    />
                    <span>{pt.name}</span>
                  </td>

                  <td className="py-3 px-3 text-right text-[#93c5fd] font-semibold">
                    {units === 'IP' ? UnitConvert.cToF(pt.tdb).toFixed(1) : pt.tdb.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#a3e635] font-semibold">
                    {pt.rh.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right text-[#fbbf24]">
                    {(pt.w * 1000).toFixed(2)}
                  </td>

                  {/* PMV readout */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        Math.abs(pmv) < 0.2
                          ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                          : Math.abs(pmv) < 0.5
                          ? 'bg-[#65a30d]/25 text-[#a3e635]'
                          : Math.abs(pmv) < 0.7
                          ? 'bg-[#3b82f6]/25 text-[#93c5fd]'
                          : pmv < 0
                          ? 'bg-[#60a5fa]/25 text-[#93c5fd]'
                          : 'bg-[#ef4444]/25 text-[#fca5a5]'
                      }`}
                    >
                      {pmv > 0 ? `+${pmv.toFixed(2)}` : pmv.toFixed(2)}
                    </span>
                  </td>

                  {/* Fanger 7-point Sensation Badge */}
                  <td className="py-3 px-3 text-center font-primary">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${sensation.badgeBg}`}>
                      {sensation.label}
                    </span>
                  </td>

                  {/* PPD readout */}
                  <td className="py-3 px-3 text-center text-[#cbd5e1] font-semibold">
                    {ppd.toFixed(1)} %
                  </td>

                  {/* UNE-EN 16798-1 Category */}
                  <td className="py-3 px-3 text-center font-primary">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold border ${catBadge.bg}`}
                    >
                      {catBadge.label}
                    </span>
                  </td>

                  {/* ASHRAE 55 */}
                  <td className="py-3 px-3 text-center font-primary">
                    {ashraeOk ? (
                      <span className="inline-flex items-center gap-1 text-[#a3e635] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Conforme</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#94a3b8]">
                        <span>No cumple</span>
                      </span>
                    )}
                  </td>

                  {/* RITE Compliance */}
                  <td className="py-3 px-4 text-center font-primary">
                    {fanger.category === 'Cat I' || fanger.category === 'Cat II' ? (
                      <span className="text-[#a3e635] font-semibold">Apto RITE</span>
                    ) : (
                      <span className="text-[#fbbf24] font-medium">Revisar T/HR</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Categories Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-[8px] bg-[#1a1a1c]/90 border border-[rgba(255,255,255,0.1)] space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#fbbf24] uppercase tracking-wider font-primary">
              Categoría I (UNE-EN 16798-1)
            </span>
            <span className="font-mono text-[#fbbf24] text-xs font-bold">PPD &lt; 6%</span>
          </div>
          <p className="text-xs text-[#cbd5e1] leading-relaxed font-secondary">
            Alto nivel de exigencia térmica (índice <strong>|PMV| &lt; 0.2</strong>). Recomendado para espacios con ocupantes con requerimientos especiales (hospitales, guarderías, personas de edad avanzada o personas con discapacidad).
          </p>
        </div>

        <div className="p-4 rounded-[8px] bg-[#1a1a1c]/90 border border-[rgba(255,255,255,0.1)] space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#a3e635] uppercase tracking-wider font-primary">
              Categoría II (Estándar RITE)
            </span>
            <span className="font-mono text-[#a3e635] text-xs font-bold">PPD &lt; 10%</span>
          </div>
          <p className="text-xs text-[#cbd5e1] leading-relaxed font-secondary">
            Nivel normal de expectativa (<strong>|PMV| &lt; 0.5</strong>). Debe ser utilizado como estándar de diseño básico para todos los edificios nuevos y proyectos de reformas integrales (oficinas, comercios, viviendas).
          </p>
        </div>

        <div className="p-4 rounded-[8px] bg-[#1a1a1c]/90 border border-[rgba(255,255,255,0.1)] space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#93c5fd] uppercase tracking-wider font-primary">
              Categoría III (Moderada)
            </span>
            <span className="font-mono text-[#93c5fd] text-xs font-bold">PPD &lt; 15%</span>
          </div>
          <p className="text-xs text-[#cbd5e1] leading-relaxed font-secondary">
            Nivel moderado admisible (<strong>|PMV| &lt; 0.7</strong>). Aplicable principalmente a edificios existentes donde las instalaciones actuales limitan la consecución de tolerancias más estrictas.
          </p>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
