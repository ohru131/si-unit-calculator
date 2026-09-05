// 計算ノートの絞り込み。プリセットが184件・カテゴリが2階層になり、どのカテゴリに入れたかを
// 覚えていないと辿り着けなくなったので、カテゴリ階層を横断して探せるようにするための純関数。
//
// **並べ替えではなく絞り込みであること**を守る。スコアは「タイトルの先頭一致 →
// タイトルの部分一致 → 説明文 → カテゴリ名」の優先順を作るためだけに使い、同じ強さの
// ものは渡された順（＝カテゴリの表示順）のまま返す。検索するたびに順序が入れ替わると、
// 一覧のどこを見ていたか分からなくなる。

/** 絞り込みに使うフィールド。呼び出し側はこれを含む任意の型（ノートそのもの）を渡せる。 */
export type NotebookSearchItem = {
  title: string;
  description: string;
  /** そのノートが属するカテゴリの表示名。「料理」のようにカテゴリ名でも辿れるようにするために見る。 */
  categoryLabel: string;
};

// 検索語のゆれを吸収するための文字の置き換え表。**String.prototype.normalize("NFD") を
// 使わない**のは、このコードベースに前例が無く、Hermesで落ちると「テストは全部通るのに
// 実機だけ動かない」形になるため（CLAUDE.mdの方針）。ここで潰すのはアプリが対応している
// 6言語（en/ja/es/pt-BR/de/fr）に出るラテン文字のダイアクリティカルマークだけでよい。
const FOLDED_CHARS: Record<string, string> = {
  á: "a", à: "a", â: "a", ã: "a", ä: "a", å: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
  ú: "u", ù: "u", û: "u", ü: "u",
  ç: "c", ñ: "n", ý: "y", ÿ: "y", æ: "ae", œ: "oe", ß: "ss",
  // このデータでの Ø は北欧語の文字ではなく**直径記号**（「Ø60×5 鋼管」「Ø20 mm の丸棒」の
  // ように、はり・柱や軸・動力のノートのタイトル・説明文に出る）。fold() は先に小文字化するので
  // 表に載せるのは小文字の ø の方（Ø のまま載せても引かれない）。
  ø: "o",
};

// 大文字小文字とダイアクリティカルマークを潰す。日本語はそのまま（分かち書きが無いので
// 部分一致で十分に効く）。
function fold(text: string): string {
  let result = "";
  for (const char of text.toLowerCase()) result += FOLDED_CHARS[char] ?? char;
  return result;
}

/**
 * 検索語を空白区切りのトークンに割る。全角スペースも区切りとして扱う
 * （日本語入力では全角スペースが混ざるのが普通で、区切れないと1件も当たらなくなる）。
 */
export function tokenizeNotebookQuery(query: string): string[] {
  return fold(query).split(/[\s　]+/).filter(Boolean);
}

/**
 * 検索で見るカテゴリ名を作る。カードに出す表示用の名前と違い、**親カテゴリの名前も混ぜる**。
 * ノートは必ず葉カテゴリ（「速さ・運動」）に属するので、葉の名前しか見ないと、
 * カテゴリカードで覚えている大分類の名前（「理科（小・中）」「高校物理」）では1件も当たらない。
 * 表示側は葉の名前だけを出し続ける（カードに「速さ・運動 / 理科（小・中）」と出す必要は無い）ので、
 * 表示用の対応表とは別に作る。
 */
export function buildCategorySearchLabels(
  labelById: Map<string, string>,
  categories: { id: string; parentId?: string }[],
): Map<string, string> {
  const parentIdById = new Map(categories.filter((category) => category.parentId).map((category) => [category.id, category.parentId as string]));
  const result = new Map<string, string>();
  labelById.forEach((label, id) => {
    const parentLabel = labelById.get(parentIdById.get(id) ?? "");
    // 区切りに " / " を使うのは、検索語がつなぎ目をまたいで偶然一致するのを防ぐため
    // （空白1つでつなぐと「動理」が「速さ・運動 理科」に当たってしまう）。
    result.set(id, parentLabel ? `${label} / ${parentLabel}` : label);
  });
  return result;
}

// トークン1つが1件のノートにどれだけ強く当たったか。0は不一致。
// 全トークンぶんの最小値をそのノートの強さにする（＝一番弱い当たり方に引きずられる）ので、
// 「タイトルに当たった語」と「カテゴリ名にしか当たらない語」を混ぜた検索は下の方に沈む。
function tokenScore(token: string, title: string, description: string, categoryLabel: string): number {
  if (title.startsWith(token)) return 4;
  if (title.includes(token)) return 3;
  if (description.includes(token)) return 2;
  if (categoryLabel.includes(token)) return 1;
  return 0;
}

/**
 * 検索語で絞り込む。空白区切りの語は**すべて**当たる必要がある（AND）。
 * 語を足すほど絞れる方が、増えるより探しやすいため。
 * 検索語が空（または空白だけ）のときは空配列を返す。呼び出し側は「検索していない」状態と
 * 「1件も見つからない」状態を、この関数の戻り値ではなく検索語そのもので区別すること。
 */
export function searchNotebooks<T extends NotebookSearchItem>(items: T[], query: string): T[] {
  const tokens = tokenizeNotebookQuery(query);
  if (!tokens.length) return [];

  const scored: { item: T; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const title = fold(item.title);
    const description = fold(item.description);
    const categoryLabel = fold(item.categoryLabel);
    let weakest = Infinity;
    for (const token of tokens) {
      const score = tokenScore(token, title, description, categoryLabel);
      if (!score) return;
      weakest = Math.min(weakest, score);
    }
    scored.push({ item, score: weakest, index });
  });

  // Array.prototype.sort は安定だが、同点の並びを元の順に保つことをこの比較関数でも
  // 明示しておく（indexを第2キーにする）。処理系の安定性に暗黙に頼らないため。
  return scored.sort((left, right) => right.score - left.score || left.index - right.index).map((entry) => entry.item);
}
