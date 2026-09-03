# 競合調査と改善提案（2026-09-03）

Shipaton 2026 提出に向けて、計算系アプリの市場を4方向から並行調査した結果の統合レポート。
既存の `docs/competitor-feature-research.md` / `docs/competitor-feature-roadmap.md` は公式サイトの機能一覧ベースの浅い調査だったので、本稿では**レビューの不満・課金の実勢・直接競合の存在確認**まで踏み込んでいる。

## 調査の限界（先に読むこと）

4本の調査すべてで、`apps.apple.com` / `play.google.com` / `revenuecat.com` / `justuseapp.com` などへの
**直接ページ取得がこの環境のegressプロキシでブロックされた**。したがって本稿の数値・引用は
検索エンジンのスニペットと二次情報（レビュー記事・まとめ記事）経由である。

**意思決定に使う前に一次情報を人力で開いて再確認すべき項目**は各節に「要確認」と明記した。
特に **Shipatonの提出要件（動画の長さ上限）と RevenueCatのベンチマーク数値**は必ず自分で確認すること。

## 1. 競合マップ

### 直接競合（「手順を並べて順に計算し、後続から参照する」ノート型）

**重要な発見: このUXは我々の独自機能ではない。** 既に複数の競合が実装済みである。

| アプリ | プラットフォーム | 価格 | 単位の扱い | 公式プリセット集 |
|---|---|---|---|---|
| **Soulver 3 / 4** | iOS / iPad / Mac（**Androidなし**） | 3系はプラットフォーム別買い切り（iPhone $14 / iPad $20 / Mac $34.99）、4系はユニバーサル購入 新規 $59。ライブデータ・GPT連携のみ年$26のオプションサブスク | 200単位超・170通貨。自然言語（`35 C in F`）。**次元不整合の検出は未確認** | **なし**（白紙から書く前提） |
| **CalcNote** | Android / iOS | 無料＋広告、広告除去サブスク、別売Proは買い切り$119.99（異例の高額） | 変数代入・行参照が中心。次元検証なし | なし |
| **mathote** | iOS | 無料＋プレミアム（額は未確認） | 未確認。プレミアムで行列・複素数・LaTeX/PDF出力 | なし |
| **Calca**（Krueger Systems） | iOS / Mac / Windows | 未確認（2018年以降の更新状況も未確認） | **次元解析対応を明記**。Markdown中に計算を混在 | なし |
| **Unit Formulas - Math Type** | Android | 未確認 | 「単位込みの数式入力（`5 ft + 2 m`）」「dimensional analysis built in」を明示的に訴求 | 未確認 |
| **Numi** | Mac / Win / Linux（**モバイルなし**） | 無料＋買い切り$23.59（無制限ノート・iCloud同期のみ） | 通貨・長さ・温度等。自然言語 | なし |

### 隣接カテゴリ

- **単位換算専業**: CalConvert（27カテゴリ600単位、Pro $4.99/月・$19.99/年）、ConvertPad（**関数形式のユーザー定義単位**、25言語）、Unit Converter Ultimate（OSS、ECBレート日次更新）、UnitGrid（独語圏、「完全オフライン・広告なし・サブスクなし」を訴求点にしている）
- **高機能電卓**: PCalc（買い切り $9.99）、Calcbot（無料＋$1.99の単発IAP）
- **科学電卓**: HiPER、RealCalc（2000万DL超・17万レビュー・★4.6）、Casio ClassWiz
- **解法系**: Photomath（月$9.99 / 年$69.99）、Symbolab（年$14.99）、Mathway、Microsoft Math Solver（**完全無料・広告なし・★4.9**）
- **統合型**: NCalc（電卓＋公式集＋単位/通貨換算を1本に統合、8000万ユーザーを自称）
- **公式集**: Physics Formulas、All Formulas、Mechanical Engineering One 等

### この市場の規模感

「電卓」「単位換算」の汎用キーワード上位は **数百万〜数千万DL・数万〜十数万レビューが当たり前の飽和市場**。
All-In-One Calculator（1000万DL・14万レビュー）、All Unit Converter（1000万DL・22万レビュー）など。
→ **汎用キーワードのオーガニック検索で新規個人開発アプリが見つかる経路は実質ない。**

## 2. 我々の差別化（守るべき軸）

調査した範囲で、**次の3点を同時に備えたモバイルアプリは見つからなかった**（網羅調査ではないので断定はしない）。

