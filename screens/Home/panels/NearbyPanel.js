import React, { useEffect, useState, useRef } from "react";
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
import ChatbotButton from "../../../components/ChatbotButton";
import { useHeritages } from "../../../contexts/HeritageContext";
import { useRoute } from "../../../contexts/RouteContext";
import { useNavigation } from "@react-navigation/native";
import { useVia } from "../../../contexts/ViaContext.js";

export default function NearbyPanel() {
  const { heritages, getDistance, isLoading } = useHeritages();
  const { userLocation } = useUserLocation();
  const { setDestination } = useRoute();
  const { addStopover } = useVia();

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
      <Text style={{ marginBottom: 10 }}>
        발견된 유적지 수: {isLoading ? "로딩 중..." : heritages.length}
      </Text>
      <ScrollView>
        {sortedHeritages.map((heritage) => {
          const isExpanded = expandedIds.includes(heritage.id);
          const firstLine = heritage.description?.split("\n")[0] || "";

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
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="bookmark-outline" size={24} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    setDestination(heritage);
                  }}
                >
                  <Ionicons name="navigate-outline" size={24} color="#444" />
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
                  <Ionicons name="add-circle-outline" size={24} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
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
