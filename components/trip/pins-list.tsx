import { CardPin } from "@/components/card/pin";
import { type TripDay } from "@/types/trip";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import { UIText } from "../ui/text";

type TripPinsListProps = {
  tripDays: TripDay[];
  ref: React.RefObject<FlatList | null>;
  onSlideChanged: (index: number) => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const TripPinsList = ({
  tripDays,
  ref,
  onSlideChanged,
}: TripPinsListProps) => {
  return (
    <FlatList
      ref={ref}
      data={tripDays}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => `day-${item.date}`}
      getItemLayout={(data, index) => ({
        length: SCREEN_WIDTH,
        offset: SCREEN_WIDTH * index,
        index,
      })}
      onMomentumScrollEnd={(event) => {
        const index = Math.round(
          event.nativeEvent.contentOffset.x / SCREEN_WIDTH
        );
        if (index >= 0 && index < tripDays.length) {
          onSlideChanged(index);
        }
      }}
      onScrollToIndexFailed={(info) => {
        // Handle scroll to index failure
        const wait = new Promise((resolve) => setTimeout(resolve, 500));
        wait.then(() => {
          ref.current?.scrollToIndex({
            index: info.index,
            animated: true,
          });
        });
      }}
      renderItem={({ item: tripDay }: { item: TripDay }) => {
        return (
          <View style={styles.container}>
            {tripDay.pins.length > 0 ? (
              tripDay.pins.map((pin) => (
                <CardPin key={pin.id} pin={pin} variant="regular" />
              ))
            ) : (
              <UIText>No pins found</UIText>
            )}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    gap: 16,
  },
});
