import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import ChatbotButton from "../../../components/ChatbotButton";

export default function DirectionsPanel() {
  return (
    <View>
      <Text style={styles.text}>목적지 (추후 구현)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: "#333",
  },
});
