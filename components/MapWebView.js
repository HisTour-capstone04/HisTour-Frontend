import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { useUserLocation } from "../contexts/UserLocationContext";
import { useHeritages } from "../contexts/HeritageContext";

export default function MapWebView({ range }) {
  const webViewRef = useRef(null);
  const { userLocation } = useUserLocation();
  const { heritages } = useHeritages();

  // 사용자 위치 변경 시 지도에 위치 업데이트
  useEffect(() => {
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
  }, [userLocation]);

  // range 변경 시 사용자 반경 원 업데이트
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "UPDATE_RADIUS",
          radius: range,
        })
      );
    }
  }, [range]);

  // 유적지 데이터가 context에서 갱신되면 RN -> WebView 메시지 전달
  useEffect(() => {
    if (heritages && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "NEARBY_HERITAGES",
          payload: heritages,
        })
      );
    }
  }, [heritages]);

  // WebView -> RN 메시지 처리
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
              
              // 기존 마커 지우기
              clearHeritageMarkers();
              
              // 동일한 좌표를 가진 유적지를 그룹핑해서 위치 같은 유적지들은 마커 하나만 나오게 하기
              // ex) ~~~ 외 n 곳

              // 좌표를 key로 그룹핑된 유적지를 담는 객체
              const groupedByPosition = {};
              
              // 유적지 배열 순회하면서 그룹핑
              heritages.forEach((heritage) => {
                const key = heritage.latitude + "," + heritage.longitude;
                if (!groupedByPosition[key]) {
                  groupedByPosition[key] = [];
                }
                groupedByPosition[key].push(heritage);
              });

              // 그룹핑된 좌표 기준으로 마커 생성
              Object.entries(groupedByPosition).forEach(([key, group]) => {
                const [lat, lng] = key.split(",").map(Number);
                const pos = new Tmapv2.LatLng(lat, lng);
                const firstName = group[0].name;
                const count = group.length;
                const label = (count === 1) ? firstName : firstName + " 외 " + (count - 1) + "곳";
                
                const marker = new Tmapv2.Marker({
                  position: pos,
                  animation: Tmapv2.MarkerOptions.ANIMATE_BOUNCE_ONCE,
                  label: label,
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


            // RN -> 웹 메세지 처리
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
