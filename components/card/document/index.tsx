import { match } from "ts-pattern";

import { type Document } from "@/types/pin";
import { useRouter } from "expo-router";
import { StyleProp, ViewStyle } from "react-native";
import { CardDocumentRegular } from "./regular";
import { CardDocumentSquare } from "./square";

type CardDocumentProps = {
  document: Document;
  onPress?: () => void;
  variant?: "regular" | "square";
  containerStyle?: StyleProp<ViewStyle>;
};

export const CardDocument = ({
  containerStyle,
  document,
  variant = "regular",
  onPress,
}: CardDocumentProps) => {
  const router = useRouter();
  const onPressHandler = () => {
    router.push({
      pathname: "/web-viewer",
      params: { url: document.url, title: document.fileName },
    });
    onPress?.();
  };

  return match(variant)
    .with("regular", () => (
      <CardDocumentRegular
        containerStyle={containerStyle}
        document={document}
        onPress={onPressHandler}
      />
    ))
    .with("square", () => (
      <CardDocumentSquare
        containerStyle={containerStyle}
        document={document}
        onPress={onPressHandler}
      />
    ))
    .exhaustive();
};
