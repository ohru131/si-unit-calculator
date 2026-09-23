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
  /**
   * **結果カードの見出し行（「結果」ラベル＋ブックマーク/コピー）を出すか。**
   * この行は約28dpを**結果の数字より上**に積む。画面が低いほど、いちばん見えなければ
   * ならない数字がその28dpのぶん下へ押し出されて枠の外に出る。低い段階では行ごと畳み、
   * アイコンは数字と同じ行の右端へ移す（呼び出し側で分岐する）。
   */
  showResultCardLabel: boolean;
  // 結果の数字の文字サイズと行の高さ。低い段階では「読める下限まで小さくして1行を残す」方を
  // 優先する（数字が切れて見えないより、小さくても全部見える方がよい）。
  resultValueFontSize: number;
  resultValueMinHeight: number;
  resultCardPaddingVertical: number;
  /**
   * **式キーボードのパネル（既定は「単位」）を最初から開いておくか。**
   * 単位パネルは接頭語キー行＋単位レールで約70dp使う。縦に余裕のある端末では開いていた方が
   * 単位を打つ手数が減るが、低い端末ではその70dpが結果カードの表示域そのものなので畳んでおく
   * （「単位」を押せば従来どおり出る）。
   */
  keyboardPanelOpenByDefault: boolean;
};

// **middleMinHeight は「結果の数字の行が必ず入る高さ」。** 結果カードの上半分（＝数字まで）は
// スクロールの外に固定してあるので、この下限を割ると数字そのものが切り取られる。値は
// resultCardPaddingVertical + （見出し行 28、出すときだけ）+ 数字のmarginTop 2 + resultValueMinHeight。
const REGULAR: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 44, keyboardPanelOpenByDefault: true, keyHeight: 42, keyRowGap: 6, keyRowMinHeight: 30, middleMinHeight: 84, panelsScrollHorizontally: false, resultCardPaddingVertical: 10, resultValueFontSize: 36, resultValueMinHeight: 44, screenPaddingBottom: 12, screenGap: 6, showResultCardLabel: true };
const COMPACT: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 42, keyboardPanelOpenByDefault: true, keyHeight: 38, keyRowGap: 5, keyRowMinHeight: 28, middleMinHeight: 49, panelsScrollHorizontally: true, resultCardPaddingVertical: 9, resultValueFontSize: 32, resultValueMinHeight: 38, screenPaddingBottom: 4, screenGap: 5, showResultCardLabel: false };
const DENSE: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 40, keyboardPanelOpenByDefault: false, keyHeight: 34, keyRowGap: 4, keyRowMinHeight: 26, middleMinHeight: 43, panelsScrollHorizontally: true, resultCardPaddingVertical: 7, resultValueFontSize: 28, resultValueMinHeight: 34, screenPaddingBottom: 4, screenGap: 4, showResultCardLabel: false };
// 文字を最大まで大きくした低い端末（表示サイズも大きくしていると dp の画面高さ自体が縮む）向け。
// ここまで来たら結果カードはほぼ畳まれてよい（中身はこの中でスクロールする）——キーが押せない方が困る。
// 押しやすさの下限（44dp）は割るが、押せる状態にする方を優先する。
const ULTRA: Omit<CalculatorLayout, "fontFactor"> = { inputRowHeight: 38, keyboardPanelOpenByDefault: false, keyHeight: 30, keyRowGap: 3, keyRowMinHeight: 24, middleMinHeight: 38, panelsScrollHorizontally: true, resultCardPaddingVertical: 6, resultValueFontSize: 24, resultValueMinHeight: 30, screenPaddingBottom: 4, screenGap: 3, showResultCardLabel: false };

export const resolveFontFactor = (fontScale: number, cap = CALCULATOR_MAX_FONT_SCALE) => {
  // fontScale が読めない環境（テスト・Web の一部）では等倍のまま扱う。縮める方向にしか働かせない。
  if (!Number.isFinite(fontScale) || fontScale <= 0) return 1;
  return fontScale > cap ? cap / fontScale : 1;
};

/**
 * `bannerHeight` は**いま画面の最上部を占めているバナー広告の高さ**（無料ユーザーだけ50dp、
 * Pro・Webでは0）。**画面の高さからこれを引いてから段階を選ぶ。** 引かないと、同じ640dpの端末でも
 * 無料ユーザーだけ50dp足りない状態で「余裕のある段階」の寸法が使われ、結果カードが先に潰れる。
 * **Webではバナーが出ない**ので、Playwrightで測った値はこの50dpを含まない——実機の無料ユーザーと
 * 突き合わせるときは必ずこの引き算を通すこと。
 */
export const resolveCalculatorLayout = ({ bannerHeight = 0, fontScale, height }: { bannerHeight?: number; fontScale: number; height: number }): CalculatorLayout => {
  const fontFactor = resolveFontFactor(fontScale);
  // 文字が上限いっぱいまで大きい端末は、同じ画面高さでも必要な縦が増える。高さをその倍率で
  // 割った「実効の高さ」で段階を選ぶと、フォント拡大と画面の低さを1つの物差しで扱える。
  const cappedScale = Number.isFinite(fontScale) && fontScale > 0 ? Math.min(fontScale, CALCULATOR_MAX_FONT_SCALE) : 1;
  const banner = Number.isFinite(bannerHeight) && bannerHeight > 0 ? bannerHeight : 0;
  const usableHeight = Number.isFinite(height) && height > 0 ? Math.max(height - banner, 1) : 0;
  const effectiveHeight = usableHeight > 0 ? usableHeight / cappedScale : REGULAR_HEIGHT_THRESHOLD;
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
