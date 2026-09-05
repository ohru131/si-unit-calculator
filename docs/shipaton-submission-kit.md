# Unit Calculator — Shipaton 2026 Submission Kit（Android版）

**このドキュメントは全面更新版。** 旧版は計算ノート・単位比較表・ユーザー定義単位・進数・6言語対応・買い切り課金への移行・履歴無制限化のいずれも記載が無く、CSVエクスポート中心の古い機能一覧のまま（Pro機能一覧も実際は4点なのに3点しか無かった）iOS想定のサイズで書かれていたため、全面的に書き直した。

**今回の提出対象は Android（Google Play）のみ。** iOSやApp Store向けの記述は削除した。

各節の詳細は専用ドキュメントに分けてあるので、ここはハブとして使う。

## 目次と裏取り根拠

| 節 | 参照ドキュメント | 何を裏取りに使ったか |
|---|---|---|
| ストア掲載文（短い説明・詳しい説明、6言語） | `docs/store-listing-copy.md` | `CLAUDE.md`直近の作業履歴3・5〜9・14・16〜18番、`lib/notebook-formulas/`実測、`app/(tabs)/pro.tsx`の`EN_COPY.features` |
| Android提出チェックリスト（Play固有の必要素材・設定） | `docs/android-submission-checklist.md` | Google Play Console公式ヘルプ・AdMob公式ガイド・RevenueCat公式ドキュメントのWeb調査（2026年9月時点） |
| スクリーンショット撮影指示 | `docs/screenshot-capture-plan.md` | アプリの実画面・実操作をコードから確認（`app/(tabs)/index.tsx`・`settings.tsx`・`notebook.tsx`・`constants.tsx`・`pro.tsx`） |
| 無音デモ動画の台本 | `docs/shipaton-demo-script.md` | 同上。ナレーション音声が消失・TTS不可のため無音＋字幕に作り直した |
| 審査員向けテスト手順（英語） | `docs/reviewer-testing-instructions.md` | `app/(tabs)/pro.tsx`のPro特典4点、`lib/pro-preview.ts`・`lib/revenuecat-provider.tsx`・`app/(tabs)/settings.tsx`（Web版Proプレビューの発動方法・Web限定であることを実装から確認済み） |
| 個別のアセット評価 | `docs/submission-assets-review.md` | 既存素材の再評価（Androidサイズへの読み替え含む） |

## アプリの現在地（今回追記した主要機能）

以下は旧版に一言も無かった機能で、今回すべて掲載文・撮影指示・審査員向け手順に反映した。

1. **計算ノート（notebooks）** — プリセット184件（`lib/notebook-formulas/`の`PRESET_NOTEBOOK_SEEDS`を実行して実測）、38カテゴリ（最上位9枚＋親子2階層ナビゲーション）、KaTeXによる本物のLaTeX数式表示。CLAUDE.md「直近の作業履歴」3・5・6・20番
2. **単位比較表** — 1つの結果を単位チップと同じ候補・並び順で縦に開いて比較（`lib/unit-comparison.ts`）。同16番（PR #33）
3. **ユーザー定義単位** — 倍率形式・関数形式（摂氏・華氏のようなオフセット対応）（`lib/custom-units.ts`）。同17番（PR #34）
4. **進数（2進・8進・16進）** — 電卓の結果を10進以外でも表示・入力できる。単位ではなく「同じ値の表記」を変えるだけという設計上の区別に注意（`lib/number-base.ts`）。同18番（PR #37/#38/#39、#40で使える形に修正）。**このブリーフでは当初見落とされていた機能**で、コーディネーターからの追加指示を受けて掲載文・撮影指示に反映した
5. **6言語対応** — en/ja/es/pt-BR/de/fr。UI・単位名・エラーメッセージ・プリセット計算ノートの中身まで翻訳済み。同7〜9番（PR #21〜#23）
6. **バックアップ／復元** — 計算ノート・グローバル定数に加え、**自作単位も含む**（`lib/constants-backup.ts`・`lib/notebooks-backup.ts`の`customUnits`フィールドを実装コードで確認。関連コミット`5ccfa29`）。**注意**: `CLAUDE.md`末尾の「次にやりそうなこと」は自作単位のバックアップ対応を未着手のTODOとして書いているが、これは更新漏れ。本セッションでコミット履歴（ブランチの祖先であることを`git merge-base --is-ancestor`で確認済み）とソースコードの両方から、実際には対応済みであることを確認した
7. **買い切り1本・サブスクなし** — CLAUDE.md「直近の作業履歴」14番、`docs/market-research-2026-09.md`第4節（電卓ジャンルはサブスクへの反発が突出して強いという調査結果）
8. **無料版でも履歴無制限** — 同14番。旧版は「Proで無制限」という誤った特典設計のままだった
9. **厳密値表示（分数・π・√）** — 電卓の結果カードで「小数 ⇔ 厳密値」をチップで切り替え、KaTeXで本物の分数・根号として描画する。厳密な形が見つかったときだけチップが出る（`lib/exact-value.ts`、PR #42）。**本セッションで追記した機能**
10. **計算ノートの検索・電気の地域別の既定値** — ライブラリ（計算ノート）タブ上部の検索欄でタイトル・説明文・カテゴリ名を横断して絞り込める（`lib/notebook-search.ts`）。あわせて商用電源の電圧・ブレーカー定格を端末の地域から解決する（`lib/preset-regional-defaults.ts`、PR #48）。**本セッションで追記した機能**

