import { GitFork, Building2, Users } from 'lucide-react';

interface FloatingControlsProps {
  showForks: boolean;
  onToggleForks: (v: boolean) => void;
  showSkyline: boolean;
  onToggleSkyline: () => void;
  showNeighbors: boolean;
  onToggleNeighbors: () => void;
}

interface IconBtnProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
}

function IconBtn({ onClick, active, icon, label, activeColor }: IconBtnProps) {
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
      }}
      aria-label={label}
    >
      {icon}
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
}: FloatingControlsProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 12, zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 2,
      background: 'rgba(28,14,6,0.84)',
      border: '1px solid rgba(74,191,176,0.22)',
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
        activeColor="#4ABFB0"
      />
      <Divider />
      <IconBtn
        active={showForks}
        onClick={() => onToggleForks(!showForks)}
        icon={<GitFork size={15} />}
        label={showForks ? 'Hide Forks' : 'Show Forks'}
        activeColor="#2CA89A"
      />
      <Divider />
      <IconBtn
        active={showSkyline}
        onClick={onToggleSkyline}
        icon={<Building2 size={15} />}
        label={showSkyline ? 'Hide Skyline' : 'Show Skyline'}
        activeColor="#B84C1F"
      />
    </div>
  );
}
