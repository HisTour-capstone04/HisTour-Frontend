import { AppState } from "react-native";
import * as TaskManager from "expo-task-manager";
import { locationEmitter } from "./LocationUpdateEmitter";
export const LOCATION_TASK_NAME = "background-location-task";

let lastLat = null;
let lastLng = null;

// 백그라운드 위치 바뀌었을 때 실행할 작업 정의
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  console.log("🔥 defineTask 호출됨!");

  if (error) {
    console.error("백그라운드 위치 에러:", error);
    return;
  }
  if (data && data.locations && data.locations.length > 0) {
    const { latitude, longitude } = data.locations[0].coords;

    const roundedLat = Math.round(latitude * 1e5) / 1e5;
    const roundedLng = Math.round(longitude * 1e5) / 1e5;

    if (roundedLat === lastLat && roundedLng === lastLng) {
      console.log("⚠️ 동일 좌표 → defineTask 처리 생략됨");
      return;
    }

    lastLat = roundedLat;
    lastLng = roundedLng;
    console.log("📍 백그라운드 위치:", latitude, longitude);
    console.log("📤 백그라운드 emit");
    locationEmitter.emit("updateLocation", { latitude, longitude });
  }
});