Pro機能は憶測ではなく `app/(tabs)/pro.tsx` の `EN_COPY.features`（読み取りのみ、改変はしていない）から取った実際の4点: **広告非表示・CSVエクスポート・マイ単位セット・計算ノートの共有（PDF/印刷用の書き出し）**。

## 前提条件（ユーザー確定済み・本セッションで踏まえたもの）

1. 提出はAndroid（Google Play）のみ
2. ストア掲載文は6言語すべて（en/ja/es/pt-BR/de/fr）
3. スクリーンショットは日英2言語のみ撮影し、他4言語は英語版画像を流用
4. デモ動画は無音の画面録画（前回のナレーション音声は消失、TTSも使えない）
5. Web版に隠しのProプレビュー機能を実装済み（`lib/pro-preview.ts`）。発動方法（URLクエリ`?pro=preview`／設定画面「地域」行7回タップ）は`docs/reviewer-testing-instructions.md`に確定済みの手順として記載した

## プライバシーポリシーと問い合わせ先 — 提出前に差し替えが必要な箇所

**現状、アプリ本体にもドキュメントにも実在のプライバシーポリシーURL・実在の問い合わせ先は無い。** 以下は全て提出前の人間の作業が必要。

| 箇所 | 現状 | 必要な作業 |
|---|---|---|
| プライバシーポリシー本文 | 下記のドラフトのみ。公開URLでホストされていない | 実際の文書を作成し、公開URL（例: GitHub Pagesや自社サイト）でホストする |
| Play Consoleのプライバシーポリシー欄 | 未設定 | 上記URLを登録する |
| 問い合わせ先メールアドレス | ドキュメント中に実在のものが無い（旧版は`support@example.com`というダミーだった） | 実在の監視可能なメールアドレスに差し替える |
| Play Consoleの開発者連絡先 | 未設定 | 上記メールアドレスを登録する |
| 審査員向けPro解除の実際の値（`docs/reviewer-testing-instructions.md`のTODO） | プレースホルダのまま | Play Console/RevenueCatでプロモコードを発行し、実際のコード・手順に差し替える |
| Web版Proプレビューの発動方法（同上） | 確定済み・記入済み（URLクエリ`?pro=preview`／設定画面「地域」行7回タップ） | 提出前に、実際にホストしているWeb版のURLで`?pro=preview`が動作することを最終確認する |

### プライバシーポリシー・ドラフト（差し替え前提）

> Unit Calculator stores calculation history, saved constants, custom units, and preferences locally on the device. Purchase status is processed by RevenueCat and Google Play. Banner ads are served via Google AdMob, which may collect device/advertising identifiers as described in Google's own disclosures. The app does not require an account and does not upload your calculation content to our servers.
>
> **提出前に、上記ドラフトを実在の法人・個人情報（データ管理者の名称・所在地）、削除依頼の連絡先、最終的な広告・課金設定を反映した本物のプライバシーポリシーに差し替え、公開URLでホストすること。**

## 最終コンプライアンスチェックリスト

- [ ] 最終提出締切（Shipaton 2026: 2026年9月30日23:45 PDT。要確認: 現在から見て残り日数を都度確認）に間に合うスケジュールで動く
- [ ] `docs/android-submission-checklist.md`の全項目を完了する
- [ ] RevenueCat SDKにAndroid本番SDKキーを設定し、`pro` entitlement・買い切り商品・Paywallを公開する
- [ ] Google Playの本番リリースが申請され、実際にダウンロード可能な状態になっている（審査中ステータスのままでは審査員がテストできない）
- [ ] プロモ/オファーコードで審査員がPro機能を購入無しで確認できる（買い切りにはトライアルが存在しないため）
- [ ] Web版のProプレビュー（`?pro=preview`）で審査員がWeb上でもPro機能を確認できることを最終確認する
- [ ] 無音デモ動画（`docs/shipaton-demo-script.md`）・6言語ストア掲載文（`docs/store-listing-copy.md`）・512×512アイコン・1024×500フィーチャーグラフィック・日英スクリーンショットが揃っている
- [ ] プライバシーポリシー（実URL）と実在の問い合わせ先メールアドレスが公開されている（上記「提出前に差し替えが必要な箇所」を参照）
- [ ] 購入・復元・Pro解放・CSVエクスポート・ノート共有（PDF書き出し）を実機のリリースビルドで確認済み
- [ ] Data safetyフォーム・広告の申告・コンテンツレーティングをPlay Consoleで完了している
