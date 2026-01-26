import { match } from "ts-pattern";

import { type Document } from "@/types/pin";
import { StyleProp, ViewStyle } from "react-native";
import { CardDocumentRegular } from "./regular";
import { CardDocumentSquare } from "./square";

type CardDocumentProps = {
  document: Document;
  onPress: () => void;
  variant?: "regular" | "square";
  containerStyle?: StyleProp<ViewStyle>;
};

export const CardDocument = ({
  containerStyle,
  document,
  variant = "regular",
  onPress,
}: CardDocumentProps) => {
  return match(variant)
    .with("regular", () => (
      <CardDocumentRegular
        containerStyle={containerStyle}
        document={document}
        onPress={onPress}
      />
    ))
    .with("square", () => (
      <CardDocumentSquare
        containerStyle={containerStyle}
        document={document}
        onPress={onPress}
      />
    ))
    .exhaustive();
};
