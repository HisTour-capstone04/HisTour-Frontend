// contexts/UserLocationTask.js
import * as TaskManager from "expo-task-manager";
import * as FileSystem from "expo-file-system";

export const LOCATION_TASK_NAME = "background-location-task";
const LOG_FILE_PATH = FileSystem.documentDirectory + "location-log.txt";

// 백그라운드 위치 바뀌었을 때 실행할 작업 정의
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  console.log("🔥 defineTask 호출됨!");

  if (error) {
    console.error("백그라운드 위치 에러:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log("📍 백그라운드 위치:", locations);
  }
});
