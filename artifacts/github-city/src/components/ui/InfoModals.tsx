import { useEffect } from 'react';

/* ── Shared backdrop + scrollable panel ──────────────────── */
function Modal({
  onClose,
  title,
  subtitle,
  children,
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(8,4,18,0.80)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #1a0e06 0%, #0d0720 100%)',
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        {/* Sticky header — always visible */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <h2 className="text-white font-bold text-base tracking-tight leading-tight">{title}</h2>
            {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-sm leading-none shrink-0 ml-4"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain px-6 py-5 flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── About ───────────────────────────────────────────────── */
export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      onClose={onClose}
      title="About GitHub City"
      subtitle="A living 3D city built from your code"
    >
      {/* Icon row */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #C45020, #8B3510)' }}
        >
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
            <rect x="14" y="22" width="7" height="13" fill="white" opacity="0.9" rx="0.5" />
            <rect x="22" y="14" width="8" height="21" fill="white" rx="0.5" />
            <rect x="25.5" y="10.5" width="1.5" height="3.5" fill="white" opacity="0.6" rx="0.5" />
            <circle cx="26.25" cy="10" r="1" fill="#4ABFB0" />
            <rect x="31" y="19" width="7" height="16" fill="white" opacity="0.85" rx="0.5" />
          </svg>
        </div>
        <p className="text-white/55 text-sm leading-relaxed">
          Turn any GitHub profile into a city. Every repo, every commit, rendered in 3D.
        </p>
      </div>

      <div className="space-y-3 text-white/65 text-sm leading-relaxed">
        <p>
          GitHub City turns your GitHub activity into a living, breathing 3D city. Every repository
          becomes a building, and the height reflects how active that project has been. The more
          commits and contributions, the taller the tower.
        </p>
        <p>
          The city comes alive with animated traffic, pedestrians, trees, street lamps, and traffic
          lights. Switch between day and night to see the skyline transform under a glowing neon sky.
        </p>
        <p>
          Share your city with anyone. Each profile gets its own URL so you can compare cities,
          show off your contributions, or just admire the view.
        </p>
      </div>

      <div className="h-px bg-white/8 my-5" />

      {/* Builder credit */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #4ABFB0, #2CA89A)' }}
        >
          J
        </div>
        <div className="min-w-0">
          <p className="text-white/40 text-xs">Built by</p>
          <a
            href="https://x.com/jackie_doll96"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4ABFB0] font-semibold text-sm hover:text-[#6DD4C8] transition-colors"
          >
            @jackie_doll96
          </a>
        </div>
      </div>

      {/* bottom padding for scroll breathing room */}
      <div className="h-2" />
    </Modal>
  );
}

/* ── How to Use ──────────────────────────────────────────── */
const STEPS = [
  {
    icon: '⌨️',
    title: 'Enter a GitHub username',
    desc: 'Type any GitHub username into the search bar at the top and hit Build City.',
  },
  {
    icon: '🏙️',
    title: 'Explore your city',
    desc: 'Your repos appear as buildings. Taller buildings mean more commits and activity on that project.',
  },
  {
    icon: '👆',
    title: 'Click any building',
    desc: 'Tap or click a building to see the repo name, language, star count, and recent commit activity.',
  },
  {
    icon: '🌙',
    title: 'Switch day and night',
    desc: 'Hit the Night button to transform your city into a glowing neon skyline with street lights and stars.',
  },
  {
    icon: '🔗',
    title: 'Share your city',
    desc: 'Use the Share button to copy a link. Anyone can open it to view your GitHub City instantly.',
  },
  {
    icon: '🏆',
    title: 'Check the leaderboard',
    desc: 'See which GitHub profiles have the most impressive cities by opening the Top Cities board.',
  },
];

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      onClose={onClose}
      title="How to use GitHub City"
      subtitle="Everything you need to know in 60 seconds"
    >
      <div className="space-y-4">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-3.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5"
              style={{ background: 'rgba(74,191,176,0.10)', border: '1px solid rgba(74,191,176,0.18)' }}
            >
              {step.icon}
            </div>
            <div className="pt-0.5">
              <p className="text-white/90 text-sm font-semibold leading-tight">{step.title}</p>
              <p className="text-white/50 text-xs leading-relaxed mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/8 mt-5 mb-4" />

      <p className="text-white/30 text-xs text-center leading-relaxed pb-1">
        Data is fetched live from the GitHub public API. No login required.
      </p>
    </Modal>
  );
}
