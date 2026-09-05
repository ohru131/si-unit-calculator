# 提出素材（Shipaton 2026 / Google Play）

**このディレクトリは必ずコミットすること。** 前回の提出準備では素材をコンテナ内のローカル
ディレクトリにだけ置いてコミットしておらず、1024pxアイコン・スクリーンショット3種・
ナレーション付きデモ動画がすべて失われた（残っていたのは `scripts/build_shipaton_demo.sh`
の中に書かれたパスだけだった）。

## 中身

| パス | 内容 |
|---|---|
| `screenshots/` | ストア掲載用スクリーンショット。`en-*` と `ja-*` の2言語。1080×1800px |
| `demo/unit-calculator-demo-en-silent.webm` | デモ動画（無音・英語字幕を焼き込み済み・116秒） |
| `demo/demo-captions-en.srt` | 同じ文言・同じ尺の字幕トラック。YouTubeに別途アップロードするとオン/オフ切替ができる |
| `demo/caption-style-reference.png` | 字幕の位置・書式の確認用フレーム |
| `store/play-store-icon-512.png` | Playのストアアイコン（512×512・不透明） |
| `store/play-feature-graphic-1024x500.png` | Playのフィーチャーグラフィック（1024×500・不透明）。要素は中央712px以内の安全域に収めてある |

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
- **Web限定の注記**: 「購入はiOS/Androidのストア版で…」の赤い注記は、撮影時に要素ごと
  非表示にしてある。この注記は `isNativePurchaseAvailable` が false のときだけ出るもので、
  **Android実機では最初から表示されない**ため、消した方が実機に忠実になる
- **デモ動画もWeb版の録画**。Android実機の画面ではない

## 再生成の手順

`dist/` を作って（`npx expo export --platform web`）ローカル配信し、Chromiumで自動操作する。
拡張子なしのパスを `.html` へフォールバックさせる簡易サーバが必要（`/pro` のような
パスを直接開くと expo-router がURLと一致せず404画面になるため）。
