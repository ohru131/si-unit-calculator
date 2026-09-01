// プリセット計算ノートの「デフォルトファイル」（lib/notebook-formulas/default-notebooks.json）を
// lib/notebook-formulas/source/ 配下の手入力データから生成する。
// 手入力データ自体を編集したときは `pnpm notebooks:generate` で再生成すること。
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PRESET_NOTEBOOK_CATEGORIES } from "../lib/notebook-formulas/source/categories";
import { MATERIALS_SEEDS } from "../lib/notebook-formulas/source/materials";
import {
  PHYSICS_ATOMIC_SEEDS,
  PHYSICS_ELECTRICITY_SEEDS,
  PHYSICS_MECHANICS_SEEDS,
  PHYSICS_THERMAL_SEEDS,
  PHYSICS_WAVES_SEEDS,
} from "../lib/notebook-formulas/source/physics";
import {
  ASTRONOMY_SEEDS,
  CHEMISTRY_SEEDS,
  COOKING_SEEDS,
  ELECTRICITY_BASICS_SEEDS,
  FITNESS_SEEDS,
  VEHICLES_SEEDS,
} from "../lib/notebook-formulas/source/practical";
import type { NotebookSeed } from "../lib/notebook-formulas/types";

const seeds: Record<string, NotebookSeed[]> = {
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

const outFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "notebook-formulas", "default-notebooks.json");
writeFileSync(outFile, `${JSON.stringify({ categories: PRESET_NOTEBOOK_CATEGORIES, seeds }, null, 2)}\n`, "utf8");
console.log(`Wrote ${outFile}`);
