import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { AuthContext } from "./AuthContext";
import Toast from "react-native-toast-message";
import { IP_ADDRESS } from "../config/apiKeys";

export const BookmarkContext = createContext();

export const BookmarkProvider = ({ children }) => {
  const { accessToken } = useContext(AuthContext); // 사용자 토큰
  const [bookmarks, setBookmarks] = useState([]); // 북마크 유적지 목록 배열
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // 북마크 목록 업데이트 메서드 (context 내부에서만 사용)
  const fetchBookmarks = async () => {
    console.log(accessToken);

    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      return;
    }

    try {
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/bookmarks",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("북마크 조회 response:", response.status);

      const json = await response.json();
      if (response.ok) {
        setBookmarks(json.data.heritages || []);
      } else {
        console.error("북마크 조회 실패:", json.responseMessage);
      }
    } catch (e) {
      console.error("북마크 조회 에러:", e);
    }
  };

  // 북마크 등록 메서드
  const addBookmark = async (heritageId) => {
    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      return;
    }

    try {
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/bookmarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ heritageId }),
        }
      );

      const json = await response.json();
      // 북마크 목록 갱신
      if (response.ok) {
        try {
          await fetchBookmarks();
        } catch (e) {
          console.warn("북마크 목록 갱신 실패:", e);
        }
        Toast.show({
          type: "success",
          text1: "북마크에 추가되었습니다",
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: json.responseMessage || "북마크 추가 실패",
          position: "bottom",
        });
      }
    } catch (e) {
      console.error("북마크 추가 에러:", e);
      Toast.show({ type: "error", text1: "네트워크 오류", position: "bottom" });
    }
  };

  // 북마크 삭제 메서드
  const removeBookmark = async (heritageId) => {
    const bookmark = bookmarks.find((b) => b.id && b.heritageId === heritageId);
    if (!bookmark) {
      console.warn("해당 heritageId를 가진 북마크가 존재하지 않음");
      return;
    }

    // 토큰 없으면 요청 중단
    if (!accessToken) {
      console.warn("context: 토큰 없음 → 요청 중단");
      return;
    }

    try {
      const response = await fetch(
        "http://" + IP_ADDRESS + ":8080/api/bookmarks",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ bookmarkId: bookmark.id }),
        }
      );

      const json = await response.json();
      if (response.ok) {
        try {
          await fetchBookmarks();
        } catch (e) {
          console.warn("북마크 목록 갱신 실패:", e);
        }
        Toast.show({
          type: "success",
          text1: "북마크에서 삭제되었습니다",
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: json.responseMessage || "삭제 실패",
          position: "bottom",
        });
      }
    } catch (e) {
      console.error("북마크 삭제 에러:", e);
      Toast.show({ type: "error", text1: "네트워크 오류", position: "bottom" });
    }
  };

  // 북마크 데이터가 변경될 때마다 지도에 반영
  useEffect(() => {
    if (mapRef.current && bookmarks.length > 0) {
      mapRef.current.postMessage(
        JSON.stringify({
          type: "SHOW_BOOKMARK_MARKERS",
          payload: bookmarks,
        })
      );
    }
  }, [bookmarks]);

  useEffect(() => {
    if (!accessToken) return; // 로그인 상태일 때만 북마크 업데이트
    fetchBookmarks();
  }, [accessToken]);

  const value = {
    bookmarks,
    loading,
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    mapRef, // mapRef를 context value에 추가
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmark = () => useContext(BookmarkContext);
