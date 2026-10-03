import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  LineChart,
  Scale,
  Cog,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Info,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Zap,
  Droplets,
  Wind
} from 'lucide-react';
import { AHUModuleItem, AHUModuleType } from '../types/psychrometrics';
import { AHU_EDUCATIONAL_DATA, EducationalComponentData } from '../data/ahuEducationalData';

interface AhuEducationalPanelProps {
  modules: AHUModuleItem[];
  selectedModuleId?: string | null;
  onSelectModule: (moduleId: string) => void;
  onClose: () => void;
  isWhiteTheme?: boolean;
}

type TabKey = 'function' | 'psychrometric' | 'normative' | 'components' | 'maintenance';

export const AhuEducationalPanel: React.FC<AhuEducationalPanelProps> = ({
  modules,
  selectedModuleId,
  onSelectModule,
  onClose,
  isWhiteTheme = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('function');
  const [isMinimized, setIsMinimized] = useState(false);
  const [catalogSelection, setCatalogSelection] = useState<AHUModuleType | null>(null);

  // Enabled modules currently in the train
  const enabledModules = useMemo(() => modules.filter((m) => m.enabled), [modules]);

  // Current active module in train
  const currentTrainIndex = useMemo(() => {
    if (!selectedModuleId) return 0;
    const idx = enabledModules.findIndex((m) => m.id === selectedModuleId);
    return idx >= 0 ? idx : 0;
  }, [enabledModules, selectedModuleId]);

  const activeModule = enabledModules[currentTrainIndex] || enabledModules[0];

  // Determine which educational data to display (either from catalog selector or active module)
  const currentEduData: EducationalComponentData = useMemo(() => {
    if (catalogSelection && AHU_EDUCATIONAL_DATA[catalogSelection]) {
      return AHU_EDUCATIONAL_DATA[catalogSelection];
    }
    if (activeModule && AHU_EDUCATIONAL_DATA[activeModule.type]) {
      return AHU_EDUCATIONAL_DATA[activeModule.type];
    }
    return AHU_EDUCATIONAL_DATA.intake_damper;
  }, [catalogSelection, activeModule]);

  // Navigation handlers
  const handlePrev = () => {
    if (currentTrainIndex > 0) {
      const prevMod = enabledModules[currentTrainIndex - 1];
      setCatalogSelection(null);
      onSelectModule(prevMod.id);
    }
  };

  const handleNext = () => {
    if (currentTrainIndex < enabledModules.length - 1) {
      const nextMod = enabledModules[currentTrainIndex + 1];
      setCatalogSelection(null);
      onSelectModule(nextMod.id);
    }
  };

  const handleSelectTrainModule = (modId: string) => {
    setCatalogSelection(null);
    onSelectModule(modId);
  };

  const tabs: Array<{ id: TabKey; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'function', label: '¿Qué función tiene?', icon: <Target className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'psychrometric', label: 'Psicrometría', icon: <LineChart className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'normative', label: 'Exigencias RITE', icon: <Scale className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'components', label: 'Componentes & Accesorios', icon: <Cog className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'maintenance', label: 'Mantenimiento & Higiene', icon: <Wrench className="w-3.5 h-3.5 text-rose-400" />, badge: 'R.D. 487' },
  ];

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xl backdrop-blur-md ${
        isWhiteTheme
          ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-900/20'
          : 'bg-[#060B18]/95 border-amber-500/40 text-slate-100 shadow-amber-500/5'
      }`}
    >
      {/* ----------------- TOP HEADER BAR ----------------- */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950 border-b border-amber-500/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                Guía Educativa RITE-IDAE
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 font-mono border border-amber-400/20">
                18 Componentes UTA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Base de conocimiento técnico, normativo y psicrométrico del tratamiento de aire
            </p>
          </div>
        </div>

        {/* Quick window controls */}
        <div className="flex items-center gap-1">
          {/* Catalog quick dropdown */}
          <select
            value={catalogSelection || activeModule?.type || 'intake_damper'}
            onChange={(e) => setCatalogSelection(e.target.value as AHUModuleType)}
            className="text-[11px] font-mono bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[140px] sm:max-w-[210px] truncate"
            title="Explorar cualquier componente del catálogo RITE"
          >
            {Object.values(AHU_EDUCATIONAL_DATA).map((item) => (
              <option key={item.type} value={item.type}>
                {item.icon} {item.canonicalName}
              </option>
            ))}
          </select>

          {/* Minimize / Maximize toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMinimized ? 'Expandir panel educativo' : 'Minimizar a barra compacta'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Cerrar guía educativa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ----------------- TRAIN STAGE STEPPER NAVIGATOR ----------------- */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 gap-2">
        {/* Prev button */}
        <button
          onClick={handlePrev}
          disabled={currentTrainIndex === 0}
          className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Train Stage Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 scrollbar-none flex-1 justify-center max-w-[85vw]">
          {enabledModules.map((mod, idx) => {
            const isSelected = !catalogSelection && activeModule?.id === mod.id;
            const eduItem = AHU_EDUCATIONAL_DATA[mod.type];
            return (
              <button
                key={mod.id}
                onClick={() => handleSelectTrainModule(mod.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20 scale-[1.03]'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span>{eduItem?.icon || '⚙️'}</span>
                <span>{idx + 1}. {mod.name}</span>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentTrainIndex === enabledModules.length - 1}
          className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ----------------- COMPONENT ACTIVE HERO TITLE ----------------- */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl text-lg font-bold shadow-sm"
            style={{ backgroundColor: `${currentEduData.badgeColor}22`, border: `1.5px solid ${currentEduData.badgeColor}` }}
          >
            {currentEduData.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              {currentEduData.canonicalName}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentEduData.functionPurpose.airStreamLocation}
              </span>
            </h3>
            <p className="text-[11px] text-slate-300 line-clamp-1 max-w-2xl">
              {currentEduData.functionPurpose.summary}
            </p>
          </div>
        </div>

        {/* Educational 5 Tabs */}
        {!isMinimized && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------- EXPANDED CONTENT BODY (SPACE-CONSCIOUS MAX-HEIGHT WITH SMOOTH SCROLL) ----------------- */}
      {!isMinimized && (
        <div className="p-4 max-h-[300px] sm:max-h-[340px] overflow-y-auto text-xs leading-relaxed space-y-3 custom-scrollbar">
          {/* TAB 1: FUNCTION & PURPOSE */}
          {activeTab === 'function' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-[11px] mb-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Propósito y Función Primordial en la UTA
                  </div>
                  <p className="text-slate-300 text-xs">
                    {currentEduData.functionPurpose.primaryRole}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-900/40">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold font-mono text-[11px] mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Riesgo Técnico Crítico / Error Frecuente
                  </div>
                  <p className="text-slate-300 text-xs">
                    {currentEduData.functionPurpose.criticalPitfall}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-amber-300 font-bold font-mono text-[11px] mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Beneficios Clave del Componente
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentEduData.functionPurpose.keyBenefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-300 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-amber-400 font-bold font-mono">0{i + 1}.</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PSYCHROMETRIC BEHAVIOR */}
          {activeTab === 'psychrometric' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-cyan-950/40 to-slate-950 p-3 rounded-xl border border-cyan-500/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-cyan-300 font-bold font-mono text-[11px] flex items-center gap-1.5">
                    <LineChart className="w-3.5 h-3.5 text-cyan-400" />
                    Transformación en el Diagrama Psicrométrico
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 font-bold">
                    {currentEduData.psychrometricBehavior.processType}
                  </span>
                </div>
                <p className="text-slate-300 text-xs mb-2">
                  {currentEduData.psychrometricBehavior.chartPathDescription}
                </p>
                {currentEduData.psychrometricBehavior.formula && (
                  <div className="bg-slate-900 p-2 rounded-lg font-mono text-cyan-300 text-[11px] border border-slate-800 text-center">
                    {currentEduData.psychrometricBehavior.formula}
                  </div>
                )}
              </div>

              {/* Variables Affected Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentEduData.psychrometricBehavior.variablesAffected.map((v, i) => (
                  <div key={i} className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-amber-300 text-xs">{v.symbol}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          v.trend === 'increase'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : v.trend === 'decrease'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : v.trend === 'constant'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {v.trend === 'increase' ? '▲ Aumenta' : v.trend === 'decrease' ? '▼ Disminuye' : v.trend === 'constant' ? '= Constante' : '~ Variable'}
                      </span>
                    </div>
                    <div className="text-[11px] text-white font-medium">{v.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{v.note}</div>
                  </div>
                ))}
              </div>

              {/* Energy exchange info */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[11px]">Balance Energético:</span>
                <span className="font-mono text-cyan-300 font-bold">{currentEduData.psychrometricBehavior.energyExchange}</span>
              </div>
            </div>
          )}

          {/* TAB 3: NORMATIVE & RITE */}
          {activeTab === 'normative' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentEduData.normativeRITE.articles.map((art, i) => (
                  <div key={i} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-emerald-400 font-bold font-mono text-xs">{art.code}</span>
                      <span className="text-[10px] font-mono text-slate-400">{art.title}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{art.requirement}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-[11px] text-slate-400">Normas de Referencia:</span>
                  <div className="flex gap-1">
                    {currentEduData.normativeRITE.standardRefs.map((std, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                        {std}
                      </span>
                    ))}
                  </div>
                </div>

                {currentEduData.normativeRITE.efficiencyThreshold && (
                  <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Exigencia: {currentEduData.normativeRITE.efficiencyThreshold}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PHYSICAL COMPONENTS & ACCESSORIES */}
          {activeTab === 'components' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentEduData.physicalComponents.accessories.map((acc, i) => (
                  <div key={i} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-xs border border-purple-500/30">
                        {acc.symbol}
                      </span>
                      <span className="text-xs font-bold text-white">{acc.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{acc.purpose}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-purple-300 font-mono font-bold text-[11px] block mb-1">Materiales y Calidades Constructivas:</span>
                  <p className="text-slate-300">{currentEduData.physicalComponents.materials}</p>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-purple-300 font-mono font-bold text-[11px] block mb-1">Criterios de Montaje e Integración en la UTA:</span>
                  <p className="text-slate-300">{currentEduData.physicalComponents.assemblyNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MAINTENANCE & HYGIENE (R.D. 487/2022) */}
          {activeTab === 'maintenance' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold font-mono text-[11px] mb-1">
                    <Wrench className="w-3.5 h-3.5 text-rose-400" />
                    Periodicidad de Inspección
                  </div>
                  <p className="text-slate-200 text-xs font-medium">{currentEduData.maintenanceHigiene.inspectionFrequency}</p>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-rose-900/40">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold font-mono text-[11px] mb-1">
                    <Droplets className="w-3.5 h-3.5 text-rose-400" />
                    Protocolo R.D. 487/2022 (Legionella)
                  </div>
                  <p className="text-slate-300 text-xs">{currentEduData.maintenanceHigiene.rd487Action}</p>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-[11px] mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Criterio de Sustitución o Avería
                  </div>
                  <p className="text-slate-300 text-xs">{currentEduData.maintenanceHigiene.replacementCriteria}</p>
                </div>
              </div>

              {/* Checkpoints checklist */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-300 font-bold font-mono text-[11px] mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Puntos Críticos de Verificación en Campo:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentEduData.maintenanceHigiene.keyCheckpoints.map((chk, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-300 text-xs bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{chk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
