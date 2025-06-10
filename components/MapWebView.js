import React, { useEffect, useRef, useState, forwardRef } from "react";
import { WebView } from "react-native-webview";
import { useUserLocation } from "../contexts/UserLocationContext";
import { useHeritages } from "../contexts/HeritageContext";
import { TMAP_APP_KEY } from "../config/apiKeys";
import { useRoute } from "../contexts/RouteContext";
import { useRouteMode } from "../contexts/RouteModeContext";
import { useBookmark } from "../contexts/BookmarkContext";

export default forwardRef(function MapWebView({ range, onMessage }, ref) {
  const { userLocation } = useUserLocation();
  const { heritages } = useHeritages();
  const { routeData, routePoints } = useRoute();
  const { routeMode } = useRouteMode();
  const { mapRef, bookmarks } = useBookmark();

  // BookmarkContext의 mapRef에 WebView ref 연결
  useEffect(() => {
    if (ref.current) {
      mapRef.current = ref.current;
    }
  }, [ref.current]);

  // 북마크 마커 표시
  useEffect(() => {
    if (ref.current && bookmarks?.length > 0) {
      ref.current.postMessage(
        JSON.stringify({
          type: "SHOW_BOOKMARK_MARKERS",
          payload: bookmarks,
        })
      );
    }
  }, [bookmarks, ref.current]);

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

      // 지도 초기화 시 맨 처음 위치와 북마크 마커 처리
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

          // 북마크 마커도 함께 표시
          if (bookmarks?.length > 0) {
            ref.current.postMessage(
              JSON.stringify({
                type: "SHOW_BOOKMARK_MARKERS",
                payload: bookmarks,
              })
            );
          }
        }
      }

      // 북마크 마커 요청 처리
      if (message.type === "REQUEST_BOOKMARK_MARKERS") {
        if (ref.current && bookmarks?.length > 0) {
          ref.current.postMessage(
            JSON.stringify({
              type: "SHOW_BOOKMARK_MARKERS",
              payload: bookmarks,
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

            const USER_MARKER_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzQwIiBoZWlnaHQ9Ijc0MCIgdmlld0JveD0iMCAwIDc0MCA3NDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2RfMjY2XzEyMjApIj4KPGNpcmNsZSBjeD0iMzcwIiBjeT0iMzcwIiByPSIzMDAiIGZpbGw9IiNGMDNENUIiLz4KPGNpcmNsZSBjeD0iMzcwIiBjeT0iMzcwIiByPSIyNjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iODAiLz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzI2Nl8xMjIwIiB4PSIwIiB5PSIwIiB3aWR0aD0iNzQwIiBoZWlnaHQ9Ijc0MCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlTW9ycGhvbG9neSByYWRpdXM9IjIwIiBvcGVyYXRvcj0iZGlsYXRlIiBpbj0iU291cmNlQWxwaGEiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzI2Nl8xMjIwIi8+CjxmZU9mZnNldC8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjI1Ii8+CjxmZUNvbXBvc2l0ZSBpbjI9ImhhcmRBbHBoYSIgb3BlcmF0b3I9Im91dCIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMC4yNSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93XzI2Nl8xMjIwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzI2Nl8xMjIwIiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8L2RlZnM+Cjwvc3ZnPgo=";

            const DEFAULT_MARKER_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTU1IiBoZWlnaHQ9Ijc3MCIgdmlld0JveD0iMCAwIDU1NSA3NzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxtYXNrIGlkPSJwYXRoLTEtaW5zaWRlLTFfMjUxXzEyNTMiIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTI3Ny41IDBDNDMwLjQwMiAwIDU1NSAxMzMuMjQ2IDU1NSAzMDcuOTk1QzU1NSAzNTYuMDQyIDUzNi40NDIgNDA4LjU1NiA1MTIuOTI0IDQ1Ni45ODhDNDg4Ljg4NSA1MDYuNDk5IDQ1Ny4yODYgNTU2LjUxIDQyNi4zMSA2MDAuNzg0QzM4OC40MDkgNjU0LjY2OSAzNDcuOTI4IDcwNi4yNTUgMzA1LjA0MiA3NTUuMzJMMzAyLjg5MiA3NTcuNzQ2TDMwMi4zMDIgNzU4LjRMMzAyLjA5NCA3NTguNjMyTDMwMi4wNTkgNzU4LjY3QzI5OC44MzYgNzYyLjI2MSAyOTUuMDA2IDc2NS4xMSAyOTAuNzg5IDc2Ny4wNTVDMjg2LjU3MiA3NjguOTk5IDI4Mi4wNDkgNzcwIDI3Ny40ODIgNzcwQzI3Mi45MTYgNzcwIDI2OC4zOTQgNzY4Ljk5OSAyNjQuMTc3IDc2Ny4wNTVDMjU5Ljk1OSA3NjUuMTEgMjU2LjEyOSA3NjIuMjYxIDI1Mi45MDYgNzU4LjY3TDI1Mi42OTggNzU4LjRMMjUyLjEwOCA3NTcuNzQ2TDI0OS45NTggNzU1LjMyQzIzNy43MyA3NDEuMzQgMjI1LjcwNCA3MjcuMTQ1IDIxMy44ODMgNzEyLjc0QzE4NC4yMDQgNjc2LjY0NiAxNTUuNzg2IDYzOS4zIDEyOC42OSA2MDAuNzg0Qzk3Ljc0OTMgNTU2LjUxIDY2LjExNDYgNTA2LjQ2IDQyLjA3NjIgNDU3LjAyN0MxOC41NTggNDA4LjU1NyAwIDM1Ni4wNDIgMCAzMDcuOTk1QzAuMDAwMjAzMDk1IDEzMy4yNDYgMTI0LjU5OCAwIDI3Ny41IDBaIi8+CjwvbWFzaz4KPHBhdGggZD0iTTI3Ny41IDBDNDMwLjQwMiAwIDU1NSAxMzMuMjQ2IDU1NSAzMDcuOTk1QzU1NSAzNTYuMDQyIDUzNi40NDIgNDA4LjU1NiA1MTIuOTI0IDQ1Ni45ODhDNDg4Ljg4NSA1MDYuNDk5IDQ1Ny4yODYgNTU2LjUxIDQyNi4zMSA2MDAuNzg0QzM4OC40MDkgNjU0LjY2OSAzNDcuOTI4IDcwNi4yNTUgMzA1LjA0MiA3NTUuMzJMMzAyLjg5MiA3NTcuNzQ2TDMwMi4zMDIgNzU4LjRMMzAyLjA5NCA3NTguNjMyTDMwMi4wNTkgNzU4LjY3QzI5OC44MzYgNzYyLjI2MSAyOTUuMDA2IDc2NS4xMSAyOTAuNzg5IDc2Ny4wNTVDMjg2LjU3MiA3NjguOTk5IDI4Mi4wNDkgNzcwIDI3Ny40ODIgNzcwQzI3Mi45MTYgNzcwIDI2OC4zOTQgNzY4Ljk5OSAyNjQuMTc3IDc2Ny4wNTVDMjU5Ljk1OSA3NjUuMTEgMjU2LjEyOSA3NjIuMjYxIDI1Mi45MDYgNzU4LjY3TDI1Mi42OTggNzU4LjRMMjUyLjEwOCA3NTcuNzQ2TDI0OS45NTggNzU1LjMyQzIzNy43MyA3NDEuMzQgMjI1LjcwNCA3MjcuMTQ1IDIxMy44ODMgNzEyLjc0QzE4NC4yMDQgNjc2LjY0NiAxNTUuNzg2IDYzOS4zIDEyOC42OSA2MDAuNzg0Qzk3Ljc0OTMgNTU2LjUxIDY2LjExNDYgNTA2LjQ2IDQyLjA3NjIgNDU3LjAyN0MxOC41NTggNDA4LjU1NyAwIDM1Ni4wNDIgMCAzMDcuOTk1QzAuMDAwMjAzMDk1IDEzMy4yNDYgMTI0LjU5OCAwIDI3Ny41IDBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNTU1IDMwNy45OTVMNTcwIDMwNy45OTVMNTcwIDMwNy45OTVMNTU1IDMwNy45OTVaTTUxMi45MjQgNDU2Ljk4OEw0OTkuNDMxIDQ1MC40MzZMNDk5LjQzIDQ1MC40MzdMNTEyLjkyNCA0NTYuOTg4Wk00MjYuMzEgNjAwLjc4NEw0MzguNTc5IDYwOS40MTRMNDM4LjU4OSA2MDkuMzk4TDQzOC42IDYwOS4zODNMNDI2LjMxIDYwMC43ODRaTTMwNS4wNDIgNzU1LjMyTDMxNi4yNjcgNzY1LjI3MUwzMTYuMzAxIDc2NS4yMzFMMzE2LjMzNiA3NjUuMTkyTDMwNS4wNDIgNzU1LjMyWk0zMDIuODkyIDc1Ny43NDZMMzE0LjAzMyA3NjcuNzlMMzE0LjA3NSA3NjcuNzQzTDMxNC4xMTYgNzY3LjY5NkwzMDIuODkyIDc1Ny43NDZaTTMwMi4zMDIgNzU4LjRMMjkxLjE2MSA3NDguMzU3TDI5MS4xNTMgNzQ4LjM2NUwyOTEuMTQ1IDc0OC4zNzRMMzAyLjMwMiA3NTguNFpNMzAyLjA5NCA3NTguNjMyTDMxMy4xMTYgNzY4LjgwNkwzMTMuMTgzIDc2OC43MzNMMzEzLjI1IDc2OC42NTlMMzAyLjA5NCA3NTguNjMyWk0zMDIuMDU5IDc1OC42N0wyOTEuMDM3IDc0OC40OTZMMjkwLjk2NSA3NDguNTczTDI5MC44OTUgNzQ4LjY1MUwzMDIuMDU5IDc1OC42N1pNMjkwLjc4OSA3NjcuMDU1TDI5Ny4wNjkgNzgwLjY3N0wyOTcuMDY5IDc4MC42NzdMMjkwLjc4OSA3NjcuMDU1Wk0yNzcuNDgyIDc3MEwyNzcuNDgyIDc4NUgyNzcuNDgyVjc3MFpNMjY0LjE3NyA3NjcuMDU1TDI1Ny44OTcgNzgwLjY3N0wyNTcuODk3IDc4MC42NzdMMjY0LjE3NyA3NjcuMDU1Wk0yNTIuOTA2IDc1OC42N0wyNDEuMDMxIDc2Ny44MzRMMjQxLjM3MSA3NjguMjc1TDI0MS43NDMgNzY4LjY4OUwyNTIuOTA2IDc1OC42N1pNMjUyLjY5OCA3NTguNEwyNjQuNTczIDc0OS4yMzZMMjY0LjIyMyA3NDguNzgyTDI2My44MzkgNzQ4LjM1N0wyNTIuNjk4IDc1OC40Wk0yNTIuMTA4IDc1Ny43NDZMMjQwLjg4NCA3NjcuNjk2TDI0MC45MjUgNzY3Ljc0M0wyNDAuOTY3IDc2Ny43OUwyNTIuMTA4IDc1Ny43NDZaTTI0OS45NTggNzU1LjMyTDIzOC42NjcgNzY1LjE5NkwyMzguNyA3NjUuMjMzTDIzOC43MzMgNzY1LjI3MUwyNDkuOTU4IDc1NS4zMlpNMjEzLjg4MyA3MTIuNzRMMjI1LjQ3OCA3MDMuMjI1TDIyNS40NzQgNzAzLjIxOUwyMjUuNDY5IDcwMy4yMTNMMjEzLjg4MyA3MTIuNzRaTTEyOC42OSA2MDAuNzg0TDExNi4zOTUgNjA5LjM3N0wxMTYuNDA5IDYwOS4zOTZMMTE2LjQyMiA2MDkuNDE1TDEyOC42OSA2MDAuNzg0Wk00Mi4wNzYyIDQ1Ny4wMjdMMjguNTgwOCA0NjMuNTc1TDI4LjU4NjYgNDYzLjU4N0w0Mi4wNzYyIDQ1Ny4wMjdaTTAgMzA3Ljk5NUwtMTUgMzA3Ljk5NVYzMDcuOTk1SDBaTTI3Ny41IDBWMTVDNDIwLjgzNyAxNSA1NDAgMTQwLjE4OSA1NDAgMzA3Ljk5NUw1NTUgMzA3Ljk5NUw1NzAgMzA3Ljk5NUM1NzAgMTI2LjMwNCA0MzkuOTY4IC0xNSAyNzcuNSAtMTVWMFpNNTU1IDMwNy45OTVINTQwQzU0MCAzNTIuNjEgNTIyLjYzNiA0MDIuNjQ3IDQ5OS40MzEgNDUwLjQzNkw1MTIuOTI0IDQ1Ni45ODhMNTI2LjQxNyA0NjMuNTRDNTUwLjI0OCA0MTQuNDY1IDU3MCAzNTkuNDc1IDU3MCAzMDcuOTk1SDU1NVpNNTEyLjkyNCA0NTYuOTg4TDQ5OS40MyA0NTAuNDM3QzQ3NS44NjcgNDk4Ljk2NyA0NDQuNzQ5IDU0OC4yNjIgNDE0LjAxOSA1OTIuMTg1TDQyNi4zMSA2MDAuNzg0TDQzOC42IDYwOS4zODNDNDY5LjgyMiA1NjQuNzU4IDUwMS45MDMgNTE0LjAzIDUyNi40MTcgNDYzLjU0TDUxMi45MjQgNDU2Ljk4OFpNNDI2LjMxIDYwMC43ODRMNDE0LjA0IDU5Mi4xNTVDMzc2LjQ0IDY0NS42MTMgMzM2LjI4NCA2OTYuNzg1IDI5My43NDggNzQ1LjQ0OUwzMDUuMDQyIDc1NS4zMkwzMTYuMzM2IDc2NS4xOTJDMzU5LjU3MyA3MTUuNzI2IDQwMC4zNzkgNjYzLjcyNSA0MzguNTc5IDYwOS40MTRMNDI2LjMxIDYwMC43ODRaTTMwNS4wNDIgNzU1LjMyTDI5My44MTcgNzQ1LjM3TDI5MS42NjcgNzQ3Ljc5NkwzMDIuODkyIDc1Ny43NDZMMzE0LjExNiA3NjcuNjk2TDMxNi4yNjcgNzY1LjI3MUwzMDUuMDQyIDc1NS4zMlpNMzAyLjg5MiA3NTcuNzQ2TDI5MS43NSA3NDcuNzAyTDI5MS4xNjEgNzQ4LjM1N0wzMDIuMzAyIDc1OC40TDMxMy40NDMgNzY4LjQ0NEwzMTQuMDMzIDc2Ny43OUwzMDIuODkyIDc1Ny43NDZaTTMwMi4zMDIgNzU4LjRMMjkxLjE0NSA3NDguMzc0TDI5MC45MzcgNzQ4LjYwNUwzMDIuMDk0IDc1OC42MzJMMzEzLjI1IDc2OC42NTlMMzEzLjQ1OCA3NjguNDI3TDMwMi4zMDIgNzU4LjRaTTMwMi4wOTQgNzU4LjYzMkwyOTEuMDcyIDc0OC40NThMMjkxLjAzNyA3NDguNDk2TDMwMi4wNTkgNzU4LjY3TDMxMy4wODEgNzY4Ljg0NEwzMTMuMTE2IDc2OC44MDZMMzAyLjA5NCA3NTguNjMyWk0zMDIuMDU5IDc1OC42N0wyOTAuODk1IDc0OC42NTFDMjg4Ljk4MyA3NTAuNzgyIDI4Ni43OTcgNzUyLjM3OCAyODQuNTA5IDc1My40MzNMMjkwLjc4OSA3NjcuMDU1TDI5Ny4wNjkgNzgwLjY3N0MzMDMuMjE2IDc3Ny44NDMgMzA4LjY4OSA3NzMuNzQgMzEzLjIyMiA3NjguNjg5TDMwMi4wNTkgNzU4LjY3Wk0yOTAuNzg5IDc2Ny4wNTVMMjg0LjUwOSA3NTMuNDMzQzI4Mi4yMjYgNzU0LjQ4NSAyNzkuODQzIDc1NSAyNzcuNDgyIDc1NVY3NzBWNzg1QzI4NC4yNTUgNzg1IDI5MC45MTcgNzgzLjUxMyAyOTcuMDY5IDc4MC42NzdMMjkwLjc4OSA3NjcuMDU1Wk0yNzcuNDgyIDc3MEwyNzcuNDgzIDc1NUMyNzUuMTIyIDc1NSAyNzIuNzQgNzU0LjQ4NSAyNzAuNDU3IDc1My40MzNMMjY0LjE3NyA3NjcuMDU1TDI1Ny44OTcgNzgwLjY3N0MyNjQuMDQ4IDc4My41MTMgMjcwLjcwOSA3ODUgMjc3LjQ4MiA3ODVMMjc3LjQ4MiA3NzBaTTI2NC4xNzcgNzY3LjA1NUwyNzAuNDU3IDc1My40MzNDMjY4LjE2OCA3NTIuMzc3IDI2NS45ODEgNzUwLjc4MSAyNjQuMDcgNzQ4LjY1MUwyNTIuOTA2IDc1OC42N0wyNDEuNzQzIDc2OC42ODlDMjQ2LjI3NyA3NzMuNzQxIDI1MS43NTEgNzc3Ljg0MyAyNTcuODk3IDc4MC42NzdMMjY0LjE3NyA3NjcuMDU1Wk0yNTIuOTA2IDc1OC42N0wyNjQuNzgxIDc0OS41MDZMMjY0LjU3MyA3NDkuMjM2TDI1Mi42OTggNzU4LjRMMjQwLjgyMyA3NjcuNTY1TDI0MS4wMzEgNzY3LjgzNEwyNTIuOTA2IDc1OC42N1pNMjUyLjY5OCA3NTguNEwyNjMuODM5IDc0OC4zNTdMMjYzLjI1IDc0Ny43MDJMMjUyLjEwOCA3NTcuNzQ2TDI0MC45NjcgNzY3Ljc5TDI0MS41NTcgNzY4LjQ0NEwyNTIuNjk4IDc1OC40Wk0yNTIuMTA4IDc1Ny43NDZMMjYzLjMzMyA3NDcuNzk2TDI2MS4xODMgNzQ1LjM3TDI0OS45NTggNzU1LjMyTDIzOC43MzMgNzY1LjI3MUwyNDAuODg0IDc2Ny42OTZMMjUyLjEwOCA3NTcuNzQ2Wk0yNDkuOTU4IDc1NS4zMkwyNjEuMjQ5IDc0NS40NDVDMjQ5LjEyNSA3MzEuNTgzIDIzNy4yIDcxNy41MDggMjI1LjQ3OCA3MDMuMjI1TDIxMy44ODMgNzEyLjc0TDIwMi4yODcgNzIyLjI1NkMyMTQuMjA3IDczNi43ODIgMjI2LjMzNiA3NTEuMDk3IDIzOC42NjcgNzY1LjE5NkwyNDkuOTU4IDc1NS4zMlpNMjEzLjg4MyA3MTIuNzRMMjI1LjQ2OSA3MDMuMjEzQzE5Ni4wMzEgNjY3LjQxMiAxNjcuODQgNjMwLjM2NCAxNDAuOTU5IDU5Mi4xNTRMMTI4LjY5IDYwMC43ODRMMTE2LjQyMiA2MDkuNDE1QzE0My43MzIgNjQ4LjIzNSAxNzIuMzc4IDY4NS44ODEgMjAyLjI5NyA3MjIuMjY3TDIxMy44ODMgNzEyLjc0Wk0xMjguNjkgNjAwLjc4NEwxNDAuOTg2IDU5Mi4xOTJDMTEwLjI4NSA1NDguMjYyIDc5LjEzIDQ5OC45MjYgNTUuNTY1OCA0NTAuNDY4TDQyLjA3NjIgNDU3LjAyN0wyOC41ODY2IDQ2My41ODdDNTMuMDk5MiA1MTMuOTk1IDg1LjIxMzUgNTY0Ljc1OCAxMTYuMzk1IDYwOS4zNzdMMTI4LjY5IDYwMC43ODRaTTQyLjA3NjIgNDU3LjAyN0w1NS41NzE1IDQ1MC40NzlDMzIuMzYzNyA0MDIuNjQ4IDE1IDM1Mi42MSAxNSAzMDcuOTk1SDBILTE1Qy0xNSAzNTkuNDc1IDQuNzUyMzYgNDE0LjQ2NSAyOC41ODA4IDQ2My41NzVMNDIuMDc2MiA0NTcuMDI3Wk0wIDMwNy45OTVMMTUgMzA3Ljk5NUMxNS4wMDAyIDE0MC4xODkgMTM0LjE2MyAxNSAyNzcuNSAxNVYwVi0xNUMxMTUuMDMyIC0xNSAtMTQuOTk5OCAxMjYuMzA0IC0xNSAzMDcuOTk1TDAgMzA3Ljk5NVoiIGZpbGw9IiNBQUFBQUEiIG1hc2s9InVybCgjcGF0aC0xLWluc2lkZS0xXzI1MV8xMjUzKSIvPgo8cmVjdCB4PSIxMzYiIHk9IjI3NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjE0MyIgZmlsbD0iIzA2NUJGNSIvPgo8cmVjdCB4PSIzNzciIHk9IjI3NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjE0MyIgZmlsbD0iIzA2NUJGNSIvPgo8cmVjdCB4PSIyMjMiIHk9IjI3NiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjE0MiIgZmlsbD0iIzA2NUJGNSIvPgo8cmVjdCB4PSIzMDAiIHk9IjI3NiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjE0MiIgZmlsbD0iIzA2NUJGNSIvPgo8cmVjdCB4PSIxMTgiIHk9IjM3MiIgd2lkdGg9IjMxOCIgaGVpZ2h0PSI0NiIgcng9IjEwIiBmaWxsPSIjMDY1QkY1Ii8+CjxyZWN0IHg9IjE2NyIgeT0iMzU3IiB3aWR0aD0iMjMwIiBoZWlnaHQ9IjM0IiBmaWxsPSIjMDY1QkY1Ii8+CjxyZWN0IHg9IjExMyIgeT0iMjcyIiB3aWR0aD0iMzI5IiBoZWlnaHQ9IjIwIiByeD0iOCIgZmlsbD0iIzA2NUJGNSIvPgo8cGF0aCBkPSJNMTcyLjk5IDEzOS45ODZDMTY3LjIzOSAxMzguMTUxIDE2NC4zNjMgMTM3LjIzMyAxNjIuMTUgMTM4LjM4MUMxNTkuOTM3IDEzOS41MyAxNTguOTgyIDE0Mi41NyAxNTcuMDcxIDE0OC42NTFDMTUxLjYyNCAxNjUuOTg0IDE0My43NzggMTgxLjg5OSAxMzkuNDIgMTg5Ljg0N0MxMzguOTg1IDE5MC42NCAxMzguNzY4IDE5MS4wMzcgMTM4LjQ2NCAxOTEuNDI0QzEzOC4xNiAxOTEuODExIDEzNy44MDcgMTkyLjEzNSAxMzcuMTAxIDE5Mi43ODNMMTE1LjczOSAyMTIuMzY0QzExNS4xMiAyMTIuOTMxIDExNC44MTEgMjEzLjIxNSAxMTQuNDY3IDIxMy40NTJDMTE0LjEyMiAyMTMuNjg5IDExMy43NDcgMjEzLjg3NiAxMTIuOTk3IDIxNC4yNTJMNzkuMjYyOCAyMzEuMTE5Qzc4Ljg4MTUgMjMxLjMwOSA3OC42OTA5IDIzMS40MDUgNzguNDk0MiAyMzEuNDg2Qzc4LjI5NzUgMjMxLjU2OCA3OC4wOTUzIDIzMS42MzUgNzcuNjkwOSAyMzEuNzdMNjIuODY1OCAyMzYuNzExQzYyLjUxMDggMjM2LjgzIDYyLjMzMzIgMjM2Ljg4OSA2Mi4xNjQxIDIzNi45NTdDNjEuMTI1NCAyMzcuMzc1IDYwLjIyNDMgMjM4LjA3NSA1OS41NjI3IDIzOC45NzhDNTkuNDU1IDIzOS4xMjUgNTkuMzUzOSAyMzkuMjgzIDU5LjE1MTUgMjM5LjU5OFYyMzkuNTk4QzU4LjY5ODQgMjQwLjMwMyA1OC40NzE4IDI0MC42NTUgNTguMzExMSAyNDAuOTg5QzU3LjMwNDcgMjQzLjA4NCA1Ny41OTg4IDI0NS41NzIgNTkuMDY2IDI0Ny4zNzVDNTkuMzAwMiAyNDcuNjYzIDU5LjYwMjcgMjQ3Ljk1MyA2MC4yMDc3IDI0OC41MzJMNjcuMzIxNCAyNTUuMzVDNjcuNjYwNSAyNTUuNjc1IDY3LjgzMDEgMjU1LjgzNyA2OC4wMTE2IDI1NS45ODZDNjguMTkzMiAyNTYuMTM0IDY4LjM4NiAyNTYuMjY4IDY4Ljc3MTUgMjU2LjUzN0w3OS41IDI2NEw5Ni44MTEgMjcyLjg4OUM5Ny40MDQ5IDI3My4xOTQgOTcuNzAxOCAyNzMuMzQ3IDk4LjAxMzIgMjczLjQ2NUM5OC4zMjQ1IDI3My41ODQgOTguNjQ3NyAyNzMuNjY3IDk5LjI5NDIgMjczLjgzNEwxMTIuMDc3IDI3Ny4xMzNDMTEyLjc4OCAyNzcuMzE2IDExMy4xNDMgMjc3LjQwOCAxMTMuNTA2IDI3Ny40NTZDMTEzLjg2OSAyNzcuNTAzIDExNC4yMzYgMjc3LjUwNyAxMTQuOTY5IDI3Ny41MTNMMjcwLjM5NCAyNzguODkzQzI3Ni4wOTYgMjc4Ljk0MyAyNzguOTQ4IDI3OC45NjggMjgwLjcyNCAyNzcuMjA4QzI4Mi41IDI3NS40NDcgMjgyLjUgMjcyLjU5NiAyODIuNSAyNjYuODkzVjE2Ny4wNThDMjgyLjUgMTYxLjU5MyAyODIuNSAxNTguODYgMjgwLjgyMSAxNTcuMTE3QzI3OS4xNDMgMTU1LjM3NCAyNzYuNDEyIDE1NS4yNzIgMjcwLjk1IDE1NS4wNjdMMjQyLjUgMTU0TDIyNSAxNTJMMjA4LjQzMiAxNTAuMTA3QzIwNy45NjYgMTUwLjA1MyAyMDcuNzMzIDE1MC4wMjcgMjA3LjUwMyAxNDkuOTgyQzIwNy4yNzQgMTQ5LjkzNyAyMDcuMDQ4IDE0OS44NzUgMjA2LjU5NiAxNDkuNzVMMTg0IDE0My41TDE3Mi45OSAxMzkuOTg2WiIgZmlsbD0iIzA2NUJGNSIgc3Ryb2tlPSIjMDY1QkY1Ii8+CjxwYXRoIGQ9Ik0zODcuMjU1IDEzNy45OTNDMzkwLjYxMSAxMzYuOTIyIDM5NC4xNTcgMTM4Ljk2MiAzOTUuMDgyIDE0Mi4zNjFDNDAwLjYxNSAxNjIuNjgzIDQxMC4yOTggMTgyLjE1OCA0MTUuMDM3IDE5MC42NzRDNDE1LjM0MiAxOTEuMjI0IDQxNS43MzYgMTkxLjcxNiA0MTYuMiAxOTIuMTQxTDQzOC44ODEgMjEyLjkzMkM0MzkuMjkyIDIxMy4zMDkgNDM5Ljc1MyAyMTMuNjI2IDQ0MC4yNTIgMjEzLjg3Nkw0NzUuMTE5IDIzMS4zMDlDNDc1LjM3MyAyMzEuNDM2IDQ3NS42MzUgMjMxLjU0NSA0NzUuOTA1IDIzMS42MzVMNDkxLjQ5NCAyMzYuODMxQzQ5Mi43OTIgMjM3LjI2NCA0OTMuOTAzIDIzOC4xMjggNDk0LjY0NCAyMzkuMjc5TDQ5NS4zMjggMjQwLjM0M0M0OTYuODggMjQyLjc1NyA0OTYuNTA0IDI0NS45MzMgNDk0LjQzMiAyNDcuOTE5TDQ4Ni4zMzkgMjU1LjY3NUM0ODYuMTEzIDI1NS44OTEgNDg1Ljg3MSAyNTYuMDkgNDg1LjYxNCAyNTYuMjY4TDQ3NC41IDI2NEw0NTYuNTk0IDI3My4xOTVDNDU2LjE5OSAyNzMuMzk4IDQ1NS43ODMgMjczLjU1NiA0NTUuMzUzIDI3My42NjdMNDQxLjIxMSAyNzcuMzE2QzQ0MC43MzkgMjc3LjQzOCA0NDAuMjUzIDI3Ny41MDIgNDM5Ljc2NSAyNzcuNTA3TDI3Ny41NTMgMjc4Ljk0NkMyNzQuMjE5IDI3OC45NzYgMjcxLjUgMjc2LjI4MSAyNzEuNSAyNzIuOTQ3VjE2MS4yNzlDMjcxLjUgMTU4LjA1MyAyNzQuMDUxIDE1NS40MDQgMjc3LjI3NSAxNTUuMjgzTDMxMS41IDE1NEwzNDYuMDM0IDE1MC4wNTNDMzQ2LjM0NCAxNTAuMDE4IDM0Ni42NTEgMTQ5Ljk1OCAzNDYuOTUyIDE0OS44NzVMMzcwIDE0My41TDM4Ny4yNTUgMTM3Ljk5M1oiIGZpbGw9IiMwNjVCRjUiLz4KPC9zdmc+Cg==";
            const HIGHLIGHTED_MARKER_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTU1IiBoZWlnaHQ9Ijc3MCIgdmlld0JveD0iMCAwIDU1NSA3NzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yNzcuNSAwQzQzMC40MDIgMCA1NTUgMTMzLjI0NiA1NTUgMzA3Ljk5NUM1NTUgMzU2LjA0MiA1MzYuNDQyIDQwOC41NTYgNTEyLjkyNCA0NTYuOTg4QzQ4OC44ODUgNTA2LjQ5OSA0NTcuMjg2IDU1Ni41MSA0MjYuMzEgNjAwLjc4NEMzODguNDA5IDY1NC42NjkgMzQ3LjkyOCA3MDYuMjU1IDMwNS4wNDIgNzU1LjMyTDMwMi44OTIgNzU3Ljc0NkwzMDIuMzAyIDc1OC40TDMwMi4wOTQgNzU4LjYzMkwyNzcuNSA3MzEuNDg5TDMwMi4wNTkgNzU4LjY3QzI5OC44MzYgNzYyLjI2MSAyOTUuMDA1IDc2NS4xMSAyOTAuNzg4IDc2Ny4wNTVDMjg2LjU3MSA3NjguOTk5IDI4Mi4wNDkgNzcwIDI3Ny40ODIgNzcwQzI3Mi45MTYgNzcwIDI2OC4zOTQgNzY4Ljk5OSAyNjQuMTc3IDc2Ny4wNTVDMjU5Ljk1OSA3NjUuMTEgMjU2LjEyOSA3NjIuMjYxIDI1Mi45MDYgNzU4LjY3TDI1Mi42OTggNzU4LjRMMjUyLjEwOCA3NTcuNzQ2TDI0OS45NTggNzU1LjMyQzIzNy43MyA3NDEuMzQgMjI1LjcwNCA3MjcuMTQ1IDIxMy44ODMgNzEyLjc0QzE4NC4yMDQgNjc2LjY0NiAxNTUuNzg2IDYzOS4zIDEyOC42OSA2MDAuNzg0Qzk3Ljc0OTMgNTU2LjUxIDY2LjExNDYgNTA2LjQ2IDQyLjA3NjIgNDU3LjAyN0MxOC41NTggNDA4LjU1NyAwIDM1Ni4wNDIgMCAzMDcuOTk1QzAuMDAwMjAzMDk1IDEzMy4yNDYgMTI0LjU5OCAwIDI3Ny41IDBaIiBmaWxsPSIjMDY1QkY1Ii8+CjxyZWN0IHg9IjEzNiIgeT0iMjc1IiB3aWR0aD0iNDAiIGhlaWdodD0iMTQzIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIzNzciIHk9IjI3NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjE0MyIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMjIzIiB5PSIyNzYiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxNDIiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjMwMCIgeT0iMjc2IiB3aWR0aD0iMzAiIGhlaWdodD0iMTQyIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxMTgiIHk9IjM3MiIgd2lkdGg9IjMxOCIgaGVpZ2h0PSI0NiIgcng9IjEwIiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxNjciIHk9IjM1NyIgd2lkdGg9IjIzMCIgaGVpZ2h0PSIzNCIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMTEzIiB5PSIyNzIiIHdpZHRoPSIzMjkiIGhlaWdodD0iMjAiIHJ4PSI4IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTcyLjk5IDEzOS45ODZDMTY3LjIzOSAxMzguMTUxIDE2NC4zNjMgMTM3LjIzMyAxNjIuMTUgMTM4LjM4MUMxNTkuOTM3IDEzOS41MyAxNTguOTgyIDE0Mi41NyAxNTcuMDcxIDE0OC42NTFDMTUxLjYyNCAxNjUuOTg0IDE0My43NzggMTgxLjg5OSAxMzkuNDIgMTg5Ljg0N0MxMzguOTg1IDE5MC42NCAxMzguNzY4IDE5MS4wMzcgMTM4LjQ2NCAxOTEuNDI0QzEzOC4xNiAxOTEuODExIDEzNy44MDcgMTkyLjEzNSAxMzcuMTAxIDE5Mi43ODNMMTE1LjczOSAyMTIuMzY0QzExNS4xMiAyMTIuOTMxIDExNC44MTEgMjEzLjIxNSAxMTQuNDY3IDIxMy40NTJDMTE0LjEyMiAyMTMuNjg5IDExMy43NDcgMjEzLjg3NiAxMTIuOTk3IDIxNC4yNTJMNzkuMjYyOCAyMzEuMTE5Qzc4Ljg4MTUgMjMxLjMwOSA3OC42OTA5IDIzMS40MDUgNzguNDk0MiAyMzEuNDg2Qzc4LjI5NzUgMjMxLjU2OCA3OC4wOTUzIDIzMS42MzUgNzcuNjkwOSAyMzEuNzdMNjIuODY1OCAyMzYuNzExQzYyLjUxMDggMjM2LjgzIDYyLjMzMzIgMjM2Ljg4OSA2Mi4xNjQxIDIzNi45NTdDNjEuMTI1NCAyMzcuMzc1IDYwLjIyNDMgMjM4LjA3NSA1OS41NjI3IDIzOC45NzhDNTkuNDU1IDIzOS4xMjUgNTkuMzUzOSAyMzkuMjgzIDU5LjE1MTUgMjM5LjU5OFYyMzkuNTk4QzU4LjY5ODQgMjQwLjMwMyA1OC40NzE4IDI0MC42NTUgNTguMzExMSAyNDAuOTg5QzU3LjMwNDcgMjQzLjA4NCA1Ny41OTg4IDI0NS41NzIgNTkuMDY2IDI0Ny4zNzVDNTkuMzAwMiAyNDcuNjYzIDU5LjYwMjcgMjQ3Ljk1MyA2MC4yMDc3IDI0OC41MzJMNjcuMzIxNCAyNTUuMzVDNjcuNjYwNSAyNTUuNjc1IDY3LjgzMDEgMjU1LjgzNyA2OC4wMTE2IDI1NS45ODZDNjguMTkzMiAyNTYuMTM0IDY4LjM4NiAyNTYuMjY4IDY4Ljc3MTUgMjU2LjUzN0w3OS41IDI2NEw5Ni44MTEgMjcyLjg4OUM5Ny40MDQ5IDI3My4xOTQgOTcuNzAxOCAyNzMuMzQ3IDk4LjAxMzIgMjczLjQ2NUM5OC4zMjQ1IDI3My41ODQgOTguNjQ3NyAyNzMuNjY3IDk5LjI5NDIgMjczLjgzNEwxMTIuMDc3IDI3Ny4xMzNDMTEyLjc4OCAyNzcuMzE2IDExMy4xNDMgMjc3LjQwOCAxMTMuNTA2IDI3Ny40NTZDMTEzLjg2OSAyNzcuNTAzIDExNC4yMzYgMjc3LjUwNyAxMTQuOTY5IDI3Ny41MTNMMjcwLjM5NCAyNzguODkzQzI3Ni4wOTYgMjc4Ljk0MyAyNzguOTQ4IDI3OC45NjggMjgwLjcyNCAyNzcuMjA4QzI4Mi41IDI3NS40NDcgMjgyLjUgMjcyLjU5NiAyODIuNSAyNjYuODkzVjE2Ny4wNThDMjgyLjUgMTYxLjU5MyAyODIuNSAxNTguODYgMjgwLjgyMSAxNTcuMTE3QzI3OS4xNDMgMTU1LjM3NCAyNzYuNDEyIDE1NS4yNzIgMjcwLjk1IDE1NS4wNjdMMjQyLjUgMTU0TDIyNSAxNTJMMjA4LjQzMiAxNTAuMTA3QzIwNy45NjYgMTUwLjA1MyAyMDcuNzMzIDE1MC4wMjcgMjA3LjUwMyAxNDkuOTgyQzIwNy4yNzQgMTQ5LjkzNyAyMDcuMDQ4IDE0OS44NzUgMjA2LjU5NiAxNDkuNzVMMTg0IDE0My41TDE3Mi45OSAxMzkuOTg2WiIgZmlsbD0id2hpdGUiIHN0cm9rZT0id2hpdGUiLz4KPHBhdGggZD0iTTM4Ny4yNTUgMTM3Ljk5M0MzOTAuNjExIDEzNi45MjIgMzk0LjE1NyAxMzguOTYyIDM5NS4wODIgMTQyLjM2MUM0MDAuNjE1IDE2Mi42ODMgNDEwLjI5OCAxODIuMTU4IDQxNS4wMzcgMTkwLjY3NEM0MTUuMzQyIDE5MS4yMjQgNDE1LjczNiAxOTEuNzE2IDQxNi4yIDE5Mi4xNDFMNDM4Ljg4MSAyMTIuOTMyQzQzOS4yOTIgMjEzLjMwOSA0MzkuNzUzIDIxMy42MjYgNDQwLjI1MiAyMTMuODc2TDQ3NS4xMTkgMjMxLjMwOUM0NzUuMzczIDIzMS40MzYgNDc1LjYzNSAyMzEuNTQ1IDQ3NS45MDUgMjMxLjYzNUw0OTEuNDk0IDIzNi44MzFDNDkyLjc5MiAyMzcuMjY0IDQ5My45MDMgMjM4LjEyOCA0OTQuNjQ0IDIzOS4yNzlMNDk1LjMyOCAyNDAuMzQzQzQ5Ni44OCAyNDIuNzU3IDQ5Ni41MDQgMjQ1LjkzMyA0OTQuNDMyIDI0Ny45MTlMNDg2LjMzOSAyNTUuNjc1QzQ4Ni4xMTMgMjU1Ljg5MSA0ODUuODcxIDI1Ni4wOSA0ODUuNjE0IDI1Ni4yNjhMNDc0LjUgMjY0TDQ1Ni41OTQgMjczLjE5NUM0NTYuMTk5IDI3My4zOTggNDU1Ljc4MyAyNzMuNTU2IDQ1NS4zNTMgMjczLjY2N0w0NDEuMjExIDI3Ny4zMTZDNDQwLjczOSAyNzcuNDM4IDQ0MC4yNTMgMjc3LjUwMiA0MzkuNzY1IDI3Ny41MDdMMjc3LjU1MyAyNzguOTQ2QzI3NC4yMTkgMjc4Ljk3NiAyNzEuNSAyNzYuMjgxIDI3MS41IDI3Mi45NDdWMTYxLjI3OUMyNzEuNSAxNTguMDUzIDI3NC4wNTEgMTU1LjQwNCAyNzcuMjc1IDE1NS4yODNMMzExLjUgMTU0TDM0Ni4wMzQgMTUwLjA1M0MzNDYuMzQ0IDE1MC4wMTggMzQ2LjY1MSAxNDkuOTU4IDM0Ni45NTIgMTQ5Ljg3NUwzNzAgMTQzLjVMMzg3LjI1NSAxMzcuOTkzWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";
            const BOOKMARK_MARKER_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTU1IiBoZWlnaHQ9Ijc3MCIgdmlld0JveD0iMCAwIDU1NSA3NzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yNzcuNSAwQzQzMC40MDIgMCA1NTUgMTMzLjI0NiA1NTUgMzA3Ljk5NUM1NTUgMzU2LjA0MiA1MzYuNDQyIDQwOC41NTYgNTEyLjkyNCA0NTYuOTg4QzQ4OC44ODUgNTA2LjQ5OSA0NTcuMjg1IDU1Ni41MSA0MjYuMzEgNjAwLjc4NEMzODguNDA5IDY1NC42NjkgMzQ3LjkyOCA3MDYuMjU1IDMwNS4wNDIgNzU1LjMyTDMwMi44OTIgNzU3Ljc0NkwzMDIuMzAyIDc1OC40TDMwMi4wOTQgNzU4LjYzMkwzMDIuMDU5IDc1OC42N0MyOTguODM2IDc2Mi4yNjEgMjk1LjAwNiA3NjUuMTEgMjkwLjc4OSA3NjcuMDU1QzI4Ni41NzIgNzY4Ljk5OSAyODIuMDQ5IDc3MCAyNzcuNDgyIDc3MEMyNzIuOTE2IDc3MCAyNjguMzk0IDc2OC45OTkgMjY0LjE3NyA3NjcuMDU1QzI1OS45NTkgNzY1LjExIDI1Ni4xMjkgNzYyLjI2MSAyNTIuOTA2IDc1OC42N0wyNTIuNjk4IDc1OC40TDI1Mi4xMDggNzU3Ljc0NkwyNDkuOTU4IDc1NS4zMkMyMzcuNzMgNzQxLjM0IDIyNS43MDQgNzI3LjE0NSAyMTMuODgzIDcxMi43NEMxODQuMjA0IDY3Ni42NDYgMTU1Ljc4NiA2MzkuMyAxMjguNjkgNjAwLjc4NEM5Ny43NDkzIDU1Ni41MSA2Ni4xMTQ2IDUwNi40NiA0Mi4wNzYyIDQ1Ny4wMjdDMTguNTU4IDQwOC41NTcgMCAzNTYuMDQyIDAgMzA3Ljk5NUMwLjAwMDIwMzA5NSAxMzMuMjQ2IDEyNC41OTggMCAyNzcuNSAwWiIgZmlsbD0iIzA2NUJGNSIvPgo8cGF0aCBkPSJNMTc0LjA4MyA0MTguNjY3TDIwMS4xNjcgMzAxLjU4M0wxMTAuMzMzIDIyMi44MzNMMjMwLjMzMyAyMTIuNDE3TDI3NyAxMDJMMzIzLjY2NyAyMTIuNDE3TDQ0My42NjcgMjIyLjgzM0wzNTIuODMzIDMwMS41ODNMMzc5LjkxNyA0MTguNjY3TDI3NyAzNTYuNTgzTDE3NC4wODMgNDE4LjY2N1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=";

            const STARTPOINT_MARKER_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTU1IiBoZWlnaHQ9Ijc3MCIgdmlld0JveD0iMCAwIDU1NSA3NzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yNzcuNSAwQzQzMC40MDIgMCA1NTUgMTMzLjI0NiA1NTUgMzA3Ljk5NUM1NTUgMzU2LjA0MiA1MzYuNDQyIDQwOC41NTYgNTEyLjkyNCA0NTYuOTg4QzQ4OC44ODUgNTA2LjQ5OSA0NTcuMjg1IDU1Ni41MSA0MjYuMzEgNjAwLjc4NEMzODguNDA5IDY1NC42NjkgMzQ3LjkyOCA3MDYuMjU1IDMwNS4wNDIgNzU1LjMyTDMwMi44OTIgNzU3Ljc0NkwzMDIuMzAyIDc1OC40TDMwMi4wOTQgNzU4LjYzMkwzMDIuMDU5IDc1OC42N0MyOTguODM2IDc2Mi4yNjEgMjk1LjAwNiA3NjUuMTEgMjkwLjc4OSA3NjcuMDU1QzI4Ni41NzIgNzY4Ljk5OSAyODIuMDQ5IDc3MCAyNzcuNDgyIDc3MEMyNzIuOTE2IDc3MCAyNjguMzk0IDc2OC45OTkgMjY0LjE3NyA3NjcuMDU1QzI1OS45NTkgNzY1LjExIDI1Ni4xMjkgNzYyLjI2MSAyNTIuOTA2IDc1OC42N0wyNTIuNjk4IDc1OC40TDI1Mi4xMDggNzU3Ljc0NkwyNDkuOTU4IDc1NS4zMkMyMzcuNzMgNzQxLjM0IDIyNS43MDQgNzI3LjE0NSAyMTMuODgzIDcxMi43NEMxODQuMjA0IDY3Ni42NDYgMTU1Ljc4NiA2MzkuMyAxMjguNjkgNjAwLjc4NEM5Ny43NDkzIDU1Ni41MSA2Ni4xMTQ2IDUwNi40NiA0Mi4wNzYyIDQ1Ny4wMjdDMTguNTU4IDQwOC41NTcgMCAzNTYuMDQyIDAgMzA3Ljk5NUMwLjAwMDIwMzA5NSAxMzMuMjQ2IDEyNC41OTggMCAyNzcuNSAwWiIgZmlsbD0iIzA2NUJGNSIvPgo8cGF0aCBkPSJNMjYzLjY4NiAyNjcuOEwyNTEuMjg2IDI4NC42QzIxOC44ODYgMjc5LjggMTk4LjQ4NiAyNzIuMiAxODkuODg2IDI2MS42QzE4MC4yODYgMjcyIDE1OS40ODYgMjgwIDEyOC4wODYgMjg0LjZMMTE1LjI4NiAyNjhDMTQ2LjA4NiAyNjUuNCAxNjQuODg2IDI1OS40IDE3MS44ODYgMjUwLjRIMTI0LjY4NlYyMzQuNkgyNTQuNDg2VjI1MC4yTDIwNy4yODYgMjUwLjRDMjE0LjI4NiAyNTkuOCAyMzMuMDg2IDI2NS42IDI2My42ODYgMjY3LjhaTTIyNC44ODYgMjEwLjJWMjI2SDE1NC40ODZWMjEwLjJIMjI0Ljg4NlpNMjU1Ljg4NiAzNzVWMzkwLjZIMTMzLjY4NkMxMjkuNDg2IDM5MC42IDEyOC4wODYgMzg5LjIgMTI4LjA4NiAzODVWMzU0QzEyOC4wODYgMzUwIDEyOS40ODYgMzQ4LjQgMTMzLjY4NiAzNDguNEgyMjcuMjg2VjMzNi44SDEyOC4wODZWMzIxLjJIMTc3LjI4NlYzMDcuMkgxMDcuNDg2VjI5MS4ySDI3Mi40ODZWMzA3LjJIMjAxLjY4NlYzMjEuMkgyNDUuODg2QzI0OS42ODYgMzIxLjIgMjUxLjQ4NiAzMjMgMjUxLjQ4NiAzMjYuOFYzNTcuNEMyNTEuNDg2IDM2MS42IDI0OS44ODYgMzYzIDI0NS44ODYgMzYzSDE1Mi40ODZWMzc1SDI1NS44ODZaTTMxMy45IDI4MC42SDM1NC41VjI1OS40SDMxMy45VjI4MC42Wk0zNzYuNSAyMTcuNlYyOTMuNEMzNzYuNSAyOTcuNiAzNzQuOSAyOTkgMzcwLjkgMjk5SDI5Ni43QzI5Mi41IDI5OSAyOTEuMyAyOTcuNiAyOTEuMyAyOTMuNFYyMTcuNkgzMTMuOVYyNDEuMkgzNTQuNVYyMTcuNkgzNzYuNVpNNDI3LjUgMjY0LjRWMzA1LjRINDA0LjdWMjEyLjhINDI3LjVWMjQ1LjJINDUwLjNWMjY0LjRINDI3LjVaTTQzMS4zIDM3M1YzOTAuNkgzMTUuOUMzMTEuNyAzOTAuNiAzMTAuMyAzODkuMiAzMTAuMyAzODVWMzQ4LjZDMzEwLjMgMzQ0LjYgMzExLjcgMzQzIDMxNS45IDM0M0g0MDMuM1YzMjkuOEgzMTAuM1YzMTIuMkg0MjEuN0M0MjUuNSAzMTIuMiA0MjcuMyAzMTQgNDI3LjMgMzE3LjhWMzUzLjJDNDI3LjMgMzU3LjQgNDI1LjcgMzU4LjggNDIxLjcgMzU4LjhIMzM0LjVWMzczSDQzMS4zWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";
            const DESTINATION_MARKER_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTU1IiBoZWlnaHQ9Ijc3MCIgdmlld0JveD0iMCAwIDU1NSA3NzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yNzcuNSAwQzQzMC40MDIgMCA1NTUgMTMzLjI0NiA1NTUgMzA3Ljk5NUM1NTUgMzU2LjA0MiA1MzYuNDQyIDQwOC41NTYgNTEyLjkyNCA0NTYuOTg4QzQ4OC44ODUgNTA2LjQ5OSA0NTcuMjg1IDU1Ni41MSA0MjYuMzEgNjAwLjc4NEMzODguNDA5IDY1NC42NjkgMzQ3LjkyOCA3MDYuMjU1IDMwNS4wNDIgNzU1LjMyTDMwMi44OTIgNzU3Ljc0NkwzMDIuMzAyIDc1OC40TDMwMi4wOTQgNzU4LjYzMkwzMDIuMDU5IDc1OC42N0MyOTguODM2IDc2Mi4yNjEgMjk1LjAwNiA3NjUuMTEgMjkwLjc4OSA3NjcuMDU1QzI4Ni41NzIgNzY4Ljk5OSAyODIuMDQ5IDc3MCAyNzcuNDgyIDc3MEMyNzIuOTE2IDc3MCAyNjguMzk0IDc2OC45OTkgMjY0LjE3NyA3NjcuMDU1QzI1OS45NTkgNzY1LjExIDI1Ni4xMjkgNzYyLjI2MSAyNTIuOTA2IDc1OC42N0wyNTIuNjk4IDc1OC40TDI1Mi4xMDggNzU3Ljc0NkwyNDkuOTU4IDc1NS4zMkMyMzcuNzMgNzQxLjM0IDIyNS43MDQgNzI3LjE0NSAyMTMuODgzIDcxMi43NEMxODQuMjA0IDY3Ni42NDYgMTU1Ljc4NiA2MzkuMyAxMjguNjkgNjAwLjc4NEM5Ny43NDkzIDU1Ni41MSA2Ni4xMTQ2IDUwNi40NiA0Mi4wNzYyIDQ1Ny4wMjdDMTguNTU4IDQwOC41NTcgMCAzNTYuMDQyIDAgMzA3Ljk5NUMwLjAwMDIwMzA5NSAxMzMuMjQ2IDEyNC41OTggMCAyNzcuNSAwWiIgZmlsbD0iI0YwM0Q1QiIvPgo8cGF0aCBkPSJNMjcyLjQ4NiAzNTIuOFYzNzJIMTA3LjI4NlYzNTIuOEgxNzguMDg2VjMxMS40SDEzMy40ODZDMTI5LjI4NiAzMTEuNCAxMjguMDg2IDMxMCAxMjguMDg2IDMwNS44VjIyNi40QzEyOC4wODYgMjIyLjQgMTI5LjQ4NiAyMjAuOCAxMzMuNjg2IDIyMC44SDI1My4wODZWMjM5LjhIMTUxLjA4NlYyOTIuMkgyNTQuNjg2VjMxMS40SDIwMS40ODZWMzUyLjhIMjcyLjQ4NlpNMzY2LjkgMjEyVjIyOS4ySDMxMi4zVjIxMkgzNjYuOVpNMzk1LjcgMzAwLjJMMzgyLjUgMzE2LjZDMzczLjUgMzEzLjIgMzY1LjMgMzA4LjIgMzU3LjUgMzAyQzM0OS41IDI5NS40IDM0My41IDI4OS4yIDMzOS43IDI4My4yQzMzNi4zIDI5MC4yIDMzMC43IDI5Ny4yIDMyMi41IDMwNC4yQzMxNC43IDMxMS4yIDMwNS45IDMxNy4yIDI5Ni4xIDMyMS44TDI4MC41IDMwNS42QzI5MS45IDMwMi4yIDMwMy4xIDI5NS4yIDMxMS4zIDI4N0MzMjAuMSAyNzguMiAzMjUuMyAyNjguNCAzMjYuNyAyNTcuOEgyOTIuOVYyMzkuOEgzODYuMVYyNTcuOEgzNTEuMUMzNTIuNyAyNjggMzU5LjMgMjc3LjQgMzY3LjUgMjg0LjhDMzc1LjcgMjkyLjIgMzg2LjEgMjk3LjggMzk1LjcgMzAwLjJaTTQyOS4xIDI3NVYzMjMuMkg0MDYuN1YyMTIuOEg0MjkuMVYyNTUuOEg0NTIuN1YyNzVINDI5LjFaTTQyOS4zIDMzNi40VjM5Mi42SDQwNi4xVjM1MEgzMDguMVYzMzAuOEg0MjMuN0M0MjcuNSAzMzAuOCA0MjkuMyAzMzIuNiA0MjkuMyAzMzYuNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=";
            const STOPOVER_MARKER_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTU1IiBoZWlnaHQ9Ijc3MCIgdmlld0JveD0iMCAwIDU1NSA3NzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yNzcuNSAwQzQzMC40MDIgMCA1NTUgMTMzLjI0NiA1NTUgMzA3Ljk5NUM1NTUgMzU2LjA0MiA1MzYuNDQyIDQwOC41NTYgNTEyLjkyNCA0NTYuOTg4QzQ4OC44ODUgNTA2LjQ5OSA0NTcuMjg1IDU1Ni41MSA0MjYuMzEgNjAwLjc4NEMzODguNDA5IDY1NC42NjkgMzQ3LjkyOCA3MDYuMjU1IDMwNS4wNDIgNzU1LjMyTDMwMi44OTIgNzU3Ljc0NkwzMDIuMzAyIDc1OC40TDMwMi4wOTQgNzU4LjYzMkwzMDIuMDU5IDc1OC42N0MyOTguODM2IDc2Mi4yNjEgMjk1LjAwNiA3NjUuMTEgMjkwLjc4OSA3NjcuMDU1QzI4Ni41NzIgNzY4Ljk5OSAyODIuMDQ5IDc3MCAyNzcuNDgyIDc3MEMyNzIuOTE2IDc3MCAyNjguMzk0IDc2OC45OTkgMjY0LjE3NyA3NjcuMDU1QzI1OS45NTkgNzY1LjExIDI1Ni4xMjkgNzYyLjI2MSAyNTIuOTA2IDc1OC42N0wyNTIuNjk4IDc1OC40TDI1Mi4xMDggNzU3Ljc0NkwyNDkuOTU4IDc1NS4zMkMyMzcuNzMgNzQxLjM0IDIyNS43MDQgNzI3LjE0NSAyMTMuODgzIDcxMi43NEMxODQuMjA0IDY3Ni42NDYgMTU1Ljc4NiA2MzkuMyAxMjguNjkgNjAwLjc4NEM5Ny43NDkzIDU1Ni41MSA2Ni4xMTQ2IDUwNi40NiA0Mi4wNzYyIDQ1Ny4wMjdDMTguNTU4IDQwOC41NTcgMCAzNTYuMDQyIDAgMzA3Ljk5NUMwLjAwMDIwMzA5NSAxMzMuMjQ2IDEyNC41OTggMCAyNzcuNSAwWiIgZmlsbD0iIzA2NUJGNSIvPgo8cGF0aCBkPSJNMjU3LjY4NiAzNzMuNkMyNTQuMjg2IDM3OC4yIDI0OS44ODYgMzgyLjIgMjQ0LjQ4NiAzODUuNEMyMzMuMDg2IDM5MS44IDIxNy4wODYgMzk1IDE5OC42ODYgMzk1QzE4MC4yODYgMzk1IDE2NC40ODYgMzkxLjggMTUzLjI4NiAzODUuNEMxNDEuODg2IDM3OSAxMzUuMjg2IDM2OS42IDEzNS4yODYgMzU3LjRDMTM1LjI4NiAzNDUuNCAxNDIuMjg2IDMzNi4yIDE1My42ODYgMzI5LjZDMTY1LjA4NiAzMjMuMiAxODEuMDg2IDMxOS42IDE5OC44ODYgMzE5LjZDMjE3LjI4NiAzMTkuNiAyMzMuMDg2IDMyMy4yIDI0NC40ODYgMzI5LjZDMjU1LjY4NiAzMzYgMjYyLjY4NiAzNDUuNCAyNjIuNjg2IDM1Ny40QzI2Mi42ODYgMzYzLjYgMjYxLjA4NiAzNjkgMjU3LjY4NiAzNzMuNlpNMjI3LjI4NiAzNzEuNkMyMzQuMjg2IDM2OC4yIDIzOC4yODYgMzYzLjIgMjM4LjI4NiAzNTdDMjM4LjI4NiAzNDQuMiAyMjMuMDg2IDMzNy40IDE5OC44ODYgMzM3LjRDMTc1LjY4NiAzMzcuNCAxNTkuNDg2IDM0NC44IDE1OS40ODYgMzU3QzE1OS40ODYgMzYzLjIgMTYzLjA4NiAzNjguMiAxNzAuNDg2IDM3MS44QzE3Ny44ODYgMzc1LjYgMTg3LjI4NiAzNzcuNCAxOTguODg2IDM3Ny40QzIxMC42ODYgMzc3LjQgMjIwLjI4NiAzNzUuNCAyMjcuMjg2IDM3MS42Wk0xMjEuNjg2IDIyMEgxOTkuNDg2QzIwMy4yODYgMjIwIDIwNS4wODYgMjIxLjggMjA1LjA4NiAyMjUuNkMyMDAuMjg2IDI2NyAxNzYuMjg2IDMwMC42IDEyNS4wODYgMzE3LjJMMTExLjA4NiAzMDAuOEMxNTEuMjg2IDI4OS42IDE3My4wODYgMjY4LjIgMTc5LjY4NiAyMzkuMkgxMjEuNjg2VjIyMFpNMjYwLjQ4NiAyMTIuNlYzMTkuMkgyMzcuODg2VjI5NC42SDIwMy44ODZWMjc2SDIzOC4wODZWMjU1SDIwNy42ODZWMjM2LjRIMjM3Ljg4NlYyMTIuNkgyNjAuNDg2Wk00MjkuOSAyNTUuOEM0MjkuOSAyNjguNCA0MjQuMSAyNzguNiA0MTIuMyAyODYuNEM0MDAuNyAyOTQgMzg0LjcgMjk3LjggMzY0LjMgMjk3LjhDMzQzLjcgMjk3LjggMzI3LjcgMjk0IDMxNi4xIDI4Ni40QzMwNC41IDI3OC42IDI5OC43IDI2OC40IDI5OC43IDI1NS44QzI5OC43IDI0My42IDMwNC45IDIzMy4yIDMxNi4xIDIyNS44QzMyNy4zIDIxOC40IDM0My41IDIxNCAzNjQuMyAyMTRDMzg0LjUgMjE0IDQwMS4xIDIxOC40IDQxMi4zIDIyNS44QzQyMy41IDIzMy4yIDQyOS45IDI0My42IDQyOS45IDI1NS44Wk0zOTMuNyAyNzIuNkM0MDEuNSAyNjguNCA0MDUuMyAyNjIuOCA0MDUuMyAyNTUuOEM0MDUuMyAyNDEuNCAzODguNSAyMzMgMzY0LjMgMjMzQzMzOS41IDIzMyAzMjMuMyAyNDEuNCAzMjMuMyAyNTUuOEMzMjMuMyAyNzAuMiAzNDAuMSAyNzguNiAzNjQuMyAyNzguNkMzNzYuMyAyNzguNiAzODYuNSAyNzYuNiAzOTMuNyAyNzIuNlpNNDA2LjEgMzMxLjhWMzkxLjhIMzgzLjdWMzMxLjhIMzQ2LjFWMzkwLjJIMzIzLjNWMzMxLjhIMjgxLjlWMzEyLjZINDQ2LjlWMzMxLjhINDA2LjFaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";



            window.map = null;           // 지도
            window.userMarker = null;    // 사용자 위치 마커
            window.userCircle = null;    // 사용자 반경 원
            window.heritageMarkers = []; // 근처 유적지 마커 배열
            window.buttonHeritageMarkers = []; // 버튼으로 검색된 유적지 마커 배열
            window.focusedMarker = null; // 검색한 유적지 마커
            window.highlightedMarker = null; // 현재 하이라이트된 마커
            window.bookmarkMarkers = []; // 북마크된 유적지 마커 배열
            
            
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
                  const icon =
                    idx === 0 ? STARTPOINT_MARKER_ICON :
                    idx === routePoints.length - 1 ? DESTINATION_MARKER_ICON :
                    STOPOVER_MARKER_ICON;
                  
                  const marker = new Tmapv2.Marker({
                    position: pos,
                    icon: icon,
                    iconSize: new Tmapv2.Size(90, 90),
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
                
                icon:  STARTPOINT_MARKER_ICON,
                iconSize: new Tmapv2.Size(90, 90),
                map: window.map,
              });
              
              const markerEnd = new Tmapv2.Marker({
                position: new Tmapv2.LatLng(end.lat, end.lon),
                icon: DESTINATION_MARKER_ICON,
                iconSize: new Tmapv2.Size(90, 90),
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
              const icon =
                    idx === 0 ? STARTPOINT_MARKER_ICON :
                    idx === routePoints.length - 1 ? DESTINATION_MARKER_ICON :
                    STOPOVER_MARKER_ICON;
                  
                  const marker = new Tmapv2.Marker({
                    position: pos,
                    icon: icon,
                    iconSize: new Tmapv2.Size(90, 90),
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
              // 기존 유적지 마커 지우기
              clearHeritageMarkers();


              // 좌표를 key로 그룹핑된 유적지를 담는 객체
              const groupedByPosition = {};
              
              // 유적지 배열 순회하면서 북마크되지 않은 유적지만 그룹핑
              heritages.forEach((heritage) => {
                // 해당 위치에 북마크 마커가 있는지 확인
                const isBookmarked = window.bookmarkMarkers.some(marker => {
                  const pos = marker.getPosition();
                  return pos.lat() === heritage.latitude && pos.lng() === heritage.longitude;
                });

                // 북마크되지 않은 유적지만 그룹핑
                if (!isBookmarked) {
                  const key = heritage.latitude + "," + heritage.longitude;
                  if (!groupedByPosition[key]) {
                    groupedByPosition[key] = [];
                  }
                  groupedByPosition[key].push(heritage);
                }
              });

              // 그룹핑된 좌표 기준으로 마커 생성
              Object.entries(groupedByPosition).forEach(([key, group]) => {
                const [lat, lng] = key.split(",").map(Number);
                const pos = new Tmapv2.LatLng(lat, lng);
                const firstName = group[0].name;
                const count = group.length;
                
                const marker = new Tmapv2.Marker({
                  position: pos,
                  animation: Tmapv2.MarkerOptions.ANIMATE_BOUNCE_ONCE,
                  icon: DEFAULT_MARKER_ICON,
                  iconSize: new Tmapv2.Size(90, 90),
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
                  
                  position: new Tmapv2.LatLng(lat, lng),
                  animation: Tmapv2.MarkerOptions.ANIMATE_BALLOON,
                  icon: USER_MARKER_ICON,
                  iconSize: new window.Tmapv2.Size(60, 60),
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
                    icon: HIGHLIGHTED_MARKER_ICON,
                    iconSize: new Tmapv2.Size(90, 90),
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

                // 사용자 반경 원과 유적지 마커 표시/숨기기
                if (data.type === "TOGGLE_MAP_ELEMENTS") {
                  const { show } = data.payload;
                  if (window.userCircle) {
                    window.userCircle.setVisible(show);
                  }
                  if (window.userMarker) {
                    window.userMarker.setVisible(show);
                  }
                  window.heritageMarkers.forEach(marker => {
                    marker.setVisible(show);
                  });
                  // 북마크 마커도 show 상태에 따라 처리
                  if (show) {
                    // 북마크 마커 다시 표시 요청
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: "REQUEST_BOOKMARK_MARKERS"
                      }));
                    }
                  } else {
                    clearBookmarkMarkers();
                  }
                }

                // 유적지 마커 하이라이트
                if (data.type === "HIGHLIGHT_HERITAGE_MARKER") {
                  const { id, latitude, longitude } = data.payload;
                          
                  // 해당 위치에 북마크 마커가 있는지 확인
                  const isBookmarked = window.bookmarkMarkers.some(marker => {
                    const pos = marker.getPosition();
                    return pos.lat() === latitude && pos.lng() === longitude;
                  });

                  // 북마크된 유적지가 아닐 경우에만 하이라이트 마커 처리
                  if (!isBookmarked) {
                    // 기존 하이라이트 마커 제거
                    if (window.highlightedMarker) {
                      window.highlightedMarker.setMap(null);
                      window.highlightedMarker = null;
                    }

                    // 하이라이트 마커 생성
                    const pos = new Tmapv2.LatLng(latitude, longitude);
                    const marker = new Tmapv2.Marker({
                      position: pos,
                      icon: HIGHLIGHTED_MARKER_ICON,
                      iconSize: new Tmapv2.Size(90, 90),
                      map: window.map,
                    });

                    // 하이라이트 마커 설정
                    window.highlightedMarker = marker;
                  }
                }

                if (data.type === "REMOVE_HERITAGE_HIGHLIGHT") {
                  if (window.highlightedMarker) {
                    window.highlightedMarker.setMap(null);
                    window.highlightedMarker = null;
                  }
                }

                // 북마크된 유적지 마커 표시
                if (data.type === "SHOW_BOOKMARK_MARKERS") {
                  renderBookmarkMarkers(data.payload);
                }

                // 북마크된 유적지 마커 제거
                if (data.type === "HIDE_BOOKMARK_MARKERS") {
                  clearBookmarkMarkers();
                }

                // 지도 중심과 경계 정보 요청 처리
                if (data.type === "GET_MAP_CENTER_AND_BOUNDS") {
                  const center = window.map.getCenter();
                  const bounds = window.map.getBounds();

                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                      type: "MAP_CENTER_AND_BOUNDS",
                      payload: {
                        center,
                        bounds,
                      },
                    })
                  );
                }

                if (data.type === "SHOW_BUTTON_HERITAGES") {
                  renderButtonHeritageMarkers(data.payload);
                }
              } catch (e) {
                console.error("메시지 처리 오류:", e);
              }
            });

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

                // 북마크된 유적지 마커 표시
                if (data.type === "SHOW_BOOKMARK_MARKERS") {
                  renderBookmarkMarkers(data.payload);
                }

                if (data.type === "HIDE_BOOKMARK_MARKERS") {
                  clearBookmarkMarkers();
                }

              } catch (e) {
                console.error("메시지 처리 오류:", e);
              }
            });

            // 북마크 마커 지우기 메서드
            function clearBookmarkMarkers() {
              window.bookmarkMarkers.forEach((marker) => marker.setMap(null));
              window.bookmarkMarkers = [];
            }

            // 버튼 마커 지우기 메서드
            function clearButtonHeritageMarkers() {
              window.buttonHeritageMarkers.forEach((marker) => marker.setMap(null));
              window.buttonHeritageMarkers = [];
            }

            // 버튼 마커 렌더링 메서드
            function renderButtonHeritageMarkers(heritages) {
              clearButtonHeritageMarkers();

              
              // 좌표를 key로 그룹핑된 유적지를 담는 객체
              const groupedByPosition = {};
              
              // 유적지 배열 순회하면서 북마크되지 않은 유적지만 그룹핑
              heritages.forEach((heritage) => {
                // 이미 일반 마커나 북마크 마커로 표시된 유적지는 건너뛰기
                const isAlreadyMarked = window.heritageMarkers.some(marker => {
                  const pos = marker.getPosition();
                  return pos.lat() === heritage.latitude && pos.lng() === heritage.longitude;
                }) || window.bookmarkMarkers.some(marker => {
                  const pos = marker.getPosition();
                  return pos.lat() === heritage.latitude && pos.lng() === heritage.longitude;
                });

                // 이미 표시되지 않은 유적지만 그룹핑
                if (!isAlreadyMarked) {
                  const key = heritage.latitude + "," + heritage.longitude;
                  if (!groupedByPosition[key]) {
                    groupedByPosition[key] = [];
                  }
                  groupedByPosition[key].push(heritage);
                }
              });

              // 그룹핑된 좌표 기준으로 마커 생성
              Object.entries(groupedByPosition).forEach(([key, group]) => {
                const [lat, lng] = key.split(",").map(Number);
                const pos = new Tmapv2.LatLng(lat, lng);
                
                const marker = new Tmapv2.Marker({
                  position: pos,
                  animation: Tmapv2.MarkerOptions.ANIMATE_BOUNCE_ONCE,
                  icon: DEFAULT_MARKER_ICON,
                  iconSize: new Tmapv2.Size(90, 90),
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

                // buttonHeritageMarkers 배열에 추가
                window.buttonHeritageMarkers.push(marker);
              });
            }

            // 북마크 마커 렌더링 메서드
            function renderBookmarkMarkers(bookmarks) {
              // 기존 북마크 마커 지우기
              clearBookmarkMarkers();

              // 북마크된 유적지들의 마커 생성
              bookmarks.forEach((heritage) => {
                const pos = new Tmapv2.LatLng(heritage.latitude, heritage.longitude);
                
                const marker = new Tmapv2.Marker({
                  position: pos,
                  animation: Tmapv2.MarkerOptions.ANIMATE_BALLOON,
                  icon: BOOKMARK_MARKER_ICON,
                  iconSize: new Tmapv2.Size(90, 90),
                  map: window.map,
                });

                // 마커 클릭/터치 이벤트 핸들러 (WebView -> RN)
                const handleMarkerInteraction = () => {
                  const message = {
                    type: "HERITAGE_MARKER_CLICKED",
                    payload: {
                      heritages: [heritage],
                      latitude: heritage.latitude,
                      longitude: heritage.longitude,
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

                window.bookmarkMarkers.push(marker);
              });
            }

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
