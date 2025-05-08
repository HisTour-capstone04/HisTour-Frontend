// RangeSlider.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { theme } from "../../theme/colors";

export default function RangeSlider({ range, setRange }) {
  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>
        {range >= 1000 ? `${range / 1000}km` : `${range}m`}
      </Text>
      <Slider
        style={{ flex: 1, height: 40 }}
        minimumValue={100}
        maximumValue={2000}
        step={500}
        value={range}
        onValueChange={(value) => setRange(value)}
        minimumTrackTintColor={theme.main_green}
        maximumTrackTintColor={theme.gray}
        thumbTintColor={theme.main_green}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  sliderLabel: {
    marginRight: 5,
    fontSize: 14,
    width: 50,
    color: "#333",
  },
});
