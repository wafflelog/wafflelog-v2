import { ButtonFab } from "@/components/button/fab";
import { CardCompanionRegular } from "@/components/card/companion/regular";
import { UIText } from "@/components/ui/text";
import { gaps, getCardBasicStyle } from "@/constants/theme";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import { actionListPublicUsers } from "@/lib/supabase/actions";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check as CheckIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_COMPANIONS = 10;

export default function UserSearchScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const params = useLocalSearchParams<{
    tripId?: string;
    selectedUserIds?: string;
    tripTitle?: string;
  }>();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const [searchQuery, setSearchQuery] = useState("");

  const selectedUserIds = useMemo(() => {
    if (!params.selectedUserIds) {
      return [];
    }

    return params.selectedUserIds.split(",").filter(Boolean);
  }, [params.selectedUserIds]);

  const usersQuery = useQuery({
    queryKey: ["public-users", session?.user.id, searchQuery.trim().toLowerCase()],
    queryFn: () => actionListPublicUsers(searchQuery),
    enabled: Boolean(session?.user.id),
  });

  const availableUsers = useMemo(() => {
    const publicUsers = usersQuery.data ?? [];

    return publicUsers.filter((user) => {
      if (selectedUserIds.includes(user.id)) {
        return false;
      }

      if (user.id === session?.user.id) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      return true;
    });
  }, [searchQuery, selectedUserIds, session?.user.id, usersQuery.data]);

  const handleInviteUser = (user: { id: string; username: string }) => {
    if (selectedUserIds.length >= MAX_COMPANIONS) {
      showMessage(`You can invite up to ${MAX_COMPANIONS} companions`, "error");
      return;
    }

    router.replace({
      pathname: "/(stack)/trip/[id]/(drawer)/companions",
      params: {
        id: params.tripId ?? "",
        invitedUserId: user.id,
        invitedUserName: user.username,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Invite Companion</Text>
          {params.tripTitle ? (
            <Text style={styles.headerSubtitle}>{params.tripTitle}</Text>
          ) : null}
        </View>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a username..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.results}
        data={availableUsers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <UIText>
              {usersQuery.isPending ? "Loading users..." : "No users found"}
            </UIText>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => handleInviteUser(item)}
            activeOpacity={0.85}
          >
            <CardCompanionRegular
              companion={{
                id: item.id,
                fullname: item.username,
                state: "INVITED",
              }}
            />
          </TouchableOpacity>
        )}
      />

      <ButtonFab
        onPress={() => {
          showMessage(
            `Invite up to ${MAX_COMPANIONS} companions`,
            "info",
          );
        }}
        text="Max 10"
        icon={(color) => <CheckIcon size={20} color={color} />}
      />
      <SystemMessageModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: gaps.md,
    paddingVertical: gaps.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    gap: gaps.xxs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#777",
  },
  searchContainer: {
    paddingHorizontal: gaps.md,
    paddingBottom: gaps.sm,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.xs,
    backgroundColor: "white",
  },
  searchIcon: {
    marginRight: gaps.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  results: {
    gap: gaps.md,
    padding: gaps.md,
  },
  resultCard: {
    ...getCardBasicStyle("sm"),
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: gaps.xl,
  },
});
