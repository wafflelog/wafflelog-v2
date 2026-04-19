import { CardNoteRegular } from "@/components/card/note/regular";
import { getCardBasicStyle } from "@/constants/theme";
import { FlatList, Platform, StatusBar, StyleSheet, View } from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { UIInputText } from "@/components/ui/input/text";
import { useState } from "react";

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
  const [newNote, setNewNote] = useState("");
  const { height } = useGradualAnimation();
  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
    };
  }, []);

  const messages = Array.from({ length: 20 }, (_, index) => ({
    id: index.toString(),
    text: `Hello, how are you? ${index}`,
    createdAt: new Date().toISOString(),
    createdBy: {
      id: "1",
      fullname: "John Doe",
      email: "john.doe@example.com",
      avatar: "https://via.placeholder.com/150",
    },
  }));

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item, index }) => (
          <CardNoteRegular
            note={item}
            containerStyle={styles.note}
            variant={index % 2 === 0 ? "user" : "self"}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listStyle}
      />
      <UIInputText
        placeholder="Type a message..."
        value={newNote}
        onChange={setNewNote}
      />

      <Animated.View style={fakeView} />
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
  },
  note: {
    ...getCardBasicStyle("sm"),
  },
});
