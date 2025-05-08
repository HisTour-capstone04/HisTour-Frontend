import React, { useEffect, useRef, useState } from "react";
import { AppState, Alert, Linking } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

export default function MapWebView({ range }) {
  const webViewRef = useRef(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [fromSettings, setFromSettings] = useState(false);

  // range 실시간 반영 - range 변경되면 web에 메시지 보냄
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

  /*
    // 앱 상태 감지해서 설정 갔다오면 웹 뷰 새로고침
    useEffect(() => {
      const handleAppStateChange = (nextAppState) => {
        if (appState.match(/inactive|background/) && nextAppState === "active") {
          if (fromSettings && webViewRef.current) {
            webViewRef.current.reload();
            setFromSettings(false);
          }
        }
        setAppState(nextAppState);
      };

      const subscription = AppState.addEventListener(
        "change",
        handleAppStateChange
      );
      return () => subscription.remove();
    }, [appState, fromSettings]);
  */

  // 웹에서 보낸 메시지 처리
  const handleMessage = async (event) => {
    const message = JSON.parse(event.nativeEvent.data);

    // GPS 권한 요청 메시지
    if (message.type === "GPS_PERMISSIONS") {
      /*
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          Alert.alert("위치 꺼짐", "기기 설정에서 위치 서비스를 켜주세요", [
            {
              text: "설정으로 이동",
              onPress: () => {
                setFromSettings(true);
                Linking.openSettings();
              },
            },
            { text: "취소", style: "cancel" },
          ]);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("3");
          Alert.alert("권한 거부됨", "위치 권한이 필요합니다", [
            {
              text: "설정으로 이동",
              onPress: () => {
                setFromSettings(true);
                Linking.openSettings();
              },
            },
            { text: "취소", style: "cancel" },
          ]);
          return;
        }
        */

      // 웹으로 사용자 위치 & range 전달
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          webViewRef.current?.postMessage(
            JSON.stringify({ latitude, longitude, radius: range })
          );
        }
      );
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

          <!-- RN 웹 뷰로 열렸는지 확인하고, 맞으면 앱에 GPS 권한 요청 메시지 보냄 -->
          const isReactNativeWebView = !!window.ReactNativeWebView;
          if (isReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "GPS_PERMISSIONS" }));
          }


          window.map = null;
          window.userMarker = null;
          window.userCircle = null;


          <!-- 지도 초기화 & 업데이트 메서드 -->
          function updateMap(lat, lng, radius) {

            <!-- 사용자 위치 -->
            const userPos = new Tmapv2.LatLng(lat, lng);   


            <!-- 지도가 없으면 지도 새로 생성 -->
            if (!window.map) {
              window.map = new Tmapv2.Map("map_div", {
                center: userPos,
                width: "100%",
                height: "100%",
                zoom: 17
              });
            }

            <!-- 사용자 위치 마커 없으면 새로 생성, 이미 생성된 경우 마커 실시간 사용자 위치로 이동-->
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

            <!-- 사용자 반경 원 생성, 이미 생성된 경우 실시간 위치 업데이트 -->
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
              window.userCircle.setCenter(userPos);
              window.userCircle.setRadius(radius);
            }
            
          }

          <!-- RN으로부터 전달 받은 사용자 위치 & range를 지도에 반영 -->
          const handlePositionUpdate = (data) => {
            const { latitude, longitude, radius } = data;
            if (latitude && longitude && radius) {
              updateMap(latitude, longitude, radius);
            }
          };


          <!-- 웹에서 메세지 처리 for iOS -->
          window.addEventListener("message", (event) => {
            try {
              const data = JSON.parse(event.data);

              if (data.type === "UPDATE_RADIUS") {
                if (window.userCircle) {
                  window.userCircle.setRadius(data.radius);
                }
              } else {
                handlePositionUpdate(data);
              }
            } catch (e) {
              console.error("메시지 처리 오류:", e);
            }
          });

          <!-- 웹에서 메세지 처리 for Android -->
          document.addEventListener("message", (event) => {
            try {
              const data = JSON.parse(event.data);

              if (data.type === "UPDATE_RADIUS") {
                if (window.userCircle) {
                  window.userCircle.setRadius(data.radius);
                }
              } else {
                handlePositionUpdate(data);
              }
            } catch (e) {
              console.error("메시지 처리 오류:", e);
            }
          });

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
