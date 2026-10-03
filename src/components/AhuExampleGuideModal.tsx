import React, { useState } from 'react';
import {
  X,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Wind,
  Layers,
  ShieldCheck,
  Thermometer,
  Gauge,
  ArrowRight,
  Maximize2,
  Sliders,
} from 'lucide-react';
import utaEjemploImg from '../assets/uta_ejemplo.png';
import { AHUModuleType } from '../types/psychrometrics';

interface AhuExampleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadStandardSetup?: () => void;
  onSelectComponent?: (type: AHUModuleType) => void;
}

interface ComponentExplorationItem {
  id: string;
  name: string;
  category: string;
  badge: string;
  color: string;
  moduleType: AHUModuleType;
  description: string;
  functions: string[];
  normative: string;
}

const UTA_KEY_COMPONENTS: ComponentExplorationItem[] = [
  {
    id: 'comp-intake',
    name: '1. Toma de Aire Exterior y Compuertas (ODA/RCA)',
    category: 'Admisión y Mezcla',
    badge: 'Compuertas',
    color: '#10B981',
    moduleType: 'intake_damper',
    description:
      'Sección frontal de admisión donde ingresa el aire exterior de ventilación (ODA). Mediante compuertas motorizadas de lamas aerodinámicas opuestas, se regula el caudal preciso según ocupación (sondas de CO₂) y se realiza el free-cooling térmico y entálpico.',
    functions: [
      'Regulación de caudal exterior mínimo según RITE IT 1.1.4.2 (Categorías IDA 1-4)',
      'Free-cooling directo para ahorro energético en estaciones intermedias',
      'Cierre hermético motorizado clase 2/3 (EN 1751) en paradas de la unidad',
    ],
    normative: 'RITE IT 1.2.4.5.1 / UNE-EN 1751 / UNE-EN 13779',
  },
  {
    id: 'comp-prefilter',
    name: '2. Sección de Prefiltrado (G4 / ePM10)',
    category: 'Filtración Gruesa',
    badge: 'Protección',
    color: '#EF4444',
    moduleType: 'prefilter',
    description:
      'Primera barrera de filtración mediante filtros de panel plegado o mantas sintéticas de eficacia gruesa. Su función primordial es retener polen, polvo e impurezas para evitar el ensuciamiento de baterías y prolongar la vida de los filtros finos.',
    functions: [
      'Retención de partículas gruesas (> 10 μm) con baja pérdida de carga inicial',
      'Protección contra colmatación de baterías térmicas y recuperadores',
      'Control de colmatación mediante presostato diferencial (Δp)',
    ],
    normative: 'UNE-EN ISO 16890 (ePM10 / Coarse) / RITE IT 1.1.4.2.4',
  },
  {
    id: 'comp-recovery',
    name: '3. Recuperador de Calor Aire-Aire',
    category: 'Eficiencia Energética',
    badge: 'RITE Obligatorio',
    color: '#0EA5E9',
    moduleType: 'heat_recovery',
    description:
      'Dispositivo estático de placas a contracorriente cruzado o rueda entálpica rotativa que transfiere energía térmica entre el aire viciado de extracción (ETA) y el aire nuevo exterior (ODA) sin contaminación cruzada.',
    functions: [
      'Rendimiento térmico en seco estandarizado ηt ≥ 73% exigido por normativa',
      'Compuerta de By-Pass integrada para protección antihelada y free-cooling',
      'Recuperación sensible y latente en ruedas con matriz higroscópica',
    ],
    normative: 'RITE IT 1.2.4.5.2 / Reglamento ErP Eco-diseño 1253/2014',
  },
  {
    id: 'comp-cooling',
    name: '4. Batería Fría y Deshumectación (Batería −)',
    category: 'Tratamiento Térmico',
    badge: 'Enfriamiento',
    color: '#0284C7',
    moduleType: 'cooling_coil',
    description:
      'Serpentín de tubos de cobre con aletas continuas de aluminio alimentado con agua enfriada (7/12 °C) o refrigerante de expansión directa (DX). Enfría el aire sensiblemente y condensa humedad cuando la superficie está por debajo del punto de rocío.',
    functions: [
      'Enfriamiento sensible y deshumectación del caudal de ventilación',
      'Bandeja de condensados en acero inoxidable inclinada con sifón de purga',
      'Separador de gotas alveolar para evitar arrastre de aerosoles a los conductos',
    ],
    normative: 'RITE IT 1.2.4.2.1 / Guía Técnica IDAE Fig. 1-2 (Pág. 16)',
  },
  {
    id: 'comp-heating',
    name: '5. Batería de Calor (Batería +)',
    category: 'Tratamiento Térmico',
    badge: 'Calefacción',
    color: '#DC2626',
    moduleType: 'heating_coil',
    description:
      'Intercambiador térmico alimentado por agua caliente (45/40 °C en bombas de calor o 80/60 °C en calderas) o resistencias eléctricas blindadas. Atempera el aire en invierno o recalienta tras la deshumectación en verano.',
    functions: [
      'Calentamiento sensible a humedad específica constante (w = cte)',
      'Termostato capilar de protección antihelada (frost-stat) de rearme manual',
      'Control modulante proporcional mediante válvula de 3 vías [M] o regulador SSR',
    ],
    normative: 'RITE IT 1.2.4.2.2 / Guía Técnica IDAE Pág. 16 & 24',
  },
  {
    id: 'comp-fan',
    name: '6. Ventilador de Impulsión (Plug-Fan EC / Centrífugo)',
    category: 'Impulsión Aerodinámica',
    badge: 'Movimiento de Aire',
    color: '#16A34A',
    moduleType: 'fan',
    description:
      'El corazón de la climatizadora. Rodete centrífugo de álabes curvados hacia atrás de acoplamiento directo y motor electrónico EC (IE4/IE5). Proporciona la presión estática necesaria para vencer filtros, baterías, silenciadores y redes de conductos.',
    functions: [
      'Regulación continua de velocidad 0-10V / Modbus según presión de conducto',
      'Bajo consumo de potencia específica de ventilación (SFP conforme a EN 13779)',
      'Manguito elástico antivibratorio para aislar mecánicamente la red de conductos',
    ],
    normative: 'UNE-EN 13779 (SFP) / ErP Lot 11 / Guía IDAE Pág. 17-18',
  },
  {
    id: 'comp-final-filter',
    name: '7. Filtros Terminales de Alta Eficacia (F7 / F9 / ePM1)',
    category: 'Calidad de Aire Interior',
    badge: 'Alta Eficacia',
    color: '#C026D3',
    moduleType: 'final_filter',
    description:
      'Filtros terminales multibolsillo de microfibra de vidrio colocados después de ventilador o baterías. Garantizan la pureza del aire suministrado a los ocupantes eliminando bacterias, polución fina (PM2.5, PM1) y partículas respirables.',
    functions: [
      'Filtración fina de alta retención para cumplir categoría IDA exigida',
      'Bolsas cónicas extendidas aerodinámicamente en el sentido del flujo',
      'Manómetro diferencial Magnehelic (Δp) para supervisión de colmatación',
    ],
    normative: 'UNE-EN ISO 16890 / RITE IT 1.1.4.2.4 (F7/F9)',
  },
  {
    id: 'comp-silencer',
    name: '8. Atenuador Acústico (Silenciador)',
    category: 'Confort Acústico',
    badge: 'Insonorización',
    color: '#64748B',
    moduleType: 'silencer',
    description:
      'Bafles paralelos de lana mineral biosoluble de alta densidad protegida con velo anti-desprendimiento. Absorbe las ondas sonoras generadas por el ventilador para que los niveles de ruido en los locales cumplan los límites DB-HR y RITE.',
    functions: [
      'Atenuación acústica de 15 a 25 dB en el espectro audible (125 Hz - 4 kHz)',
      'Perfil aerodinámico en ojiva para minimizar pérdidas de carga',
      'Velo de protección hidrófugo y bacteriológicamente inerte',
    ],
    normative: 'CTE DB-HR / RITE IT 1.2.4.1.4 / UNE-EN ISO 7235',
  },
  {
    id: 'comp-plenum',
    name: '9. Sección Plenum de Inspección y Mantenimiento',
    category: 'Mantenimiento y Estabilidad',
    badge: 'Accesibilidad',
    color: '#475569',
    moduleType: 'plenum',
    description:
      'Cámara intermedia diáfana con puerta de registro hermética y doble maneta. Permite el acceso de los operarios para desinfección, sustitución de filtros, limpieza de bandejas y homogenización del perfil de velocidades del aire.',
    functions: [
      'Distribución uniforme del flujo de aire antes de entrar a baterías o filtros',
      'Puerta de acceso con junta de goma doble y mirilla con luz interior estanca',
      'Facilita labores de inspección de higiene según norma UNE 100012',
    ],
    normative: 'RITE IT 1.3.3 / UNE 100012 / UNE-EN 1886',
  },
];

