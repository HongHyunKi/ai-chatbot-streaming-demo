# 🤖 AI 챗봇 스트리밍 API 샘플 프로젝트

## 📁 파일 구성

- `streaming-backend.js` - Node.js/Express 백엔드 서버
- `StreamingChatBot.jsx` - React 프론트엔드 컴포넌트
- `streaming-chatbot.html` - 바닐라 JavaScript 프론트엔드 (HTML 단일 파일)

## 🚀 실행 방법

### 방법 1: HTML 파일 사용 (가장 간단)

1. **백엔드 서버 설치 및 실행**
```bash
# 폴더 이동
cd back-end

# 필요한 패키지 설치
npm install express cors

# 서버 실행
node streaming-backend.js

# -> .env.sample 참고하여 .env 파일 생성
```

2. **프론트엔드 실행**
- `streaming-chatbot.html` 파일을 웹 브라우저에서 열기
- 또는 Live Server 등 개발 서버 사용

### 방법 2: React 프로젝트 사용

1. **백엔드 서버 실행** (위와 동일)

2. **React 앱 설정**
```bash
# React 앱 생성
npx create-react-app my-chatbot
cd my-chatbot

# StreamingChatBot.jsx를 src/ 폴더에 복사

# App.js 수정
```

```javascript
import StreamingChatBot from './StreamingChatBot';

function App() {
  return <StreamingChatBot />;
}

export default App;
```

## 💡 주요 기능

### 백엔드 (streaming-backend.js)

1. **기본 스트리밍 엔드포인트** (`/api/chat/stream`)
   - SSE (Server-Sent Events) 방식
   - 텍스트를 한 글자씩 스트리밍
   - 시뮬레이션 응답

2. **OpenAI API 연동 엔드포인트** (`/api/chat/stream-openai`)
   - 실제 OpenAI API와 연동
   - API 키 필요 (.env 교체)

3. **Claude API 연동 엔드포인트** (`/api/chat/stream-claude`)
   - 실제 Claude API와 연동
   - API 키 필요 (.env 교체)

### 프론트엔드

**react-component (StreamingChatBot.jsx)**
- 실시간 메시지 스트리밍
- 타이핑 커서 애니메이션
- 스트리밍 중지 기능
- 반응형 UI

**html 버전 (streaming-chatbot.html)**
- 바닐라 JavaScript로 구현
- React 없이 바로 실행 가능
- 동일한 기능 제공

## 🔧 기술 스택

**백엔드**
- Node.js
- Express
- CORS

**프론트엔드**
- React (선택사항)
- Fetch API
- ReadableStream API
- Server-Sent Events (SSE)

## 📝 스트리밍 동작 원리

1. **클라이언트**: 메시지를 POST 요청으로 전송
2. **서버**: SSE 헤더 설정 후 응답 시작
3. **서버**: 생성된 텍스트를 조금씩 전송
   ```
   data: {"content": "안", "done": false}\n\n
   data: {"content": "녕", "done": false}\n\n
   data: {"content": "하", "done": false}\n\n
   ```
4. **클라이언트**: 실시간으로 텍스트 수신 및 화면 업데이트
5. **서버**: 완료 신호 전송
   ```
   data: {"content": "", "done": true}\n\n
   ```

## 🌐 API 엔드포인트

### POST /api/chat/stream

**요청**
```json
{
  "message": "안녕하세요"
}
```

**응답** (SSE 스트림)
```
data: {"content": "안", "done": false}

data: {"content": "녕", "done": false}
...
data: {"content": "", "done": true}
```

## 🔑 실제 LLM API 사용하기

`streaming-backend.js`의 `/api/chat/stream-openai` 엔드포인트를 사용하려면:

1. OpenAI & Claude API 키 발급
2. /back-end/.env 파일의 `YOUR_[플랫폼]_API_KEY`를 실제 키로 교체
3. 프론트엔드에서 엔드포인트 URL 변경:
   ```javascript
   fetch('http://localhost:3001/api/chat/stream-openai', ...)
   ```

## 🎨 커스터마이징

### 스트리밍 속도 조절
```javascript
// 백엔드에서 딜레이 조절
await new Promise(resolve => setTimeout(resolve, 30)); // 30ms → 원하는 값
```

### 스타일 변경
HTML 버전의 경우 `<style>` 태그 내부의 CSS를 수정하세요.
React 버전의 경우 인라인 스타일을 수정하거나 별도 CSS 파일로 분리하세요.

## ⚠️ 주의사항

### API 과금 관련
- **OpenAI API** 및 **Claude API** 사용시 **사용량 기반 과금**이 발생합니다
- Claude Max 플랜 구독자라도 API는 별도 과금됩니다 (구독과 API는 완전히 별개)
- API 키를 설정하고 `/api/chat/stream-openai` 또는 `/api/chat/stream-claude` 엔드포인트를 호출하면 **실제 비용이 청구**됩니다
- 테스트용으로는 `/api/chat/stream` (시뮬레이션 API)를 사용하세요 - 무료!

### 보안
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env` 추가 필수
- API 키가 노출되면 즉시 재발급하세요

## 🐛 문제 해결

**"CORS 에러"가 발생하는 경우**
- 백엔드 서버가 실행 중인지 확인
- 백엔드에 `cors` 패키지가 설치되어 있는지 확인

**스트리밍이 작동하지 않는 경우**
- 브라우저 콘솔에서 에러 메시지 확인
- 네트워크 탭에서 요청이 제대로 전송되는지 확인
- 백엔드 서버 로그 확인

## 📚 추가 학습 자료

- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Streams API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [OpenAI API Streaming](https://platform.openai.com/docs/api-reference/streaming)

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.