1. **7次元ベクトルによる次元不整合の自動検出** — 単位換算専業アプリにこの検証はない。Calca / Unit Formulas が「dimensional analysis」を謳うが、モバイルで厳密な検証まで確認できたものはない
2. **LaTeX（KaTeX）での数式表示と数値計算の同時提供** — 公式集アプリは「計算できない静止画の一覧」であることが最大の不満点
3. **ドメイン別プリセット公式集112件を最初から搭載** — ノート型競合（Soulver / CalcNote / mathote）はいずれも**白紙から自分で書く前提**でプリセットを持たない

加えて構造的な優位:

- **Soulver は Android版が存在しない**、Numi はモバイル非対応。ノート型で Android を押さえられている競合は CalcNote 系のみ
- 公式集アプリのレビュー最頻出不満が「**変数が何を表すか式中でラベル付けされていない**」であり、
  我々は定数記号をLaTeX変数と一致させる設計（`docs/` の方針どおり）で構造的にこれを回避している

### 逆に、この3点セット以外を差別化として語るのは危険

「手順を並べて順に計算」「単位換算」「履歴」「変数代入」は競合が全部持っている。
ストア説明もデモ動画も、**上の3点に絞って語るべき**。

## 3. 欠けている機能（優先度つき）

4本の調査で挙がった候補を重複排除し、インパクト×コストで並べたもの。実装済み機能は除外している。

| 優先度 | 機能 | 根拠 | コスト |
|---|---|---|---|
| **P0** | **計算ノートの共有／エクスポート（画像・PDF）** | Soulver（ファイル共有）・CalcNote・Calcula（.calc/.json/.txt/画像）が標準装備。既存の `notebook-detail` の表示をレンダリングして出力するだけで済み、SNS拡散導線にもなる | 低〜中 |
| **P1** | **ユーザー定義単位** | ConvertPad が**関数形式（`2*x+5`）**での登録という強い実装を持つ。工学・料理などニッチ需要に効く。`BASE_UNITS` / `PREFIXES` と同じ仕組みをユーザー入力から動的登録する設計で対応可 | 中 |
| **P1** | **単位比較表ビュー**（1つの値を複数単位で横並び表示） | ConvertPad の独自機能。既存の変換ロジックを流用してUIを足すだけ | 低〜中 |
| **P2** | **自然言語フレーズ**（`10% off 500`、`3 days from now`） | Soulver / Numi / Calca が共通して**称賛されている核**は「単位換算そのもの」より「自然言語で気軽に書ける」点。我々の厳密さと相反しないので、パーサの別レイヤとして足せる | 中 |
| **P2** | **進数（16進/8進/2進）モード** | PCalc / RealCalc / HiPER が揃って標準搭載。科学電卓カテゴリの「当たり前」で、無いと物足りないと言われやすい | 低〜中 |
| **P3** | **通貨のライブレート**（Pro限定のオプトイン） | ノート型・換算専業のほぼ全競合が主要機能に持つ。ただし**「完全オフライン」を訴求点にしている競合（UnitGrid）が高評価**でもあり、既存のオフライン方針との衝突は要判断。導入するならオフラインのコア計算と明確に分離すること | 中〜高 |
| P4 | テーマ切り替え、Apple Watch、物理定数DB拡充、RPN | いずれも競合の一部が持つが差別化としては弱い | 低〜高 |
| **見送り推奨** | グラフ描画 / CAS・方程式ソルバー / OCR・手書き認識 / 行列・複素数・統計 | Desmos・Symbolab・Photomath という専業の強者がいる別カテゴリ。コストが極めて高く、単位電卓としての軸がぼやける | 非常に高 |

**有効数字・不確かさ伝播とクラウド同期**は、レビュー上の需要を裏付ける証拠が見つからなかった（未確認）。
既存 `docs/competitor-feature-roadmap.md` では工学表記をP2に置いていたが、今回の調査では需要の根拠が得られなかった。

## 4. 収益設計の見直し（最重要）

### 現状

Pro（entitlement=`pro`）で有料化しているのは以下4点のみ。

- 履歴の無制限化（無料は5件・`app/(tabs)/index.tsx:368`）
- お気に入り単位（同 1140行）
- CSVエクスポート（同 772行）
- 広告除去（`lib/ads-provider.tsx`）

### 調査で判明した、このジャンル固有の事情

