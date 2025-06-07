import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useUserLocation } from "../../../contexts/UserLocationContext";
import { TMAP_APP_KEY, IP_ADDRESS } from "../../../config/apiKeys";
import { theme } from "../../../theme/colors";

import { useRouteMode } from "../../../contexts/RouteModeContext.js";
import { useVia } from "../../../contexts/ViaContext.js";
import { useRoute } from "../../../contexts/RouteContext";

export default function DirectionsPanel() {
  const {
    startPoint,
    destination,
    nowStopovers,
    routeData,
    setRouteData,
    routePoints,
    setRoutePoints,
    reorderPoints,
    removePoint,
    addVia,
  } = useRoute();

  const { stopovers, removeStopover } = useVia();
  const { routeMode, setRouteMode } = useRouteMode();

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedItinerary, setSelectedItinerary] = useState(null);

  const [carLoading, setCarLoading] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [walkLoading, setWalkLoading] = useState(false);

  const [carTotalTime, setCarTotalTime] = useState(null);
  const [walkTotalTime, setWalkTotalTime] = useState(null);

  const { userLocation } = useUserLocation();

  const modeLabels = {
    car: "자동차",
    transit: "대중교통",
    walk: "도보",
    via: "경유지",
  };

  const modeIcons = {
    car: "car",
    transit: "bus",
    walk: "walk",
    via: "add",
  };

  const passListStr = nowStopovers
    .map((p) => `${p.longitude},${p.latitude}`)
    .join("_");

  // 소요시간 포맷팅
  const formatDuration = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    if (totalMinutes <= 0) return "1분 미만";
    return `${minutes}분`;
  };

  // 거리 포맷팅
  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
    return `${Number(meters).toLocaleString()}m`;
  };

  // 자동차 총 소요 시간 & 거리 계산 메서드
  const getCarTotalTime = () =>
    typeof routeData?.features?.[0]?.properties?.totalTime === "number"
      ? routeData.features[0].properties.totalTime
      : 0;

  const getCarTotalDistance = () =>
    typeof routeData?.features?.[0]?.properties?.totalDistance === "number"
      ? routeData.features[0].properties.totalDistance
      : 0;

  // 도보 총 소요 시간 & 거리 계산 메서드
  const getWalkTotalTime = () =>
    routeData?.features?.reduce((acc, cur) => {
      if (
        cur.geometry?.type === "LineString" &&
        typeof cur.properties?.time === "number"
      ) {
        return acc + cur.properties.time;
      }
      return acc;
    }, 0) || 0;

  const getWalkTotalDistance = () =>
    routeData?.features?.reduce((acc, cur) => {
      if (
        cur.geometry?.type === "LineString" &&
        typeof cur.properties?.distance === "number"
      ) {
        return acc + cur.properties.distance;
      }
      return acc;
    }, 0) || 0;

  // 대중교통
  const itineraries = routeData?.metaData?.plan?.itineraries ?? [];

  // 대중교통 도보 소요 시간
  const getWalkingTime = (legs) => {
    return legs
      .filter((leg) => leg.mode === "WALK")
      .reduce((acc, leg) => acc + leg.sectionTime, 0);
  };

  const fetchCarRoute = async () => {
    if (!startPoint || !destination) return;

    setCarLoading(true);

    try {
      console.log(
        "자동차 : routePoints 순서 확인",
        routePoints.map((p) => p.name)
      );

      const formBody = new URLSearchParams({
        startX: String(startPoint.longitude),
        startY: String(startPoint.latitude),
        endX: String(destination.longitude),
        endY: String(destination.latitude),
        passList: passListStr,
        startName: "출발지",
        endName: "도착지",
        reqCoordType: "WGS84GEO",
        resCoordType: "WGS84GEO",
        searchOption: "0",
      }).toString();

      const response = await fetch("https://apis.openapi.sk.com/tmap/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          appKey: TMAP_APP_KEY,
        },
        body: formBody,
      });

      const data = await response.json();
      console.log("🚗 응답 요약:", {
        hasFeatures: !!data.features,
        error: data.error,
        totalFeatures: data.features?.length,
        firstFeature: data.features?.[0],
        featureTypes: data.features?.map((f) => ({
          type: f.geometry?.type,
          pointType: f.properties?.pointType,
          description: f.properties?.description,
        })),
      });
      setRouteData(data);
    } catch (e) {
      console.error("자동차 경로 요청 실패:", e);
    } finally {
      setCarLoading(false);
    }
  };

  const fetchWalkRoute = async () => {
    if (!startPoint || !destination) return;

    setWalkLoading(true);

    try {
      console.log(
        "도보: routePoints 순서 확인",
        routePoints.map((p) => p.name)
      );
      const formBody = new URLSearchParams({
        startX: String(startPoint.longitude),
        startY: String(startPoint.latitude),
        endX: String(destination.longitude),
        endY: String(destination.latitude),
        passList: passListStr,
        startName: "출발지",
        endName: "도착지",
        reqCoordType: "WGS84GEO",
        resCoordType: "WGS84GEO",
        searchOption: "0",
      }).toString();

      const response = await fetch(
        "https://apis.openapi.sk.com/tmap/routes/pedestrian",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            appKey: TMAP_APP_KEY,
          },
          body: formBody,
        }
      );

      const data = await response.json();
      console.log("🚶‍♂️ 도보 응답 요약:", {
        hasFeatures: !!data.features,
        error: data.error,
        totalFeatures: data.features?.length,
        firstFeature: data.features?.[0],
        featureTypes: data.features?.map((f) => ({
          type: f.geometry?.type,
          pointType: f.properties?.pointType,
          description: f.properties?.description,
        })),
      });
      setRouteData(data);
    } catch (e) {
      console.error("도보 경로 요청 실패:", e);
    } finally {
      setWalkLoading(false);
    }
  };

  const fetchTransitRoute = async () => {
    if (!startPoint || !destination) return;

    // 대중교통 api는 경유지 지원 x
    if (nowStopovers.length > 0) {
      setRouteData(null);
      return;
    }

    setTransitLoading(true);

    try {
      const requestBody = {
        startX: String(startPoint.longitude),
        startY: String(startPoint.latitude),
        endX: String(destination.longitude),
        endY: String(destination.latitude),
        count: 3, // 경로 3개 요청
        lang: 0,
        format: "json",
      };

      const response = await fetch(
        "https://apis.openapi.sk.com/transit/routes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            appKey: TMAP_APP_KEY,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      console.log(
        "대중교통 경로 응답:",
        data?.metaData?.plan?.itineraries?.length + "개의 경로"
      );
      setRouteData(data);
    } catch (e) {
      console.error("대중교통 경로 요청 실패:", e);
    } finally {
      setTransitLoading(false);
    }
  };

  useEffect(() => {
    if (routeMode === "car" && startPoint && destination) {
      fetchCarRoute();
    }
    if (routeMode === "transit" && startPoint && destination) {
      fetchTransitRoute();
    }
    if (routeMode === "walk" && startPoint && destination) {
      fetchWalkRoute();
    }
  }, [routeMode, routePoints]);

  useEffect(() => {
    if (routeMode === "car" && routeData?.features?.[0]) {
      setCarTotalTime(routeData.features[0].properties.totalTime);
      setWalkTotalTime(null); // 혹시 이전 값이 남아있을 수 있으니 초기화
    } else if (routeMode === "walk" && routeData?.features?.length > 0) {
      const total = routeData.features.reduce(
        (acc, cur) => acc + (cur.properties?.time || 0),
        0
      );
      setWalkTotalTime(total);
      setCarTotalTime(null);
    } else {
      setCarTotalTime(null);
      setWalkTotalTime(null);
    }
  }, [routeData, routeMode]);

  useEffect(() => {
    if (!destination) {
      setCarTotalTime(null);
      setWalkTotalTime(null);
    }
  }, [destination]);

  const ref = useRef(null);

  return (
    <View style={{ flex: 1 }}>
      {/* 모드 텍스트 */}
      <Text style={styles.modeTitle}>{modeLabels[routeMode]}</Text>
      {routeMode === "car" && destination && routeData && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTime}>
            {formatDuration(Math.round(getCarTotalTime() / 60))}
          </Text>
          <Text style={styles.summaryDistance}>
            {formatDistance(getCarTotalDistance())}
          </Text>
        </View>
      )}
      {routeMode === "walk" && destination && routeData && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTime}>
            {formatDuration(Math.round(getWalkTotalTime() / 60))}
          </Text>
          <Text style={styles.summaryDistance}>
            {formatDistance(getWalkTotalDistance())}
          </Text>
        </View>
      )}
      {/* 모드 선택 */}
      <View style={styles.modeRow}>
        {Object.keys(modeLabels).map((modeKey) => (
          <TouchableOpacity
            key={modeKey}
            onPress={() => {
              setRouteMode(modeKey);
              setSelectedIndex(null);
            }}
            style={[
              styles.iconButton,
              routeMode === modeKey && styles.selectedButton,
            ]}
          >
            <Ionicons
              name={modeIcons[modeKey]}
              size={24}
              color={routeMode === modeKey ? theme.main_blue : theme.gray}
            />
          </TouchableOpacity>
        ))}
      </View>
      {/* 구분선 */}
      <View style={styles.divider} />
      {/* 대중교통 모드 */}
      {routeMode === "transit" ? (
        destination == null ? (
          <Text style={styles.emptyMessage}>
            가고 싶은 유적지를 검색해 보세요.
          </Text>
        ) : nowStopovers.length > 0 ? (
          <Text style={styles.emptyMessage}>
            대중교통은 경유지를 지원하지 않습니다.
          </Text>
        ) : transitLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.main_blue}
            style={{ marginVertical: 20 }}
          />
        ) : itineraries && itineraries.length > 0 ? (
          selectedIndex === null ? (
            // 경로 목록
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
            >
              {itineraries.map((item, idx) => {
                const walkMin = Math.round(getWalkingTime(item.legs) / 60);
                const totalMin = Math.round(item.totalTime / 60);
                const fare = item.fare?.regular?.totalFare ?? 0;

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setSelectedIndex(idx);
                      setSelectedItinerary(item);
                      // 선택된 경로만 포함하는 새로운 routeData 생성
                      const selectedRouteData = {
                        ...routeData,
                        metaData: {
                          ...routeData.metaData,
                          plan: {
                            ...routeData.metaData.plan,
                            itineraries: [item],
                          },
                        },
                      };
                      // 선택된 경로만 지도에 표시하기 위해 routeData 업데이트
                      setRouteData(selectedRouteData);
                    }}
                    style={styles.routeCard}
                  >
                    <Text style={styles.totalTime}>{totalMin}분</Text>
                    <Text style={styles.routeSummary}>
                      도보 {walkMin}분 · {fare.toLocaleString()}원 예상
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            // 상세 경로 보기
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedIndex(null);
                  setSelectedItinerary(null);
                  fetchTransitRoute();
                  if (ref.current) {
                    ref.current.postMessage(
                      JSON.stringify({
                        type: "CLEAR_ROUTE",
                      })
                    );
                  }
                }}
              >
                <Text style={styles.backButton}>← 경로 목록으로</Text>
              </TouchableOpacity>

              <View style={styles.transitSummary}>
                <Text style={styles.routeDescription}>
                  총 소요시간: {(selectedItinerary.totalTime / 60).toFixed(0)}분
                </Text>
                <View style={styles.dividerLight} />
                <Text style={styles.routeDescription}>
                  총 거리: {(selectedItinerary.totalDistance / 1000).toFixed(1)}
                  km
                </Text>
                <View style={styles.dividerLight} />
                <Text style={styles.routeDescription}>
                  예상 요금: {selectedItinerary.fare?.regular?.totalFare ?? 0}원
                </Text>
              </View>

              <View style={[styles.divider, { marginVertical: 15 }]} />

              {selectedItinerary.legs?.map((leg, idx) => (
                <View key={idx}>
                  <View style={styles.transitLegInfo}>
                    <Text style={styles.routeDescription}>
                      {leg.mode} - {leg.start?.name ?? "?"} →{" "}
                      {leg.end?.name ?? "?"}
                    </Text>
                    <Text style={[styles.routeDescription, { color: "#666" }]}>
                      {(leg.distance / 1000).toFixed(1)}km,{" "}
                      {Math.round(leg.sectionTime / 60)}분
                    </Text>
                    {leg.route && (
                      <Text
                        style={[styles.routeDescription, { color: "#666" }]}
                      >
                        노선: {leg.route}
                      </Text>
                    )}
                  </View>
                  {idx < selectedItinerary.legs.length - 1 && (
                    <View style={styles.dividerLight} />
                  )}
                </View>
              ))}
            </ScrollView>
          )
        ) : (
          <Text style={styles.routeInfo}>경로 정보가 없습니다.</Text>
        )
      ) : // 도보
      routeMode === "walk" ? (
        destination == null ? (
          <Text style={styles.emptyMessage}>
            가고 싶은 유적지를 검색해 보세요.
          </Text>
        ) : walkLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.main_blue}
            style={{ marginVertical: 20 }}
          />
        ) : routeData?.features ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
          >
            {routeData.features
              .filter(
                (feature) =>
                  feature.properties?.description &&
                  (feature.geometry?.type !== "LineString" ||
                    feature.properties?.pointType)
              )
              .map((feature, idx, filteredFeatures) => (
                <View key={idx}>
                  <Text style={styles.routeDescription}>
                    {feature.properties.description}
                  </Text>
                  {idx < filteredFeatures.length - 1 && (
                    <View style={styles.dividerLight} />
                  )}
                </View>
              ))}
          </ScrollView>
        ) : (
          <Text style={styles.routeInfo}>도보 경로 정보가 없습니다.</Text>
        ) // 자동차
      ) : routeMode === "car" ? (
        destination == null ? (
          <Text style={styles.emptyMessage}>
            가고 싶은 유적지를 검색해 보세요.
          </Text>
        ) : carLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.main_blue}
            style={{ marginVertical: 20 }}
          />
        ) : routeData?.features ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
          >
            {routeData.features
              .filter(
                (feature) =>
                  feature.properties?.description &&
                  (feature.geometry?.type !== "LineString" ||
                    feature.properties?.pointType)
              )
              .map((feature, idx, filteredFeatures) => (
                <View key={idx}>
                  <Text style={styles.routeDescription}>
                    {feature.properties.description}
                  </Text>
                  {idx < filteredFeatures.length - 1 && (
                    <View style={styles.dividerLight} />
                  )}
                </View>
              ))}
          </ScrollView>
        ) : (
          <Text style={styles.routeInfo}>자동차 경로 정보가 없습니다.</Text>
        )
      ) : routeMode === "via" ? (
        stopovers.length === 0 ? (
          <Text style={styles.emptyMessage}>추가한 경유지가 없습니다.</Text>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* 기존 경유지 목록 */}
            {stopovers.length > 0 && (
              <>
                <Text style={styles.recommendTitle}>추가된 경유지</Text>
                {stopovers.map((heritage) => (
                  <View key={heritage.id} style={styles.card}>
                    <View style={styles.header}>
                      <Text style={styles.name}>
                        {heritage.name ||
                          heritage.location?.name ||
                          "이름 없음"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeStopover(heritage.id)}
                      >
                        <Ionicons name="close" size={18} color="#999" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.address}>
                      {heritage.detailAddress ||
                        heritage.location?.detailAddress}
                    </Text>
                    <Text style={styles.description}>
                      {heritage.description?.split("\n")[0] ||
                        heritage.location?.description?.split("\n")[0] ||
                        ""}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        addVia(heritage); // 진짜 경유지로 추가
                      }}
                      style={styles.stopoverAddButton}
                    >
                      <Text style={styles.stopoverAddText}>경유지로 추가</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  modeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 10,
  },
  iconButton: {
    padding: 10,
    borderRadius: 25,
  },
  selectedButton: {
    backgroundColor: theme.sub_blue,
  },
  divider: {
    borderBottomColor: theme.gray,
    borderBottomWidth: 1,
    marginBottom: 10,
    marginHorizontal: -20,
  },
  emptyMessage: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center", // Android만 적용됨
    marginTop: 20, // iOS 대응용 수동 여백
    fontSize: 15,
    color: theme.gray,
  },

  routeInfo: {
    fontSize: 16,
    textAlign: "left",
    paddingVertical: 5,
    color: "#333",
  },
  totalTime: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  routeSummary: {
    fontSize: 13,
    color: "#888",
  },
  routeCard: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    fontSize: 14,
    color: theme.main_blue,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 15,
  },
  summaryTime: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.main_blue,
    marginRight: 8,
  },
  summaryDistance: {
    fontSize: 13,
    color: "#999",
  },
  stopoverAddButton: {
    alignSelf: "flex-end",
    backgroundColor: theme.main_blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },

  stopoverAddText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.main_blue,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  routeDescription: {
    fontSize: 15,
    color: "#333",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dividerLight: {
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    marginHorizontal: 0,
  },
  transitSummary: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 10,
  },
  transitLegInfo: {
    paddingVertical: 5,
  },
});
