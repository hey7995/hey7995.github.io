# 전기기사 학습장

전기기사 필기 대비 기초 복구 24일 교재를 읽고, 연습문제를 풀고, 진도와 오답 노트를 기록하는 설치형 웹앱(PWA)입니다.

- 주소: https://hey7995.github.io/tools/jgisa/
- 아이폰: Safari로 열고 공유 버튼 → "홈 화면에 추가"
- 안드로이드: Chrome으로 열고 메뉴 → "앱 설치"
- 컴퓨터: Chrome 또는 Edge 주소창의 설치 아이콘

## 하는 일

- 오늘: 계획표 순서대로 다음 Day 를 자동으로 보여 주고, 재풀이 시기가 된 오답을 모아 보여 줍니다.
- 교재: Day 1~24 개념, 공식, 예제, 연습문제와 공식 요약. 연습문제에서 "틀렸어요"를 누르면 오답 노트에 자동으로 담깁니다.
- 진도: 학습일, 시간, 맞은 개수, 이해도, 메모와 주간 점검, 일정(시작일·시험일), 계정·동기화, 백업·복원.
- 오답: 3일 뒤·7일 뒤 재풀이(O/X)를 기록하고, 두 번 맞으면 졸업 처리합니다.
- 통계: 주차별 현황, 오류 유형 집계, 복습 추천.

## 파일 구성

- `index.html` 앱 본체
- `content.js` 교재 콘텐츠(24일). 내용을 고치거나 Day 를 추가할 때 이 파일을 수정합니다.
- `firebase-config.js` 동기화 설정(비어 있으면 이 기기에만 저장)
- `sw.js` 오프라인 동작. 파일을 고쳐서 올릴 때는 맨 위 `CACHE` 숫자를 올려야 폰에 반영됩니다.
- `../jgisa.html` 홈페이지 목록용 안내 페이지(`build-index.mjs`가 읽는 메타데이터)

## 데이터 저장

기록은 브라우저 localStorage 에 저장되고, 동기화를 켜면 계정에도 올라갑니다.
아이폰에서는 Safari 에서 입력한 기록과 홈 화면에 설치한 앱의 기록이 서로 따로 보관됩니다. 설치한 앱에서 쓰거나, 백업 파일로 옮기세요.
`진도` 탭의 "백업 파일 내려받기"로 JSON 을 받아 두고, 다른 기기에서 "백업 파일 불러오기"로 복원할 수 있습니다.

## 동기화(선택): Firebase 설정

로그인과 기기 간 동기화는 Firebase(Authentication + Firestore)를 씁니다. 무료 요금제로 충분합니다.

1. https://console.firebase.google.com 에서 프로젝트를 만듭니다.
2. Authentication → 시작하기 → 로그인 방법에서 "이메일/비밀번호"를 사용 설정합니다. 설정 → 승인된 도메인에 `hey7995.github.io` 를 추가합니다.
3. Firestore Database → 데이터베이스 만들기(위치 `asia-northeast3` 서울, 프로덕션 모드).
4. Firestore 의 "규칙" 탭에 아래를 붙여넣고 게시합니다. 본인 계정의 문서만 읽고 쓸 수 있습니다.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/docs/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

5. 프로젝트 설정 → 일반 → 내 앱에서 웹 앱(`</>`)을 추가하고, 표시되는 설정값(apiKey, authDomain, projectId, appId)을 `firebase-config.js` 에 붙여넣은 뒤 발행합니다.
6. 앱의 `진도` 탭 → 계정·동기화에서 가입하거나 로그인합니다. 처음 로그인하면 이 기기의 기록이 계정으로 올라갑니다.

같은 항목을 두 기기에서 고치면 마지막에 고친 쪽이 남습니다.
