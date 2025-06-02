import React, { useEffect, useRef, useState, forwardRef } from "react";
import { WebView } from "react-native-webview";
import { useUserLocation } from "../contexts/UserLocationContext";
import { useHeritages } from "../contexts/HeritageContext";
import { TMAP_APP_KEY } from "../config/apiKeys";
import { useRoute } from "../contexts/RouteContext";
import { useRouteMode } from "../contexts/RouteModeContext";

export default forwardRef(function MapWebView({ range, onMessage }, ref) {
  const { userLocation } = useUserLocation();
  const { heritages } = useHeritages();
  const { routeData, routePoints } = useRoute();
  const { routeMode } = useRouteMode();

  // 길찾기 모드 종료 시 경로 지우기
  useEffect(() => {
    if (ref.current && (!routeData || !routeData.features?.length)) {
      ref.current.postMessage(
        JSON.stringify({
          type: "CLEAR_ROUTE",
        })
      );
    }
  }, [routeData]);

  // 경로 변경 시 지도에 경로 그리기
  useEffect(() => {
    // 1. 자동차 모드
    if (ref.current && routeData && routeMode === "car" && routeData.features) {
      ref.current.postMessage(
        JSON.stringify({
          type: "DRAW_CAR_ROUTE",
          payload: {
            route: routeData,
            points: routePoints,
          },
        })
      );
    }

    // 2. 대중교통 모드
    if (
      ref.current &&
      routeMode === "transit" &&
      routeData?.metaData?.plan?.itineraries?.length === 1 // 선택된 하나의 경로만 있을 때만 표시
    ) {
      ref.current.postMessage(
        JSON.stringify({
          type: "DRAW_TRANSIT_ROUTE",
          payload: {
            itineraries: routeData.metaData.plan.itineraries,
          },
        })
      );
    }

    // 3. 도보 모드
    if (
      ref.current &&
      routeData &&
      routeMode === "walk" &&
      routeData.features
    ) {
      ref.current.postMessage(
        JSON.stringify({
          type: "DRAW_WALK_ROUTE",
          payload: {
            route: routeData,
            points: routePoints,
          },
        })
      );
    }
  }, [routeData, routeMode]);

  // 사용자 위치 변경 시 지도에 위치 업데이트
  useEffect(() => {
    if (
      ref.current &&
      userLocation &&
      userLocation.latitude &&
      userLocation.longitude
    ) {
      ref.current.postMessage(
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
    if (ref.current) {
      ref.current.postMessage(
        JSON.stringify({
          type: "UPDATE_RADIUS",
          radius: range,
        })
      );
    }
  }, [range]);

  // 유적지 데이터가 context에서 갱신되면 RN -> WebView 메시지 전달
  useEffect(() => {
    if (heritages && ref.current) {
      ref.current.postMessage(
        JSON.stringify({
          type: "NEARBY_HERITAGES",
          payload: heritages,
        })
      );
    }
  }, [heritages]);

  // WebView -> RN 메시지 처리
  const handleMessage = async (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      // 지도 초기화 시 맨 처음 위치 처리
      if (message.type === "REQUEST_LOCATION") {
        if (
          ref.current &&
          userLocation &&
          userLocation.latitude &&
          userLocation.longitude
        ) {
          ref.current.postMessage(
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

      // 부모 컴포넌트의 onMessage 핸들러 호출
      onMessage && onMessage(event);
    } catch (error) {
      console.error("메시지 처리 중 에러:", error);
    }
  };

  // 웹 뷰 html 코드
  const htmlContent = /*html*/ `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          
          <title>HisTourMap</title> 
          <script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${TMAP_APP_KEY}"></script>
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

            window.focusedMarker = null; // 검색한 유적지 마커
            
            
            window.carPolyline = null; // 자동차 경로 폴리라인
            window.carRouteMarkers = []; // 자동차 출발지/목적지/경유지 마커 배열


            
            window.transitPolylines = []; // 대중교통 경로 폴리라인 배열
            window.transitMarkers = []; // 대중교통 출발지/목적지/경유지 마커 배열

            window.walkPolyline = null; // 도보 경로 폴리라인
            window.walkRouteMarkers = []; // 도보 출발지/목적지/경유지 마커 배열
            

            // 자동차 경로 그리기 메서드
            function drawCarRoute(data) {
              clearAllRoute();

              const features = data.route?.features;  // TMAP API 응답의 features 배열
              if (!features || !Array.isArray(features)) {
                console.error("유효하지 않은 경로 데이터:", data);
                return;
              }

              // 1. 경로 폴리라인 그리기 (LineString 타입의 feature만 사용)
              // 실제 경로에 해당하는 LineString만 필터링
              const lineCoords = features
                .filter((f) => 
                  f.geometry?.type === "LineString" && 
                  !f.properties?.pointType && // 실제 경로 구간은 pointType이 없음
                  f.properties?.description !== "경유지와 연결된 가상의 라인입니다" // 가상의 라인 제외
                )
                .flatMap((f) => f.geometry.coordinates.map(([lng, lat]) => new Tmapv2.LatLng(lat, lng)));

              if (lineCoords.length > 0) {
                window.carPolyline = new Tmapv2.Polyline({
                  path: lineCoords,
                  strokeColor: "#10A37F",
                  strokeWeight: 10,
                  outline: true,
                  outlineColor:'#ffffff',
                  direction: true,
                  directionColor: "white",
                  directionOpacity: 10000,
                  map: window.map,
                });
              }
              
              // 2. 마커 그리기
              const routePoints = data.points;
              if (routePoints && Array.isArray(routePoints)) {
                routePoints.forEach((pt, idx) => {
                  const pos = new Tmapv2.LatLng(pt.latitude, pt.longitude);
                  const label =
                    idx === 0 ? "출발지" :
                    idx === routePoints.length - 1 ? "도착지" :
                    "경유지";
                  
                  const marker = new Tmapv2.Marker({
                    position: pos,
                    label: label,
                    labelSize: "30",
                    icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                    iconSize: new Tmapv2.Size(70, 70),
                    map: window.map,  
                  });
                  
                  window.carRouteMarkers.push(marker);
                });

                // 3. 지도의 중심을 경로 가운데로 이동시키고 줌 아웃
                const start = routePoints[0];
                const end = routePoints[routePoints.length - 1];

                if (start && end) {
                  const midLat = (start.latitude + end.latitude) / 2 - 0.01;
                  const midLng = (start.longitude + end.longitude) / 2;
                  const midPoint = new Tmapv2.LatLng(midLat, midLng);
                }
              }
            }
          
            

            // 기존 자동차 경로 지우기 메서드
            function clearCarRoute() {
              if (window.carPolyline) {
                window.carPolyline.setMap(null);
                window.carPolyline = null;
              }
              window.carRouteMarkers.forEach((m) => m.setMap(null));
              window.carRouteMarkers = [];
            }
            

            function drawTransitRoute(itineraries) {
              clearAllRoute();
              
               if (!itineraries || itineraries.length === 0) return;
               // 전달받은 itineraries 그대로 사용 (선택된 경로만 전달됨)
               const itinerary = itineraries[0];
               const legs = itinerary.legs;

               legs.forEach((leg) => {
                
                
                const line = leg.passShape?.linestring;

                // 🚶‍♀️ WALK 단계의 steps가 있다면, 따로도 선을 그림
                if (leg.mode === "WALK" && leg.steps?.length > 0) {
                  leg.steps.forEach((step) => {
                    if (step.linestring) {
                      const coords = step.linestring.split(" ").map((pair) => {
                        const [lng, lat] = pair.split(",").map(Number);
                        return new Tmapv2.LatLng(lat, lng);
                      });
                      
                      const polyline = new Tmapv2.Polyline({
                        path: coords,

                        strokeColor: "#10A37F", // 도보 색 고정
                        strokeStyle: "dot",
                        strokeWeight: 10,

                        outline: true,
                        outlineColor:'#ffffff',

                        direction: leg.mode === "WALK" ? false : true,
                        directionColor: "white",

                        map: window.map,
                      });
                      window.transitPolylines.push(polyline);
                    }
                  });
                }


                if (line) {
                  const coords = line.split(" ").map((pair) => {
                    const [lng, lat] = pair.split(",").map(Number);
                    return new Tmapv2.LatLng(lat, lng);
                  });
                  
                  const polyline = new Tmapv2.Polyline({
                    path: coords,

                    strokeColor: leg.mode === "SUBWAY" ? "#0033cc" :
                     leg.mode === "BUS" ? "#2E8B57" :
                     "#10A37F",
                    strokeStyle: leg.mode === "WALK" ? "dot" : "solid",
                    strokeWeight: 10,

                    outline: true,
                    outlineColor:'#ffffff',
                    
                    direction: leg.mode === "WALK" ? false : true,
                    directionColor: "white",

                    map: window.map,
                  });
                  window.transitPolylines.push(polyline);
                }
              });
              
              
              // 2. 마커 그리기
              const start = legs[0].start;
              const end = legs[legs.length - 1].end;
              
              const markerStart = new Tmapv2.Marker({
                position: new Tmapv2.LatLng(start.lat, start.lon),
                label: "출발지",
                labelSize: "30",
                icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                iconSize: new Tmapv2.Size(70, 70),
                map: window.map,
              });
              
              const markerEnd = new Tmapv2.Marker({
                position: new Tmapv2.LatLng(end.lat, end.lon),
                label: "도착지",
                labelSize: "30",
                icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                iconSize: new Tmapv2.Size(70, 70),
                map: window.map,
              });

              window.transitMarkers.push(markerStart, markerEnd);
              
              const midLat = (start.lat + end.lat) / 2 - 0.01;
              const midLng = (start.lon + end.lon) / 2;
              const midPoint = new Tmapv2.LatLng(midLat, midLng);
              
              
            }



            // 기존 대중교통 경로 지우기 메서드
            function clearTransitRoute() {
              window.transitPolylines.forEach((line) => line.setMap(null));
              window.transitPolylines = [];

              window.transitMarkers.forEach((marker) => marker.setMap(null));
              window.transitMarkers = [];
            }

            // 도보 경로 그리기 메서드
            function drawWalkRoute(data) {
              clearAllRoute();
              const features = data.route.features;
              const routePoints = data.points;
              
              // 1. 경로 폴리라인 그리기
              const lineCoords = features
              .filter((f) => f.geometry?.type === "LineString")
              .flatMap((f) => f.geometry.coordinates.map(([lng, lat]) => new Tmapv2.LatLng(lat, lng)));
              if (lineCoords.length > 0) {window.walkPolyline = new Tmapv2.Polyline({
                path: lineCoords,
                strokeColor: "#10A37F",
                strokeWeight: 10,
                outline: true,
                outlineColor:'#ffffff',
                direction: true,
                directionColor: "white",
                directionOpacity: 10000,
                map: window.map,
              });
            
            // 2. 마커 그리기
            routePoints.forEach((pt, idx) => {
              const pos = new Tmapv2.LatLng(pt.latitude, pt.longitude);
              const label =
              idx === 0 ? "출발지" :
              idx === routePoints.length - 1 ? "도착지" :
              "경유지";
              
              const marker = new Tmapv2.Marker({
                position: pos,
                label: label,
                labelSize: "30",
                icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                iconSize: new Tmapv2.Size(70, 70),
                map: window.map,  
              });
              
              window.walkRouteMarkers.push(marker);
            });

            // 3. 지도의 중심을 경로 가운데로 이동시키고 줌 아웃
              const start = routePoints[0];
              const end = routePoints[routePoints.length - 1];

              if (start && end) {
                const midLat = (start.latitude + end.latitude) / 2 - 0.01;
                const midLng = (start.longitude + end.longitude) / 2;
                const midPoint = new Tmapv2.LatLng(midLat, midLng);
                
              }
            }
          }

          
          // 기존 도보 경로 지우기 메서드
            function clearWalkRoute() {
              if (window.walkPolyline) {
                window.walkPolyline.setMap(null);
                window.walkPolyline = null;
              }
              window.walkRouteMarkers.forEach((m) => m.setMap(null));
              window.walkRouteMarkers = [];
            }

            // 기존 경로 모두 지우기 메서드
            function clearAllRoute(){
              clearCarRoute();
              clearTransitRoute();
              clearWalkRoute();
            }



            // 기존 유적지 마커 지우기 메서드
            function clearHeritageMarkers() {
              window.heritageMarkers.forEach((marker) => marker.setMap(null));
              window.heritageMarkers = [];
            }

            // 유적지 마커 렌더링 메서드
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

                // 마커 클릭/터치 이벤트 핸들러 (WebView -> RN)
                const handleMarkerInteraction = () => {
                  const message = {
                    type: "HERITAGE_MARKER_CLICKED",
                    payload: {
                      heritages: group,
                      latitude: group[0].latitude,
                      longitude: group[0].longitude,
                      isFromMarkerClick: true
                    }
                  };
                  
                  try {
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify(message));
                    } 
                  } catch (error) {
                    console.error("메시지 전송 중 에러:", error);
                  }
                };

                // 마커의 DOM 엘리먼트 가져오기
                const markerElement = marker.getElement();
                if (markerElement) {
                  // 터치 이벤트 리스너 추가 (WebView -> RN)
                  markerElement.addEventListener('touchstart', function(e) {
                    e.preventDefault(); // 기본 터치 동작 방지
                    handleMarkerInteraction();
                  });
                }

                // 기존 클릭 이벤트도 유지
                marker.addListener("click", handleMarkerInteraction);

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

            // 지도 중심 재설정 메서드
            function updateMapCenter(lat, lng) {
              if (!window.map || !lat || !lng) return;
              const userPos = new Tmapv2.LatLng(lat, lng);
              window.map.setCenter(userPos);
            }
            

            // 사용자 위치 업뎃 시 지도 업데이트 처리 메서드
            const handlePositionUpdate = (data) => {
              const { latitude, longitude, radius } = data.payload;
              if (latitude && longitude && radius) {
                updateMap(latitude, longitude, radius);
              }
            };


            // 이벤트 리스너 : RN -> 웹 메세지 처리 (for iOS)
            window.addEventListener("message", (event) => {
              try {
                const data = JSON.parse(event.data);

                // 유저 위치 업데이트
                if (data.type === "USER_LOCATION_UPDATE") {
                  handlePositionUpdate(data);
                }

                // 사용자 반경 업데이트
                if (data.type === "UPDATE_RADIUS") {
                  if (window.userCircle) {
                    window.userCircle.setRadius(data.radius);
                  }
                }

                // 사용자 근처 유적지 마커 표시
                if (data.type === "NEARBY_HERITAGES") {
                  renderHeritageMarkers(data.payload);
                }

                // 지도 중심 재설정
                if (data.type === "RECENTER_TO_COORD") {
                  const { latitude, longitude } = data.payload;
                  updateMapCenter(latitude, longitude);
                }

                // 특정 유적지 마커 표시
                if (data.type === "SHOW_SINGLE_MARKER") {
                  const { id, name, latitude, longitude } = data.payload;
                  if (window.focusedMarker) {
                    window.focusedMarker.setMap(null);
                  }
                  const pos = new Tmapv2.LatLng(latitude, longitude);
                  const marker = new Tmapv2.Marker({
                    position: pos,
                    label: name,
                    labelSize: "30",
                    icon: "https://www.svgrepo.com/show/376955/map-marker.svg",
                    iconSize: new Tmapv2.Size(70, 70),
                    animation: Tmapv2.MarkerOptions.ANIMATE_BOUNCE_ONCE,
                    map: window.map,
                  });
                  window.focusedMarker = marker;  
                }
                
                // 특정 유적지 마커 제거
                if (data.type === "HIDE_SINGLE_MARKER") {
                  if (window.focusedMarker) {
                    window.focusedMarker.setMap(null);
                    window.focusedMarker = null;
                  }
                }

                // 자동차 경로 표시
                if (data.type === "DRAW_CAR_ROUTE") {
                  drawCarRoute(data.payload);
                }

                // 대중교통 경로 표시
                if (data.type === "DRAW_TRANSIT_ROUTE") {
                    drawTransitRoute(data.payload.itineraries);
                }

                // 도보 경로 표시
                if (data.type === "DRAW_WALK_ROUTE") {
                  drawWalkRoute(data.payload);
                }

                // 경로 지우기
               if (data.type === "CLEAR_ROUTE") {
                  clearAllRoute();
                }
              } catch (e) {
                console.error("메시지 처리 오류:", e);
              }
            } 
            );

            // 이벤트 리스너 : RN -> 웹 메세지 처리 (for Android)
            document.addEventListener("message", (event) => {
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

                if (data.type === "RECENTER_TO_COORD") {
                  const { latitude, longitude } = data.payload;
                  updateMapCenter(latitude, longitude);
                }

                 if (data.type === "DRAW_CAR_ROUTE") {
                  drawCarRoute(data.payload);
                }
                if (data.type === "DRAW_TRANSIT_ROUTE") {
                  drawTransitRoute(data.payload.itineraries);
                }
                if (data.type === "DRAW_WALK_ROUTE") {
                drawWalkRoute(data.payload);
                }
                if (data.type === "CLEAR_ROUTE") {
                clearAllRoute();
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
      ref={ref}
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      javaScriptEnabled={true}
      onMessage={handleMessage}
    />
  );
});
