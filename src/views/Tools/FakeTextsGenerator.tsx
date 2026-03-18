'use client';

import { useState, useCallback } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#8b5cf6', '#6366f1'];

const PLATFORMS = [
  { id: 'imessage', label: 'iMessage', color: '#3b82f6', bubbleColor: '#007AFF' },
  { id: 'whatsapp', label: 'WhatsApp', color: '#22c55e', bubbleColor: '#25D366' },
  { id: 'telegram', label: 'Telegram', color: '#06b6d4', bubbleColor: '#0088cc' },
  { id: 'instagram', label: 'Instagram DM', color: '#ec4899', bubbleColor: '#E1306C' },
] as const;

const MUSIC_OPTIONS = ['None', 'Suspenseful', 'Dramatic', 'Chill', 'Comedy', 'Romantic'] as const;

interface ChatMessage {
  id: number;
  sender: 1 | 2;
  text: string;
}

export function FakeTextsGenerator() {
  const C = useThemeStore((s) => s.theme);
  const [platform, setPlatform] = useState('imessage');
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 1, text: 'Hey, are you there?' },
    { id: 2, sender: 2, text: 'Yeah, what\'s up?' },
  ]);
  const [typingAnimation, setTypingAnimation] = useState(true);
  const [music, setMusic] = useState<typeof MUSIC_OPTIONS[number]>('Suspenseful');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const addMessage = useCallback(() => {
    const lastSender = messages.length > 0 ? messages[messages.length - 1].sender : 2;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: lastSender === 1 ? 2 : 1, text: '' },
    ]);
  }, [messages]);

  const updateMessage = useCallback((id: number, text: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, text } : m));
  }, []);

  const toggleSender = useCallback((id: number) => {
    setMessages((prev) => prev.map((m) =>
      m.id === id ? { ...m, sender: m.sender === 1 ? 2 : 1 } : m,
    ));
  }, []);

  const removeMessage = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleGenerate = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setGenerated(false);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 2500);
  }, [loading]);

  const activePlatform = PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[0];

  return (
    <ToolPageShell
      title="Fake Texts Generator"
      subtitle="Create viral fake text conversation videos for social media"
      gradient={GRADIENT}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)', gap: 24 }}>
        {/* Left column: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Platform selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Chat Platform
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  style={{
                    padding: '14px 10px', borderRadius: 12,
                    border: platform === p.id ? `2px solid ${p.color}` : `1px solid ${C.border}`,
                    background: platform === p.id ? `${p.color}12` : C.card,
                    color: platform === p.id ? p.color : C.text,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={(e) => { if (platform !== p.id) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (platform !== p.id) e.currentTarget.style.background = platform === p.id ? `${p.color}12` : C.card; }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: `${p.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Character names */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                Person 1
              </label>
              <input
                value={person1}
                onChange={(e) => setPerson1(e.target.value)}
                placeholder="Enter name..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 13, boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                Person 2
              </label>
              <input
                value={person2}
                onChange={(e) => setPerson2(e.target.value)}
                placeholder="Enter name..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 13, boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
          </div>

          {/* Message editor */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Messages
            </label>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              padding: 14, borderRadius: 12,
              background: C.surface, border: `1px solid ${C.border}`,
              maxHeight: 340, overflowY: 'auto',
            }}>
              {messages.length === 0 && (
                <p style={{ fontSize: 13, color: C.dim, textAlign: 'center', margin: '12px 0' }}>
                  No messages yet. Add one below.
                </p>
              )}
              {messages.map((msg, idx) => (
                <div key={msg.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {/* Message number */}
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: C.card, border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: C.dim, fontWeight: 600, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>

                  {/* Sender toggle */}
                  <button
                    onClick={() => toggleSender(msg.id)}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none',
                      background: msg.sender === 1 ? activePlatform.bubbleColor : C.card,
                      color: msg.sender === 1 ? '#fff' : C.text,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', minWidth: 28, transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    P{msg.sender}
                  </button>

                  {/* Text input */}
                  <input
                    value={msg.text}
                    onChange={(e) => updateMessage(msg.id, e.target.value)}
                    placeholder="Type message..."
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.card,
                      color: C.text, fontSize: 13, outline: 'none',
                      fontFamily: 'inherit', transition: 'border-color 0.2s ease',
                      minWidth: 0,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                  />

                  {/* Remove */}
                  <button
                    onClick={() => removeMessage(msg.id)}
                    style={{
                      width: 26, height: 26, borderRadius: 6, border: 'none',
                      background: C.card, color: C.dim, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0, transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = C.cardHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.dim; e.currentTarget.style.background = C.card; }}
                  >
                    &times;
                  </button>
                </div>
              ))}

              {/* Add message button */}
              <button
                onClick={addMessage}
                style={{
                  padding: '10px 0', borderRadius: 8,
                  border: `1px dashed ${GRADIENT[0]}55`,
                  background: `${GRADIENT[0]}06`, color: GRADIENT[0],
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}12`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}06`; }}
              >
                + Add Message
              </button>
            </div>
          </div>

          {/* Typing animation toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 10,
            background: C.card, border: `1px solid ${C.border}`,
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block' }}>
                Typing Animation
              </span>
              <span style={{ fontSize: 11, color: C.dim }}>
                Show typing indicator between messages
              </span>
            </div>
            <button
              onClick={() => setTypingAnimation(!typingAnimation)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none',
                background: typingAnimation
                  ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                  : C.border,
                cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3, left: typingAnimation ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Background music */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Background Music
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MUSIC_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMusic(m)}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: music === m ? `2px solid ${GRADIENT[0]}` : `1px solid ${C.border}`,
                    background: music === m ? `${GRADIENT[0]}14` : C.card,
                    color: music === m ? GRADIENT[0] : C.text,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (music !== m) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (music !== m) e.currentTarget.style.background = music === m ? `${GRADIENT[0]}14` : C.card; }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Video format info */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Video Format</span>
            <span style={{
              padding: '4px 12px', borderRadius: 8,
              background: `${GRADIENT[0]}18`, color: GRADIENT[0],
              fontSize: 12, fontWeight: 700,
            }}>
              9:16 (Vertical)
            </span>
          </div>

          {/* Generate button */}
          <ActionButton
            label={loading ? 'Generating Video...' : 'Generate Video'}
            gradient={GRADIENT}
            onClick={handleGenerate}
            disabled={messages.filter((m) => m.text.trim()).length < 2}
            loading={loading}
          />
        </div>

        {/* Right column: preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
            Conversation Preview
          </h3>

          {/* Phone-like preview */}
          <div style={{
            width: '100%', aspectRatio: '9/16', borderRadius: 24,
            background: platform === 'imessage' ? '#000' : platform === 'whatsapp' ? '#0b141a' : platform === 'telegram' ? '#17212b' : '#000',
            position: 'relative', overflow: 'hidden',
            border: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            maxHeight: 580,
            transition: 'background 0.3s ease',
          }}>
            {/* Status bar mock */}
            <div style={{
              padding: '8px 16px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>9:41</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ color: '#fff', fontSize: 10 }}>5G</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                  <rect x="1" y="6" width="4" height="12" rx="1" /><rect x="7" y="4" width="4" height="14" rx="1" /><rect x="13" y="2" width="4" height="16" rx="1" /><rect x="19" y="0" width="4" height="18" rx="1" />
                </svg>
              </div>
            </div>

            {/* Chat header */}
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: activePlatform.bubbleColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                  {(person2 || 'P2').charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {person2 || 'Person 2'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                  online
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div style={{
              flex: 1, padding: '16px 12px',
              display: 'flex', flexDirection: 'column',
              gap: 6, overflowY: 'auto',
              minHeight: 0,
            }}>
              {messages.filter((m) => m.text.trim()).length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Messages will appear here</p>
                </div>
              )}
              {messages.filter((m) => m.text.trim()).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.sender === 1 ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '75%', padding: '8px 12px',
                    borderRadius: 16,
                    borderTopRightRadius: msg.sender === 1 ? 4 : 16,
                    borderTopLeftRadius: msg.sender === 2 ? 4 : 16,
                    background: msg.sender === 1
                      ? activePlatform.bubbleColor
                      : platform === 'imessage' ? '#333'
                      : platform === 'whatsapp' ? '#1f2c34'
                      : platform === 'telegram' ? '#2b5278'
                      : '#333',
                    color: '#fff',
                    fontSize: 13, lineHeight: 1.4,
                    transition: 'all 0.2s ease',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator preview */}
              {typingAnimation && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '10px 16px', borderRadius: 16,
                    borderTopLeftRadius: 4,
                    background: platform === 'imessage' ? '#333' : 'rgba(255,255,255,0.08)',
                    display: 'flex', gap: 4, alignItems: 'center',
                  }}>
                    {[0, 1, 2].map((dot) => (
                      <span key={dot} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.5)',
                        opacity: 0.5 + dot * 0.2,
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat input bar */}
            <div style={{
              padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: 8,
              flexShrink: 0,
            }}>
              <div style={{
                flex: 1, padding: '8px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.08)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  Message
                </span>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: activePlatform.bubbleColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Download button */}
          {generated && (
            <button
              style={{
                padding: '12px 0', borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.card, color: C.text,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Video
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
