import type { NotebookSeed, PresetNotebookCategory } from "../types";
import { MATERIALS_SEEDS } from "./materials";
import {
  PHYSICS_ATOMIC_SEEDS,
  PHYSICS_ELECTRICITY_SEEDS,
  PHYSICS_MECHANICS_SEEDS,
  PHYSICS_THERMAL_SEEDS,
  PHYSICS_WAVES_SEEDS,
} from "./physics";
import {
  ASTRONOMY_SEEDS,
  CHEMISTRY_SEEDS,
  COOKING_SEEDS,
  ELECTRICITY_BASICS_SEEDS,
  FITNESS_SEEDS,
  VEHICLES_SEEDS,
} from "./practical";
import {
  SCIENCE_CHEMISTRY_SEEDS,
  SCIENCE_DENSITY_SEEDS,
  SCIENCE_EARTH_SEEDS,
  SCIENCE_ELECTRICITY_SEEDS,
  SCIENCE_FORCE_WORK_SEEDS,
  SCIENCE_HEAT_SEEDS,
  SCIENCE_LIGHT_SOUND_SEEDS,
  SCIENCE_MOTION_SEEDS,
  SCIENCE_PRESSURE_SEEDS,
} from "./science";

export const PRESET_NOTEBOOK_CATEGORIES: PresetNotebookCategory[] = [
  { id: "science", label: { en: "School science", ja: "理科（小・中）", es: "Ciencias naturales", "pt-BR": "Ciências", de: "Naturwissenschaften", fr: "Sciences" } },
  { id: "science-motion", label: { en: "Speed & motion", ja: "速さ・運動", es: "Velocidad y movimiento", "pt-BR": "Velocidade e movimento", de: "Geschwindigkeit & Bewegung", fr: "Vitesse et mouvement" }, parentId: "science" },
  { id: "science-density", label: { en: "Density & concentration", ja: "密度・濃度", es: "Densidad y concentración", "pt-BR": "Densidade e concentração", de: "Dichte & Konzentration", fr: "Masse volumique et concentration" }, parentId: "science" },
  { id: "science-pressure", label: { en: "Pressure & buoyancy", ja: "圧力・浮力", es: "Presión y flotabilidad", "pt-BR": "Pressão e empuxo", de: "Druck & Auftrieb", fr: "Pression et flottabilité" }, parentId: "science" },
  { id: "science-force-work", label: { en: "Force, work & levers", ja: "力・仕事・てこ", es: "Fuerza, trabajo y palancas", "pt-BR": "Força, trabalho e alavancas", de: "Kraft, Arbeit & Hebel", fr: "Force, travail et leviers" }, parentId: "science" },
  { id: "science-heat", label: { en: "Heat & temperature", ja: "熱・温度", es: "Calor y temperatura", "pt-BR": "Calor e temperatura", de: "Wärme & Temperatur", fr: "Chaleur et température" }, parentId: "science" },
  { id: "science-electricity", label: { en: "Electricity & circuits", ja: "電気・回路", es: "Electricidad y circuitos", "pt-BR": "Eletricidade e circuitos", de: "Elektrizität & Stromkreise", fr: "Électricité et circuits" }, parentId: "science" },
  { id: "science-light-sound", label: { en: "Light & sound", ja: "光・音", es: "Luz y sonido", "pt-BR": "Luz e som", de: "Licht & Schall", fr: "Lumière et son" }, parentId: "science" },
  { id: "science-earth", label: { en: "Earth science & weather", ja: "地学・天気", es: "Ciencias de la Tierra y clima", "pt-BR": "Ciências da Terra e clima", de: "Geowissenschaften & Wetter", fr: "Sciences de la Terre et météo" }, parentId: "science" },
  { id: "science-chemistry", label: { en: "Chemical change", ja: "化学変化", es: "Cambio químico", "pt-BR": "Mudança química", de: "Chemische Veränderung", fr: "Transformation chimique" }, parentId: "science" },
  { id: "high-school-physics", label: { en: "High school physics", ja: "高校物理", es: "Física (bachillerato)", "pt-BR": "Física (Ensino Médio)", de: "Physik (Oberstufe)", fr: "Physique (lycée)" } },
  { id: "physics-mechanics", label: { en: "Mechanics", ja: "力学", es: "Mecánica", "pt-BR": "Mecânica", de: "Mechanik", fr: "Mécanique" }, parentId: "high-school-physics" },
  { id: "physics-thermal", label: { en: "Thermodynamics", ja: "熱", es: "Termodinámica", "pt-BR": "Termodinâmica", de: "Thermodynamik", fr: "Thermodynamique" }, parentId: "high-school-physics" },
  { id: "physics-waves", label: { en: "Waves", ja: "波動", es: "Ondas", "pt-BR": "Ondas", de: "Wellen", fr: "Ondes" }, parentId: "high-school-physics" },
  { id: "physics-electricity", label: { en: "Electricity", ja: "電気", es: "Electricidad", "pt-BR": "Eletricidade", de: "Elektrizität", fr: "Électricité" }, parentId: "high-school-physics" },
  { id: "physics-atomic", label: { en: "Atomic physics", ja: "原子", es: "Física atómica", "pt-BR": "Física atômica", de: "Atomphysik", fr: "Physique atomique" }, parentId: "high-school-physics" },
  { id: "electricity-basics", label: { en: "Practical electricity", ja: "電気の基礎計算", es: "Electricidad práctica", "pt-BR": "Eletricidade prática", de: "Praktische Elektrotechnik", fr: "Électricité pratique" } },
  { id: "astronomy", label: { en: "Astronomy & space", ja: "天体・宇宙", es: "Astronomía y espacio", "pt-BR": "Astronomia e espaço", de: "Astronomie & Weltraum", fr: "Astronomie et espace" } },
  { id: "fitness", label: { en: "Fitness & running", ja: "フィットネス・ランニング", es: "Fitness y running", "pt-BR": "Fitness e corrida", de: "Fitness & Laufen", fr: "Fitness et course à pied" } },
  { id: "chemistry", label: { en: "Chemistry stoichiometry", ja: "化学の量的関係", es: "Estequiometría química", "pt-BR": "Estequiometria química", de: "Stöchiometrie", fr: "Stœchiométrie" } },
  { id: "vehicles", label: { en: "Physics of cars & bicycles", ja: "車・自転車の物理", es: "Física de los vehículos", "pt-BR": "Física dos veículos", de: "Physik von Autos & Fahrrädern", fr: "Physique des voitures et vélos" } },
  { id: "cooking", label: { en: "Cooking & baking conversions", ja: "料理・製菓の単位換算", es: "Cocina y repostería", "pt-BR": "Culinária e confeitaria", de: "Kochen & Backen", fr: "Cuisine et pâtisserie" } },
  { id: "mechanics-of-materials", label: { en: "Mechanics of materials", ja: "材料力学", es: "Resistencia de materiales", "pt-BR": "Resistência dos materiais", de: "Festigkeitslehre", fr: "Résistance des matériaux" } },
];

