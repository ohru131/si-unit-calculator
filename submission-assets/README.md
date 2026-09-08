# 提出素材（Shipaton 2026 / Google Play）

**このディレクトリは必ずコミットすること。** 前回の提出準備では素材をコンテナ内のローカル
ディレクトリにだけ置いてコミットしておらず、1024pxアイコン・スクリーンショット3種・
ナレーション付きデモ動画がすべて失われた（残っていたのは `scripts/build_shipaton_demo.sh`
の中に書かれたパスだけだった）。

## 中身

| パス | 内容 |
|---|---|
| `screenshots/` | ストア掲載用スクリーンショット。**6言語（en / ja / es / pt-BR / de / fr）・各16枚**。すべて 1080×1800px |
| `demo/unit-calculator-demo-en-silent.webm` | デモ動画（無音・英語字幕を焼き込み済み・**1分53秒**・1080×1800・25fps・VP8）。**アプリ名を UnitCalc に改名する前の録画で、タブバーが旧名「Unit Calculator」のまま。** 提出前に撮り直すこと（`node scripts/record-demo-video.mjs`。字幕の文言は `demo/demo-captions-en.srt` と `docs/shipaton-demo-script.md` を先に直す） |
| `demo/demo-captions-en.srt` | 同じ文言・同じ尺の字幕トラック。YouTubeに別途アップロードするとオン/オフ切替ができる |
| `demo/caption-style-reference.png` | 字幕の位置・書式の確認用フレーム（動画の 0:28 を抜いたもの） |
| `store/play-store-icon-512.png` | Playのストアアイコン（512×512・不透明） |
| `store/play-feature-graphic-<lang>-1024x500.png` | Playのフィーチャーグラフィック（1024×500・不透明）を**6言語ぶん**。要素は中央712px以内の安全域に収めてある。`scripts/generate-feature-graphic.mjs` で再生成する |

### スクリーンショットのカット一覧（6言語とも同じファイル名・同じ構成）

| ファイル | 中身 |
|---|---|
| `01-calc-basic` | `5cm + 1mm` → 単位チップで `5.1 cm` |
| `02-dimension-error` | `5m + 1kg` の次元不一致エラー |
| `03-speed` | `100km / 2h` → `13.888… m/s`（SI基準） |
| `03-compare-units` | 同じ式で単位比較表を展開した状態 |
| `04-number-base` | `1024 * 3` の結果を `DEC/BIN/OCT/HEX` の HEX（`0xC00`）で表示 |
| `05-library-grid` | 計算ノートのカテゴリグリッド（最上位9枚・194件）＋検索欄 |
| `06-notebook-list` | ノート一覧（開くカテゴリは言語ごとに違う。下の表を参照） |
| `07-notebooks-tab` | ノート詳細（KaTeXの数式カード・定数・手順ごとの結果） |
| `08-settings` | 設定（言語セクションを開き、対応6言語が見える状態） |
| `09-pro` | Pro画面（買い切り1本・特典4点） |
| `10-exact-fraction` | **厳密値表示**: `1/3` を分数（横棒つき）で表示 |
| `11-exact-pi` | **厳密値表示**: `2*pi*50` → `100π` |
| `12-exact-sqrt` | **厳密値表示**: `sqrt(8)` → `2√2` |
| `13-notebook-search` | 計算ノートの検索（検索語は言語ごとに違う。下の表を参照） |
| `14-exam-samples` | サンプルシートを開き、**その国の試験名になっているタブ**を選んだ状態 |
| `15-prefix-cancel` | `4.7kΩ × 2mA` → `9.4 V`（k と m が打ち消える） |

10〜13番は 2026-09-06 に追加したカット（PR #42 の厳密値表示と PR #48 のノート検索）。
14・15番は 2026-09-08 に追加（言語ごとのターゲットに合わせた掲載用）。

### 言語ごとに中身が変わるカット

**画像は翻訳ではない。** どのノート・どのサンプルを開くかを言語ごとに変えてあり、その根拠は
`docs/target-users-by-locale-2026-09.md` 第1節のターゲット設定。情報源は
`scripts/capture-submission-assets.mjs` の `NOTEBOOK_TARGETS` と `LABELS[].examCategory` / `searchQuery`。

