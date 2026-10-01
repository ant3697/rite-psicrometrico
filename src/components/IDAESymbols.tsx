import React from 'react';
import { AHUModuleItem, AHUModuleType } from '../types/psychrometrics';

export interface IDAESymbolDefinition {
  type: AHUModuleType;
  officialName: string;
  normativeReference: string;
  guideSection: string;
  dimensionDefault: string;
  description: string;
  keyFeatures: string[];
}

export const IDAE_SYMBOL_DEFINITIONS: IDAESymbolDefinition[] = [
  {
    type: 'intake_damper',
    officialName: 'Compuerta Motorizada de Toma de Aire Exterior (ODA)',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 13779 / RITE IT 1.2.4.5.1',
    guideSection: 'Capítulo 4 & 5: Regulación y Enfriamiento Gratuito (Free-cooling)',
    dimensionDefault: '0,35 m',
    description:
      'Persiana de intemperie con lamas deflectoras contra lluvia y malla antipájaros, seguida de compuerta de lamas aerodinámicas opuestas accionadas por servomotor proporcional para modulación precisa del caudal de aire exterior (ODA).',
    keyFeatures: [
      'Lamas aerodinámicas con juntas de estanqueidad elastomérica clase 4',
      'Servomotor proporcional (0-10 V) con muelle de retorno de seguridad [M]',
      'Sonda de temperatura y humedad exterior (sonda de entalpía para free-cooling)',
      'Identificación UNE-EN 13779 en color Verde ODA',
    ],
  },
  {
    type: 'prefilter',
    officialName: 'Prefiltro de Pliegues Profundos (F6 / G4 / ISO Coarse 65% - 0,40 m)',
    normativeReference: 'UNE-EN 779 / UNE-EN ISO 16890 / RITE IT 1.1.4.2.4 / Guía IDAE Fig. 1-2 (Pág. 16/17)',
    guideSection: 'Sección 1.2.3: Filtración del Aire Exterior de Ventilación',
    dimensionDefault: '0,40 m',
    description:
      'Filtro de superficie quebrada en zig-zag continuo en acordeón (pliegues profundos en V) en marco metálico de 0,40 m de profundidad (según acotación oficial de la Guía IDAE Pág. 17). Protege baterías y componentes contra partículas gruesas.',
    keyFeatures: [
      'Eficacia F6 / G4 según RITE IT 1.1.4.2.5 (protección de baterías y ventilador)',
      'Pliegues profundos en zig-zag continuo en color fucsia/magenta canónico IDAE',
      'Manómetro diferencial de aguja Magnehelic (ΔP)',
      'Cotas normalizadas IDAE: profundidad 0,40 m, altura 0,42 m / 0,62 m',
    ],
  },
  {
    type: 'prefilter_flat',
    officialName: 'Prefiltro Plano Compacto de Baja Pérdida (G4 / G5 - 0,15 m)',
    normativeReference: 'Guía Técnica IDAE Sección 1.2.3 & Figura Pág. 18 / UNE-EN 779',
    guideSection: 'Sección 1.2.3: Filtros de Reducido Espacio en Falso Techo',
    dimensionDefault: '0,15 m',
    description:
      'Filtro plano compacto de alta retención gravimétrica y reducida profundidad (0,15 m según la figura inferior de la Pág. 18 de la Guía IDAE). Permite reducir la longitud total de la UTA a tan solo 1,05 metros para montaje bajo falso techo.',
    keyFeatures: [
      'Profundidad ultracompacta de 0,15 m para montaje en falsos techos estrechos',
      'Reduce la longitud total de la unidad climatizadora a 1,05 m (Pág. 18)',
      'Menor consumo energético y menor nivel de ruido del ventilador',
      'Malla de protección metálica con cierres rápidos de sustitución',
    ],
  },
  {
    type: 'mixing_box',
    officialName: 'Cámara de Mezcla con Compuertas Conjugadas (ODA + RCA)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.2.4.5.1 / Guía IDAE Fig. 3 (Pág. 19)',
    guideSection: 'Capítulo 4 & Figuras 3-5: Tipos de Aire y Mezcla Termodinámica',
    dimensionDefault: '0,45 m',
    description:
      'Cámara de mezcla que incorpora dos compuertas conjugadas de movimiento opuesto mediante varillaje mecánico o servomotores gemelos sincronizados: compuerta de aire exterior (ODA) y compuerta vertical de retorno/recirculación (RCA).',
    keyFeatures: [
      'Permite free-cooling térmico o entálpico modulando del caudal mínimo al 100% ODA',
      'Servomotor proporcional común [M] con señal analógica 0-10 V',
      'Deflectores aerodinámicos de mezcla para evitar estratificación térmica antes de batería',
      'Sonda de temperatura de mezcla resultante (Tm)',
    ],
  },
  {
    type: 'heat_recovery',
    officialName: 'Recuperador de Calor de Placas a Contracorriente / Cruzadas',
    normativeReference: 'UNE-EN 13053 / UNE-EN 308 / RITE IT 1.2.4.5.2 / Guía IDAE Pág. 49 & 81',
    guideSection: 'Sección 2.5: Recuperación de Energía del Aire de Extracción',
    dimensionDefault: '0,60 m',
    description:
      'Intercambiador estático aire-aire de placas delgadas de aluminio con paso de flujos a contracorriente cruzado (representado canónicamente en las figuras de la Guía IDAE con gran cruz diagonal y placas). Obligatorio por RITE para caudales expulsados > 0,5 m³/s.',
    keyFeatures: [
      'Rendimiento térmico estandarizado ηt ≥ 73% (conforme a RITE / ErP Lot 6)',
      'Compuerta superior motorizada de By-Pass para free-cooling y protección antihelada',
      'Separación hermética total de circuitos sin contaminación cruzada entre ODA y ETA',
      'Bandeja de condensados inclinada en acero inoxidable con sifón en el lado de expulsión',
    ],
  },
  {
    type: 'cooling_coil',
    officialName: 'Batería de Refrigeración y Deshumectación (Baterías −)',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 1216 / RITE IT 1.2.4.2.1 / Guía IDAE Fig. 1-2 (Pág. 16)',
    guideSection: 'Capítulo 3: Baterías de Enfriamiento y Expansión Directa en Equipos Autónomos',
    dimensionDefault: '0,40 m',
    description:
      'Batería térmica representada canónicamente según la simbología de las Figuras 1, 2 y 11 de la Guía IDAE con aspa diagonal completa ("X") y recuadro con signo "−" en color azul/cian. Tubos de cobre en tresbolillo, aletas continuas y bandeja de condensados con sifón.',
    keyFeatures: [
      'Simbología canónica IDAE: caja con aspa diagonal ("X") y recuadro con signo [−]',
      'Tubos de cobre y aletas de aluminio en tresbolillo para máxima transferencia',
      'Bandeja de condensados inclinada con sifón P y bola flotante antisucción',
      'Válvula modulante de 3 vías con servomotor proporcional [M] o válvula de expansión TXV',
    ],
  },
  {
    type: 'heating_coil',
    officialName: 'Batería de Calefacción (Baterías +)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.2.4.2.2 / Guía IDAE Fig. 1-2 (Pág. 16)',
    guideSection: 'Capítulo 3: Baterías de Calor, Bombas de Calor Autónomas y RITE',
    dimensionDefault: '0,40 m',
    description:
      'Batería calefactora representada canónicamente según las Figuras 1, 2, 11 y 16 de la Guía IDAE mediante marco con aspa diagonal completa ("X") y recuadro oficial con signo "+" en color rojo. Calentamiento sensible para invierno o atemperamiento.',
    keyFeatures: [
      'Simbología canónica IDAE: marco con aspa diagonal ("X") y recuadro con signo [+]',
      'Tubos aleteados térmicos con colectores de distribución equilibrados',
      'Termostato capilar de protección antihelada (frost stat) de rearme manual',
      'Válvula de control modulante con servomotor proporcional [M]',
    ],
  },
  {
    type: 'electric_heater',
    officialName: 'Batería de Resistencias Eléctricas Blindadas (Fig. 11 Guía IDAE)',
    normativeReference: 'RITE IT 1.2.4.2.2 / Guía Técnica IDAE Figura 11 (Pág. 24)',
    guideSection: 'Sección 1.3.2.1: Tratamiento Térmico del Aire de Ventilación en Invierno',
    dimensionDefault: '0,35 m',
    description:
      'Batería calefactora modular de resistencias eléctricas blindadas con aletas espiraladas de acero inoxidable para atemperamiento rápido del aire exterior de ventilación en condiciones extremas de invierno (según Figura 11 de la Guía IDAE).',
    keyFeatures: [
      'Simbología IDAE Fig. 11: caja con aspa diagonal ("X"), recuadro [+] y símbolo eléctrico ⚡',
      'Termostato de seguridad de corte automático por sobretemperatura y rearme manual (TS)',
      'Etapas de potencia escalonadas con control de modulación por relés de estado sólido (SSR)',
      'Aporte térmico instantáneo sin necesidad de circuito hidráulico',
    ],
  },
  {
    type: 'humidifier',
    officialName: 'Sección de Humectación (Lanza de Vapor Seco Isotérmica)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.1.4.1.2',
    guideSection: 'Capítulo 3: Humectación Higrotérmica en Clima Seco',
    dimensionDefault: '0,35 m',
    description:
      'Lanza distribuidora de vapor seco de acero inoxidable micro-perforada con toberas de inyección de vapor contraflujo. Aumenta la humedad específica del aire sin variar prácticamente su temperatura seca (proceso isotérmico).',
    keyFeatures: [
      'Vapor seco libre de condensados gracias a cámara de recirculación y purga',
      'Válvula modulante de vapor de alta precisión con actuador electrónico [M]',
      'Separador de gotas posterior para evitar goteo en el interior de los conductos',
      'Control por higrostato modulante proporcional o sonda de conducto',
    ],
  },
  {
    type: 'fan',
    officialName: 'Ventilador Accionado Directamente / Plug-Fan (Fig. 2 Guía IDAE)',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 13779 (SFP) / Guía IDAE Fig. 2 (Pág. 16) & Pág. 18',
    guideSection: 'Sección 1.2.3: Ventilador de Acoplamiento Directo al Final de la Climatizadora',
    dimensionDefault: '0,50 m',
    description:
      'Configuración según Figura 2 de la Guía IDAE: ventilador con rodete centrífugo de acoplamiento directo situado al final de la climatizadora. Proporciona la presión para impulsar el aire tratado directamente hacia la red de conductos.',
    keyFeatures: [
      'Ubicación canónica IDAE Fig. 2: al final de la unidad impulsando a conductos',
      'Acoplamiento directo al eje sin correas ni poleas (mantenimiento mínimo)',
      'Tobera cónica de aspiración venturi con tomas de presión estática (Δp)',
      'Cota normalizada IDAE de 0,50 m de longitud (Págs. 17 y 18)',
    ],
  },
  {
    type: 'belt_fan',
    officialName: 'Ventilador Accionado con Correas y Poleas (Fig. 1 Guía IDAE)',
    normativeReference: 'UNE-EN 12792:2004 / Guía Técnica IDAE Fig. 1 (Pág. 16), Pág. 17 y Pág. 73',
    guideSection: 'Sección 1.2.3 & 4.3: Unidad con Ventilador de Correas y Poleas',
    dimensionDefault: '0,50 m',
    description:
      'Configuración canónica según Figura 1 de la Guía IDAE: ventilador centrífugo con voluta en espiral verde y rodete concéntrico, accionado mediante motor eléctrico exterior con poleas y correas trapezoidales en V.',
    keyFeatures: [
      'Simbología canónica IDAE Fig. 1 & Pág. 17: voluta en espiral con motor y poleas',
      'Polea motriz en motor y polea conducida en eje con tensor de correas',
      'Cota normalizada IDAE de 0,50 m de longitud y 0,42 m / 0,62 m de altura',
      'Boca de impulsión rectangular orientada hacia la derecha',
    ],
  },
  {
    type: 'final_filter',
    officialName: 'Filtro de Bolsas de Alta Eficacia (F7 / F8 / F9 - 0,40 m)',
    normativeReference: 'UNE-EN 779 / UNE-EN ISO 16890 / RITE IT 1.1.4.2.4 / Guía IDAE Fig. 1-2 (Pág. 16-18) & Pág. 73',
    guideSection: 'Sección 1.2.3: Filtros de Bolsas de Reducido Coste y Alta Eficacia',
    dimensionDefault: '0,40 m',
    description:
      'Filtro terminal de bolsas cónicas multibolsillo en color fucsia/magenta canónico de la Guía IDAE (con 4 o 5 bolsas trapezoidales que se extienden en la dirección del flujo de aire, según las figuras de las Páginas 16, 17, 18 y 73).',
    keyFeatures: [
      'Simbología canónica IDAE: 4-5 bolsas cónicas trapezoidales en fucsia/magenta',
      'Cota normalizada IDAE de 0,40 m de profundidad (Págs. 17 y 18)',
      'Clases de filtración RITE: F7 para IDA 2 / F8 para IDA 1 / F9',
      'Manómetro diferencial Magnehelic (ΔP) para control de colmatación',
    ],
  },
  {
    type: 'plenum',
    officialName: 'Sección Plenum de Inspección y Mantenimiento (0,40 m - Pág. 73)',
    normativeReference: 'RITE IT 1.3.3 / UNE-EN 1886 / Guía Técnica IDAE Sección 4.3 (Pág. 71/73)',
    guideSection: 'Sección 4.3: UTA con Sección Plenum Intermedia de Inspección',
    dimensionDefault: '0,40 m',
    description:
      'Cámara intermedia de paso y mantenimiento de 0,40 m de longitud (según el esquema oficial de la Pág. 73 de la Guía IDAE: Filtro F8 - Plenum - Ventilador - Prefiltro F6). Cuenta con puerta de acceso hermética con bisagras y mirilla de inspección.',
    keyFeatures: [
      'Configuración canónica IDAE Pág. 73: intercalado entre ventilador y filtro',
      'Puerta de acceso hermética con maneta de presión y mirilla circular de doble vidrio',
      'Cota normalizada de 0,40 m de profundidad (Pág. 73)',
      'Tomas para instrumentación de presión estática y temperatura',
    ],
  },
  {
    type: 'adiabatic_cooling',
    officialName: 'Sección de Enfriamiento Adiabático (Pág. 49 & 81 Guía IDAE)',
    normativeReference: 'RITE IT 1.2.4.5.2 / Guía Técnica IDAE Sección 2.5 & 4.4 (Pág. 49/79/81)',
    guideSection: 'Sección 2.5 & 4.4: Enfriamiento Adiabático y Recuperador de Calor',
    dimensionDefault: '0,45 m',
    description:
      'Sistema de enfriamiento evaporativo directo o indirecto con rampa vertical de toberas atomizadoras de microgotas de agua sobre la corriente de aire (según esquema técnico de las Páginas 49 y 81 de la Guía IDAE), con balsa inferior y bomba.',
    keyFeatures: [
      'Simbología oficial IDAE Pág. 81: toberas de aspersión pulverizadoras con cono de microgotas',
      'Balsa inferior de recogida de agua con bomba de recirculación [P]',
      'Separador de gotas alveolar posterior para evitar arrastre de agua líquida',
      'Aparato obligatorio por RITE IT 1.2.4.5.2 en el lado del aire de extracción con recuperador',
    ],
  },
  {
    type: 'droplet_eliminator',
    officialName: 'Separador de Gotas Alveolar en Onda Sinusoidal',
    normativeReference: 'UNE-EN 13053 / RITE IT 1.2.4.2.1 / Guía IDAE Pág. 79 & 81',
    guideSection: 'Sección 2.5: Prevención de Arrastre de Gotas Líquidas',
    dimensionDefault: '0,20 m',
    description:
      'Módulo de lamas perfiladas en onda sinusoidal o perfil chevron para retener mecánicamente las gotas de agua arrastradas tras la batería fría o tras el enfriador adiabático, conduciéndolas a la bandeja de condensados.',
    keyFeatures: [
      'Eficacia de separación de gotas del 99,9% para velocidades de aire de hasta 3,5 m/s',
      'Perfil alveolar de lamas en onda continua en color azul cian',
      'Baja pérdida de carga aerodinámica (ΔP ≤ 20 Pa)',
      'Bandeja inferior de recogida de condensados',
    ],
  },
  {
    type: 'rotary_wheel',
    officialName: 'Recuperador Rotativo de Rueda Entálpica (Rotor Higroscópico)',
    normativeReference: 'UNE-EN 308 / UNE-EN 13053 / RITE IT 1.2.4.5.2 / Guía IDAE Fig. 3 (Pág. 19)',
    guideSection: 'Capítulo 5 & Figura 3: Recuperación Entálpica Sensible y Latente',
    dimensionDefault: '0,60 m',
    description:
      'Rueda celular giratoria de matriz alveolar higroscópica que transfiere tanto calor sensible como humedad (latente) entre los flujos de extracción e impulsión, representada canónicamente en las UTAs de doble piso de la Guía IDAE.',
    keyFeatures: [
      'Rendimiento entálpico elevado (ηt hasta 80-85% sensible y latente)',
      'Motorreductor exterior con polea y correa perimetral de accionamiento',
      'Sector de purga autolimpiante para prevenir la recirculación de olores',
      'Divisoria central de estanqueidad entre conductos superior e inferior',
    ],
  },
  {
    type: 'return_fan',
    officialName: 'Ventilador de Retorno / Extracción (ETA / EHA)',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.2.4.5.3 / Guía IDAE Fig. 3 (Pág. 19) & Pág. 81',
    guideSection: 'Capítulo 2 & Figura 3: Sistema de Doble Ventilador (Impulsión + Retorno)',
    dimensionDefault: '0,50 m',
    description:
      'Ventilador de extracción que aspira el aire de retorno (ETA) de los locales para vencer la pérdida de carga del recuperador de calor y conductos, expulsándolo (EHA) o derivándolo a mezcla (RCA).',
    keyFeatures: [
      'Equilibrio de presiones estáticas del edificio (evita sobrepresiones o depresiones)',
      'Rodete con motor de alta eficiencia con variador de frecuencia',
      'Símbolo canónico IDAE para circuito superior o retorno en naranja/ámbar',
      'Permite régimen nocturno de purga y barrido higiénico (night cooling)',
    ],
  },
  {
    type: 'exhaust_damper',
    officialName: 'Compuerta Motorizada de Expulsión de Aire Viciado (EHA)',
    normativeReference: 'UNE-EN 12792:2004 / UNE-EN 13779 / RITE IT 1.2.4.5.1 / Guía IDAE Fig. 3-4',
    guideSection: 'Capítulo 4 & Figura 3: Esquemas de Free-Cooling y Expulsión',
    dimensionDefault: '0,35 m',
    description:
      'Compuerta motorizada de lamas opuestas instalada en la sección de descarga de aire viciado (EHA) al exterior, coordinada con la compuerta de toma exterior (ODA) y la de mezcla (RCA) para garantizar el balance en free-cooling.',
    keyFeatures: [
      'Lamas aerodinámicas perfiladas de aluminio con junta elastomérica',
      'Servomotor modulante con señal analógica 0-10 V [M]',
      'Visera de protección exterior con malla antipájaros',
      'Identificación UNE-EN 13779 en color Marrón EHA',
    ],
  },
  {
    type: 'silencer',
    officialName: 'Silenciador Acústico de Bafles Fonoabsorbentes',
    normativeReference: 'UNE-EN 12792:2004 / RITE IT 1.1.4.3',
    guideSection: 'Capítulo 7: Confort Acústico y Niveles Sonoros en Conductos',
    dimensionDefault: '0,45 m',
    description:
      'Bafles rectangulares longitudinales de lana mineral incombustible con velo de fibra de vidrio y perfil aerodinámico. Atenúa la presión sonora generada por el rodete del ventilador antes de alcanzar las rejillas del edificio.',
    keyFeatures: [
      'Bafles paralelos con puntas redondeadas aerodinámicas (ΔP ≤ 45 Pa)',
      'Atenuación acústica de 15 a 25 dB(A) en frecuencias medias y altas',
      'Lana mineral inerte e incombustible con protección antierosión',
      'Marco de chapa galvanizada reforzada',
    ],
  },
];

