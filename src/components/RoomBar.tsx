import { useState } from 'react';
import { Check, Copy, LogOut, Radio } from 'lucide-react';
import type { ConnStatus } from '../session/types';

type Props = {
  readonly code: string;
  readonly conn: ConnStatus;
  readonly isHost: boolean;
  readonly onLeave: () => void;
};

const STATUS_TEXT: Record<ConnStatus, string> = {
  offline: 'Offline',
  connecting: 'Connecting…',
  waiting: 'Waiting for opponent',
  connected: 'Connected',
  closed: 'Disconnected',
  failed: 'Connection problem',
};

export function RoomBar({ code, conn, isHost, onLeave }: Props) {
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}${window.location.pathname}#/join/${code}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    const payload = {
      title: 'Duel Arena',
      text: `Join my Duel Arena room: ${code}`,
      url: link,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  }

  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <Radio
          size={18}
          aria-hidden
          className={conn === 'connected' ? 'text-p1 animate-pulse-ring' : 'text-muted'}
        />
        <div>
          <p className="text-sm font-semibold text-ink">
            Room <span className="tracking-[0.25em] text-accent">{code}</span>
          </p>
          <p className="text-[11px] text-muted">
            {isHost ? 'You are hosting · ' : ''}
            {STATUS_TEXT[conn]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-ghost !min-h-10 !px-3 text-sm" onClick={copyLink}>
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button type="button" className="btn btn-ghost !min-h-10 !px-3 text-sm" onClick={share}>
          Share
        </button>
        <button type="button" className="btn btn-ghost !min-h-10 !px-3 text-sm" onClick={onLeave}>
          <LogOut size={16} aria-hidden /> Leave
        </button>
      </div>
    </div>
  );
}
