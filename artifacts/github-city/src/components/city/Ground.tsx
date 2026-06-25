import { useMemo } from 'react';
import * as THREE from 'three';
import { NIGHT_PALETTE, MARS_PALETTE } from '../../utils/colors';

interface GroundProps {
  nightMode: boolean;
  size?: number;
  onClick?: () => void;
}

function createGroundTexture(night: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (night) {
    ctx.fillStyle = '#0d0a14';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = NIGHT_PALETTE.turquoise;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    // Martian regolith — sandy terracotta ground
    ctx.fillStyle = MARS_PALETTE.groundDay;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle dust texture noise
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 3 + 1;
      ctx.globalAlpha = Math.random() * 0.12;
      ctx.fillStyle = Math.random() > 0.5 ? MARS_PALETTE.sandLight : MARS_PALETTE.fogDay;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Road grid (sandy paths)
    ctx.strokeStyle = MARS_PALETTE.groundRoad;
    ctx.lineWidth = 14;
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 128); ctx.lineTo(512, i * 128); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Road center dashes
    ctx.strokeStyle = '#C4A070';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.beginPath(); ctx.moveTo(256, 0); ctx.lineTo(256, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 256); ctx.lineTo(512, 256); ctx.stroke();
    ctx.setLineDash([]);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export default function Ground({ nightMode, size = 200, onClick }: GroundProps) {
  const texture = useMemo(() => createGroundTexture(nightMode), [nightMode]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={[size, size, 1, 1]} />
      <meshStandardMaterial
        map={texture}
        color={nightMode ? '#0a0812' : MARS_PALETTE.groundDay}
        roughness={0.95}
        metalness={nightMode ? 0.1 : 0}
        emissive={nightMode ? new THREE.Color(NIGHT_PALETTE.turquoise) : new THREE.Color(0)}
        emissiveIntensity={nightMode ? 0.04 : 0}
      />
    </mesh>
  );
}
