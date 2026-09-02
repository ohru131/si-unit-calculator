import { useEffect, useState } from "react";

import { useThemeContext } from "@/lib/theme-provider";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * 生のReact Native `useColorScheme`（OSのprefers-color-schemeのみを見る）ではなく、必ず
 * ThemeProviderのcolorSchemeを使う。そうしないと、手動でライト/ダークを選んでも（あるいは
 * OS設定とAppearance.setColorSchemeの反映タイミングがずれても）useColors()経由の配色だけが
 * 古いスキームのまま取り残され、外枠の背景（NativeWindのCSS変数）だけがダークになる
 * ちぐはぐな表示（背景は暗いのにカードが白いまま）になる。
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { colorScheme } = useThemeContext();

  if (hasHydrated) {
    return colorScheme;
  }

  return "light";
}