| 言語 | 06・07 で開くノート | 14 のタブ | 13 の検索語 |
|---|---|---|---|
| en | Mechanics → Uniformly accelerated motion | Exam prep | solar |
| ja | 電気の基礎計算 → 電圧降下と必要な電線の太さ | 試験対策（電験・電工） | 太陽光 |
| de | Praktische Elektrotechnik → Spannungsfall und der nötige Leiterquerschnitt | Klausur & Prüfung | Spannung |
| es | Electricidad → Campo eléctrico y potencial de una carga puntual | Preparación (EBAU) | campo |
| pt-BR | Eletricidade → Campo elétrico e potencial de uma carga pontual | Preparação (ENEM) | tensão |
| fr | Mécanique → Mouvement uniformément accéléré | Révisions (physique-chimie) | masse volumique |

`05-library-grid` は操作が全言語同じでも、カテゴリカードの並びが `lib/locale-relevance.ts` で
言語ごとに変わるため違う絵になる（独語なら「Elektrizität & Energie」が先頭）。

### Playへ上げる順（言語ごとに8枚）

Play のスマートフォン用スクリーンショットは**最大8枚**で、**1枚目が一覧に出る**。
撮影した16枚から言語ごとに8枚を選び、その言語のターゲットに一番効くカットを先頭に置く。

| 言語 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| en | 01-calc-basic | 02-dimension-error | 10-exact-fraction | 03-compare-units | 14-exam-samples | 05-library-grid | 07-notebooks-tab | 04-number-base |
| ja | 15-prefix-cancel | 02-dimension-error | 14-exam-samples | 06-notebook-list | 07-notebooks-tab | 01-calc-basic | 10-exact-fraction | 05-library-grid |
| de | 15-prefix-cancel | 02-dimension-error | 14-exam-samples | 06-notebook-list | 07-notebooks-tab | 01-calc-basic | 05-library-grid | 10-exact-fraction |
| es | 02-dimension-error | 14-exam-samples | 01-calc-basic | 07-notebooks-tab | 15-prefix-cancel | 05-library-grid | 03-compare-units | 10-exact-fraction |
| pt-BR | 01-calc-basic | 02-dimension-error | 14-exam-samples | 07-notebooks-tab | 15-prefix-cancel | 05-library-grid | 03-compare-units | 10-exact-fraction |
| fr | 01-calc-basic | 02-dimension-error | 14-exam-samples | 07-notebooks-tab | 05-library-grid | 03-compare-units | 10-exact-fraction | 15-prefix-cancel |

考え方: **独語と日本語は「桁を落とす痛み」が言語化されている層**（Zehnerpotenzen / 電験・電工）なので
接頭語の打ち消しと次元エラーを先に出す。**西語は減点が採点基準に明文化されている**ので次元エラーが最初。
**英語・仏語・葡語は「何ができるアプリか」が先**で、基本の単位付き計算から入る。
どの言語でも `14-exam-samples` を上位に入れているのは、**その国の試験名がそのまま写っている1枚**だから。

### アプリ名について

**アプリ名は `UnitCalc` で、言語ごとに訳さない**（`app.config.ts` の `appName`・電卓タブ名・
フィーチャーグラフィックの見出し・Pro画面のヒーロー行・PDFのフッターまで全部同じ）。
Playのタイトルに付く副題だけが言語ごとに違う（`UnitCalc - 電験・電工の単位計算` など。
一覧は `docs/store-listing-copy.md`）。スクリーンショットのタブバーにこの名前が写るので、
**改名したら全言語ぶん撮り直しが必要**（今回撮り直し済み）。

## 撮影方法と、その限界

`docs/screenshot-capture-plan.md` はAndroid実機/エミュレータでの撮影を前提に書かれているが、
**これらはWeb版（`npx expo export --platform web` の出力）をChromiumで自動操作して撮影した**。

**この素材はあくまで暫定（provisional）であり、最終的にAndroid提出に使う素材ではない。**
Web版とAndroidはアイコンの実装が同じ（どちらも `components/ui/icon-symbol.tsx` の
MaterialIconsマッピングを通る）が、これはアイコン表示が同じであることの根拠にしかならず、
UI全体（レイアウト・フォントレンダリング・実際の価格表示など）がAndroid実機と同一である
ことの根拠にはならない。**提出前に、必ずAndroid実機での撮り直しが必要。** 以下の差異も
既に判明している:

- **Pro画面の価格表示**: Webではofferingを取得できないため購入ボタンが「Unlock Pro」の
  ままで、実際の価格が出ない。Android実機では価格入りになる
