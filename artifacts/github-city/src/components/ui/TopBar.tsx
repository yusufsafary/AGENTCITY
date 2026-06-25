import { useState, FormEvent } from 'react';
import { ChevronDown, ChevronUp, Share2, Check, Trophy, Home } from 'lucide-react';

interface TopBarProps {
  onBuild: (username: string) => void;
  loading: boolean;
  hasCity: boolean;
  username: string;
  setUsername: (v: string) => void;
  nightMode?: boolean;
  lastUsername?: string;
  onShowLeaderboard?: () => void;
  onHome?: () => void;
}

function AgentCityLogoSmall({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="tb-grad" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CAFF00" />
          <stop offset="100%" stopColor="#FF0090" />
        </linearGradient>
      </defs>
      <path
        d="M2,42 L2,32 L7,32 L7,26 L11,26 L11,32 L16,32 L16,14 L19,14 L19,9 L24,9 L24,14 L29,14 L29,22 L33,22 L33,26 L37,26 L37,30 L41,30 L41,22 L46,22 L46,42 Z"
        fill="url(#tb-grad)"
      />
      <rect x="22.5" y="5" width="3" height="5" fill="#FF0090" rx="1" />
      <circle cx="24" cy="4" r="3" fill="#CAFF00" />
      <circle cx="24" cy="4" r="1.5" fill="#FF0090" />
    </svg>
  );
}

function buildShareUrl(username: string): string {
  return `${window.location.origin}/u/${encodeURIComponent(username)}`;
}

export default function TopBar({
  onBuild, loading, hasCity, username, setUsername, nightMode = false, lastUsername, onShowLeaderboard, onHome,
}: TopBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!loading && username.trim()) onBuild(username.trim());
  };

  const handleShare = async () => {
    const shareUser = lastUsername ?? username.trim();
    if (!shareUser) return;
    const shareUrl = buildShareUrl(shareUser);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${shareUser}'s Agent City`, text: `Check out ${shareUser}'s GitHub activity as a 3D AI city!`, url: shareUrl });
        return;
      } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(shareUrl); }
    catch {
      const el = document.createElement('textarea');
      el.value = shareUrl; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const panelBg = nightMode ? 'bg-[#0D0828]/80 border-white/12' : 'bg-[#04080F]/80 border-white/10';
  const btnColor = '#CAFF00';

  if (collapsed && hasCity) {
    return (
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between gap-2 pointer-events-none" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={onHome} title="Back to Home" className={`flex items-center gap-1.5 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full text-sm font-medium shadow-lg border text-white/70 hover:text-white transition-colors`}>
            <Home size={15} />
          </button>
          <button onClick={() => setCollapsed(false)} className={`flex items-center gap-2 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full shadow-lg border`}>
            <AgentCityLogoSmall size={18} />
            <span className="text-white/70 text-xs font-medium">Agent City</span>
            <ChevronDown size={13} className="text-white/50" />
          </button>
        </div>
        <button onClick={handleShare} title="Copy shareable link" className={`flex items-center gap-1.5 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full text-sm font-medium shadow-lg border transition-colors pointer-events-auto ${copied ? 'border-[#00D4FF]/60 text-[#00D4FF]' : 'text-white/70'}`}>
          {copied ? <Check size={15} /> : <Share2 size={15} />}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="p-3 flex items-center gap-2">
        <div className={`flex-1 flex items-center gap-2 ${panelBg} backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border pointer-events-auto`}>
          <AgentCityLogoSmall size={22} />
          <span className="text-white font-semibold text-sm tracking-tight" style={{ letterSpacing: '-0.01em', color: btnColor }}>Agent City</span>
          <div className="flex items-center gap-1.5 ml-1">
            {hasCity && onHome && (
              <button onClick={onHome} title="Back to Home" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/60 hover:text-white hover:border-white/25">
                <Home size={13} />
              </button>
            )}
            <button onClick={onShowLeaderboard} title="Top Cities" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/60 hover:text-[#CAFF00] hover:border-white/25">
              <Trophy size={13} /><span className="hidden sm:inline">Top</span>
            </button>
            {hasCity && (
              <button onClick={handleShare} title="Copy shareable link" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${copied ? 'bg-[#CAFF00]/20 border-[#CAFF00]/50 text-[#CAFF00]' : 'bg-white/8 border-white/10 text-white/60 hover:text-white/90 hover:border-white/25'}`}>
                {copied ? <Check size={13} /> : <Share2 size={13} />}<span className="hidden sm:inline">Share</span>
              </button>
            )}
            {hasCity && (
              <button onClick={() => setCollapsed(true)} className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/40 hover:text-white/70 hover:border-white/25" title="Collapse bar">
                <ChevronUp size={13} />
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0">
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="GitHub username"
              maxLength={39}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              className="flex-1 min-w-0 bg-transparent text-white placeholder-white/30 text-sm outline-none"
              style={{ fontFamily: 'inherit', fontWeight: 400 }}
            />
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40"
              style={{ background: loading ? 'rgba(202,255,0,0.15)' : '#CAFF00', color: loading ? '#CAFF00' : '#000', letterSpacing: '0.02em', boxShadow: '0 0 12px rgba(202,255,0,0.30)' }}
            >
              {loading ? '…' : 'Build City'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
