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
import { useUserLocation } from "../../../contexts/UserLocationContext";
import ChatbotButton from "../../../components/ChatbotButton";
import { useHeritages } from "../../../contexts/HeritageContext";

export default function NearbyPanel() {
  const { heritages, getDistance } = useHeritages();
  const { userLocation } = useUserLocation();

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 10 }}>
        발견된 유적지 수: {heritages.length}
      </Text>
      <ScrollView>
        {heritages.map((heritage) => (
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
            <Text style={styles.description}>{heritage.description}</Text>
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
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="bookmark-outline" size={24} color="#444" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
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
        ))}
      </ScrollView>
      <ChatbotButton />
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
    marginBottom: 8,
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
