import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Comment {
  id: string;
  author: {
    name: string;
    initial: string;
  };
  text: string;
  timestamp: string;
  replies?: Comment[];
  isPinned?: boolean;
}

export default function CommentsScreen() {
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  // Dummy comments data
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: {
        name: "Mike",
        initial: "M",
      },
      text: "This trip looks amazing! Can't wait to explore Barcelona together.",
      timestamp: "2 hours ago",
      isPinned: true,
      replies: [
        {
          id: "1-1",
          author: {
            name: "Sarah",
            initial: "S",
          },
          text: "Me too! It's going to be great.",
          timestamp: "1 hour ago",
        },
      ],
    },
    {
      id: "2",
      author: {
        name: "Jessica",
        initial: "J",
      },
      text: "I've been to Sagrada Família before - it's absolutely stunning! Make sure to book tickets in advance.",
      timestamp: "5 hours ago",
    },
    {
      id: "3",
      author: {
        name: "David",
        initial: "D",
      },
      text: "Looking forward to trying the local tapas!",
      timestamp: "1 day ago",
    },
  ]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      author: {
        name: "Sarah",
        initial: "S",
      },
      text: newComment.trim(),
      timestamp: "Just now",
    };

    if (replyingTo) {
      // Add as reply
      setComments(
        comments.map((comment) => {
          if (comment.id === replyingTo.commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newCommentObj],
            };
          }
          return comment;
        })
      );
      setReplyingTo(null);
    } else {
      // Add as top-level comment
      setComments([newCommentObj, ...comments]);
    }

    setNewComment("");
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ commentId, authorName });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const togglePin = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isPinned: !comment.isPinned,
          };
        }
        return comment;
      })
    );
  };

  const getTotalCommentCount = () => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  // Sort comments: pinned first, then by timestamp
  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => router.back()}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Comments</Text>
            <Text style={styles.commentCount}>
              {getTotalCommentCount()} comments
            </Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Comments List */}
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
          >
            {sortedComments.map((comment) => (
              <View key={comment.id}>
                <View
                  style={[
                    styles.commentItem,
                    comment.isPinned && styles.pinnedCommentItem,
                  ]}
                >
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.author.initial}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentHeaderLeft}>
                        {comment.isPinned && (
                          <Ionicons
                            name="pin"
                            size={14}
                            color="#4A90E2"
                            style={styles.pinIcon}
                          />
                        )}
                        <Text style={styles.commentAuthor}>
                          {comment.author.name}
                        </Text>
                      </View>
                      <View style={styles.commentHeaderRight}>
                        <Text style={styles.commentTimestamp}>
                          {comment.timestamp}
                        </Text>
                        <TouchableOpacity
                          style={styles.pinButton}
                          onPress={() => togglePin(comment.id)}
                        >
                          <Ionicons
                            name={comment.isPinned ? "pin" : "pin-outline"}
                            size={16}
                            color={comment.isPinned ? "#4A90E2" : "#999"}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() =>
                        handleReply(comment.id, comment.author.name)
                      }
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={14}
                        color="#4A90E2"
                      />
                      <Text style={styles.replyButtonText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {comment.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        <View style={styles.replyAvatar}>
                          <Text style={styles.replyAvatarText}>
                            {reply.author.initial}
                          </Text>
                        </View>
                        <View style={styles.replyContent}>
                          <View style={styles.replyHeader}>
                            <Text style={styles.replyAuthor}>
                              {reply.author.name}
                            </Text>
                            <Text style={styles.replyTimestamp}>
                              {reply.timestamp}
                            </Text>
                          </View>
                          <Text style={styles.replyText}>{reply.text}</Text>
                          <TouchableOpacity
                            style={styles.replyButton}
                            onPress={() =>
                              handleReply(comment.id, reply.author.name)
                            }
                          >
                            <Ionicons
                              name="chatbubble-outline"
                              size={14}
                              color="#4A90E2"
                            />
                            <Text style={styles.replyButtonText}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Input Section */}
          <View style={styles.inputContainer}>
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <View style={styles.replyingToContent}>
                  <Ionicons name="arrow-back" size={14} color="#4A90E2" />
                  <Text style={styles.replyingToText}>
                    Replying to {replyingTo.authorName}
                  </Text>
                </View>
                <TouchableOpacity onPress={cancelReply}>
                  <Ionicons name="close" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.authorName}...`
                    : "Add a comment..."
                }
                placeholderTextColor="#999"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newComment.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newComment.trim() ? "#fff" : "#999"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
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
  closeButton: {
    padding: 4,
    width: 32,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  commentCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: 20,
    paddingBottom: 10,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  pinnedCommentItem: {
    backgroundColor: "#F0F7FF",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#4A90E2",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  commentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinIcon: {
    marginRight: 2,
  },
  pinButton: {
    padding: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  replyButtonText: {
    fontSize: 13,
    color: "#4A90E2",
    fontWeight: "500",
  },
  repliesContainer: {
    marginLeft: 52,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#E0E0E0",
  },
  replyItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  replyAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  replyTimestamp: {
    fontSize: 11,
    color: "#999",
  },
  replyText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  replyingToContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  replyingToContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replyingToText: {
    fontSize: 13,
    color: "#4A90E2",
    fontWeight: "500",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F5F7FA",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
});
