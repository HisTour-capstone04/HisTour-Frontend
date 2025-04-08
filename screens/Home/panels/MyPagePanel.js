import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function NearbyPanel() {
  return (
    <View>
      <Text style={styles.text}>마이 페이지 (추후 구현)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: "#333",
  },
});
