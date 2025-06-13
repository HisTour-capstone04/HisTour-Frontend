import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  PanResponder,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 외부 라이브러리 import
import Toast from "react-native-toast-message";

// 내부 컨텍스트 및 유틸리티 import
import { useRoute } from "../../contexts/RouteContext";
import { useVia } from "../../contexts/ViaContext";
import { useBookmark } from "../../contexts/BookmarkContext";
import { theme } from "../../theme/colors";
import { AuthContext } from "../../contexts/AuthContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;

// 패널 위치 상수
const PANEL_POSITIONS = {
  TOP: SCREEN_HEIGHT * 0.2, // 20%
  MIDDLE: SCREEN_HEIGHT * 0.6, // 60%
  BOTTOM: SCREEN_HEIGHT * 0.82, // 82%
};

/**
 * 단일 유적지 상세 정보 컴포넌트 (패널 내부에서 사용)
 *
 * 주요 기능:
 * 1. 유적지 기본 정보 표시 (이름, 주소, 설명)
 * 2. 북마크 추가/제거 버튼, 장바구니 추가 버튼
 * 3. 경로 설정 (출발지/목적지) 버튼
 * 4. 챗봇 연동 버튼
 *
 */
const HeritageItem = ({ heritage, onClose }) => {
  const { setDestination, setRoutePoints } = useRoute();
  const { addStopover } = useVia();
  const { bookmarks, addBookmark, removeBookmark } = useBookmark();
  const { isLoggedIn } = useContext(AuthContext);
  const navigation = useNavigation();

  // UI 상태 관리
  const [expandedIds, setExpandedIds] = useState([]); // 확장된 유적지 설명 ID 목록 배열
  const [expandedAddresses, setExpandedAddresses] = useState([]); // 확장된 유적지 주소 ID 목록 배열
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // 선택된 이미지 인덱스
  const [currentHeritageImages, setCurrentHeritageImages] = useState([]); // 현재 유적지 이미지 목록 배열

  // 유적지 설명 확장/축소 토글 함수
  const toggleDescription = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // 유적지 주소 확장/축소 토글 함수
  const toggleAddress = (id) => {
    setExpandedAddresses((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // 유적지 설명 표시 관련 변수
  const maxLength = 100; // 최대 표시 글자 수
  const shouldShowMore =
    heritage.description && heritage.description.length > maxLength;

  // 북마크 여부 확인
  const isBookmarked = bookmarks.some(
    (b) => b.id === heritage.id || b.heritageId === heritage.id
  );

  // 해당 유적지를 출발지로 설정하는 함수
  const setAsStart = () => {
    setRoutePoints((prev) => [
      heritage,
      ...prev.filter((p) => p.id !== heritage.id),
    ]);
    Toast.show({
      type: "success",
      text1: "출발지로 설정되었습니다",
      position: "bottom",
    });
    onClose();
  };

  // 해당 유적지를 목적지로 설정하는 함수
  const setAsDestination = () => {
    setDestination(heritage);
    Toast.show({
      type: "success",
      text1: "목적지로 설정되었습니다",
      position: "bottom",
    });
    onClose();
  };

  return (
    <View style={styles.itemContainer}>
      {/* 유적지 이름 */}
      <Text style={styles.name}>{heritage.name}</Text>

      {/* 유적지 주소 (20자 이상일 경우 일부만 표시, 확장 가능) */}
      <View style={styles.locationContainer}>
        <Text style={styles.address}>
          {heritage.detailAddress.length > 20 &&
          !expandedAddresses.includes(heritage.id)
            ? `${heritage.detailAddress.slice(0, 20)}...`
            : heritage.detailAddress}
        </Text>
        {heritage.detailAddress.length > 20 && (
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
      <Text style={[styles.description]}>
        {expandedIds.includes(heritage.id)
          ? heritage.description
          : shouldShowMore
          ? `${heritage.description.slice(0, maxLength)}...`
          : heritage.description}
        {shouldShowMore && (
          <>
            <Text> </Text>
            <Text
              onPress={() => toggleDescription(heritage.id)}
              style={styles.moreButton}
            >
              {expandedIds.includes(heritage.id) ? "접기" : "더보기"}
            </Text>
          </>
        )}
      </Text>

      {/* 유적지 이미지 갤러리 */}
      {heritage.imageUrls?.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {heritage.imageUrls.map((url, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                setSelectedImageIndex(idx);
                setCurrentHeritageImages(heritage.imageUrls);
              }}
            >
              <Image source={{ uri: url }} style={styles.image} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 액션 버튼들 */}
      <View style={styles.buttonRow}>
        {/* 왼쪽 버튼들 (북마크, 장바구니) */}
        <View style={styles.leftButtons}>
          {/* 북마크 버튼 */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (!isLoggedIn) {
                Toast.show({
                  type: "info",
                  text1: "로그인이 필요합니다",
                  position: "bottom",
                });
                navigation.navigate("Auth");
                return;
              }
              isBookmarked
                ? removeBookmark(heritage.id)
                : addBookmark(heritage.id);
            }}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isBookmarked ? theme.main_blue : theme.black}
            />
          </TouchableOpacity>

          {/* 장바구니 추가 버튼 */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={async () => {
              const added = await addStopover(heritage);
              Toast.show({
                type: added ? "success" : "info",
                text1: added
                  ? "장바구니에 추가되었습니다"
                  : "이미 장바구니에 있습니다",
                position: "bottom",
              });
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.black} />
          </TouchableOpacity>
        </View>

        {/* 오른쪽 버튼들 (출발, 도착, 챗봇) */}
        <View style={styles.rightButtons}>
          {/* 출발지 설정 버튼 */}
          <TouchableOpacity style={styles.blueButton} onPress={setAsStart}>
            <Text style={styles.buttonText}>출발</Text>
          </TouchableOpacity>

          {/* 목적지 설정 버튼 */}
          <TouchableOpacity
            style={styles.blueButton}
            onPress={setAsDestination}
          >
            <Text style={styles.buttonText}>도착</Text>
          </TouchableOpacity>

          {/* 챗봇 버튼 */}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              navigation.navigate("Chatbot", {
                initialMessage: `${heritage.name}에 대해 간단히 알려줘`,
              });
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 이미지 모달 뷰어 */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent={true}
        onRequestClose={() => {
          setSelectedImageIndex(null);
          setCurrentHeritageImages([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSelectedImageIndex(null);
                setCurrentHeritageImages([]);
              }}
            >
              <View style={styles.closeButtonBackground}>
                <Ionicons name="close" size={24} color="white" />
              </View>
            </TouchableOpacity>

            {/* 이미지 컨테이너 */}
            <View style={styles.imageContainer}>
              {/* 이미지가 2개 이상일 때만 네비게이션 버튼 표시 */}
              {currentHeritageImages.length > 1 && (
                <>
                  {/* 이전 이미지 버튼 */}
                  <TouchableOpacity
                    style={[
                      styles.navigationButton,
                      styles.leftButton,
                      selectedImageIndex === 0 && styles.disabledButton,
                    ]}
                    onPress={() =>
                      selectedImageIndex > 0 &&
                      setSelectedImageIndex((prev) => prev - 1)
                    }
                    disabled={selectedImageIndex === 0}
                  >
                    <Ionicons name="chevron-back" size={30} color="white" />
                  </TouchableOpacity>

                  {/* 다음 이미지 버튼 */}
                  <TouchableOpacity
                    style={[
                      styles.navigationButton,
                      styles.rightButton,
                      selectedImageIndex === currentHeritageImages.length - 1 &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      selectedImageIndex < currentHeritageImages.length - 1 &&
                      setSelectedImageIndex((prev) => prev + 1)
                    }
                    disabled={
                      selectedImageIndex === currentHeritageImages.length - 1
                    }
                  >
                    <Ionicons name="chevron-forward" size={30} color="white" />
                  </TouchableOpacity>
                </>
              )}

              {/* 현재 이미지 */}
              <Image
                source={{
                  uri: currentHeritageImages[selectedImageIndex],
                }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>

            {/* 이미지 카운터 (이미지가 2개 이상일 때만 표시) */}
            {currentHeritageImages.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {`${selectedImageIndex + 1}/${currentHeritageImages.length}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

/**
 * 슬라이드 패널 컴포넌트
 *
 * HeritageDetailPanel 패널이 표시되는 경우:
 * 경우 1) 유적지 검색 결과 화면에서 특정 유적지를 클릭한 경우 (isFromMarkerClick = false)
 * 경우 2) 지도 화면에서 특정 유적지 마커를 클릭한 경우 (isFromMarkerClick = true)
 * 경우 3) 유적지 정보 푸시 알림을 클릭한 경우 (isFromNotification = true)
 *
 * 주요 기능:
 * 1. 드래그를 통한 패널 위치 조절 (TOP/MIDDLE/BOTTOM)
 * 2. 유적지 상세 정보 표시 (heritageItem 컴포넌트)
 * 3. 단일/다중 유적지 지원 (단일 유적지인 경우 유적지 정보 표시, 다중 유적지인 경우 유적지 목록 표시)
 * 4. 지도와 연동하여 해당 유적지 마커 표시 및 하이라이트 처리, 지도 중심 이동
 *
 */
export default function HeritageDetailPanel({
  heritage,
  onClose,
  webViewRef,
  isFromMarkerClick = false,
  panelAnim,
}) {
  const currentSlide = useRef(PANEL_POSITIONS.MIDDLE); // 패널 위치 값
  const dragStartPosition = useRef(PANEL_POSITIONS.MIDDLE); // 드래그 시작 위치 값

  // 패널 애니메이션 값 리스너
  panelAnim.addListener(({ value }) => {
    currentSlide.current = value;
  });

  // 드래그 제스처 핸들러 생성
  const panResponder = useRef(
    PanResponder.create({
      // 드래그 시작 조건 (수직 이동 10px 이상)
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },

      // 드래그 시작 시 현재 위치 저장
      onPanResponderGrant: () => {
        dragStartPosition.current = currentSlide.current;
      },

      // 드래그 중 실시간 위치 업데이트
      onPanResponderMove: (_, gestureState) => {
        const newValue = dragStartPosition.current + gestureState.dy;
        panelAnim.setValue(
          Math.min(
            Math.max(PANEL_POSITIONS.TOP, newValue),
            PANEL_POSITIONS.BOTTOM
          )
        );
      },

      // 드래그 종료 시 스냅 애니메이션
      onPanResponderRelease: (_, gestureState) => {
        const currentPosition = currentSlide.current;

        // 현재 위치가 어느 상태에 가장 가까운지 판단
        let currentState;
        if (
          currentPosition <=
          (PANEL_POSITIONS.TOP + PANEL_POSITIONS.MIDDLE) / 2
        ) {
          currentState = "TOP";
        } else if (
          currentPosition <=
          (PANEL_POSITIONS.MIDDLE + PANEL_POSITIONS.BOTTOM) / 2
        ) {
          currentState = "MIDDLE";
        } else {
          currentState = "BOTTOM";
        }

        let nextPosition;

        // 아래로 드래그 (dy > 50) - 패널을 아래로 이동
        if (gestureState.dy > 50) {
          switch (currentState) {
            case "TOP":
              nextPosition = PANEL_POSITIONS.MIDDLE;
              break;
            case "MIDDLE":
              nextPosition = PANEL_POSITIONS.BOTTOM;
              break;
            case "BOTTOM":
              nextPosition = PANEL_POSITIONS.BOTTOM;
              break;
          }
        }
        // 위로 드래그 (dy < -50) - 패널을 위로 이동
        else if (gestureState.dy < -50) {
          switch (currentState) {
            case "TOP":
              nextPosition = PANEL_POSITIONS.TOP;
              break;
            case "MIDDLE":
              nextPosition = PANEL_POSITIONS.TOP;
              break;
            case "BOTTOM":
              nextPosition = PANEL_POSITIONS.MIDDLE;
              break;
          }
        }
        // 작은 드래그는 가장 가까운 위치로 스냅
        else {
          const positions = [
            PANEL_POSITIONS.TOP,
            PANEL_POSITIONS.MIDDLE,
            PANEL_POSITIONS.BOTTOM,
          ];
          nextPosition = positions.reduce((prev, curr) =>
            Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition)
              ? curr
              : prev
          );
        }

        // 스프링 애니메이션으로 부드럽게 이동
        Animated.spring(panelAnim, {
          toValue: nextPosition,
          useNativeDriver: false,
          damping: 25,
          mass: 0.8,
        }).start();
      },
    })
  ).current;

  // 유적지 정보가 변경될 때 지도 연동 처리
  useEffect(() => {
    if (!heritage || !webViewRef?.current) return;

    // 유적지 정보 푸시 알림에서 경우 별도 지도 연동 없음 (경우 3)
    if (heritage.isFromNotification && heritage.heritages) {
      return;
    }

    // 검색 결과에서 온 경우 (경우 1)
    if (!isFromMarkerClick) {
      console.log("검색 화면에서 옴");

      // 지도 중심을 해당 유적지 위치로 이동
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "RECENTER_TO_COORD",
          payload: {
            latitude: heritage.latitude,
            longitude: heritage.longitude,
          },
        })
      );

      // 해당 유적지 마커 표시
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "SHOW_SINGLE_MARKER",
          payload: {
            id: heritage.id || heritage.heritages?.[0]?.id,
            name: heritage.name || heritage.heritages?.[0]?.name,
            latitude: heritage.latitude || heritage.heritages?.[0]?.latitude,
            longitude: heritage.longitude || heritage.heritages?.[0]?.longitude,
          },
        })
      );
    }

    // 마커 클릭에서 온 경우 (경우 2)
    else {
      console.log("화면 클릭에서 옴");

      // 해당 유적지 마커 하이라이트
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "HIGHLIGHT_HERITAGE_MARKER",
          payload: {
            id: heritage.id || heritage.heritages?.[0]?.id,
            latitude: heritage.latitude || heritage.heritages?.[0]?.latitude,
            longitude: heritage.longitude || heritage.heritages?.[0]?.longitude,
          },
        })
      );
    }
  }, [heritage, isFromMarkerClick]);

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      // 푸시 알림에서 온 경우 마커 정리 불필요 (경우 3)
      if (heritage.isFromNotification) {
        return;
      }

      if (webViewRef?.current && heritage) {
        // 검색 결과에서 온 경우 표시했던 마커 제거 (경우 1)
        if (!isFromMarkerClick) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: "HIDE_SINGLE_MARKER",
              payload: { id: heritage.id || heritage.heritages?.[0]?.id },
            })
          );
        }
        // 마커 클릭에서 온 경우 하이라이트 마커 제거 (경우 2)
        else {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: "REMOVE_HERITAGE_HIGHLIGHT",
              payload: {
                latitude:
                  heritage.latitude || heritage.heritages?.[0]?.latitude,
                longitude:
                  heritage.longitude || heritage.heritages?.[0]?.longitude,
              },
            })
          );
        }
      }
    };
  }, [heritage, isFromMarkerClick, webViewRef]);

  const heritages = heritage.heritages || [heritage]; // 단일 유적지인 경우와 여러 유적지인 경우를 구분

  if (!heritage) return null; // 유적지 정보가 없으면 렌더링 X

  return (
    <View style={styles.wrapper}>
      {/* 패널 헤더 */}
      <View style={styles.header}>
        {/* 드래그 가능 영역 */}
        <View style={styles.dragZone} {...panResponder.panHandlers} />

        {/* 드래그 핸들 */}
        <View style={styles.panelHandle} />

        {/* 닫기 버튼 */}
        <TouchableOpacity onPress={onClose} style={styles.fixedClose}>
          <Ionicons name="close" size={24} color={theme.black} />
        </TouchableOpacity>
      </View>

      {/* 유적지 목록 스크롤 */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {heritages.map((item, index) => (
          <React.Fragment key={item.id}>
            <HeritageItem heritage={item} onClose={onClose} />
            {index < heritages.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    height: SCREEN_HEIGHT * 0.8,
  },
  header: {
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 3,
    zIndex: 10,
  },
  fixedClose: {
    padding: 6,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
  },
  itemContainer: {
    paddingVertical: 15,
  },
  divider: {
    height: 1,
    backgroundColor: theme.divider,
    marginVertical: 10,
  },
  name: {
    color: theme.black,
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  address: {
    fontSize: 14,
    color: theme.darkgray,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: theme.bodyblack,
    lineHeight: 22,
    marginBottom: 20,
  },
  moreButton: {
    color: theme.gray,
  },
  image: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  leftButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  blueButton: {
    backgroundColor: theme.sub_blue,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chatButton: {
    backgroundColor: theme.main_blue,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: theme.main_blue,
    fontSize: 14,
    fontWeight: "bold",
  },
  iconButton: {
    padding: 6,
  },
  addressButton: {
    padding: 4,
    marginLeft: 4,
  },
  headerText: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 14,
    color: "#666",
  },
  dragZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  panelHandle: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  closeButtonBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    maxWidth: Dimensions.get("window").width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  navigationButton: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    padding: 10,
    zIndex: 1,
  },
  leftButton: {
    left: 10,
  },
  rightButton: {
    right: 10,
  },
  disabledButton: {
    opacity: 0.3,
  },
  imageCounter: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
