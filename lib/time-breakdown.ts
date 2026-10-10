/**
 * 時間の結果を「27 h 46 m 40 s」のように複数の単位へ分けた併記用の文字列にする純関数。
 *
 * **主表示は置き換えない。** 主表示（`27.8 h`）はコピー・単位チップ・比較表・後続手順の参照が
 * 同じ1つの数値で動いているので、複合表記はその下に小さく添えるだけにする。
 *
 * **分けるのは丸める前の値で、常に秒まで。** 併記は「丸める前の値」の行のすぐ下に出るので、
 * 位置からはその行を分けたものとして読まれる（利用者の指摘。以前は有効数字で丸めた主表示の
 * 精度で止めていて、`27.7778 h` の下に `27 h 48 min` が出ていた）。丸める前の値の行が既に
 * その精度を出しているので、秒まで書いても無い精度を主張することにはならない。秒は整数に丸め、
 * 0 の欄は出さない。
 *
 * **いちばん上の単位は利用者が選んだ表示単位にする。** `400 d` を `1 yr 34 d 18 h` に繰り上げると、
 * 年が 365.25 日（`yr` の定義）なので端数の6時間が紛れ込み、日で見たかった人には読みにくい。
 *
 * **ラベルは分を `m` にする**（利用者の判断。`min` だけ3文字で並びが揃わない。`h` と `s` に挟まれて
 * メートルとは読まれない）。この併記の中だけの表記で、表示単位・単位チップ・式の `m` は変わらない。
 */

type TimeUnit = { symbol: string; label: string; seconds: number };

// 大きい順。symbol は計算エンジン（lib/units.ts の BASE_UNITS）と同じ綴り、label は併記に出す字。
const TIME_UNITS: readonly TimeUnit[] = [
  { symbol: "yr", label: "yr", seconds: 31557600 },
  { symbol: "d", label: "d", seconds: 86400 },
  { symbol: "h", label: "h", seconds: 3600 },
  { symbol: "min", label: "m", seconds: 60 },
  { symbol: "s", label: "s", seconds: 1 },
];

export type TimeBreakdownOptions = {
  /** 表示単位での値（丸める前）。 */
  value: number;
  /** 表示単位の記号。`yr` / `d` / `h` / `min` のときだけ分ける（`s` は分ける先が無い）。 */
  unit: string;
};

export function formatTimeBreakdown({ value, unit }: TimeBreakdownOptions): string | null {
  const topIndex = TIME_UNITS.findIndex((item) => item.symbol === unit.trim());
  // s は分ける先が無いので対象外。
  if (topIndex < 0 || topIndex === TIME_UNITS.length - 1) return null;
  if (!Number.isFinite(value) || value === 0) return null;

  const magnitude = Math.abs(value);
  const top = TIME_UNITS[topIndex];
  // **いちばん上の単位は丸める前に整数部を取り出す。** yr は 365.25 日で下の単位の整数倍にならないので、
  // 全体を秒で丸めてから割ると `2.0 yr`（730.5 日）が 731 日に丸まり `2 yr 1 d` になる
  // （CodeRabbitが#91で検出）。上の単位の整数部を先に確定させ、端数だけを秒へ丸める。
  let topCount = Math.floor(magnitude + 1e-9);
  let remaining = Math.round((magnitude - topCount) * top.seconds);
  if (remaining >= top.seconds) {
    // 端数の丸めで1単位ぶんに届いたら繰り上げる（1.9999999 h → 2 h ちょうど）。
    topCount += 1;
    remaining = 0;
  }
  const parts: string[] = [];
  if (topCount > 0) parts.push(`${topCount} ${top.label}`);
  for (let index = topIndex + 1; index < TIME_UNITS.length; index += 1) {
    const unitSeconds = TIME_UNITS[index].seconds;
    const count = Math.floor(remaining / unitSeconds);
    remaining -= count * unitSeconds;
    if (count > 0) parts.push(`${count} ${TIME_UNITS[index].label}`);
  }
  // 1つの単位に収まるなら（2 h ちょうど・0.75 h = 45 m）言い換えになっていないので出さない。
  // 45 min が欲しい人は単位チップで min を選べばよい。
  if (parts.length < 2) return null;
  return `${value < 0 ? "−" : ""}${parts.join(" ")}`;
}
