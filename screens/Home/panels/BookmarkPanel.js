import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "../../../contexts/RouteContext";
import { useVia } from "../../../contexts/ViaContext";
import { useNavigation } from "@react-navigation/native";
import { useBookmark } from "../../../contexts/BookmarkContext";
import Toast from "react-native-toast-message";
import { useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { theme } from "../../../theme/colors";

export default function BookmarkPanel() {
  const { setDestination, setRoutePoints } = useRoute();
  const { addStopover } = useVia();
  const navigation = useNavigation();
  const { isLoggedIn } = useContext(AuthContext);
  const { bookmarks, removeBookmark } = useBookmark();
  const [expandedIds, setExpandedIds] = useState([]);
  const [expandedAddresses, setExpandedAddresses] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [currentHeritageImages, setCurrentHeritageImages] = useState([]);

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

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.loginNotice}>로그인 후 이용 가능합니다</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Auth")}>
          <Text
            style={{
              fontSize: 16,
              textDecorationLine: "underline",
              color: theme.main_blue,
              textAlign: "center",
              marginTop: 20,
            }}
          >
            로그인
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loginNotice}>북마크한 유적지가 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { marginHorizontal: -20 }]}>
          <Text style={styles.titleText}>북마크 목록</Text>
        </View>
        {bookmarks.map((heritage, index) => {
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
                      onPress={() => removeBookmark(heritage.id)}
                    >
                      <Ionicons
                        name="bookmark"
                        size={24}
                        color={theme.main_blue}
                      />
                    </TouchableOpacity>

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
              {index < bookmarks.length - 1 && <View style={styles.divider} />}

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
                            <Ionicons
                              name="chevron-back"
                              size={30}
                              color="white"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.navigationButton,
                              styles.rightButton,
                              selectedImageIndex ===
                                currentHeritageImages.length - 1 &&
                                styles.disabledButton,
                            ]}
                            onPress={() =>
                              selectedImageIndex <
                                currentHeritageImages.length - 1 &&
                              setSelectedImageIndex((prev) => prev + 1)
                            }
                            disabled={
                              selectedImageIndex ===
                              currentHeritageImages.length - 1
                            }
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={30}
                              color="white"
                            />
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
                          {`${selectedImageIndex + 1}/${
                            currentHeritageImages.length
                          }`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Modal>
            </React.Fragment>
          );
        })}
      </ScrollView>
      <Text></Text>
      <Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    padding: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.black,
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
});
