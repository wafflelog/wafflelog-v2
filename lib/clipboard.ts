import * as Clipboard from "expo-clipboard";

export async function copyTextToClipboard(value: string) {
  await Clipboard.setStringAsync(value);
}
