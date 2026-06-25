import type { LoadingState } from '../../types/github';

interface LoadingOverlayProps {
  state: LoadingState;
  nightMode: boolean;
}

export default function LoadingOverlay({ state, nightMode }: LoadingOverlayProps) {
  if (state.step === 'idle' || state.step === 'done') return null;

  const isError = state.step === 'error';
  const backdrop = nightMode ? 'bg-[#0F0315]/90' : 'bg-[#1C0E06]/75';
  const cardBg = nightMode ? 'bg-[#13032a] border-white/10' : 'bg-[#1C0E06]/95 border-[#4ABFB0]/20';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${backdrop} backdrop-blur-sm`}>
      <div className={`max-w-xs w-full mx-4 p-6 rounded-3xl border text-center shadow-2xl ${cardBg}`}>
        {isError ? (
          <>
            <div className="text-4xl mb-3">⚠️</div>
            <p className="font-semibold mb-1 text-white">Something went wrong</p>
            <p className="text-sm text-white/55">{state.error}</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <LoadingSpinner />
            </div>
            <p className="font-semibold text-white">Building your city</p>
            <p className="text-sm mt-1 text-white/55">{state.message}</p>
            <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#4ABFB0] rounded-full transition-all duration-700"
                style={{ width: stepToPercent(state.step) + '%' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function stepToPercent(step: string) {
  switch (step) {
    case 'fetching-repos': return 20;
    case 'fetching-events': return 55;
    case 'building-city': return 85;
    default: return 0;
  }
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-10 h-10" viewBox="0 0 40 40">
      <circle
        cx="20" cy="20" r="16"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="3"
      />
      <circle
        cx="20" cy="20" r="16"
        fill="none"
        stroke="#4ABFB0"
        strokeWidth="3"
        strokeDasharray="60 40"
        strokeLinecap="round"
      />
    </svg>
  );
}
