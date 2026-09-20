import type { TextStyle } from "react-native";

// 端末の「フォントサイズ」「表示サイズ」を大きくした状態で電卓画面を開くと、キーパッドが
// タブバーの下へ押し出されて数字キーが押せなくなる（実機報告）。電卓は他のタブと違って
// 「1画面に収める・縦スクロールさせない」構成なので、伸びたぶんを逃がす場所が middle しか無く、
// そこが下限まで縮んでもまだ足りない。そこで (1) 文字の拡大率に上限を設け、(2) 画面が低いときは
// キーの高さと行間を段階的に詰めて、必ずキーパッド全段が画面に入るようにする。
//
// 拡大を完全に無視（allowFontScaling={false}）はしない。1.2倍までは端末の設定に従う
// ——「大きめ」設定の人が読めなくなる方が損失が大きいため。
export const CALCULATOR_MAX_FONT_SCALE = 1.2;

export type CalculatorLayout = {
  // styleのfontSizeに掛ける係数。OSの拡大率と掛け合わせて CALCULATOR_MAX_FONT_SCALE に収める。
  fontFactor: number;
  // キーパッド1キーの高さ。フォント設定では伸びない（dp指定）ので、段階で詰める。
  keyHeight: number;
  // 編集キー・接頭語キー・16進のA〜F行の高さ。
  keyRowMinHeight: number;
  keyRowGap: number;
  screenGap: number;
  // 画面で唯一縮む場所（結果カードはこの中でスクロールする）の下限。
  middleMinHeight: number;
  // 入力欄と「＝」ボタンの高さ。
  inputRowHeight: number;
  /**
   * パネル（`f(x)`・`αβ`・`ABC`・`定数`）を**折り返さず1行の横スクロールで出すか**。
   * 縦に余裕のある端末では折り返したグリッドの方が一覧できて速いが、低い端末では3〜4行ぶんの
   * 縦が結果カードを押し潰す（`middle` は下限まで縮むと中身が切れる）。**1行に畳めば、どのパネルを
   * 開いても縦は1行ぶんで済む**——端に隠れたキーはスクロールで出す。
   */
  panelsScrollHorizontally: boolean;
  // **キーパッド下段とタブバーの間の余白。**
  // ここが狭いと、右下の `=`（いちばん押すキー）を狙った指が行き過ぎて真下の「設定」タブに
  // 当たり、画面ごと切り替わる（実機で報告された。以前は全段階で 4dp ＝実測 6.4dp・約1mm しか
  // 離れておらず、指の接地面 8〜10mm に対して緩衝が無いに等しかった）。
  // **余白を取れるのは縦に余裕がある段階だけ**なので、画面が低い段階では従来どおり詰めたまま
  // にする（キーが押せなくなる方が困る、というこのファイルの既定の優先順に従う）。
  screenPaddingBottom: number;
};

const REGULAR: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 44, keyHeight: 42, keyRowGap: 6, keyRowMinHeight: 30, middleMinHeight: 56, panelsScrollHorizontally: false, screenPaddingBottom: 12, screenGap: 6 };
const COMPACT: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 42, keyHeight: 38, keyRowGap: 5, keyRowMinHeight: 28, middleMinHeight: 44, panelsScrollHorizontally: true, screenPaddingBottom: 4, screenGap: 5 };
const DENSE: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 40, keyHeight: 34, keyRowGap: 4, keyRowMinHeight: 26, middleMinHeight: 36, panelsScrollHorizontally: true, screenPaddingBottom: 4, screenGap: 4 };
// 文字を最大まで大きくした低い端末（表示サイズも大きくしていると dp の画面高さ自体が縮む）向け。
// ここまで来たら結果カードはほぼ畳まれてよい（中身はこの中でスクロールする）——キーが押せない方が困る。
// 押しやすさの下限（44dp）は割るが、押せる状態にする方を優先する。
const ULTRA: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 38, keyHeight: 30, keyRowGap: 3, keyRowMinHeight: 24, middleMinHeight: 24, panelsScrollHorizontally: true, screenPaddingBottom: 4, screenGap: 3 };

export const resolveFontFactor = (fontScale: number, cap = CALCULATOR_MAX_FONT_SCALE) => {
  // fontScale が読めない環境（テスト・Web の一部）では等倍のまま扱う。縮める方向にしか働かせない。
  if (!Number.isFinite(fontScale) || fontScale <= 0) return 1;
  return fontScale > cap ? cap / fontScale : 1;
};

export const resolveCalculatorLayout = ({ fontScale, height }: { fontScale: number; height: number }): CalculatorLayout => {
  const fontFactor = resolveFontFactor(fontScale);
  // 文字が上限いっぱいまで大きい端末は、同じ画面高さでも必要な縦が増える。高さをその倍率で
  // 割った「実効の高さ」で段階を選ぶと、フォント拡大と画面の低さを1つの物差しで扱える。
  const cappedScale = Number.isFinite(fontScale) && fontScale > 0 ? Math.min(fontScale, CALCULATOR_MAX_FONT_SCALE) : 1;
  const effectiveHeight = Number.isFinite(height) && height > 0 ? height / cappedScale : REGULAR_HEIGHT_THRESHOLD;
  // 640 は現状の基準端末（360×640 でキーパッド下端546.5・タブバー上端573）。ここは詰めない。
  const base = effectiveHeight >= REGULAR_HEIGHT_THRESHOLD
    ? REGULAR
    : effectiveHeight >= COMPACT_HEIGHT_THRESHOLD
      ? COMPACT
      : effectiveHeight >= DENSE_HEIGHT_THRESHOLD
        ? DENSE
        : ULTRA;
  return { ...base, fontFactor };
};

const REGULAR_HEIGHT_THRESHOLD = 640;
const COMPACT_HEIGHT_THRESHOLD = 560;
const DENSE_HEIGHT_THRESHOLD = 480;

const roundToHalf = (value: number) => Math.round(value * 2) / 2;

// StyleSheet.create へ渡す前に、文字まわりの寸法だけを一律で縮める。Text は端末の設定で
// 自動的に拡大されるので、style 側を factor 倍しておくと「拡大率の上限」として働く。
// React 19 では Text.defaultProps が効かないため、maxFontSizeMultiplier を全Textに配る代わりに
// スタイル定義を1箇所で加工する（渡し忘れが起きない）。
export const scaleFontSizes = <T extends Record<string, object>>(definitions: T, factor: number): T => {
  if (factor >= 1) return definitions;
  const scaled: Record<string, object> = {};
  for (const [name, style] of Object.entries(definitions)) {
    const text = style as TextStyle;
    const hasFontSize = typeof text.fontSize === "number";
    const hasLineHeight = typeof text.lineHeight === "number";
    if (!hasFontSize && !hasLineHeight) {
      scaled[name] = style;
      continue;
    }
    scaled[name] = {
      ...style,
      ...(hasFontSize ? { fontSize: roundToHalf((text.fontSize as number) * factor) } : null),
      ...(hasLineHeight ? { lineHeight: roundToHalf((text.lineHeight as number) * factor) } : null),
    };
  }
  return scaled as T;
};
