// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "function": "functions",
  "bookmark.fill": "bookmark",
  "plus.circle.fill": "add-circle",
  "questionmark.circle.fill": "help",
  "info.circle": "info",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "chevron.up": "expand-less",
  "clock.arrow.circlepath": "history",
  "trash": "delete",
  "delete.left": "backspace",
  "crown.fill": "workspace-premium",
  "square.and.arrow.up": "ios-share",
  "gearshape.fill": "settings",
  "doc.on.doc": "content-copy",
  "magnifyingglass": "search",
  "list.bullet": "list",
  "clock": "schedule",
  "pin.fill": "push-pin",
  "exclamationmark.triangle.fill": "warning",
  "book.fill": "auto-stories",
  "folder.fill": "folder",
  "folder.badge.plus": "create-new-folder",
  "chevron.left": "chevron-left",
  "pencil": "edit",
  "ellipsis": "more-horiz",
  // 設定画面の各項目の見出しアイコン。iOS側(icon-symbol.ios.tsx)はSF Symbol名をそのまま
  // SymbolViewに渡すため、iOS 14の時点から存在する枯れた名前だけを選んでいる（新しい名前を
  // 使うと古いOSでアイコンだけ空白になり、型チェックでは検出できない）。
  "globe": "language",
  "paintbrush.fill": "palette",
  "ruler.fill": "straighten",
  "cup.and.saucer.fill": "local-cafe",
  "wrench.and.screwdriver.fill": "build",
  "externaldrive.fill": "save",
  "arrow.counterclockwise": "refresh",
} satisfies IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
