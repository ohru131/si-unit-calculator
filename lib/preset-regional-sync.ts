import type { NotebookLocalConstant } from "@/lib/calculator-store";
import type { PresetRegionalDefaults } from "@/lib/preset-regional-defaults";

/**
 * プリセットの「地域依存の既定値」を、投入後も端末の地域に追従させるための純関数。
 *
 * **設計の要点は「目印（`regionalDefault`）を保存データに残すこと」。** 以前は投入時に
 * `presetConstantExpression` で解決した文字列だけを保存し、目印を捨てていたため、保存済みの
 * `"15km/L"` が**アプリが入れた既定値なのか利用者が打った値なのか区別できなかった**。
 * その結果、
 *
 * - 投入はカテゴリID単位で1回きりなので、あとからシードを直しても既存インストールに届かない
 *   （米国・英国のユーザーの走行コストノートが `15km/L` のまま残る。CodeRabbitが#54で指摘）。
 * - 引っ越し・端末のロケール変更でも追従しない。
 * - 後追いで直そうとすると「投入時のシード値と一致するか」で編集の有無を推測するしかなく、
 *   単位ごと変わる燃費（`15km/L` → `35mpg`）では過去に入りえた全地域の値と比べる必要が出る。
 *
 * 目印を残すと、この3つが全部消える。**目印がある＝まだアプリの既定値、無い＝利用者のもの**
 * という所有権がデータに書かれるので、推測が要らなくなる。
 *
 * **バックアップからの復元では目印が付かない**（`lib/notebooks-backup.ts` は `{ symbol, expression }`
 * だけを持ち運ぶ）。これは意図的で、バックアップは利用者の値を明示的に写したものなので、
 * 別の地域の端末へ復元したときに黙って地域の値へ書き換わる方が驚きが大きい。復元後の値は
 * 利用者のものとして扱う（＝アプリは触らない）。
 */

/**
 * 目印が付いたままのローカル定数を、現在の地域の既定値へ揃える。
 * 変更が無ければ `null` を返す（`presetResultSymbolPatch` と同じ約束にして、呼び出し側が
 * 「書き込みが必要か」をそのまま判定できるようにしている）。
 */
export function presetRegionalDefaultPatch(
  localConstants: NotebookLocalConstant[],
  regionalDefaults: PresetRegionalDefaults,
): NotebookLocalConstant[] | null {
  let changed = false;
  const next = localConstants.map((constant) => {
    if (!constant.regionalDefault) return constant;
    const expression = regionalDefaults[constant.regionalDefault];
    // 未知の種類（アプリを新しくして種類を減らした等）は触らない。空文字を入れると
    // その定数が解決できずノート全体が動かなくなるため、既存の式を残す方が安全。
    if (!expression || expression === constant.expression) return constant;
    changed = true;
    return { ...constant, expression };
  });
  return changed ? next : null;
}

/**
 * 利用者が値を書き換えた定数から目印を外す（以後アプリは触らない）。
 *
 * 保存の入口（`upsertNotebook`）で通すこと。画面側に目印を意識させると、詳細画面・編集シート・
 * バックアップ取り込みのそれぞれで外し忘れが起きる。**入口が1つなので、ここだけが所有権の
 * 移動を決める場所になる。**
 *
 * `previous` は保存前に入っていた定数一覧。同じ id の式が変わっていたら利用者が編集したと
 * 判断する。id が無い（＝新しく足した行）ものは、そもそも目印が付かないので何もしない。
 */
export function releaseEditedRegionalDefaults(
  next: NotebookLocalConstant[],
  previous: NotebookLocalConstant[] | undefined,
): NotebookLocalConstant[] {
  if (!previous?.length) return next;
  const previousById = new Map(previous.map((constant) => [constant.id, constant]));
  return next.map((constant) => {
    if (!constant.regionalDefault) return constant;
    const before = previousById.get(constant.id);
    // 保存前に無かった行、または式が変わった行は利用者のもの。目印を外す。
    if (before && before.expression === constant.expression) return constant;
    const { regionalDefault: _released, ...rest } = constant;
    return rest;
  });
}
