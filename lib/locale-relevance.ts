import type { AppLanguage } from "./i18n";

/**
 * 言語ごとの「関連度」の並び順。
 *
 * 何を先頭に出すかは docs/target-users-by-locale-2026-09.md 第1節で決めた各言語のターゲット層に従う
 * （de=電気系Ausbildungの訓練生とKlausur、en=FE受験者と工学部生、fr=lycéeのphysique-chimie、
 * es=EBAUのfísica、pt-BR=ENEM、ja=電験三種・電工二種）。サンプルもカテゴリも一覧の先頭が
 * 一番読まれるので、「その言語の相手が最初に開くもの」を上に持ってくる。
 *
 * **ここに書くのは先頭へ持ち上げるIDの列だけ**で、書かなかったIDは元の配列順のまま後ろに続く。
 * 全件を6言語ぶん書き並べる形にすると、カテゴリやサンプルを1件足すたびに6箇所直す必要が出て
 * 必ずどこかが漏れる（漏れても型エラーにはならず、その言語だけ新項目が消えるのではなく
 * 順序が黙ってずれるので気付けない）。列に無いIDが混ざっていても無視されるだけなので、
 * 項目を消すときにこの表を直し忘れても壊れない。
 *
 * 並べ替えは**表示のときだけ**行う。SAMPLE_CALCULATIONS や PRESET_NOTEBOOK_CATEGORIES の配列そのものは
 * 言語に依らない正順のまま保つこと（後者はプリセット投入の順＝保存データ上のノートの並びを決めるので、
 * 配列自体を言語で入れ替えると同じ端末でも言語を変えるたびに保存順が変わってしまう）。
 */

/** 優先IDの列にあるものを先頭へ、残りは元の順のまま後ろへ。安定ソート。 */
export function orderByRelevance<T>(items: readonly T[], idOf: (item: T) => string, priority: readonly string[]): T[] {
  const rankById = new Map(priority.map((id, index) => [id, index]));
  const promoted: Array<{ item: T; rank: number }> = [];
  const rest: T[] = [];
  items.forEach((item) => {
    const rank = rankById.get(idOf(item));
    if (rank === undefined) rest.push(item);
    else promoted.push({ item, rank });
  });
  promoted.sort((left, right) => left.rank - right.rank);
  return [...promoted.map((entry) => entry.item), ...rest];
}

/**
 * サンプルシートのカテゴリタブの順。
 * どの言語でも exam / lab（試験対策・実験レポート）を上位に置いているが、その中身は言語ごとに違う
 * （ラベル自体が Klausur / EBAU / ENEM / TP と現地の呼び名になっている。lib/sample-calculations.ts）。
 */
export const SAMPLE_CATEGORY_RELEVANCE: Record<AppLanguage, readonly string[]> = {
  // 電験三種・電工二種は電気の計算そのものなので electric を2番目に置く。
  ja: ["exam", "electric", "lab", "energy", "mechanics", "motion", "basic"],
  // FE試験は力学・熱・電気を横断し、学部の実験レポートが副ターゲット。
  en: ["exam", "lab", "mechanics", "energy", "electric", "motion", "basic"],
  // Ausbildung Elektroniker。Zehnerpotenzen と電気の実務計算が最優先。
  de: ["exam", "electric", "energy", "lab", "mechanics", "motion", "basic"],
  // lycée の physique-chimie。化学（濃度・mL→L）が入口なので lab を先頭に。
  fr: ["lab", "exam", "motion", "energy", "mechanics", "electric", "basic"],
  // EBAU の física は力学・場・電気が中心。
  es: ["exam", "lab", "mechanics", "motion", "energy", "electric", "basic"],
  // ENEM はエネルギーと消費電力量（kWh）の文章題が定番。
  "pt-BR": ["exam", "energy", "motion", "mechanics", "electric", "lab", "basic"],
};

/**
 * カテゴリの中のサンプルの順（IDは lib/sample-calculations.ts の SampleCalculation.id）。
 * カテゴリを跨いで1つの列に書いてよい（並べ替えは常に同じカテゴリの中だけで行われるため）。
 */
