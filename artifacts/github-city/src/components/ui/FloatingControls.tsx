import { GitFork, Building2, Users, Camera } from 'lucide-react';

interface FloatingControlsProps {
  showForks: boolean;
  onToggleForks: (v: boolean) => void;
  showSkyline: boolean;
  onToggleSkyline: () => void;
  showNeighbors: boolean;
  onToggleNeighbors: () => void;
  onDownload?: () => void;
  downloading?: boolean;
}

interface IconBtnProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
  pulse?: boolean;
}

function IconBtn({ onClick, active, icon, label, activeColor, pulse }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 12,
        background: active ? activeColor : 'transparent',
        border: 'none', cursor: 'pointer', transition: 'all 0.18s ease',
        color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
        flexShrink: 0,
        animation: pulse ? 'fc-pulse 1s ease-in-out infinite' : undefined,
      }}
      aria-label={label}
    >
      {icon}
      <style>{`
        @keyframes fc-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </button>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1, height: 20, flexShrink: 0,
      background: 'rgba(74,191,176,0.20)',
    }} />
  );
}

export default function FloatingControls({
  showForks, onToggleForks,
  showSkyline, onToggleSkyline,
  showNeighbors, onToggleNeighbors,
  onDownload, downloading,
}: FloatingControlsProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 12, zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 2,
      background: 'rgba(4,8,15,0.84)',
      border: '1px solid rgba(202,255,0,0.18)',
      borderRadius: 16,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '4px 6px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
    }}>
      <IconBtn
        active={showNeighbors}
        onClick={onToggleNeighbors}
        icon={<Users size={15} />}
        label={showNeighbors ? 'Tutup Kota Tetangga' : 'Kota Tetangga'}
        activeColor="rgba(202,255,0,0.25)"
      />
      <Divider />
      <IconBtn
        active={showForks}
        onClick={() => onToggleForks(!showForks)}
        icon={<GitFork size={15} />}
        label={showForks ? 'Hide Forks' : 'Show Forks'}
        activeColor="rgba(255,0,144,0.25)"
      />
      <Divider />
      <IconBtn
        active={showSkyline}
        onClick={onToggleSkyline}
        icon={<Building2 size={15} />}
        label={showSkyline ? 'Hide Skyline' : 'Show Skyline'}
        activeColor="rgba(202,255,0,0.20)"
      />
      {onDownload && (
        <>
          <Divider />
          <IconBtn
            active={false}
            onClick={onDownload}
            icon={<Camera size={15} />}
            label="Download city as image"
            activeColor="rgba(0,212,255,0.25)"
            pulse={downloading}
          />
        </>
      )}
    </div>
  );
}
