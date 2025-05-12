import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { useUserLocation } from "../contexts/UserLocationContext";

export default function MapWebView({ range }) {
  const webViewRef = useRef(null);
  const { userLocation } = useUserLocation();

  const [lastFetchedLocation, setLastFetchedLocation] = useState(null);

  // 거리 계산 함수 (간단한 Haversine 공식)
  const getDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return Infinity;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const lat1 = toRad(loc1.latitude);
    const lat2 = toRad(loc2.latitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 유적지 fetch 후 WebView에 전송
  const fetchNearbyHeritages = async () => {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      // console.log("userLocation이 아직 준비되지 않음, fetch 중단");
      return;
    }

    try {
      // console.log("유적지 탐색");
      const response = await fetch(
        `http://ec2-43-203-173-84.ap-northeast-2.compute.amazonaws.com:8080/api/heritages/nearby?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&radius=${range}`
      );
      const result = await response.json();

      // console.log("찾은 유적지 수: " + result.data.count);
      /*console.log(
        "유적지 목록: " +
          JSON.stringify(result.data.heritages, [
            "name"
          ])
      );*/

      const heritages = result?.data?.heritages;
      if (heritages && webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: "NEARBY_HERITAGES",
            payload: heritages,
          })
        );
      }
    } catch (error) {
      console.error("유적지 가져오기 실패:", error);
    }
  };

  // 사용자 위치 변경되면 위치 업데이트 & 주변 유적지 요청
  useEffect(() => {
    // 사용자 위치가 아직 준비되지 않은 경우 탈출
    if (
      !userLocation ||
      !userLocation.latitude ||
      !userLocation.longitude ||
      !webViewRef.current
    ) {
      return;
    }

    if (
      webViewRef.current &&
      userLocation &&
      userLocation.latitude &&
      userLocation.longitude
    ) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "USER_LOCATION_UPDATE",
          payload: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: range,
          },
        })
      );

      /*console.log(
        "위치 변경됨: " + userLocation.latitude,
        userLocation.longitude
      );*/

      // 유적지 fetch
      if (
        !lastFetchedLocation ||
        getDistance(userLocation, lastFetchedLocation) > 50
      ) {
        fetchNearbyHeritages();
        setLastFetchedLocation(userLocation);
      }
    }
  }, [userLocation]);

  // range 변경 시 사용자 반경 원 업데이트
  useEffect(() => {
    if (
      !userLocation ||
      !userLocation.latitude ||
      !userLocation.longitude ||
      !webViewRef.current
    ) {
      return; // 안전하게 탈출
    }

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "UPDATE_RADIUS",
          radius: range,
        })
      );
      // console.log("range 변경됨: " + range);
      fetchNearbyHeritages();
    }
  }, [range]);

  // RN에서 메시지 처리
  const handleMessage = async (event) => {
    const message = JSON.parse(event.nativeEvent.data);

    // 지도 초기화 시 맨 처음 위치 처리
    if (message.type === "REQUEST_LOCATION") {
      if (
        webViewRef.current &&
        userLocation &&
        userLocation.latitude &&
        userLocation.longitude
      ) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: "USER_LOCATION_UPDATE",
            payload: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              radius: range,
            },
          })
        );
      }
    }
  };

  // 웹 뷰 html 코드
  const htmlContent = /*html*/ `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>HisTourMap</title> 
          <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=M2yCxkJIUu3iIcsWIeUjP6vyGY2D3Iz72I8bFtHV"></script>
          <style>
            html, body { margin: 0; padding: 0; height: 100%; }
            #map_div { width: 100%; height: 100%; }
          </style>
        </head>
        
        <body>
          <div id="map_div"></div>
          <script>

            // 지도 초기화 시 초기 위치 요구
            const isReactNativeWebView = !!window.ReactNativeWebView;
            if (isReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "REQUEST_LOCATION" }));
            }

            window.map = null;           // 지도
            window.userMarker = null;    // 사용자 위치 마커
            window.userCircle = null;    // 사용자 반경 원
            window.heritageMarkers = []; // 근처 유적지 마커 배열


            // 기존 유적지 마커 지우기
            function clearHeritageMarkers() {
              window.heritageMarkers.forEach((marker) => marker.setMap(null));
              window.heritageMarkers = [];
            }

            // 유적지 마커 렌더링
            function renderHeritageMarkers(heritages) {
              clearHeritageMarkers();
              
              // TODO: 좌표 기준으로 유적지를 그룹핑해서 좌표 똑같은 곳은 마커 하나만 나오게 하기, ~~~외 N곳 이렇게 나오게...
              const groupedByPosition = {};
              


              heritages.forEach((heritage) => {
                const pos = new Tmapv2.LatLng(heritage.latitude, heritage.longitude);
                const marker = new Tmapv2.Marker({
                  position: pos,
                  animation: Tmapv2.MarkerOptions.ANIMATE_BOUNCE_ONCE,
                  label: heritage.name,
                  labelSize: "30",
                  icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                  iconSize: new Tmapv2.Size(70, 70),
                  map: window.map,
                });
                window.heritageMarkers.push(marker);
              });
            }

            // 지도 초기화 & 업데이트 메서드
            function updateMap(lat, lng, radius) {

              // 사용자 위치
              const userPos = new Tmapv2.LatLng(lat, lng);   


              // 지도가 없으면 지도 새로 생성
              if (!window.map) {
                window.map = new Tmapv2.Map("map_div", {
                  center: userPos,
                  width: "100%",
                  height: "100%",
                  zoom: 17
                });
              }

              // 사용자 위치 마커 생성, 이미 있을 경우 위치만 업데이트
              if (!window.userMarker) {
                window.userMarker = new Tmapv2.Marker({
                  label: "me",
                  labelSize: "40",
                  position: userPos,
                  animation: Tmapv2.MarkerOptions.ANIMATE_BALLOON,
                  icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                  iconSize: new window.Tmapv2.Size(70, 70),
                  map: window.map,
                
                });
              } else {
                window.userMarker.setPosition(userPos);
              }

              // 사용자 반경 원 생성, 이미 있을 경우 위치만 업데이트
              if (!window.userCircle) {
                window.userCircle = new Tmapv2.Circle({
                  center: userPos,
                  radius: radius,
                  strokeWeight: 1,
                  strokeColor: "#3399ff",
                  fillColor: "#3399ff",
                  fillOpacity: 0.2,
                  map: window.map
                });
              } else {
                // Circle은 setPosition이 따로 없어서 이렇게 기존 꺼 지우고 새로 그려야함...
                window.userCircle.setMap(null);
                window.userCircle = new Tmapv2.Circle({
                  center: userPos,
                  radius: radius,
                  strokeWeight: 1,
                  strokeColor: "#3399ff",
                  fillColor: "#3399ff",
                  fillOpacity: 0.2,
                  map: window.map
                });
              }
              
            }

            // 사용자 위치 업뎃되면 지도도 업데이트
            const handlePositionUpdate = (data) => {
              const { latitude, longitude, radius } = data.payload;
              if (latitude && longitude && radius) {
                updateMap(latitude, longitude, radius);
              }
            };


            // 웹에서 메세지 처리
            window.addEventListener("message", (event) => {
              try {
                const data = JSON.parse(event.data);

                if (data.type === "USER_LOCATION_UPDATE") {
                  handlePositionUpdate(data);
                }

                if (data.type === "UPDATE_RADIUS") {
                  if (window.userCircle) {
                    window.userCircle.setRadius(data.radius);
                  }
                }

                if (data.type === "NEARBY_HERITAGES") {
                  renderHeritageMarkers(data.payload);
                }

              } catch (e) {
                console.error("메시지 처리 오류:", e);
              }
            } 
            );

          </script>
        </body>
        </html>
      `;

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      javaScriptEnabled={true}
      onMessage={handleMessage}
    />
  );
}
