'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  'Answer my question',
  'Write code for me',
  'Explain something',
  'Help me think',
  'Summarize text',
  'Brainstorm ideas',
];

const SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise, friendly, and helpful. You can help with:
- Answering questions on any topic
- Writing and debugging code
- Explaining complex concepts
- Brainstorming ideas
- Research and analysis
- Creative writing
- Math and science problems

Always be helpful and try to provide actionable responses.`;

export default function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [model, setModel] = useState('gemini-2.0-flash-exp');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    setShowApiKeyModal(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            ...conversationHistory,
            { role: 'user', parts: [{ text: text }] }
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        setMessages(prev => prev.map(m => 
          m.id === aiMessageId 
            ? { ...m, content: data.candidates[0].content.parts[0].text }
            : m
        ));
      } else if (data.error) {
        setMessages(prev => prev.map(m => 
          m.id === aiMessageId 
            ? { ...m, content: `Error: ${data.error.message}` }
            : m
        ));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === aiMessageId 
            ? { ...m, content: 'No response received. Please check your API key.' }
            : m
        ));
      }
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === aiMessageId 
          ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
          : m
      ));
    }

    setIsThinking(false);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(`Please ${action} for me.`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          return (
            <pre key={i}>
              <code>{match[2]}</code>
            </pre>
          );
        }
      }
      if (part.startsWith('`')) {
        return <code key={i}>{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const MODELS = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', desc: 'Fastest & newest' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Reliable & fast' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Most capable' },
  ];

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="logo">AI Agent</span>
          <div className="status-dot" />
          <span style={{ fontSize: 10, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 6px', borderRadius: 4 }}>
            FREE
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="settings-icon"
            onClick={() => setShowCapabilities(true)}
          >
            ✨
          </button>
        </div>
      </div>

      <div className="chat-area">
        {messages.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>
              AI Agent Ready
            </h2>
            <p style={{ fontSize: 14 }}>
              Ask me anything or use quick actions below
            </p>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {message.role === 'ai' && message.content === '' && isThinking ? (
                <div className="thinking-indicator">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              ) : (
                renderContent(message.content)
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="quick-actions">
        {QUICK_ACTIONS.map(action => (
          <button 
            key={action}
            className="quick-action"
            onClick={() => handleQuickAction(action)}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="input-area">
        <div className="input-container">
          <textarea
            className="message-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button 
            className="send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
          >
            ➤
          </button>
        </div>
      </div>

      {showCapabilities && (
        <div className="capabilities-modal" onClick={() => setShowCapabilities(false)}>
          <div className="capabilities-content" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>Model Selection</h3>
            {MODELS.map(m => (
              <div 
                key={m.id}
                className="capability-item"
                style={{ cursor: 'pointer', background: model === m.id ? 'var(--accent-glow)' : 'transparent', borderRadius: 12 }}
                onClick={() => { setModel(m.id); setShowCapabilities(false); }}
              >
                <div className="capability-icon" style={{ background: model === m.id ? 'var(--accent)' : 'var(--bg-card)' }}>
                  {model === m.id ? '✓' : '○'}
                </div>
                <div className="capability-info">
                  <h4>{m.name}</h4>
                  <p>{m.desc}</p>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                ✨ Powered by Google AI Studio - Free tier available
              </p>
            </div>
            <button 
              style={{
                width: '100%',
                marginTop: 16,
                padding: 12,
                background: 'var(--bg-card)',
                border: 'none',
                borderRadius: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              onClick={() => setShowCapabilities(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showApiKeyModal && (
        <div className="capabilities-modal">
          <div className="capabilities-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>🔑 Google AI API Key</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
              Get a free API key from Google AI Studio (no credit card needed)
            </p>
            <input
              type="password"
              placeholder="Enter your API key..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: 14,
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: 'white',
                fontSize: 14,
                marginBottom: 12
              }}
            />
            <button
              onClick={saveApiKey}
              style={{
                width: '100%',
                padding: 14,
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Save & Continue
            </button>
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 12, textAlign: 'center' }}>
              Get key at <span style={{ color: 'var(--accent)' }}>aistudio.google.com</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
