import type { LocalizedText } from "../i18n";
import type { PresetRegionalDefaultKind } from "../preset-regional-defaults";

export type PresetNotebookCategory = {
  id: string;
  label: LocalizedText;
  /** 親カテゴリのid。未設定なら最上位（大分類）として扱う。 */
  parentId?: string;
};

export type NotebookSeedConstant = {
  /** 数式（formulaLatex）の変数と同じ記号にする（下付き文字・ギリシャ文字も識別子として使えるため、表示用の別名は不要）。 */
  symbol: string;
  expression: string;
  /**
   * 地域依存の既定値。妥当な値が地域によって全く違うもの（電気代・燃料単価のような金額、
   * 商用電源の電圧・ブレーカーの定格電流）だけ指定する。指定すると投入時に端末の地域に
   * 応じた式へ差し替わり、expression は地域が判別できなかったときのフォールバックになる。
   */
  regionalDefault?: PresetRegionalDefaultKind;
  /**
   * **この数は測定値ではない**（有効数字に数えない）。
   *
   * **プリセットで使うのは「数えた量」と「定義で決まる値」だけにする**（2026-09-22）。個数・回数・
   * 巻数・本数・量子数、標準重力 `9.80665m/s^2`、オイラーの端末係数 `k=1`、真空の屈折率 `n₁=1` が
   * これに当たる。**図面の呼び寸法には付けない**——`L=2m` に印を付けて桁を稼ぐのは、読む側からは
   * 「なぜこの桁数なのか」が式のどこにも書いていない状態になる。呼び寸法は素直に
   * `L=2.00m` と**桁で書く**（利用者からの指示。以前は寸法にも一律に付けていた）。
   *
   * **例外は加減算を通る寸法**（`(w-d)` の板幅・穴径、`D^4-d^4` の内外径）。測定値どうしの加減算は
   * 桁が読めず（lib/significant-figures.ts）、桁を書き分けても丸めが丸ごと止まって生値が出る。
   * そこだけは印が要るので、該当するノートにその理由をコメントで残してある。
   *
   * **測定値・推定値には付けないこと。** 荷重・電圧・電流・温度・質量、材料定数（E・ρ・比熱）、
   * 図表から読んだ係数（応力集中係数 K_t = 2.4）はすべて測定値の側。迷ったら付けない
   * （付けないと丸めが甘くなるだけだが、付けると実在しない桁を主張することになる）。
   *
   * 編集シートのトグル（「測定値でない」）は従来どおり利用者が自分のノートで使える。
   */
  exact?: boolean;
};
export type NotebookSeedStep = {
  title: LocalizedText;
  expression: string;
  targetUnit: string;
  /** 見やすい表示用のLaTeX数式。省略時は式（expression）をそのまま表示する。 */
  formulaLatex?: string;
  /** 結果の入力式欄に「symbol=expression」の形で表示するための名前（例："v"）。省略時は式のみ表示する。 */
  resultSymbol?: string;
};
/** 「説明文＋数式」のペア。手順（steps）の計算結果とは独立に、複数個並べて解説できる。 */
export type NotebookSeedFormula = {
  explanation: LocalizedText;
  latex: string;
};
export type NotebookSeed = {
  title: LocalizedText;
  description: LocalizedText;
  /** 解説＋数式のペア一覧。省略時は各手順のformulaLatexをそのまま「数式」欄に並べる（従来どおり）。 */
  formulas?: NotebookSeedFormula[];
  localConstants: NotebookSeedConstant[];
  steps: NotebookSeedStep[];
};

/**
 * シードの英語タイトルから導く安定的な識別子。プリセットの投入ID（lib/calculator-store.tsxの
 * presetNotebookIdなど）はカテゴリ内の配列位置ではなくこの値から組み立てるため、新しいシードを
 * 配列の途中に挿入したり既存シードの前後を入れ替えたりしても、既存シードのIDは変わらない
 * （配列位置に依存すると、挿入のたびに後続シードのIDがずれて既存インストールの保存済みノートが
 * 別のシードの内容に誤って結び付く）。英語タイトルを変更するとIDも変わる＝別シード扱いになる点は
 * 許容している（タイトル変更は実質的に別内容への改名であり、追加・並べ替えとは別の操作のため）。
 * カテゴリ内で一意であることを`tests/notebook-formulas.test.ts`が全プリセットに対して検証する。
 */
export function seedSlug(seed: NotebookSeed): string {
  return seed.title.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
