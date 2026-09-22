import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

/**
 * OS のキーボードが今どれだけ画面を覆っているか（dp）。下から出るシートが自分でキーボードを
 * 避けるのに使う（lib/sheet-layout.ts の resolveSheetKeyboardLayout へ渡す）。
 *
 * `onFocus`/`onBlur` をキーボードの可視状態の代わりにしないこと——フォーカスがあっても
 * キーボードが出ていない場面（電卓の隠し TextInput・`showSoftInputOnFocus={false}` の値欄）が
 * このアプリには普通にある。
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => setKeyboardHeight(event.endCoordinates?.height ?? 0));
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  return keyboardHeight;
}
