import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 내부 컨텍스트 및 유틸리티 import
import { TMAP_APP_KEY } from "../../../config/apiKeys";
import { theme } from "../../../theme/colors";
import { useRouteMode } from "../../../contexts/RouteModeContext.js";
import { useVia } from "../../../contexts/ViaContext.js";
import { useRoute } from "../../../contexts/RouteContext";

/**
 * 길찾기 패널 컴포넌트
 * 주요 기능
 * 1. 출발지 -> (경유지) -> 목적지까지의 경로 안내 (자동차, 대중교통, 도보)
 * 2. 장바구니 유적지 목록 관리
 */
export default function DirectionsPanel() {
  const {
    startPoint,
    destination,
    nowStopovers,
    routeData,
    setRouteData,
    routePoints,
    addVia,
  } = useRoute();

  const { stopovers, removeStopover } = useVia();
  const { routeMode, setRouteMode } = useRouteMode();

  // 대중교통 경로 선택 상태
  const [selectedIndex, setSelectedIndex] = useState(null); // 선택된 대중교통 경로 인덱스 (1~3번째)
  const [selectedItinerary, setSelectedItinerary] = useState(null); // 선택된 대중교통 경로 정보

  // 로딩 상태
  const [carLoading, setCarLoading] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [walkLoading, setWalkLoading] = useState(false);

  // 총 소요 시간
  const [carTotalTime, setCarTotalTime] = useState(null);
  const [walkTotalTime, setWalkTotalTime] = useState(null);

  // UI 확장 상태
  const [expandedIds, setExpandedIds] = useState([]); // 확장된 유적지 설명 ID 목록 배열
  const [expandedAddresses, setExpandedAddresses] = useState([]); // 확장된 유적지 주소 ID 목록 배열

  // 교통수단 모드 라벨 및 아이콘 매핑
  const modeLabels = {
    car: "자동차",
    transit: "대중교통",
    walk: "도보",
    via: "장바구니",
  };

  const modeIcons = {
    car: "car",
    transit: "bus",
    walk: "walk",
    via: "add",
  };

  // 경유지 좌표 문자열 생성 (API 요청용)
  const passListStr = nowStopovers
    .map((p) => `${p.longitude},${p.latitude}`)
    .join("_");

  // 소요시간 포맷팅 메서드 (분 -> 시간)
  const formatDuration = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    if (totalMinutes <= 0) return "1분 미만";
    return `${minutes}분`;
  };

  // 거리 포맷팅 메서드 (미터 -> km, m)
  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
    return `${Number(meters).toLocaleString()}m`;
  };

  // 자동차 총 소요 시간 계산 메서드
  const getCarTotalTime = () =>
    typeof routeData?.features?.[0]?.properties?.totalTime === "number"
      ? routeData.features[0].properties.totalTime
      : 0;

  // 자동차 총 거리 계산 메서드
  const getCarTotalDistance = () =>
    typeof routeData?.features?.[0]?.properties?.totalDistance === "number"
      ? routeData.features[0].properties.totalDistance
      : 0;

  // 도보 총 소요 시간 계산 메서드
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

  // 도보 총 거리 계산 메서드
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

  // 대중교통 경로 목록
  const itineraries = routeData?.metaData?.plan?.itineraries ?? [];

  // 대중교통 도보 소요 시간 계산 메서드
  const getWalkingTime = (legs) => {
    return legs
      .filter((leg) => leg.mode === "WALK")
      .reduce((acc, leg) => acc + leg.sectionTime, 0);
  };

  // 자동차 경로 API 요청 메서드
  const fetchCarRoute = async () => {
    if (!startPoint || !destination) return;

    setCarLoading(true);

    try {
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

      setRouteData(data);
    } catch (e) {
      console.error("자동차 경로 요청 실패:", e);
    } finally {
      setCarLoading(false);
    }
  };

  // 도보 경로 API 요청 메서드
  const fetchWalkRoute = async () => {
    if (!startPoint || !destination) return;

    setWalkLoading(true);

    try {
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

      setRouteData(data);
    } catch (e) {
      console.error("도보 경로 요청 실패:", e);
    } finally {
      setWalkLoading(false);
    }
  };

  // 대중교통 경로 API 요청 메서드
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

      setRouteData(data);
    } catch (e) {
      console.error("대중교통 경로 요청 실패:", e);
    } finally {
      setTransitLoading(false);
    }
  };

  // 교통수단 모드 변경 시 경로 요청
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

  // 경로 데이터 변경 시 총 소요 시간 업데이트
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

  // 목적지 변경 시 총 소요 시간 초기화
  useEffect(() => {
    if (!destination) {
      setCarTotalTime(null);
      setWalkTotalTime(null);
    }
  }, [destination]);

  const ref = useRef(null);

  // 유적지 설명 확장/축소 토글 메서드
  const toggleDescription = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // 유적지 주소 확장/축소 토글 메서드
  const toggleAddress = (id) => {
    setExpandedAddresses((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 교통수단 모드 제목 */}
      <Text style={styles.modeTitle}>{modeLabels[routeMode]}</Text>

      {/* 자동차 모드 요약 정보 */}
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

      {/* 도보 모드 요약 정보 */}
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

      {/* 교통수단 모드 선택 버튼들 */}
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
          <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
        ) : itineraries && itineraries.length > 0 ? (
          selectedIndex === null ? (
            // 대중교통 경로 목록
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
            // 대중교통 상세 경로 보기
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
            >
              {/* 뒤로가기 버튼 */}
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

              {/* 선택된 경로 요약 정보 */}
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

              {/* 경로 상세 정보 */}
              {selectedItinerary.legs?.map((leg, idx) => (
                <View key={idx}>
                  <View style={styles.transitLegInfo}>
                    <Text style={styles.routeDescription}>
                      {leg.mode} - {leg.start?.name ?? "?"} →{" "}
                      {leg.end?.name ?? "?"}
                    </Text>
                    <Text
                      style={[
                        styles.routeDescription,
                        { color: theme.bodyblack },
                      ]}
                    >
                      {(leg.distance / 1000).toFixed(1)}km,{" "}
                      {Math.round(leg.sectionTime / 60)}분
                    </Text>
                    {leg.route && (
                      <Text
                        style={[
                          styles.routeDescription,
                          { color: theme.bodyblack },
                        ]}
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
              <Text></Text>
              <Text></Text>
            </ScrollView>
          )
        ) : (
          <Text style={styles.routeInfo}>
            대중교통 경로 정보가 없습니다.
            {"\n"}
            Tip: 가까운 거리는 걸어가볼까요?
          </Text>
        )
      ) : // 도보 모드
      routeMode === "walk" ? (
        destination == null ? (
          <Text style={styles.emptyMessage}>
            가고 싶은 유적지를 검색해 보세요.
          </Text>
        ) : walkLoading ? (
          <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
        ) : routeData?.features ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
          >
            {/* 도보 경로 상세 정보 */}
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
            <Text></Text>
            <Text></Text>
          </ScrollView>
        ) : (
          <Text style={styles.routeInfo}>도보 경로 정보가 없습니다.</Text>
        ) // 자동차 모드
      ) : routeMode === "car" ? (
        destination == null ? (
          <Text style={styles.emptyMessage}>
            가고 싶은 유적지를 검색해 보세요.
          </Text>
        ) : carLoading ? (
          <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
        ) : routeData?.features ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
          >
            {/* 자동차 경로 상세 정보 */}
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
            <Text></Text>
            <Text></Text>
          </ScrollView>
        ) : (
          <Text style={styles.routeInfo}>자동차 경로 정보가 없습니다.</Text>
        ) // 장바구니 모드
      ) : routeMode === "via" ? (
        stopovers.length === 0 ? (
          <Text style={styles.emptyMessage}>
            장바구니에 담은 유적지가 없습니다.
          </Text>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30, marginTop: 10 }}
          >
            {/* 장바구니 유적지 목록 */}
            {stopovers.length > 0 && (
              <>
                {stopovers.map((heritage) => {
                  const isExpanded = expandedIds.includes(heritage.id);
                  const maxLength = 100;
                  const description =
                    heritage.description?.split("\n")[0] ||
                    heritage.location?.description?.split("\n")[0] ||
                    "";
                  const shouldShowMore = description.length > maxLength;
                  const address =
                    heritage.detailAddress || heritage.location?.detailAddress;

                  return (
                    <View key={heritage.id} style={styles.card}>
                      {/* 유적지 헤더 (이름 + 삭제 버튼) */}
                      <View style={styles.header}>
                        <Text style={styles.name}>
                          {heritage.name ||
                            heritage.location?.name ||
                            "이름 없음"}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeStopover(heritage.id)}
                        >
                          <Ionicons
                            name="close"
                            size={18}
                            color={theme.darkgray}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* 유적지 주소 (20자 이상일 경우 일부만 표시, 확장 가능) */}
                      <View style={styles.addressContainer}>
                        <Text style={styles.address}>
                          {address &&
                          address.length > 20 &&
                          !expandedAddresses.includes(heritage.id)
                            ? `${address.slice(0, 20)}...`
                            : address}
                        </Text>
                        {address && address.length > 20 && (
                          <TouchableOpacity
                            onPress={() => toggleAddress(heritage.id)}
                            style={styles.addressButton}
                          >
                            <Ionicons
                              name={
                                expandedAddresses.includes(heritage.id)
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={16}
                              color={theme.gray}
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* 유적지 설명 (100자 이상일 경우 일부만 표시, 확장 가능) */}
                      <Text style={styles.description}>
                        {isExpanded
                          ? description
                          : shouldShowMore
                          ? `${description.slice(0, maxLength)}...`
                          : description}
                        {shouldShowMore && (
                          <>
                            <Text> </Text>
                            <Text
                              onPress={() => toggleDescription(heritage.id)}
                              style={styles.moreButton}
                            >
                              {isExpanded ? "접기" : "더보기"}
                            </Text>
                          </>
                        )}
                      </Text>

                      {/* 경유지로 추가 버튼 */}
                      <TouchableOpacity
                        onPress={() => {
                          addVia(heritage);
                        }}
                        style={styles.stopoverAddButton}
                      >
                        <Text style={styles.stopoverAddText}>
                          경유지로 추가
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
            <Text></Text>
            <Text></Text>
          </ScrollView>
        )
      ) : null}
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.bluegray,
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
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: theme.darkgray,
    flex: 1,
    marginRight: 4,
  },

  addressButton: {
    padding: 5,
    alignSelf: "flex-start",
  },
  description: {
    fontSize: 13,
    color: theme.bodyblack,
    lineHeight: 20,
    marginBottom: 4,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    margin: 12,

    color: theme.black,
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
    fontSize: 16,
    color: theme.gray,
  },

  routeInfo: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center", // Android만 적용됨
    marginTop: 20, // iOS 대응용 수동 여백
    fontSize: 16,
    lineHeight: 26,
    color: theme.gray,
  },
  totalTime: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.black,
  },
  routeSummary: {
    fontSize: 13,
    color: theme.darkgray,
  },
  routeCard: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  backButton: {
    fontSize: 14,
    color: theme.main_blue,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginLeft: 14,
    marginTop: -4,
  },
  summaryTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.main_blue,
    marginRight: 8,
  },
  summaryDistance: {
    fontSize: 15,
    color: theme.darkgray,
  },
  stopoverAddButton: {
    alignSelf: "flex-end",
    backgroundColor: theme.main_blue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  stopoverAddText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  routeDescription: {
    fontSize: 15,
    color: theme.bodyblack,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dividerLight: {
    borderBottomColor: theme.divider,
    borderBottomWidth: 1,
    marginHorizontal: 0,
  },
  transitSummary: {
    backgroundColor: theme.bluegray,
    borderRadius: 8,
    marginTop: 10,
  },
  transitLegInfo: {
    paddingVertical: 5,
  },
  moreButton: {
    color: theme.darkgray,
    fontSize: 12,
  },
});
