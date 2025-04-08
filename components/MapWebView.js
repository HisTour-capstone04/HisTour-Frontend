import React from "react";
import { WebView } from "react-native-webview";

export default function MapWebView({ userLocation }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Histour 지도</title>
      <script src="https://apis.openapi.sk.com/tmap/vectorjs?version=1&appKey=M2yCxkJIUu3iIcsWIeUjP6vyGY2D3Iz72I8bFtHV"></script>
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
        }
        #map_div {
          width: 100%;
          height: 100%;
        }
      </style>
      <script>
      var map;
        function initTmap() {
            map = new Tmapv3.Map("map_div", {
            center: new Tmapv3.LatLng(${userLocation.latitude}, ${userLocation.longitude}),
            width: "100%",
            height: "100%",
            zoom: 17
          });

          //Marker 객체 생성.
		    var marker = new Tmapv3.Marker({
			position: new Tmapv3.LatLng(${userLocation.latitude}, ${userLocation.longitude}),	//Marker의 중심좌표 설정.
			map: map	//Marker가 표시될 Map 설정..
		});

        }
      </script>
    </head>
    <body onload="initTmap()">
      <div id="map_div"></div>
    </body>
    </html>
    `;

  const injectedJS = userLocation
    ? `
        (function() {
          var map = new Tmapv3.Map("map_div", {
            center: new Tmapv3.LatLng(${userLocation.latitude}, ${userLocation.longitude}),
            width: "100%",
            height: "100%",
            zoom: 16
          });

          new Tmapv3.Marker({
            position: new Tmapv3.LatLng(${userLocation.latitude}, ${userLocation.longitude}),
            map: map
          });
        })();
      `
    : "";

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      injectedJavaScript={injectedJS}
    />
  );
}
