// HeritageDetailPanel.js
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useRoute } from "../../contexts/RouteContext";
import { useVia } from "../../contexts/ViaContext";
import { useBookmark } from "../../contexts/BookmarkContext";
import { theme } from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../contexts/AuthContext";

export default function HeritageDetailPanel({ heritage, onClose, webViewRef }) {
  const { setDestination, setRoutePoints } = useRoute();
  const { addStopover } = useVia();
  const { bookmarks, addBookmark, removeBookmark } = useBookmark();
  const { isLoggedIn } = useContext(AuthContext);
  const navigation = useNavigation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!heritage) return null;

  useEffect(() => {
    if (!heritage || !webViewRef?.current) return;

    console.log(heritage.latitude);
    console.log(heritage.longitude);
    webViewRef.current.postMessage(
      JSON.stringify({
        type: "RECENTER_TO_COORD",
        payload: {
          latitude: heritage.latitude,
          longitude: heritage.longitude,
        },
      })
    );
  }, [heritage]);

  const firstLine = heritage.description?.split("\n")[0] || "";
  const isBookmarked = bookmarks.some(
    (b) => b.id === heritage.id || b.heritageId === heritage.id
  );

  const setAsStart = () => {
    setRoutePoints((prev) => [
      heritage,
      ...prev.filter((p) => p.id !== heritage.id),
    ]);
    Toast.show({
      type: "success",
      text1: "출발지로 설정되었습니다",
      position: "bottom",
    });
    onClose();
  };

  const setAsDestination = () => {
    setDestination(heritage);
    Toast.show({
      type: "success",
      text1: "목적지로 설정되었습니다",
      position: "bottom",
    });
    onClose();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.fixedClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.name}>{heritage.name}</Text>
        <Text style={styles.address}>{heritage.detailAddress}</Text>
        <Text style={styles.description}>
          {isExpanded ? heritage.description : firstLine}
        </Text>
        {heritage.description && (
          <TouchableOpacity
            onPress={() => setIsExpanded((prev) => !prev)}
            style={{ alignSelf: "center", marginBottom: 6 }}
          >
            <Ionicons
              name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={18}
              color="#666"
            />
          </TouchableOpacity>
        )}

        {heritage.imageUrls?.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            {heritage.imageUrls.map((url, idx) => (
              <Image key={idx} source={{ uri: url }} style={styles.image} />
            ))}
          </ScrollView>
        )}

        <View style={styles.buttonRow}>
          <View style={styles.leftButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={async () => {
                const added = await addStopover(heritage);
                Toast.show({
                  type: added ? "success" : "info",
                  text1: added
                    ? "경유지에 추가되었습니다"
                    : "이미 경유지 목록에 있습니다",
                  position: "bottom",
                });
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#444" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                if (!isLoggedIn) {
                  Toast.show({
                    type: "info",
                    text1: "로그인이 필요합니다",
                    position: "bottom",
                  });
                  navigation.navigate("Auth");
                  return;
                }
                isBookmarked
                  ? removeBookmark(heritage.id)
                  : addBookmark(heritage.id);
              }}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={24}
                color="#444"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rightButtons}>
            <TouchableOpacity style={styles.greenButton} onPress={setAsStart}>
              <Text style={styles.buttonText}>출발</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.greenButton}
              onPress={setAsDestination}
            >
              <Text style={styles.buttonText}>도착</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                navigation.navigate("Chatbot", {
                  initialMessage: `${heritage.name}에 대해 간단히 알려줘`,
                });
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 3,
    zIndex: 10,
  },
  fixedClose: {
    padding: 6,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  name: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 6,
  },
  address: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  imageScroll: {
    marginBottom: 10,
  },
  image: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  leftButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greenButton: {
    backgroundColor: theme.main_green,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chatButton: {
    backgroundColor: theme.main_green,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
  iconButton: {
    padding: 6,
  },
});
