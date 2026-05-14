import { CardNoteRegular } from "@/components/card/note/regular";
import { getCardBasicStyle } from "@/constants/theme";
import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { UIInputText } from "@/components/ui/input/text";
import { useState } from "react";
import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getColor } from "@/constants/theme";
import { ConfirmActionDialog } from "@/components/dialog/confirm-action";
import { useAuthSession } from "@/hook/use-auth-session";
import { useSystemMessage } from "@/hook/use-system-message";
import {
  actionCreateLocalNote,
  actionListLocalNotesByPin,
  actionSoftDeleteLocalNote,
} from "@/lib/sqlite/model/note";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

const PADDING_BOTTOM = 32;

const useGradualAnimation = () => {
  const height = useSharedValue(PADDING_BOTTOM);

  useKeyboardHandler(
    {
      onMove: (event) => {
        "worklet";
        height.value = Math.max(event.height, PADDING_BOTTOM);
      },
    },
    [],
  );
  return { height };
};

export default function NotesScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuthSession();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { height } = useGradualAnimation();
  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
    };
  }, []);

  const { data: localNotes = [] } = useQuery({
    queryKey: ["local-notes", String(id), session?.user.id],
    queryFn: () => actionListLocalNotesByPin(String(id), session!.user.id),
    enabled: Boolean(id && session?.user.id),
  });

  const createNoteMutation = useMutation({
    mutationFn: actionCreateLocalNote,
    onSuccess: async () => {
      setNewNote("");
      await queryClient.invalidateQueries({
        queryKey: ["local-notes", String(id), session?.user.id],
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to save note";
      showMessage(message, "error");
    },
  });

  const softDeleteNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      actionSoftDeleteLocalNote(noteId, session!.user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["local-notes", String(id), session?.user.id],
      });
      setIsDeleteDialogOpen(false);
      setSelectedNoteId(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete note";
      showMessage(message, "error");
    },
  });

  const notes = localNotes.map((note) => ({
    id: note.id,
    text: note.text,
    createdAt: note.createdAt,
    createdBy: {
      id: note.userId,
      fullname: session?.user.user_metadata.username ?? "You",
    },
  }));

  const handleCreateNote = () => {
    if (!id || !session?.user.id) {
      showMessage("Unable to save note right now", "error");
      return;
    }

    createNoteMutation.mutate({
      pinId: String(id),
      userId: session.user.id,
      text: newNote,
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        renderItem={({ item, index }) => (
          <CardNoteRegular
            note={item}
            containerStyle={styles.note}
            variant={index % 2 === 0 ? "user" : "self"}
            onDeletePress={() => {
              setSelectedNoteId(item.id);
              setIsDeleteDialogOpen(true);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listStyle}
        ListEmptyComponent={<View style={styles.emptyState} />}
      />
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <UIInputText
            placeholder="Write a note..."
            value={newNote}
            onChange={setNewNote}
          />
        </View>
        <Pressable
          style={[
            styles.sendButton,
            (!newNote.trim() || createNoteMutation.isPending) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleCreateNote}
          disabled={!newNote.trim() || createNoteMutation.isPending}
        >
          <TitleRegular size="xs" weight="600" color={colors.white}>
            {createNoteMutation.isPending ? "Saving" : "Send"}
          </TitleRegular>
        </Pressable>
      </View>

      <Animated.View style={fakeView} />
      <ConfirmActionDialog
        visible={isDeleteDialogOpen}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmText="Delete"
        onDismiss={() => {
          setIsDeleteDialogOpen(false);
          setSelectedNoteId(null);
        }}
        onConfirm={() => {
          if (!selectedNoteId) {
            return;
          }

          softDeleteNoteMutation.mutate(selectedNoteId);
        }}
        isPending={softDeleteNoteMutation.isPending}
        confirmVariant="danger"
      />
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  listStyle: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  note: {
    ...getCardBasicStyle("sm"),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.sm,
    paddingHorizontal: gaps.md,
    paddingBottom: gaps.md,
  },
  inputContainer: {
    flex: 1,
  },
  sendButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: getColor(colors.waffle),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.md,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
  },
});
