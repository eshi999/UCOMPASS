import { useEffect, useRef, useState } from 'react';
import type { ChatTurn, StudentProfile } from '../types';
import { ChatComposer } from '../components/ChatComposer';
import { PawAvatar } from '../components/PawAvatar';
import { PawBlockView } from '../components/PawBlockView';
import { Icon, type IconName } from '../components/Icon';
import { quickPrompts, tryAsking } from '../data/pawScripts';
import { askPaw, resetPawConversation } from '../services/pawService';
import logo from '../assets/ucompass-logo.png';

const chipIcons: IconName[] = ['calendar', 'heart', 'ticket', 'users', 'book', 'car'];

export function TalkPage({
  profileName,
  profile,
  initialAsk,
}: {
  profileName: string;
  profile?: StudentProfile;
  initialAsk?: string;
}) {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || turns.length === 0) return;
    // Scroll so the newest user question sits near the top, with Paw's answer below.
    const lastUser = el.querySelectorAll('.turn-user');
    const target = lastUser[lastUser.length - 1] as HTMLElement | undefined;
    if (target) el.scrollTo({ top: target.offsetTop - 12, behavior: 'smooth' });
  }, [turns, thinking]);

  const send = async (text: string) => {
    const id = `${Date.now()}`;
    setTurns((t) => [...t, { id: `u${id}`, role: 'user', text }]);
    setInput('');
    setThinking(true);
    try {
      const blocks = await askPaw(text, profile);
      setTurns((t) => [...t, { id: `p${id}`, role: 'paw', blocks }]);
    } catch (error) {
      console.error(error);
      setTurns((t) => [
        ...t,
        {
          id: `p${id}`,
          role: 'paw',
          blocks: [{ type: 'text', text: 'Paw could not reach the campus assistant right now. Please try again in a moment.' }],
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // Demo helper: ?ask=first|second sends scripted questions in order.
  const didAsk = useRef(false);
  useEffect(() => {
    if (!initialAsk || didAsk.current) return;
    didAsk.current = true;
    (async () => {
      for (const q of initialAsk.split('|')) await send(q);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAsk]);

  const reset = () => {
    resetPawConversation();
    setTurns([]);
    setInput('');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const first = profileName.split(' ')[0];

  if (turns.length === 0) {
    return (
      <div className="page talk-home">
        <header className="app-header">
          <div className="brand">
            <img className="brand-logo" src={logo} alt="" />
            <span className="wordmark">
              U<b>Compass</b>
            </span>
          </div>
          <span className="greeting">
            {greeting}, {first}
          </span>
        </header>

        <div className="scroll">
          <section className="hero">
            <h1>What’s on your mind?</h1>
            <p>Ask Paw anything about student life at UConn.</p>
          </section>

          <ChatComposer value={input} onChange={setInput} onSend={send} />

          <div className="quick-grid">
            {quickPrompts.map((p, i) => (
              <button key={p} className="quick-card" onClick={() => setInput(p)}>
                <span className="quick-icon">
                  <Icon name={chipIcons[i]} size={16} />
                </span>
                <span>{p}</span>
              </button>
            ))}
          </div>

          <section className="try-asking">
            <h2 className="mini-heading">Try asking Paw</h2>
            {tryAsking.map((t) => (
              <button key={t.q} className="try-row" onClick={() => send(t.q)}>
                <span>
                  <strong>“{t.q}”</strong>
                  <small>{t.hint}</small>
                </span>
                <Icon name="arrowRight" size={16} />
              </button>
            ))}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page talk-chat">
      <header className="chat-header">
        <button className="icon-btn icon-btn-ghost" aria-label="New conversation" onClick={reset}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <div className="chat-title">
          <PawAvatar size={28} pulse={thinking} />
          <div>
            <strong>Paw</strong>
            <small>{thinking ? 'Looking across campus…' : 'Your UCompass guide'}</small>
          </div>
        </div>
        <button className="icon-btn icon-btn-ghost" aria-label="New conversation" onClick={reset}>
          <Icon name="edit" size={20} />
        </button>
      </header>

      <div className="scroll chat-scroll" ref={scrollRef}>
        {turns.map((t) =>
          t.role === 'user' ? (
            <div key={t.id} className="turn turn-user">
              <div className="bubble-user">{t.text}</div>
            </div>
          ) : (
            <div key={t.id} className="turn turn-paw">
              <PawAvatar size={24} />
              <div className="paw-reply">
                {t.blocks?.map((b, i) => (
                  <PawBlockView key={i} block={b} onPick={send} />
                ))}
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="turn turn-paw">
            <PawAvatar size={24} pulse />
            <div className="typing" aria-label="Paw is typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        <div className="chat-spacer" />
      </div>

      <div className="composer-dock">
        <ChatComposer value={input} onChange={setInput} onSend={send} compact placeholder="Ask a follow up…" />
      </div>
    </div>
  );
}
