import React from "react";
import { View, Text, StyleSheet } from "react-native";

// 외부 라이브러리 import
import Slider from "@react-native-community/slider";

// 내부 유틸리티 import
import { theme } from "../../theme/colors";

/**
 * range 슬라이더 컴포넌트
 *
 * 주요 기능:
 * 1. 사용자 범위를 0m ~ 2km 사이에서 500m 단위로 스텝 조절 (0m, 500m, 1000m, 1500m, 2000m)
 * 2. 현재 선택된 범위를 시각적으로 표시
 *
 */
export default function RangeSlider({ range, setRange }) {
  return (
    <View style={styles.sliderContainer}>
      {/* 슬라이더 컴포넌트 */}
      <Slider
        style={{ flex: 1, height: 40 }}
        minimumValue={0} // 최소값: 0m
        maximumValue={2000} // 최댓값: 2km
        step={500} // 500m 단위로 조절 가능
        value={range}
        onValueChange={(value) => setRange(value)}
        minimumTrackTintColor={theme.main_blue}
        maximumTrackTintColor={theme.gray}
        thumbTintColor={theme.main_blue}
      />

      {/* 슬라이더 아래 텍스트로 최솟값과 최댓값 표시*/}
      <View style={styles.rangeLabelContainer}>
        <Text style={styles.rangeLabel}>0m</Text>
        <Text style={styles.rangeLabel}>2km</Text>
      </View>
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  sliderContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 15,
    paddingBottom: 5,
    marginTop: -5,
  },
  rangeLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // 0m와 2km를 양 끝에 배치
  },
  rangeLabel: {
    fontSize: 12,
    color: theme.black,
    marginTop: -2,
  },
});