export const AhuExampleGuideModal: React.FC<AhuExampleGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadStandardSetup,
  onSelectComponent,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'infografia' | 'componentes'>('infografia');
  const [selectedCompId, setSelectedCompId] = useState<string>('comp-intake');

  if (!isOpen) return null;

  const activeComp =
    UTA_KEY_COMPONENTS.find((c) => c.id === selectedCompId) || UTA_KEY_COMPONENTS[0];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleZoomReset = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none font-primary">
      <div className="panel-glass w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0a0a0c]/90 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] shadow-md">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Anatomía y Elementos Principales de una Climatizadora (UTA)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                  Infografía Técnica Didáctica
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Guía interactiva de las secciones operativas que componen una unidad de tratamiento de aire
              </p>
            </div>
          </div>

          {/* View Mode Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="tabs-container !p-0.5 mr-2 hidden sm:flex">
              <button
                onClick={() => setActiveTab('infografia')}
                className={`tab-item !py-1 !px-3 !text-xs ${
                  activeTab === 'infografia' ? 'active' : ''
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Infografía General</span>
              </button>
              <button
                onClick={() => setActiveTab('componentes')}
                className={`tab-item !py-1 !px-3 !text-xs ${
                  activeTab === 'componentes' ? 'active' : ''
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Componentes al Detalle</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#070b14]">
          {activeTab === 'infografia' ? (
            /* Tab 1: High Resolution Infographic Image with Zoom & Quick Guide */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Infographic toolbar */}
              <div className="px-4 py-2 bg-[#0c1222] border-b border-white/10 flex items-center justify-between text-xs text-slate-300 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Vista General del Equipo:</span>
                  <span className="text-slate-400 hidden sm:inline">
                    Disposición secuencial de secciones térmicas, mecánicas y filtrantes
                  </span>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-[#121b2d] px-2 py-1 rounded-md border border-white/10">
                  <span className="font-mono text-[11px] text-[#38bdf8] mr-1">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={handleZoomOut}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                    title="Alejar imagen"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                    title="Restablecer tamaño original"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                    title="Acercar imagen"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image Viewport Container */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#050811] relative">
                <div
                  className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={utaEjemploImg}
                    alt="Esquema Didáctico y Componentes Principales de una UTA"
                    className="max-w-full max-h-[48vh] sm:max-h-[52vh] rounded-lg shadow-2xl border border-white/15 object-contain bg-white select-none pointer-events-auto"
                  />
                </div>
              </div>

              {/* Bottom Quick Section Cards Bar */}
              <div className="p-3 bg-[#0a0f1d] border-t border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
                    <span>Secciones Principales representadas en la imagen:</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('componentes')}
                    className="text-xs text-[#38bdf8] hover:text-[#7dd3fc] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Ver ficha técnica detallada</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {UTA_KEY_COMPONENTS.slice(0, 5).map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => {
                        setSelectedCompId(comp.id);
                        setActiveTab('componentes');
                      }}
                      className="text-left p-2 rounded-lg bg-[#11192e] border border-white/10 hover:border-[#38bdf8]/60 hover:bg-[#16223e] transition-all group cursor-pointer"
                    >
                      <div className="text-[10px] font-mono text-[#38bdf8] truncate font-bold mb-0.5">
                        {comp.badge}
                      </div>
                      <div className="text-xs font-semibold text-white group-hover:text-[#38bdf8] truncate transition-colors">
                        {comp.name.split('. ')[1] || comp.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Detailed Explorer of Each Component */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: List of Components */}
              <div className="w-full md:w-80 border-r border-white/10 bg-[#0a0f1d] p-3 flex flex-col space-y-1.5 overflow-y-auto shrink-0 scrollbar-thin">
                <div className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider mb-1 px-1">
                  Índice de Secciones
                </div>
                {UTA_KEY_COMPONENTS.map((item) => {
                  const isSelected = selectedCompId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCompId(item.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1e293b] border-[#38bdf8] shadow-md'
                          : 'bg-[#0f172a]/60 border-transparent hover:border-white/20 hover:bg-[#1e293b]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-[#38bdf8]' : 'text-white'
                          }`}
                        >
                          {item.name}
                        </span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ml-1"
                          style={{
                            backgroundColor: `${item.color}25`,
                            color: item.color,
                            border: `1px solid ${item.color}50`,
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-secondary line-clamp-1">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Detailed Card with Specifications */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-[#070b14] space-y-5 scrollbar-thin">
                {/* Header of Active Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: activeComp.color }}
                      />
                      <span className="text-xs font-mono text-[#38bdf8] uppercase font-bold">
                        {activeComp.category}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                      {activeComp.name}
                    </h2>
                  </div>

                  {onSelectComponent && (
                    <button
                      onClick={() => {
                        onSelectComponent(activeComp.moduleType);
                        onClose();
                      }}
                      className="btn-primary text-xs shrink-0 self-start sm:self-auto"
                    >
                      <span>Añadir a mi UTA</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Description */}
                <div className="bg-[#0f172a] p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                    Principio de Funcionamiento y Misión en la UTA
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed font-secondary">
                    {activeComp.description}
                  </p>
                </div>

                {/* Technical Functions & Normative */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Functions */}
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-white/10 space-y-2.5">
                    <h4 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#38bdf8]" />
                      <span>Funciones Clave</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {activeComp.functions.map((fn, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#38bdf8] font-bold mt-0.5">•</span>
                          <span className="leading-snug">{fn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Normative & Standard */}
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-[#a3e635] uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
                      <span>Marco Normativo Aplicable</span>
                    </h4>
                    <div className="p-2.5 rounded bg-black/40 border border-white/10 text-xs font-mono text-slate-300">
                      {activeComp.normative}
                    </div>
                    <p className="text-[11px] text-slate-400 font-secondary leading-snug">
                      La selección, dimensionamiento y rendimiento de esta sección deben cumplir
                      las exigencias de eficiencia y calidad de aire del Reglamento de Instalaciones
                      Térmicas en los Edificios (RITE).
                    </p>
                  </div>
                </div>

                {/* Embedded Mini Image Preview */}
                <div className="bg-[#0a0f1d] p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 rounded bg-white overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                      <img
                        src={utaEjemploImg}
                        alt="UTA Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        ¿Quieres ver la imagen completa interactiva?
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Vuelve a la pestaña de infografía para explorar todo el corte longitudinal
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('infografia')}
                    className="btn-secondary text-xs !border-[#38bdf8]/40 !text-[#38bdf8]"
                  >
                    <span>Ver Infografía</span>
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0a0a0c] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-300">Esquema Didáctico:</span>
            <span>
              Unidad de Tratamiento de Aire con recuperación de calor, filtración y tratamiento térmico
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onLoadStandardSetup && (
              <button
                onClick={() => {
                  onLoadStandardSetup();
                  onClose();
                }}
                className="btn-secondary text-xs !border-[#fbbf24]/40 !text-[#fbbf24] hover:!border-[#fbbf24]"
                title="Cargar esta configuración de UTA en el lienzo principal"
              >
                <Layers className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Cargar este modelo en el visor</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
