'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  tasks?: Task[];
  timestamp: Date;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
}

const QUICK_ACTIONS = [
  'Answer my question',
  'Write code for me',
  'Explain something',
  'Help me think',
  'Summarize text',
  'Brainstorm ideas',
];

const CAPABILITIES = [
  { icon: '🔍', title: 'Web Search', desc: 'Search the internet for information' },
  { icon: '💻', title: 'Code Writing', desc: 'Write, debug, and explain code' },
  { icon: '🖼️', title: 'Image Generation', desc: 'Create images from descriptions' },
  { icon: '📊', title: 'Data Analysis', desc: 'Analyze and visualize data' },
  { icon: '📝', title: 'Text Tasks', desc: 'Summarize, rewrite, translate' },
  { icon: '🧠', title: 'Reasoning', desc: 'Solve complex problems step by step' },
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
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

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
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gsk_sNhS4m3oqLBW2hXWP1S1WGdyb3FYQZQVGK4zJ1h2d3aX4mK9jH2nN6',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory,
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        setMessages(prev => prev.map(m => 
          m.id === aiMessageId 
            ? { ...m, content: data.choices[0].message.content }
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
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', desc: 'Fast & capable' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', desc: 'Balanced' },
    { id: 'llama3-70b-8192', name: 'Llama 3 70B', desc: 'Reliable' },
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
          <div className="capabilities-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>Capabilities</h3>
            {CAPABILITIES.map((cap, i) => (
              <div key={i} className="capability-item">
                <div className="capability-icon">{cap.icon}</div>
                <div className="capability-info">
                  <h4>{cap.title}</h4>
                  <p>{cap.desc}</p>
                </div>
              </div>
            ))}
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
                ✨ Powered by Groq - Unlimited free usage
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
    </div>
  );
}
