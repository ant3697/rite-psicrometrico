import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StatePoint, ChartType, UnitSystem } from '../types/psychrometrics';
import {
  Search,
  LineChart,
  AirVent,
  FileSpreadsheet,
  Activity,
  Wind,
  GraduationCap,
  Compass,
  Snowflake,
  Shuffle,
  Target,
  Layers,
  ShieldCheck,
  Sparkles,
  Download,
  Sliders,
  MapPin,
  ArrowRight,
  CornerDownLeft,
  X,
  Gauge,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Vistas' | 'Herramientas de Cálculo' | 'Puntos del Proyecto' | 'Ajustes & Sistema';
  description?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  // Navigation
  currentView: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic' | 'teaching';
  onChangeView: (view: 'chart' | 'points' | 'processes' | 'comfort' | 'schematic' | 'teaching') => void;
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  // Tools & Modals
  onOpenCoilModelerModal?: () => void;
  onOpenAirMixingModal?: () => void;
  onOpenShrModal?: () => void;
  onOpenConditionsModal?: () => void;
  onOpenPresetsModal: () => void;
  onOpenIdaeModal?: () => void;
  onOpenAiAssistant: () => void;
  onOpenAtmosphereModal: () => void;
  onOpenExportModal: () => void;
  // Project data
  points: StatePoint[];
  onSelectPoint: (id: string) => void;
  units: UnitSystem;
  onToggleUnits: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onChangeView,
  onChangeChartType,
  onOpenCoilModelerModal,
  onOpenAirMixingModal,
  onOpenShrModal,
  onOpenConditionsModal,
  onOpenPresetsModal,
  onOpenIdaeModal,
  onOpenAiAssistant,
  onOpenAtmosphereModal,
  onOpenExportModal,
  points,
  onSelectPoint,
  units,
  onToggleUnits,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K key listener is handled in App/parent, but Esc listener inside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compile full command registry
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // VISTAS
      {
        id: 'view-chart-carrier',
        title: 'Diagrama Psicrométrico Carrier',
        category: 'Vistas',
        description: 'Ver diagrama ASHRAE / Carrier con curvas de humedad relativa y entalpía',
        icon: <LineChart className="w-4 h-4 text-emerald-400" />,
        badge: 'Carta',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        keywords: ['carrier', 'diagrama', 'carta', 'psicrometrico', 'temperatura', 'humedad'],
        action: () => {
          onChangeView('chart');
          onChangeChartType('carrier');
          onClose();
        },
      },
      {
        id: 'view-chart-mollier',
        title: 'Diagrama Mollier h-x',
        category: 'Vistas',
        description: 'Diagrama entálpico alemán con eje oblicuo (DIN 4108 / VDI 2071)',
        icon: <Compass className="w-4 h-4 text-indigo-400" />,
        badge: 'Mollier',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        keywords: ['mollier', 'hx', 'h-x', 'entalpico', 'din', 'vdi'],
        action: () => {
          onChangeView('chart');
          onChangeChartType('mollier');
          onClose();
        },
      },
      {
        id: 'view-schematic',
        title: 'Esquema Físico & UTA',
        category: 'Vistas',
        description: 'Distribución física del climatizador (baterías, ventiladores, recuperador)',
        icon: <AirVent className="w-4 h-4 text-sky-400" />,
        badge: 'UTA',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        keywords: ['uta', 'esquema', 'climatizador', 'ahu', 'bateria', 'ventilador', 'filtros'],
        action: () => {
          onChangeView('schematic');
          onClose();
        },
      },
      {
        id: 'view-points',
        title: 'Tabla de Puntos de Estado',
        category: 'Vistas',
        description: 'Listado tabular completo con propiedades termodinámicas calculadas',
        icon: <FileSpreadsheet className="w-4 h-4 text-amber-400" />,
        badge: 'Puntos',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        keywords: ['puntos', 'tabla', 'valores', 'tdb', 'hr', 'entalpia', 'volumen'],
        action: () => {
          onChangeView('points');
          onClose();
        },
      },
      {
        id: 'view-processes',
        title: 'Procesos Psicrométricos & Balances',
        category: 'Vistas',
        description: 'Matriz de transformaciones: potencias sensibles, latentes y caudales',
        icon: <Activity className="w-4 h-4 text-purple-400" />,
        badge: 'Procesos',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        keywords: ['procesos', 'balances', 'potencia', 'sensible', 'latente', 'kw', 'caudal'],
        action: () => {
          onChangeView('processes');
          onClose();
        },
      },
      {
        id: 'view-comfort',
        title: 'Confort Bioclimático & Calidad Aire (IAQ)',
        category: 'Vistas',
        description: 'Zonas Givoni, ASHRAE 55, ventilación exterior y dilución de CO2',
        icon: <Wind className="w-4 h-4 text-lime-400" />,
        badge: 'IAQ',
        badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
        keywords: ['confort', 'iaq', 'givoni', 'ashrae 55', 'co2', 'ventilacion', 'calidad aire'],
        action: () => {
          onChangeView('comfort');
          onClose();
        },
      },
      {
        id: 'view-teaching',
        title: 'Aula Docente & Pizarra Interactiva',
        category: 'Vistas',
        description: 'Modo pedagógico interactivo para docencia paso a paso',
        icon: <GraduationCap className="w-4 h-4 text-yellow-400" />,
        badge: 'Didáctico',
        badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        keywords: ['aula', 'docente', 'pizarra', 'clase', 'explicacion', 'pedagogico', 'paso a paso'],
        action: () => {
          onChangeView('teaching');
          onClose();
        },
      },

      // HERRAMIENTAS DE CÁLCULO
      {
        id: 'tool-coil',
        title: 'Simulador de Batería Fría (ADP & Escarcha)',
        category: 'Herramientas de Cálculo',
        description: 'Cálculo de Punto de Rocío del Aparato (ADP), factor de bypass, agua condensada y congelación',
        icon: <Snowflake className="w-4 h-4 text-cyan-400" />,
        badge: 'OTS C',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        keywords: ['bateria', 'adp', 'escarcha', 'serpentin', 'enfriamiento', 'deshumectacion', 'bypass', 'condensado'],
        action: () => {
          onClose();
          onOpenCoilModelerModal?.();
        },
      },
      {
        id: 'tool-mixing',
        title: 'Calculadora de Mezcla de Aire (2 Corrientes)',
        category: 'Herramientas de Cálculo',
        description: 'Balance másico-entálpico, porcentaje de aire exterior, economizador y detección de niebla',
        icon: <Shuffle className="w-4 h-4 text-amber-400" />,
        badge: 'OTS D',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        keywords: ['mezcla', 'camara', 'reparto', 'caudal', 'exterior', 'retorno', 'economizador', 'niebla'],
        action: () => {
          onClose();
          onOpenAirMixingModal?.();
        },
      },
      {
        id: 'tool-shr',
        title: 'Líneas de Proceso SHR & Cargas del Local',
        category: 'Herramientas de Cálculo',
        description: 'Factor de Calor Sensible (RSHR / GSHR), dimensionado de caudal y punto de impulsión',
        icon: <Target className="w-4 h-4 text-purple-400" />,
        badge: 'OTS E',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        keywords: ['shr', 'cargas', 'sensible', 'rshr', 'gshr', 'local', 'dimensionado', 'impulsion'],
        action: () => {
          onClose();
          onOpenShrModal?.();
        },
      },
      {
        id: 'tool-conditions',
        title: 'Gestor de Escenarios & Condiciones Operativas',
        category: 'Herramientas de Cálculo',
        description: 'Comparativa de día de diseño, carga parcial y régimen de invierno con superposición de colores',
        icon: <Layers className="w-4 h-4 text-amber-400" />,
        badge: 'OTS A',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        keywords: ['escenarios', 'condiciones', 'verano', 'invierno', 'parcial', 'comparativa'],
        action: () => {
          onClose();
          onOpenConditionsModal?.();
        },
      },
      {
        id: 'tool-presets',
        title: 'Biblioteca de Ciclos HVAC Predefinidos',
        category: 'Herramientas de Cálculo',
        description: 'Cargar esquemas completos: UTA todo aire exterior, climatización verano/invierno, desecante',
        icon: <Sliders className="w-4 h-4 text-yellow-400" />,
        badge: 'Presets',
        badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        keywords: ['ciclos', 'presets', 'predefinidos', 'ejemplos', 'plantillas', 'aire acondicionado'],
        action: () => {
          onClose();
          onOpenPresetsModal();
        },
      },
      {
        id: 'tool-idae',
        title: 'Auditoría Normativa IDAE / RITE',
        category: 'Herramientas de Cálculo',
        description: 'Verificación de conformidad según la Guía Técnica de Equipos Autónomos ATECYR / IDAE',
        icon: <ShieldCheck className="w-4 h-4 text-lime-400" />,
        badge: 'Normativa',
        badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
        keywords: ['idae', 'rite', 'atecyr', 'normativa', 'auditoria', 'cop', 'eficiencia'],
        action: () => {
          onClose();
          onOpenIdaeModal?.();
        },
      },
      {
        id: 'tool-ai',
        title: 'Diagnóstico Termodinámico Asistido por IA',
        category: 'Herramientas de Cálculo',
        description: 'Análisis inteligente del ciclo, detección de ineficiencias y recomendaciones térmicas',
        icon: <Sparkles className="w-4 h-4 text-blue-400" />,
        badge: 'IA',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        keywords: ['ia', 'diagnostico', 'asistente', 'inteligencia', 'optimizacion'],
        action: () => {
          onClose();
          onOpenAiAssistant();
        },
      },

      // AJUSTES & SISTEMA
      {
        id: 'sys-atmosphere',
        title: 'Ajustar Altitud y Presión Atmosférica',
        category: 'Ajustes & Sistema',
        description: 'Calibración barométrica (m s.n.m. o kPa) según modelo barométrico estándar',
        icon: <Gauge className="w-4 h-4 text-teal-400" />,
        badge: 'Barométrica',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        keywords: ['altitud', 'presion', 'barometrica', 'kpa', 'metros', 'atmosfera'],
        action: () => {
          onClose();
          onOpenAtmosphereModal();
        },
      },
      {
        id: 'sys-units',
        title: `Alternar Unidades de Medida (Actual: ${units})`,
        category: 'Ajustes & Sistema',
        description: units === 'SI' ? 'Cambiar a Sistema Anglosajón / Imperial (°F, BTU/lb, CFM)' : 'Cambiar a Sistema Internacional (°C, kJ/kg, m³/h)',
        icon: <Sliders className="w-4 h-4 text-slate-300" />,
        badge: units,
        badgeColor: 'bg-slate-700 text-slate-200 border-slate-600',
        keywords: ['unidades', 'si', 'ip', 'celsius', 'fahrenheit', 'imperial', 'sistema'],
        action: () => {
          onToggleUnits();
          onClose();
        },
      },
      {
        id: 'sys-export',
        title: 'Exportar Diagrama, Informe o CSV',
        category: 'Ajustes & Sistema',
        description: 'Descargar imagen vectorial SVG, PNG alta resolución o exportar tabla de puntos a Excel/CSV',
        icon: <Download className="w-4 h-4 text-amber-400" />,
        badge: 'Descarga',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        keywords: ['exportar', 'descargar', 'pdf', 'png', 'svg', 'csv', 'excel', 'informe'],
        action: () => {
          onClose();
          onOpenExportModal();
        },
      },
    ];

    // Add state points dynamically
    points.forEach((pt) => {
      list.push({
        id: `point-${pt.id}`,
        title: `Punto: ${pt.name}`,
        category: 'Puntos del Proyecto',
        description: `Tdb = ${pt.tdb.toFixed(1)}°C, HR = ${(pt.rh * 100).toFixed(0)}%, w = ${(pt.w * 1000).toFixed(1)} g/kg`,
        icon: (
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
            style={{ backgroundColor: pt.color }}
          />
        ),
        badge: `${pt.tdb.toFixed(1)}°C`,
        badgeColor: 'bg-slate-800 text-slate-200 border-slate-700',
        keywords: [pt.name.toLowerCase(), 'punto', `${pt.tdb}`, `${Math.round(pt.rh * 100)}`],
        action: () => {
          onSelectPoint(pt.id);
          onChangeView('chart');
          onClose();
        },
      });
    });

    return list;
  }, [
    onChangeView,
    onChangeChartType,
    onOpenCoilModelerModal,
    onOpenAirMixingModal,
    onOpenShrModal,
    onOpenConditionsModal,
    onOpenPresetsModal,
    onOpenIdaeModal,
    onOpenAiAssistant,
    onOpenAtmosphereModal,
    onOpenExportModal,
    points,
    onSelectPoint,
    units,
    onToggleUnits,
    onClose,
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const cleanQuery = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(cleanQuery);
      const matchDesc = cmd.description?.toLowerCase().includes(cleanQuery) || false;
      const matchKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(cleanQuery)) || false;
      const matchCategory = cmd.category.toLowerCase().includes(cleanQuery);
      return matchTitle || matchDesc || matchKeywords || matchCategory;
    });
  }, [commands, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121316] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-slate-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#16171b]">
          <Search className="w-5 h-5 text-[#fbbf24] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cualquier vista, cálculo, punto o ajuste... (o escribe 'batería', 'mollier', 'puntos')"
            className="flex-1 bg-transparent border-none text-white text-sm sm:text-base outline-none placeholder:text-slate-500"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/10">
              <span>ESC para salir</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">No se encontraron resultados para "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Prueba con palabras como "UTA", "Mezcla", "Carrier", "Confort" o el nombre de un punto.</p>
            </div>
          ) : (
            // Group results or render
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#fbbf24]/15 border border-[#fbbf24]/40 text-white shadow-sm'
                      : 'hover:bg-white/5 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-[#fbbf24]' : 'text-slate-100'}`}>
                          {cmd.title}
                        </span>
                        {cmd.badge && (
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                              cmd.badgeColor || 'bg-white/10 text-slate-300 border-white/10'
                            }`}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-slate-500">
                    <span className="text-[11px] font-mono hidden sm:inline mr-2 text-slate-500">
                      {cmd.category}
                    </span>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#fbbf24] bg-[#fbbf24]/20 px-2 py-0.5 rounded border border-[#fbbf24]/40">
                        <span>Intro</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-2.5 bg-[#0e0f12] border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px]">↵</kbd>
              <span>Ejecutar</span>
            </span>
          </div>
          <span className="text-slate-500 font-mono">
            {filteredCommands.length} {filteredCommands.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </div>
    </div>
  );
};
