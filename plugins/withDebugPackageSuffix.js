const path = require("path");
const fs = require("fs");
const { withAppBuildGradle, withDangerousMod } = require("@expo/config-plugins");

// デバッグビルドを applicationId + ".debug" の別アプリとして入れる。
// **端末に Play 版（Playの署名鍵）が入ったままローカルのデバッグビルドを試せるようにするため。**
// 署名が違うので同じ applicationId では上書きインストールできず、上書きするには
// Play 版をアンインストールするしかない＝クローズドテスト参加中の端末では
// 計算履歴・ノート・自作単位・購入状態のローカルデータを捨てることになる。
//
// **android/ は .gitignore 済みの生成物なので、build.gradle を直に書き換えても
// 次の prebuild で消える。** この設定を残すために config plugin にしてある。
//
// 引き換えに、デバッグ側では課金（RevenueCat）のテストができない。RevenueCat の
// Android アプリはパッケージ名に紐づくので、".debug" は別アプリとして扱われる。
// 購入まわりを実機で確かめるときは release ビルド（applicationId はそのまま）を使う。

const marker = "// si-calculator: debug builds install alongside the Play build";

module.exports = function withDebugPackageSuffix(config) {
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withDebugPackageSuffix requires a Groovy app/build.gradle");
    }
    if (config.modResults.contents.includes(marker)) {
      return config;
    }
    // prebuild が生成する debug ブロックは signingConfig の1行だけ。そこへ差し込む。
    const debugBlock = /(buildTypes\s*\{\s*\n\s*debug\s*\{\n)/;
    if (!debugBlock.test(config.modResults.contents)) {
      throw new Error("withDebugPackageSuffix could not find the debug buildType block");
    }
    config.modResults.contents = config.modResults.contents.replace(
      debugBlock,
      `$1            ${marker}\n            applicationIdSuffix ".debug"\n`,
    );
    return config;
  });

  // ホーム画面で見分けられるように、デバッグ側だけラベルを変える。
  // resValue ではなく debug ソースセットの strings.xml にするのは、main 側の
  // app_name と resValue が重複リソースとして衝突するため（ソースセットの
  // 上書きなら debug が main に優先する）。
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const label = `${config.name ?? "App"} dev`;
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "debug",
        "res",
        "values",
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "strings.xml"),
        `<resources>\n  <string name="app_name">${label}</string>\n</resources>\n`,
        "utf8",
      );
      return config;
    },
  ]);

  return config;
};
