export type HybridContentType = 'tutorial' | 'insight' | 'case-study' | 'trend-analysis' | 'how-to';

export interface HybridTopic {
  id: string;
  title: string;
  description: string;
  type: HybridContentType;
  targetAudience: string[];
  keyPoints: string[];
  examples?: string[];
}

export const HYBRID_TOPICS: HybridTopic[] = [
  {
    id: 'ai-fault-detection',
    title: 'Cómo la IA detecta fallas en sistemas eléctricos',
    description: 'Machine learning para predictive maintenance en instalaciones',
    type: 'tutorial',
    targetAudience: ['Instaladores eléctricos', 'Ingenieros', 'Tech enthusiasts'],
    keyPoints: [
      'Detectar anomalías antes de que fallen',
      'Reducir downtime y costos de mantenimiento',
      'Integrar sensores IoT con modelos de IA',
      'Análisis de patrones de consumo',
    ],
    examples: [
      'Transformadores inteligentes con monitoreo en tiempo real',
      'Paneles solares optimizados con IA',
      'Sistemas de respaldo automáticos',
    ],
  },
  {
    id: 'smart-home-wiring',
    title: 'Smart Homes: IA + Instalación eléctrica inteligente',
    description: 'Cómo implementar hogares inteligentes desde cero',
    type: 'how-to',
    targetAudience: ['Instaladores', 'Constructores', 'Propietarios tech'],
    keyPoints: [
      'Planificar infraestructura para IoT desde proyecto',
      'Integrar IA en sistemas de iluminación, calefacción, seguridad',
      'Automatización responsiva y eficiente',
      'Interoperabilidad entre dispositivos',
    ],
    examples: [
      'Luz que se ajusta según ocupación (IA + sensores)',
      'Calefacción predictiva que aprende tus patrones',
      'Seguridad inteligente con detección de anomalías',
    ],
  },
  {
    id: 'hybrid-career-advantage',
    title: 'Por qué ser desarrollador IA + técnico eléctrico es una ventaja única',
    description: 'Posicionamiento diferenciado en era de IoT y automatización',
    type: 'insight',
    targetAudience: ['Estudiantes tech', 'Profesionales en transición', 'Emprendedores'],
    keyPoints: [
      'Brecha de talento: pocos combinan ambas habilidades',
      'Demanda creciente en automatización industrial y smart cities',
      'Capacidad de end-to-end: hardware a software IA',
      'Múltiples mercados: construcción, energía, manufactura',
    ],
    examples: [
      'Startups de IoT buscan desesperadamente este perfil',
      'Consultoría en transformación digital de plantas eléctricas',
      'Productos: medidores inteligentes, controladores, dashboards',
    ],
  },
  {
    id: 'predictive-maintenance',
    title: 'Mantenimiento predictivo: IA para instalaciones eléctricas',
    description: 'Evitar fallos antes de que ocurran con modelos de machine learning',
    type: 'case-study',
    targetAudience: ['Facility managers', 'Empresas de energía', 'Ingenieros'],
    keyPoints: [
      'Recolectar datos de sensores (voltaje, corriente, temperatura)',
      'Entrenar modelos para identificar patrones de falla',
      'Alertas automáticas cuando se detecte deterioro',
      'ROI: ahorro de costos emergentes + downtime',
    ],
    examples: [
      'Caso: planta industrial redujo paros en 60%',
      'Transformador que predice su propia falla 3 semanas antes',
      'Sistema que optimiza automáticamente factor de potencia',
    ],
  },
  {
    id: 'stack-hybrid-developer',
    title: 'Mi stack como desarrollador IA + electricista',
    description: 'Herramientas, lenguajes y frameworks que uso en ambos mundos',
    type: 'trend-analysis',
    targetAudience: ['Desarrolladores', 'Técnicos', 'Curiosos'],
    keyPoints: [
      'Lenguajes: Python (IA) + TypeScript (backend) + C/Assembly (firmware)',
      'MLOps: Claude API, TensorFlow, scikit-learn',
      'Hardware: Arduino, Raspberry Pi, sensores IoT',
      'Cloud: Supabase, APIs REST, edge computing',
    ],
    examples: [
      'Pipeline de datos: sensores → Supabase → Claude → automatización',
      'Monitoreo en tiempo real con dashboards personalizados',
      'Automatización de reportes y alertas vía Telegram/Email',
    ],
  },
  {
    id: 'energy-optimization',
    title: 'Optimización de energía: IA aprendiendo tus patrones eléctricos',
    description: 'Reducir consumo y costos de electricidad con inteligencia artificial',
    type: 'tutorial',
    targetAudience: ['Propietarios', 'Empresas', 'Ambientalistas'],
    keyPoints: [
      'Monitorear consumo por dispositivo con sensores',
      'IA predice picos de demanda y optimiza',
      'Integración con energías renovables (solar/eólica)',
      'Ahorros típicos: 15-30% en factura eléctrica',
    ],
    examples: [
      'IA que desconecta cargas no-críticas en horarios caros',
      'Predicción de generación solar para maximizar auto-consumo',
      'Reportes automáticos: "Electrodoméstico X consume 40% más que hace 3 meses"',
    ],
  },
  {
    id: 'iot-security-electrical',
    title: 'Seguridad IoT en sistemas eléctricos: IA vigilando anomalías',
    description: 'Detectar intentos de sabotaje o manipulación en infraestructura eléctrica',
    type: 'insight',
    targetAudience: ['CISOs', 'Ingenieros de crítica', 'Operadores de redes'],
    keyPoints: [
      'Anomalías de patrones = posible ataque o falla',
      'IA detecta comportamiento anómalo en tiempo real',
      'Certificaciones y compliance (NIST, IEC 62351)',
      'Diferencia entre falla técnica vs. ataque intencional',
    ],
    examples: [
      'Subestación que detectó intruso intentando manipular voltaje',
      'Sistema que identifica malware en controladores eléctricos',
      'Alertas automáticas a autoridades ante anomalías críticas',
    ],
  },
  {
    id: 'diy-smart-projects',
    title: 'Proyectos DIY: Automatiza tu hogar con IA y cable de cobre',
    description: 'Guía práctica para crear sistemas inteligentes desde cero',
    type: 'how-to',
    targetAudience: ['Makers', 'Aficionados tech', 'Homeowners'],
    keyPoints: [
      'Presupuesto accesible (Raspberry Pi + sensores ~$100)',
      'Sin habilidades eléctricas avanzadas necesarias',
      'Modular: empezar pequeño, escalar después',
      'Comunidad de makers apoyando',
    ],
    examples: [
      'Proyecto 1: Luz inteligente que aprende tu rutina',
      'Proyecto 2: Monitor de consumo con alertas',
      'Proyecto 3: Controlador de temperatura con predicción',
    ],
  },
];

export function getRandomHybridTopic(): HybridTopic {
  return HYBRID_TOPICS[Math.floor(Math.random() * HYBRID_TOPICS.length)];
}

export function getHybridTopicById(id: string): HybridTopic | undefined {
  return HYBRID_TOPICS.find((t) => t.id === id);
}
