import React, { useEffect, useState, useRef, useContext } from "react";
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
import { useUserLocation } from "../../../contexts/UserLocationContext";
import { useHeritages } from "../../../contexts/HeritageContext";
import { useRoute } from "../../../contexts/RouteContext";
import { useNavigation } from "@react-navigation/native";
import { useVia } from "../../../contexts/ViaContext.js";
import { useBookmark } from "../../../contexts/BookmarkContext.js";
import { AuthContext } from "../../../contexts/AuthContext";
import { theme } from "../../../theme/colors";

export default function NearbyPanel() {
  const { heritages, getDistance, isLoading } = useHeritages();
  const { userLocation } = useUserLocation();
  const { setDestination, setRoutePoints } = useRoute();
  const { addStopover } = useVia();
  const { bookmarks, addBookmark, removeBookmark } = useBookmark();
  const { isLoggedIn } = useContext(AuthContext);
  const navigation = useNavigation();
  const [expandedIds, setExpandedIds] = useState([]);

  const toggleDescription = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const sortedHeritages = [...heritages].sort((a, b) => {
    if (!userLocation) return 0;
    const distanceA = getDistance(userLocation, {
      latitude: a.latitude,
      longitude: a.longitude,
    });
    const distanceB = getDistance(userLocation, {
      latitude: b.latitude,
      longitude: b.longitude,
    });
    return distanceA - distanceB;
  });

  return (
    <View style={styles.container}>
      <View style={{ padding: 10, marginVertical: 10 }}>
        {isLoading ? (
          <Text style={styles.loadingText}>유적지를 불러오는 중...</Text>
        ) : (
          <Text style={styles.nearbyText}>
            <Text>내 근처에 </Text>
            <Text style={styles.highlightedCount}>{heritages.length}</Text>
            <Text>개의 유적지가 있어요</Text>
          </Text>
        )}
      </View>
      <ScrollView>
        {sortedHeritages.map((heritage) => {
          const isExpanded = expandedIds.includes(heritage.id);
          const firstLine = heritage.description?.split("\n")[0] || "";

          const isBookmarked = bookmarks.some(
            (b) => b.id === heritage.id || b.heritageId === heritage.id
          );

          return (
            <View key={heritage.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.name}>{heritage.name}</Text>
                <Text style={styles.distance}>
                  {userLocation
                    ? `${Math.round(
                        getDistance(userLocation, {
                          latitude: heritage.latitude,
                          longitude: heritage.longitude,
                        })
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
                <View style={styles.leftButtons}>
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
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color="#444"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightButtons}>
                  <TouchableOpacity
                    style={styles.greenButton}
                    onPress={() => {
                      setRoutePoints((prev) => [
                        heritage,
                        ...prev.filter((p) => p.id !== heritage.id),
                      ]);
                      Toast.show({
                        type: "success",
                        text1: "출발지로 설정되었습니다",
                        position: "bottom",
                      });
                    }}
                  >
                    <Text style={styles.buttonText}>출발</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.greenButton}
                    onPress={() => {
                      setDestination(heritage);
                      Toast.show({
                        type: "success",
                        text1: "목적지로 설정되었습니다",
                        position: "bottom",
                      });
                    }}
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
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
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
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.gray,
  },
  nearbyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  highlightedCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.main_green,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
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
