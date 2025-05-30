import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserLocation } from "../../../contexts/UserLocationContext";
import { useRoute } from "../../../contexts/RouteContext";
import { useVia } from "../../../contexts/ViaContext";
import { useNavigation } from "@react-navigation/native";
import { useBookmark } from "../../../contexts/BookmarkContext";
import Toast from "react-native-toast-message";
import { useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";

export default function BookmarkPanel() {
  const { userLocation } = useUserLocation();
  const { setDestination } = useRoute();
  const { addStopover } = useVia();
  const navigation = useNavigation();
  const { isLoggedIn } = useContext(AuthContext);
  const { bookmarks, removeBookmark } = useBookmark();
  const [expandedIds, setExpandedIds] = useState([]);

  const toggleDescription = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.loginNotice}>로그인 후 이용할 수 있습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 10 }}>
        북마크한 유적지 수: {bookmarks.length}
      </Text>
      <ScrollView>
        {bookmarks.map((heritage) => {
          const isExpanded = expandedIds.includes(heritage.id);
          const firstLine = heritage.description?.split("\n")[0] || "";

          return (
            <View key={heritage.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.name}>{heritage.name}</Text>
                <Text style={styles.distance}>
                  {userLocation
                    ? `${Math.round(
                        Math.hypot(
                          heritage.latitude - userLocation.latitude,
                          heritage.longitude - userLocation.longitude
                        ) * 111000
                      )}m`
                    : "거리 계산 중..."}
                </Text>
              </View>
              <Text style={styles.address}>{heritage.detailAddress}</Text>
              <Text style={styles.description}>
                {isExpanded ? heritage.description : firstLine}
              </Text>
              {heritage.description && (
                <TouchableOpacity
                  onPress={() => toggleDescription(heritage.id)}
                  style={{ alignSelf: "center", marginBottom: 6 }}
                >
                  <Ionicons
                    name={
                      isExpanded ? "chevron-up-outline" : "chevron-down-outline"
                    }
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
                    <Image
                      key={idx}
                      source={{ uri: url }}
                      style={styles.image}
                    />
                  ))}
                </ScrollView>
              )}
              <View style={styles.buttonRow}>
                {/* 북마크 제거 */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => removeBookmark(heritage.id)}
                >
                  <Ionicons name="bookmark" size={24} color="#444" />
                </TouchableOpacity>

                {/* 목적지 설정 */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setDestination(heritage)}
                >
                  <Ionicons name="navigate-outline" size={24} color="#444" />
                </TouchableOpacity>

                {/* 경유지 추가 */}
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

                {/* 챗봇 연동 */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    navigation.navigate("Chatbot", {
                      initialMessage: `${heritage.name}에 대해 간단히 알려줘`,
                    })
                  }
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color="#444"
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loginNotice: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginTop: 40,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    flexShrink: 1,
  },
  distance: {
    fontSize: 14,
    color: "#666",
  },
  address: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
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
    justifyContent: "flex-end",
    gap: 12,
  },
  iconButton: {
    padding: 6,
  },
});