**マクロ統計とジャンルの実態が食い違っている。ここが判断の分かれ目。**

- RevenueCat の業界ベンチマーク（Utilitiesカテゴリ）では、トライアル→課金の転換率中央値6.5%、価格中央値は週$5.99 / 月$10 / 年$34.80、
  ハードペイウォールはフリーミアムの約5倍転換する — **ただしこれらの数値は二次情報経由で、要一次確認**
- 一方**「電卓」という具体ジャンルではサブスクへの反発が突出して強い**。レビュー横断で繰り返し確認された:
  - 「3年分のサブスク代で普通の電卓が買える」
  - 「なぜ電卓アプリに広告を出すのか」
  - 「$19/年は高すぎる、買い切り$5〜15なら払う」
  - **買い切りオプションが無いこと自体が低評価コメントの定型パターン**
- 実際に評価されている競合の設計は **「コアは買い切り、付加価値だけサブスク」**（Soulver: 買い切り＋ライブデータのみ年$26 / PCalc: 買い切り$9.99 / Calcbot: 単発IAP $1.99）

### 提案

1. **コア体験は完全無料のまま維持する。** 単位付き数式の計算・SI正規化・次元検証・単位チップは絶対に制限しない
2. **履歴5件制限を撤廃する。** 「計算のたびに履歴が消える／制限される」はこのジャンルの低評価直撃パターン。無料の価値を削ってProを売る設計は反発が最も強い部分にあたる
3. **Lifetime / 買い切りを主軸に据え、サブスクは併記に留める。** 具体案は 月$2.99 / 年$14.99 / **Lifetime $24.99〜29.99** の3択で、Lifetimeを視覚的に「お得」として強調
4. **Proに回すべきもの**（無料の価値を削らずに追加価値を売る方向）:
   - 広告除去
   - 計算ノートの共有／PDF・画像エクスポート（上のP0機能）
   - バックアップ／クラウド同期
   - ユーザー定義単位・カスタムカテゴリ
   - プリセット112件の一部（例: 無料は理科46件、Proで物理・電気・天体・材料力学ほかを解放）— ただし**教育的価値を人質に取る形になるので Peace Prize 狙いとは相反する**。採用は要判断
5. **トライアルを設けるなら4日以上**（4日未満は転換率25.5%まで落ちるとのデータ、要確認）。ただし電卓は即座に価値が伝わる種類のアプリなので、そもそもトライアル不要でコアを無料開放する方が合う可能性が高い

## 5. ASO・ストア掲載

**「unit converter」を主戦場にしない。** 供給が飽和しており勝てない。
狙うのは我々の差別化に一致するロングテール:
`dimensional analysis calculator` / `calculator with units` / `formula calculator with units` / `engineering unit converter`。
これらはWeb検索では計算サイト（omnicalculator、calcbe等）が上位を占めており、**アプリとしての供給が薄い**。

- **タイトル案（英）**: `Unit Calculator: SI & Formulas` / **サブタイトル**: `Type math with units. Dimension-checked.`
- **キーワード欄**: `unit converter, dimensional analysis, scientific calculator, physics formulas, engineering calculator, SI units`
- **タイトル案（日）**: `単位付き電卓 - 数式で単位計算・公式ノート`（「単位換算」単体は狙わず「単位付き 電卓」「数式 単位」の複合語を狙う）
- 6言語すべてで「素の単位換算」市場は飽和していた。**どの言語でも「数式ごと計算できる」提案の方が空いている**（各言語の実検索ボリュームは未確認）

**スクリーンショット構成案**（1枚目が最重要）:

1. `5cm + 1mm` が**そのまま計算される様子**（最大の差別化）
2. **次元検証エラー**（`m + kg` は計算できない）— 「間違った計算に気づける」
3. LaTeX数式付きの計算ノート（材料力学か物理の見栄えの良いもの）
4. カテゴリグリッド（112件の「幅」を見せる）
5. iOSウィジェット／6言語対応

## 6. 低評価の地雷リスト

レビュー横断で**複数アプリ・複数言語にわたって繰り返し確認された**もの。

