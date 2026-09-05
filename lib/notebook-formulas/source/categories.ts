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
import { ELECTRONICS_SEEDS, SOLAR_SEEDS } from "./electronics";
import { ENG_POWER_SEEDS, ENG_ELEMENTS_SEEDS } from "./engineering-power";
import { ENG_STRESS_SEEDS } from "./engineering-stress";
import { BREWING_SEEDS, WEATHER_SEEDS } from "./lifestyle";
import { DIY_SEEDS, PRINTING_SEEDS } from "./making";
import { AUDIO_SEEDS, PHOTOGRAPHY_SEEDS } from "./media";
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
  // 表示順はこの配列の順そのまま。親カテゴリとその子（parentId付き）は必ず隣接させる。
  // 学習向けのまとまりを先に、専門色の強いものを後ろに置いている。
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
  { id: "chemistry", label: { en: "Chemistry stoichiometry", ja: "化学の量的関係", es: "Estequiometría química", "pt-BR": "Estequiometria química", de: "Stöchiometrie", fr: "Stœchiométrie" } },
  { id: "astronomy", label: { en: "Astronomy & space", ja: "天体・宇宙", es: "Astronomía y espacio", "pt-BR": "Astronomia e espaço", de: "Astronomie & Weltraum", fr: "Astronomie et espace" } },

  // ここから下は新設の親カテゴリ。子のIDは従来のまま変えていない（プリセットの投入は
  // カテゴリID単位で冪等なので、IDを変えると既存ユーザーのノートが重複投入される）。
  { id: "electricity-energy", label: { en: "Electricity & energy", ja: "電気・エネルギー", es: "Electricidad y energía", "pt-BR": "Eletricidade e energia", de: "Elektrizität & Energie", fr: "Électricité et énergie" } },
  { id: "electricity-basics", label: { en: "Practical electricity", ja: "電気の基礎計算", es: "Electricidad práctica", "pt-BR": "Eletricidade prática", de: "Praktische Elektrotechnik", fr: "Électricité pratique" }, parentId: "electricity-energy" },
  { id: "electronics", label: { en: "Hobby electronics", ja: "電子工作", es: "Electrónica para aficionados", "pt-BR": "Eletrônica para hobby", de: "Hobby-Elektronik", fr: "Électronique de loisir" }, parentId: "electricity-energy" },
  { id: "solar", label: { en: "Solar power & batteries", ja: "太陽光発電・蓄電", es: "Energía solar y baterías", "pt-BR": "Energia solar e baterias", de: "Solarstrom & Batterien", fr: "Énergie solaire et batteries" }, parentId: "electricity-energy" },
  { id: "hobbies-making", label: { en: "Hobbies & making", ja: "趣味・ものづくり", es: "Aficiones y creación", "pt-BR": "Hobbies e criação", de: "Hobby & Selbermachen", fr: "Loisirs et fabrication" } },
  { id: "photography", label: { en: "Photography", ja: "写真・カメラ", es: "Fotografía", "pt-BR": "Fotografia", de: "Fotografie", fr: "Photographie" }, parentId: "hobbies-making" },
  { id: "audio", label: { en: "Sound & audio", ja: "音響・オーディオ", es: "Sonido y audio", "pt-BR": "Som e áudio", de: "Ton & Audio", fr: "Son et audio" }, parentId: "hobbies-making" },
  { id: "diy", label: { en: "DIY & home improvement", ja: "DIY・住まい", es: "Bricolaje y reformas", "pt-BR": "Faça você mesmo e reformas", de: "Heimwerken & Renovieren", fr: "Bricolage et rénovation" }, parentId: "hobbies-making" },
  { id: "printing-3d", label: { en: "3D printing", ja: "3Dプリンタ", es: "Impresión 3D", "pt-BR": "Impressão 3D", de: "3D-Druck", fr: "Impression 3D" }, parentId: "hobbies-making" },
  { id: "home-life", label: { en: "Home & everyday life", ja: "暮らし", es: "Hogar y vida diaria", "pt-BR": "Casa e dia a dia", de: "Haushalt & Alltag", fr: "Maison et vie quotidienne" } },
  { id: "cooking", label: { en: "Cooking & baking conversions", ja: "料理・製菓の単位換算", es: "Cocina y repostería", "pt-BR": "Culinária e confeitaria", de: "Kochen & Backen", fr: "Cuisine et pâtisserie" }, parentId: "home-life" },
  { id: "brewing", label: { en: "Coffee & home brewing", ja: "コーヒー・自家醸造", es: "Café y elaboración casera", "pt-BR": "Café e produção caseira", de: "Kaffee & Hausbrauen", fr: "Café et brassage maison" }, parentId: "home-life" },
  { id: "fitness", label: { en: "Fitness & running", ja: "フィットネス・ランニング", es: "Fitness y running", "pt-BR": "Fitness e corrida", de: "Fitness & Laufen", fr: "Fitness et course à pied" }, parentId: "home-life" },
  { id: "weather", label: { en: "Weather & atmosphere", ja: "天気・大気", es: "Tiempo y atmósfera", "pt-BR": "Tempo e atmosfera", de: "Wetter & Atmosphäre", fr: "Météo et atmosphère" }, parentId: "home-life" },
  { id: "vehicles", label: { en: "Physics of cars & bicycles", ja: "車・自転車の物理", es: "Física de los vehículos", "pt-BR": "Física dos veículos", de: "Physik von Autos & Fahrrädern", fr: "Physique des voitures et vélos" } },

  // 材料力学は「はり・柱」に絞り、機械設計の他分野と並べた（旧IDは維持）。
  { id: "engineering-design", label: { en: "Mechanical & structural design", ja: "機械・構造設計", es: "Diseño mecánico y estructural", "pt-BR": "Projeto mecânico e estrutural", de: "Maschinen- & Tragwerksentwurf", fr: "Conception mécanique et structurale" } },
  { id: "eng-stress", label: { en: "Stress, strain & safety", ja: "応力・ひずみ・安全率", es: "Esfuerzo, deformación y seguridad", "pt-BR": "Tensão, deformação e segurança", de: "Spannung, Dehnung & Sicherheit", fr: "Contrainte, déformation et sécurité" }, parentId: "engineering-design" },
  { id: "mechanics-of-materials", label: { en: "Beams & columns", ja: "はり・柱", es: "Vigas y columnas", "pt-BR": "Vigas e colunas", de: "Balken & Stützen", fr: "Poutres et poteaux" }, parentId: "engineering-design" },
  { id: "eng-power", label: { en: "Shafts, torsion & power transmission", ja: "軸・ねじり・動力伝達", es: "Ejes, torsión y transmisión de potencia", "pt-BR": "Eixos, torção e transmissão de potência", de: "Wellen, Torsion & Antriebstechnik", fr: "Arbres, torsion et transmission de puissance" }, parentId: "engineering-design" },
  { id: "eng-elements", label: { en: "Machine elements & joints", ja: "機械要素・締結", es: "Elementos de máquinas y uniones", "pt-BR": "Elementos de máquinas e uniões", de: "Maschinenelemente & Verbindungen", fr: "Éléments de machines et assemblages" }, parentId: "engineering-design" },
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
  electronics: ELECTRONICS_SEEDS,
  solar: SOLAR_SEEDS,
  photography: PHOTOGRAPHY_SEEDS,
  audio: AUDIO_SEEDS,
  diy: DIY_SEEDS,
  "printing-3d": PRINTING_SEEDS,
  brewing: BREWING_SEEDS,
  weather: WEATHER_SEEDS,
  "eng-stress": ENG_STRESS_SEEDS,
  "eng-power": ENG_POWER_SEEDS,
  "eng-elements": ENG_ELEMENTS_SEEDS,
};
