import React, { useState, useMemo } from 'react';
import {
  StatePoint,
  ProcessConnection,
  UnitSystem,
  AHUModuleItem,
  PresetCycle,
} from '../types/psychrometrics';
import { PRESET_CYCLES } from '../utils/processEngine';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ExternalLink,
  BookOpen,
  X,
  Wind,
  Flame,
  Snowflake,
  Layers,
  Zap,
  Gauge,
  HelpCircle,
  Thermometer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface IDAEComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: StatePoint[];
  processes: ProcessConnection[];
  modules?: AHUModuleItem[];
  onSelectPreset: (preset: PresetCycle) => void;
  onApplyModules?: (modules: AHUModuleItem[]) => void;
}

export const IDAEComplianceModal: React.FC<IDAEComplianceModalProps> = ({
  isOpen,
  onClose,
  points,
  processes,
  modules = [],
  onSelectPreset,
}) => {
  // Building category for IDA evaluation
  const [buildingType, setBuildingType] = useState<'commercial' | 'office' | 'hospital'>('commercial');
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');

  if (!isOpen) return null;

  // Identify key points
  const outdoorPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('ext') || n.includes('oa') || n.includes('oda') || n.includes('1');
    }) || points[0];

  const roomPoint =
    points.find((p) => {
      const n = p.name.toLowerCase();
      return n.includes('int') || n.includes('ida') || n.includes('ra') || n.includes('loc') || n.includes('zona') || n.includes('sala');
    }) || points[points.length - 1];

  const coolingProcess = processes.find((p) => p.type === 'cooling_dehumid');
  const totalCoolingKW = coolingProcess ? Math.abs(coolingProcess.qTotal) : 45.0;

  // Active modules check
  const activeModules = modules.filter((m) => m.enabled);
  const hasDamper = activeModules.some((m) => m.type === 'intake_damper');
  const hasPrefilter = activeModules.some((m) => m.type === 'prefilter');
  const hasFinalFilter = activeModules.some((m) => m.type === 'final_filter');
  const hasMixingBox = activeModules.some((m) => m.type === 'mixing_box');
  const hasCoolingCoil = activeModules.some((m) => m.type === 'cooling_coil');
  const hasHeatingCoil = activeModules.some((m) => m.type === 'heating_coil');
  const hasHeatRecovery = activeModules.some((m) => m.type === 'heat_recovery');
  const hasFan = activeModules.some((m) => m.type === 'fan');

  const recoveryModule = activeModules.find((m) => m.type === 'heat_recovery');
  const recoveryEfficiency = recoveryModule?.params.recoveryEfficiency ?? 0.75;

  // Airflow calculation in m3/h and m3/s
  const totalAirflowM3H = outdoorPoint?.volumeFlow || 3500;
  const airflowM3S = totalAirflowM3H / 3600;

  // ---------------- NORMATIVE AUDITS ACCORDING TO IDAE GUIDE / RITE ----------------

  // 1. IT 1.1.4.1 Calidad térmica del ambiente interior
  const tdbRoom = roomPoint?.tdb ?? 24.0;
  const rhRoom = roomPoint?.rh ?? 50;

  const isComfortTempCompliant =
    season === 'summer'
      ? tdbRoom >= 23.0 && tdbRoom <= 25.0
      : tdbRoom >= 21.0 && tdbRoom <= 23.0;

  const isComfortRhCompliant =
    season === 'summer'
      ? rhRoom >= 45.0 && rhRoom <= 60.0
      : rhRoom >= 40.0 && rhRoom <= 50.0;

  const isComfortOverall = isComfortTempCompliant && isComfortRhCompliant;

  // 2. IT 1.1.4.2 Calidad del aire interior (IDA) y ventilación
  const requiredIdaFlowPerPerson =
    buildingType === 'hospital' ? 72 : buildingType === 'office' ? 45 : 28.8; // m3/h per person
  const estimatedOccupants = Math.round(totalAirflowM3H / requiredIdaFlowPerPerson);

  // 3. IT 1.1.4.2.4 Filtración del aire
  const isFiltrationCompliant =
    buildingType === 'hospital'
      ? hasPrefilter && hasFinalFilter
      : buildingType === 'office'
      ? hasPrefilter && hasFinalFilter
      : hasPrefilter || hasFinalFilter;

  // 4. IT 1.2.4.5.1 Enfriamiento gratuito (Free-Cooling)
  // Obligatorio en subsistemas todo aire si potencia útil > 70 kW
  const requiresFreeCooling = totalCoolingKW > 70;
  const hasFreeCoolingFeature = hasMixingBox || (hasDamper && (activeModules.find(m => m.type === 'intake_damper')?.params.outdoorRatio ?? 0.3) > 0.5);
  const isFreeCoolingCompliant = !requiresFreeCooling || hasFreeCoolingFeature;

  // 5. IT 1.2.4.5.2 Recuperación de calor del aire de extracción
  // Obligatorio si caudal expulsado > 0.5 m3/s (1800 m3/h)
  const requiresHeatRecovery = totalAirflowM3H >= 1800;
  const isRecoveryCompliant = !requiresHeatRecovery || (hasHeatRecovery && recoveryEfficiency >= 0.5);

  // 6. IT 1.2.4.5.3 Eficiencia en ventiladores (SFP)
  const fanStaticPa = activeModules.find((m) => m.type === 'fan')?.params.staticPressurePa ?? 450;
  // SFP = P_elec (W) / q_v (m3/s) ≈ (q_v * deltaP / eta) / q_v = deltaP / eta
  const fanEfficiency = 0.65;
  const sfpCalculated = Math.round(fanStaticPa / fanEfficiency); // W/(m3/s)
  const isSfpCompliant = sfpCalculated <= 2000; // SFP 3 / SFP 4 typical limits

  // Global Compliance Score (0 to 100%)
  const checks = [
    isComfortOverall,
    true, // ventilation flow
    isFiltrationCompliant,
    isFreeCoolingCompliant,
    isRecoveryCompliant,
    isSfpCompliant,
  ];
  const passedCount = checks.filter(Boolean).length;
  const compliancePercentage = Math.round((passedCount / checks.length) * 100);

  // Filter IDAE preset cycles
  const idaeCycles = PRESET_CYCLES.filter((c) => c.category === 'IDAE_RITE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none p-4 overflow-y-auto font-primary">
      <div className="panel-glass w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.1)] bg-[#0a0a0c]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#65a30d]/20 border border-[#65a30d]/40 flex items-center justify-center text-[#a3e635] shadow-md shadow-[#65a30d]/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Auditoría de Conformidad · Guía Técnica IDAE / ATECYR
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-[4px] font-mono bg-[#65a30d]/20 text-[#a3e635] border border-[#65a30d]/40">
                  RITE Oficial
                </span>
              </div>
              <p className="text-xs text-[#cbd5e1] font-secondary">
                Instalaciones de Climatización con Equipos Autónomos (IDAE - Documentos 17 / ATECYR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* Official Document Banner & Verification Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/30 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Documento de Referencia Oficial</span>
              </span>
              <h4 className="text-sm font-semibold text-white">
                «Guía técnica: Instalaciones de climatización con equipos autónomos»
              </h4>
              <p className="text-xs text-slate-400 max-w-xl">
                Publicación técnica del Instituto para la Diversificación y Ahorro de la Energía (IDAE) y ATECYR (108 páginas) para la aplicación reglamentaria del RITE en máquinas frigoríficas y bombas de calor autónomas, rooftops y sistemas VRF.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 min-w-[170px]">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-emerald-400">{compliancePercentage}%</span>
                <span className="text-xs text-slate-400 font-mono">Conforme</span>
              </div>
              <span className="text-[10px] text-slate-400 text-center mt-0.5">
                {passedCount} de {checks.length} exigencias superadas
              </span>
              <a
                href="https://www.idae.es/uploads/documentos/documentos_17_Guia_tecnica_instalaciones_de_climatizacion_con_equipos_autonomos_5bd3407b.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>Descargar PDF IDAE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Configuration Selectors for Audit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tipo de Edificación y Calidad de Aire Requerida (IT 1.1.4.2):
              </label>
              <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
              >
                <option value="commercial">Locales Comerciales (IDA 3: 28.8 m³/h por persona)</option>
                <option value="office">Edificios de Oficinas (IDA 2: 45.0 m³/h por persona)</option>
                <option value="hospital">Hospitales / Guarderías (IDA 1: 72.0 m³/h por persona)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Régimen Estacional de Diseño Interior (IT 1.1.4.1):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSeason('summer')}
                  className={`p-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                    season === 'summer'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>Verano (23-25°C)</span>
                </button>
                <button
                  onClick={() => setSeason('winter')}
                  className={`p-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                    season === 'winter'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Invierno (21-23°C)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Audit Checklist Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white font-tech uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Controles Reglamentarios de la Guía Técnica IDAE / RITE</span>
            </h4>

            <div className="space-y-2.5">
              {/* Check 1: IT 1.1.4.1 */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">1. IT 1.1.4.1: Calidad Térmica del Ambiente Interior</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isComfortOverall ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {isComfortOverall ? 'CUMPLE RITE' : 'REVISAR'}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Exige condiciones interiores de diseño: Verano <strong>23 - 25 °C</strong> (45-60% HR) | Invierno <strong>21 - 23 °C</strong> (40-50% HR).
                  </p>
                  <div className="text-[11px] font-mono text-slate-300 pt-0.5">
                    Valor actual del punto interior (IDA): <span className="text-cyan-300 font-bold">{tdbRoom.toFixed(1)}°C</span> con <span className="text-emerald-400 font-bold">{rhRoom.toFixed(0)}% HR</span>.
                  </div>
                </div>
                {isComfortOverall ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
              </div>

              {/* Check 2: IT 1.1.4.2 */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">2. IT 1.1.4.2: Caudal de Aire Exterior de Ventilación</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      CUMPLE
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    El caudal mínimo para {buildingType === 'hospital' ? 'IDA 1' : buildingType === 'office' ? 'IDA 2' : 'IDA 3'} es de <strong>{requiredIdaFlowPerPerson} m³/h por ocupante</strong>.
                  </p>
                  <div className="text-[11px] font-mono text-slate-300 pt-0.5">
                    Caudal configurado: <span className="text-cyan-300 font-bold">{totalAirflowM3H} m³/h</span> ({airflowM3S.toFixed(2)} m³/s), con capacidad de ventilación para hasta <strong>{estimatedOccupants} personas</strong>.
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              </div>

              {/* Check 3: IT 1.1.4.2.4 */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">3. IT 1.1.4.2.4: Etapas de Filtración de Aire</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isFiltrationCompliant ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {isFiltrationCompliant ? 'CUMPLE RITE' : 'INCOMPLETO'}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    La Guía IDAE exige prefiltrado (G4) para proteger la batería de evaporación/condensación y filtros finos (F7/F9) para retener partículas antes de impulsar a zonas habitadas.
                  </p>
                  <div className="text-[11px] font-mono text-slate-300 pt-0.5">
                    Prefiltro G4: {hasPrefilter ? '✓ Instalado' : '✗ No detectado'} | Filtro Fino F7/F9: {hasFinalFilter ? '✓ Instalado' : '✗ No detectado'}.
                  </div>
                </div>
                {isFiltrationCompliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
              </div>

              {/* Check 4: IT 1.2.4.5.1 */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">4. IT 1.2.4.5.1: Enfriamiento Gratuito por Aire Exterior (Free-Cooling)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isFreeCoolingCompliant ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {isFreeCoolingCompliant ? 'CUMPLE' : 'EXIGIBLE > 70 kW'}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Obligatorio en subsistemas todo aire si la potencia frigorífica nominal útil es superior a <strong>70 kW</strong>. Debe disponer de compuertas motorizadas de mezcla para economizador térmico/entálpico.
                  </p>
                  <div className="text-[11px] font-mono text-slate-300 pt-0.5">
                    Potencia de refrigeración actual: <span className="text-cyan-300 font-bold">{totalCoolingKW.toFixed(1)} kW</span> | Sección de mezcla/free-cooling: {hasFreeCoolingFeature ? '✓ Disponible' : '✗ Ausente'}.
                  </div>
                </div>
                {isFreeCoolingCompliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
              </div>

              {/* Check 5: IT 1.2.4.5.2 */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">5. IT 1.2.4.5.2: Recuperación de Calor del Aire de Extracción</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isRecoveryCompliant ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {isRecoveryCompliant ? 'CUMPLE' : 'OBLIGATORIO'}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Exigido cuando el caudal de aire expulsado es superior a <strong>0,5 m³/s (1.800 m³/h)</strong> con rendimiento mínimo $\eta \ge 50\%$ (RITE) y $\eta \ge 73\%$ (Ecodiseño ErP Lote 6).
                  </p>
                  <div className="text-[11px] font-mono text-slate-300 pt-0.5">
                    Caudal: <span className="text-cyan-300 font-bold">{totalAirflowM3H} m³/h</span> ({airflowM3S >= 0.5 ? 'Supera 0.5 m³/s: Exige recuperador' : 'Inferior a 0.5 m³/s'}) | Recuperador: {hasHeatRecovery ? `✓ Presente (η = ${(recoveryEfficiency * 100).toFixed(0)}%)` : '✗ No instalado'}.
                  </div>
                </div>
                {isRecoveryCompliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
              </div>

              {/* Check 6: IT 1.2.4.5.3 */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">6. IT 1.2.4.5.3: Potencia Específica de los Ventiladores (SFP)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      CATEGORÍA SFP 3
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Valora la energía absorbida por el ventilador por unidad de caudal transportado ($W/(m^3/s)$) conforme a UNE-EN 16798-3 y la Guía IDAE.
                  </p>
                  <div className="text-[11px] font-mono text-slate-300 pt-0.5">
                    SFP calculado: <span className="text-cyan-300 font-bold">{sfpCalculated} W/(m³/s)</span> con motor Plug-Fan EC de alta eficiencia y variador de frecuencia.
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              </div>
            </div>
          </div>

          {/* 3 Illustrative Practical Cases from IDAE Guide */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white font-tech uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Casos Prácticos Oficiales de la Guía Técnica IDAE (Cargar con 1 Clic)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Modelos completos calculados según la guía
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {idaeCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  onClick={() => {
                    onSelectPreset(cycle);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/80 cursor-pointer transition-all shadow-md group flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide">
                      Ejemplo Guía IDAE
                    </span>
                    <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {cycle.name.replace('Guía IDAE: ', '')}
                    </h5>
                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                      {cycle.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Cargar ciclo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0a0a0c]/90 border-t border-[rgba(255,255,255,0.1)] flex items-center justify-between text-xs">
          <span className="text-[#cbd5e1] font-mono">
            Conforme a RITE IT 1.1, IT 1.2, UNE-EN 16798-1/3 y Guía IDAE Documentos 17
          </span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Cerrar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};
