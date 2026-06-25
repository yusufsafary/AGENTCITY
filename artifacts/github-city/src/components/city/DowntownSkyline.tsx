import { useMemo } from 'react';
import * as THREE from 'three';
import type { SkylineBar } from '../../types/github';
import { NIGHT_PALETTE } from '../../utils/colors';

interface DowntownSkylineProps {
  bars: SkylineBar[];
  nightMode: boolean;
  animProgress: number;
}

const MAX_BAR_HEIGHT = 8;

export default function DowntownSkyline({ bars, nightMode, animProgress }: DowntownSkylineProps) {
  const maxCommits = useMemo(() => Math.max(...bars.map(b => b.commits), 1), [bars]);

  return (
    <group>
      {bars.map((bar, i) => {
        const normalizedHeight = bar.commits > 0
          ? 0.3 + (bar.commits / maxCommits) * (MAX_BAR_HEIGHT - 0.3)
          : 0.15;
        const animHeight = normalizedHeight * Math.min(animProgress * 1.5, 1);
        const isEmpty = bar.commits === 0;

        const color = isEmpty
          ? (nightMode ? '#1a2a1a' : '#4a7c59')
          : (nightMode
            ? new THREE.Color(NIGHT_PALETTE.turquoise).lerp(new THREE.Color(NIGHT_PALETTE.neonPink), bar.commits / maxCommits).getStyle()
            : `hsl(${120 - (bar.commits / maxCommits) * 100}, 60%, 40%)`);

        return (
          <mesh
            key={i}
            position={[bar.x, animHeight / 2, bar.z]}
            castShadow
          >
            <boxGeometry args={[1.1, Math.max(animHeight, 0.05), 1.1]} />
            <meshStandardMaterial
              color={color}
              emissive={nightMode && !isEmpty ? new THREE.Color(NIGHT_PALETTE.turquoise) : new THREE.Color(0)}
              emissiveIntensity={nightMode && !isEmpty ? 0.5 : 0}
              roughness={0.6}
              metalness={nightMode ? 0.4 : 0.1}
            />
          </mesh>
        );
      })}
      {/* Label */}
      <mesh position={[bars[0]?.x + (bars.length / 7) * 1.6 / 2, -0.5, bars[0]?.z - 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[(bars.length / 7) * 1.6, 0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
