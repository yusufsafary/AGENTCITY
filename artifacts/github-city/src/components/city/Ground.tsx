import { useMemo } from 'react';
import * as THREE from 'three';
import { NIGHT_PALETTE, MARS_PALETTE } from '../../utils/colors';

interface GroundProps {
  nightMode: boolean;
  size?: number;
  onClick?: () => void;
}

function createGroundTexture(_night: boolean): THREE.CanvasTexture {
  const SZ = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = SZ; canvas.height = SZ;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#070A14';
  ctx.fillRect(0, 0, SZ, SZ);

  ctx.strokeStyle = '#CAFF00';
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = 0.07;
  const minor = 64;
  for (let x = 0; x <= SZ; x += minor) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SZ); ctx.stroke();
  }
  for (let y = 0; y <= SZ; y += minor) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SZ, y); ctx.stroke();
  }

  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.18;
  const major = 256;
  for (let x = 0; x <= SZ; x += major) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SZ); ctx.stroke();
  }
  for (let y = 0; y <= SZ; y += major) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SZ, y); ctx.stroke();
  }

  ctx.strokeStyle = '#FF0090';
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(SZ / 2, 0); ctx.lineTo(SZ / 2, SZ); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, SZ / 2); ctx.lineTo(SZ, SZ / 2); ctx.stroke();

  ctx.setLineDash([22, 18]);
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.28;
  ctx.beginPath(); ctx.moveTo(SZ / 2, 0); ctx.lineTo(SZ / 2, SZ); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, SZ / 2); ctx.lineTo(SZ, SZ / 2); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#FF0090';
  ctx.globalAlpha = 0.10;
  for (let s = 0; s < 10; s++) {
    ctx.fillRect(SZ / 2 - 4 - s * 9, SZ / 4 - 2, 5, 36);
    ctx.fillRect(SZ / 2 - 4 - s * 9, SZ * 3 / 4 - 2, 5, 36);
    ctx.fillRect(SZ / 4 - 2, SZ / 2 - 4 - s * 9, 36, 5);
    ctx.fillRect(SZ * 3 / 4 - 2, SZ / 2 - 4 - s * 9, 36, 5);
  }

  const grad = ctx.createRadialGradient(SZ / 2, SZ / 2, 0, SZ / 2, SZ / 2, SZ * 0.38);
  grad.addColorStop(0,   'rgba(202,255,0,0.12)');
  grad.addColorStop(0.45,'rgba(202,255,0,0.04)');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SZ, SZ);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export default function Ground({ nightMode, size = 200, onClick }: GroundProps) {
  const texture = useMemo(() => createGroundTexture(nightMode), [nightMode]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={[size, size, 1, 1]} />
      <meshStandardMaterial
        map={texture}
        color="#060A14"
        roughness={0.88}
        metalness={0.18}
        emissive={new THREE.Color('#CAFF00')}
        emissiveIntensity={nightMode ? 0.07 : 0.035}
      />
    </mesh>
  );
}
