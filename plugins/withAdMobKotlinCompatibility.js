const { withProjectBuildGradle } = require("@expo/config-plugins");

const marker = "// si-calculator: pin Google Mobile Ads for Expo 57 Kotlin compatibility";
const resolutionBlock = `\n${marker}\nallprojects {\n  configurations.all {\n    resolutionStrategy {\n      force "com.google.android.gms:play-services-ads:25.0.0"\n    }\n  }\n}\n`;

module.exports = function withAdMobKotlinCompatibility(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withAdMobKotlinCompatibility requires a Groovy root build.gradle");
    }
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents += resolutionBlock;
    }
    return config;
  });
};
