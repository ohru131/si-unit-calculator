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
  { id: "science", label: { en: "School science", ja: "理科（小・中）" } },
  { id: "science-motion", label: { en: "Speed & motion", ja: "速さ・運動" }, parentId: "science" },
  { id: "science-density", label: { en: "Density & concentration", ja: "密度・濃度" }, parentId: "science" },
  { id: "science-pressure", label: { en: "Pressure & buoyancy", ja: "圧力・浮力" }, parentId: "science" },
  { id: "science-force-work", label: { en: "Force, work & levers", ja: "力・仕事・てこ" }, parentId: "science" },
  { id: "science-heat", label: { en: "Heat & temperature", ja: "熱・温度" }, parentId: "science" },
  { id: "science-electricity", label: { en: "Electricity & circuits", ja: "電気・回路" }, parentId: "science" },
  { id: "science-light-sound", label: { en: "Light & sound", ja: "光・音" }, parentId: "science" },
  { id: "science-earth", label: { en: "Earth science & weather", ja: "地学・天気" }, parentId: "science" },
  { id: "science-chemistry", label: { en: "Chemical change", ja: "化学変化" }, parentId: "science" },
  { id: "high-school-physics", label: { en: "High school physics", ja: "高校物理" } },
  { id: "physics-mechanics", label: { en: "Mechanics", ja: "力学" }, parentId: "high-school-physics" },
  { id: "physics-thermal", label: { en: "Thermodynamics", ja: "熱" }, parentId: "high-school-physics" },
  { id: "physics-waves", label: { en: "Waves", ja: "波動" }, parentId: "high-school-physics" },
  { id: "physics-electricity", label: { en: "Electricity", ja: "電気" }, parentId: "high-school-physics" },
  { id: "physics-atomic", label: { en: "Atomic physics", ja: "原子" }, parentId: "high-school-physics" },
  { id: "electricity-basics", label: { en: "Practical electricity", ja: "電気の基礎計算" } },
  { id: "astronomy", label: { en: "Astronomy & space", ja: "天体・宇宙" } },
  { id: "fitness", label: { en: "Fitness & running", ja: "フィットネス・ランニング" } },
  { id: "chemistry", label: { en: "Chemistry stoichiometry", ja: "化学の量的関係" } },
  { id: "vehicles", label: { en: "Physics of cars & bicycles", ja: "車・自転車の物理" } },
  { id: "cooking", label: { en: "Cooking & baking conversions", ja: "料理・製菓の単位換算" } },
  { id: "mechanics-of-materials", label: { en: "Mechanics of materials", ja: "材料力学" } },
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
