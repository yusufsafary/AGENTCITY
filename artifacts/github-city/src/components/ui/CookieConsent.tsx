import { useState, useEffect } from 'react';

const STORAGE_KEY = 'agentcity_cookie_consent';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

type ConsentState = 'accepted' | 'declined' | null;

function getStored(): ConsentState {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'accepted' || v === 'declined') return v;
  } catch {}
  return null;
}

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(getStored);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Delay mount so it doesn't flash immediately on load
  useEffect(() => {
    if (consent !== null) return;
    const t = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(t);
  }, [consent]);

  if (consent !== null || !visible) return null;

  const dismiss = (value: 'accepted' | 'declined') => {
    setLeaving(true);
    setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, value); } catch {}
      setConsent(value);
    }, 340);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[300] flex justify-center px-3 pb-4 sm:pb-5"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="w-full max-w-lg pointer-events-auto"
        style={{
          animation: leaving
            ? 'gc-consent-out 0.34s ease-in both'
            : 'gc-consent-in 0.45s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <div
          className="rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(6,13,31,0.97) 0%, rgba(13,7,32,0.97) 100%)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(202,255,0,0.18)',
            boxShadow: '0 0 0 1px rgba(202,255,0,0.08), 0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(202,255,0,0.06)',
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[2px] w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #CAFF00, #00D4FF, #FF0090, transparent)',
              backgroundSize: '200% 100%',
              animation: 'gc-border-chase 2.5s linear infinite',
            }}
          />

          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Icon + text */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: 'rgba(202,255,0,0.08)',
                  border: '1px solid rgba(202,255,0,0.18)',
                }}
              >
                <span className="text-base leading-none">🍪</span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-tight mb-1">
                  This site uses cookies
                </p>
                <p className="text-white/45 text-xs leading-relaxed">
                  We use strictly necessary cookies for leaderboard session state.
                  No advertising or tracking cookies.{' '}
                  <a
                    href={`${BASE}/cookies`}
                    className="text-[#00D4FF] hover:underline"
                  >
                    Cookie Policy
                  </a>
                  {' '}·{' '}
                  <a
                    href={`${BASE}/privacy`}
                    className="text-[#00D4FF] hover:underline"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-stretch">
              <button
                onClick={() => dismiss('accepted')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95"
                style={{
                  background: '#CAFF00',
                  color: '#000',
                  boxShadow: '0 0 16px rgba(202,255,0,0.30)',
                  minWidth: 88,
                }}
              >
                Accept
              </button>
              <button
                onClick={() => dismiss('declined')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.45)',
                  minWidth: 88,
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gc-consent-in {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes gc-consent-out {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.97); }
        }
      `}</style>
    </div>
  );
}
