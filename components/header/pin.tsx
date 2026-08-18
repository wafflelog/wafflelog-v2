import { AppHeader } from "@/components/header/app-header";
import {
  HeaderBackButton,
  HeaderMenuButton,
} from "@/components/header/icon-button";
import { getPinHeaderTimeLabel, getPinTitle } from "@/lib/helper/pin";
import { type Pin } from "@/types/pin";

type HeaderPinProps = {
  onBackPress: () => void;
  onMenuPress: () => void;
  pin?:
    | (Pick<Pin, "name" | "startDate" | "endDate" | "time" | "endTime"> & {
        categoryId?: string;
        metadataJson?: {
          departure?: string;
          destination?: string;
        };
      })
    | null;
};

export const HeaderPin = ({
  onBackPress,
  onMenuPress,
  pin,
}: HeaderPinProps) => {
  return (
    <AppHeader
      title={pin ? getPinTitle(pin) : "Pin"}
      subtitle={pin ? getPinHeaderTimeLabel(pin) : null}
      leading={
        <HeaderBackButton onPress={onBackPress} />
      }
      trailing={
        <HeaderMenuButton
          accessibilityLabel="View pins for this day"
          onPress={onMenuPress}
        />
      }
    />
  );
};
