import {
  evaluateExpression,
  hasSameDimension,
  isBuiltInUnitSymbol,
  IDENTIFIER_BODY_CHAR_CLASS,
  IDENTIFIER_START_CHAR_CLASS,
  type Dimension,
  type SavedConstant,
} from "@/lib/units";

export type CustomUnit = {
  symbol: string;
  // ユーザーが入力した定義式そのもの。保存して再編集するために持つ。
  expression: string;
  // SI値 = その単位での値 * scale + offset
  scale: number;
  offset: number;
  dimension: Dimension;
};

export type CustomUnitErrorCode =
  | "emptySymbol"
  | "invalidSymbol"
  | "symbolTaken"
  | "emptyDefinition"
  | "unparsableDefinition"
  | "nonAffineDefinition"
  | "zeroScale";

export type CustomUnitParseResult =
  | { status: "ok"; unit: CustomUnit }
  | { status: "error"; code: CustomUnitErrorCode };

export type ParseCustomUnitOptions = {
  // 既に登録済みのユーザー定義単位の記号。編集時は自分自身の記号を含めないこと（呼び出し側の責任）。
  existingSymbols: string[];
  constants?: SavedConstant[];
};

// 単位記号には数字を使えない。parseUnit の1因子あたりの正規表現
// （^([A-Za-zΩµμ%°]+)(?:\^?(-?\d+))?$）が数字を「べき乗」としてしか受け付けないため、
// 数字を含む記号は登録できても resolveUnitSymbol で二度と引けなくなる。% も除外する
// （% は BASE_UNITS 側で無次元の割合専用として予約済みの記号のため）。
const CUSTOM_UNIT_SYMBOL_PATTERN = /^[A-Za-zΩµμ°]+$/;

// 定義式が「x」を関数の変数として使っているかどうかの判定。
// 単純な `definition.includes("x")` だと "1.5kx"（別の識別子の一部）や
// 「xy」のような別名の定数を誤検出してしまうので、識別子の文字集合
// （lib/units.ts の IDENTIFIER_BODY_CHAR_CLASS）を使い、前後が識別子の
// 構成文字でない「独立した x」だけを拾う。
//
// 後読み（(?<!...)）を使わないのは意図的。React NativeのHermesは正規表現の
// サポートがJSCより狭く、後読みを受け付けない可能性がある。しかもこのパターンは
// モジュール読み込み時の new RegExp で組み立てるため、弾かれた場合は
// 「アプリ起動時に画面が出ない」形で失敗する。Node上のvitestでは再現しないので、
// テストが全部通ったまま実機だけ壊れる。前方の1文字を捕まえる書き方なら
// 同じ判定を後読み無しで表現できる（このリポジトリの他の箇所にも後読みは無い）。
const STANDALONE_X_PATTERN = new RegExp(`(^|[^${IDENTIFIER_BODY_CHAR_CLASS}])x($|[^${IDENTIFIER_BODY_CHAR_CLASS}])`, "u");

// 2階差分（アフィン性の判定）の相対許容誤差。絶対値の閾値だと、非常に大きい/小さい
// 単位（例: eVのような1e-19オーダー、あるいは天文単位のような1e11オーダー）で
// 誤判定する（大きい値では丸め誤差が閾値を超えてしまい、小さい値ではノイズが
// 閾値を下回って非アフィンを見逃す）。値の大きさに対する相対誤差で見る。
const AFFINE_RELATIVE_TOLERANCE = 1e-6;

function isAffine(f0: number, f1: number, f2: number): boolean {
  const secondDifference = f2 - 2 * f1 + f0;
  const magnitude = Math.max(Math.abs(f0), Math.abs(f1), Math.abs(f2), Number.EPSILON);
  return Math.abs(secondDifference) <= magnitude * AFFINE_RELATIVE_TOLERANCE;
}

// 関数呼び出し（識別子の直後に開き括弧）。sin(x) のように x が非線形な関数の
// 引数になっている定義を弾くために使う。
const FUNCTION_CALL_PATTERN = new RegExp(`[${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*\\s*\\(`, "u");
// べき乗。`^` に加えて上付き数字も見る（lib/units.ts の normalize が `^n` へ書き換える表記なので、
// ユーザーが「x²」と入力してもここを素通りさせない）。
const POWER_PATTERN = /[\^⁰¹²³⁴⁵⁶⁷⁸⁹]/u;
// 識別子をすべて拾うパターン。x の出現回数はこれで数える。
// STANDALONE_X_PATTERN を g 付きで使い回さないのは、あのパターンが x の前後の1文字まで
// 消費するため、"x*x" が1件しか取れず（2件目の x の直前の "*" が1件目に食われる）
// 数え落とすから。識別子そのものを列挙して "x" と一致する個数を見るほうが正確。
const IDENTIFIER_GLOBAL_PATTERN = new RegExp(`[${IDENTIFIER_START_CHAR_CLASS}][${IDENTIFIER_BODY_CHAR_CLASS}]*`, "gu");