1. **計算実行に紐づく全画面広告を絶対に入れない。** このジャンルの低評価で最頻出。現状のバナーのみの方針は正しい
2. **広告表示で入力・履歴が消える事故を起こさない。** Calculator Plus with History で「全画面広告のあと履歴が消える」という実害報告がある
3. **課金後に広告が消えない状態を絶対に作らない。** HiPER・CalConvert 両方で「Pro買ったのに広告が出る」という致命的レビューが確認された。→ **Pro購入直後の反映タイミングとオフライン時のentitlement判定の堅牢性を要確認**
4. **既存の無料機能を後出しで有料化しない**
5. **オフライン動作を壊さない。** ネットワーク必須の機能を無料コアに混ぜない
6. **単位数・プリセット数の多さをそのままUIの煩雑さにしない。** 独語圏レビューに「単位が多すぎて分かりにくい」という実例がある。検索・お気に入り・最近使った単位の整理UIは必須
7. **サブスク解約導線を分かりにくくしない**
8. **物理・化学用語の正確性を継続的に検証する。** 理系ユーザーは用語の誤りに厳しい（既に "terminal velocity" 誤用をCodeRabbitに指摘された前例あり）
9. **単位定義そのものの誤りは致命傷。** 競合で「1lb=1000g」のような定義バグ、梁計算アプリで特定条件の計算結果が誤りという報告があった。**計算精度への信頼が我々の最大の資産**であり、`tests/` の網羅性維持がそのまま競合優位になる

## 7. Shipaton 2026: 残り日数と勝ち筋

### スケジュールが最大のリスク（要確認・即対応）

- **最終提出締切: 2026年9月30日 23:45 PDT** → 本日（9月3日）から**残り約27日**
- **アプリはまだストア未公開**
- **Google Play の14日間クローズドテスト規則**（2023年11月13日以降に作成された個人アカウントに適用）: 本番公開申請の前に**12人以上のテスターで14日間連続**のテストが必要。9月3日開始でも完了は9月17日で、そこから審査・公開のバッファしかない
- 審査員がダウンロードできる状態が必須で、「審査中」ステータスは不可。**締切の1週間前には公開されている状態が望ましい**とされる
- RevenueCatの準備ガイドは「9月1日までにクローズドテスト開始、9月23日までに一般公開」を推奨しており、**この逆算スケジュールは既に過ぎている**

→ **機能追加より先に、ストア公開の手続きを今日動かすべき。** 上の第3節の機能はすべてこれの後。

### 狙うべき賞: RevenueCat Design Award（Craft Award）

根拠:

- 審査基準が「**ビジネスとしての実現可能性やトラクションと切り離して、作り込みそのものを評価する**」と明記されている。公開直後で実績データがない我々の状況と最も相性が良い
- 「革新的なアイデア／美しいUI／丁寧なインタラクション・アニメーション」が評価軸であり、KaTeXでの本物の数式描画、7次元次元検証、複合単位のカーソル位置認識置換、112件のプリセット、6言語完全ローカライズは「電卓という地味なカテゴリで異例に作り込まれている」と言える
- 2025年のDesign Award受賞作（Dayloop等）も機能量より「一点の体験を極めた」アプリだった
- 過去受賞に**教育・ユーティリティ系は明確に存在する**（Gurwi=語学学習、Studient=学習支援、Otter Day=暗算学習、Heartbeat Hero=CPR学習）。ただし**純粋な「単位換算＋数式電卓」の受賞例は確認できなかった**（未確認）

次点:

- **Peace Prize（Social Good）**: 「6言語で世界中の学生にSTEM教育アクセスを無料提供」の角度。ただし審査軸の「リーチ」は公開直後だと弱く、「小中理科〜材料力学まで体系網羅」という深さで押すしかない。※第4節のプリセット部分有料化はこの狙いと相反する
- **HAMM Award**: Pro＋広告のハイブリッドは要件を満たすが「創造的な収益ミックス」としては平凡。優先度中〜低
- **Samsung「Best App for Galaxy」**: Galaxy Store公開のコストが小さければ狙う価値あり
- **狙いにくい**: Grand Prize と Replit/Noise 等のトラクション系（成長を見せる期間が数週間しかない）。JetBrains枠は Kotlin Multiplatform 必須のため**対象外**

### デモ動画で見せるべきもの

公式の助言は「機能の羅列ではなくアウトカムを語る」「Proof first, polish second」。

