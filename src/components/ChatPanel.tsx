import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { ChatLine } from '../net/protocol';
import type { Seat } from '../games/types';

const EMOJIS = ['🔥', '😂', '😮', '👏', '💀', '🤝', '😎', '🎉'];

type Props = {
  readonly chat: readonly ChatLine[];
  readonly accent: (seat: Seat | 'system') => string;
  readonly onSend: (text: string) => void;
};

export function ChatPanel({ chat, accent, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.length]);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  }

  return (
    <section className="surface-card flex min-h-0 flex-1 flex-col rounded-2xl">
      <header className="flex items-center justify-between border-b border-divider px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Trash talk</h2>
        <span className="text-[11px] text-muted">synced live</span>
      </header>
      <div
        ref={listRef}
        className="min-h-28 flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm"
        aria-live="polite"
      >
        {chat.length === 0 && (
          <p className="text-xs text-muted">Say hello. Messages travel peer to peer.</p>
        )}
        {chat.map((line) => (
          <p key={line.id} className="animate-float-in">
            <span className={`font-semibold ${accent(line.seat)}`}>{line.author}: </span>
            <span className="text-ink">{line.text}</span>
          </p>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-divider px-3 py-2">
        <div className="flex gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Send ${emoji}`}
              onClick={() => onSend(emoji)}
              className="rounded-lg px-1.5 py-1 text-base hover:bg-surface-2"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-1 items-center gap-2">
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <input
            id="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
            maxLength={160}
            placeholder="Message"
            className="w-full rounded-lg border border-boundary bg-surface-2 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={submit}
            aria-label="Send message"
            className="btn btn-primary !min-h-10 !px-3"
          >
            <Send size={16} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