// 定義式が x について「構造的に」1次かどうかを見る。
//
// なぜ標本抽出だけでは不十分か: x=0,1,2 の3点で2階差分を取る検査は、その3点でたまたま
// 一致してしまう高次式を通す。実例として `x*x*(x-1)*(x-2)*m + x*m` は 0m・1m・2m を返すので
// アフィンと判定されるが、x=3 では 3m ではなく 21m になる（CodeRabbitの指摘。実際に再現した）。
// 標本点を増やしても「その点を根に持つ多項式」で同じ手口が成立するため、点を足す方向では
// 塞ぎきれない。そこで値ではなく「x の現れ方」そのものを制限する。
//
// 判定は保守的（疑わしきは拒否）にしてある。x*10^3*m のような本来は1次の式も弾くが、
// x*1000*m と書き直せるので実害は小さい。逆に取りこぼすと、ユーザーの単位が黙って
// 間違った値に換算される。
function isStructurallyAffineInX(definition: string): boolean {
  // x が2回以上出てくる式（x*x、x*(x-1) など）は1次になりようがない。
  // 「kx」「xy」のような別の識別子に含まれる x は数に入れない。
  const identifiers = [...definition.matchAll(IDENTIFIER_GLOBAL_PATTERN)];
  const xMatches = identifiers.filter((match) => match[0] === "x");
  if (xMatches.length !== 1) return false;
  if (POWER_PATTERN.test(definition)) return false;
  if (FUNCTION_CALL_PATTERN.test(definition)) return false;

  // x が除数になっている（m/x のような反比例）と1次ではない。x の直前の文字を
  // 空白と開き括弧を読み飛ばして見る（"1/(x)" も除数として拾う）。
  const xIndex = xMatches[0].index;
  for (let cursor = xIndex - 1; cursor >= 0; cursor -= 1) {
    const character = definition[cursor];
    if (character === " " || character === "(") continue;
    if (character === "/" || character === "÷") return false;
    break;
  }
  return true;
}

function xConstant(value: number): SavedConstant {
  return { symbol: "x", expression: String(value), quantity: { siValue: value, dimension: [0, 0, 0, 0, 0, 0, 0] }, createdAt: "" };
}

// 「その記号をユーザー定義単位として実際に引けるか」の唯一の判定。
// 登録時（parseCustomUnit）と、保存済みデータの復元時（lib/calculator-store.tsx）の
// 両方から呼ぶ。復元側が独自に「空文字でなければOK」で通していると、記号 "m" のような
// 絶対に解決されない単位（組み込みが必ず勝つ）が設定画面に並び、ユーザーには
// 「登録したのに効かない幽霊」に見える。判定を2箇所に分けないための関数。
export function isUsableCustomUnitSymbol(symbol: string): boolean {
  const trimmed = symbol.trim();
  if (!trimmed) return false;
  if (!CUSTOM_UNIT_SYMBOL_PATTERN.test(trimmed)) return false;
  return !isBuiltInUnitSymbol(trimmed);
}

function validateSymbol(symbol: string, existingSymbols: string[]): CustomUnitErrorCode | undefined {
  const trimmed = symbol.trim();
  if (!trimmed) return "emptySymbol";
  if (!CUSTOM_UNIT_SYMBOL_PATTERN.test(trimmed)) return "invalidSymbol";
  if (isBuiltInUnitSymbol(trimmed) || existingSymbols.includes(trimmed)) return "symbolTaken";
  return undefined;
}

type ScaleOffset = { scale: number; offset: number; dimension: Dimension };

// 関数形式（定義式が独立した x を含む場合）。x=0,1,2 の3点で評価し、
// 一次関数（アフィン）かどうかを2階差分で検査してから scale/offset を求める。
function parseFunctionForm(definition: string, constants: SavedConstant[]): ScaleOffset | { error: CustomUnitErrorCode } {
  // 構造の検査を先に通す。標本抽出（isAffine）はここを抜けた式に対する二重の網として残す。
  if (!isStructurallyAffineInX(definition)) return { error: "nonAffineDefinition" };
  let f0;
  let f1;
  let f2;
  try {
    f0 = evaluateExpression(definition, [...constants, xConstant(0)]);
    f1 = evaluateExpression(definition, [...constants, xConstant(1)]);
    f2 = evaluateExpression(definition, [...constants, xConstant(2)]);
  } catch {
    return { error: "unparsableDefinition" };
  }
  if (!hasSameDimension(f0, f1) || !hasSameDimension(f0, f2)) return { error: "nonAffineDefinition" };
  if (!isAffine(f0.siValue, f1.siValue, f2.siValue)) return { error: "nonAffineDefinition" };
  const offset = f0.siValue;
  const scale = f1.siValue - f0.siValue;
  return { scale, offset, dimension: f0.dimension };
}

// 倍率形式（定義式に独立した x を含まない場合）。「1 <symbol> = <定義式>」の意味で、
// 定義式そのものをSI単位系での1単位あたりの値として評価する。
function parseScaleForm(definition: string, constants: SavedConstant[]): ScaleOffset | { error: CustomUnitErrorCode } {
  let value;
  try {
    value = evaluateExpression(definition, constants);
  } catch {
    return { error: "unparsableDefinition" };
  }
  return { scale: value.siValue, offset: 0, dimension: value.dimension };
}

export function parseCustomUnit(symbol: string, definition: string, options: ParseCustomUnitOptions): CustomUnitParseResult {
  const symbolError = validateSymbol(symbol, options.existingSymbols);
  if (symbolError) return { status: "error", code: symbolError };

  const trimmedDefinition = definition.trim();
  if (!trimmedDefinition) return { status: "error", code: "emptyDefinition" };

  const constants = options.constants ?? [];
  const isFunctionForm = STANDALONE_X_PATTERN.test(trimmedDefinition);
  const result = isFunctionForm ? parseFunctionForm(trimmedDefinition, constants) : parseScaleForm(trimmedDefinition, constants);
  if ("error" in result) return { status: "error", code: result.error };

  const { scale, offset, dimension } = result;
  if (!Number.isFinite(scale) || scale === 0) return { status: "error", code: "zeroScale" };
  if (!Number.isFinite(offset)) return { status: "error", code: "unparsableDefinition" };

  return {
    status: "ok",
    unit: { symbol: symbol.trim(), expression: definition, scale, offset, dimension },
  };
}
