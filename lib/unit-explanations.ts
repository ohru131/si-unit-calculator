import type { LocalizedText } from "./i18n";

export type UnitExplanation = {
  symbol: string;
  name: LocalizedText;
  summary: LocalizedText;
  siConversion: string;
  usage: LocalizedText;
};

export const SPECIAL_UNIT_EXPLANATIONS: Record<string, UnitExplanation> = {
  Gal: {
    symbol: "Gal",
    name: { ja: "ガル", en: "Gal", es: "Gal", "pt-BR": "Gal", de: "Gal", fr: "Gal" },
    summary: {
      ja: "測地・地球物理で使われる加速度単位です。",
      en: "An acceleration unit used in geodesy and geophysics.",
      es: "Una unidad de aceleración utilizada en geodesia y geofísica.",
      "pt-BR": "Uma unidade de aceleração usada em geodésia e geofísica.",
      de: "Eine in der Geodäsie und Geophysik verwendete Beschleunigungseinheit.",
      fr: "Une unité d'accélération utilisée en géodésie et en géophysique.",
    },
    siConversion: "1 Gal = 0.01 m/s²",
    usage: {
      ja: "重力・地震・地盤の微小な加速度変化",
      en: "Gravity, earthquakes, and small ground-motion changes",
      es: "Gravedad, terremotos y pequeños cambios en el movimiento del suelo",
      "pt-BR": "Gravidade, terremotos e pequenas variações no movimento do solo",
      de: "Schwerkraft, Erdbeben und kleine Bodenbewegungsänderungen",
      fr: "Gravité, séismes et petites variations du mouvement du sol",
    },
  },
  mGal: {
    symbol: "mGal",
    name: { ja: "ミリガル", en: "Milligal", es: "Miligal", "pt-BR": "Miligal", de: "Milligal", fr: "Milligal" },
    summary: {
      ja: "Galの1,000分の1で、重力変化の表現に使われます。",
      en: "One thousandth of a Gal, used for gravity variations.",
      es: "Una milésima parte de un Gal, utilizada para expresar variaciones de gravedad.",
      "pt-BR": "Um milésimo de um Gal, usado para expressar variações de gravidade.",
      de: "Ein Tausendstel eines Gal, verwendet zur Darstellung von Schwereänderungen.",
      fr: "Un millième de Gal, utilisé pour exprimer les variations de gravité.",
    },
    siConversion: "1 mGal = 1×10⁻⁵ m/s²",
    usage: {
      ja: "重力探査・地殻変動",
      en: "Gravity surveys and crustal deformation",
      es: "Prospección gravimétrica y deformación cortical",
      "pt-BR": "Levantamentos gravimétricos e deformação crustal",
      de: "Schweremessungen und Krustendeformation",
      fr: "Prospection gravimétrique et déformation crustale",
    },
  },
  "µGal": {
    symbol: "µGal",
    name: { ja: "マイクロガル", en: "Microgal", es: "Microgal", "pt-BR": "Microgal", de: "Mikrogal", fr: "Microgal" },
    summary: {
      ja: "Galの100万分の1で、非常に小さな重力変化を表します。",
      en: "One millionth of a Gal for very small gravity variations.",
      es: "Una millonésima parte de un Gal para variaciones de gravedad muy pequeñas.",
      "pt-BR": "Um milionésimo de um Gal para variações de gravidade muito pequenas.",
      de: "Ein Millionstel eines Gal für sehr kleine Schwereänderungen.",
      fr: "Un millionième de Gal pour de très petites variations de gravité.",
    },
    siConversion: "1 µGal = 1×10⁻⁸ m/s²",
    usage: {
      ja: "高精度重力計測",
      en: "High-precision gravimetry",
      es: "Gravimetría de alta precisión",
      "pt-BR": "Gravimetria de alta precisão",
      de: "Hochpräzise Gravimetrie",
      fr: "Gravimétrie de haute précision",
    },
  },
  G: {
    symbol: "G",
    name: { ja: "標準重力", en: "Standard gravity", es: "Gravedad estándar", "pt-BR": "Gravidade padrão", de: "Normfallbeschleunigung", fr: "Gravité normale" },
    summary: {
      ja: "地球上の基準加速度を表す慣用単位です。",
      en: "A conventional unit representing standard Earth gravity.",
      es: "Una unidad convencional que representa la gravedad terrestre estándar.",
      "pt-BR": "Uma unidade convencional que representa a gravidade terrestre padrão.",
      de: "Eine konventionelle Einheit für die Standard-Erdbeschleunigung.",
      fr: "Une unité conventionnelle représentant la gravité terrestre normale.",
    },
    siConversion: "1 G = 9.80665 m/s²",
    usage: {
      ja: "加速度計・振動・G荷重",
      en: "Accelerometers, vibration, and G-loads",
      es: "Acelerómetros, vibraciones y cargas G",
      "pt-BR": "Acelerômetros, vibração e cargas G",
      de: "Beschleunigungssensoren, Vibrationen und G-Lasten",
      fr: "Accéléromètres, vibrations et charges G",
    },
  },
  g0: {
    symbol: "g0",
    name: { ja: "標準重力", en: "Standard gravity", es: "Gravedad estándar", "pt-BR": "Gravidade padrão", de: "Normfallbeschleunigung", fr: "Gravité normale" },
    summary: {
      ja: "Gと同じ標準重力を明示する別記法です。",
      en: "An alternate notation for the same standard gravity as G.",
      es: "Una notación alternativa para la misma gravedad estándar que G.",
      "pt-BR": "Uma notação alternativa para a mesma gravidade padrão representada por G.",
      de: "Eine alternative Schreibweise für dieselbe Normfallbeschleunigung wie G.",
      fr: "Une notation alternative pour désigner la même gravité normale que G.",
    },
    siConversion: "1 g0 = 9.80665 m/s²",
    usage: {
      ja: "科学・技術文書",
      en: "Scientific and technical documentation",
      es: "Documentación científica y técnica",
      "pt-BR": "Documentação científica e técnica",
      de: "Wissenschaftliche und technische Dokumentation",
      fr: "Documentation scientifique et technique",
    },
  },
  kine: {
    symbol: "kine",
    name: { ja: "カイン", en: "Kine", es: "Kine", "pt-BR": "Kine", de: "Kine", fr: "Kine" },
    summary: {
      ja: "CGS系で使われる速度単位です。",
      en: "A speed unit used in the CGS system.",
      es: "Una unidad de velocidad utilizada en el sistema CGS.",
      "pt-BR": "Uma unidade de velocidade usada no sistema CGS.",
      de: "Eine im CGS-System verwendete Geschwindigkeitseinheit.",
      fr: "Une unité de vitesse utilisée dans le système CGS.",
    },
    siConversion: "1 kine = 1 cm/s = 0.01 m/s",
    usage: {
      ja: "古いCGS系の科学・工学資料",
      en: "Legacy CGS scientific and engineering sources",
      es: "Fuentes científicas y técnicas antiguas del sistema CGS",
      "pt-BR": "Fontes científicas e técnicas antigas do sistema CGS",
      de: "Ältere wissenschaftliche und technische Quellen im CGS-System",
      fr: "Anciennes sources scientifiques et techniques du système CGS",
    },
  },
  kt: {
    symbol: "kt",
    name: { ja: "ノット", en: "Knot", es: "Nudo", "pt-BR": "Nó", de: "Knoten", fr: "Nœud" },
    summary: {
      ja: "海里毎時で表す航海・航空の速度単位です。",
      en: "A nautical and aviation speed unit expressed in nautical miles per hour.",
      es: "Una unidad de velocidad náutica y aeronáutica expresada en millas náuticas por hora.",
      "pt-BR": "Uma unidade de velocidade náutica e aeronáutica expressa em milhas náuticas por hora.",
      de: "Eine in der Seefahrt und Luftfahrt verwendete Geschwindigkeitseinheit in Seemeilen pro Stunde.",
      fr: "Une unité de vitesse maritime et aéronautique exprimée en milles marins par heure.",
    },
    siConversion: "1 kt = 0.514444444 m/s",
    usage: {
      ja: "船舶・航空・気象",
      en: "Marine, aviation, and meteorology",
      es: "Navegación marítima, aviación y meteorología",
      "pt-BR": "Navegação marítima, aviação e meteorologia",
      de: "Schifffahrt, Luftfahrt und Meteorologie",
      fr: "Navigation maritime, aviation et météorologie",
    },
  },
  mph: {
    symbol: "mph",
    name: { ja: "マイル毎時", en: "Miles per hour", es: "Millas por hora", "pt-BR": "Milhas por hora", de: "Meilen pro Stunde", fr: "Miles par heure" },
    summary: {
      ja: "1時間に進むマイル数で表す速度単位です。",
      en: "A speed unit expressed in miles travelled per hour.",
      es: "Una unidad de velocidad expresada en millas recorridas por hora.",
      "pt-BR": "Uma unidade de velocidade expressa em milhas percorridas por hora.",
      de: "Eine Geschwindigkeitseinheit, ausgedrückt in zurückgelegten Meilen pro Stunde.",
      fr: "Une unité de vitesse exprimée en miles parcourus par heure.",
    },
    siConversion: "1 mph = 0.44704 m/s",
    usage: {
      ja: "米国・英国の道路速度",
      en: "Road speeds in the US and UK",
      es: "Velocidades en carretera en EE. UU. y Reino Unido",
      "pt-BR": "Velocidades rodoviárias nos EUA e no Reino Unido",
      de: "Straßengeschwindigkeiten in den USA und im Vereinigten Königreich",
      fr: "Vitesses routières aux États-Unis et au Royaume-Uni",
    },
  },
  "ft/s": {
    symbol: "ft/s",
    name: { ja: "フィート毎秒", en: "Feet per second", es: "Pies por segundo", "pt-BR": "Pés por segundo", de: "Fuß pro Sekunde", fr: "Pieds par seconde" },
    summary: {
      ja: "1秒に進むフィート数で表す速度単位です。",
      en: "A speed unit expressed in feet travelled per second.",
      es: "Una unidad de velocidad expresada en pies recorridos por segundo.",
      "pt-BR": "Uma unidade de velocidade expressa em pés percorridos por segundo.",
      de: "Eine Geschwindigkeitseinheit, ausgedrückt in zurückgelegten Fuß pro Sekunde.",
      fr: "Une unité de vitesse exprimée en pieds parcourus par seconde.",
    },
    siConversion: "1 ft/s = 0.3048 m/s",
    usage: {
      ja: "工学・航空・流体計測",
      en: "Engineering, aviation, and flow measurement",
      es: "Ingeniería, aviación y medición de flujo",
      "pt-BR": "Engenharia, aviação e medição de vazão",
      de: "Technik, Luftfahrt und Strömungsmessung",
      fr: "Ingénierie, aviation et mesure de débit",
    },
  },
};

export function getUnitExplanation(symbol: string): UnitExplanation | undefined {
  return SPECIAL_UNIT_EXPLANATIONS[symbol];
}
