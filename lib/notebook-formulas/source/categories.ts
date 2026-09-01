import type { PresetNotebookCategory } from "../types";

export const PRESET_NOTEBOOK_CATEGORIES: PresetNotebookCategory[] = [
  { id: "mechanics-of-materials", label: "材料力学", labelEn: "Mechanics of materials" },
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
];
