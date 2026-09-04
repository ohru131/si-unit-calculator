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

// 壊れた保存データ（他端末からの古いバックアップ、手動編集された可能性のあるAsyncStorage・
// バックアップファイルの中身など）が混ざっていても起動や取り込みを落とさないよう、
// 他のisSavedXxxと同じ「怪しい要素はfilterで捨てる」防御にする。dimensionは7要素の数値配列で
// あることまで見る（DimensionはTypeScript上はタプルだが、AsyncStorageやJSONファイルから
// 読んだ値には型情報が付かないため実行時に長さと要素の型を検証する必要がある）。
// 記号の形式チェックは isUsableCustomUnitSymbol に一本化する。以前は「空文字でなければOK」
// しか見ておらず、保存データに symbol: "m" のような組み込み単位と衝突する記号や数字入りの
// 記号が混ざっていても素通りしていた。組み込みが常に優先されるため、そういう記号は
// 設定画面には並ぶのに式では絶対に解決されない「幽霊単位」になる。
// 保存データ復元時（lib/calculator-store.tsx）とバックアップ復元時（notebooks-backup.ts /
// constants-backup.ts）の両方から呼ぶので、判定を2箇所に分けないためここに一本化する。
export function isCustomUnit(value: unknown): value is CustomUnit {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CustomUnit>;
  return typeof candidate.symbol === "string"
    // isUsableCustomUnitSymbolはtrimしてから検証するので、" shaku " のような前後に空白の付いた
    // 記号もそこは通ってしまう。ところが登録時（parseCustomUnit）は必ず symbol.trim() を保存する
    // ため、空白付きの記号は「保存データが壊れている」か「手で編集された外部のバックアップ
    // ファイル」からしか入ってこない。しかも式のトークナイザは空白込みの記号を絶対に作らない
    // ので、通してしまうと "shaku" とは別キーとして登録され、設定画面には並ぶのに式では
    // 絶対に解決されない幽霊単位になる（重複排除も別物として素通りする）。ここで弾く。
    && candidate.symbol === candidate.symbol.trim()
    && isUsableCustomUnitSymbol(candidate.symbol)
    && typeof candidate.expression === "string"
    // scaleが0の単位は convertQuantity の除算で Infinity になるので、壊れた保存データとして落とす
    // （parseCustomUnitはzeroScaleで弾くが、ここは保存済みデータが壊れている場合の防御）。
    && typeof candidate.scale === "number" && Number.isFinite(candidate.scale) && candidate.scale !== 0
    && typeof candidate.offset === "number" && Number.isFinite(candidate.offset)
    && Array.isArray(candidate.dimension) && candidate.dimension.length === 7
    && candidate.dimension.every((component) => typeof component === "number" && Number.isFinite(component));
}

// customUnitsフィールド（バックアップファイル・AsyncStorageのどちらも同じ形）の検証＋重複排除を
// 1箇所にまとめる。壊れた要素はその要素だけを黙って捨て、同じ記号が複数あれば先勝ちで1つに絞る
// （setCustomUnitsRegistryは記号をキーに上書き登録するだけで重複を検出しないため、
// 複数あると黙って後の要素が勝ってしまい、一覧と実際に解決される単位がズレる）。
export function parseCustomUnitsField(value: unknown): CustomUnit[] {
  if (!Array.isArray(value)) return [];
  const seenSymbols = new Set<string>();
  return value.filter(isCustomUnit).filter((unit) => {
    if (seenSymbols.has(unit.symbol)) return false;
    seenSymbols.add(unit.symbol);
    return true;
  });
}

// 2つのCustomUnitが「完全に同じ定義」かどうか。バックアップ取り込みで、同じ記号でも中身が
// 違うものを黙って上書きしないための判定に使う。
//
// 評価結果（scale/offset/dimension）だけでなく expression も比較する。expression は表示と
// 再編集のために保存しているユーザーの入力そのもので、取り込みで置き換わればユーザーから見て
// 定義が書き換わったことになるため（例: 端末で "303mm" に直したあと "0.303m" 時代の古い
// バックアップを取り込むと、同じ値でも編集が巻き戻る。これは警告すべき上書き）。
// 評価結果だけを見る実装にすると、この巻き戻りが無言で起きる。
export function customUnitsAreEqual(a: CustomUnit, b: CustomUnit): boolean {
  return a.expression === b.expression && a.scale === b.scale && a.offset === b.offset
    && a.dimension.length === b.dimension.length && a.dimension.every((component, index) => component === b.dimension[index]);
}

// 取り込み時に「同じ記号が既にあり、かつ定義が異なる」件数を数える。確認ダイアログの
// 「n件の自作単位が上書きされます」の件数はこれで出す。定義が完全に同じなら実質何も
// 変わらないので数えない。
export function countCustomUnitConflicts(existing: CustomUnit[], incoming: CustomUnit[]): number {
  const existingBySymbol = new Map(existing.map((unit) => [unit.symbol, unit]));
  return incoming.filter((unit) => {
    const current = existingBySymbol.get(unit.symbol);
    return current !== undefined && !customUnitsAreEqual(current, unit);
  }).length;
}

// バックアップ取り込みの唯一のマージ規則: 追加と同名記号の置換だけを行い、絶対に削除しない。
// 「すべての計算ノートを置換」の確認文は計算ノートについてしか言っていないため、そこに
// 便乗して自作単位まで消すと、ユーザーが同意していない破壊になる（merge/replaceどちらの
// モードでも同じ）。同じ記号が複数回incomingに現れた場合は後勝ち（バックアップ内の並び順を
// そのまま反映する）。
export function mergeCustomUnits(existing: CustomUnit[], incoming: CustomUnit[]): CustomUnit[] {
  if (incoming.length === 0) return existing;
  const bySymbol = new Map(existing.map((unit) => [unit.symbol, unit]));
  for (const unit of incoming) bySymbol.set(unit.symbol, unit);
  return Array.from(bySymbol.values());
}

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
