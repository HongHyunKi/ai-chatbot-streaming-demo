require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/** stream 테스트 API */
app.post('/api/chat/stream', async (req, res) => {
  const { message } = req.body;

  // SSE (Server-Sent Events) 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 샘플 텍스트
  const responseText = `안녕하세요! "${message}"에 대한 답변입니다. 스트리밍 방식으로 텍스트가 한 글자씩 전송되는 것을 볼 수 있습니다. 이렇게 하면 사용자가 전체 응답을 기다리지 않고 즉시 결과를 확인할 수 있습니다.`;

  // 텍스트를 한 글자씩 스트리밍
  for (let i = 0; i < responseText.length; i++) {
    const char = responseText[i];

    // SSE 형식으로 데이터 전송
    res.write(`data: ${JSON.stringify({ content: char, done: false })}\n\n`);

    // 타이핑 효과를 위한 딜레이 (실제로는 불필요)
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  // 완료 신호 전송
  res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
  res.end();
});

/** OpenAI stream 예제 코드 */
app.post('/api/chat/stream-openai', async (req, res) => {
  const { message } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      res.write(`data: ${JSON.stringify({ error: 'OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.' })}\n\n`);
      res.end();
      return;
    }

    // OpenAI API 호출 (실제 사용시 API 키 필요)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        stream: true  // 스트리밍 활성화
      })
    });

    // API 응답 상태 확인
    if (!response.ok) {
      let errorMessage = 'OpenAI API 호출 실패';
      if (response.status === 401) {
        errorMessage = 'OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.';
      } else if (response.status === 429) {
        errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      } else if (response.status === 500) {
        errorMessage = 'OpenAI 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
            }
          } catch (e) {
            // 파싱 에러 무시
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/** Claude stream 예제 코드 */
app.post('/api/chat/stream-claude', async (req, res) => {
  const { message } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // API 키 확인
    if (!process.env.ANTHROPIC_API_KEY) {
      res.write(`data: ${JSON.stringify({ error: 'Claude API 키가 설정되지 않았습니다. .env 파일에 ANTHROPIC_API_KEY를 추가해주세요.' })}\n\n`);
      res.end();
      return;
    }

    // Claude API 호출 (실제 사용시 API 키 필요)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: message }],
        stream: true  // 스트리밍 활성화
      })
    });

    // API 응답 상태 확인
    if (!response.ok) {
      let errorMessage = 'Claude API 호출 실패';
      if (response.status === 401) {
        errorMessage = 'Claude API 키가 유효하지 않습니다. API 키를 확인해주세요.';
      } else if (response.status === 429) {
        errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      } else if (response.status === 500) {
        errorMessage = 'Claude 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            // content_block_delta 이벤트에서 텍스트 추출
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const content = parsed.delta.text;
              res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
            }
          } catch (e) {
            // 파싱 에러 무시
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[RUN]: Streaming API server is running on port ${PORT}`);
});
