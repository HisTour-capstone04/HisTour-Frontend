# Histour
## 프로젝트 소개


## 사용 스택
### Environment
<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=Figma&logoColor=white">

### Development
<img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"> <img src="https://img.shields.io/badge/react%20native-61DAFB?style=for-the-badge&logo=react&logoColor=black"> <img src="https://img.shields.io/badge/react-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Expo-1C2024?style=for-the-badge&logo=Expo&logoColor=white"> <img src="https://img.shields.io/badge/html5-E34F26?style=for-the-badge&logo=html5&logoColor=white"> <img src="https://img.shields.io/badge/css-663399?style=for-the-badge&logo=css&logoColor=white">

## 기능 소개
### 데모 영상
[![image](https://github.com/user-attachments/assets/a3defa63-0724-4a01-9734-cb86a4494c1d)](https://youtu.be/CoeC7rlyzjk?si=LPyyvEb-bvYpmj6N)
앱의 주요 기능을 설명 및 시연하는 데모 영상입니다. 클릭 시 새로운 창에서 영상이 재생됩니다.

### 🔐 로그인/회원가입
- 이메일과 비밀번호를 입력하여 간편하게 로그인할 수 있습니다.
- 신규 사용자는 이름, 이메일, 비밀번호를 입력하여 회원가입이 가능합니다.
- 잘못된 정보 입력 시 재입력을 안내합니다.

### 🏠 홈 화면
> 구성 : 검색창, 슬라이더 바, 지도, 슬라이드 패널, 아코디언 버튼 (챗봇/지도 중심 재설정/지도 상 유적지 조회 버튼)
- 유적지를 검색할 수 있는 검색창이 제공됩니다.
- 유적지를 조회할 반경을 설정할 수 있는 슬라이더 바가 있습니다. 반경은 최소 0m부터 최대 2km까지 설정할 수 있습니다.
- 사용자의 위치 마커, 설정한 반경 원, 그리고 주변 유적지 마커들이 지도 상에 표시됩니다. 동일한 위치에 여러 유적지가 있을 경우 하나의 마커로 그룹화됩니다.
- 특정 유적지의 마커를 클릭하면, 해당 유적지의 정보가 담긴 슬라이드 패널이 화면 하단에서 위로 올라오며 제공됩니다.
- 챗봇 화면 이동 버튼, 지도 중심을 현재 사용자 위치로 재설정하는 버튼, 현재 지도 상 모든 유적지를 조회하는 버튼이 제공되며, 이 세 가지 버튼은 아코디언 버튼으로 관리됩니다.

### 📍 주변 정보
- 사용자의 주변에 있는 유적지에 대한 상세 정보(이름, 거리, 상세 주소, 설명, 사진)를 제공합니다.
- 북마크, 장바구니, 출발지/도착지 설정, 챗봇 버튼을 통해 다양한 기능을 이용할 수 있습니다.

### 🗺️ 길찾기
- 자동차/대중교통/도보 길찾기를 지원합니다.
- 출발지, 목적지와 최대 5개의 경유지를 설정할 수 있습니다.
- 경로를 설정하여 길찾기 모드에 진입 시 지도 상에 출발지/경유지/목적지 마커와 경로가 표시됩니다.
- 드래그하여 경로 상 유적지들의 순서를 변경하고, 제거 버튼을 눌러 필요 없는 경유지를 삭제할 수 있습니다.

### ⭐ 북마크
- 북마크한 유적지에 대한 상세 정보(이름, 거리, 상세 주소, 설명, 사진)를 제공합니다.
- 북마크한 유적지는 지도 상에 별 모양 마커로 항상 표시됩니다.

### 👤 마이 페이지
- 사용자의 위치, 북마크, 날씨 등을 고려한 맞춤형 유적지 추천을 제공합니다.
- 추천 이유를 함께 제공하여 신뢰도 높은 추천 경험을 제공합니다.

### 🔍 검색
- 원하는 유적지를 검색할 수 있으며, 최근 검색어 15개까지 저장됩니다.
- 검색 결과는 지도에 바로 표시되고, 슬라이드 패널로 정보를 확인할 수 있습니다.

### 💬 챗봇
- 유적지에 대한 궁금증을 챗봇을 통해 바로 해결할 수 있습니다.
- 답변은 음성(TTS)으로도 들을 수 있으며, 자동 음성 설정이 가능합니다.
- 꼬리질문 버튼으로 추가 질문, 목적지 설정, 장바구니 추가 기능을 손쉽게 이용할 수 있습니다.

### 🔔 푸시 알림
- 5분마다 사용자의 위치를 기반으로 새로운 유적지 발견 시 푸시 알림을 제공합니다.
- 가장 가까운 유적지와 새로 발견된 유적지 개수를 한 번에 확인할 수 있습니다.


## 파일 디렉토리 구조
```
Histour/
├── assets/                   
│   ├── images/
│   │   └── map/              # 지도 관련 마커 이미지들
│   ├── adaptive-icon.png     # 로딩 화면 아이콘 (Android)
│   ├── favicon.png           # 파비콘
│   ├── icon.png              # 앱 아이콘
│   ├── splash-icon.png       # 로딩 화면 아이콘 (iOS)
│   └── heritage.svg          # 유적지 아이콘
├── components/               
│   ├── MapWebView.js         # 웹뷰 기반 지도
│   ├── RecenterMapButton.js  # 지도 중심 재설정 버튼
│   ├── HeritageFindButton.js # 현재 지도 내 유적지 조회 버튼
│   ├── ChatbotButton.js      # 챗봇 버튼
│   └── AccordionButton.js    # 아코디언 버튼
├── screens/                  
│   ├── AuthScreen.js          # 로그인/회원가입 화면
│   ├── SearchScreen.js        # 검색 화면
│   ├── ChatbotScreen.js       # 챗봇 화면
│   ├── ChatbotConfigScreen.js # 챗봇 설정 화면
│   ├── ConfigScreen.js        # 설정 화면
│   └── Home/                       
│       ├── HomeScreen.js           # 홈 화면
│       ├── HeritageDetailPanel.js  # 유적지 상세 슬라이드 패널
│       ├── SlidePanel.js           # 슬라이드 패널
│       ├── SearchBar.js            # 검색 바
│       ├── RangeSlider.js          # 범위 슬라이더
│       ├── FooterTabBar.js         # 하단 탭 바
│       └── panels/                 # 슬라이드 패널 상 표시될 컨텐츠들
│           ├── BookmarkPanel.js    # 북마크 탭
│           ├── NearbyPanel.js      # 주변 정보 탭
│           ├── MyPagePanel.js      # 마이 페이지 탭
│           └── DirectionsPanel.js  # 길찾기 탭
├── contexts/                 
│   ├── AuthContext.js                 # 인증 상태 관리
│   ├── BookmarkContext.js             # 북마크 상태 관리
│   ├── HeritageContext.js             # 유적지 데이터 관리
│   ├── HeritageNotificationContext.js # 푸시 알림 관리
│   ├── RouteContext.js                # 길찾기 경로 상태 관리
│   ├── RouteModeContext.js            # 길찾기 모드 관리
│   ├── UserLocationContext.js         # 사용자 위치 관리
│   └── ViaContext.js                  # 장바구니 유적지 관리
├── navigation/               
│   └── MainNavigator.js      # 메인 네비게이터
├── theme/                    
│   └── colors.js             # 테마 색상 정의
└── hooks/                    
    └── useDebouncedValue.js  # 디바운싱 용 커스텀 훅
```


