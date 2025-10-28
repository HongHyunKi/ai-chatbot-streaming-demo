import React, { useState, useRef } from 'react';

function StreamingChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // AI 응답을 위한 빈 메시지 추가
    const aiMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      // AbortController로 요청 취소 가능하게 설정
      abortControllerRef.current = new AbortController();

      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
        signal: abortControllerRef.current.signal
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.done) {
              setIsStreaming(false);
            } else if (data.content) {
              // 메시지에 새로운 글자 추가
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[aiMessageIndex] = {
                  ...newMessages[aiMessageIndex],
                  content: newMessages[aiMessageIndex].content + data.content
                };
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('요청이 취소되었습니다.');
      } else {
        console.error('에러:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[aiMessageIndex] = {
            role: 'assistant',
            content: '오류가 발생했습니다. 다시 시도해주세요.'
          };
          return newMessages;
        });
      }
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🤖 AI ChatBot - Streaming API</h1>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        height: '400px',
        overflowY: 'auto',
        marginBottom: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: '15px',
              textAlign: msg.role === 'user' ? 'right' : 'left'
            }}
          >
            <div style={{
              display: 'inline-block',
              padding: '10px 15px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
              color: msg.role === 'user' ? 'white' : 'black',
              maxWidth: '70%'
            }}>
              {msg.content}
              {msg.role === 'assistant' && isStreaming && index === messages.length - 1 && (
                <span style={{ animation: 'blink 1s infinite' }}>▊</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="메시지를 입력하세요..."
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        {isStreaming ? (
          <button
            onClick={stopStreaming}
            style={{
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            중지
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              opacity: input.trim() ? 1 : 0.6
            }}
          >
            전송
          </button>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default StreamingChatBot;