1. 冒頭数秒で `5cm + 1mm` → SI正規化＋任意単位換算が**リアルタイムに**出る体験
2. 次元検証エラー（`m + kg`）で「間違いに気づける」ことを一瞬見せる
3. LaTeX数式のノートをスクロールし、小学理科から材料力学までの「幅」を一気に見せる
4. 6言語切り替えのカット（個人開発でここまでやったのかという驚き）
5. **動画の長さ上限は「2分以内」と「3分」で情報が食い違った。必ず公式ルールで確認すること**

### RevenueCat機能で加点が見込めるもの

準備ガイドが明示的に推奨しているのは **Paywall Editor / Experiments / Targeting / Web Billing / Virtual Currency**。
このうちコスト対効果が良いのは:

- **Paywall Editor でのペイウォール構築**（HAMM・Design 双方の心証に効く）
- **Targeting による言語別・地域別の出し分け**（6言語・地域別通貨が既にあるので相性が良い）

Experiments と Virtual Currency は本アプリの性質（買い切り寄り＋広告）では優先度低。

## 8. 推奨アクション順

1. **【今日】Google Play クローズドテストの開始とテスター12人の確保。Apple Developer Program の登録・本人確認を並行**
2. **【今日】公式ルールを人力で開いて提出要件を確定**（動画の長さ、アイコン・スクショ仕様、提出物の言語要件）
3. 課金設計の見直し（第4節）— **履歴5件制限の撤廃と Lifetime の追加**。ストア公開前に決めるべき
4. ストア掲載素材の作成（第5節のタイトル・キーワード・スクショ5枚）
5. Paywall Editor でペイウォールを整える
6. 計算ノートの共有／PDF・画像エクスポート（第3節P0。Proの価値にもデモの見せ場にもなる）
7. 公開後に余力があれば ユーザー定義単位・単位比較表

## 出典

主要なものだけ。各節の詳細な出典は調査時のログを参照。

- [RevenueCat Shipaton 2026 Rules (Devpost)](https://revenuecat-shipaton-2026.devpost.com/rules)
- [Shipaton 2026 Preparation Guide (RevenueCat Codelabs)](https://revenuecat.github.io/codelabs/shipaton-2026-prep.html)
- [Navigating Google Play's 14-Day testing rule](https://www.revenuecat.com/blog/engineering/google-play-14-day)
- [How we judge Shipaton](https://www.shipaton.com/blog/how-we-judge-shipaton)
- [RevenueCat Design Award](https://www.shipaton.com/categories/revenuecat-design-award)
- [Shipaton 2025 Winners](https://www.revenuecat.com/blog/company/shipaton-2025-winners)
- [How to win Shipaton part 4: pitching your app](https://www.revenuecat.com/blog/engineering/how-to-win-shipaton-part-4-pitching-your-app)
- [RevenueCat: State of Subscription Apps 2026 — Utilities](https://www.revenuecat.com/state-of-subscription-apps-2026-utilities)
- [RevenueCat blog: Hard paywall vs soft paywall](https://www.revenuecat.com/blog/growth/hard-paywall-vs-soft-paywall/)
- [Soulver 3 for Mac: The MacStories Review](https://www.macstories.net/reviews/soulver-3-for-mac-the-macstories-review/)
- [Soulver 4 (App Store)](https://apps.apple.com/us/app/soulver-4/id1508732804)
- [CalcNote (Google Play)](https://play.google.com/store/apps/details?id=com.burton999.notecal&hl=en_US)
- [mathote (App Store)](https://apps.apple.com/ca/app/mathote/id6760556856)
- [Calca (App Store)](https://apps.apple.com/us/app/calca/id635757879)
- [Unit Formulas - Math Type (Google Play)](https://play.google.com/store/apps/details?id=com.mathtype.mathtype&hl=en)
- [ConvertPad - Unit Converter (AppBrain)](https://www.appbrain.com/app/convertpad-unit-converter/com.mathpad.mobile.android.wt.unit)
- [CalConvert Reviews (JustUseApp)](https://justuseapp.com/en/app/426007025/calconvert-w%C3%A4hrungsrechner/reviews)
- [Calculator Plus with History (Google Play)](https://play.google.com/store/apps/details?id=com.digitalchemy.calculator.freedecimal&hl=en_US)
- [HiPER Scientific Calculator (Google Play)](https://play.google.com/store/apps/details?id=cz.hipercalc&hl=en_GB)
- [Numi 公式](https://numi.app/)
- [omnicalculator: Dimensional Analysis Calculator](https://www.omnicalculator.com/conversion/dimensional-analysis)
