import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 외부 라이브러리 import
import DraggableFlatList from "react-native-draggable-flatlist";

// 내부 컴포넌트 및 유틸리티 import
import { theme } from "../../theme/colors";
import { useRoute } from "../../contexts/RouteContext";

/**
 * 검색바 컴포넌트
 *
 * 주요 기능:
 * 1. 일반 모드: 길찾기를 시작하지 않은 상태. SearchScreen으로 이동하는 가짜 입력창 버튼 표시
 * 2. 길찾기 모드: 출발지/경유지/목적지가 설정된 상태. 경로 포인트들을 드래그 가능한 리스트로 표시, 경로 포인트 순서 변경/삭제 가능
 *
 */
export default function SearchBar() {
  const navigation = useNavigation();
  const {
    routePoints,
    nowStopovers,
    clearRoute,
    reorderPoints,
    removePoint,
    startPoint,
    destination,
  } = useRoute();

  // 길찾기 종료 핸들러 메서드
  const handleExit = () => {
    Alert.alert("", "길찾기를 종료하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "확인", onPress: clearRoute },
    ]);
  };

  const isRouting = routePoints.length >= 1; // 길찾기 모드 여부 확인 (경로 포인트가 1개 이상이면 길찾기 중)
  const hasDestination = destination != null; // 목적지 설정 여부 확인

  // 목적지가 없을 경우 시각적 안내용 placeholder 추가
  const visualRoutePoints = hasDestination
    ? routePoints
    : [...routePoints, { id: "placeholder-destination" }];

  return (
    <View style={styles.header}>
      {/* 길찾기 모드: 경로 리스트 표시 */}
      {isRouting ? (
        <View style={[styles.fakeInputWrapper, styles.expandedWrapper]}>
          <View style={styles.destinationContainer}>
            <View style={styles.row}>
              {/* 길찾기 종료 버튼 */}
              <TouchableOpacity onPress={handleExit}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={theme.darkgray}
                  style={styles.icon}
                />
              </TouchableOpacity>

              {/* 드래그 가능한 경로 포인트 리스트 */}
              <View style={{ flex: 1 }}>
                <DraggableFlatList
                  data={visualRoutePoints}
                  scrollEnabled={false}
                  onDragEnd={({ data }) => {
                    // placeholder는 제외하고 실제 경로 포인트만 순서 저장
                    const cleaned = data.filter(
                      (item) => item.id !== "placeholder-destination"
                    );
                    reorderPoints(cleaned);
                  }}
                  keyExtractor={(item, index) =>
                    item.id?.toString() ?? index.toString()
                  }
                  renderItem={({ item, drag, isActive, index }) => {
                    const isPlaceholder = item.id === "placeholder-destination";

                    // 목적지 placeholder 항목 렌더링
                    if (isPlaceholder) {
                      return (
                        <View style={styles.routeItem}>
                          <Text style={styles.destinationText}>
                            목적지를 선택하세요
                          </Text>
                        </View>
                      );
                    }

                    // 실제 경로 포인트 렌더링
                    const isStart = item.id === startPoint?.id; // 출발지 여부
                    const isEnd = item.id === destination?.id; // 목적지 여부
                    const isStopover = nowStopovers.some(
                      (p) => p.id === item.id
                    ); // 경유지 여부

                    return (
                      <View
                        style={[
                          styles.routeItem,
                          isEnd && { borderBottomWidth: 0 }, // 목적지는 하단 구분선 제거
                        ]}
                      >
                        {/* 위치 이름 표시 */}
                        <Text style={styles.locationText}>
                          {item.id === "user"
                            ? "내 위치"
                            : item.name || item.location?.name || "알 수 없음"}
                        </Text>

                        {/* 경유지 삭제 버튼 (경유지에에만 표시) */}
                        {isStopover && (
                          <TouchableOpacity
                            onPress={() => {
                              const actualIndex = routePoints.findIndex(
                                (p) => p.id === item.id
                              );
                              if (actualIndex !== -1) removePoint(actualIndex);
                            }}
                            style={{ marginLeft: 10 }}
                          >
                            <Ionicons
                              name="remove-circle-outline"
                              size={20}
                              color={theme.darkgray}
                            />
                          </TouchableOpacity>
                        )}

                        {/* 드래그 핸들 (길게 누르면 드래그 가능) */}
                        <TouchableOpacity
                          onLongPress={drag}
                          disabled={isActive}
                          style={{ marginLeft: 10 }}
                        >
                          <MaterialCommunityIcons
                            name="drag"
                            size={22}
                            color={theme.darkgray}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* 일반 모드: 검색창 표시 (버튼 형태로 누르면 SearchScreen으로 이동) */
        <TouchableOpacity
          style={styles.fakeInputWrapper}
          onPress={() => navigation.navigate("Search")} // 검색 화면으로 이동
          activeOpacity={0.8}
        >
          {/* 검색 아이콘 */}
          <Ionicons
            name="search"
            size={18}
            color={theme.gray}
            style={styles.searchIcon}
          />
          {/* 가짜 입력창 */}
          <TextInput
            style={styles.fakeInput}
            placeholder="검색어를 입력하세요"
            placeholderTextColor={theme.gray}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  fakeInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-start", // 상단 정렬
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12, // 상하 여백 추가
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  fakeInput: {
    flex: 1,
    fontSize: 16,
    color: theme.gray,
  },
  destinationContainer: {
    flex: 1,
    minHeight: 50, // 최소 높이
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
    alignSelf: "center",
  },
  locationText: {
    fontSize: 16,
    color: theme.bodyblack,
    fontWeight: "500",
    flex: 1,
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.divider,
    marginVertical: 8,
    marginLeft: 5,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.bodyblack,
    marginTop: 2,
    marginLeft: 5,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
});
