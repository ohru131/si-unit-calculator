# Expo SDK 57 更新記録

## 更新結果

本プロジェクトはExpo SDK 54から、公式の段階アップデートにより**Expo SDK 57**へ更新した。SDK 57はReact Native 0.86.2を含み、SDK 56で問題となったHermes V1のメモリ回帰に対する修正を取り込んでいる。[1]

| 項目 | 更新後 |
|---|---|
| Expo | `~57.0.15` |
| React | `19.2.x` |
| React Native | `0.86.2` |
| Expo Router | `~57.0.15` |
| Expo Widgets | `~57.0.11` |
| UI対象 | iOSホーム画面ウィジェット、既存iOS／Android Quick Actions |

## 更新時の対応

Expoの公式ガイドに従い、SDK 54から55、56、57へ一段階ずつ依存関係を更新した。各段階で追加されたネイティブモジュールの設定プラグインを`app.config.ts`へ登録し、SDK 57では旧設定で不要になった`newArchEnabled`とAndroidの`edgeToEdgeEnabled`を削除した。[2]

`expo-widgets`を導入し、`UnitCalculatorWidget`を小・中サイズのiOSホーム画面ウィジェットとして登録した。これは直近の計算式と結果を表示し、計算成功時にスナップショットを更新する。[3]

## 検証

`pnpm check`、`pnpm test`、および`expo-doctor --verbose`を実行した。Expo Doctorは21項目すべてに合格し、型検査と20件の自動テストも成功した。実機上のウィジェット表示は、SDK 57を含む新しいiOS development buildまたはproduction buildで確認する必要がある。[3]

## References

[1]: https://expo.dev/changelog/sdk-57 "Expo SDK 57 release notes"

[2]: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/ "Expo SDK upgrade guide"

[3]: https://docs.expo.dev/versions/latest/sdk/widgets/ "Expo Widgets documentation"
