import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function TmapScreen() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: "http://192.168.1.172:5500/index.html" }} // 로컬 IP 주소 + 포트
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