export interface IDAESectionSymbolProps {
  mod: AHUModuleItem;
  modWidth: number;
  isFlowActive: boolean;
  isWhiteTheme?: boolean;
  viewMode?: 'elevation' | 'plan';
}

export const IDAESectionSymbol: React.FC<IDAESectionSymbolProps> = ({
  mod,
  modWidth,
  isFlowActive,
  isWhiteTheme = true,
  viewMode = 'elevation',
}) => {
  const primaryStroke = isWhiteTheme ? '#0F172A' : '#E2E8F0';
  const mutedStroke = isWhiteTheme ? '#64748B' : '#94A3B8';
  const gridLine = isWhiteTheme ? '#CBD5E1' : '#334155';
  const casingBg = isWhiteTheme ? '#FFFFFF' : '#0B132B';
  const idaePink = '#E11D48'; // Color canónico fucsia/magenta de filtros IDAE
  const idaeGreen = '#10B981'; // Color verde de ventiladores y ODA
  const idaeBlue = '#0284C7'; // Color azul de baterías frías
  const idaeRed = '#DC2626'; // Color rojo de baterías calientes

  // ----------------------- 1. TOMA AIRE EXTERIOR (ODA) -----------------------
  if (mod.type === 'intake_damper') {
    const ratio = mod.params.outdoorRatio ?? 0.3;
    const bladeAngle = Math.round(ratio * 50);

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-intake-damper-plan">
          {/* Intake grill flange on left */}
          <line x1="6" y1="20" x2="6" y2="180" stroke={idaeGreen} strokeWidth="3" />
          {/* Top-down damper louvres axes */}
          {[40, 80, 120, 160].map((py, idx) => (
            <g key={`damper-plan-${py}`} transform={`translate(24, ${py})`}>
              <circle cx="0" cy="0" r="4" fill={idaeGreen} />
              <line
                x1="-14"
                y1="0"
                x2="14"
                y2="0"
                stroke={primaryStroke}
                strokeWidth="2.5"
                transform={`rotate(${bladeAngle})`}
              />
            </g>
          ))}
          {/* Flow vector arrows */}
          <g transform={`translate(${modWidth / 2}, 100)`}>
            <line x1="-15" y1="0" x2="15" y2="0" stroke={idaeGreen} strokeWidth="2.5" />
            <polygon points="15,0 9,-4 9,4" fill={idaeGreen} />
          </g>
        </g>
      );
    }

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
          {[20, 45, 70, 95, 120, 145].map((ly) => (
            <line
              key={`louvre-${ly}`}
              x1="2"
              y1={ly}
              x2="10"
              y2={ly + 8}
              stroke={idaeGreen}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
          <line x1="12" y1="0" x2="12" y2="165" stroke={idaeGreen} strokeWidth="1" strokeDasharray="2,2" />
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
            <circle cx="0" cy="-7" r="4.5" fill={idaeGreen} />
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
            const bladeLength = Math.max(24, modWidth - 52);
            return (
              <g key={`blade-${dy}`} transform={`translate(${bladeLength / 2}, ${dy})`}>
                <circle cx="0" cy="0" r="4" fill={isWhiteTheme ? '#047857' : '#10B981'} />
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
                <circle cx="12" cy="0" r="2" fill={primaryStroke} />
              </g>
            );
          })}
        </g>

        {/* ODA Technical badge */}
        <g transform={`translate(${modWidth / 2}, 175)`}>
          <rect
            x="-26"
            y="-10"
            width="52"
            height="18"
            rx="4"
            fill={isWhiteTheme ? '#ECFDF5' : '#064E3B'}
            stroke={idaeGreen}
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

  // ----------------------- 2. PREFILTRO ESTÁNDAR 0,40 M (F6 / G4) -----------------------
  if (mod.type === 'prefilter') {
    const pClass = mod.params.filterClass || 'F6';

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-prefilter-plan">
          <rect
            x="8"
            y="20"
            width={modWidth - 16}
            height="160"
            fill={isWhiteTheme ? '#FFF1F2' : '#2A0E18'}
            stroke={idaePink}
            strokeWidth="1.5"
          />
          {/* Wire backing mesh in plan */}
          <line x1="12" y1="25" x2={modWidth - 12} y2="175" stroke={idaePink} strokeWidth="1" strokeDasharray="3,3" />
          <line x1={modWidth - 12} y1="25" x2="12" y2="175" stroke={idaePink} strokeWidth="1" strokeDasharray="3,3" />
          <text
            x={modWidth / 2}
            y="105"
            textAnchor="middle"
            fill={idaePink}
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            PREFILTRO {pClass}
          </text>
        </g>
      );
    }

    return (
      <g className="idae-symbol-prefilter">
        {/* Outer metal filter subframe (Canónico IDAE Fig. 1, 2) */}
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="170"
          rx="2"
          fill={isWhiteTheme ? '#FFF1F2' : '#2A0E18'}
          stroke={idaePink}
          strokeWidth="1.8"
        />

        {/* Continuous Sharp V-Pleated Filter Media (Zig-zag en acordeón canónico Fig. 1, 2, 73) */}
        <path
          d={`M 14 22
             L ${modWidth - 14} 38 L 14 54
             L ${modWidth - 14} 70 L 14 86
             L ${modWidth - 14} 102 L 14 118
             L ${modWidth - 14} 134 L 14 150
             L ${modWidth - 14} 166 L 14 178`}
          fill="none"
          stroke={idaePink}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upstream / Downstream Differential Manometer (ΔP) Gauge according to IDAE */}
        <g transform={`translate(${modWidth / 2}, 8)`}>
          <circle cx="0" cy="0" r="9" fill={isWhiteTheme ? '#FFFFFF' : '#1E293B'} stroke={idaePink} strokeWidth="1.5" />
          <text x="0" y="3" textAnchor="middle" fill={idaePink} fontSize="7" fontWeight="bold" fontFamily="JetBrains Mono">
            ΔP
          </text>
          <path d="M -9 0 L -16 0 L -16 18" fill="none" stroke={mutedStroke} strokeWidth="1" strokeDasharray="2,1" />
          <path d="M 9 0 L 16 0 L 16 18" fill="none" stroke={mutedStroke} strokeWidth="1" strokeDasharray="2,1" />
        </g>

        {/* Quick-latch clamping handles */}
        <rect x="4" y="45" width="4" height="14" rx="1" fill={primaryStroke} />
        <rect x="4" y="135" width="4" height="14" rx="1" fill={primaryStroke} />

        {/* Canonical IDAE label badge */}
        <g transform={`translate(${modWidth / 2}, 175)`}>
          <rect
            x="-26"
            y="-10"
            width="52"
            height="18"
            rx="4"
            fill={isWhiteTheme ? '#FFE4E6' : '#4C0519'}
            stroke={idaePink}
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
            {pClass} (0,4m)
          </text>
        </g>
      </g>
    );
  }

  // ----------------------- 3. PREFILTRO PLANO COMPACTO 0,15 M (PÁG. 18 IDAE) -----------------------
  if (mod.type === 'prefilter_flat') {
    const pClass = mod.params.filterClass || 'G4';

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-prefilter-flat-plan">
          <rect
            x="4"
            y="20"
            width={modWidth - 8}
            height="160"
            fill={isWhiteTheme ? '#FFF1F2' : '#2A0E18'}
            stroke={idaePink}
            strokeWidth="1.5"
          />
          <line x1={modWidth / 2} y1="20" x2={modWidth / 2} y2="180" stroke={idaePink} strokeWidth="2" />
        </g>
      );
    }

    return (
      <g className="idae-symbol-prefilter-flat">
        {/* Compact narrow metal casing (0,15 m según Pág. 18 IDAE) */}
        <rect
          x="4"
          y="15"
          width={modWidth - 8}
          height="170"
          rx="2"
          fill={isWhiteTheme ? '#FFF1F2' : '#2A0E18'}
          stroke={idaePink}
          strokeWidth="1.8"
        />

        {/* Dense compact flat pleats (Pliegues densos en zig-zag Pág. 18) */}
        <path
          d={`M 8 20
             L ${modWidth - 8} 30 L 8 40
             L ${modWidth - 8} 50 L 8 60
             L ${modWidth - 8} 70 L 8 80
             L ${modWidth - 8} 90 L 8 100
             L ${modWidth - 8} 110 L 8 120
             L ${modWidth - 8} 130 L 8 140
             L ${modWidth - 8} 150 L 8 160
             L ${modWidth - 8} 170 L 8 180`}
          fill="none"
          stroke={idaePink}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Magnehelic gauge */}
        <g transform={`translate(${modWidth / 2}, 8)`}>
          <circle cx="0" cy="0" r="7.5" fill={isWhiteTheme ? '#FFFFFF' : '#1E293B'} stroke={idaePink} strokeWidth="1.2" />
          <text x="0" y="2.5" textAnchor="middle" fill={idaePink} fontSize="6" fontWeight="bold" fontFamily="JetBrains Mono">
            ΔP
          </text>
        </g>

        {/* Pág. 18 Badge: 0,15 m */}
        <g transform={`translate(${modWidth / 2}, 175)`}>
          <rect
            x="-22"
            y="-10"
            width="44"
            height="18"
            rx="4"
            fill={isWhiteTheme ? '#FFE4E6' : '#4C0519'}
            stroke={idaePink}
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill={isWhiteTheme ? '#9F1239' : '#FECDD3'}
            fontSize="8"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            {pClass}·0,15m
          </text>
        </g>
      </g>
    );
  }

  // ----------------------- 4. CÁMARA DE MEZCLA CON COMPUERTAS (FIG. 3 PÁG. 19) -----------------------
  if (mod.type === 'mixing_box') {
    const ratio = mod.params.outdoorRatio ?? 0.3;

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-mixing-box-plan">
          <rect
            x="8"
            y="20"
            width={modWidth - 16}
            height="160"
            fill={isWhiteTheme ? '#FFFBEB' : '#1F1607'}
            stroke="#F59E0B"
            strokeWidth="1.5"
          />
          <circle cx={modWidth / 2} cy="100" r="16" fill="#F59E0B" opacity="0.4" />
          <text x={modWidth / 2} y="104" textAnchor="middle" fill="#D97706" fontSize="10" fontWeight="bold">
            MEZCLA
          </text>
        </g>
      );
    }

    return (
      <g className="idae-symbol-mixing-box">
        {/* Mixing chamber body */}
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
          <g transform="translate(0, -5)">
            <line x1="0" y1="-8" x2="0" y2="4" stroke="#F59E0B" strokeWidth="2.5" />
            <polygon points="0,6 -4,0 4,0" fill="#F59E0B" />
            <text x="10" y="0" fill="#F59E0B" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono">
              RCA
            </text>
          </g>

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
          <line x1="0" y1="-11" x2="0" y2="-35" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" />
          <line x1="-11" y1="0" x2="-35" y2="0" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" />
        </g>

        {/* Lower ODA horizontal damper */}
        <g transform="translate(18, 115)">
          {[-18, 0, 18].map((dy) => (
            <g key={`mix-blade-${dy}`} transform={`translate(0, ${dy + 18})`}>
              <line x1="0" y1="0" x2="26" y2="0" stroke={idaeGreen} strokeWidth="2.5" />
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

        {/* Label */}
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

  // ----------------------- 5. RECUPERADOR DE CALOR DE PLACAS (PÁG. 19, 49, 81) -----------------------
  if (mod.type === 'heat_recovery') {
    const eff = mod.params.recoveryEfficiency ?? 0.75;

    return (
      <g className="idae-symbol-heat-recovery">
        {/* Main diamond/square cross-counterflow heat exchanger core (Guía IDAE Pág. 81) */}
        <g transform="translate(10, 24)">
          <rect
            x="0"
            y="0"
            width={modWidth - 20}
            height="140"
            rx="4"
            fill={isWhiteTheme ? '#F0F9FF' : '#0C1B2E'}
            stroke={idaeBlue}
            strokeWidth="2"
          />

          {/* Canonical IDAE crossing diagonals "X" dividing the 4 flow quadrants */}
          <line x1="0" y1="0" x2={modWidth - 20} y2="140" stroke={idaeBlue} strokeWidth="2.5" />
          <line x1={modWidth - 20} y1="0" x2="0" y2="140" stroke={idaeBlue} strokeWidth="2.5" />

          {/* Alternating counterflow plate matrix */}
          {[-2, -1, 0, 1, 2].map((idx) => {
            const offset = idx * 14;
            return (
              <line
                key={`rec-plate-${idx}`}
                x1={14 + (idx < 0 ? 0 : offset)}
                y1={idx < 0 ? -offset : 0}
                x2={modWidth - 34}
                y2={140 - (idx > 0 ? 0 : -offset)}
                stroke={gridLine}
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            );
          })}

          {/* ODA supply airflow vector (cold -> preheated) */}
          <path
            d={`M 10 105 Q ${(modWidth - 20) / 2} 70 ${modWidth - 30} 35`}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <polygon
            points={`${modWidth - 30},35 ${modWidth - 40},35 ${modWidth - 33},43`}
            fill="#38BDF8"
          />

          {/* ETA extract airflow vector in counterflow */}
          <path
            d={`M 10 35 Q ${(modWidth - 20) / 2} 70 ${modWidth - 30} 105`}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="4,2"
          />
          <polygon
            points={`${modWidth - 30},105 ${modWidth - 33},97 ${modWidth - 40},105`}
            fill="#F59E0B"
          />

          {/* Center efficiency badge according to IDAE RITE IT 1.2.4.5.2 */}
          <circle
            cx={(modWidth - 20) / 2}
            cy="70"
            r="16"
            fill={isWhiteTheme ? '#FFFFFF' : '#0369A1'}
            stroke={idaeBlue}
            strokeWidth="2"
          />
          <text
            x={(modWidth - 20) / 2}
            y="73"
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
        <g transform={`translate(${modWidth / 2}, 12)`}>
          <rect
            x="-26"
            y="-9"
            width="52"
            height="14"
            rx="2"
            fill={isWhiteTheme ? '#E0F2FE' : '#082F49'}
            stroke="#0284C7"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="1"
            textAnchor="middle"
            fill="#0284C7"
            fontSize="7"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            BY-PASS [M]
          </text>
        </g>

        {/* Sloped condensation drain tray under recovery section with P-trap */}
        <g transform="translate(12, 166)">
          <polygon
            points={`0,0 ${modWidth - 24},0 ${modWidth - 32},6 8,6`}
            fill="#0284C7"
            stroke="#38BDF8"
            strokeWidth="1"
          />
          <path
            d="M 18 6 L 18 16 Q 18 22 24 22 L 30 22 Q 36 22 36 16 L 36 20 Q 36 25 42 25 L 48 25"
            fill="none"
            stroke="#0284C7"
            strokeWidth="2"
          />
        </g>

        {/* Norm label */}
        <g transform={`translate(${modWidth / 2}, 184)`}>
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill={isWhiteTheme ? '#0369A1' : '#7DD3FC'}
            fontSize="8"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            Recuperador (RITE)
          </text>
        </g>
      </g>
    );
  }

  // ----------------------- 6. BATERÍA FRÍA (−) CANÓNICA IDAE (FIG. 1, 2, 11) -----------------------
  if (mod.type === 'cooling_coil') {
    const exitTdb = mod.params.exitTdb ?? 12.8;

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-cooling-coil-plan">
          <rect
            x="10"
            y="20"
            width={modWidth - 20}
            height="160"
            fill={isWhiteTheme ? '#F0F9FF' : '#082F49'}
            stroke={idaeBlue}
            strokeWidth="2"
          />
          {/* Tubes & headers from top */}
          {[30, 60, 90, 120, 150].map((ty) => (
            <circle key={`cool-tube-plan-${ty}`} cx={modWidth / 2} cy={ty} r="5" fill={idaeBlue} />
          ))}
          <text
            x={modWidth / 2}
            y="105"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="bold"
          >
            BATERÍA (−)
          </text>
        </g>
      );
    }

    return (
      <g className="idae-symbol-cooling-coil">
        {/* Outer coil casing */}
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="155"
          rx="3"
          fill={isWhiteTheme ? '#F0F9FF' : '#082F49'}
          stroke={idaeBlue}
          strokeWidth="2"
        />

        {/* CANONICAL IDAE DIAGONAL CROSS "X" FROM CORNER TO CORNER (FIG. 1, 2, 11, 16) */}
        <line x1="12" y1="18" x2={modWidth - 12} y2="167" stroke={idaeBlue} strokeWidth="1.8" strokeDasharray="4,2" />
        <line x1={modWidth - 12} y1="18" x2="12" y2="167" stroke={idaeBlue} strokeWidth="1.8" strokeDasharray="4,2" />

        {/* Staggered Multi-Row Copper Tube Array (Matriz en tresbolillo) */}
        <g transform="translate(16, 24)">
          {[0, 1, 2, 3].map((col) => {
            const cx = col * 18 + 8;
            const yOffset = col % 2 === 0 ? 0 : 9;
            return (
              <g key={`cool-col-${col}`}>
                <line x1={cx} y1="0" x2={cx} y2="136" stroke={gridLine} strokeWidth="1" />
                {[12, 30, 48, 66, 84, 102, 120].map((rowY) => (
                  <circle
                    key={`tube-${col}-${rowY}`}
                    cx={cx}
                    cy={rowY + yOffset}
                    r="3.8"
                    fill={idaeBlue}
                    stroke="#38BDF8"
                    strokeWidth="1"
                    opacity="0.85"
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* CANONICAL IDAE SIGN BOX "[−]" IN UPPER-RIGHT / CENTER (FIG. 1, 2, 11) */}
        <g transform={`translate(${modWidth - 28}, 28)`}>
          <rect x="-10" y="-10" width="20" height="20" rx="3" fill={idaeBlue} stroke="#BAE6FD" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">−</text>
        </g>

        {/* Droplet eliminator lamas downstream */}
        <g transform={`translate(${modWidth - 18}, 24)`}>
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

        {/* Proportional 3-Way Valve with Servomotor M */}
        <g transform={`translate(${modWidth / 2}, 6)`}>
          <polygon points="-7,-4 0,0 -7,4" fill={idaeBlue} />
          <polygon points="7,-4 0,0 7,4" fill={idaeBlue} />
          <circle cx="0" cy="-12" r="4.5" fill="#38BDF8" />
          <text x="0" y="-10" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="bold">
            M
          </text>
        </g>

        {/* Sloped Stainless Steel Condensate Tray with P-trap Siphon */}
        <g transform="translate(8, 168)">
          <polygon
            points={`0,0 ${modWidth - 16},0 ${modWidth - 22},12 6,12`}
            fill={idaeBlue}
            stroke="#38BDF8"
            strokeWidth="1.5"
          />
          <path
            d="M 18 12 L 18 24 Q 18 30 25 30 L 32 30 Q 39 30 39 24 L 39 28 Q 39 34 46 34 L 54 34"
            fill="none"
            stroke={idaeBlue}
            strokeWidth="2.5"
          />
          <circle cx="39" cy="27" r="3" fill="#38BDF8" />
        </g>

        {/* Falling condensate droplets */}
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
            stroke={idaeBlue}
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

  // ----------------------- 7. BATERÍA CALOR (+) CANÓNICA IDAE (FIG. 1, 2, 11, 16) -----------------------
  if (mod.type === 'heating_coil') {
    const heatTdb = mod.params.heatingTdb ?? 16.5;

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-heating-coil-plan">
          <rect
            x="10"
            y="20"
            width={modWidth - 20}
            height="160"
            fill={isWhiteTheme ? '#FFF1F2' : '#450A0A'}
            stroke={idaeRed}
            strokeWidth="2"
          />
          {[30, 60, 90, 120, 150].map((ty) => (
            <circle key={`heat-tube-plan-${ty}`} cx={modWidth / 2} cy={ty} r="5" fill={idaeRed} />
          ))}
          <text
            x={modWidth / 2}
            y="105"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="bold"
          >
            BATERÍA (+)
          </text>
        </g>
      );
    }

    return (
      <g className="idae-symbol-heating-coil">
        {/* Outer coil casing */}
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="155"
          rx="3"
          fill={isWhiteTheme ? '#FFF1F2' : '#450A0A'}
          stroke={idaeRed}
          strokeWidth="2"
        />

        {/* CANONICAL IDAE DIAGONAL CROSS "X" FROM CORNER TO CORNER (FIG. 1, 2, 11, 16) */}
        <line x1="12" y1="18" x2={modWidth - 12} y2="167" stroke={idaeRed} strokeWidth="1.8" strokeDasharray="4,2" />
        <line x1={modWidth - 12} y1="18" x2="12" y2="167" stroke={idaeRed} strokeWidth="1.8" strokeDasharray="4,2" />

        {/* Thermal Red Finned Tubes in Staggered Matrix */}
        <g transform="translate(16, 24)">
          {[0, 1, 2].map((col) => {
            const cx = col * 20 + 10;
            const yOffset = col % 2 === 0 ? 0 : 10;
            return (
              <g key={`heat-col-${col}`}>
                <line
                  x1={cx}
                  y1="0"
                  x2={cx}
                  y2="136"
                  stroke={isWhiteTheme ? '#FECDD3' : '#7F1D1D'}
                  strokeWidth="1.5"
                />
                {[12, 32, 52, 72, 92, 112].map((rowY) => (
                  <circle
                    key={`heat-tube-${col}-${rowY}`}
                    cx={cx}
                    cy={rowY + yOffset}
                    r="4.2"
                    fill="#EF4444"
                    stroke={idaeRed}
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* CANONICAL IDAE SIGN BOX "[+]" IN UPPER-RIGHT / CENTER (FIG. 1, 2, 11, 16) */}
        <g transform={`translate(${modWidth - 28}, 28)`}>
          <rect x="-10" y="-10" width="20" height="20" rx="3" fill={idaeRed} stroke="#FEE2E2" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="bold">+</text>
        </g>

        {/* Safety Anti-Freeze Capillary Thermostat (Frost Stat) */}
        <g transform="translate(14, 28)">
          <path
            d={`M 0 0 Q ${modWidth - 28} 40 0 80 Q ${modWidth - 28} 120 0 130`}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
          <circle cx="0" cy="0" r="3" fill="#F59E0B" />
        </g>

        {/* Modulating Valve with Actuator M */}
        <g transform={`translate(${modWidth / 2}, 6)`}>
          <polygon points="-7,-4 0,0 -7,4" fill={idaeRed} />
          <polygon points="7,-4 0,0 7,4" fill={idaeRed} />
          <circle cx="0" cy="-12" r="4.5" fill="#EF4444" />
          <text x="0" y="-10" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="bold">
            M
          </text>
        </g>

        {/* Heat Badge */}
        <g transform={`translate(${modWidth / 2}, 184)`}>
          <rect
            x="-28"
            y="-10"
            width="56"
            height="18"
            rx="4"
            fill={isWhiteTheme ? '#FEE2E2' : '#991B1B'}
            stroke={idaeRed}
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

  // ----------------------- 8. BATERÍA RESISTENCIAS ELÉCTRICAS (FIG. 11 PÁG. 24) -----------------------
  if (mod.type === 'electric_heater') {
    const heatTdb = mod.params.heatingTdb ?? 20.0;

    return (
      <g className="idae-symbol-electric-heater">
        {/* Outer casing */}
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="155"
          rx="3"
          fill={isWhiteTheme ? '#FFF1F2' : '#450A0A'}
          stroke={idaeRed}
          strokeWidth="2"
        />

        {/* Canonical IDAE Diagonal Cross "X" */}
        <line x1="12" y1="18" x2={modWidth - 12} y2="167" stroke={idaeRed} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
        <line x1={modWidth - 12} y1="18" x2="12" y2="167" stroke={idaeRed} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />

        {/* Armored Electrical Resistance Rods in Heating Wave */}
        <g transform="translate(18, 28)">
          {[0, 1].map((col) => {
            const cx = col * 30 + 14;
            return (
              <path
                key={`elec-rod-${col}`}
                d={`M ${cx} 6
                    L ${cx + 9} 22 L ${cx - 9} 38
                    L ${cx + 9} 54 L ${cx - 9} 70
                    L ${cx + 9} 86 L ${cx - 9} 102
                    L ${cx + 9} 118 L ${cx} 128`}
                fill="none"
                stroke="#EF4444"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isFlowActive ? 'animate-pulse' : ''}
              />
            );
          })}
        </g>

        {/* CANONICAL IDAE SIGN BOX "[+]" WITH ELECTRICAL LIGHTNING BOLT ⚡ */}
        <g transform={`translate(${modWidth - 28}, 28)`}>
          <rect x="-10" y="-10" width="20" height="20" rx="3" fill={idaeRed} stroke="#FEE2E2" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">+</text>
        </g>

        {/* High-limit Safety Thermostat */}
        <g transform={`translate(${modWidth / 2}, 16)`}>
          <circle cx="0" cy="0" r="5.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
          <text x="0" y="2" textAnchor="middle" fill="#000000" fontSize="6.5" fontWeight="bold">TS</text>
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
            stroke={idaeRed}
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

  // ----------------------- 9. VENTILADOR ACCIONADO CON CORREAS Y POLEAS (FIG. 1, PÁG. 16, 17, 73) -----------------------
  if (mod.type === 'belt_fan') {
    const pEst = mod.params.staticPressurePa ?? 550;

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-belt-fan-plan">
          {/* Centrifugal fan from top (Pág. 17 & 18 en planta) */}
          <rect
            x="8"
            y="20"
            width={modWidth - 16}
            height="160"
            rx="4"
            fill={isWhiteTheme ? '#ECFDF5' : '#03251E'}
            stroke={idaeGreen}
            strokeWidth="2"
          />
          <circle cx={modWidth / 2 - 10} cy="100" r="38" fill={isWhiteTheme ? '#FFFFFF' : '#064E3B'} stroke={idaeGreen} strokeWidth="2" />
          {/* External motor on side (Pág. 17) */}
          <rect x={modWidth - 32} y="75" width="24" height="50" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          <text x={modWidth - 20} y="103" textAnchor="middle" fill="#34D399" fontSize="8" fontWeight="bold">MOT</text>
          {/* Pulleys & Belt */}
          <line x1={modWidth / 2 - 10} y1="100" x2={modWidth - 20} y2="100" stroke="#D97706" strokeWidth="3" strokeDasharray="3,2" />
        </g>
      );
    }

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
          stroke={idaeGreen}
          strokeWidth="2"
        />

        {/* CANONICAL IDAE CENTRIFUGAL SCROLL VOLUTE (VOLUTA EN CARACOL VERDE FIG. 1 PÁG. 16 & PÁG. 17) */}
        <g transform="translate(18, 25)">
          <path
            d={`M 40 45
                A 38 38 0 1 0 78 83
                L 98 83
                L 98 25
                L 55 25
                Z`}
            fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
            stroke={idaeGreen}
            strokeWidth="2.5"
          />

          {/* Impeller Wheel with double circles & curved blades (Pág. 17) */}
          <g transform="translate(40, 83)">
            <circle cx="0" cy="0" r="28" fill={isWhiteTheme ? '#FFFFFF' : '#0F372C'} stroke={idaeGreen} strokeWidth="2" />
            <circle cx="0" cy="0" r="10" fill="#047857" stroke="#34D399" strokeWidth="1.5" />

            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <path
                key={`belt-blade-${deg}`}
                d="M 10 0 Q 20 -4 27 -12"
                fill="none"
                stroke={idaeGreen}
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${deg})`}
              />
            ))}

            {/* Driven shaft pulley */}
            <circle cx="0" cy="0" r="7" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="2.5" fill="#F8FAFC" />
          </g>
        </g>

        {/* External Electric Motor & Transmission Belt Drive (Fig. 1 IDAE) */}
        <g transform={`translate(${modWidth - 44}, 30)`}>
          <rect x="0" y="70" width="32" height="48" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          {[78, 86, 94, 102, 110].map((fy) => (
            <line key={`mot-belt-fin-${fy}`} x1="0" y1={fy} x2="32" y2={fy} stroke="#334155" strokeWidth="1" />
          ))}
          <text x="16" y="98" textAnchor="middle" fill="#34D399" fontSize="8" fontWeight="bold">MOTOR</text>

          {/* Driving pulley on motor shaft */}
          <circle cx="16" cy="125" r="9" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="16" cy="125" r="3" fill="#F8FAFC" />

          {/* V-Belts to impeller pulley */}
          <path
            d="M 8 123 L -24 75 M 24 127 L -10 89"
            stroke="#D97706"
            strokeWidth="2.5"
            strokeDasharray="4,2"
          />
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
            stroke={idaeGreen}
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

  // ----------------------- 10. VENTILADOR ACOPLAMIENTO DIRECTO (FIG. 2 PÁG. 16 & PÁG. 18) -----------------------
  if (mod.type === 'fan') {
    const pEst = mod.params.staticPressurePa ?? 450;

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-fan-plan">
          <rect
            x="8"
            y="20"
            width={modWidth - 16}
            height="160"
            rx="4"
            fill={isWhiteTheme ? '#ECFDF5' : '#03251E'}
            stroke={idaeGreen}
            strokeWidth="2"
          />
          <circle cx={modWidth / 2} cy="100" r="42" fill={isWhiteTheme ? '#FFFFFF' : '#064E3B'} stroke={idaeGreen} strokeWidth="2" />
          <circle cx={modWidth / 2} cy="100" r="16" fill="#047857" stroke="#34D399" strokeWidth="2" />
          <text x={modWidth / 2} y="104" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">DIRECTO</text>
        </g>
      );
    }

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
          stroke={idaeGreen}
          strokeWidth="2"
        />

        {/* Calibrated Suction Nozzle Cone (Tobera venturi con tomas Δp) */}
        <path
          d="M 16 40 L 42 60 L 42 135 L 16 155 Z"
          fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
          stroke="#059669"
          strokeWidth="1.5"
        />
        <circle cx="38" cy="65" r="2.5" fill="#34D399" />
        <circle cx="38" cy="130" r="2.5" fill="#34D399" />

        {/* Canonical Direct Drive Impeller (Fig. 2 Guía IDAE) */}
        <g transform={`translate(${modWidth / 2 - 5}, 97)`}>
          <circle
            cx="0"
            cy="0"
            r="46"
            fill={isWhiteTheme ? '#FFFFFF' : '#064E3B'}
            stroke={idaeGreen}
            strokeWidth="2.5"
          />
          <circle cx="0" cy="0" r="14" fill="#047857" stroke="#34D399" strokeWidth="2" />

          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <path
              key={`blade-fan-${deg}`}
              d="M 14 0 Q 30 -5 44 -18"
              fill="none"
              stroke={idaeGreen}
              strokeWidth="3.5"
              strokeLinecap="round"
              transform={`rotate(${deg})`}
            />
          ))}

          <polygon points="24,-24 22,-16 29,-18" fill="#34D399" />
        </g>

        {/* Directly Coupled Motor Body (Sin correas Fig. 2) */}
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
          {[10, 20, 30, 40, 50].map((fy) => (
            <line key={`mot-fin-${fy}`} x1="0" y1={fy} x2="28" y2={fy} stroke={gridLine} strokeWidth="1" />
          ))}
          <text
            x="14"
            y="36"
            textAnchor="middle"
            fill={idaeGreen}
            fontSize="9"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            EC
          </text>
        </g>

        {/* Antivibration Canvas Flexible Sleeve on discharge */}
        <g transform={`translate(${modWidth - 14}, 50)`}>
          <line x1="0" y1="0" x2="0" y2="95" stroke="#F59E0B" strokeWidth="3" strokeDasharray="3,3" />
        </g>

        {/* Antivibration spring foot mounts */}
        <g transform={`translate(${modWidth / 2 - 20}, 180)`}>
          <rect x="-10" y="0" width="20" height="6" fill="#475569" rx="1" />
          <path d="M -6 0 L -3 -6 L 0 0 L 3 -6 L 6 0" fill="none" stroke="#94A3B8" strokeWidth="2" />
        </g>
        <g transform={`translate(${modWidth / 2 + 25}, 180)`}>
          <rect x="-10" y="0" width="20" height="6" fill="#475569" rx="1" />
          <path d="M -6 0 L -3 -6 L 0 0 L 3 -6 L 6 0" fill="none" stroke="#94A3B8" strokeWidth="2" />
        </g>

        {/* Badge */}
        <g transform={`translate(${modWidth / 2}, 184)`}>
          <rect
            x="-44"
            y="-10"
            width="88"
            height="18"
            rx="4"
            fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
            stroke={idaeGreen}
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
            Ventilador (directo)
          </text>
        </g>
      </g>
    );
  }

  // ----------------------- 11. FILTRO DE BOLSAS FINAL (F7 / F8 / F9 - PÁG. 16, 17, 18, 73, 81) -----------------------
  if (mod.type === 'final_filter') {
    const fClass = mod.params.filterClass || 'F7';

    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-final-filter-plan">
          {/* Authentic Plan View from Page 17 & 18: 4 parallel bag pockets side-by-side */}
          <rect
            x="8"
            y="20"
            width={modWidth - 16}
            height="160"
            fill={isWhiteTheme ? '#FDF2F8' : '#270817'}
            stroke={idaePink}
            strokeWidth="1.8"
          />
          {[35, 75, 115, 155].map((by) => (
            <g key={`bag-plan-${by}`}>
              <polygon
                points={`14,${by - 12} ${modWidth - 14},${by - 5} ${modWidth - 14},${by + 5} 14,${by + 12}`}
                fill={isWhiteTheme ? '#FCE7F3' : '#4A0D2A'}
                stroke={idaePink}
                strokeWidth="1.5"
              />
              <line x1="14" y1={by} x2={modWidth - 16} y2={by} stroke={idaePink} strokeWidth="1" strokeDasharray="2,2" />
            </g>
          ))}
          <text
            x={modWidth / 2}
            y="105"
            textAnchor="middle"
            fill={idaePink}
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            BOLSAS {fClass}
          </text>
        </g>
      );
    }

    return (
      <g className="idae-symbol-final-filter">
        {/* Outer frame */}
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="170"
          rx="2"
          fill={isWhiteTheme ? '#FDF2F8' : '#270817'}
          stroke={idaePink}
          strokeWidth="1.8"
        />

        {/* CANONICAL IDAE BAG FILTER: 4 TAPERED CONICAL POCKETS EXTENDING TO THE RIGHT (FIG. 1, 2, 73, 81) */}
        <g transform="translate(14, 20)">
          {[0, 1, 2, 3].map((pocketIdx) => {
            const py = pocketIdx * 38 + 18;
            const pocketLength = modWidth - 32;
            return (
              <g key={`pocket-${pocketIdx}`}>
                {/* Tapered conical pocket extending horizontally */}
                <path
                  d={`M 0 ${py - 14}
                      L ${pocketLength} ${py - 4}
                      L ${pocketLength} ${py + 4}
                      L 0 ${py + 14} Z`}
                  fill={isWhiteTheme ? '#FCE7F3' : '#4A0D2A'}
                  stroke={idaePink}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                {/* Reinforcement seams and airflow channels */}
                <line
                  x1="4"
                  y1={py}
                  x2={pocketLength - 4}
                  y2={py}
                  stroke={idaePink}
                  strokeWidth="1.2"
                  strokeDasharray="3,2"
                />
                {/* Front pocket mouth collar */}
                <line x1="0" y1={py - 14} x2="0" y2={py + 14} stroke={idaePink} strokeWidth="3" />
              </g>
            );
          })}
        </g>

        {/* Differential pressure gauge (Magnehelic ΔP) */}
        <g transform={`translate(${modWidth / 2}, 8)`}>
          <circle cx="0" cy="0" r="9" fill={isWhiteTheme ? '#FFFFFF' : '#1E293B'} stroke={idaePink} strokeWidth="1.5" />
          <text x="0" y="3" textAnchor="middle" fill={idaePink} fontSize="7" fontWeight="bold" fontFamily="JetBrains Mono">
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
            stroke={idaePink}
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
            Filtro {fClass}
          </text>
        </g>
      </g>
    );
  }

  // ----------------------- 12. SECCIÓN PLENUM DE INSPECCIÓN (PÁG. 71, 73) -----------------------
  if (mod.type === 'plenum') {
    if (viewMode === 'plan') {
      return (
        <g className="idae-symbol-plenum-plan">
          <rect
            x="8"
            y="20"
            width={modWidth - 16}
            height="160"
            fill={isWhiteTheme ? '#F8FAFC' : '#0F172A'}
            stroke="#94A3B8"
            strokeWidth="1.8"
          />
          {/* Access door on the side in plan view */}
          <rect x={modWidth - 8} y="60" width="4" height="80" fill="#64748B" />
          <line x1={modWidth - 8} y1="60" x2={modWidth + 12} y2="40" stroke="#0284C7" strokeWidth="2" />
          <text x={modWidth / 2} y="105" textAnchor="middle" fill="#64748B" fontSize="10" fontWeight="bold">
            PLENUM
          </text>
        </g>
      );
    }

    return (
      <g className="idae-symbol-plenum">
        {/* Spacious free airflow expansion plenum (Pág. 73 Guía IDAE: Filtro F8 - Plenum - Ventilador - Prefiltro F6) */}
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

        {/* Sealed Inspection Access Door with heavy hinges and latch */}
        <g transform="translate(16, 25)">
          <rect
            x="0"
            y="0"
            width={modWidth - 32}
            height="135"
            rx="4"
            fill={isWhiteTheme ? '#F1F5F9' : '#1E293B'}
            stroke="#64748B"
            strokeWidth="1.5"
          />

          <rect x="-2" y="20" width="4" height="12" fill="#475569" rx="1" />
          <rect x="-2" y="105" width="4" height="12" fill="#475569" rx="1" />

          {/* Rotary Compression Handle */}
          <g transform={`translate(${modWidth - 42}, 68)`}>
            <circle cx="0" cy="0" r="4.5" fill="#94A3B8" />
            <line x1="0" y1="0" x2="0" y2="16" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Circular Inspection Porthole with double glass & reflection */}
          <g transform={`translate(${(modWidth - 32) / 2}, 60)`}>
            <circle cx="0" cy="0" r="18" fill={isWhiteTheme ? '#E0F2FE' : '#082F49'} stroke="#0284C7" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill={isWhiteTheme ? '#BAE6FD' : '#0C4A6E'} opacity="0.6" />
            <path d="M -8 -8 L 8 8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </g>

          {/* Interior ceiling maintenance luminaire */}
          <g transform={`translate(${(modWidth - 32) / 2}, 12)`}>
            <rect x="-10" y="0" width="20" height="6" rx="2" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />
            <polygon
              points="-10,6 10,6 24,120 -24,120"
              fill="#FEF08A"
              fillOpacity="0.08"
              className={isFlowActive ? 'animate-pulse' : ''}
            />
          </g>
        </g>

        {/* Pressure & Temperature test ports */}
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
            Plenum (0,4m)
          </text>
        </g>
      </g>
    );
  }

  // ----------------------- 13. ENFRIAMIENTO ADIABÁTICO (PÁG. 49 & 81) -----------------------
  if (mod.type === 'adiabatic_cooling') {
    return (
      <g className="idae-symbol-adiabatic-cooling">
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="170"
          rx="4"
          fill={isWhiteTheme ? '#F0F9FF' : '#082F49'}
          stroke={idaeBlue}
          strokeWidth="2"
        />

        {/* Spray Manifold (Rampa de agua con toberas pulverizadoras - Pág. 79/81) */}
        <g transform="translate(20, 25)">
          <line x1="12" y1="0" x2="12" y2="125" stroke={idaeBlue} strokeWidth="4" strokeLinecap="round" />
          <circle cx="12" cy="0" r="4.5" fill="#38BDF8" />

          {[18, 50, 82, 114].map((ny) => (
            <g key={`spray-nozzle-${ny}`} transform={`translate(12, ${ny})`}>
              <rect x="-3" y="-5" width="6" height="10" rx="1" fill="#0369A1" stroke="#38BDF8" strokeWidth="1" />
              <line x1="0" y1="0" x2="-8" y2="0" stroke={idaeBlue} strokeWidth="2.5" />
              <path
                d="M -8 0 L -28 -14 L -28 14 Z"
                fill="#38BDF8"
                fillOpacity="0.25"
                stroke="#38BDF8"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle cx="-16" cy="-4" r="1.5" fill="#38BDF8" className={isFlowActive ? 'animate-ping' : ''} />
              <circle cx="-22" cy="6" r="1.2" fill="#0EA5E9" />
              <circle cx="-25" cy="-2" r="1.8" fill="#38BDF8" />
            </g>
          ))}
        </g>

        {/* High-efficiency Droplet Eliminator (Separador de gotas alveolar posterior) */}
        <g transform={`translate(${modWidth - 28}, 26)`}>
          <rect x="0" y="0" width="14" height="135" fill={isWhiteTheme ? '#E0F2FE' : '#0C4A6E'} rx="2" stroke={idaeBlue} strokeWidth="1" />
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

        {/* Bottom Water Collection Basin with Pump */}
        <g transform="translate(10, 160)">
          <rect x="0" y="0" width={modWidth - 20} height="20" rx="2" fill="#0369A1" stroke="#38BDF8" strokeWidth="1.2" />
          <path
            d={`M 4 5 Q 14 2 24 5 T 44 5 T 64 5 T 84 5 T ${modWidth - 28} 5`}
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="1.5"
          />
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
            stroke={idaeBlue}
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill={isWhiteTheme ? '#0369A1' : '#E0F2FE'}
            fontSize="8"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            Enfriam. adiabático
          </text>
        </g>
      </g>
    );
  }

  // ----------------------- 14. SEPARADOR DE GOTAS ALVEOLAR -----------------------
  if (mod.type === 'droplet_eliminator') {
    return (
      <g className="idae-symbol-droplet-eliminator">
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="170"
          rx="3"
          fill={isWhiteTheme ? '#F0F9FF' : '#082F49'}
          stroke={idaeBlue}
          strokeWidth="1.8"
        />

        {/* Vertical Sinusoidal Wave Separator Louvres */}
        <g transform="translate(16, 24)">
          {[0, 1, 2].map((col) => {
            const cx = col * 14 + 6;
            return (
              <g key={`drop-wave-col-${col}`}>
                {[10, 32, 54, 76, 98, 120].map((wy) => (
                  <path
                    key={`wave-${col}-${wy}`}
                    d={`M ${cx - 5} ${wy} Q ${cx} ${wy + 6} ${cx + 5} ${wy} Q ${cx + 10} ${wy - 6} ${cx + 15} ${wy}`}
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

        {/* Catchment tray */}
        <g transform="translate(10, 164)">
          <polygon
            points={`0,0 ${modWidth - 20},0 ${modWidth - 26},8 6,8`}
            fill="#0369A1"
            stroke="#38BDF8"
            strokeWidth="1.2"
          />
        </g>

        <g transform={`translate(${modWidth / 2}, 184)`}>
          <rect
            x="-34"
            y="-10"
            width="68"
            height="18"
            rx="4"
            fill={isWhiteTheme ? '#E0F2FE' : '#0C4A6E'}
            stroke={idaeBlue}
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

  // ----------------------- 15. RUEDA ENTÁLPICA ROTATIVA (FIG. 3 PÁG. 19) -----------------------
  if (mod.type === 'rotary_wheel') {
    const eff = mod.params.recoveryEfficiency ?? 0.78;

    return (
      <g className="idae-symbol-rotary-wheel">
        <rect
          x="8"
          y="15"
          width={modWidth - 16}
          height="170"
          rx="4"
          fill={isWhiteTheme ? '#F0FDF4' : '#042217'}
          stroke={idaeGreen}
          strokeWidth="2"
        />

        <g transform={`translate(${modWidth / 2}, 95)`}>
          <circle
            cx="0"
            cy="0"
            r="60"
            fill={isWhiteTheme ? '#FFFFFF' : '#0B132B'}
            stroke={idaeGreen}
            strokeWidth="3"
          />
          <circle cx="0" cy="0" r="48" fill="none" stroke={gridLine} strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="0" cy="0" r="32" fill="none" stroke={gridLine} strokeWidth="1" strokeDasharray="2,2" />

          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={`rotor-spoke-${deg}`}
              x1="0"
              y1="0"
              x2={58 * Math.cos((deg * Math.PI) / 180)}
              y2={58 * Math.sin((deg * Math.PI) / 180)}
              stroke={deg % 90 === 0 ? idaeGreen : gridLine}
              strokeWidth={deg % 90 === 0 ? '2' : '1'}
            />
          ))}

          <line x1="-60" y1="0" x2="60" y2="0" stroke="#059669" strokeWidth="2.5" />

          {/* Purge Sector */}
          <path
            d="M 0 0 L 22 -56 A 60 60 0 0 1 42 -44 Z"
            fill="#F59E0B"
            fillOpacity={isWhiteTheme ? '0.4' : '0.35'}
            stroke="#D97706"
            strokeWidth="1.5"
          />

          <circle cx="0" cy="0" r="11" fill="#047857" stroke="#34D399" strokeWidth="2" />
          <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
        </g>

        {/* Gearmotor */}
        <g transform={`translate(${modWidth - 32}, 22)`}>
          <rect x="0" y="0" width="20" height="26" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
          <circle cx="10" cy="13" r="5" fill={idaeGreen} />
          <text x="10" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">M</text>
        </g>

        <g transform={`translate(${modWidth / 2}, 184)`}>
          <rect
            x="-38"
            y="-10"
            width="76"
            height="18"
            rx="4"
            fill={isWhiteTheme ? '#D1FAE5' : '#064E3B'}
            stroke={idaeGreen}
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

  // ----------------------- 16. VENTILADOR DE RETORNO / EXTRACCIÓN (ETA) -----------------------
  if (mod.type === 'return_fan') {
    const pEst = mod.params.staticPressurePa ?? 380;

    return (
      <g className="idae-symbol-return-fan">
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

        <path
          d="M 16 45 L 40 65 L 40 130 L 16 150 Z"
          fill={isWhiteTheme ? '#FDE68A' : '#451A03'}
          stroke="#D97706"
          strokeWidth="1.5"
        />

        <g transform={`translate(${modWidth / 2 - 5}, 97)`}>
          <circle cx="0" cy="0" r="44" fill={isWhiteTheme ? '#FFFFFF' : '#451A03'} stroke="#D97706" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="14" fill="#B45309" stroke="#FBBF24" strokeWidth="2" />

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

          <polygon points="22,-22 20,-14 27,-16" fill="#FBBF24" />
        </g>

        <g transform={`translate(${modWidth - 42}, 65)`}>
          <rect x="0" y="0" width="28" height="65" rx="3" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {[12, 24, 36, 48].map((fy) => (
            <line key={`ret-mot-fin-${fy}`} x1="0" y1={fy} x2="28" y2={fy} stroke="#475569" strokeWidth="1" />
          ))}
          <text x="14" y="36" textAnchor="middle" fill="#FBBF24" fontSize="8" fontWeight="bold">ETA</text>
        </g>

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

  // ----------------------- 17. COMPUERTA DE EXPULSIÓN (EHA) -----------------------
  if (mod.type === 'exhaust_damper') {
    return (
      <g className="idae-symbol-exhaust-damper">
        <g transform="translate(18, 20)">
          <g transform={`translate(${(modWidth - 45) / 2}, -10)`}>
            <rect x="-12" y="-14" width="24" height="14" rx="2" fill={isWhiteTheme ? '#E2E8F0' : '#1E293B'} stroke={primaryStroke} strokeWidth="1.5" />
            <circle cx="0" cy="-7" r="4.5" fill="#92400E" />
            <text x="0" y="-4" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold">M</text>
            <line x1="0" y1="0" x2="0" y2="15" stroke={primaryStroke} strokeWidth="2" />
          </g>

          {[25, 60, 95, 130].map((dy, idx) => {
            const sign = idx % 2 === 0 ? 1 : -1;
            const angle = sign * 35;
            const bladeLength = Math.max(20, modWidth - 48);
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

        {/* Rain Hood */}
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

  // ----------------------- 18. SILENCIADOR ACÚSTICO DE BAFLES -----------------------
  if (mod.type === 'silencer') {
    const att = mod.params.attenuationDb ?? 18;

    return (
      <g className="idae-symbol-silencer">
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

        {[22, 60, 98, 136].map((sy) => (
          <g key={`baffle-${sy}`} transform={`translate(14, ${sy})`}>
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

  // ----------------------- 19. HUMIDIFICADOR DE VAPOR SECO -----------------------
  if (mod.type === 'humidifier') {
    return (
      <g className="idae-symbol-humidifier">
        <g transform="translate(14, 25)">
          <line x1={modWidth / 2 - 25} y1="0" x2={modWidth / 2 - 25} y2="135" stroke="#A855F7" strokeWidth="4" />

          {[20, 45, 70, 95, 120].map((ny) => (
            <g key={`lance-nozzle-${ny}`} transform={`translate(${modWidth / 2 - 25}, ${ny})`}>
              <line x1="0" y1="0" x2="-8" y2="0" stroke="#C084FC" strokeWidth="2.5" />
              <path
                d="M -10 -4 Q -20 -10 -25 -2 Q -30 6 -20 8 Q -12 6 -10 2 Z"
                fill="#C084FC"
                opacity={isWhiteTheme ? 0.6 : 0.4}
                className={isFlowActive ? 'animate-pulse' : ''}
              />
            </g>
          ))}

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

        <g transform={`translate(${modWidth / 2 - 11}, 10)`}>
          <circle cx="0" cy="0" r="5" fill="#9333EA" />
          <text x="0" y="2" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold">
            M
          </text>
        </g>

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

  return null;
};