export const SAMPLE_RELEVANCE: Record<AppLanguage, readonly string[]> = {
  ja: ["ohm-law-current", "three-phase-current", "wire-resistance", "joule-heat", "prefix-chain", "three-phase-power", "energy-kwh", "power-minutes", "megohm-microamp", "capacitive-reactance", "millivolt-shunt", "micro-prefix-charge", "voltage-drop", "electric-power"],
  // 米国・英国のユーザーはヤード・ポンド法の値をSIに直すところから始まる。
  en: ["imperial-to-si", "psi-to-kpa", "prefix-chain", "energy-kwh", "coulomb-force", "gravity-field", "density-si"],
  // PS（メートル馬力）は hp と1.4%違う。独語圏で最初に確かめたい値。
  de: ["prefix-chain", "megohm-microamp", "ohm-law-current", "wire-resistance", "joule-heat", "voltage-drop", "three-phase-current", "capacitive-reactance", "micro-prefix-charge", "metric-horsepower", "kmh-to-ms", "power-minutes", "energy-kwh", "electric-power"],
  fr: ["molar-concentration", "kmh-to-ms", "metric-horsepower", "coulomb-force", "gravity-field", "density-si"],
  es: ["kmh-to-ms", "gravity-field", "coulomb-force", "prefix-chain", "molar-concentration", "density-si"],
  "pt-BR": ["energy-kwh", "kmh-to-ms", "gravity-field", "coulomb-force", "voltage-drop", "electric-power"],
};

/**
 * 計算ノートのカテゴリカードの順（IDは lib/notebook-formulas/source/categories.ts）。
 * 最上位カテゴリと子カテゴリを1つの列にまとめて書いてよい（並べ替えは同じ階層の中だけで行われる）。
 */
export const NOTEBOOK_CATEGORY_RELEVANCE: Record<AppLanguage, readonly string[]> = {
  ja: [
    "electricity-energy", "high-school-physics", "science", "engineering-design", "chemistry", "vehicles",
    "electricity-basics", "electronics", "solar",
  ],
  en: [
    "high-school-physics", "engineering-design", "electricity-energy", "science", "chemistry", "vehicles",
    "physics-mechanics", "physics-thermal", "physics-electricity", "physics-waves", "physics-atomic",
  ],
  de: [
    "electricity-energy", "high-school-physics", "science", "chemistry", "engineering-design", "vehicles",
    "electricity-basics", "electronics", "solar",
    "physics-electricity", "physics-mechanics", "physics-thermal", "physics-waves", "physics-atomic",
  ],
  fr: [
    "high-school-physics", "chemistry", "science", "electricity-energy", "astronomy", "vehicles",
    "physics-mechanics", "physics-waves", "physics-electricity", "physics-thermal", "physics-atomic",
    "science-density", "science-chemistry", "science-motion",
  ],
  es: [
    "high-school-physics", "chemistry", "science", "electricity-energy", "astronomy", "engineering-design",
    "physics-mechanics", "physics-electricity", "physics-waves", "physics-thermal", "physics-atomic",
  ],
  "pt-BR": [
    "high-school-physics", "science", "electricity-energy", "chemistry", "home-life", "vehicles",
    "physics-mechanics", "physics-electricity", "physics-thermal", "physics-waves", "physics-atomic",
  ],
};

export function orderSampleCategoriesForLanguage<T extends { id: string }>(categories: readonly T[], language: AppLanguage) {
  return orderByRelevance(categories, (category) => category.id, SAMPLE_CATEGORY_RELEVANCE[language]);
}

export function orderSamplesForLanguage<T extends { id: string }>(samples: readonly T[], language: AppLanguage) {
  return orderByRelevance(samples, (sample) => sample.id, SAMPLE_RELEVANCE[language]);
}

export function orderNotebookCategoriesForLanguage<T extends { id: string }>(categories: readonly T[], language: AppLanguage) {
  return orderByRelevance(categories, (category) => category.id, NOTEBOOK_CATEGORY_RELEVANCE[language]);
}
