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
// べき乗の記号。`^` に加えて上付き数字も見る（lib/units.ts の normalize が `^n` へ書き換える
// 表記なので、ユーザーが「x²」と入力してもここを素通りさせない）。
const POWER_CHARACTER_PATTERN = /[\^⁰¹²³⁴⁵⁶⁷⁸⁹]/u;

// x から見て「意味のある直前の文字」を返す（空白と開き括弧は読み飛ばす）。
// 除数判定（m/x）と、2^(x) のようなべき乗判定の両方で同じ走査を使う。
function significantCharacterBefore(definition: string, index: number): string | undefined {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const character = definition[cursor];
    if (character === " " || character === "(") continue;
    return character;
  }
  return undefined;
}

function isPowerCharacterAt(definition: string, index: number): boolean {
  const character = definition[index];
  return character !== undefined && POWER_CHARACTER_PATTERN.test(character);
}

// x そのものが累乗されているか。x^2 / 2^x / (2*x+1)^2 の3通りを見る。
//
// 定義式全体に `^` があるかどうかで弾いてはいけない。単位側の指数（x*9.8m/s^2、
// x*1000kg/m^3、x*2m² など）はごく普通の1次式で、それらまで「xの1次式にしてください」と
// 拒否してしまう（実際に拒否していた）。単位サフィックスの中の `^` は演算子ですらないので、
// x に掛かっている累乗だけを見る必要がある。
function isXRaisedToPower(definition: string, xStart: number, xEnd: number): boolean {
  let after = xEnd;
  while (definition[after] === " ") after += 1;
  if (isPowerCharacterAt(definition, after)) return true;

  if (significantCharacterBefore(definition, xStart) === "^") return true;

  // x を含む括弧グループが丸ごと累乗されている場合。x より後ろで、対応する開き括弧の無い
  // 閉じ括弧（＝x を囲んでいたグループの終わり）を見つけ、その直後が累乗かを見る。
  let depth = 0;
  for (let cursor = xEnd; cursor < definition.length; cursor += 1) {
    const character = definition[cursor];
    if (character === "(") {
      depth += 1;
      continue;
    }
    if (character !== ")") continue;
    if (depth > 0) {
      depth -= 1;
      continue;
    }
    let next = cursor + 1;
    while (definition[next] === " ") next += 1;
    if (isPowerCharacterAt(definition, next)) return true;
  }
  return false;
}

// 評価器が識別子として特別扱いする名前。これらを自作単位の記号にすると、
// 数値直後（2e → 単位）と単独（2*e → 自然対数の底）で別物に解決され、どちらも
// エラーにならないまま値だけが食い違う。記号として選べないようにしておく。
const RESERVED_IDENTIFIERS = new Set([
  "pi", "π", "e",
  "sqrt", "sin", "cos", "tan", "asin", "acos", "atan", "ln", "log", "log2", "atan2",
]);
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
// 判定は保守的（疑わしきは拒否）にしてある。取りこぼすとユーザーの単位が黙って
// 間違った値に換算されるため、判断に迷う書き方は登録させない。ただし「定義式のどこかに
// ^ があれば拒否」のような広すぎる条件にはしないこと。x*9.8m/s^2 のように単位側に指数を
// 持つだけの1次式は普通に書かれるので、それを弾くと関数形式がほとんど使えなくなる。
function isStructurallyAffineInX(definition: string): boolean {
  // x が2回以上出てくる式（x*x、x*(x-1) など）は1次になりようがない。
  // 「kx」「xy」のような別の識別子に含まれる x は数に入れない。
  // matchAllを使わずexecで回すのは、上のSTANDALONE_X_PATTERNと同じ理由。Hermesで確実に
  // 動く書き方に寄せておく（このコードベースにmatchAllの前例が無い）。gフラグ付き正規表現を
  // 使い回すとlastIndexが呼び出し間で残るので、走査前に明示的に0へ戻す。
  const xIndexes: number[] = [];
  IDENTIFIER_GLOBAL_PATTERN.lastIndex = 0;
  let identifier = IDENTIFIER_GLOBAL_PATTERN.exec(definition);
  while (identifier) {
    if (identifier[0] === "x") xIndexes.push(identifier.index);
    identifier = IDENTIFIER_GLOBAL_PATTERN.exec(definition);
  }
  if (xIndexes.length !== 1) return false;
  if (FUNCTION_CALL_PATTERN.test(definition)) return false;

  const xIndex = xIndexes[0];
  if (isXRaisedToPower(definition, xIndex, xIndex + 1)) return false;

  // x が除数になっている（m/x のような反比例）と1次ではない。"1/(x)" も除数として拾う。
  const before = significantCharacterBefore(definition, xIndex);
  if (before === "/" || before === "÷") return false;

  // ここまでを満たせば x は「一度だけ、累乗されず、関数に渡されず、除数でもない」形で
  // 現れる。この評価器で非線形になれるのは累乗・関数・xでの除算だけなので、
  // 残る演算（加減乗算と定数倍）では必ず x の1次式になる。
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
  if (RESERVED_IDENTIFIERS.has(trimmed)) return false;
  return !isBuiltInUnitSymbol(trimmed);
}

function validateSymbol(symbol: string, existingSymbols: string[]): CustomUnitErrorCode | undefined {
  const trimmed = symbol.trim();
  if (!trimmed) return "emptySymbol";
  if (!CUSTOM_UNIT_SYMBOL_PATTERN.test(trimmed)) return "invalidSymbol";
  // 組み込み単位・予約識別子との衝突は isUsableCustomUnitSymbol に一本化する
  // （復元時と同じ判定を通すため）。登録済みの自作単位との衝突だけここで追加で見る。
  if (!isUsableCustomUnitSymbol(trimmed) || existingSymbols.includes(trimmed)) return "symbolTaken";
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
