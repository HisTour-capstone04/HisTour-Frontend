import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";

import Toast from "react-native-root-toast";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../../contexts/AuthContext";
import { useUserLocation } from "../../../contexts/UserLocationContext";
import { useRoute } from "../../../contexts/RouteContext";
import { useVia } from "../../../contexts/ViaContext";
import { theme } from "../../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { IP_ADDRESS } from "../../../config/apiKeys";
import { useBookmark } from "../../../contexts/BookmarkContext";

export default function MyPagePanel() {
  const navigation = useNavigation();
  const {
    username,
    isLoggedIn,
    logout,
    accessToken,
    recommendations,
    fetchRecommendations,
  } = useContext(AuthContext);
  const { userLocation } = useUserLocation();
  const { setDestination, setRoutePoints } = useRoute();
  const { addStopover } = useVia();
  const { bookmarks, addBookmark, removeBookmark } = useBookmark();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const [expandedAddresses, setExpandedAddresses] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [currentHeritageImages, setCurrentHeritageImages] = useState([]);

  useEffect(() => {
    if (isLoggedIn && userLocation) {
      if (recommendations.length === 0) {
        fetchRecommendations(userLocation);
      }
    }
  }, [isLoggedIn]);

  const toggleDescription = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleAddress = (id) => {
    setExpandedAddresses((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => {
            if (isLoggedIn) {
              setLogoutModalVisible(true);
            } else {
              navigation.navigate("Auth");
            }
          }}
        >
          <Text style={styles.loginText}>
            {isLoggedIn
              ? `${username}님, 좋은 여행 되세요!`
              : "로그인하세요  >"}
          </Text>
        </Pressable>

        <TouchableOpacity
          onPress={() => navigation.navigate("Config")}
          style={styles.iconButton}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.main_blue}
          />
        </TouchableOpacity>
      </View>

      {isLoggedIn && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.nearbyText}>
              <Text>
                {username}님 데이터 기반{"\n"}
              </Text>
              {recommendations.length > 0 ? (
                <>
                  <Text style={styles.highlightedCount}>
                    {recommendations.length}
                  </Text>
                  <Text>개의 유적지를 추천해드려요 ✨</Text>
                </>
              ) : (
                <Text>추천할 유적지를 찾아오는 중...</Text>
              )}
            </Text>
          </View>

          {recommendations.map((heritage, index) => {
            const isExpanded = expandedIds.includes(heritage.id);
            const maxLength = 100; // 최대 표시 글자 수
            const shouldShowMore =
              heritage.description && heritage.description.length > maxLength;

            return (
              <React.Fragment key={heritage.id}>
                <View style={styles.itemContainer}>
                  <Text style={styles.name}>{heritage.name}</Text>
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

                  <View style={styles.recommendReasonContainer}>
                    <Text style={styles.recommendReason}>
                      <Text style={{ color: theme.main_blue }}>
                        추천 이유{"\n"}
                      </Text>
                      {heritage.recommendReason}
                    </Text>
                  </View>

                  <Text style={[styles.description]}>
                    {isExpanded
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
                          {isExpanded ? "접기" : "더보기"}
                        </Text>
                      </>
                    )}
                  </Text>

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

                  <View style={styles.buttonRow}>
                    <View style={styles.leftButtons}>
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
                          const isBookmarked = bookmarks.some(
                            (b) =>
                              b.id === heritage.id ||
                              b.heritageId === heritage.id
                          );
                          isBookmarked
                            ? removeBookmark(heritage.id)
                            : addBookmark(heritage.id);
                        }}
                      >
                        <Ionicons
                          name={
                            bookmarks.some(
                              (b) =>
                                b.id === heritage.id ||
                                b.heritageId === heritage.id
                            )
                              ? "bookmark"
                              : "bookmark-outline"
                          }
                          size={24}
                          color={
                            bookmarks.some(
                              (b) =>
                                b.id === heritage.id ||
                                b.heritageId === heritage.id
                            )
                              ? theme.main_blue
                              : theme.black
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={async () => {
                          const added = await addStopover(heritage);
                          Toast.show({
                            type: added ? "success" : "info",
                            text1: added
                              ? "경유지에 추가되었습니다"
                              : "이미 경유지 목록에 있습니다",
                            position: "bottom",
                          });
                        }}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={24}
                          color={theme.black}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.rightButtons}>
                      <TouchableOpacity
                        style={styles.blueButton}
                        onPress={() => {
                          setRoutePoints((prev) => [
                            heritage,
                            ...prev.filter((p) => p.id !== heritage.id),
                          ]);
                          Toast.show({
                            type: "success",
                            text1: "출발지로 설정되었습니다",
                            position: "bottom",
                          });
                        }}
                      >
                        <Text style={styles.buttonText}>출발</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.blueButton}
                        onPress={() => {
                          setDestination(heritage);
                          Toast.show({
                            type: "success",
                            text1: "목적지로 설정되었습니다",
                            position: "bottom",
                          });
                        }}
                      >
                        <Text style={styles.buttonText}>도착</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => {
                          navigation.navigate("Chatbot", {
                            initialMessage: `${heritage.name}에 대해 간단히 알려줘`,
                          });
                        }}
                      >
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={25}
                          color="white"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {index < recommendations.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            );
          })}

          <Text></Text>
          <Text></Text>
        </ScrollView>
      )}

      {/* 로그아웃 모달 */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalBox}>
            <Text style={styles.logoutTitle}>로그아웃 하시겠어요?</Text>
            <Text style={styles.logoutMessage}>
              언제든지 다시 로그인하실 수 있어요.
            </Text>

            <View style={styles.logoutButtonRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.logoutCancelText}>다음에</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  logout();
                  setLogoutModalVisible(false);
                }}
              >
                <Text style={styles.logoutText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 이미지 모달 */}
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

            <View style={styles.imageContainer}>
              {currentHeritageImages.length > 1 && (
                <>
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

              <Image
                source={{
                  uri: currentHeritageImages[selectedImageIndex],
                }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>

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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  loginText: {
    fontSize: 16,
    color: "#333",
  },
  iconButton: {
    padding: 6,
  },
  header: {
    padding: 12,
  },
  nearbyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.black,
    lineHeight: 28,
  },
  highlightedCount: {
    color: theme.main_blue,
    fontSize: 20,
  },
  scrollView: {
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
  recommendReasonContainer: {
    backgroundColor: theme.bluegray,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  recommendReason: {
    lineHeight: 20,
    fontSize: 14,
    fontWeight: "600",
    color: theme.bodyblack,
    marginVertical: 5,
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
  imageScroll: {
    marginBottom: 20,
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
  addressButton: {
    padding: 4,
    marginLeft: 4,
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
  loginNotice: {
    fontSize: 16,
    color: theme.gray,
    textAlign: "center",
    marginTop: 40,
  },
  // 로그아웃 모달 스타일
  logoutModalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.main_blue,
    marginBottom: 10,
  },
  logoutMessage: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  logoutCancelBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: "#eee",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: "center",
  },
  logoutBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: theme.main_blue,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: "center",
  },
  logoutCancelText: {
    color: "#888",
    fontWeight: "500",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
