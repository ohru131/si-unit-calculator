import type { SampleCategory } from "@/lib/sample-calculations";
import type { UnitGroup, UnitOption } from "@/lib/units";

export const ADVANCED_GROUP_IDS = new Set(["acceleration", "angle", "frequency"]);
export const ADVANCED_UNIT_SYMBOLS = new Set(["kine", "kt", "ft/s", "Gal", "mGal", "µGal", "G", "g0", "ft/s²", "rad", "deg", "°"]);
export const ADVANCED_SAMPLE_CATEGORIES = new Set<SampleCategory>(["math"]);

export function isUnitGroupVisible(group: UnitGroup, isAdvancedMode: boolean) {
  return isAdvancedMode || !ADVANCED_GROUP_IDS.has(group.id);
}

export function isUnitVisible(unit: UnitOption, isAdvancedMode: boolean) {
  return isAdvancedMode || !ADVANCED_UNIT_SYMBOLS.has(unit.symbol);
}

export function visibleUnits(units: UnitOption[], isAdvancedMode: boolean) {
  return units.filter((unit) => isUnitVisible(unit, isAdvancedMode));
}

export function isSampleCategoryVisible(category: SampleCategory, isAdvancedMode: boolean) {
  return isAdvancedMode || !ADVANCED_SAMPLE_CATEGORIES.has(category);
}
