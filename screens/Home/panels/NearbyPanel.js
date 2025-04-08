import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function NearbyPanel() {
  return (
    <View>
      <Text style={styles.text}>주변 유적지 리스트 (추후 구현)</Text>
      {/* TODO: 유적지 목록 넣기 */}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: "#333",
  },
});