- **Web限定の注記**: 「This is a web preview…」と「Purchases are available in the iOS or
  Android store version.」の2つは、スクリーンショットでもデモ動画でも撮影時に要素ごと
  非表示にしてある。どちらも `isNativePurchaseAvailable` が false のときだけ出るもので、
  **Android実機では最初から表示されない**ため、消した方が実機に忠実になる
- **デモ動画もWeb版の録画**。Android実機の画面ではない

## 再生成の手順

どちらも `dist/` を先に作っておくこと。スクリプト側は `dist/` を作らない。

```sh
npx expo export --platform web
```

### スクリーンショット

```sh
node scripts/capture-submission-assets.mjs                  # 6言語 × 16枚 = 96枚（30分ほどかかる）
node scripts/capture-submission-assets.mjs --lang de,fr
node scripts/capture-submission-assets.mjs --lang ja --only 10-exact-fraction,13-notebook-search
node scripts/capture-submission-assets.mjs --headed         # 目視デバッグ
```

**言語を足したら `LABELS` と `NOTEBOOK_TARGETS` の両方に足すこと。** `LABELS` だけだと
`NOTEBOOK_TARGETS[lang]` が undefined になり、ノート系カット（06・07）が黙って
「カテゴリ名が見つからない」で落ちる。文言はアプリの COPY からそのまま写す（ここで訳し直さない）。

### フィーチャーグラフィック

```sh
node scripts/generate-feature-graphic.mjs                   # 6言語
node scripts/generate-feature-graphic.mjs --lang de
```

`assets/images/icon.png` を読み込んで 1024×500 の HTML を Chromium で撮るだけなので、
`dist/` は不要。**見出しは訳文ではなく言語ごとに書き分けてある**（独=Einheitenfehler と Klausur、
西=EBAU の採点基準の言い回し、葡=ENEM と NR-10、日=電験・電工、英=FE と City & Guilds、仏=各段階で単位を保つ）。
ノート件数は `NOTEBOOK_COUNT` の1箇所だけに置いてある。**掲載文（`docs/store-listing-copy.md`）の件数と
必ず突き合わせること**（旧素材は生成スクリプトが残っておらず、旧アイコンと「112 formula notebooks」のまま凍結していた）。

`dist/` を配信する簡易HTTPサーバ（拡張子なしのパスを `.html` へフォールバックさせる。
`/pro` のようなパスを直接開くと expo-router がURLと一致せず404画面になるため）を内蔵している。
Chromium は `/opt/pw-browsers/chromium`（`CHROMIUM_PATH` で上書き可）が**存在すれば**
`executablePath` で明示して使う（playwrightパッケージが期待するリビジョン番号と、この環境に
置かれているブラウザの番号が違うため）。**そのパスが無い環境ではPlaywrightの既定のブラウザに
フォールバックする**ので、素の開発機では先に `npx playwright install chromium` を実行するか、
`CHROMIUM_PATH` で自前のChromiumを指すこと。録画スクリプトも同じ規則。

### デモ動画

```sh
node scripts/record-demo-video.mjs              # webm と caption-style-reference.png を出力
node scripts/record-demo-video.mjs --keep-raw   # トリム前の生録画も残す
```

- 台本は `docs/shipaton-demo-script.md`、字幕の文言とタイムコードは
  `demo/demo-captions-en.srt` が唯一の情報源。**字幕はSRTからプログラムで読み込んで焼く**
  （手で打ち直すと台本とズレる）。
- 字幕は録画中のページDOMに固定オーバーレイとして差し込み、Node側のスケジューラが
  SRTのタイムコードちょうどで差し替えている。この環境の ffmpeg は Playwright 同梱の
  極小ビルド（`/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux`）しか無く、`drawtext` も
  `subtitles` も `overlay` も無効なので、**ffmpegで字幕を焼くことはできない**。
  ffmpegは「頭のセットアップ部分を切り落として尺をSRTに合わせる」再エンコードだけに使う。
- 2倍解像度は**ブラウザ起動時の `--force-device-scale-factor=2`** で与えている。
  context の `deviceScaleFactor` はスクリーンショットには効くが録画には効かず、
  540×900 の絵が 1080×1800 のキャンバスの左上に貼られただけの動画になる。

### 動かない旧スクリプト

`scripts/build_shipaton_demo.sh` と `scripts/build_submission_assets.py` は
**過去の環境（`/home/ubuntu/...`）のパスを直書きした遺物で、このリポジトリでは動かない。**
現行の生成手順は上の2本だけ。参考にする以上の用途で使わないこと。
