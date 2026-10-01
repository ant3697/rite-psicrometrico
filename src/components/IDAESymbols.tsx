import React from 'react';
import { AHUModuleItem, AHUModuleType } from '../types/psychrometrics';

export interface IDAESymbolDefinition {
  type: AHUModuleType;
  officialName: string;
  normativeReference: string;
  guideSection: string;
  description: string;
  keyFeatures: string[];
}

export const IDAE_SYMBOL_DEFINITIONS: IDAESymbolDefinition[] = [
  {
    type: 'intake_damper',
    officialName: 'Compuerta Motorizada de Toma de Aire Exterior (ODA)',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 13779 / RITE IT 1.2.4.5.1',
    guideSection: 'Capítulo 4 & 5: Regulación y Enfriamiento Gratuito (Free-cooling)',
    description:
      'Persiana de intemperie con lamas deflectoras contra lluvia y malla antipájaros, seguida de compuerta de lamas aerodinámicas opuestas accionadas por servomotor proporcional para modulación precisa del caudal de aire exterior (ODA).',
    keyFeatures: [
      'Lamas aerodinámicas con juntas de estanqueidad elastomérica clase 4',
      'Servomotor proporcional (0-10 V) con muelle de retorno de seguridad',
      'Sonda de temperatura y humedad exterior (sonda de entalpía para free-cooling)',
      'Identificación UNE-EN 13779 en color Verde ODA',
    ],
  },
  {
    type: 'prefilter',
    officialName: 'Sección de Filtración Gruesa (Prefiltro G4 / ISO Coarse 65%)',
    normativeReference: 'UNE-EN 779 / UNE-EN ISO 16890 / RITE IT 1.1.4.2.4',
    guideSection: 'Capítulo 3: Calidad de Aire Interior y Protección de Baterías',
    description:
      'Filtro de superficie quebrada en zig-zag continuo (pliegues profundos en V) en marco metálico rígido. Protege las baterías de intercambio térmico y los recuperadores contra colmatación por polvo grueso, polen e insectos.',
    keyFeatures: [
      'Eficacia gravimétrica ISO Coarse ≥ 65% (clase G4 según RITE)',
      'Manómetro diferencial de columna de líquido o reloj Magnehelic (ΔP)',
      'Pérdida de carga inicial reducida (40-60 Pa) y final recomendada (150 Pa)',
      'Sistema de palancas y cierres herméticos de extracción frontal/lateral',
    ],
  },
  {
    type: 'mixing_box',
    officialName: 'Cámara de Mezcla con Compuertas Conjugadas (ODA + RCA)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.2.4.5.1',
    guideSection: 'Capítulo 4: Esquemas de Principio en Equipos Autónomos Tipo Rooftop',
    description:
      'Cámara de mezcla termodinámica que incorpora dos compuertas conjugadas de movimiento opuesto mediante varillaje mecánico o servomotores gemelos sincronizados: compuerta de aire exterior (ODA) y compuerta de retorno/recirculación (RCA).',
    keyFeatures: [
      'Permite free-cooling térmico o entálpico modulando del caudal mínimo al 100% ODA',
      'Ahorro del 25-50% en consumo frigorífico estacional',
      'Deflectores aerodinámicos de mezcla para evitar estratificación térmica antes de batería',
      'Vaina con sensor de temperatura de mezcla resultante (Tm)',
    ],
  },
  {
    type: 'heat_recovery',
    officialName: 'Recuperador de Calor de Placas a Contracorriente / Cruzadas',
    normativeReference: 'UNE-EN 13053 / UNE-EN 308 / RITE IT 1.2.4.5.2',
    guideSection: 'Capítulo 5: Recuperación de Energía del Aire de Extracción',
    description:
      'Intercambiador estático aire-aire de placas delgadas de aluminio con paso de flujos a contracorriente. Obligatorio por RITE para caudales de aire expulsado superiores a 1.800 m³/h, garantizando una eficiencia mínima del 50% al 75%.',
    keyFeatures: [
      'Rendimiento térmico estandarizado ηt ≥ 73% (conforme a RITE / ErP Lot 6)',
      'Compuerta superior motorizada de By-Pass para free-cooling y protección antihelada',
      'Separación total de circuitos sin contaminación cruzada entre ODA y ETA',
      'Bandeja de condensados inclinada en acero inoxidable con sifón en el lado de expulsión',
    ],
  },
  {
    type: 'cooling_coil',
    officialName: 'Batería de Refrigeración y Deshumectación (Expansión Directa DX o Agua Fría)',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 1216 / RITE IT 1.2.4.2.1',
    guideSection: 'Capítulo 3: Baterías de Enfriamiento en Equipos Autónomos',
    description:
      'Batería de tubos de cobre y aletas de aluminio en tresbolillo (4 a 6 filas según la guía IDAE). Enfría el aire por debajo de su punto de rocío provocando condensación higrométrica para control de humedad relativa.',
    keyFeatures: [
      'Válvula de expansión termostática (TXV/EEV) o válvula de 3 vías proporcional con servomotor (M)',
      'Bandeja de condensados con pendiente hacia el desagüe (acero inoxidable AISI 304)',
      'Sifón de drenaje profundo con bola de retención antisucción para evitar entrada de olores',
      'Separador de gotas con lamas en onda sinusoidal para velocidades superiores a 2,5 m/s',
    ],
  },
  {
    type: 'heating_coil',
    officialName: 'Batería de Calefacción (Bomba de Calor Reversible / Agua / Eléctrica)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.2.4.2.2',
    guideSection: 'Capítulo 3: Bombas de Calor Autónomas y Calefacción',
    description:
      'Batería para calentamiento sensible de aire invernal o post-calentamiento de neutralización tras deshumectación. En equipos autónomos corresponde al condensador interior de la bomba de calor reversible con válvula de inversión de 4 vías.',
    keyFeatures: [
      'Tubos aleteados de alta transmisión térmica con colectores de distribución equilibrados',
      'Termostato capilar de protección antihelada (frost stat) de rearme manual',
      'Válvula de control modulante con servomotor proporcional',
      'Potencia calorífica ajustada para vencer la carga de ventilación invernal',
    ],
  },
  {
    type: 'humidifier',
    officialName: 'Sección de Humectación (Lanza de Vapor Seco Isotérmica)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.1.4.1.2',
    guideSection: 'Capítulo 3: Humectación Higrotérmica en Clima Seco',
    description:
      'Lanza distribuidora de vapor seco de acero inoxidable micro-perforada con toberas de inyección de vapor contraflujo. Aumenta la humedad específica del aire sin variar prácticamente su temperatura seca (proceso isotérmico).',
    keyFeatures: [
      'Vapor seco libre de condensados gracias a cámara de recirculación y purga',
      'Válvula modulante de vapor de alta precisión con actuador electrónico',
      'Separador de gotas posterior para evitar goteo en el interior de los conductos',
      'Control por higrostato modulante proporcional o sonda de conducto',
    ],
  },
  {
    type: 'fan',
    officialName: 'Ventilador de Impulsión Plug-Fan EC de Rotor Libre',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 13779 (SFP) / RITE IT 1.2.4.5.3',
    guideSection: 'Capítulo 6: Eficiencia Energética en Ventiladores y Motores EC',
    description:
      'Rodete centrífugo de rotor libre (Plug-Fan) con álabes inclinados hacia atrás acoplado directamente a motor síncrono de imanes permanentes con conmutación electrónica (EC). Proporciona la presión estática para vencer las pérdidas de UTA y conductos.',
    keyFeatures: [
      'Potencia específica del ventilador SFP 2 a SFP 3 (máxima eficiencia UNE-EN 13779)',
      'Tobera cónica de aspiración con tomas de presión venturi (Δp) para lectura de caudal m³/h',
      'Manguito flexible de lona elástica en la descarga para desacoplamiento acústico',
      'Amortiguadores elásticos de muelle antivibratorios en la bancada del motor',
    ],
  },
  {
    type: 'final_filter',
    officialName: 'Sección de Filtración Fina Terminal (Filtro F7 / F9 / ePM1 70%)',
    normativeReference: 'UNE-EN 779 / UNE-EN ISO 16890 / RITE IT 1.1.4.2.4',
    guideSection: 'Capítulo 3: Niveles de Calidad de Aire Exterior (ODA) e Interior (IDA)',
    description:
      'Filtro terminal de bolsas profundas cónicas multibolsillo o diedros minipleat. Obligatorio por RITE para locales de alta exigencia (oficinas IDA 2 con ODA 1/2 requieren F7; hospitales IDA 1 requieren F9 o doble etapa).',
    keyFeatures: [
      'Retención de partículas microscópicas finas respirables PM2.5 y PM1 (polución, hollín)',
      'Bolsas cónicas estiradas uniformemente por la presión de impulsión',
      'Presostato diferencial de aviso de cambio de filtro por colmatación (ΔP)',
      'Sello hermético perimetral de estanqueidad clase B según EN 1886',
    ],
  },
  {
    type: 'silencer',
    officialName: 'Silenciador Acústico de Bafles Fonoabsorbentes',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.1.4.3',
    guideSection: 'Capítulo 7: Confort Acústico y Niveles Sonoros en Conductos',
    description:
      'Bafles rectangulares longitudinales de lana mineral incombustible protegida contra la erosión con velo de fibra de vidrio. Atenúa la presión sonora generada por el rodete del ventilador antes de alcanzar las rejillas del edificio.',
    keyFeatures: [
      'Perfil aerodinámico en bordes de ataque y fuga para minimizar la pérdida de carga (ΔP ≤ 50 Pa)',
      'Atenuación acústica de 15 a 25 dB(A) en las bandas medias y altas (250 - 4000 Hz)',
      'Revestimiento hidrófugo e inerte contra proliferación microbiana',
      'Marco de chapa de acero galvanizado con nervaduras de refuerzo',
    ],
  },
  {
    type: 'adiabatic_cooling',
    officialName: 'Sección de Enfriamiento Adiabático (Toberas de Aspersión / Rampa de Agua)',
    normativeReference: 'RITE IT 1.2.4.5.2 / Guía Técnica IDAE Sección 4.4 (Pág. 79/81)',
    guideSection: 'Sección 2.5 & 4.4: Enfriamiento Adiabático y Recuperación de Energía',
    description:
      'Sistema de enfriamiento evaporativo directo o indirecto con rampa de toberas atomizadoras de microgotas de agua sobre la corriente de aire, reduciendo la temperatura seca a lo largo de la línea de entalpía constante.',
    keyFeatures: [
      'Rampa vertical de pulverización con toberas de acero inoxidable de cono lleno',
      'Separador de gotas alveolar de alta eficiencia para evitar arrastre de agua líquida',
      'Balsa de recogida inferior con bomba de recirculación y vaciado automático higiénico',
      'Reduce notablemente la carga térmica de refrigeración en climas secos estivales',
    ],
  },
  {
    type: 'belt_fan',
    officialName: 'Ventilador Centrífugo con Transmisión por Correas y Poleas',
    normativeReference: 'UNE-EN 12792:2004 / Guía Técnica IDAE Figura 1 (Pág. 16)',
    guideSection: 'Capítulo 2: Configuración de Unidades de Tratamiento de Aire con Transmisión',
    description:
      'Ventilador centrífugo con voluta en espiral y rodete de doble oído, accionado mediante motor eléctrico exterior con poleas de garganta y correas trapezoidales en V ajustables.',
    keyFeatures: [
      'Configuración canónica IDAE Fig. 1 para grandes caudales o presiones medias/altas',
      'Polea motriz de paso variable o fija con tensor dinámico de correas',
      'Voluta aerodinámica con envolvente en chapa galvanizada reforzada',
      'Permite ajuste preciso de revoluciones mediante relación de diámetros de poleas',
    ],
  },
  {
    type: 'plenum',
    officialName: 'Sección Plenum de Inspección, Mezcla y Mantenimiento',
    normativeReference: 'RITE IT 1.3.3 / UNE-EN 1886 / Guía Técnica IDAE Sección 4.3 (Pág. 71/73)',
    guideSection: 'Sección 4.3: Unidades de Tratamiento de Aire con Cámara de Expansión',
    description:
      'Cámara intermedia de paso entre etapas de filtración, ventilador o baterías. Facilita la distribución homogénea de la velocidad del aire, evita turbulencias y permite el registro y sustitución de filtros.',
    keyFeatures: [
      'Puerta de acceso hermética con junta perimetral y cierre con maneta de presión',
      'Mirilla de inspección circular de doble vidrio templado para control visual',
      'Puntos de toma de presión y temperatura para instrumentación de control',
      'Homogeneización del perfil de velocidades antes de la aspiración del ventilador',
    ],
  },
  {
    type: 'electric_heater',
    officialName: 'Batería de Resistencias Eléctricas Blindadas (Apoyo / Atemperamiento)',
    normativeReference: 'RITE IT 1.2.4.2.2 / Guía Técnica IDAE Figura 11 (Pág. 24)',
    guideSection: 'Sección 1.3.2: Tratamiento Térmico del Aire de Ventilación en Invierno',
    description:
      'Batería calefactora modular de resistencias eléctricas blindadas con aletas espiraladas de acero inoxidable para atemperamiento rápido del aire de ventilación exterior en condiciones extremas de invierno.',
    keyFeatures: [
      'Termostato de seguridad de corte automático por sobretemperatura y rearme manual',
      'Etapas de potencia escalonadas con control de modulación por relés de estado sólido (SSR)',
      'Aporte térmico instantáneo sin necesidad de circuito hidráulico de agua caliente',
      'Identificación en rojo térmico con símbolo IDAE [+ Eléctrica]',
    ],
  },
  {
    type: 'rotary_wheel',
    officialName: 'Recuperador Rotativo de Rueda Entálpica (Rotor Higroscópico)',
    normativeReference: 'UNE-EN 308 / UNE-EN 13053 / RITE IT 1.2.4.5.2',
    guideSection: 'Capítulo 5 & Figuras 3-4: Recuperación Entálpica Sensible y Latente',
    description:
      'Rueda celular giratoria de matriz alveolar de aluminio con recubrimiento higroscópico (tamiz molecular o gel de sílice) accionada por motorreductor con correa perimetral. Transfiere tanto calor sensible como humedad (latente) entre los flujos de extracción e impulsión sin mezcla gracias al sector de purga.',
    keyFeatures: [
      'Rendimiento entálpico muy elevado (ηt hasta 80-85% sensible y latente)',
      'Motorreductor de velocidad variable para modulación de la transferencia',
      'Sector de purga autolimpiante para prevenir la recirculación de olores y contaminantes',
      'Juntas perimetrales de estanqueidad de cepillo o laberinto de bajo rozamiento',
    ],
  },
  {
    type: 'return_fan',
    officialName: 'Ventilador de Retorno / Extracción (Plenum o Centrífugo EHA)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.2.4.5.3',
    guideSection: 'Capítulo 2 & Figura 3: Sistema de Doble Ventilador (Impulsión + Retorno)',
    description:
      'Ventilador de extracción que aspira el aire de retorno (ETA) de los locales y vence las pérdidas de los conductos de retorno y del recuperador de calor, descargando el aire viciado (EHA) o derivándolo a la cámara de mezcla (RCA).',
    keyFeatures: [
      'Equilibrio de presiones estáticas del edificio (evita sobrepresiones o depresiones)',
      'Tobera de aspiración con tomas venturi para medida y control de caudal de extracción',
      'Motor de alta eficiencia energética acoplado con variador de frecuencia',
      'Permite régimen nocturno de purga y barrido higiénico (night cooling)',
    ],
  },
  {
    type: 'exhaust_damper',
    officialName: 'Compuerta Motorizada de Expulsión de Aire Viciado (EHA)',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 13779 / RITE IT 1.2.4.5.1',
    guideSection: 'Capítulo 4 & Figura 3: Esquemas de Free-Cooling y Expulsión',
    description:
      'Compuerta motorizada de lamas opuestas instalada en la sección de descarga de aire viciado (EHA) al exterior, coordinada con la compuerta de toma exterior (ODA) y la de mezcla (RCA) para garantizar el balance de caudales en free-cooling.',
    keyFeatures: [
      'Lamas aerodinámicas perfiladas de aluminio con junta elastomérica de estanqueidad',
      'Servomotor modulante con señal proporcional analógica (0-10 V)',
      'Apertura al 100% durante el modo free-cooling total con descarga directa al exterior',
      'Identificación según UNE-EN 13779 en color Marrón EHA',
    ],
  },
  {
    type: 'droplet_eliminator',
    officialName: 'Separador de Gotas Alveolar (Lamas en Onda Sinusoidal)',
    normativeReference: 'UNE-EN 13053 / RITE IT 1.2.4.2.1 / Guía IDAE Pág. 79',
    guideSection: 'Sección 2.5: Prevención de Arrastre de Gotas Líquidas',
    description:
      'Módulo de lamas perfiladas de polipropileno o aluminio con deflectores en zigzag/onda para retener mecánicamente las microgotas de agua condensadas en la batería fría o arrastradas por el enfriamiento adiabático.',
    keyFeatures: [
      'Eficacia de separación de gotas del 99,9% para velocidades de aire de hasta 3,5 m/s',
      'Perfil alveolar autoportante con cámara de decantación hacia la bandeja de condensados',
      'Baja pérdida de carga aerodinámica (ΔP ≤ 25 Pa)',
      'Material inerte resistente a la corrosión y libre de proliferación microbiana',
    ],
  },
];

