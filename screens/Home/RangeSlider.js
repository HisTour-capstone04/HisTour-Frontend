// RangeSlider.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { theme } from "../../theme/colors";

export default function RangeSlider({ range, setRange }) {
  return (
    <View style={styles.sliderContainer}>
      <Slider
        style={{ flex: 1, height: 40 }}
        minimumValue={0}
        maximumValue={2000}
        step={500}
        value={range}
        onValueChange={(value) => setRange(value)}
        minimumTrackTintColor={theme.main_blue}
        maximumTrackTintColor={theme.gray}
        thumbTintColor={theme.main_blue}
      />

      {/* 슬라이더 아래 범위 표시 */}
      <View style={styles.rangeLabelContainer}>
        <Text style={styles.rangeLabel}>0m</Text>
        <Text style={styles.rangeLabel}>2km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 15,
    paddingBottom: 5,
    marginTop: -5,
  },
  rangeLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeLabel: {
    fontSize: 12,
    color: "#000", // 또는 "#333"
    marginTop: -2,
  },
});
