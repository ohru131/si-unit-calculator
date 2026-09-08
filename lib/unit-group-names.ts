import type { AppLanguage } from "./i18n";

// 単位グループ（lib/units.ts の UNIT_GROUPS の id）の表示名。
// 以前は lib/global-settings.tsx のモジュール内定数だったが、計算エンジンのエラーメッセージ
// （lib/unit-errors.ts）からも「長さ」「質量」のような量の名前を引きたいので、Reactに依存しない
// 純データとしてここに置く。unit-errors.ts は units.ts から import される側なので、
// units.ts へ依存を持てない（循環になる）。このファイルは i18n の型しか import しないため
// どこからでも安全に参照できる。
export const UNIT_GROUP_NAMES: Record<string, Record<AppLanguage, string>> = {
  length: { en: "Length", ja: "長さ", es: "Longitud", "pt-BR": "Comprimento", de: "Länge", fr: "Longueur" },
  area: { en: "Area", ja: "面積", es: "Área", "pt-BR": "Área", de: "Fläche", fr: "Superficie" },
  volume: { en: "Volume", ja: "体積", es: "Volumen", "pt-BR": "Volume", de: "Volumen", fr: "Volume" },
  time: { en: "Time", ja: "時間", es: "Tiempo", "pt-BR": "Tempo", de: "Zeit", fr: "Temps" },
  mass: { en: "Mass", ja: "質量", es: "Masa", "pt-BR": "Massa", de: "Masse", fr: "Masse" },
  temperature: { en: "Temperature", ja: "温度", es: "Temperatura", "pt-BR": "Temperatura", de: "Temperatur", fr: "Température" },
  velocity: { en: "Speed", ja: "速度", es: "Velocidad", "pt-BR": "Velocidade", de: "Geschwindigkeit", fr: "Vitesse" },
  acceleration: { en: "Acceleration", ja: "加速度", es: "Aceleración", "pt-BR": "Aceleração", de: "Beschleunigung", fr: "Accélération" },
  force: { en: "Force", ja: "力", es: "Fuerza", "pt-BR": "Força", de: "Kraft", fr: "Force" },
  pressure: { en: "Pressure", ja: "圧力", es: "Presión", "pt-BR": "Pressão", de: "Druck", fr: "Pression" },
  energy: { en: "Energy", ja: "エネルギー", es: "Energía", "pt-BR": "Energia", de: "Energie", fr: "Énergie" },
  power: { en: "Power", ja: "電力", es: "Potencia", "pt-BR": "Potência", de: "Leistung", fr: "Puissance" },
  current: { en: "Current", ja: "電流", es: "Corriente", "pt-BR": "Corrente", de: "Stromstärke", fr: "Courant" },
  voltage: { en: "Voltage", ja: "電圧", es: "Voltaje", "pt-BR": "Tensão", de: "Spannung", fr: "Tension" },
  frequency: { en: "Frequency", ja: "周波数", es: "Frecuencia", "pt-BR": "Frequência", de: "Frequenz", fr: "Fréquence" },
  angle: { en: "Angle", ja: "角度", es: "Ángulo", "pt-BR": "Ângulo", de: "Winkel", fr: "Angle" },
  ratio: { en: "Ratio", ja: "割合・無次元", es: "Proporción", "pt-BR": "Razão", de: "Verhältnis", fr: "Rapport" },
  amount: { en: "Amount of substance", ja: "物質量", es: "Cantidad de sustancia", "pt-BR": "Quantidade de matéria", de: "Stoffmenge", fr: "Quantité de matière" },
  // ここから下は電卓の単位ピッカーには出ないグループ（上級モードのみ・工学系）だが、
  // 次元不一致のエラーで「密度と圧力は足せません」のように名前を出すために持っておく。
  density: { en: "Density", ja: "密度", es: "Densidad", "pt-BR": "Densidade", de: "Dichte", fr: "Masse volumique" },
  resistance: { en: "Resistance", ja: "抵抗", es: "Resistencia", "pt-BR": "Resistência", de: "Widerstand", fr: "Résistance" },
  charge: { en: "Charge", ja: "電荷", es: "Carga", "pt-BR": "Carga", de: "Ladung", fr: "Charge" },
  capacitance: { en: "Capacitance", ja: "静電容量", es: "Capacitancia", "pt-BR": "Capacitância", de: "Kapazität", fr: "Capacité" },
  magneticFlux: { en: "Magnetic flux", ja: "磁束", es: "Flujo magnético", "pt-BR": "Fluxo magnético", de: "Magnetischer Fluss", fr: "Flux magnétique" },
  springConstant: { en: "Spring constant", ja: "ばね定数", es: "Constante elástica", "pt-BR": "Constante elástica", de: "Federkonstante", fr: "Constante de raideur" },
  specificHeatCapacity: { en: "Specific heat", ja: "比熱", es: "Calor específico", "pt-BR": "Calor específico", de: "Spezifische Wärmekapazität", fr: "Capacité thermique massique" },
  molarMass: { en: "Molar mass", ja: "モル質量", es: "Masa molar", "pt-BR": "Massa molar", de: "Molare Masse", fr: "Masse molaire" },
  // 無次元の値（裸の数値・割合）。UNIT_GROUPS には無い擬似グループで、次元不一致の
  // 説明（「長さと無次元の値は足せません」）のためだけに使う。
  dimensionless: { en: "a dimensionless value", ja: "無次元の値", es: "un valor adimensional", "pt-BR": "um valor adimensional", de: "ein dimensionsloser Wert", fr: "une valeur sans dimension" },
};

export function unitGroupName(groupId: string, language: AppLanguage): string | undefined {
  return UNIT_GROUP_NAMES[groupId]?.[language];
}
