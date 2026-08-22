# 単位付き電卓 Pro：Shipaton一般部門向け製品設計

## プロダクトの位置づけ

単位付き電卓は、異なる単位をSI標準単位へ正規化してから計算する、理工系学習者・現場作業者・メイカー向けのモバイル計算ツールである。単なる変換器ではなく、式、次元、定数、履歴を一つの作業空間にまとめることで、単位の混在による見落としを減らす。

Shipaton一般部門では、無料で計算の中心価値を体験でき、必要に応じてProへ進める設計にする。RevenueCatの`pro` entitlementを唯一の権限判定として使用し、App StoreとGoogle Playの同一商品グループをRevenueCatのdefault offeringへ紐づける。

## FreeとProの設計

| 領域 | Free | Pro |
|---|---|---|
| 単位計算・SI正規化 | すべて利用可 | すべて利用可 |
| 定数の作成・編集 | 利用可 | 利用可 |
| 履歴の表示 | 最新5件 | 最大500件 |
| 履歴のCSV出力 | Pro画面へ案内 | ネイティブShare Sheetで出力 |
| マイ単位セット | Pro画面へ案内 | よく使う単位を保存し、式へ即時入力 |
| 購入復元 | 利用可 | 利用可 |

基本計算を有料で遮断せず、反復作業や記録・再利用に価値を置く。これは学生・趣味利用の導入障壁を下げながら、実験・設計・現場で継続利用する人に明確なPro価値を提供する。

## RevenueCat構成

| RevenueCat項目 | 設定値 | 目的 |
|---|---|---|
| Entitlement | `pro` | Pro機能の解放判定 |
| Offering | `default` | 標準の購入画面に表示する商品群 |
| iOS商品 | 月額または年額の自動更新サブスクリプション | App Store向けPro購入 |
| Android商品 | iOSと同等の月額または年額商品 | Google Play向けPro購入 |
| Paywall | `default` offeringに接続 | RevenueCat UIから表示 |

価格はApp Store・Google Playの地域別価格と競合調査を踏まえ、RevenueCatダッシュボードで最終決定する。アプリコードには価格を固定しないため、Paywall Builderから安全に変更できる。

## ブラッシュアップ済みの購入体験

Proタブでは、Proの便益、購入画面、購入復元、ストア版でのみ実決済できる旨を明示する。電卓タブでは、無料版の履歴を5件に絞り、CSV操作をPro導線に接続する。Pro利用者にはマイ単位セットを追加表示し、保存済みの単位を式へ挿入できる。

## 実機テスト前の外部設定

1. App Store ConnectとGoogle Play Consoleへ初回バイナリを登録する。
2. 各ストアでPro商品を作成し、RevenueCatプロジェクトへ接続する。
3. `pro` entitlement、default offering、Paywallを公開する。
4. EAS development buildでSandbox購入・復元・Pro権限切替を実機検証する。
5. Shipaton審査用に無料トライアル、または審査員向けプロモコードを準備する。

> Expo Goは購入ネイティブモジュールを含まないため、UI確認はできても実決済テストにはEAS development buildが必要である。[1]

## References

[1]: https://www.revenuecat.com/docs/getting-started/installation/expo "RevenueCat Expo installation guide"