interface IDAESectionSymbolProps {
  mod: AHUModuleItem;
  modWidth: number;
  isFlowActive: boolean;
  isWhiteTheme?: boolean;
}

export const IDAESectionSymbol: React.FC<IDAESectionSymbolProps> = ({
  mod,
  modWidth,
  isFlowActive,
  isWhiteTheme = false,
}) => {
  const primaryStroke = isWhiteTheme ? '#0F172A' : '#E2E8F0';
  const mutedStroke = isWhiteTheme ? '#64748B' : '#94A3B8';
  const gridLine = isWhiteTheme ? '#CBD5E1' : '#334155';

  switch (mod.type) {
    case 'intake_damper': {
      const ratio = mod.params.outdoorRatio ?? 0.3;
      // Rotation angle from 0 (shut) to 55 deg (wide open)
      const bladeAngle = Math.round(ratio * 55);
      return (
        <g className="idae-symbol-intake-damper">
          {/* Weather rain louvre / Visera exterior de intemperie con rejilla antipájaros */}
          <g transform="translate(6, 15)">
            <path
              d="M 0 0 L 12 -5 L 12 170 L 0 165 Z"
              fill={isWhiteTheme ? '#F1F5F9' : '#0F172A'}
              stroke={primaryStroke}
              strokeWidth="1.5"
            />
            {/* Louvres blades */}
            {[20, 45, 70, 95, 120, 145].map((ly) => (
              <line
                key={`louvre-${ly}`}
                x1="2"
                y1={ly}
                x2="10"
                y2={ly + 8}
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}
            {/* Bird mesh symbol */}
            <line x1="12" y1="0" x2="12" y2="165" stroke="#10B981" strokeWidth="1" strokeDasharray="2,2" />
          </g>

          {/* Damper casing with aerodynamic opposed blades */}
          <g transform="translate(24, 20)">
            {/* Actuator Servomotor M on top */}
            <g transform={`translate(${(modWidth - 45) / 2}, -10)`}>
              <rect
                x="-12"
                y="-14"
                width="24"
                height="14"
                rx="2"
                fill={isWhiteTheme ? '#E2E8F0' : '#1E293B'}
                stroke={primaryStroke}
                strokeWidth="1.5"
              />
              <circle cx="0" cy="-7" r="4.5" fill="#10B981" />
              <text
                x="0"
                y="-4"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="6"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                M
              </text>
              <line x1="0" y1="0" x2="0" y2="15" stroke={primaryStroke} strokeWidth="2" />
            </g>

            {/* Connecting tie-rod linkage bar */}
            <line
              x1={(modWidth - 40) / 2 + 16}
              y1="25"
              x2={(modWidth - 40) / 2 + 16}
              y2="135"
              stroke={mutedStroke}
              strokeWidth="1.5"
              strokeDasharray="3,2"
            />

            {/* 4 Opposed Aerodynamic Blades */}
            {[25, 60, 95, 130].map((dy, idx) => {
              const sign = idx % 2 === 0 ? 1 : -1;
              const angle = sign * bladeAngle;
              const bladeLength = modWidth - 52;
              return (
                <g key={`blade-${dy}`} transform={`translate(${bladeLength / 2}, ${dy})`}>
                  {/* Central pivot bearing */}
                  <circle cx="0" cy="0" r="4" fill={isWhiteTheme ? '#047857' : '#10B981'} />
                  {/* Rotating aerodynamic profile blade */}
                  <line
                    x1={-bladeLength / 2}
                    y1="0"
                    x2={bladeLength / 2}
                    y2="0"
                    stroke={isWhiteTheme ? '#047857' : '#34D399'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    transform={`rotate(${angle})`}
                  />
                  {/* Small mechanical link pin */}
                  <circle cx="16" cy="0" r="2" fill={primaryStroke} />
                </g>
              );
            })}
          </g>

          {/* ODA Technical badge & sensor */}
          <g transform={`translate(${modWidth / 2}, 175)`}>
            <rect
              x="-26"
              y="-10"
              width="52"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#ECFDF5' : '#064E3B'}
              stroke="#10B981"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#065F46' : '#A7F3D0'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              ODA {Math.round(ratio * 100)}%
            </text>
          </g>
        </g>
      );
    }

    case 'prefilter': {
      const pClass = mod.params.filterClass || 'G4';
      return (
        <g className="idae-symbol-prefilter">
          {/* Outer metal filter subframe */}
          <rect
            x="10"
            y="15"
            width={modWidth - 20}
            height="170"
            rx="3"
            fill={isWhiteTheme ? '#FFF1F2' : '#2A0E18'}
            stroke="#F43F5E"
            strokeWidth="1.5"
          />

          {/* UNE-EN 12792 Standard Zig-Zag Pleated Filter Media (Pliegues en V) */}
          <path
            d={`M 18 20
               L ${modWidth - 18} 35 L 18 50
               L ${modWidth - 18} 65 L 18 80
               L ${modWidth - 18} 95 L 18 110
               L ${modWidth - 18} 125 L 18 140
               L ${modWidth - 18} 155 L 18 170
               L ${modWidth - 18} 180`}
            fill="none"
            stroke="#F43F5E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Upstream / Downstream Differential Manometer (ΔP) Gauge according to IDAE */}
          <g transform={`translate(${modWidth / 2}, 8)`}>
            <circle cx="0" cy="0" r="9" fill={isWhiteTheme ? '#FFFFFF' : '#1E293B'} stroke="#F43F5E" strokeWidth="1.5" />
            <text x="0" y="3" textAnchor="middle" fill="#F43F5E" fontSize="7" fontWeight="bold" fontFamily="JetBrains Mono">
              ΔP
            </text>
            {/* Capillary impulse pipes */}
            <path d="M -9 0 L -18 0 L -18 20" fill="none" stroke={mutedStroke} strokeWidth="1" strokeDasharray="2,1" />
            <path d="M 9 0 L 18 0 L 18 20" fill="none" stroke={mutedStroke} strokeWidth="1" strokeDasharray="2,1" />
          </g>

          {/* Quick-latch handles */}
          <rect x="5" y="45" width="4" height="14" rx="1" fill={primaryStroke} />
          <rect x="5" y="140" width="4" height="14" rx="1" fill={primaryStroke} />

          {/* Filter norm badge */}
          <g transform={`translate(${modWidth / 2}, 175)`}>
            <rect
              x="-24"
              y="-10"
              width="48"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#FFE4E6' : '#4C0519'}
              stroke="#F43F5E"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#9F1239' : '#FECDD3'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              {pClass}
            </text>
          </g>
        </g>
      );
    }

    case 'mixing_box': {
      const ratio = mod.params.outdoorRatio ?? 0.3;
      return (
        <g className="idae-symbol-mixing-box">
          {/* Chamber internal volume with technical airflow convergence */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="4"
            fill={isWhiteTheme ? '#FFFBEB' : '#1F1607'}
            stroke="#F59E0B"
            strokeWidth="1.5"
          />

          {/* Upper Return Air Intake (RCA) with vertical damper blades */}
          <g transform={`translate(${modWidth / 2}, 15)`}>
            {/* Top Return arrow (RCA - Amarillo/Naranja UNE-EN 13779) */}
            <g transform="translate(0, -5)">
              <line x1="0" y1="-8" x2="0" y2="4" stroke="#F59E0B" strokeWidth="2.5" />
              <polygon points="0,6 -4,0 4,0" fill="#F59E0B" />
              <text x="10" y="0" fill="#F59E0B" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono">
                RCA
              </text>
            </g>

            {/* Vertical opposed blades for recirculation */}
            {[-25, -10, 5, 20].map((bx) => (
              <g key={`rca-blade-${bx}`} transform={`translate(${bx}, 14)`}>
                <line x1="0" y1="0" x2="0" y2="20" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="0" cy="10" r="2.5" fill="#D97706" />
              </g>
            ))}
          </g>

          {/* Central Modulating Common Actuator Servomotor M */}
          <g transform={`translate(${modWidth / 2}, 68)`}>
            <circle cx="0" cy="0" r="11" fill={isWhiteTheme ? '#FFFFFF' : '#292524'} stroke="#F59E0B" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">
              M
            </text>
            {/* Interconnected mechanical linkage arms to both dampers */}
            <line x1="0" y1="-11" x2="0" y2="-35" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" />
            <line x1="-11" y1="0" x2="-35" y2="0" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" />
          </g>

          {/* Lower ODA horizontal damper */}
          <g transform="translate(18, 115)">
            {[-18, 0, 18].map((dy) => (
              <g key={`mix-blade-${dy}`} transform={`translate(0, ${dy + 18})`}>
                <line x1="0" y1="0" x2="26" y2="0" stroke="#10B981" strokeWidth="2.5" />
                <circle cx="13" cy="0" r="2.5" fill="#059669" />
              </g>
            ))}
          </g>

          {/* Resulting air blending streamline vortex */}
          <g transform={`translate(${modWidth - 28}, 115)`}>
            <path
              d="M -15 -25 Q 5 0 -15 25 Q 10 30 15 15"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4,2"
              className={isFlowActive ? 'animate-pulse' : ''}
            />
            <polygon points="17,15 10,12 14,19" fill="#F59E0B" />
          </g>

          {/* Mixture probe and ratio label */}
          <g transform={`translate(${modWidth / 2}, 175)`}>
            <rect
              x="-36"
              y="-10"
              width="72"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#FEF3C7' : '#451A03'}
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#92400E' : '#FDE68A'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Mezcla ODA/RCA
            </text>
          </g>
        </g>
      );
    }

    case 'heat_recovery': {
      const eff = mod.params.recoveryEfficiency ?? 0.75;
      return (
        <g className="idae-symbol-heat-recovery">
          {/* Main diamond/square cross-counterflow heat exchanger core */}
          <g transform="translate(12, 30)">
            <rect
              x="0"
              y="0"
              width={modWidth - 24}
              height="130"
              rx="4"
              fill={isWhiteTheme ? '#F0F9FF' : '#0C1B2E'}
              stroke="#0EA5E9"
              strokeWidth="2"
            />

            {/* Alternating counterflow heat exchange plates (matriz de placas de aluminio) */}
            {[-3, -2, -1, 0, 1, 2, 3].map((idx) => {
              const offset = idx * 12;
              return (
                <line
                  key={`plate-${idx}`}
                  x1={10 + (idx < 0 ? 0 : offset)}
                  y1={idx < 0 ? -offset * 2 : 0}
                  x2={modWidth - 34}
                  y2={130 - (idx > 0 ? 0 : -offset * 2)}
                  stroke={gridLine}
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* ODA supply airflow vector (cold -> preheated) */}
            <path
              d={`M 8 100 Q ${(modWidth - 24) / 2} 65 ${modWidth - 32} 30`}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <polygon
              points={`${modWidth - 32},30 ${modWidth - 42},30 ${modWidth - 35},38`}
              fill="#38BDF8"
            />

            {/* ETA extract airflow vector crossing in counterflow (warm -> cooled to exhaust) */}
            <path
              d={`M 8 30 Q ${(modWidth - 24) / 2} 65 ${modWidth - 32} 100`}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="5,2"
            />
            <polygon
              points={`${modWidth - 32},100 ${modWidth - 35},92 ${modWidth - 42},100`}
              fill="#F59E0B"
            />

            {/* Center efficiency badge according to IDAE RITE IT 1.2.4.5.2 */}
            <circle
              cx={(modWidth - 24) / 2}
              cy="65"
              r="16"
              fill={isWhiteTheme ? '#FFFFFF' : '#0369A1'}
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <text
              x={(modWidth - 24) / 2}
              y="68"
              textAnchor="middle"
              fill={isWhiteTheme ? '#0284C7' : '#FFFFFF'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              η {Math.round(eff * 100)}%
            </text>
          </g>

          {/* Top By-Pass Damper with Servomotor M for Free-Cooling */}
          <g transform={`translate(${modWidth / 2}, 16)`}>
            <rect
              x="-28"
              y="-10"
              width="56"
              height="14"
              rx="2"
              fill={isWhiteTheme ? '#E0F2FE' : '#082F49'}
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#0284C7"
              fontSize="7"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              BY-PASS FREE-COOLING [M]
            </text>
          </g>

          {/* Sloped condensation drain tray under recovery section with P-trap */}
          <g transform="translate(14, 162)">
            <polygon
              points={`0,0 ${modWidth - 28},0 ${modWidth - 36},6 8,6`}
              fill="#0284C7"
              stroke="#38BDF8"
              strokeWidth="1"
            />
            {/* Siphon tube with ball */}
            <path
              d="M 20 6 L 20 18 Q 20 25 27 25 L 34 25 Q 41 25 41 18 L 41 22 Q 41 28 48 28 L 54 28"
              fill="none"
              stroke="#0284C7"
              strokeWidth="2"
            />
          </g>

          {/* Norm label */}
          <g transform={`translate(${modWidth / 2}, 178)`}>
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#0369A1' : '#7DD3FC'}
              fontSize="8"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              RITE η ≥ 73%
            </text>
          </g>
        </g>
      );
    }

    case 'cooling_coil': {
      const exitTdb = mod.params.exitTdb ?? 12.8;
      return (
        <g className="idae-symbol-cooling-coil">
          {/* Outer coil casing */}
          <rect
            x="10"
            y="18"
            width={modWidth - 20}
            height="150"
            rx="3"
            fill={isWhiteTheme ? '#F0F9FF' : '#082F49'}
            stroke="#0284C7"
            strokeWidth="2"
          />

          {/* Canonical IDAE Diagonal Cross (Baterías Fig. 1, 2, 11) */}
          <line x1="14" y1="22" x2={modWidth - 14} y2="164" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1={modWidth - 14} y1="22" x2="14" y2="164" stroke="#0284C7" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

          {/* Staggered Multi-Row Copper Tube Array (Matriz en tresbolillo según IDAE) */}
          <g transform="translate(18, 26)">
            {[0, 1, 2, 3].map((col) => {
              const cx = col * 18 + 10;
              const yOffset = col % 2 === 0 ? 0 : 9;
              return (
                <g key={`cool-col-${col}`}>
                  {/* Vertical continuous corrugated aluminum cooling fin */}
                  <line
                    x1={cx}
                    y1="0"
                    x2={cx}
                    y2="132"
                    stroke={gridLine}
                    strokeWidth="1"
                  />
                  {/* Copper tubes */}
                  {[12, 30, 48, 66, 84, 102, 120].map((rowY) => (
                    <circle
                      key={`tube-${col}-${rowY}`}
                      cx={cx}
                      cy={rowY + yOffset}
                      r="4"
                      fill="#0284C7"
                      stroke="#38BDF8"
                      strokeWidth="1"
                      opacity="0.85"
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* Canonical IDAE Center "−" Box (Símbolo oficial Fig. 1, 2, 11) */}
          <g transform={`translate(${modWidth / 2}, 93)`}>
            <rect x="-12" y="-12" width="24" height="24" rx="3" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.5" />
            <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">−</text>
          </g>

          {/* Droplet eliminator / Separador de gotas post-batería fría */}
          <g transform={`translate(${modWidth - 22}, 26)`}>
            {[10, 30, 50, 70, 90, 110, 130].map((dy) => (
              <path
                key={`eliminator-${dy}`}
                d={`M 0 ${dy} L 4 ${dy + 4} L 0 ${dy + 8}`}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Proportional 3-Way Valve with Servomotor M (or TXV expansion valve for DX) */}
          <g transform={`translate(${modWidth / 2}, 6)`}>
            {/* 3-way valve symbol */}
            <polygon points="-8,-4 0,0 -8,4" fill="#0284C7" />
            <polygon points="8,-4 0,0 8,4" fill="#0284C7" />
            <polygon points="-4,-8 0,0 4,-8" fill="#0284C7" />
            {/* Actuator M */}
            <circle cx="0" cy="-14" r="5" fill="#38BDF8" />
            <text x="0" y="-12" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold">
              M
            </text>
          </g>

          {/* Sloped Stainless Steel Condensate Tray (AISI 304) */}
          <g transform="translate(8, 168)">
            <polygon
              points={`0,0 ${modWidth - 16},0 ${modWidth - 22},12 6,12`}
              fill="#0284C7"
              stroke="#38BDF8"
              strokeWidth="1.5"
            />
            {/* Drain pipe & P-trap Siphon with float ball according to IDAE guide */}
            <path
              d="M 18 12 L 18 24 Q 18 30 25 30 L 32 30 Q 39 30 39 24 L 39 28 Q 39 34 46 34 L 54 34"
              fill="none"
              stroke="#0284C7"
              strokeWidth="2.5"
            />
            {/* Anti-suction float ball */}
            <circle cx="39" cy="27" r="3" fill="#38BDF8" />
          </g>

          {/* Condensate droplets animated falling into pan */}
          {isFlowActive && (
            <g transform={`translate(${modWidth / 2 - 10}, 145)`} className="animate-bounce">
              <circle cx="0" cy="0" r="2.5" fill="#38BDF8" />
              <circle cx="15" cy="8" r="2" fill="#38BDF8" />
            </g>
          )}

          {/* Cold Badge & Exit Temperature */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-28"
              y="-10"
              width="56"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#E0F2FE' : '#0369A1'}
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#0369A1' : '#FFFFFF'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              BF (−) {exitTdb}°C
            </text>
          </g>
        </g>
      );
    }

    case 'heating_coil': {
      const heatTdb = mod.params.heatingTdb ?? 16.5;
      return (
        <g className="idae-symbol-heating-coil">
          {/* Outer coil casing */}
          <rect
            x="10"
            y="18"
            width={modWidth - 20}
            height="150"
            rx="3"
            fill={isWhiteTheme ? '#FFF1F2' : '#450A0A'}
            stroke="#DC2626"
            strokeWidth="2"
          />

          {/* Canonical IDAE Diagonal Cross (Baterías Fig. 1, 2, 11) */}
          <line x1="14" y1="22" x2={modWidth - 14} y2="164" stroke="#DC2626" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1={modWidth - 14} y1="22" x2="14" y2="164" stroke="#DC2626" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

          {/* Thermal Red Finned Tubes in Staggered Matrix */}
          <g transform="translate(18, 26)">
            {[0, 1, 2].map((col) => {
              const cx = col * 20 + 10;
              const yOffset = col % 2 === 0 ? 0 : 10;
              return (
                <g key={`heat-col-${col}`}>
                  {/* Vertical fin */}
                  <line
                    x1={cx}
                    y1="0"
                    x2={cx}
                    y2="132"
                    stroke={isWhiteTheme ? '#FECDD3' : '#7F1D1D'}
                    strokeWidth="1.5"
                  />
                  {/* Tubes */}
                  {[12, 32, 52, 72, 92, 112].map((rowY) => (
                    <circle
                      key={`heat-tube-${col}-${rowY}`}
                      cx={cx}
                      cy={rowY + yOffset}
                      r="4.5"
                      fill="#EF4444"
                      stroke="#DC2626"
                      strokeWidth="1.2"
                      opacity="0.85"
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* Canonical IDAE Center "+" Box (Símbolo oficial Fig. 1, 2, 11) */}
          <g transform={`translate(${modWidth / 2}, 93)`}>
            <rect x="-12" y="-12" width="24" height="24" rx="3" fill="#DC2626" stroke="#FEE2E2" strokeWidth="1.5" />
            <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">+</text>
          </g>

          {/* Safety Anti-Freeze Capillary Thermostat (Frost Stat) */}
          <g transform="translate(14, 30)">
            <path
              d={`M 0 0 Q ${modWidth - 28} 40 0 80 Q ${modWidth - 28} 120 0 130`}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
            <circle cx="0" cy="0" r="3" fill="#F59E0B" />
          </g>

          {/* Modulating Valve with Actuator M on supply header */}
          <g transform={`translate(${modWidth / 2}, 6)`}>
            <polygon points="-8,-4 0,0 -8,4" fill="#DC2626" />
            <polygon points="8,-4 0,0 8,4" fill="#DC2626" />
            <circle cx="0" cy="-14" r="5" fill="#EF4444" />
            <text x="0" y="-12" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold">
              M
            </text>
          </g>

          {/* Heat Badge & Target Heating Temperature */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-28"
              y="-10"
              width="56"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#FEE2E2' : '#991B1B'}
              stroke="#DC2626"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#991B1B' : '#FFFFFF'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              BC (+) {heatTdb}°C
            </text>
          </g>
        </g>
      );
    }

    case 'humidifier': {
      return (
        <g className="idae-symbol-humidifier">
          {/* Internal Stainless Steel Manifold and Micro-discharge Steam Lances */}
          <g transform="translate(14, 25)">
            {/* Steam feed pipe from top generator */}
            <line x1={modWidth / 2 - 25} y1="0" x2={modWidth / 2 - 25} y2="135" stroke="#A855F7" strokeWidth="4" />

            {/* Dry Steam Micro-Nozzles firing counterflow */}
            {[20, 45, 70, 95, 120].map((ny) => (
              <g key={`lance-nozzle-${ny}`} transform={`translate(${modWidth / 2 - 25}, ${ny})`}>
                <line x1="0" y1="0" x2="-8" y2="0" stroke="#C084FC" strokeWidth="2.5" />
                {/* Steam plume dispersion cloud */}
                <path
                  d="M -10 -4 Q -20 -10 -25 -2 Q -30 6 -20 8 Q -12 6 -10 2 Z"
                  fill="#C084FC"
                  opacity={isWhiteTheme ? 0.6 : 0.4}
                  className={isFlowActive ? 'animate-pulse' : ''}
                />
              </g>
            ))}

            {/* Droplet eliminator downstream */}
            <g transform={`translate(${modWidth - 38}, 0)`}>
              {[15, 40, 65, 90, 115].map((dy) => (
                <path
                  key={`hum-eliminator-${dy}`}
                  d={`M 0 ${dy} L 5 ${dy + 6} L 0 ${dy + 12}`}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="2.5"
                />
              ))}
            </g>
          </g>

          {/* Steam Trap and Modulation Valve */}
          <g transform={`translate(${modWidth / 2 - 11}, 10)`}>
            <circle cx="0" cy="0" r="5" fill="#9333EA" />
            <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold">
              M
            </text>
          </g>

          {/* Badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-26"
              y="-10"
              width="52"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#F3E8FF' : '#581C87'}
              stroke="#A855F7"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#6B21A8' : '#F3E8FF'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Vapor Seco
            </text>
          </g>
        </g>
      );
    }

    case 'fan': {
      const pEst = mod.params.staticPressurePa ?? 450;
      return (
        <g className="idae-symbol-fan">
          {/* Fan Plenum Chamber */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="4"
            fill={isWhiteTheme ? '#ECFDF5' : '#03251E'}
            stroke="#10B981"
            strokeWidth="2"
          />

          {/* Calibrated Suction Nozzle Cone (Tobera venturi con tomas Δp) */}
          <path
            d="M 16 40 L 42 60 L 42 135 L 16 155 Z"
            fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
            stroke="#059669"
            strokeWidth="1.5"
          />
          {/* Pressure ring taps */}
          <circle cx="38" cy="65" r="2.5" fill="#34D399" />
          <circle cx="38" cy="130" r="2.5" fill="#34D399" />

          {/* Canonical UNE-EN 12792 Fan Symbol: Backward-Curved Impeller (Rodete Plug-Fan de álabes hacia atrás) */}
          <g transform={`translate(${modWidth / 2 - 5}, 97)`}>
            {/* Outer rotor circular housing */}
            <circle
              cx="0"
              cy="0"
              r="46"
              fill={isWhiteTheme ? '#FFFFFF' : '#064E3B'}
              stroke="#10B981"
              strokeWidth="2.5"
            />
            {/* Central hub / Eje motor */}
            <circle cx="0" cy="0" r="14" fill="#047857" stroke="#34D399" strokeWidth="2" />

            {/* Aerodynamic Backward-Curved Blades (6 álabes inclinados hacia atrás) */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <path
                key={`blade-fan-${deg}`}
                d="M 14 0 Q 30 -5 44 -18"
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${deg})`}
              />
            ))}

            {/* Rotation direction arrow */}
            <path
              d="M -22 -22 A 32 32 0 0 1 22 -22"
              fill="none"
              stroke="#34D399"
              strokeWidth="2"
              markerEnd="url(#arrowRot)"
            />
            <polygon points="24,-24 22,-16 29,-18" fill="#34D399" />
          </g>

          {/* High Efficiency EC Inverter Motor (Motor sincrono de imanes permanentes M ~ EC) */}
          <g transform={`translate(${modWidth - 42}, 65)`}>
            <rect
              x="0"
              y="0"
              width="28"
              height="65"
              rx="3"
              fill={isWhiteTheme ? '#E2E8F0' : '#1E293B'}
              stroke={primaryStroke}
              strokeWidth="1.5"
            />
            {/* Motor cooling fins */}
            {[10, 20, 30, 40, 50].map((fy) => (
              <line key={`mot-fin-${fy}`} x1="0" y1={fy} x2="28" y2={fy} stroke={gridLine} strokeWidth="1" />
            ))}
            {/* Motor ID text */}
            <text
              x="14"
              y="36"
              textAnchor="middle"
              fill="#10B981"
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              EC
            </text>
          </g>

          {/* Antivibration Canvas Flexible Sleeve (Manguito elástico de lona en descarga) */}
          <g transform={`translate(${modWidth - 14}, 50)`}>
            <line x1="0" y1="0" x2="0" y2="95" stroke="#F59E0B" strokeWidth="3" strokeDasharray="3,3" />
          </g>

          {/* Antivibration spring base supports (Amortiguadores elásticos) */}
          <g transform={`translate(${modWidth / 2 - 20}, 180)`}>
            <rect x="-10" y="0" width="20" height="6" fill="#475569" rx="1" />
            <path d="M -6 0 L -3 -6 L 0 0 L 3 -6 L 6 0" fill="none" stroke="#94A3B8" strokeWidth="2" />
          </g>
          <g transform={`translate(${modWidth / 2 + 25}, 180)`}>
            <rect x="-10" y="0" width="20" height="6" fill="#475569" rx="1" />
            <path d="M -6 0 L -3 -6 L 0 0 L 3 -6 L 6 0" fill="none" stroke="#94A3B8" strokeWidth="2" />
          </g>

          {/* SFP & Available static pressure badge according to IDAE guide */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-36"
              y="-10"
              width="72"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
              stroke="#10B981"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#065F46' : '#A7F3D0'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              EC · {pEst} Pa
            </text>
          </g>
        </g>
      );
    }

    case 'final_filter': {
      const fClass = mod.params.filterClass || 'F7';
      return (
        <g className="idae-symbol-final-filter">
          {/* Filter outer frame */}
          <rect
            x="10"
            y="15"
            width={modWidth - 20}
            height="170"
            rx="3"
            fill={isWhiteTheme ? '#FDF2F8' : '#270817'}
            stroke="#EC4899"
            strokeWidth="1.5"
          />

          {/* Canonical UNE-EN 12792 Multi-Pocket / Bag Filter (Bolsas cónicas estiradas horizontalmente) */}
          <g transform="translate(18, 22)">
            {[0, 1, 2, 3, 4].map((pocketIdx) => {
              const py = pocketIdx * 30 + 12;
              return (
                <g key={`pocket-${pocketIdx}`}>
                  {/* Conical pocket wedge */}
                  <path
                    d={`M 0 ${py - 10}
                        Q ${modWidth - 48} ${py - 8} ${modWidth - 36} ${py}
                        Q ${modWidth - 48} ${py + 8} 0 ${py + 10} Z`}
                    fill={isWhiteTheme ? '#FCE7F3' : '#4A0D2A'}
                    stroke="#F472B6"
                    strokeWidth="1.8"
                  />
                  {/* Inner airflow streamlines into pocket */}
                  <line
                    x1="6"
                    y1={py}
                    x2={modWidth - 44}
                    y2={py}
                    stroke="#EC4899"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                </g>
              );
            })}
          </g>

          {/* Differential pressure gauge (Magnehelic ΔP) */}
          <g transform={`translate(${modWidth / 2}, 8)`}>
            <circle cx="0" cy="0" r="9" fill={isWhiteTheme ? '#FFFFFF' : '#1E293B'} stroke="#EC4899" strokeWidth="1.5" />
            <text x="0" y="3" textAnchor="middle" fill="#EC4899" fontSize="7" fontWeight="bold" fontFamily="JetBrains Mono">
              ΔP
            </text>
          </g>

          {/* Norm label badge according to RITE IT 1.1.4.2 */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-30"
              y="-10"
              width="60"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#FCE7F3' : '#831843'}
              stroke="#EC4899"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#9D174D' : '#FCE7F3'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              {fClass} (ePM1)
            </text>
          </g>
        </g>
      );
    }

    case 'silencer': {
      const att = mod.params.attenuationDb ?? 18;
      return (
        <g className="idae-symbol-silencer">
          {/* Silencer casing with aerodynamic mineral wool splitters (Bafles fonoabsorbentes longitudinales) */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="3"
            fill={isWhiteTheme ? '#F8FAFC' : '#0F172A'}
            stroke="#64748B"
            strokeWidth="1.5"
          />

          {/* 4 Parallel Acoustic Splitters with rounded aerodynamic nose */}
          {[22, 60, 98, 136].map((sy) => (
            <g key={`baffle-${sy}`} transform={`translate(14, ${sy})`}>
              {/* Rounded entry nose */}
              <path
                d={`M 8 0
                    L ${modWidth - 36} 0
                    Q ${modWidth - 28} 0 ${modWidth - 28} 10
                    Q ${modWidth - 28} 20 ${modWidth - 36} 20
                    L 8 20
                    Q 0 20 0 10
                    Q 0 0 8 0 Z`}
                fill={isWhiteTheme ? '#E2E8F0' : '#334155'}
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              {/* Fibrous absorption hatching */}
              {[-1, 0, 1, 2].map((k) => (
                <circle
                  key={`fiber-${k}`}
                  cx={20 + k * 18}
                  cy="10"
                  r="2"
                  fill="#64748B"
                />
              ))}
            </g>
          ))}

          {/* Dampened acoustic waves representation */}
          <g transform={`translate(${modWidth - 14}, 95)`}>
            <path
              d="M 0 -25 Q 6 0 0 25"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray="2,2"
              opacity="0.7"
            />
          </g>

          {/* Attenuation label */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-28"
              y="-10"
              width="56"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#F1F5F9' : '#1E293B'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#334155' : '#E2E8F0'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              −{att} dB(A)
            </text>
          </g>
        </g>
      );
    }

    case 'adiabatic_cooling': {
      return (
        <g className="idae-symbol-adiabatic-cooling">
          {/* Outer casing with water-tight sump base */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="4"
            fill={isWhiteTheme ? '#F0F9FF' : '#082F49'}
            stroke="#0284C7"
            strokeWidth="2"
          />

          {/* Spray Manifold (Rampa de agua con toberas pulverizadoras - Pág. 79 Guía IDAE) */}
          <g transform="translate(24, 25)">
            {/* Vertical water feed header pipe */}
            <line x1="12" y1="0" x2="12" y2="125" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <circle cx="12" cy="0" r="4.5" fill="#38BDF8" />

            {/* 4 Atomizing Spray Nozzles with fine droplet cones */}
            {[18, 50, 82, 114].map((ny) => (
              <g key={`spray-nozzle-${ny}`} transform={`translate(12, ${ny})`}>
                {/* Nozzle body */}
                <rect x="-3" y="-5" width="6" height="10" rx="1" fill="#0369A1" stroke="#38BDF8" strokeWidth="1" />
                <line x1="0" y1="0" x2="-8" y2="0" stroke="#0284C7" strokeWidth="2.5" />

                {/* Cone of atomized water spray firing in counterflow (flujo cruzado) */}
                <path
                  d="M -8 0 L -28 -14 L -28 14 Z"
                  fill="url(#adiabaticSprayGrad)"
                  fillOpacity={isWhiteTheme ? '0.35' : '0.28'}
                  stroke="#38BDF8"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                {/* Individual water droplets */}
                <circle cx="-16" cy="-4" r="1.5" fill="#38BDF8" className={isFlowActive ? 'animate-ping' : ''} />
                <circle cx="-22" cy="6" r="1.2" fill="#0EA5E9" />
                <circle cx="-25" cy="-2" r="1.8" fill="#38BDF8" />
              </g>
            ))}
          </g>

          {/* High-efficiency Droplet Eliminator (Separador de gotas alveolar posterior) */}
          <g transform={`translate(${modWidth - 28}, 26)`}>
            <rect x="0" y="0" width="14" height="135" fill={isWhiteTheme ? '#E0F2FE' : '#0C4A6E'} rx="2" stroke="#0284C7" strokeWidth="1" />
            {[10, 28, 46, 64, 82, 100, 118].map((ey) => (
              <path
                key={`adiab-elim-${ey}`}
                d={`M 2 ${ey} L 7 ${ey + 5} L 12 ${ey}`}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Bottom Water Collection Basin (Balsa con sifón y bomba de recirculación) */}
          <g transform="translate(10, 160)">
            {/* Water sump basin */}
            <rect x="0" y="0" width={modWidth - 20} height="20" rx="2" fill="#0369A1" stroke="#38BDF8" strokeWidth="1.2" />
            {/* Water level wavy line */}
            <path
              d={`M 4 5 Q 14 2 24 5 T 44 5 T 64 5 T 84 5 T ${modWidth - 28} 5`}
              fill="none"
              stroke="#E0F2FE"
              strokeWidth="1.5"
            />
            {/* Submersible recirculating pump P */}
            <circle cx="20" cy="11" r="5.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <text x="20" y="14" textAnchor="middle" fill="#38BDF8" fontSize="7" fontWeight="bold">P</text>
          </g>

          {/* Canonical IDAE label */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-46"
              y="-10"
              width="92"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#E0F2FE' : '#082F49'}
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#0369A1' : '#E0F2FE'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Enfriam. adiabático
            </text>
          </g>
        </g>
      );
    }

    case 'belt_fan': {
      const pEst = mod.params.staticPressurePa ?? 550;
      return (
        <g className="idae-symbol-belt-fan">
          {/* Fan casing chamber */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="4"
            fill={isWhiteTheme ? '#ECFDF5' : '#03251E'}
            stroke="#10B981"
            strokeWidth="2"
          />

          {/* Centrifugal Scroll Volute Housing (Voluta verde de doble oído - Fig. 1 Pág. 16 Guía IDAE) */}
          <g transform="translate(18, 25)">
            {/* Spiral volute casing */}
            <path
              d={`M 40 45
                  A 38 38 0 1 0 78 83
                  L 98 83
                  L 98 25
                  L 55 25
                  Z`}
              fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
              stroke="#10B981"
              strokeWidth="2.5"
            />

            {/* Impeller Wheel with curved radial blades */}
            <g transform="translate(40, 83)">
              <circle cx="0" cy="0" r="28" fill={isWhiteTheme ? '#FFFFFF' : '#0F372C'} stroke="#10B981" strokeWidth="2" />
              <circle cx="0" cy="0" r="10" fill="#047857" stroke="#34D399" strokeWidth="1.5" />

              {/* Fan impeller blades */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <path
                  key={`belt-blade-${deg}`}
                  d="M 10 0 Q 20 -4 27 -12"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  transform={`rotate(${deg})`}
                />
              ))}

              {/* Driven shaft pulley (Polea del rodete conducida) */}
              <circle cx="0" cy="0" r="7" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2.5" fill="#F8FAFC" />
            </g>
          </g>

          {/* External Electric Motor & Transmission Belt Drive (Correas y Poleas - Fig. 1) */}
          <g transform={`translate(${modWidth - 44}, 30)`}>
            {/* External Motor Body */}
            <rect x="0" y="70" width="32" height="48" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
            {/* Motor cooling fins */}
            {[78, 86, 94, 102, 110].map((fy) => (
              <line key={`mot-belt-fin-${fy}`} x1="0" y1={fy} x2="32" y2={fy} stroke="#334155" strokeWidth="1" />
            ))}
            <text x="16" y="98" textAnchor="middle" fill="#34D399" fontSize="8" fontWeight="bold">MOTOR</text>

            {/* Motor driving pulley (Polea motriz en el eje inferior) */}
            <circle cx="16" cy="125" r="9" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="16" cy="125" r="3" fill="#F8FAFC" />

            {/* V-Belts (Correas trapezoidales de transmisión cruzadas hacia el rodete) */}
            <path
              d="M 8 123 L -24 75 M 24 127 L -10 89"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeDasharray="4,2"
            />
            {/* Belt tensioner pulley (Polea tensora) */}
            <circle cx="-5" cy="115" r="4.5" fill="#64748B" stroke="#CBD5E1" strokeWidth="1" />
          </g>

          {/* Antivibration base springs */}
          <g transform={`translate(${modWidth / 2 - 25}, 180)`}>
            <rect x="-8" y="0" width="16" height="5" fill="#475569" rx="1" />
            <path d="M -5 0 L -2.5 -5 L 0 0 L 2.5 -5 L 5 0" fill="none" stroke="#94A3B8" strokeWidth="1.8" />
          </g>
          <g transform={`translate(${modWidth / 2 + 25}, 180)`}>
            <rect x="-8" y="0" width="16" height="5" fill="#475569" rx="1" />
            <path d="M -5 0 L -2.5 -5 L 0 0 L 2.5 -5 L 5 0" fill="none" stroke="#94A3B8" strokeWidth="1.8" />
          </g>

          {/* Canonical IDAE Fig. 1 badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-50"
              y="-10"
              width="100"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
              stroke="#10B981"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#065F46' : '#A7F3D0'}
              fontSize="8"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Ventilador (correas)
            </text>
          </g>
        </g>
      );
    }

    case 'plenum': {
      return (
        <g className="idae-symbol-plenum">
          {/* Spacious free airflow expansion plenum (Pág. 71 Guía IDAE: Filtro F8 - Plenum - Ventilador - Prefiltro F6) */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="4"
            fill={isWhiteTheme ? '#F8FAFC' : '#0F172A'}
            stroke="#94A3B8"
            strokeWidth="1.8"
          />

          {/* Sealed Inspection Access Door (Puerta hermética de registro con bisagras) */}
          <g transform="translate(18, 25)">
            <rect
              x="0"
              y="0"
              width={modWidth - 36}
              height="135"
              rx="4"
              fill={isWhiteTheme ? '#F1F5F9' : '#1E293B'}
              stroke="#64748B"
              strokeWidth="1.5"
            />

            {/* Door Hinges (Bisagras) */}
            <rect x="-2" y="20" width="4" height="12" fill="#475569" rx="1" />
            <rect x="-2" y="105" width="4" height="12" fill="#475569" rx="1" />

            {/* Rotary Compression Handle (Maneta de presión con cerrojo hermético) */}
            <g transform={`translate(${modWidth - 46}, 68)`}>
              <circle cx="0" cy="0" r="4.5" fill="#94A3B8" />
              <line x1="0" y1="0" x2="0" y2="16" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Circular Inspection Porthole / Mirilla de vidrio templado */}
            <g transform={`translate(${(modWidth - 36) / 2}, 60)`}>
              <circle cx="0" cy="0" r="18" fill={isWhiteTheme ? '#E0F2FE' : '#082F49'} stroke="#0284C7" strokeWidth="2" />
              <circle cx="0" cy="0" r="14" fill={isWhiteTheme ? '#BAE6FD' : '#0C4A6E'} opacity="0.6" />
              {/* Glass reflection highlight slash */}
              <path d="M -8 -8 L 8 8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            </g>

            {/* Interior LED Maintenance Luminaire on ceiling */}
            <g transform={`translate(${(modWidth - 36) / 2}, 12)`}>
              <rect x="-10" y="0" width="20" height="6" rx="2" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />
              {/* Light cone downwards */}
              <polygon
                points="-10,6 10,6 24,120 -24,120"
                fill="#FEF08A"
                fillOpacity="0.08"
                className={isFlowActive ? 'animate-pulse' : ''}
              />
            </g>
          </g>

          {/* Pressure & Temperature test ports (Tomas de presión) */}
          <g transform={`translate(${modWidth / 2}, 10)`}>
            <circle cx="-14" cy="0" r="2.5" fill="#EF4444" />
            <circle cx="14" cy="0" r="2.5" fill="#38BDF8" />
          </g>

          {/* Canonical IDAE Plenum badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-32"
              y="-10"
              width="64"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#E2E8F0' : '#1E293B'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#1E293B' : '#F1F5F9'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Plenum
            </text>
          </g>
        </g>
      );
    }

    case 'electric_heater': {
      const heatTdb = mod.params.heatingTdb ?? 22.0;
      return (
        <g className="idae-symbol-electric-heater">
          {/* Outer casing */}
          <rect
            x="10"
            y="18"
            width={modWidth - 20}
            height="150"
            rx="3"
            fill={isWhiteTheme ? '#FFF1F2' : '#450A0A'}
            stroke="#DC2626"
            strokeWidth="2"
          />

          {/* Canonical IDAE Diagonal Cross (Batería Fig. 11 Pág. 24) */}
          <line x1="14" y1="22" x2={modWidth - 14} y2="164" stroke="#DC2626" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
          <line x1={modWidth - 14} y1="22" x2="14" y2="164" stroke="#DC2626" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />

          {/* Armored Electrical Resistance Rods in Heating Wave */}
          <g transform="translate(18, 28)">
            {[0, 1].map((col) => {
              const cx = col * 32 + 16;
              return (
                <path
                  key={`elec-rod-${col}`}
                  d={`M ${cx} 6
                      L ${cx + 10} 22 L ${cx - 10} 38
                      L ${cx + 10} 54 L ${cx - 10} 70
                      L ${cx + 10} 86 L ${cx - 10} 102
                      L ${cx + 10} 118 L ${cx} 128`}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isFlowActive ? 'animate-pulse' : ''}
                />
              );
            })}
          </g>

          {/* Canonical IDAE Center "+" Box (Símbolo oficial Fig. 1, 2, 11) */}
          <g transform={`translate(${modWidth / 2}, 93)`}>
            <rect x="-12" y="-12" width="24" height="24" rx="3" fill="#DC2626" stroke="#FEE2E2" strokeWidth="1.5" />
            <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">+</text>
          </g>

          {/* High-limit Safety Thermostat (Termostato de seguridad anti-incendio) */}
          <g transform={`translate(${modWidth / 2}, 16)`}>
            <circle cx="0" cy="0" r="6" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
            <text x="0" y="2.5" textAnchor="middle" fill="#000000" fontSize="7" fontWeight="bold">TS</text>
          </g>

          {/* Badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-36"
              y="-10"
              width="72"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#FEE2E2' : '#991B1B'}
              stroke="#DC2626"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#991B1B' : '#FFFFFF'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              BC (+) {heatTdb}°C ⚡
            </text>
          </g>
        </g>
      );
    }

    case 'rotary_wheel': {
      const eff = mod.params.recoveryEfficiency ?? 0.78;
      return (
        <g className="idae-symbol-rotary-wheel">
          {/* Outer casing */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="4"
            fill={isWhiteTheme ? '#F0FDF4' : '#042217'}
            stroke="#10B981"
            strokeWidth="2"
          />

          {/* Rotary Wheel Rotor (Rueda Giratoria Entálpica - Guía IDAE Fig. 3 / 4) */}
          <g transform={`translate(${modWidth / 2}, 95)`}>
            {/* Outer wheel rim with drive belt groove */}
            <circle
              cx="0"
              cy="0"
              r="62"
              fill={isWhiteTheme ? '#FFFFFF' : '#0B132B'}
              stroke="#10B981"
              strokeWidth="3"
            />
            {/* Inner cellular honeycomb matrix lines */}
            <circle cx="0" cy="0" r="50" fill="none" stroke={gridLine} strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="0" cy="0" r="34" fill="none" stroke={gridLine} strokeWidth="1" strokeDasharray="2,2" />

            {/* Radial sectors (12 radios de la matriz alveolar higroscópica) */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={`rotor-spoke-${deg}`}
                x1="0"
                y1="0"
                x2={60 * Math.cos((deg * Math.PI) / 180)}
                y2={60 * Math.sin((deg * Math.PI) / 180)}
                stroke={deg % 90 === 0 ? '#10B981' : gridLine}
                strokeWidth={deg % 90 === 0 ? '2' : '1'}
              />
            ))}

            {/* Supply / Exhaust flow divider line */}
            <line x1="-62" y1="0" x2="62" y2="0" stroke="#059669" strokeWidth="2.5" />

            {/* Purge Sector (Sector de purga autolimpiante según UNE-EN 308) */}
            <path
              d="M 0 0 L 22 -58 A 62 62 0 0 1 42 -46 Z"
              fill="#F59E0B"
              fillOpacity={isWhiteTheme ? '0.4' : '0.35'}
              stroke="#D97706"
              strokeWidth="1.5"
            />

            {/* Rotation Direction Arrow */}
            <path
              d="M -35 -35 A 48 48 0 0 1 35 -35"
              fill="none"
              stroke="#34D399"
              strokeWidth="2.5"
            />
            <polygon points="36,-38 32,-30 40,-32" fill="#34D399" />

            {/* Central Bearing Hub */}
            <circle cx="0" cy="0" r="11" fill="#047857" stroke="#34D399" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
          </g>

          {/* Drive Gearmotor & Belt on corner (Motorreductor) */}
          <g transform={`translate(${modWidth - 32}, 22)`}>
            <rect x="0" y="0" width="20" height="26" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
            <circle cx="10" cy="13" r="5" fill="#10B981" />
            <text x="10" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">M</text>
            {/* Belt from motor to wheel */}
            <line x1="2" y1="20" x2="-14" y2="35" stroke="#D97706" strokeWidth="2" strokeDasharray="3,2" />
          </g>

          {/* Efficiency Badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-38"
              y="-10"
              width="76"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
              stroke="#10B981"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#065F46' : '#A7F3D0'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Rotor η {Math.round(eff * 100)}%
            </text>
          </g>
        </g>
      );
    }

    case 'return_fan': {
      const pEst = mod.params.staticPressurePa ?? 380;
      return (
        <g className="idae-symbol-return-fan">
          {/* Fan Chamber */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="4"
            fill={isWhiteTheme ? '#FEF3C7' : '#291804'}
            stroke="#D97706"
            strokeWidth="2"
          />

          {/* Air Suction Inflow Cone */}
          <path
            d="M 16 45 L 40 65 L 40 130 L 16 150 Z"
            fill={isWhiteTheme ? '#FDE68A' : '#451A03'}
            stroke="#D97706"
            strokeWidth="1.5"
          />

          {/* Impeller Wheel (Rotor de retorno con álabes a reacción) */}
          <g transform={`translate(${modWidth / 2 - 5}, 97)`}>
            <circle cx="0" cy="0" r="44" fill={isWhiteTheme ? '#FFFFFF' : '#451A03'} stroke="#D97706" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="14" fill="#B45309" stroke="#FBBF24" strokeWidth="2" />

            {/* Blades */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <path
                key={`ret-blade-${deg}`}
                d="M 14 0 Q 28 -5 42 -16"
                fill="none"
                stroke="#D97706"
                strokeWidth="3.2"
                strokeLinecap="round"
                transform={`rotate(${deg})`}
              />
            ))}

            {/* Flow Vector */}
            <path d="M -20 -20 A 30 30 0 0 1 20 -20" fill="none" stroke="#FBBF24" strokeWidth="2" />
            <polygon points="22,-22 20,-14 27,-16" fill="#FBBF24" />
          </g>

          {/* Electric Motor */}
          <g transform={`translate(${modWidth - 42}, 65)`}>
            <rect x="0" y="0" width="28" height="65" rx="3" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
            {[12, 24, 36, 48].map((fy) => (
              <line key={`ret-mot-fin-${fy}`} x1="0" y1={fy} x2="28" y2={fy} stroke="#475569" strokeWidth="1" />
            ))}
            <text x="14" y="36" textAnchor="middle" fill="#FBBF24" fontSize="8" fontWeight="bold">ETA</text>
          </g>

          {/* Antivibration springs */}
          <g transform={`translate(${modWidth / 2 - 20}, 180)`}>
            <rect x="-8" y="0" width="16" height="5" fill="#475569" rx="1" />
            <path d="M -5 0 L -2.5 -5 L 0 0 L 2.5 -5 L 5 0" fill="none" stroke="#D97706" strokeWidth="1.8" />
          </g>
          <g transform={`translate(${modWidth / 2 + 20}, 180)`}>
            <rect x="-8" y="0" width="16" height="5" fill="#475569" rx="1" />
            <path d="M -5 0 L -2.5 -5 L 0 0 L 2.5 -5 L 5 0" fill="none" stroke="#D97706" strokeWidth="1.8" />
          </g>

          {/* Badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-42"
              y="-10"
              width="84"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#FEF3C7' : '#78350F'}
              stroke="#D97706"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#92400E' : '#FDE68A'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Vent. Retorno · {pEst} Pa
            </text>
          </g>
        </g>
      );
    }

    case 'exhaust_damper': {
      return (
        <g className="idae-symbol-exhaust-damper">
          {/* Damper casing with opposed blades */}
          <g transform="translate(18, 20)">
            {/* Actuator Servomotor M on top */}
            <g transform={`translate(${(modWidth - 45) / 2}, -10)`}>
              <rect x="-12" y="-14" width="24" height="14" rx="2" fill={isWhiteTheme ? '#E2E8F0' : '#1E293B'} stroke={primaryStroke} strokeWidth="1.5" />
              <circle cx="0" cy="-7" r="4.5" fill="#92400E" />
              <text x="0" y="-4" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold">M</text>
              <line x1="0" y1="0" x2="0" y2="15" stroke={primaryStroke} strokeWidth="2" />
            </g>

            {/* Connecting tie-rod linkage bar */}
            <line x1={(modWidth - 40) / 2 + 14} y1="25" x2={(modWidth - 40) / 2 + 14} y2="135" stroke={mutedStroke} strokeWidth="1.5" strokeDasharray="3,2" />

            {/* 4 Opposed Aerodynamic Blades */}
            {[25, 60, 95, 130].map((dy, idx) => {
              const sign = idx % 2 === 0 ? 1 : -1;
              const angle = sign * 35;
              const bladeLength = modWidth - 48;
              return (
                <g key={`exh-blade-${dy}`} transform={`translate(${bladeLength / 2}, ${dy})`}>
                  <circle cx="0" cy="0" r="3.5" fill="#92400E" />
                  <line
                    x1={-bladeLength / 2}
                    y1="0"
                    x2={bladeLength / 2}
                    y2="0"
                    stroke={isWhiteTheme ? '#92400E' : '#B45309'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    transform={`rotate(${angle})`}
                  />
                </g>
              );
            })}
          </g>

          {/* Rain Hood / Visera de descarga exterior con rejilla de protección */}
          <g transform={`translate(${modWidth - 16}, 15)`}>
            <path
              d="M 0 0 L 12 -4 L 12 165 L 0 160 Z"
              fill={isWhiteTheme ? '#F1F5F9' : '#0F172A'}
              stroke="#92400E"
              strokeWidth="1.5"
            />
            {[20, 50, 80, 110, 140].map((ly) => (
              <line key={`exh-louvre-${ly}`} x1="2" y1={ly} x2="10" y2={ly + 8} stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
            ))}
            <line x1="12" y1="0" x2="12" y2="165" stroke="#92400E" strokeWidth="1" strokeDasharray="2,2" />
          </g>

          {/* EHA Technical badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-36"
              y="-10"
              width="72"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#FEF3C7' : '#451A03'}
              stroke="#92400E"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#78350F' : '#FDE68A'}
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Expulsión EHA
            </text>
          </g>
        </g>
      );
    }

    case 'droplet_eliminator': {
      return (
        <g className="idae-symbol-droplet-eliminator">
          {/* Casing */}
          <rect
            x="8"
            y="15"
            width={modWidth - 16}
            height="170"
            rx="3"
            fill={isWhiteTheme ? '#F0F9FF' : '#082F49'}
            stroke="#0284C7"
            strokeWidth="1.8"
          />

          {/* Vertical Sinusoidal Wave Separator Louvres (Lamas en onda sinusoidal) */}
          <g transform="translate(18, 24)">
            {[0, 1, 2].map((col) => {
              const cx = col * 16 + 8;
              return (
                <g key={`drop-wave-col-${col}`}>
                  {[10, 32, 54, 76, 98, 120].map((wy) => (
                    <path
                      key={`wave-${col}-${wy}`}
                      d={`M ${cx - 6} ${wy} Q ${cx} ${wy + 6} ${cx + 6} ${wy} Q ${cx + 12} ${wy - 6} ${cx + 18} ${wy}`}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* Stainless steel catchment drain tray */}
          <g transform="translate(10, 164)">
            <polygon
              points={`0,0 ${modWidth - 20},0 ${modWidth - 26},8 6,8`}
              fill="#0369A1"
              stroke="#38BDF8"
              strokeWidth="1.2"
            />
          </g>

          {/* Badge */}
          <g transform={`translate(${modWidth / 2}, 184)`}>
            <rect
              x="-34"
              y="-10"
              width="68"
              height="18"
              rx="4"
              fill={isWhiteTheme ? '#E0F2FE' : '#0C4A6E'}
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={isWhiteTheme ? '#0284C7' : '#BAE6FD'}
              fontSize="8"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
            >
              Sep. Gotas
            </text>
          </g>
        </g>
      );
    }

    default:
      return null;
  }
};
