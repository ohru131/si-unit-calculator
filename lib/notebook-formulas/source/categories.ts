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
  { id: "science", label: "理科（小・中）", labelEn: "School science" },
  { id: "science-motion", label: "速さ・運動", labelEn: "Speed & motion", parentId: "science" },
  { id: "science-density", label: "密度・濃度", labelEn: "Density & concentration", parentId: "science" },
  { id: "science-pressure", label: "圧力・浮力", labelEn: "Pressure & buoyancy", parentId: "science" },
  { id: "science-force-work", label: "力・仕事・てこ", labelEn: "Force, work & levers", parentId: "science" },
  { id: "science-heat", label: "熱・温度", labelEn: "Heat & temperature", parentId: "science" },
  { id: "science-electricity", label: "電気・回路", labelEn: "Electricity & circuits", parentId: "science" },
  { id: "science-light-sound", label: "光・音", labelEn: "Light & sound", parentId: "science" },
  { id: "science-earth", label: "地学・天気", labelEn: "Earth science & weather", parentId: "science" },
  { id: "science-chemistry", label: "化学変化", labelEn: "Chemical change", parentId: "science" },
  { id: "high-school-physics", label: "高校物理", labelEn: "High school physics" },
  { id: "physics-mechanics", label: "力学", labelEn: "Mechanics", parentId: "high-school-physics" },
  { id: "physics-thermal", label: "熱", labelEn: "Thermodynamics", parentId: "high-school-physics" },
  { id: "physics-waves", label: "波動", labelEn: "Waves", parentId: "high-school-physics" },
  { id: "physics-electricity", label: "電気", labelEn: "Electricity", parentId: "high-school-physics" },
  { id: "physics-atomic", label: "原子", labelEn: "Atomic physics", parentId: "high-school-physics" },
  { id: "electricity-basics", label: "電気の基礎計算", labelEn: "Practical electricity" },
  { id: "astronomy", label: "天体・宇宙", labelEn: "Astronomy & space" },
  { id: "fitness", label: "フィットネス・ランニング", labelEn: "Fitness & running" },
  { id: "chemistry", label: "化学の量的関係", labelEn: "Chemistry stoichiometry" },
  { id: "vehicles", label: "車・自転車の物理", labelEn: "Physics of cars & bicycles" },
  { id: "cooking", label: "料理・製菓の単位換算", labelEn: "Cooking & baking conversions" },
  { id: "mechanics-of-materials", label: "材料力学", labelEn: "Mechanics of materials" },
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
