# 変更履歴

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)、バージョン番号は [Semantic Versioning](https://semver.org/lang/ja/) に従う。
各PRは `## [Unreleased]` に1行足す。リリース時にその塊を `## [x.y.z] - YYYY-MM-DD` に改名し、同じコミットに `vx.y.z` の注釈付きタグを打つ。
Play の「このバージョンの新機能」はここから写す。

## [Unreleased]

### 変更
- 電卓の入力欄を色付きトークン列に統合し、キャレットをアプリ側で常時表示（OSキーボードが閉じていても見える）。入力欄の下にあった色付きガイド行は廃止。
- 結果カードの厳密値（分数・π・√）と科学表記の数字を、小数表示と同じ等幅・太字・大きさに揃えた。
- クイックスタートに「定数を定義（`W = 3cm`）」を追加。

### 削除
- 電卓画面右上の「?」ヘルプ。内容はサンプル・オンボーディング・クイックスタートと重複していた。

## [1.0.0] - 2026-09-14

Google Play クローズドテストに提出した最初のビルド（Shipaton 2026）。

[Unreleased]: https://github.com/ohru131/si-unit-calculator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ohru131/si-unit-calculator/releases/tag/v1.0.0
