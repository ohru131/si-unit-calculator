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

## ネイティブホーム画面ウィジェットの現状と次の対応

Expoの公式`expo-widgets`は、iOSホーム画面ウィジェットとLive Activitiesを作成できるが、最初に公開された対応版はExpo SDK 55以降であり、現在の本プロジェクト（SDK 54）へ無理に導入すると依存関係の互換性を損なう可能性がある。[3] そのため、今回の安定版ではOS Quick Actionsをネイティブのホーム画面エントリーポイントとして実装し、実ウィジェットはSDKアップグレード時に追加する計画とした。

SDK 55以降への計画的アップグレード後は、`UnitCalculatorWidget`を小・中サイズで登録し、最後の計算結果、指定単位、速度・圧力ショートカットを表示する。ウィジェットはアプリと別のライフサイクルで動作するため、表示データをApp Groupで共有し、計算後にスナップショットを更新する。[3]

## 実機テスト手順

1. EAS development buildをiOSまたはAndroid端末へインストールする。
2. アプリアイコンを長押しし、4つのQuick Actionsが表示されることを確認する。
3. 各アクションを選び、速度・圧力・サンプル・検索の期待する状態へ遷移することを確認する。
4. アプリをバックグラウンドに置いた状態でもショートカット遷移を再確認する。

## References

[1]: https://github.com/EvanBacon/expo-quick-actions "expo-quick-actions — Home screen quick actions for Expo"

[2]: https://docs.expo.dev/linking/overview/ "Expo — Linking, deep links, Android App Links, and iOS Universal Links"

[3]: https://docs.expo.dev/versions/latest/sdk/widgets/ "Expo Widgets — iOS home screen widgets and Live Activities"
