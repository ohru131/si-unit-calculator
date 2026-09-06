# 提出素材（Shipaton 2026 / Google Play）

**このディレクトリは必ずコミットすること。** 前回の提出準備では素材をコンテナ内のローカル
ディレクトリにだけ置いてコミットしておらず、1024pxアイコン・スクリーンショット3種・
ナレーション付きデモ動画がすべて失われた（残っていたのは `scripts/build_shipaton_demo.sh`
の中に書かれたパスだけだった）。

## 中身

| パス | 内容 |
|---|---|
| `screenshots/` | ストア掲載用スクリーンショット。`en-*` と `ja-*` の2言語・各14枚。すべて 1080×1800px |
| `demo/unit-calculator-demo-en-silent.webm` | デモ動画（無音・英語字幕を焼き込み済み・**1分53秒**・1080×1800・25fps・VP8） |
| `demo/demo-captions-en.srt` | 同じ文言・同じ尺の字幕トラック。YouTubeに別途アップロードするとオン/オフ切替ができる |
| `demo/caption-style-reference.png` | 字幕の位置・書式の確認用フレーム（動画の 0:28 を抜いたもの） |
| `store/play-store-icon-512.png` | Playのストアアイコン（512×512・不透明） |
| `store/play-feature-graphic-1024x500.png` | Playのフィーチャーグラフィック（1024×500・不透明）。要素は中央712px以内の安全域に収めてある |

### スクリーンショットのカット一覧（`en-*` / `ja-*` で同じ構成）

| ファイル | 中身 |
|---|---|
| `01-calc-basic` | `5cm + 1mm` → 単位チップで `5.1 cm` |
| `02-dimension-error` | `5m + 1kg` の次元不一致エラー |
| `03-speed` | `100km / 2h` → `13.888… m/s`（SI基準） |
| `03-compare-units` | 同じ式で単位比較表を展開した状態 |
| `04-number-base` | `1024 * 3` の結果を `DEC/BIN/OCT/HEX` の HEX（`0xC00`）で表示 |
| `05-library-grid` | 計算ノートのカテゴリグリッド（最上位9枚・184件）＋検索欄 |
| `06-notebook-list` | 高校物理 → 力学 のノート一覧 |
| `07-notebooks-tab` | ノート詳細（KaTeXの数式カード・定数・手順ごとの結果） |
| `08-settings` | 設定（言語セクションを開き、対応6言語が見える状態） |
| `09-pro` | Pro画面（買い切り1本・特典4点） |
| `10-exact-fraction` | **厳密値表示**: `1/3` を分数（横棒つき）で表示 |
| `11-exact-pi` | **厳密値表示**: `2*pi*50` → `100π` |
| `12-exact-sqrt` | **厳密値表示**: `sqrt(8)` → `2√2` |
| `13-notebook-search` | 計算ノートの検索（`solar` / `太陽光` で絞り込み） |

10〜13番は 2026-09-06 に追加したカット（PR #42 の厳密値表示と PR #48 のノート検索）。
掲載順を決めるときは、**厳密値表示（10〜12）が最大の訴求ポイント**なので上位に置くこと。

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
node scripts/capture-submission-assets.mjs                 # en/ja 全28枚
node scripts/capture-submission-assets.mjs --lang ja --only 10-exact-fraction,13-notebook-search
node scripts/capture-submission-assets.mjs --headed         # 目視デバッグ
```

`dist/` を配信する簡易HTTPサーバ（拡張子なしのパスを `.html` へフォールバックさせる。
`/pro` のようなパスを直接開くと expo-router がURLと一致せず404画面になるため）を内蔵している。
Chromium は `/opt/pw-browsers/chromium` を `executablePath` で明示して使う（playwright
パッケージが期待するリビジョン番号と、この環境に置かれているブラウザの番号が違うため）。

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
