import { AHUModuleType } from '../types/psychrometrics';

export interface EducationalComponentData {
  type: AHUModuleType;
  canonicalName: string;
  shortName: string;
  icon: string;
  badgeColor: string;
  functionPurpose: {
    summary: string;
    primaryRole: string;
    airStreamLocation: string;
    keyBenefits: string[];
    criticalPitfall: string;
  };
  psychrometricBehavior: {
    processType: string;
    chartPathDescription: string;
    variablesAffected: Array<{ symbol: string; name: string; trend: 'increase' | 'decrease' | 'constant' | 'variable'; note: string }>;
    energyExchange: string;
    formula?: string;
  };
  normativeRITE: {
    articles: Array<{ code: string; title: string; requirement: string }>;
    standardRefs: string[];
    efficiencyThreshold?: string;
  };
  physicalComponents: {
    accessories: Array<{ name: string; symbol: string; purpose: string }>;
    materials: string;
    assemblyNotes: string;
  };
  maintenanceHigiene: {
    inspectionFrequency: string;
    rd487Action: string;
    replacementCriteria: string;
    keyCheckpoints: string[];
  };
}

export const AHU_EDUCATIONAL_DATA: Record<AHUModuleType, EducationalComponentData> = {
  intake_damper: {
    type: 'intake_damper',
    canonicalName: 'Compuerta de Toma de Aire Exterior (ODA)',
    shortName: 'Toma ODA',
    icon: '🚪',
    badgeColor: '#10B981',
    functionPurpose: {
      summary: 'Regula con precisión el caudal de aire exterior primario que ingresa a la unidad para garantizar la ventilación higiénica de los ocupantes.',
      primaryRole: 'Control volumétrico de aire nuevo según ocupación (IDA 1 a 4) y aislamiento hermético cuando la máquina está parada.',
      airStreamLocation: 'Entrada absoluta de la UTA (sección de aspiración exterior).',
      keyBenefits: [
        'Ajuste exacto del caudal según sonda de CO2 ambiental o programación horaria',
        'Cierre estanco clase 3/4 según EN 1751 para evitar infiltraciones térmicas en parada',
        'Protección de la instalación contra entrada de insectos o lluvia torrencial mediante rejilla exterior'
      ],
      criticalPitfall: 'Una compuerta descalibrada o con lamas desincronizadas provoca subventilación (acumulación de contaminantes) o sobreconsumo energético innecesario.'
    },
    psychrometricBehavior: {
      processType: 'Transporte Isentálpico sin Transformación (ΔT = 0, Δw = 0)',
      chartPathDescription: 'El aire atraviesa la compuerta sin alterar sus coordenadas psicrométricas. El punto psicrométrico permanece idéntico al estado exterior (Punto 1 ODA).',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'constant', note: 'Inalterada' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'constant', note: 'Inalterada' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Inalterada (sin aporte de vapor)' },
        { symbol: 'h', name: 'Entalpía', trend: 'constant', note: 'Proceso adiabático sin transferencia de calor' }
      ],
      energyExchange: 'Pérdida de energía de presión estática (ΔP: 20-40 Pa) debida a la fricción y estrangulamiento aerodinámico.',
      formula: 'Q_{ODA} = v \\cdot A \\cdot 3600 \\quad [\\text{m}^3/\\text{h}]'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.1.4.2',
          title: 'Caudal mínimo de aire exterior de ventilación',
          requirement: 'Obliga a suministrar aire exterior según categoría IDA (IDA 1: 72 m³/h·pers en hospitales; IDA 2: 45 m³/h·pers en oficinas; IDA 3: 28,8 m³/h·pers).'
        },
        {
          code: 'UNE-EN 1751',
          title: 'Estanqueidad de compuertas',
          requirement: 'Exige clase de estanqueidad mínima 2 (recomendada clase 4 en climas fríos para evitar heladas interiores).'
        }
      ],
      standardRefs: ['RITE IT 1.1.4.2', 'UNE-EN 1751', 'CTE DB-HS 3'],
      efficiencyThreshold: 'Estanqueidad Clase 3 o 4 con fuga < 20 m³/(h·m²) a 100 Pa'
    },
    physicalComponents: {
      accessories: [
        { name: 'Actuador todo/nada o modulante [M]', symbol: 'M', purpose: 'Motor rotativo 24V / 230V con resorte de retorno de seguridad por fallo eléctrico' },
        { name: 'Lamas aerodinámicas opuestas', symbol: '⧖', purpose: 'Garantizan linealidad proporcional de caudal respecto al ángulo de apertura' },
        { name: 'Junta labial de estanqueidad', symbol: '▤', purpose: 'Material EPDM resistente a intemperie en los bordes de cada lama' }
      ],
      materials: 'Perfiles de aluminio extruido anodizado o acero galvanizado Z275 con casquillos de nylon autolubricados.',
      assemblyNotes: 'Montaje directo sobre el marco frontal de la UTA, protegido externamente por visera antilluvia y malla antipájaros.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Mensual en uso intensivo, trimestral como estándar según RITE Tabla 3.3.',
      rd487Action: 'Limpieza de lamas y revisión de estanqueidad para evitar entrada de suciedad exterior y agua estancada.',
      replacementCriteria: 'Holgura en varillaje mecánico o rotura de juntas de goma con fugas audibles.',
      keyCheckpoints: [
        'Comprobar recorrido completo 0% a 100% sin encallamientos',
        'Verificar el cierre automático por resorte al desconectar corriente',
        'Limpiar suciedad y hojas secas adheridas en la malla de protección'
      ]
    }
  },

  prefilter: {
    type: 'prefilter',
    canonicalName: 'Prefiltro de Aire Grueso / Medio (G4 / M5)',
    shortName: 'Prefiltro',
    icon: '🛡️',
    badgeColor: '#E11D48',
    functionPurpose: {
      summary: 'Primera barrera de protección física que retiene polvo grueso, polen, insectos y fibras en suspensión.',
      primaryRole: 'Protege las baterías térmicas, recuperadores y ventiladores frente a ensuciamiento prematuro y pérdida de rendimiento.',
      airStreamLocation: 'Inmediatamente después de la toma de aire o de la cámara de mezcla.',
      keyBenefits: [
        'Prolonga drásticamente la vida útil de los filtros finos de alta eficacia (F7/F9)',
        'Evita la colmatación de los intercambiadores de calor (baterías y recuperador)',
        'Bajo coste unitario de reposición frente a filtros de alta gama'
      ],
      criticalPitfall: 'Un prefiltro saturado dispara el consumo del ventilador por sobrepresión y puede romperse por fatiga mecánica, ensuciando la batería.'
    },
    psychrometricBehavior: {
      processType: 'Filtración Isentálpica Pura (ΔT = 0, Δw = 0)',
      chartPathDescription: 'Paso neutro en el diagrama psicrométrico. No modifica temperatura ni humedad.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'constant', note: 'Inalterada' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'constant', note: 'Inalterada' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Inalterada' },
        { symbol: 'h', name: 'Entalpía', trend: 'constant', note: 'Inalterada' }
      ],
      energyExchange: 'Pérdida de carga inicial limpia 40-70 Pa; pérdida de carga final recomendada de sustitución 150-200 Pa.',
      formula: '\\Delta P = k \\cdot v^{1.4} \\quad [\\text{Pa}]'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.2.5',
          title: 'Filtración del aire exterior y de retorno',
          requirement: 'Exige niveles mínimos de filtración en función de la calidad del aire exterior (ODA 1 a 3) y la calidad requerida (IDA 1 a 4). Para IDA 2 con ODA 2 se requiere doble etapa F7 + F9 o prefiltro G4 + F7.'
        },
        {
          code: 'UNE-EN ISO 16890',
          title: 'Ensayos y clasificación de filtros de aire generales',
          requirement: 'Sustituye a EN 779; clasifica los prefiltros como Coarse (G4) o ePM10 (M5).'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.2.5', 'UNE-EN ISO 16890', 'UNE 100012'],
      efficiencyThreshold: 'G4: Coarse ≥ 90% gravimétrico; M5: ePM10 ≥ 50%'
    },
    physicalComponents: {
      accessories: [
        { name: 'Presostato diferencial de presión (ΔP)', symbol: 'ΔP', purpose: 'Emite señal de alarma al sistema BMS cuando el filtro alcanza su presión límite' },
        { name: 'Manómetro de columna de líquido o carátula analógica', symbol: 'Ø', purpose: 'Lectura visual directa en campo para el personal de mantenimiento' },
        { name: 'Marco de apriete rápido con juntas herméticas', symbol: '⊞', purpose: 'Impide el bypass de aire sin filtrar por los flancos' }
      ],
      materials: 'Fibra sintética no tejida plisada sobre marco de poliestireno o cartón hidrófugo rígido.',
      assemblyNotes: 'Disposición en ángulo diedro (V-Bank) o plano con fácil extracción frontal o lateral mediante registros herméticos.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Mensual visual; control continuo de ΔP mediante telemetría.',
      rd487Action: 'Inspección de ausencia de moho o humedad acumulada en el marco o medio filtrante.',
      replacementCriteria: 'ΔP medida alcanza 150 Pa o tras 3-6 meses máximos de servicio ininterrumpido.',
      keyCheckpoints: [
        'Verificar que no existen holguras o fugas perimetrales en los marcos',
        'Comprobar la estanqueidad de las puertas de registro con junta labial',
        'Cambiar de inmediato si el medio filtrante muestra signos de humedad'
      ]
    }
  },

  prefilter_flat: {
    type: 'prefilter_flat',
    canonicalName: 'Prefiltro Plano Sintético / Metálico (G3 / G4)',
    shortName: 'Filtro Plano',
    icon: '🛡️',
    badgeColor: '#E11D48',
    functionPurpose: {
      summary: 'Elemento filtrante plano de bajo espesor (25-50 mm) para retención de partículas de gran calibre.',
      primaryRole: 'Barrera económica compacta en espacios reducidos o prefiltración de retornos con pelusa/fibras.',
      airStreamLocation: 'Entrada de aire exterior o entrada de aire de retorno.',
      keyBenefits: ['Mínimo fondo longitudinal ocupado en la UTA', 'Fácil lavado en versiones con malla metálica', 'Bajo coste inicial'],
      criticalPitfall: 'Menor superficie filtrante que el plisado; se satura el doble de rápido requiriendo recambios muy frecuentes.'
    },
    psychrometricBehavior: {
      processType: 'Filtración Isentálpica (ΔT = 0, Δw = 0)',
      chartPathDescription: 'Coordenadas invariantes. La caída de presión no aporta calor al flujo de aire.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'constant', note: 'Inalterada' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'constant', note: 'Inalterada' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Inalterada' }
      ],
      energyExchange: 'Pérdida de carga de 30 a 120 Pa.',
      formula: '\\Delta P_{final} \\le 150 \\, \\text{Pa}'
    },
    normativeRITE: {
      articles: [
        { code: 'RITE IT 1.2.4.2.5', title: 'Calidad de Filtración', requirement: 'Solo admisible como primera etapa previa a filtros ePM1/ePM2,5.' }
      ],
      standardRefs: ['RITE IT 1.2.4.2.5', 'UNE-EN ISO 16890'],
      efficiencyThreshold: 'ISO Coarse 60-75%'
    },
    physicalComponents: {
      accessories: [{ name: 'Tomas de presión piezométricas', symbol: 'ΔP', purpose: 'Conexión a manómetro diferencial' }],
      materials: 'Malla metálica de aluminio lavable o manta sintética sobre bastidor galvanizado.',
      assemblyNotes: 'Guiado por correderas laterales con perfil en U estanco.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Bimensual.',
      rd487Action: 'Desinfección con biocida autorizado si es metálico lavable; reposición si es de manta.',
      replacementCriteria: 'Pérdida de carga superior a 130 Pa o deterioro mecánico del tejido.',
      keyCheckpoints: ['Limpieza periódica con agua a presión si es metálico', 'Alineación en la guía']
    }
  },

  mixing_box: {
    type: 'mixing_box',
    canonicalName: 'Cámara de Mezcla de Aire (ODA / RCA)',
    shortName: 'Cám. Mezcla',
    icon: '🔀',
    badgeColor: '#F59E0B',
    functionPurpose: {
      summary: 'Mezcla en proporciones gobernadas el aire exterior (ODA) con el aire de retorno del edificio (RCA/RA).',
      primaryRole: 'Ahorro energético mediante recirculación parcial térmica y capacidad de enfriamiento gratuito (Free-Cooling).',
      airStreamLocation: 'Zona central de mezcla previa al tratamiento térmico (baterías).',
      keyBenefits: [
        'Aprovechamiento térmico de la energía residual del edificio en invierno y verano',
        'Modo Free-Cooling: 100% aire exterior cuando la entalpía exterior es favorable',
        'Regulación continua de 0% a 100% mediante compuertas enlazadas cinemáticamente'
      ],
      criticalPitfall: 'Una estratificación deficiente del aire produce capas de aire a distinta temperatura provocando disparos antihielo en la batería de agua.'
    },
    psychrometricBehavior: {
      processType: 'Mezcla Adiabática de Dos Corrientes de Aire',
      chartPathDescription: 'El punto resultante (Punto 3 Mezcla) se sitúa exactamente sobre el segmento rectilíneo que une el Punto de Aire Exterior y el Punto de Retorno, dividido en proporción inversa a sus caudales másicos.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'variable', note: 'Media ponderada másica: T_{mezcla} = r \\cdot T_{ODA} + (1-r) \\cdot T_{RCA}' },
        { symbol: 'w', name: 'Humedad específica', trend: 'variable', note: 'Media ponderada másica: w_{mezcla} = r \\cdot w_{ODA} + (1-r) \\cdot w_{RCA}' },
        { symbol: 'h', name: 'Entalpía', trend: 'variable', note: 'Conservación de energía: h_{mezcla} = r \\cdot h_{ODA} + (1-r) \\cdot h_{RCA}' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'variable', note: 'Calculada a partir de T_{mezcla} y w_{mezcla}' }
      ],
      energyExchange: 'Conservación de masa y entalpía sin pérdidas al exterior (proceso adiabático cerrado).',
      formula: 'T_m = \\frac{\\dot{m}_{ODA} T_{ODA} + \\dot{m}_{RCA} T_{RCA}}{\\dot{m}_{ODA} + \\dot{m}_{RCA}}'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.2.1',
          title: 'Ahorro de energía en ventilación y free-cooling',
          requirement: 'En instalaciones con caudal superior a 0,5 m³/s (1.800 m³/h), es preceptivo incorporar un sistema de enfriamiento gratuito (Free-Cooling por aire exterior).'
        },
        {
          code: 'RITE IT 1.1.4.2.4',
          title: 'Recirculación de aire',
          requirement: 'Queda prohibida la recirculación de aire en recintos con aire de extracción clase AE 3 o AE 4 (aseos, cocinas, laboratorios, garajes).'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.2.1', 'RITE IT 1.1.4.2.4', 'UNE-EN 13779'],
      efficiencyThreshold: 'Free-cooling termodinámico y entálpico obligatorio si Q > 1.800 m³/h'
    },
    physicalComponents: {
      accessories: [
        { name: 'Conjunto de 3 compuertas enlazadas', symbol: '⧖', purpose: 'Compuerta exterior, compuerta de retorno y compuerta de expulsión sincronizadas' },
        { name: 'Deflectores mezcladores aerodinámicos (Air Blenders)', symbol: '≋', purpose: 'Turbuladores que homogenizan la temperatura evitando puntos fríos' },
        { name: 'Actuador rápido modulante 0-10V', symbol: 'M', purpose: 'Control continuo comandado por el lazo de temperatura/entalpía del DDC' }
      ],
      materials: 'Carcasa en panel sándwich de 50 mm con compuertas de aluminio de lamas aerodinámicas.',
      assemblyNotes: 'Garantizar longitud suficiente o incorporar deflectores para evitar estratificación antes de la batería.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Trimestral.',
      rd487Action: 'Comprobación de que no recircula aire contaminado o con humedad condensada.',
      replacementCriteria: 'Desajuste del varillaje mecánico o rotura de rótulas de transmisión.',
      keyCheckpoints: [
        'Comprobación de que la compuerta exterior nunca cierra por debajo del caudal mínimo RITE',
        'Verificación de la respuesta simultánea inversa (al abrir ODA cierra RCA)'
      ]
    }
  },

  heat_recovery: {
    type: 'heat_recovery',
    canonicalName: 'Recuperador de Calor de Placas a Contracorriente',
    shortName: 'Recup. Placas',
    icon: '♻️',
    badgeColor: '#0EA5E9',
    functionPurpose: {
      summary: 'Transfiere calor sensible entre el aire viciado de expulsión y el aire nuevo exterior sin contacto físico entre corrientes.',
      primaryRole: 'Recuperación pasiva obligatoria de la energía térmica del aire extraído con 0% de contaminación cruzada.',
      airStreamLocation: 'Intersección física de los conductos de aire exterior y de aire de extracción.',
      keyBenefits: [
        'Rendimiento térmico sensible elevado (> 73% según Ecodesign ErP 2018)',
        'Cero contaminación cruzada (ideal para hospitales, clínicas y laboratorios)',
        'Ausencia de piezas móviles: fiabilidad máxima y nulo consumo eléctrico directo'
      ],
      criticalPitfall: 'Riesgo de congelación en invierno en climas muy fríos (requiere compuerta de bypass para desescarche automático).'
    },
    psychrometricBehavior: {
      processType: 'Sensible Puro (Invierno: Calentamiento sensible ODA; Verano: Enfriamiento sensible ODA)',
      chartPathDescription: 'Desplazamiento horizontal sobre la línea de humedad específica constante (w = cte). En invierno Tbs aumenta a w cte; en verano Tbs disminuye a w cte.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'variable', note: 'Invierno aumenta (+8 a +18°C); Verano disminuye (-3 a -8°C)' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'variable', note: 'Inversa a la variación de Tbs' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Estrictamente constante en placas sensibles' },
        { symbol: 'h', name: 'Entalpía', trend: 'variable', note: 'Aumenta en calefacción, disminuye en refrigeración' }
      ],
      energyExchange: '\\dot{Q}_{rec} = \\dot{m} \\cdot c_p \\cdot \\eta_{rec} \\cdot (T_{ETA} - T_{ODA}) \\quad [\\text{kW}]',
      formula: '\\eta_{sensible} = \\frac{T_{sup} - T_{oda}}{T_{eta} - T_{oda}} \\ge 73\\%'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.5.2',
          title: 'Recuperación de calor del aire de extracción',
          requirement: 'En sistemas con caudal de aire exterior expulsado > 0,28 m³/s (1.000 m³/h), es obligatorio recuperar energía con rendimiento mínimo según Reglamento Ecodesign UE 1253/2014.'
        },
        {
          code: 'Ecodesign ErP UE 1253/2014',
          title: 'Rendimiento mínimo de recuperación',
          requirement: 'Exige una eficiencia térmica mínima de recuperación en seco del 73% con bypass integrado.'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.5.2', 'Ecodesign ErP UE 1253/2014', 'UNE-EN 308'],
      efficiencyThreshold: 'Eficiencia térmica en seco η ≥ 73%'
    },
    physicalComponents: {
      accessories: [
        { name: 'Compuerta de Bypass modulante', symbol: '⧖', purpose: 'Protección antihielo en invierno y Free-cooling nocturno en verano' },
        { name: 'Bandeja de condensados con sifón de bola', symbol: '⏚', purpose: 'Evacua la condensación producida en el lado de expulsión en invierno' },
        { name: 'Presostatos diferenciales en ambas corrientes', symbol: 'ΔP', purpose: 'Controlan el ensuciamiento de las placas' }
      ],
      materials: 'Placas de aluminio corrugado resistentes a corrosión o resinas poliméricas higiénicas.',
      assemblyNotes: 'Debe instalarse con filtros previos en ambas corrientes para evitar la colmatación de los canales estrechos.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Trimestral.',
      rd487Action: 'Limpieza e higienización de la bandeja de condensados para evitar proliferación bacteriana.',
      replacementCriteria: 'Perforación por corrosión con paso de aire entre corrientes o desprendimiento de sellante.',
      keyCheckpoints: [
        'Comprobar la estanqueidad entre corrientes mediante prueba de humo o presión',
        'Verificar el libre drenaje del sifón sin estancamiento de agua'
      ]
    }
  },

  rotary_wheel: {
    type: 'rotary_wheel',
    canonicalName: 'Recuperador Rotativo Entálpico (Rueda Térmica)',
    shortName: 'Rueda Entálpica',
    icon: '🎡',
    badgeColor: '#0EA5E9',
    functionPurpose: {
      summary: 'Rotor giratorio con matriz celular de absorción que recupera calor sensible y humedad latente simultáneamente.',
      primaryRole: 'Máxima eficiencia energética estacional (> 78%) con recuperación activa de humedad.',
      airStreamLocation: 'Intersección física entre los flujos adyacentes de impulsión y extracción.',
      keyBenefits: [
        'Recupera humedad en invierno evitando la excesiva sequedad del aire impulsado',
        'Deshumecta parcialmente en verano antes de la batería fría reduciendo su potencia requerida',
        'Elevadísima compacidad y rendimiento estacional superior a las placas'
      ],
      criticalPitfall: 'Existe una tasa pequeña de arrastre/fuga de aire viciado hacia el aire nuevo (requiere sector de purga con diferencial de presión positivo).'
    },
    psychrometricBehavior: {
      processType: 'Transformación Entálpica Completa (Calor Sensible + Latente)',
      chartPathDescription: 'La evolución psicrométrica se dirige en diagonal directamente hacia el punto de extracción (ETA), modificando tanto la temperatura seca como la humedad específica.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'variable', note: 'Sube en invierno, baja en verano' },
        { symbol: 'w', name: 'Humedad específica', trend: 'variable', note: 'Aumenta en invierno por cesión de vapor; baja en verano' },
        { symbol: 'h', name: 'Entalpía', trend: 'variable', note: 'Variación de entalpía superior a un recuperador sensible puro' }
      ],
      energyExchange: 'Intercambio regenerativo acumulativo por masa térmica rotativa.',
      formula: '\\eta_{latente} = \\frac{w_{sup} - w_{oda}}{w_{eta} - w_{oda}} \\ge 65\\%'
    },
    normativeRITE: {
      articles: [
        { code: 'RITE IT 1.2.4.5.2', title: 'Recuperación de Calor', requirement: 'Reconocido como sistema de alta eficiencia. Exige sector de purga para evitar contaminación cruzada.' }
      ],
      standardRefs: ['RITE IT 1.2.4.5.2', 'UNE-EN 308', 'ErP UE 1253/2014'],
      efficiencyThreshold: 'Eficiencia térmica global η ≥ 75%'
    },
    physicalComponents: {
      accessories: [
        { name: 'Motor reductor con variador de frecuencia (VFD)', symbol: 'M', purpose: 'Modula la velocidad de giro (0-12 rpm) según la demanda térmica' },
        { name: 'Sector de purga (Purge Sector)', symbol: '⊿', purpose: 'Limpia las celdas con aire exterior antes de girar hacia el aire nuevo' },
        { name: 'Correa de tracción elástica con sensor de rotura', symbol: '◎', purpose: 'Alerta inmediata en caso de fallo mecánico de giro' }
      ],
      materials: 'Matriz de aluminio recubierta con tamiz molecular (zeolita 3Å o sílica gel) para absorción selectiva de agua.',
      assemblyNotes: 'Presión del aire nuevo siempre superior a la de extracción en la rueda.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Mensual.',
      rd487Action: 'Limpieza de la matriz con aire comprimido o vapor suave; verificación de sellos de labio perimetrales.',
      replacementCriteria: 'Desgaste severo del rotor, holgura del eje central o rotura de correa.',
      keyCheckpoints: ['Tensión de la correa de transmisión', 'Estado de los cepillos de estanqueidad perimetrales']
    }
  },

  cooling_coil: {
    type: 'cooling_coil',
    canonicalName: 'Batería de Refrigeración y Deshumectación',
    shortName: 'Batería Fría',
    icon: '❄️',
    badgeColor: '#0284C7',
    functionPurpose: {
      summary: 'Intercambiador de tubos con aletas por cuyo interior circula agua fría (7/12°C) o refrigerante DX (R32/R410A) para enfriar y secar el aire.',
      primaryRole: 'Tratamiento termo-higrométrico estival: reduce la temperatura seca y condensa el exceso de humedad atmosférica.',
      airStreamLocation: 'Tras la sección de mezcla o recuperación.',
      keyBenefits: [
        'Enfriamiento sensible potente para contrarrestar las cargas térmicas del edificio',
        'Deshumectación activa profunda cuando la temperatura de superficie desciende del punto de rocío',
        'Control modular preciso mediante válvula de 2 o 3 vías'
      ],
      criticalPitfall: 'Generación continua de agua de condensación: si la bandeja tiene poca pendiente o el sifón se seca, se producen malos olores, bacterias y riesgo de Legionella.'
    },
    psychrometricBehavior: {
      processType: 'Enfriamiento con Deshumectación (ADP < Trocío)',
      chartPathDescription: 'La evolución psicrométrica parte del estado de entrada y traza una curva que apunta hacia el Punto de Rocío del Aparato (ADP) sobre la curva de saturación (HR 100%). Al alcanzar la superficie fría condensa agua líquida, reduciendo simultáneamente Tbs y w.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'decrease', note: 'Descenso notable (ej. de 32°C a 14-16°C)' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'increase', note: 'Aumenta hasta el 90-95% por proximidad al punto de rocío' },
        { symbol: 'w', name: 'Humedad específica', trend: 'decrease', note: 'Disminuye notablemente por condensación de vapor de agua' },
        { symbol: 'h', name: 'Entalpía', trend: 'decrease', note: 'Fuerte caída entálpica por extracción de calor total (sensible + latente)' }
      ],
      energyExchange: '\\dot{Q}_{total} = \\dot{m} \\cdot (h_{entrada} - h_{salida}) = \\dot{Q}_{sensible} + \\dot{Q}_{latente} \\quad [\\text{kW}]',
      formula: 'BF = \\frac{T_{bs,salida} - T_{ADP}}{T_{bs,entrada} - T_{ADP}} \\approx 0.10 - 0.20'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.2.3',
          title: 'Eficiencia en el transporte de fluidos',
          requirement: 'Velocidad de paso de aire máxima en baterías limitada a 2,5 m/s para evitar arrastre de gotas de condensado y reducir el consumo del ventilador.'
        },
        {
          code: 'RITE IT 1.1.4.1.2',
          title: 'Condiciones interiores de diseño',
          requirement: 'Mantenimiento de humedad relativa interior entre el 40% y 60% en verano.'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.2.3', 'R.D. 487/2022', 'UNE 100030'],
      efficiencyThreshold: 'Velocidad frontal de aire v ≤ 2,5 m/s'
    },
    physicalComponents: {
      accessories: [
        { name: 'Válvula modulante de 2 o 3 vías con actuador [M]', symbol: 'M', purpose: 'Regula el caudal de agua helada según consigna de temperatura de impulsión' },
        { name: 'Bandeja de condensados en acero inoxidable AISI 304/316', symbol: '⏚', purpose: 'Con pendiente multidireccional hacia el desagüe para drenaje total' },
        { name: 'Sifón de bola flotante con tapa transparente', symbol: '🪣', purpose: 'Impide la entrada de aire en depresión y la aspiración de malos olores' },
        { name: 'Separador de gotas (Droplet Eliminator)', symbol: '⫽', purpose: 'Retiene microgotas arrancadas por la corriente de aire evitando mojar filtros posteriores' }
      ],
      materials: 'Tubos de cobre sin costura de 1/2" con aletas continuas de aluminio corrugado (opcional con recubrimiento epoxi hidrófugo).',
      assemblyNotes: 'Conexión de agua en contracorriente pura para maximizar el salto térmico LMTD.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Mensual en temporada estival según R.D. 487/2022 (Prevención de Legionelosis).',
      rd487Action: 'Limpieza y desinfección anual de la bandeja de condensados y aletas con bactericida neutro registrado.',
      replacementCriteria: 'Fuga interna en codos de cobre no reparable o aletas aplastadas en más del 25% de la superficie.',
      keyCheckpoints: [
        'Comprobar la ausencia total de agua estancada en la bandeja con la UTA funcionando',
        'Verificar el correcto cebado y libre flotabilidad de la bola del sifón',
        'Revisar la estanqueidad de las válvulas de regulación y purgas de aire'
      ]
    }
  },

  droplet_eliminator: {
    type: 'droplet_eliminator',
    canonicalName: 'Separador de Gotas de Condensado',
    shortName: 'Sep. Gotas',
    icon: '⫽',
    badgeColor: '#06B6D4',
    functionPurpose: {
      summary: 'Perfil laberíntico de lamas deflectoras que frena mecánicamente y precipita las gotas de agua arrancadas por el aire.',
      primaryRole: 'Protege las secciones posteriores (filtro F7/F9, ventilador y conductos) frente al arrastre de agua líquida.',
      airStreamLocation: 'Inmediatamente detrás de la batería de refrigeración.',
      keyBenefits: ['Evita el empapamiento y proliferación de hongos en los filtros finos', 'Protege el rodete del ventilador contra corrosión por salpicaduras', 'Mínima pérdida de carga'],
      criticalPitfall: 'Lamas rotas o mal encajadas permiten el paso de gotas que pudren los filtros terminales.'
    },
    psychrometricBehavior: {
      processType: 'Mecánico / Neutro (ΔT = 0, Δw = 0)',
      chartPathDescription: 'No altera las coordenadas psicrométricas del aire.',
      variablesAffected: [{ symbol: 'Tbs', name: 'Temperatura', trend: 'constant', note: 'Inalterada' }],
      energyExchange: 'Caída de presión aerodinámica de 15 a 30 Pa.',
      formula: '\\Delta P \\approx 20 \\, \\text{Pa}'
    },
    normativeRITE: {
      articles: [
        { code: 'RITE IT 1.2.4.2.3', title: 'Arrastre de Gotas', requirement: 'Obligatorio tras batería fría si la velocidad de aire frontal excede 2,0 m/s.' }
      ],
      standardRefs: ['RITE IT 1.2.4.2.3', 'UNE 100012'],
      efficiencyThreshold: 'Eficacia de separación de gotas > 99%'
    },
    physicalComponents: {
      accessories: [{ name: 'Bandeja de drenaje inferior conectada al desagüe general', symbol: '⏚', purpose: 'Canalización directa del agua interceptada' }],
      materials: 'Perfiles de polipropileno resistente a radiación UV o aluminio extrusionado con ganchos deflectores.',
      assemblyNotes: 'Montaje vertical asegurando que el agua escurra por gravedad hacia la bandeja de condensados.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Semestral.',
      rd487Action: 'Limpieza con desinfectante clorado o amonio cuaternario para evitar biofilms.',
      replacementCriteria: 'Lamas cuarteadas, deformadas o quebradizas.',
      keyCheckpoints: ['Limpieza de lamas', 'Correcto asentamiento en el canal inferior']
    }
  },

  heating_coil: {
    type: 'heating_coil',
    canonicalName: 'Batería de Calentamiento por Agua Caliente',
    shortName: 'Batería Calor',
    icon: '🔥',
    badgeColor: '#EF4444',
    functionPurpose: {
      summary: 'Intercambiador térmico de aletas alimentado por agua caliente de caldera o bomba de calor (45/40°C o 60/50°C).',
      primaryRole: 'Calentamiento sensible del aire en invierno o neutralización/recalentamiento tras deshumectación.',
      airStreamLocation: 'Zona central-final de la UTA, posterior al tratamiento frigorífico.',
      keyBenefits: [
        'Aporte térmico confortable y progresivo mediante modulación de caudal de agua',
        'Capacidad de recalentamiento estival para control de humedad en salas limpias',
        'Bajo coste operativo al acoplarse con bombas de calor aerotérmicas de alta eficiencia'
      ],
      criticalPitfall: 'Peligro extremo de helada en invierno si la compuerta exterior se abre con agua parada (requiere termostato antihielo de rearme manual).'
    },
    psychrometricBehavior: {
      processType: 'Calentamiento Sensible Puro (w = cte)',
      chartPathDescription: 'Desplazamiento horizontal recto hacia la derecha en el diagrama psicrométrico. Aumenta la temperatura seca (Tbs) mientras la humedad específica (w) permanece rigurosamente constante.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'increase', note: 'Aumento neto (ej. de 12°C a 22-26°C)' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'decrease', note: 'Desciende drásticamente debido al aumento de la presión de vapor de saturación' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Rigurosamente inalterada (no hay aporte de vapor de agua)' },
        { symbol: 'h', name: 'Entalpía', trend: 'increase', note: 'Aumenta proporcionalmente a la potencia térmica aportada' }
      ],
      energyExchange: '\\dot{Q}_{sensible} = \\dot{m} \\cdot c_p \\cdot (T_{bs,salida} - T_{bs,entrada}) \\quad [\\text{kW}]',
      formula: '\\dot{Q} = \\rho \\cdot Q \\cdot c_p \\cdot \\Delta T \\approx 0.34 \\cdot Q \\cdot (T_2 - T_1)'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.1.2.1',
          title: 'Régimen de temperaturas del agua de calefacción',
          requirement: 'Diseño preferente para baja temperatura (máx. 55-60°C de ida) para favorecer el COP de bombas de calor y el rendimiento de calderas de condensación.'
        },
        {
          code: 'RITE IT 1.2.4.2.4',
          title: 'Protección contra heladas',
          requirement: 'Obligatoriedad de termostato antihielo capilar en baterías de agua que reciban aire exterior.'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.1.2.1', 'RITE IT 1.2.4.2.4', 'UNE-EN 13053'],
      efficiencyThreshold: 'Diseño para agua a baja temperatura (ida ≤ 55°C)'
    },
    physicalComponents: {
      accessories: [
        { name: 'Válvula modulante de 2 o 3 vías con actuador proporcional', symbol: 'M', purpose: 'Gobierna el aporte térmico según consigna de impulsión o ambiente' },
        { name: 'Termostato antihielo capilar de seguridad', symbol: '❄️⚠️', purpose: 'Sensor capilar trenzado tras la batería que para el ventilador y cierra ODA si T < 4°C' },
        { name: 'Bomba circuladora de primario de caudal constante', symbol: '⊚', purpose: 'Mantiene circulación de agua continua en la batería evitando estratificación' }
      ],
      materials: 'Tubos de cobre de alta conductividad con aletas de aluminio y colectores de acero o cobre con purga de aire automática.',
      assemblyNotes: 'Conexión de agua en contracorriente con purga en el punto más alto y vaciado en el más bajo.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Trimestral en invierno, semestral general.',
      rd487Action: 'Limpieza de aletas para evitar incrustaciones de polvo seco que disminuyan la transferencia térmica.',
      replacementCriteria: 'Rotura de tubos por congelación o fugas irreparables en uniones soldadas.',
      keyCheckpoints: [
        'Comprobación del disparo del termostato antihielo sumergiendo el capilar en hielo',
        'Purgado exhaustivo de aire para evitar bolsas y ruidos de cavitación',
        'Verificación del cierre estanco de la válvula en parada de máquina'
      ]
    }
  },

  electric_heater: {
    type: 'electric_heater',
    canonicalName: 'Batería Eléctrica de Resistencias Blindadas',
    shortName: 'Batería Eléctrica',
    icon: '⚡',
    badgeColor: '#EF4444',
    functionPurpose: {
      summary: 'Batería de resistencias eléctricas blindadas con aletas para calentamiento sensible de respuesta inmediata.',
      primaryRole: 'Calor de apoyo, recalentamiento estival de precisión o alternativa donde no exista red de agua caliente.',
      airStreamLocation: 'Tramo intermedio o terminal de impulsión.',
      keyBenefits: ['Respuesta térmica prácticamente instantánea', 'Inmune al riesgo de helada hidráulica', 'Mínimo espacio de montaje'],
      criticalPitfall: 'Riesgo de incendio si no se garantiza flujo de aire mínimo continuo (exige doble termostato de seguridad obligatorio y enclavamiento con el ventilador).'
    },
    psychrometricBehavior: {
      processType: 'Calentamiento Sensible Puro por Efecto Joule (w = cte)',
      chartPathDescription: 'Desplazamiento horizontal recto a la derecha sobre la línea de w constante.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'increase', note: 'Aumento rápido de temperatura' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Inalterada' }
      ],
      energyExchange: '\\dot{Q}_{electrico} = I^2 \\cdot R \\quad [\\text{kW}]',
      formula: 'P = \\sqrt{3} \\cdot V \\cdot I \\cdot \\cos\\phi'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.1.3.1',
          title: 'Limitación de la energía eléctrica por efecto Joule',
          requirement: 'Prohíbe el uso de resistencias eléctricas como sistema principal de calefacción salvo justificación técnica/económica o como apoyo de bomba de calor y desescarche.'
        },
        {
          code: 'UNE-EN 60335-2-40',
          title: 'Seguridad en aparatos electrotérmicos',
          requirement: 'Exige termostato de rearme automático a 70°C y termostato de seguridad de corte definitivo a 90°C con rearme manual.'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.1.3.1', 'UNE-EN 60335-2-40', 'REBT ITC-BT-44'],
      efficiencyThreshold: 'Solo admitido como apoyo o recalentamiento estival de baja potencia'
    },
    physicalComponents: {
      accessories: [
        { name: 'Relé de estado sólido (SSR) con disparo por paso por cero', symbol: '⎓', purpose: 'Modulación proporcional continua sin chispas ni ruidos' },
        { name: 'Doble termostato de seguridad (Rearme automático + manual)', symbol: '⚠️', purpose: 'Corte directo de alimentación eléctrica ante sobrecalentamiento' },
        { name: 'Flujostato o presostato diferencial de enclavamiento', symbol: '⏚', purpose: 'Impide energizar la batería si el ventilador no está impulsando aire' }
      ],
      materials: 'Resistencias blindadas de acero inoxidable AISI 321 con aletas helicoidales para disipación rápida.',
      assemblyNotes: 'Enclavamiento eléctrico obligado con el contactor del ventilador de impulsión con temporización de barrido de 60 segundos.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Semestral.',
      rd487Action: 'Limpieza de polvo sobre las resistencias para evitar combustión olores a quemado.',
      replacementCriteria: 'Resistencia quemada con circuito abierto o derivación a tierra.',
      keyCheckpoints: [
        'Comprobación del corte de seguridad al pulsar el test de sobretemperatura',
        'Verificación de que las resistencias se desconectan al parar el ventilador'
      ]
    }
  },

  humidifier: {
    type: 'humidifier',
    canonicalName: 'Humidificador Isotérmico / Evaporativo',
    shortName: 'Humidificador',
    icon: '💧',
    badgeColor: '#06B6D4',
    functionPurpose: {
      summary: 'Aporta humedad al flujo de aire seco invernal mediante inyección de vapor limpio (isotérmico) o contacto con panel húmedo (adiabático).',
      primaryRole: 'Garantizar el límite inferior de humedad relativa de confort (HR ≥ 40% según RITE) y prevenir problemas respiratorios o electrostáticos.',
      airStreamLocation: 'Tras la batería de calefacción o antes del ventilador de impulsión.',
      keyBenefits: [
        'Bienestar fisiológico, salud respiratoria y prevención de irritación de mucosas',
        'Control estricto de electricidad estática en centros de datos y quirófanos',
        'Inyección higiénica de vapor saturado a 100°C libre de bacterias'
      ],
      criticalPitfall: 'Si la distancia de absorción de vapor es insuficiente, el vapor condensa en conductos y moja los filtros provocando mohos.'
    },
    psychrometricBehavior: {
      processType: 'Humidificación Isotérmica (con Vapor) o Adiabática (con Agua Líquida)',
      chartPathDescription: 'Con vapor a 100°C: línea casi vertical hacia arriba (Tbs casi constante, aumento rápido de w y HR). Con agua pulverizada (adiabático): evolución paralela a la línea de bulbo húmedo constante (desciende Tbs mientras sube w).',
      variablesAffected: [
        { symbol: 'w', name: 'Humedad específica', trend: 'increase', note: 'Aumento neto (ej. de 3 g/kg a 8-10 g/kg)' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'increase', note: 'Aumento hasta la consigna programada (45-55%)' },
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'variable', note: 'Prácticamente cte con vapor (+0,3°C); baja notablemente con agua pulverizada' },
        { symbol: 'h', name: 'Entalpía', trend: 'increase', note: 'Aumenta por la entalpía del vapor inyectado' }
      ],
      energyExchange: '\\dot{m}_{vapor} = \\dot{m}_{aire} \\cdot (w_{salida} - w_{entrada}) \\quad [\\text{kg/h}]',
      formula: 'd_a = \\text{Distancia de absorción} \\approx 0.8 - 1.5 \\, \\text{m}'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.1.4.1.2',
          title: 'Condiciones de humedad interior de diseño',
          requirement: 'En invierno la humedad relativa debe mantenerse entre el 40% y 50% en locales ocupados.'
        },
        {
          code: 'RITE IT 1.2.4.2.6',
          title: 'Higiene en la humidificación',
          requirement: 'Solo se autorizan humidificadores que garanticen la ausencia de aerosoles de agua estancada; se exige agua potable tratada o vapor directo.'
        }
      ],
      standardRefs: ['RITE IT 1.1.4.1.2', 'RITE IT 1.2.4.2.6', 'R.D. 487/2022', 'UNE 100030'],
      efficiencyThreshold: 'Control proporcional modulante por sensor de conducto'
    },
    physicalComponents: {
      accessories: [
        { name: 'Lanza de dispersión de vapor con toberas de precisión', symbol: '∿', purpose: 'Distribuye el vapor homogéneamente sin condensar en las paredes' },
        { name: 'Generador de vapor con electrodos sumergidos o resistencias', symbol: '♨', purpose: 'Producción de vapor higiénico a 100°C con drenaje automático de sales' },
        { name: 'Higrostato de seguridad de conducto', symbol: '💧⚠️', purpose: 'Corta la inyección si la HR en el conducto supera el 85% para evitar condensación' }
      ],
      materials: 'Lanza de acero inoxidable AISI 304/316 con camisas calefactadas que evitan el goteo de agua fría.',
      assemblyNotes: 'Debe respetarse una distancia libre mínima de absorción (0,8 a 1,5 m) sin obstáculos ni filtros aguas abajo.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Mensual en temporada invernal.',
      rd487Action: 'Purga automática obligatoria de agua estancada cada 24 horas de parada; limpieza de cal.',
      replacementCriteria: 'Cilindro de electrodos saturado de cal no regenerable o toberas calcificadas.',
      keyCheckpoints: [
        'Comprobación de que no hay goteo o condensación en las paredes del plénum',
        'Verificación del correcto funcionamiento del higrostato de seguridad de corte por alta humedad'
      ]
    }
  },

  adiabatic_cooling: {
    type: 'adiabatic_cooling',
    canonicalName: 'Enfriamiento Evaporativo Adiabático',
    shortName: 'Enfr. Evaporativo',
    icon: '💧',
    badgeColor: '#06B6D4',
    functionPurpose: {
      summary: 'Panel evaporativo húmedo por el que circula aire cálido y seco, enfriándolo mediante la evaporación espontánea de agua.',
      primaryRole: 'Refrigeración ecológica de bajísimo consumo energético (solo la bomba de agua) en climas secos.',
      airStreamLocation: 'Entrada de aire exterior o en la corriente de extracción antes de un recuperador rotativo.',
      keyBenefits: ['Reduce Tbs entre 6 y 12°C con coste energético mínimo', 'Ahorro enorme de potencia en baterías frigoríficas', 'Sostenible y sin refrigerantes F-Gas'],
      criticalPitfall: 'Aumenta la humedad del aire. Si el clima exterior es húmedo, su eficacia cae drásticamente.'
    },
    psychrometricBehavior: {
      processType: 'Enfriamiento Adiabático a Entalpía Constante (h = cte)',
      chartPathDescription: 'La evolución sigue exactamente la línea de temperatura de bulbo húmedo constante (Tbh = cte). Desciende Tbs mientras aumentan w y HR.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'decrease', note: 'Descenso notable' },
        { symbol: 'w', name: 'Humedad específica', trend: 'increase', note: 'Aumenta proporcionalmente' },
        { symbol: 'h', name: 'Entalpía', trend: 'constant', note: 'Prácticamente inalterada' }
      ],
      energyExchange: 'Intercambio entre calor sensible del aire y calor latente de vaporización del agua.',
      formula: '\\eta_{evap} = \\frac{T_{bs1} - T_{bs2}}{T_{bs1} - T_{bh1}} \\approx 80 - 90\\%'
    },
    normativeRITE: {
      articles: [
        { code: 'R.D. 487/2022', title: 'Prevención de Legionelosis', requirement: 'Exige vaciado y secado automático del circuito tras parada superior a 24 horas y desinfección periódica.' }
      ],
      standardRefs: ['RITE IT 1.2.4.2.6', 'R.D. 487/2022'],
      efficiencyThreshold: 'Eficacia de saturación evaporativa η ≥ 80%'
    },
    physicalComponents: {
      accessories: [
        { name: 'Bomba de recirculación sumergida', symbol: '⊚', purpose: 'Riega uniformemente la cabecera del panel' },
        { name: 'Válvula de vaciado automático por electroválvula', symbol: '⏚', purpose: 'Drena el depósito al detenerse la UTA' }
      ],
      materials: 'Paneles de celulosa especial resinada o matrices de fibra de vidrio incombustibles.',
      assemblyNotes: 'Obligatorio separador de gotas aguas abajo si v > 2,0 m/s.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Quincenal en operación.',
      rd487Action: 'Desinfección biológica del depósito y renovación total del agua para evitar concentración salina.',
      replacementCriteria: 'Colmatación por sales cálcicas o descomposición del panel.',
      keyCheckpoints: ['Calidad del agua de aporte', 'Correcto funcionamiento de la purga continua']
    }
  },

  fan: {
    type: 'fan',
    canonicalName: 'Ventilador Plug-Fan EC de Alta Eficiencia',
    shortName: 'Ventilador EC',
    icon: '💨',
    badgeColor: '#10B981',
    functionPurpose: {
      summary: 'Rodete centrífugo de álabes curvados hacia atrás accionado directamente por motor síncrono EC (conmutación electrónica).',
      primaryRole: 'Genera el caudal y la presión estática necesarios para vencer todas las pérdidas de carga de la UTA y la red de conductos.',
      airStreamLocation: 'Zona final de impulsión (soplante o aspirante tras baterías).',
      keyBenefits: [
        'Rendimiento eléctrico global IE4/IE5 insuperable en todo el rango de modulación',
        'Acoplamiento directo sin poleas ni correas: cero desgaste, sin polvo de goma y nulo mantenimiento mecánico',
        'Regulación continua precisa mediante señal 0-10V o bus Modbus/BACnet'
      ],
      criticalPitfall: 'Un cálculo incorrecto de la presión estática de conductos desplaza el punto de funcionamiento fuera de la zona óptima, reduciendo su eficiencia y generando ruido aerodinámico.'
    },
    psychrometricBehavior: {
      processType: 'Compresión Politrópica Adiabática (Pequeño Calentamiento Sensible)',
      chartPathDescription: 'La energía mecánica disipada y el calor del motor transmitido al flujo provocan un ligero aumento de la temperatura seca (+0,5 a +1,5°C) a humedad específica rigurosamente constante (w = cte).',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'increase', note: 'Calentamiento de +0.5°C a +1.2°C por disipación y compresión' },
        { symbol: 'HR', name: 'Humedad relativa', trend: 'decrease', note: 'Leve descenso asociado al aumento de temperatura' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Estrictamente constante' },
        { symbol: 'P_estatica', name: 'Presión estática', trend: 'increase', note: 'Salto positivo notable (+300 a +800 Pa)' }
      ],
      energyExchange: 'Potencia eléctrica absorbida convertida en energía de presión y calor sensible.',
      formula: '\\Delta T_{fan} = \\frac{\\Delta P_{total}}{\\rho \\cdot c_p \\cdot \\eta_{fan}} \\approx \\frac{\\Delta P [\\text{Pa}]}{1200 \\cdot \\eta_{fan}}'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.2.2',
          title: 'Potencia específica de los ventiladores (SFP)',
          requirement: 'Exige cumplir con las categorías SFP (Specific Fan Power) según UNE-EN 13779 / UNE-EN 16798-3 (ej. SFP 3: 1.250-2.000 W/(m³/s)).'
        },
        {
          code: 'Ecodesign ErP UE 327/2011 & 1253/2014',
          title: 'Eficiencia mínima de motores y rodetes',
          requirement: 'Prohíbe la comercialización de ventiladores que no alcancen los estándares mínimos de rendimiento global con motor EC/IE4.'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.2.2', 'UNE-EN 16798-3', 'ErP UE 1253/2014'],
      efficiencyThreshold: 'SFP ≤ 1.500 W/(m³/s) con motor EC IE4/IE5'
    },
    physicalComponents: {
      accessories: [
        { name: 'Sonda de caudal por presión diferencial en tobera de aspiración', symbol: '∾', purpose: 'Medición de caudal en tiempo real mediante fórmula k-factor' },
        { name: 'Interruptor de corte de seguridad en carga (Corte en puerta)', symbol: '⏻', purpose: 'Desconecta la alimentación al abrir la puerta de acceso para evitar accidentes' },
        { name: 'Silentblocks antivibratorios de caucho o resorte', symbol: '⏚', purpose: 'Aíslan completamente las vibraciones mecánicas del chasis de la máquina' }
      ],
      materials: 'Rodete en material compuesto reforzado con fibra de vidrio o aluminio con perfil aerodinámico de álabe 3D.',
      assemblyNotes: 'Cámara impelente con suficiente volumen de calma para favorecer la recuperación de presión estática.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Semestral.',
      rd487Action: 'Limpieza de álabes para mantener el equilibrado dinámico y evitar descompensaciones.',
      replacementCriteria: 'Vibraciones anómalas por fallo de rodamientos sellados o alarma en el inversor EC.',
      keyCheckpoints: [
        'Comprobar la ausencia de vibraciones en marcha a velocidad máxima',
        'Verificar el paro inmediato al abrir la puerta de inspección'
      ]
    }
  },

  belt_fan: {
    type: 'belt_fan',
    canonicalName: 'Ventilador Centrífugo por Correas y Poleas',
    shortName: 'Ventilador Correas',
    icon: '💨',
    badgeColor: '#10B981',
    functionPurpose: {
      summary: 'Ventilador centrífugo convencional accionado por motor exterior mediante transmisión por poleas y correas trapezoidales.',
      primaryRole: 'Instalaciones existentes o aplicaciones industriales pesadas con presiones estáticas muy elevadas.',
      airStreamLocation: 'Sección de impulsión o retorno.',
      keyBenefits: ['Permite modificar el caudal cambiando el diámetro de la polea', 'Motor estándar fácilmente intercambiable', 'Robusto para aire con partículas'],
      criticalPitfall: 'Emisión de polvo de caucho negro por desgaste de correas que ensucia filtros y baterías; menor rendimiento energético que la tecnología EC.'
    },
    psychrometricBehavior: {
      processType: 'Compresión Politrópica (ΔT sensible leve)',
      chartPathDescription: 'Aporte de calor sensible al aire por fricción y pérdidas mecánicas (+0,8 a +1,8°C).',
      variablesAffected: [{ symbol: 'Tbs', name: 'Temperatura seca', trend: 'increase', note: 'Leve calentamiento' }],
      energyExchange: 'Rendimiento total sensiblemente inferior debido a pérdidas en transmisión de correa (3-6%).',
      formula: '\\eta_{total} = \\eta_{rodete} \\cdot \\eta_{motor} \\cdot \\eta_{correas}'
    },
    normativeRITE: {
      articles: [
        { code: 'RITE IT 1.2.4.2.2', title: 'SFP', requirement: 'Exige sustitución preferente por Plug-Fan EC en reformas por su elevado consumo.' }
      ],
      standardRefs: ['RITE IT 1.2.4.2.2', 'UNE-EN 13779'],
      efficiencyThreshold: 'Motor mínimo IE3'
    },
    physicalComponents: {
      accessories: [
        { name: 'Tensor automático de correas', symbol: '◎', purpose: 'Mantiene la tensión óptima sin deslizar' },
        { name: 'Cárter de protección de transmisión', symbol: '⊞', purpose: 'Protección para el operario' }
      ],
      materials: 'Rodete de chapa de acero galvanizada y correas trapezoidales de neopreno con alma de kevlar.',
      assemblyNotes: 'Alineación láser de poleas obligada.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Mensual.',
      rd487Action: 'Aspirado exhaustivo del polvo negro de correa generado en la cámara.',
      replacementCriteria: 'Desgaste, grietas en la correa o patinado con chirridos.',
      keyCheckpoints: ['Tensión de correas con dinamómetro', 'Temperatura de rodamientos con termografía']
    }
  },

  return_fan: {
    type: 'return_fan',
    canonicalName: 'Ventilador de Retorno / Extracción',
    shortName: 'Ventilador Retorno',
    icon: '💨',
    badgeColor: '#10B981',
    functionPurpose: {
      summary: 'Vence la resistencia de la red de conductos de retorno y recirculación, extrayendo el aire viciado de los locales.',
      primaryRole: 'Equilibrio de presiones en el edificio y aporte del caudal necesario al recuperador y caja de mezcla.',
      airStreamLocation: 'Entrada del circuito de extracción de la UTA.',
      keyBenefits: ['Evita sobrepresiones o depresiones no deseadas en el edificio', 'Alimentación forzada del recuperador de calor', 'Facilita la expulsión al exterior'],
      criticalPitfall: 'Si el caudal de retorno supera al de impulsión, el edificio entra en depresión aspirando aire no filtrado por rendijas y puertas.'
    },
    psychrometricBehavior: {
      processType: 'Compresión Politrópica (ΔT sensible leve)',
      chartPathDescription: 'Leve calentamiento sensible a w constante.',
      variablesAffected: [{ symbol: 'Tbs', name: 'Temperatura seca', trend: 'increase', note: 'Calentamiento leve (+0.5°C)' }],
      energyExchange: 'Aumento de energía de presión estática.',
      formula: 'Q_{retorno} \\approx 0.85 - 0.90 \\cdot Q_{impulsion}'
    },
    normativeRITE: {
      articles: [
        { code: 'RITE IT 1.1.4.2.3', title: 'Equilibrio de presiones', requirement: 'El edificio debe mantenerse preferentemente en ligera sobrepresión positiva para evitar infiltraciones.' }
      ],
      standardRefs: ['RITE IT 1.1.4.2.3', 'UNE-EN 16798-3'],
      efficiencyThreshold: 'SFP según categoría RITE'
    },
    physicalComponents: {
      accessories: [{ name: 'Sonda diferencial de presión estática en conducto', symbol: '∾', purpose: 'Control de la velocidad del motor para mantener presión de consigna' }],
      materials: 'Plug-Fan EC de alta eficiencia.',
      assemblyNotes: 'Montaje con amortiguadores antivibratorios.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Semestral.',
      rd487Action: 'Limpieza de suciedad y polvo ambiental adherido.',
      replacementCriteria: 'Vibraciones o avería eléctrica.',
      keyCheckpoints: ['Calibración de la sonda de presión', 'Ausencia de holguras']
    }
  },

  plenum: {
    type: 'plenum',
    canonicalName: 'Plénum de Calma e Inspección de Mantenimiento',
    shortName: 'Plénum Inspección',
    icon: '🚪',
    badgeColor: '#64748B',
    functionPurpose: {
      summary: 'Módulo de espacio libre con puerta hermética, mirilla y luminaria interior estanca.',
      primaryRole: 'Homogeneización aerodinámica del flujo de aire y acceso ergonómico para operaciones de mantenimiento e higienización.',
      airStreamLocation: 'Entre secciones críticas (entre baterías, tras ventilador o antes de filtros terminales).',
      keyBenefits: [
        'Acceso cómodo para inspección visual y toma de muestras microbiológicas',
        'Facilita la limpieza exhaustiva de las caras posteriores de las baterías térmicas',
        'Disipa turbulencias aerodinámicas mejorando la distribución de velocidad en los filtros'
      ],
      criticalPitfall: 'Eliminar el plénum para ahorrar espacio en la máquina imposibilita la limpieza de las baterías, provocando incumplimiento grave del R.D. 487/2022.'
    },
    psychrometricBehavior: {
      processType: 'Paso Neutro sin Alteración (ΔT = 0, Δw = 0)',
      chartPathDescription: 'El aire atraviesa la sección de plénum sin ninguna modificación en sus variables psicrométricas.',
      variablesAffected: [{ symbol: 'Tbs', name: 'Temperatura', trend: 'constant', note: 'Inalterada' }],
      energyExchange: 'Mínima pérdida de carga (< 10 Pa).',
      formula: 'v = \\frac{Q}{A \\cdot 3600} \\le 2.0 \\, \\text{m/s}'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.2.4',
          title: 'Mantenibilidad de las unidades de tratamiento de aire',
          requirement: 'Exige puertas de acceso e inspección de dimensiones suficientes para el mantenimiento y limpieza de todos los componentes internos.'
        },
        {
          code: 'UNE-EN 13053',
          title: 'Dimensionado de secciones de servicio',
          requirement: 'Fija longitudes mínimas de sección de acceso (típicamente ≥ 600 mm) para permitir el acceso humano.'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.2.4', 'UNE-EN 13053', 'UNE 100012'],
      efficiencyThreshold: 'Puertas con estanqueidad Clase L1/L2 según EN 1886'
    },
    physicalComponents: {
      accessories: [
        { name: 'Puerta de registro abatible con doble maneta de seguridad', symbol: '🚪', purpose: 'Apertura hacia el exterior o interior con maneta interior de emergencia antibloqueo' },
        { name: 'Ojo de buey / Mirilla de doble acristalamiento', symbol: '👁', purpose: 'Inspección visual del interior sin necesidad de detener la máquina' },
        { name: 'Luminaria estanca IP65 con interruptor exterior', symbol: '💡', purpose: 'Iluminación interior para tareas de mantenimiento' }
      ],
      materials: 'Paneles sándwich de 50 mm con aislamiento de lana de roca incombustible de 40 kg/m³ y caras interiores en chapa lisa sin aristas.',
      assemblyNotes: 'Suelo interior perfectamente liso y plano sin resaltes para facilitar el fregado y desinfección.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Mensual.',
      rd487Action: 'Limpieza y desinfección de las paredes interiores con bactericida autorizado.',
      replacementCriteria: 'Deterioro de la junta perimetral de estanqueidad de la puerta.',
      keyCheckpoints: [
        'Comprobar la estanqueidad de la puerta sin silbidos de fuga de aire',
        'Verificar el funcionamiento de la luz interior y limpieza de la mirilla'
      ]
    }
  },

  final_filter: {
    type: 'final_filter',
    canonicalName: 'Filtro Terminal de Alta Eficacia (F7 / F9 / ePM1)',
    shortName: 'Filtro F7/F9',
    icon: '🛡️',
    badgeColor: '#E11D48',
    functionPurpose: {
      summary: 'Segunda y definitiva etapa de filtración que retiene partículas finas respirables, bacterias, hollín y aerosoles microscópicos.',
      primaryRole: 'Garantizar la calidad higiénica del aire de impulsión (IDA 1 o IDA 2) suministrado directamente a las personas.',
      airStreamLocation: 'Última sección de la UTA inmediatamente antes de la impulsión a los conductos.',
      keyBenefits: [
        'Retiene partículas ultrafinas PM1 y PM2.5 responsables de afecciones respiratorias',
        'Filtra cualquier partícula de polvo o residuo desprendido por ventiladores o baterías anteriores',
        'Cumplimiento estricto de la normativa de salubridad hospitalaria y terciaria'
      ],
      criticalPitfall: 'Instalar este filtro fino sin prefiltro previo provoca su colmatación en pocos días con un coste económico inasumible.'
    },
    psychrometricBehavior: {
      processType: 'Filtración Isentálpica Pura (ΔT = 0, Δw = 0)',
      chartPathDescription: 'Paso neutro en el diagrama psicrométrico sin variación térmica ni de humedad.',
      variablesAffected: [
        { symbol: 'Tbs', name: 'Temperatura seca', trend: 'constant', note: 'Inalterada' },
        { symbol: 'w', name: 'Humedad específica', trend: 'constant', note: 'Inalterada' }
      ],
      energyExchange: 'Pérdida de carga limpia inicial: 90-140 Pa; pérdida de carga máxima admisible de recambio: 250-300 Pa.',
      formula: '\\text{Eficacia} \\ge 80\\% \\, \\text{contra partículas} \\, \\le 1 \\mu\\text{m (ePM1 80%)}'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.2.4.2.5',
          title: 'Etapas mínimas de filtración',
          requirement: 'Para calidad IDA 1 (hospitales, quirófanos, guarderías): obligatorio F7 + F9 (ePM1 70% + ePM1 90%). Para IDA 2 (oficinas, hoteles, cines): obligatorio mínimo F7 (ePM1 50%).'
        },
        {
          code: 'UNE-EN ISO 16890',
          title: 'Clasificación ePM1',
          requirement: 'Ensayo con aerosol de partículas fraccionadas entre 0,3 y 1 micra.'
        }
      ],
      standardRefs: ['RITE IT 1.2.4.2.5', 'UNE-EN ISO 16890', 'UNE 171330'],
      efficiencyThreshold: 'F7: ePM1 ≥ 50-65%; F9: ePM1 ≥ 80-90%'
    },
    physicalComponents: {
      accessories: [
        { name: 'Presostato diferencial de presión calibrable', symbol: 'ΔP', purpose: 'Avisa con antelación al mantenimiento cuando el filtro alcanza 250 Pa' },
        { name: 'Marco de sellado hermético con mecanismo excéntrico', symbol: '⊞', purpose: 'Comprime el filtro contra la junta de neopreno garantizando 0% de fuga perimetral' }
      ],
      materials: 'Filtro compacto en bolsas rígidas de microfibra de vidrio con miniplegado y separadores de cordón termoplástico.',
      assemblyNotes: 'Debe colocarse como última sección de la máquina para actuar como barrera de seguridad de todo el proceso.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Trimestral.',
      rd487Action: 'Sustitución inmediata ante cualquier signo de contaminación fúngica o deterioro de fibras.',
      replacementCriteria: 'Presión diferencial superior a 250 Pa o 12 meses de funcionamiento máximo.',
      keyCheckpoints: [
        'Comprobar la presión diferencial exacta con el manómetro calibrado',
        'Verificar el perfecto estado y estanqueidad de las juntas de los marcos'
      ]
    }
  },

  silencer: {
    type: 'silencer',
    canonicalName: 'Silenciador Acústico de Bafles Disipativos',
    shortName: 'Silenciador',
    icon: '🔇',
    badgeColor: '#64748B',
    functionPurpose: {
      summary: 'Módulo atenuador compuesto por bafles paralelos rellenos de lana mineral fonoabsorbente protegida con velo antiarrastre.',
      primaryRole: 'Atenuar el ruido aerodinámico generado por el ventilador para garantizar el confort acústico en las estancias habitadas.',
      airStreamLocation: 'Tras el ventilador en impulsión o en el retorno hacia el edificio.',
      keyBenefits: [
        'Atenuación acústica de entre 15 y 28 dBA en frecuencias medias y altas',
        'Cumplimiento de los niveles sonoros máximos permitidos en interiores por el CTE DB-HR',
        'Perfil aerodinámico en cabezas de bafle que reduce la pérdida de carga'
      ],
      criticalPitfall: 'Un velo de protección de mala calidad puede desgarrarse con el paso del aire, desprendiendo fibras minerales en el conducto de impulsión.'
    },
    psychrometricBehavior: {
      processType: 'Paso Neutro / Disipativo (ΔT = 0, Δw = 0)',
      chartPathDescription: 'No altera las propiedades termodinámicas del aire.',
      variablesAffected: [{ symbol: 'Tbs', name: 'Temperatura', trend: 'constant', note: 'Inalterada' }],
      energyExchange: 'Pérdida de carga de 25 a 60 Pa según velocidad entre bafles.',
      formula: 'IL = \\text{Insertion Loss} \\approx 18 - 25 \\, \\text{dB en 250-1000 Hz}'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.1.4.3',
          title: 'Exigencia de confort acústico',
          requirement: 'Las instalaciones térmicas no deben superar los niveles sonoros máximos fijados en el CTE DB-HR (típicamente 30-35 dBA en oficinas; 25 dBA en dormitorios/hospitales).'
        },
        {
          code: 'UNE-EN ISO 7235',
          title: 'Medición de atenuación acústica en silenciadores',
          requirement: 'Ensayo normalizado de atenuación por inserción y ruido regenerado.'
        }
      ],
      standardRefs: ['RITE IT 1.1.4.3', 'CTE DB-HR', 'UNE-EN ISO 7235'],
      efficiencyThreshold: 'Atenuación mínima ≥ 18 dBA'
    },
    physicalComponents: {
      accessories: [
        { name: 'Bafles fonoabsorbentes con narices aerodinámicas redondeadas', symbol: '▤', purpose: 'Minimizan la turbulencia y el ruido regenerado por el paso del aire' },
        { name: 'Velo de vidrio de protección antiarrastre', symbol: '▦', purpose: 'Impide la erosión y desprendimiento de fibras hasta velocidades de 20 m/s' }
      ],
      materials: 'Paneles de lana mineral incombustible (Clase A1) de alta densidad (50 kg/m³) sobre marco de chapa galvanizada perforada.',
      assemblyNotes: 'Espaciamiento entre bafles calculado para no superar velocidades de paso de 4-5 m/s.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Semestral.',
      rd487Action: 'Aspirado con filtro HEPA de las ranuras entre bafles y control de ausencia de desprendimiento de fibras.',
      replacementCriteria: 'Rotura del tejido de protección o colmatación irreversible por polvo.',
      keyCheckpoints: [
        'Comprobar la integridad del velo protector de los bafles',
        'Verificar que no existen deformaciones mecánicas por la presión del aire'
      ]
    }
  },

  exhaust_damper: {
    type: 'exhaust_damper',
    canonicalName: 'Compuerta de Expulsión de Aire Viciado (EHA)',
    shortName: 'Expulsión EHA',
    icon: '🚪',
    badgeColor: '#10B981',
    functionPurpose: {
      summary: 'Regula y expulsa hacia el exterior el aire viciado no recirculado tras haber cedido su energía en el recuperador de calor.',
      primaryRole: 'Control de la presión del edificio y prevención de entradas de aire exterior cuando la UTA está detenida.',
      airStreamLocation: 'Descarga final del circuito de extracción de la UTA.',
      keyBenefits: [
        'Garantiza la salida fluida del aire viciado hacia el exterior',
        'Cierre estanco en parada para evitar efecto chimenea o retorno de aire contaminado',
        'Sincronizada con la compuerta de aire exterior (ODA)'
      ],
      criticalPitfall: 'Una compuerta bloqueada impide la expulsión provocando sobrepresión en el edificio y pérdida del caudal de ventilación.'
    },
    psychrometricBehavior: {
      processType: 'Paso Isentálpico hacia el Exterior (Punto 5 EHA)',
      chartPathDescription: 'Descarga final del aire tratado tras el recuperador. No afecta al aire impulsado al edificio.',
      variablesAffected: [{ symbol: 'Tbs', name: 'Temperatura', trend: 'constant', note: 'Inalterada en el paso' }],
      energyExchange: 'Pérdida de presión estática de 20 a 40 Pa.',
      formula: 'Q_{EHA} = Q_{ODA} \\, (\\text{en modo 100\\% aire exterior})'
    },
    normativeRITE: {
      articles: [
        {
          code: 'RITE IT 1.1.4.2.2',
          title: 'Expulsión de aire viciado',
          requirement: 'La expulsión debe realizarse a una distancia y altura adecuadas respecto a tomas de aire exterior y ventanas (mínimo 3 metros de distancia).'
        },
        {
          code: 'UNE-EN 1751',
          title: 'Estanqueidad de compuertas',
          requirement: 'Clase de estanqueidad mínima 2/3.'
        }
      ],
      standardRefs: ['RITE IT 1.1.4.2.2', 'UNE-EN 1751'],
      efficiencyThreshold: 'Estanqueidad Clase 2/3'
    },
    physicalComponents: {
      accessories: [
        { name: 'Actuador con resorte de seguridad [M]', symbol: 'M', purpose: 'Cierre hermético en caso de corte de suministro eléctrico' },
        { name: 'Lamas aerodinámicas con juntas de goma EPDM', symbol: '⧖', purpose: 'Evitan infiltraciones térmicas y corrientes de aire parásitas' }
      ],
      materials: 'Aluminio extruido resistente a la intemperie y condensados.',
      assemblyNotes: 'Conexión a conducto de expulsión o chimenea exterior con visera antilluvia.'
    },
    maintenanceHigiene: {
      inspectionFrequency: 'Trimestral.',
      rd487Action: 'Limpieza de lamas y eliminación de grasa o polvo acumulado.',
      replacementCriteria: 'Holguras o rotura del actuador.',
      keyCheckpoints: ['Cierre hermético con máquina parada', 'Libre giro de las lamas']
    }
  }
};
