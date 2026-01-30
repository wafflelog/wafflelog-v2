import { CardNoteRegular } from "@/components/card/note/regular";
import { TitleRegular } from "@/components/title/regular";
import { getCardBasicStyle } from "@/constants/theme";
import { useRouter } from "expo-router";
import {
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
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

export default function ChatScreen() {
  const { height } = useGradualAnimation();
  const router = useRouter();
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
      <TouchableOpacity onPress={() => router.push("/notes")}>
        <TitleRegular>Design</TitleRegular>
      </TouchableOpacity>
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
      <TextInput placeholder="Type a message..." style={styles.textInput} />

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
  textInput: {
    width: "95%",
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d8d8d8",
    backgroundColor: "#fff",
    padding: 8,
    alignSelf: "center",
    marginBottom: 8,
  },
  note: {
    ...getCardBasicStyle("sm"),
  },
});
