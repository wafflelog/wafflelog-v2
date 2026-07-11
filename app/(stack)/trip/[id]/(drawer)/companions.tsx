import { ButtonFab } from "@/components/button/fab";
import { CardCompanionRegular } from "@/components/card/companion/regular";
import { UIText } from "@/components/ui/text";
import { borderRadiuses, colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionGetLocalTrip } from "@/lib/sqlite/model/trip";
import { type Companion } from "@/types/trip";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Copy as CopyIcon,
  Link as LinkIcon,
  Plus as PlusIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MAX_COMPANIONS = 10;

const prototypeCompanions: Companion[] = [
  {
    id: "proto-amelia",
    fullname: "amelia_roams",
    state: "ACCEPTED",
  },
  {
    id: "proto-noah",
    fullname: "noah.food.maps",
    state: "INVITED",
  },
  {
    id: "proto-sam",
    fullname: "sam_weekends",
    state: "REJECTED",
  },
  {
    id: "proto-ivy",
    fullname: "ivy.in.transit",
    state: "DISABLED",
  },
];

export default function TripCompanionsScreen() {
  const { id, invitedUserId, invitedUserName } = useLocalSearchParams<{
    id?: string;
    invitedUserId?: string;
    invitedUserName?: string;
  }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [companions, setCompanions] = useState<Companion[]>(prototypeCompanions);

  const { data: localTrip } = useQuery({
    queryKey: ["local-trip", String(id), session?.user.id],
    queryFn: () => actionGetLocalTrip(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const trip = {
    id: String(id ?? "prototype-trip"),
    title: localTrip?.title ?? "Barcelona Getaway",
  };

  useEffect(() => {
    if (!invitedUserId || !invitedUserName) {
      return;
    }

    setCompanions((currentCompanions) => {
      if (currentCompanions.some((companion) => companion.id === invitedUserId)) {
        return currentCompanions;
      }

      return [
        {
          id: invitedUserId,
          fullname: invitedUserName,
          state: "INVITED",
        },
        ...currentCompanions,
      ];
    });
  }, [invitedUserId, invitedUserName]);

  const activeCompanionCount = useMemo(() => {
    return companions.filter((companion) =>
      ["ACCEPTED", "INVITED"].includes(companion.state),
    ).length;
  }, [companions]);

  const invitedUserIds = useMemo(() => {
    return companions
      .filter((companion) => companion.state === "INVITED")
      .map((companion) => companion.id)
      .join(",");
  }, [companions]);

  const inTripUserIds = useMemo(() => {
    return companions
      .filter((companion) => companion.state === "ACCEPTED")
      .map((companion) => companion.id)
      .join(",");
  }, [companions]);

  const handleCompanionAction = (companion: Companion) => {
    if (companion.state === "INVITED") {
      setCompanions((currentCompanions) =>
        currentCompanions.map((item) =>
          item.id === companion.id ? { ...item, state: "WITHDRAWN" } : item,
        ),
      );
      showMessage(`Withdrew invite for ${companion.fullname}`, "info");
      return;
    }

    if (companion.state === "ACCEPTED") {
      setCompanions((currentCompanions) =>
        currentCompanions.map((item) =>
          item.id === companion.id ? { ...item, state: "DISABLED" } : item,
        ),
      );
      showMessage(`Access disabled for ${companion.fullname}`, "info");
      return;
    }

    showMessage(`${companion.fullname} is kept as history`, "info");
  };

  if (!trip.id) {
    return <UIText>Trip not found</UIText>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.companions}
        data={companions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <View style={styles.summaryCard}>
              <Text style={styles.eyebrow}>Prototype companion access</Text>
              <Text style={styles.title}>{trip.title}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{activeCompanionCount}</Text>
                  <Text style={styles.statLabel}>active</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{MAX_COMPANIONS}</Text>
                  <Text style={styles.statLabel}>max</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>owner</Text>
                  <Text style={styles.statLabel}>admin</Text>
                </View>
              </View>
            </View>

            <View style={styles.inviteLinkCard}>
              <View style={styles.inviteLinkIcon}>
                <LinkIcon size={20} color={getColor(colors.purple)} />
              </View>
              <View style={styles.inviteLinkContent}>
                <Text style={styles.inviteLinkTitle}>Invite link</Text>
                <Text style={styles.inviteLinkText}>wafflelog.app/invite/barcelona-7d</Text>
              </View>
              <TouchableOpacity
                style={styles.smallAction}
                onPress={() => {
                  showMessage("Prototype invite link copied", "info");
                }}
              >
                <CopyIcon size={16} color={getColor(colors.white)} />
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View key={item.id} style={styles.companion}>
            <CardCompanionRegular
              companion={item}
              showStateBadge={item.state !== "ACCEPTED"}
              showRemoveButton={item.state === "INVITED" || item.state === "ACCEPTED"}
              onRemove={() => {
                handleCompanionAction(item);
              }}
            />
          </View>
        )}
      />
      <ButtonFab
        onPress={() => {
          if (activeCompanionCount >= MAX_COMPANIONS) {
            showMessage(`You can invite up to ${MAX_COMPANIONS} companions`, "error");
            return;
          }

          router.push({
            pathname: "/user-search",
            params: {
              tripId: trip.id,
              invitedUserIds,
              inTripUserIds,
              tripTitle: trip.title,
            },
          });
        }}
        text="Invite companion"
        icon={(color) => <PlusIcon size={20} color={color} />}
      />
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  companions: {
    gap: gaps.md,
    padding: gaps.md,
    paddingBottom: 96,
  },
  headerStack: {
    gap: gaps.md,
  },
  summaryCard: {
    ...getCardBasicStyle("md"),
    gap: gaps.sm,
  },
  eyebrow: {
    color: getColor(colors.purple),
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: getColor(colors.textDarkGrey),
    fontSize: 22,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: gaps.sm,
  },
  stat: {
    flex: 1,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.whiteGrey, 0.3),
    padding: gaps.sm,
  },
  statValue: {
    color: getColor(colors.textDarkGrey),
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    color: getColor(colors.textLightGrey),
    fontSize: 12,
    marginTop: 2,
  },
  inviteLinkCard: {
    ...getCardBasicStyle("sm"),
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  inviteLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
  },
  inviteLinkContent: {
    flex: 1,
  },
  inviteLinkTitle: {
    color: getColor(colors.textDarkGrey),
    fontSize: 14,
    fontWeight: "700",
  },
  inviteLinkText: {
    color: getColor(colors.textLightGrey),
    fontSize: 12,
    marginTop: 2,
  },
  smallAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple),
  },
  companion: {
    ...getCardBasicStyle("sm"),
    gap: gaps.xs,
  },
});
