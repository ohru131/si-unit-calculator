/**
 * 時間の結果を「27 h 48 min」のように複数の単位へ分けた併記用の文字列にする純関数。
 *
 * **主表示は置き換えない。** 主表示（`27.8 h`）はコピー・単位チップ・比較表・後続手順の参照が
 * 同じ1つの数値で動いているので、複合表記はその下に小さく添えるだけにする。
 *
 * **画面に出ている数値の精度より細かい単位まで分けないこと。** 有効3桁の `27.8 h` を
 * `27 h 46 min 40 s` と書くと、元の値に無い秒の桁を主張することになる。そこで
 * (1) 表示されている桁で一度丸め（27.8 h）、(2) その最下位の桁の大きさ（0.1 h = 360 s）より
 * 細かくない単位（min）までで分ける。
 *
 * **いちばん上の単位は利用者が選んだ表示単位にする。** `400 d` を `1 yr 34 d 18 h` に繰り上げると、
 * 年が 365.25 日（`yr` の定義）なので端数の6時間が紛れ込み、日で見たかった人には読みにくい。
 */

type TimeUnit = { symbol: string; seconds: number };

// 大きい順。記号は計算エンジン（lib/units.ts の BASE_UNITS）と同じ綴りにする。
const TIME_UNITS: readonly TimeUnit[] = [
  { symbol: "yr", seconds: 31557600 },
  { symbol: "d", seconds: 86400 },
  { symbol: "h", seconds: 3600 },
  { symbol: "min", seconds: 60 },
  { symbol: "s", seconds: 1 },
];

/** 「丸めなし」（resultDigits = 0）のときに精度として使う桁数。倍精度で意味のある上限。 */
const UNLIMITED_PRECISION_DIGITS = 15;

export type TimeBreakdownOptions = {
  /** 画面に出ている数値（表示単位での値）。 */
  value: number;
  /** 表示単位の記号。`yr` / `d` / `h` / `min` のときだけ分ける（`s` は分ける先が無い）。 */
  unit: string;
  /** 画面に出ている数値の有効桁数。有効数字で丸めていればその桁数、そうでなければ表示桁の上限。0 は「丸めなし」。 */
  significantDigits: number;
};

export function formatTimeBreakdown({ value, unit, significantDigits }: TimeBreakdownOptions): string | null {
  const topIndex = TIME_UNITS.findIndex((item) => item.symbol === unit.trim());
  // s は分ける先が無いので対象外。
  if (topIndex < 0 || topIndex === TIME_UNITS.length - 1) return null;
  if (!Number.isFinite(value) || value === 0) return null;

  const digits = significantDigits > 0 ? significantDigits : UNLIMITED_PRECISION_DIGITS;
  const magnitude = Math.abs(value);
  // 表示されている数値の最下位の桁の大きさ（表示単位で）。27.8（3桁）なら 0.1。
  const resolution = 10 ** (Math.floor(Math.log10(magnitude)) - digits + 1);
  const shown = Math.round(magnitude / resolution) * resolution;
  const top = TIME_UNITS[topIndex];
  const resolutionSeconds = resolution * top.seconds;

  // 精度が届く範囲でいちばん大きい単位まで分ける。秒より細かい精度があっても秒で止める
  // （小数の秒まで並べると、併記がかえって主表示より長く読みにくくなる）。
  let finestIndex = topIndex;
  for (let index = topIndex; index < TIME_UNITS.length; index += 1) {
    finestIndex = index;
    if (TIME_UNITS[index].seconds <= resolutionSeconds) break;
  }
  if (finestIndex === topIndex) return null;
  const finest = TIME_UNITS[finestIndex];

  let remaining = Math.round((shown * top.seconds) / finest.seconds);
  const parts: string[] = [];
  for (let index = topIndex; index <= finestIndex; index += 1) {
    const ratio = TIME_UNITS[index].seconds / finest.seconds;
    // 最下位の欄は四捨五入する。yr は 365.25 日なので、上の欄で割った余りに 0.25 日ぶんの端数が残る
    // （2.5 yr → 2 yr 182.625 d）。切り捨てると 182 d になって元の値より小さく読める。
    const count = index === finestIndex ? Math.round(remaining) : Math.floor(remaining / ratio);
    remaining -= count * ratio;
    if (count > 0) parts.push(`${count} ${TIME_UNITS[index].symbol}`);
  }
  // 1つの単位に収まるなら（2 h ちょうど・0.75 h = 45 min）言い換えになっていないので出さない。
  // 45 min が欲しい人は単位チップで min を選べばよい。
  if (parts.length < 2) return null;
  return `${value < 0 ? "−" : ""}${parts.join(" ")}`;
}
