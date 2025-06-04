import * as Notifications from "expo-notifications";
import axios from "axios";
import * as Device from "expo-device";
import { IP_ADDRESS } from "../../config/apiKeys";

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class HeritageNotificationService {
  constructor() {
    this.intervalId = null;
    this.accessToken = null;
  }

  // 토큰 설정
  setAccessToken(token) {
    this.accessToken = token;
  }

  // 알림 권한 요청
  async requestPermissions() {
    if (!Device.isDevice) {
      alert("실제 디바이스에서만 알림을 받을 수 있습니다.");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("알림 권한이 필요합니다.");
      return false;
    }

    return true;
  }

  // 주변 유적지 확인 및 알림 전송
  async checkNearbyHeritages(latitude, longitude, radius = 500) {
    if (!this.accessToken) {
      console.error("인증 토큰이 없습니다.");
      return;
    }

    try {
      const response = await axios.get(
        `http://${IP_ADDRESS}:8080/api/heritages/nearby-for-alarm`,
        {
          params: {
            latitude,
            longitude,
            radius,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data.data) {
        // 알림 전송
        await this.sendNotification(response.data.data.message);
      }
    } catch (error) {
      if (error.response?.status === 500) {
        console.log("서버 오류로 인해 알림을 보내지 않습니다.");
        return;
      }
      console.error("유적지 확인 중 오류 발생:", error);
    }
  }

  // 알림 전송
  async sendNotification(message) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "주변 유적지 알림",
          body: message,
          data: { type: "heritage_alert" },
        },
        trigger: null, // 즉시 전송
      });
    } catch (error) {
      console.error("알림 전송 중 오류 발생:", error);
    }
  }

  // 주기적 확인 시작
  startPeriodicCheck(latitude, longitude, radius = 1000) {
    if (!this.accessToken) {
      console.error("인증 토큰이 없어 알림 서비스를 시작할 수 없습니다.");
      return;
    }

    if (this.intervalId) {
      this.stopPeriodicCheck();
    }

    // 초기 실행
    this.checkNearbyHeritages(latitude, longitude, radius);

    // 0.5분마다 실행
    this.intervalId = setInterval(() => {
      this.checkNearbyHeritages(latitude, longitude, radius);
    }, 0.5 * 60 * 1000); // 0.5분을 밀리초로 변환
  }

  // 주기적 확인 중지
  stopPeriodicCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default new HeritageNotificationService();
