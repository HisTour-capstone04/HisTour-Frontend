import React, { useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { useUserLocation } from "../contexts/UserLocationContext";

export default function MapWebView({ range }) {
  const webViewRef = useRef(null);
  const { userLocation } = useUserLocation();

  // 사용자 위치 업데이트
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

  // 사용자 반경 업데이트
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

  // RN에서 메시지 처리
  const handleMessage = async (event) => {
    const message = JSON.parse(event.nativeEvent.data);

    // 맨 처음 위치 처리
    if (message.type === "REQUEST_LOCATION") {
      console.log("초기 처리");
      if (
        webViewRef.current &&
        userLocation !== "Loading..." &&
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

          const isReactNativeWebView = !!window.ReactNativeWebView;
          if (isReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "REQUEST_LOCATION" }));
          }

          window.map = null;
          window.userMarker = null;
          window.userCircle = null;


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

            // 사용자 위치 마커 생성
            if (!window.userMarker) {
              window.userMarker = new Tmapv2.Marker({
                position: userPos,
                
                icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                iconSize: new window.Tmapv2.Size(70, 70),
                map: window.map,
              
              });
            } else {
              window.userMarker.setPosition(userPos);
            }

            // 사용자 반경 원 생성
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
              // Circle은 setPosition이 따로 없어서 이렇게...
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
