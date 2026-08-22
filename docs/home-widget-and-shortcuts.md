# ホーム画面ウィジェットとOSショートカット

## 今回実装した内容

本アプリには、iOS／Androidのホーム画面でアプリアイコンを長押しした際に表示される4つの**Quick Actions**を追加した。速度、圧力、サンプル、単位検索を選ぶと、対応する電卓フローへディープリンクする。各ショートカットは、アプリ起動後に使用言語に合わせて英語または日本語で更新される。

| ショートカット | 起動内容 | ディープリンク |
|---|---|---|
| Speed calculator / 速度を計算 | `1km ÷ 1min` を設定し、`km/h` 表示を準備する | `/?quick=speed` |
| Pressure calculator / 圧力を計算 | `100N ÷ 0.01m²` を設定し、`kPa` 表示を準備する | `/?quick=pressure` |
| Try examples / サンプルを試す | 代表式のサンプル一覧へ誘導する | `/?quick=samples` |
| Search units / 単位を検索 | 単位検索入力欄へフォーカスする | `/?quick=search` |

Quick Actionsは、Expo Quick Actionsの対応プラットフォームで使用でき、同ライブラリはiOS・Androidとも最大4件を推奨している。[1] カスタムURLスキームでのディープリンクはExpo Goでは検証できないため、development buildまたはproduction buildで検証する。[2]

## ネイティブiOSホーム画面ウィジェット

本プロジェクトをExpo SDK 57へ更新し、公式`expo-widgets`で`UnitCalculatorWidget`を実装した。iOSの小・中サイズに対応し、最後に計算した式、表示単位での結果、SI標準単位での結果を表示する。計算が成功するたびにアプリからウィジェットのスナップショットを更新するため、ユーザーはホーム画面で直近の計算を確認できる。[3]

ウィジェットはApp Groupを通じてメインアプリとデータを共有する別の実行環境で動作する。そのため、Expo Goではなく、SDK 57を含む新しいiOS development buildまたはproduction buildが必要である。[3]

### 表示設計とライト／ダークモード

ウィジェットは`WidgetEnvironment`の`colorScheme`を参照し、システムのライト／ダークモードへ自動追従する。ライトモードでは明るい中性サーフェス、ネイビーの結果、青いアクセントを、ダークモードでは深い青灰色のサーフェス、明るい水色の結果、十分なコントラストを持つアクセントを用いる。小サイズではタイトル、最新の式、結果を優先し、中サイズではSI標準単位での値も表示する。数値は等幅表示と縮小・中間省略に対応し、長い式や結果でも情報階層を維持する。

## 実機テスト手順

1. EAS development buildをiOSまたはAndroid端末へインストールする。
2. アプリアイコンを長押しし、4つのQuick Actionsが表示されることを確認する。
3. 各アクションを選び、速度・圧力・サンプル・検索の期待する状態へ遷移することを確認する。
4. 電卓で式を計算し、ホーム画面へ戻って`Unit Calculator`ウィジェットが最新結果を表示することを確認する。
5. 小サイズではタイトル・式・結果が収まり、中サイズではSI標準単位での値も表示されることを確認する。
6. iOSの外観モードをライト／ダークで切り替え、背景、結果、補助テキストがいずれも読みやすいことを確認する。
7. アプリをバックグラウンドに置いた状態でもショートカット遷移を再確認する。

## References

[1]: https://github.com/EvanBacon/expo-quick-actions "expo-quick-actions — Home screen quick actions for Expo"

[2]: https://docs.expo.dev/linking/overview/ "Expo — Linking, deep links, Android App Links, and iOS Universal Links"

[3]: https://docs.expo.dev/versions/latest/sdk/widgets/ "Expo Widgets — iOS home screen widgets and Live Activities"