/**
 * カテゴリID→プリセット計算ノートの対応表。
 * 新しいカテゴリを追加するときは、上のPRESET_NOTEBOOK_CATEGORIESに1件足すのに加えて、
 * ここにもカテゴリIDとノート配列（source/配下の各ドメインファイルでexportしたもの）を1行足すだけでよい
 * （「high-school-physics」のような親カテゴリ自体はノートを持たないグループなので、ここには含めない）。
 */
export const PRESET_NOTEBOOK_SEEDS: Record<string, NotebookSeed[]> = {
  "science-motion": SCIENCE_MOTION_SEEDS,
  "science-density": SCIENCE_DENSITY_SEEDS,
  "science-pressure": SCIENCE_PRESSURE_SEEDS,
  "science-force-work": SCIENCE_FORCE_WORK_SEEDS,
  "science-heat": SCIENCE_HEAT_SEEDS,
  "science-electricity": SCIENCE_ELECTRICITY_SEEDS,
  "science-light-sound": SCIENCE_LIGHT_SOUND_SEEDS,
  "science-earth": SCIENCE_EARTH_SEEDS,
  "science-chemistry": SCIENCE_CHEMISTRY_SEEDS,
  "mechanics-of-materials": MATERIALS_SEEDS,
  "physics-mechanics": PHYSICS_MECHANICS_SEEDS,
  "physics-thermal": PHYSICS_THERMAL_SEEDS,
  "physics-waves": PHYSICS_WAVES_SEEDS,
  "physics-electricity": PHYSICS_ELECTRICITY_SEEDS,
  "physics-atomic": PHYSICS_ATOMIC_SEEDS,
  "electricity-basics": ELECTRICITY_BASICS_SEEDS,
  astronomy: ASTRONOMY_SEEDS,
  fitness: FITNESS_SEEDS,
  chemistry: CHEMISTRY_SEEDS,
  vehicles: VEHICLES_SEEDS,
  cooking: COOKING_SEEDS,
};
