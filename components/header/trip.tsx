import { colors, getColor } from "@/constants/theme";
import { formatDate } from "@/lib/helper/utils";
import { type Trip } from "@/types/trip";
import {
  HeaderBackButton,
  type HeaderBackButtonProps,
} from "@react-navigation/elements";
import {
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
} from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type HeaderTripProps = {
  trip?: Trip;
  onBackPress: () => void;
  onMorePress: () => void;
};

type HeaderTripTitleProps = {
  trip?: Pick<Trip, "title" | "startDate" | "endDate"> | null;
};

type HeaderTripButtonProps = {
  onPress: () => void;
} & HeaderBackButtonProps;

export const HeaderTrip = ({
  trip,
  onBackPress,
  onMorePress,
}: HeaderTripProps) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <ChevronLeftIcon size={24} color={getColor(colors.textDarkGrey)} />
      </TouchableOpacity>
      {trip && (
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{trip.title}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </Text>
        </View>
      )}
      <TouchableOpacity style={styles.moreButton} onPress={onMorePress}>
        <MenuIcon size={24} color={getColor(colors.textDarkGrey)} />
      </TouchableOpacity>
    </View>
  );
};

export const HeaderTripTitle = ({ trip }: HeaderTripTitleProps) => {
  if (!trip) {
    return null;
  }

  return (
    <View style={styles.nativeTitle}>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {trip.title}
      </Text>
      <Text style={styles.headerSubtitle} numberOfLines={1}>
        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
      </Text>
    </View>
  );
};

export const HeaderTripBackButton = ({
  onPress,
  ...props
}: HeaderTripButtonProps) => {
  return <HeaderBackButton {...props} onPress={onPress} />;
};

export const HeaderTripMenuButton = ({ onPress }: HeaderTripButtonProps) => {
  return (
    <TouchableOpacity
      style={styles.nativeButton}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <MenuIcon size={24} color={getColor(colors.textDarkGrey)} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  nativeTitle: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  nativeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
