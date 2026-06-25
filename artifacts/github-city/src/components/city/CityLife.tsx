import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Neural Node Sculpture (center) ──────────────────────── */
function NeuralNodeSculpture({ nightMode }: { nightMode: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<(THREE.Mesh | null)[]>([]);
  const coreRef = useRef<THREE.Mesh>(null);
  const CYAN = '#00D4FF';
  const PURPLE = '#A855F7';
  const GREEN = '#00FF88';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) groupRef.current.rotation.y = t * 0.3;
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.x = t * (0.4 + i * 0.15);
      ring.rotation.z = t * (0.3 - i * 0.1);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 1.5 + i * 1.2) * 0.20;
    });
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2.0) * 0.08;
      coreRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base platform */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.1, 1.25, 0.24, 24]} />
        <meshStandardMaterial color="#0A1828" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Grid top surface */}
      <mesh position={[0, 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 24]} />
        <meshStandardMaterial color={CYAN} transparent opacity={0.12} emissive={CYAN} emissiveIntensity={0.4} roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 1.32, 8]} />
        <meshStandardMaterial color="#1A3050" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Spinning neural core */}
      <group ref={groupRef} position={[0, 1.8, 0]}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.22, 1]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.8} metalness={0.5} roughness={0.1} wireframe={false} transparent opacity={0.9} />
        </mesh>
        {/* Orbital rings */}
        {[CYAN, PURPLE, GREEN].map((color, i) => (
          <mesh key={i} ref={el => { ringsRef.current[i] = el; }} rotation={[i * Math.PI/3, i * Math.PI/4, 0]}>
            <torusGeometry args={[0.38 + i * 0.12, 0.012, 8, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
          </mesh>
        ))}
        {/* Orbiting node spheres */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const a = (i / 6) * Math.PI * 2;
          const COLORS = [CYAN, PURPLE, GREEN, '#F472B6', '#FBBF24', '#3B82F6'];
          return (
            <mesh key={`ns-${i}`} position={[Math.cos(a) * 0.5, Math.sin(a) * 0.28, Math.sin(a + 1.2) * 0.3]}>
              <sphereGeometry args={[0.030, 6, 6]} />
              <meshStandardMaterial color={COLORS[i]} emissive={COLORS[i]} emissiveIntensity={2.5} roughness={0.1} />
            </mesh>
          );
        })}
      </group>
      {/* Glow light */}
      <pointLight position={[0, 1.8, 0]} color={CYAN} intensity={nightMode ? 3.5 : 1.8} distance={8} decay={2} />
      <pointLight position={[0, 1.8, 0]} color={PURPLE} intensity={nightMode ? 2.0 : 0.8} distance={5} decay={2} />
    </group>
  );
}

/* ── Holographic Display Terminal ────────────────────────── */
function HoloTerminal({ x, z, rotY = 0, nightMode }: { x: number; z: number; rotY?: number; nightMode: boolean }) {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (screenRef.current) {
      screenRef.current.emissiveIntensity = 1.0 + Math.sin(t * 2.2) * 0.4;
    }
    if (scanRef.current) {
      scanRef.current.position.y = 0.2 + ((t * 0.8) % 1.0) * 0.9;
      const mat = scanRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 3) * 0.15;
    }
  });

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Base */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.45, 0.24, 0.25]} />
        <meshStandardMaterial color="#0A1828" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Screen post */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.62, 6]} />
        <meshStandardMaterial color="#1A3050" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Holographic screen */}
      <mesh position={[0, 1.05, 0.04]}>
        <boxGeometry args={[0.55, 0.72, 0.015]} />
        <meshStandardMaterial
          ref={screenRef}
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={1.0}
          transparent opacity={0.55}
          roughness={0.05} metalness={0.5}
        />
      </mesh>
      {/* Screen scanline */}
      <mesh ref={scanRef} position={[0, 0.7, 0.055]}>
        <boxGeometry args={[0.53, 0.018, 0.005]} />
        <meshBasicMaterial color="#00FF88" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      {/* Screen glow */}
      {nightMode && <pointLight position={[0, 1.05, 0.2]} color="#00D4FF" intensity={1.2} distance={3.5} decay={2} />}
    </group>
  );
}

/* ── Drone Landing Pad ────────────────────────────────────── */
function DroneLandingPad({ x, z }: { x: number; z: number }) {
  const lightRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const arrowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    lightRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.emissiveIntensity = ((t * 1.5 + i * 0.5) % 2) < 0.3 ? 4.0 : 0.3;
    });
    if (arrowRef.current) {
      arrowRef.current.emissiveIntensity = 0.6 + Math.sin(t * 2.0) * 0.4;
    }
  });

  return (
    <group position={[x, 0.005, z]}>
      {/* Pad surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 16]} />
        <meshStandardMaterial color="#0A1A2A" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.95, 1.08, 24]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.8} roughness={0.1} />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.38, 0.48, 24]} />
        <meshStandardMaterial ref={arrowRef} color="#A855F7" emissive="#A855F7" emissiveIntensity={0.6} roughness={0.1} />
      </mesh>
      {/* H symbol bars */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[0.60, 0.10]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={1.0} transparent opacity={0.85} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI/2, Math.PI/2, 0]}>
        <planeGeometry args={[0.60, 0.10]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={1.0} transparent opacity={0.85} roughness={0.1} />
      </mesh>
      {/* Corner lights */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.0, 0.02, Math.sin(a) * 1.0]}>
            <sphereGeometry args={[0.040, 5, 5]} />
            <meshStandardMaterial ref={el => { lightRefs.current[i] = el; }}
              color="#00FF88" emissive="#00FF88" emissiveIntensity={4.0} roughness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── AI Data Relay Tower ──────────────────────────────────── */
function DataRelayTower({ x, z, nightMode }: { x: number; z: number; nightMode: boolean }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (dishRef.current) {
      dishRef.current.rotation.y = t * 0.5;
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 1.8) * 0.06;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Base */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.35, 0.36, 0.35]} />
        <meshStandardMaterial color="#0D1E30" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Tower pole */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.035, 0.055, 2.08, 6]} />
        <meshStandardMaterial color="#1A3050" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Spinning dish */}
      <mesh ref={dishRef} position={[0, 2.3, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <sphereGeometry args={[0.25, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#243040" side={THREE.DoubleSide} metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Top blink */}
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.025, 5, 5]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={3.5} roughness={0.05} />
      </mesh>
      {/* Beam cone */}
      <mesh ref={beamRef} position={[0, 3.5, 0]}>
        <coneGeometry args={[0.8, 2.5, 16, 1, true]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {nightMode && <pointLight position={[0, 2.4, 0]} color="#00D4FF" intensity={2.0} distance={8} decay={2} />}
    </group>
  );
}

/* ── Street Lamp (AI themed) ─────────────────────────────── */
function AIStreetLamp({ x, z, nightMode }: { x: number; z: number; nightMode: boolean }) {
  const glowInt = nightMode ? 4.5 : 0.2;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.030, 0.050, 2.5, 6]} />
        <meshStandardMaterial color="#1A3050" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.25, 2.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.50, 5]} />
        <meshStandardMaterial color="#1A3050" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.50, 2.48, 0]}>
        <boxGeometry args={[0.17, 0.09, 0.11]} />
        <meshStandardMaterial color="#0A1828" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.50, 2.42, 0]}>
        <boxGeometry args={[0.11, 0.025, 0.08]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={glowInt} roughness={0.05} />
      </mesh>
      {nightMode && (
        <pointLight position={[0.50, 2.40, 0]} color="#00D4FF" intensity={2.5} distance={7} decay={2} />
      )}
    </group>
  );
}

/* ── Server Cooling Tower ────────────────────────────────── */
function CoolingTower({ x, z }: { x: number; z: number }) {
  const vaporRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    vaporRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = (t * 0.5 + i * 0.7) % 1;
      mesh.position.y = 0.5 + phase * 1.2;
      mesh.scale.setScalar(0.6 + phase * 1.2);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - phase) * 0.25;
    });
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.80, 10]} />
        <meshStandardMaterial color="#0D1E2E" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <torusGeometry args={[0.23, 0.02, 6, 18]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.6} roughness={0.1} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} ref={el => { vaporRefs.current[i] = el; }} position={[0, 0.5 + i * 0.15, 0]}>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshBasicMaterial color="#A0C8FF" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ── AI Traffic Light ────────────────────────────────────── */
function AITrafficLight({ x, z, rotY = 0, offset = 0 }: { x: number; z: number; rotY?: number; offset?: number }) {
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const yelRef = useRef<THREE.MeshStandardMaterial>(null);
  const grnRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const phase = (clock.getElapsedTime() + offset) % 6;
    const isRed = phase < 2.5;
    const isYel = phase >= 2.5 && phase < 3.2;
    const isGrn = phase >= 3.2;
    if (redRef.current) redRef.current.emissiveIntensity = isRed ? 5.0 : 0.05;
    if (yelRef.current) yelRef.current.emissiveIntensity = isYel ? 5.0 : 0.05;
    if (grnRef.current) grnRef.current.emissiveIntensity = isGrn ? 5.0 : 0.05;
  });

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.048, 0.068, 3.30, 6]} />
        <meshStandardMaterial color="#1A3050" metalness={0.75} roughness={0.30} />
      </mesh>
      <mesh position={[0.45, 3.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.036, 0.036, 0.90, 6]} />
        <meshStandardMaterial color="#1A3050" metalness={0.75} roughness={0.30} />
      </mesh>
      <mesh position={[0.90, 3.12, 0]}>
        <boxGeometry args={[0.22, 0.58, 0.18]} />
        <meshStandardMaterial color="#0A1828" roughness={0.5} />
      </mesh>
      <mesh position={[0.90, 3.32, 0.10]}>
        <sphereGeometry args={[0.068, 8, 8]} />
        <meshStandardMaterial ref={redRef} color="#ff2222" emissive="#ff2222" emissiveIntensity={5.0} roughness={0.15} />
      </mesh>
      <mesh position={[0.90, 3.12, 0.10]}>
        <sphereGeometry args={[0.068, 8, 8]} />
        <meshStandardMaterial ref={yelRef} color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.05} roughness={0.15} />
      </mesh>
      <mesh position={[0.90, 2.92, 0.10]}>
        <sphereGeometry args={[0.068, 8, 8]} />
        <meshStandardMaterial ref={grnRef} color="#00FF88" emissive="#00FF88" emissiveIntensity={0.05} roughness={0.15} />
      </mesh>
    </group>
  );
}

/* ── Data Stream (particles between towers) ──────────────── */
function DataStream({ x1, z1, x2, z2 }: { x1: number; z1: number; x2: number; z2: number }) {
  const particlesRef = useRef<(THREE.Mesh | null)[]>([]);
  const N = 12;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    particlesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const progress = ((t * 0.6 + i / N) % 1);
      mesh.position.set(
        x1 + (x2 - x1) * progress,
        1.5 + Math.sin(progress * Math.PI) * 2.0,
        z1 + (z2 - z1) * progress,
      );
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(progress * Math.PI) * 0.7;
    });
  });

  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={el => { particlesRef.current[i] = el; }} position={[x1, 1.5, z1]}>
          <sphereGeometry args={[0.038, 4, 4]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#00D4FF' : '#A855F7'} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ── Placement data ──────────────────────────────────────── */
const toXZ = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a) * r, Math.sin(a) * r];
};

const LAMP_RING1 = [0, 45, 90, 135, 180, 225, 270, 315].map(d => toXZ(7, d));
const LAMP_RING2 = [30, 90, 150, 210, 270, 330].map(d => toXZ(13, d));
const LAMP_RING3 = [15, 75, 135, 195, 255, 315].map(d => toXZ(19, d));

const TL_DEFS: Array<{ x: number; z: number; rot: number; offset: number }> = [
  { x:  11.5, z:   5.0, rot: 0,             offset: 0.0 },
  { x: -11.5, z:  -5.0, rot: Math.PI,       offset: 2.0 },
  { x:   5.0, z:  11.5, rot: Math.PI / 2,   offset: 1.0 },
  { x:  -5.0, z: -11.5, rot: -Math.PI / 2,  offset: 3.0 },
  { x:  14.0, z:   0.0, rot: Math.PI / 2,   offset: 1.5 },
  { x: -14.0, z:   0.0, rot: -Math.PI / 2,  offset: 3.5 },
  { x:   0.0, z:  14.0, rot: 0,             offset: 2.5 },
  { x:   0.0, z: -14.0, rot: Math.PI,       offset: 4.5 },
];

const HOLO_TERMINALS = [
  { x:  4.0, z:  3.0, rot: -0.8 },
  { x: -3.5, z:  4.5, rot:  2.0 },
  { x:  3.0, z: -4.5, rot:  4.5 },
  { x: -4.5, z: -3.0, rot:  1.0 },
  { x:  7.0, z:  1.0, rot: -2.5 },
  { x: -7.0, z: -1.0, rot:  1.5 },
];

const DRONE_PADS = [
  { x:  9.0, z:  9.0 },
  { x: -9.0, z:  9.0 },
  { x:  9.0, z: -9.0 },
  { x: -9.0, z: -9.0 },
  { x:  14.0, z:  0.0 },
  { x: -14.0, z:  0.0 },
];

const RELAY_TOWERS = [
  { x:  17.0, z:  5.0 },
  { x: -17.0, z: -5.0 },
  { x:   5.0, z: 17.0 },
  { x:  -5.0, z: -17.0 },
];

const COOLING_TOWERS = [
  { x:  12.0, z:  12.0 },
  { x: -12.0, z:  12.0 },
  { x:  12.0, z: -12.0 },
  { x: -12.0, z: -12.0 },
];

const DATA_STREAMS = [
  { x1:  17, z1:  5, x2: -5, z2: -17 },
  { x1: -17, z1: -5, x2:  5, z2:  17 },
  { x1:   5, z1: 17, x2: 17, z2:  -5 },
];

export default function CityLife({ nightMode }: { nightMode: boolean }) {
  return (
    <>
      <NeuralNodeSculpture nightMode={nightMode} />

      {LAMP_RING1.map(([x, z], i) => (
        <AIStreetLamp key={`l1-${i}`} x={x} z={z} nightMode={nightMode} />
      ))}
      {LAMP_RING2.map(([x, z], i) => (
        <AIStreetLamp key={`l2-${i}`} x={x} z={z} nightMode={nightMode} />
      ))}
      {LAMP_RING3.map(([x, z], i) => (
        <AIStreetLamp key={`l3-${i}`} x={x} z={z} nightMode={nightMode} />
      ))}

      {HOLO_TERMINALS.map((t, i) => (
        <HoloTerminal key={`ht-${i}`} x={t.x} z={t.z} rotY={t.rot} nightMode={nightMode} />
      ))}

      {DRONE_PADS.map((p, i) => (
        <DroneLandingPad key={`dp-${i}`} x={p.x} z={p.z} />
      ))}

      {RELAY_TOWERS.map((t, i) => (
        <DataRelayTower key={`rt-${i}`} x={t.x} z={t.z} nightMode={nightMode} />
      ))}

      {COOLING_TOWERS.map((t, i) => (
        <CoolingTower key={`ct-${i}`} x={t.x} z={t.z} />
      ))}

      {TL_DEFS.map((tl, i) => (
        <AITrafficLight key={`tl-${i}`} x={tl.x} z={tl.z} rotY={tl.rot} offset={tl.offset} />
      ))}

      {DATA_STREAMS.map((s, i) => (
        <DataStream key={`ds-${i}`} x1={s.x1} z1={s.z1} x2={s.x2} z2={s.z2} />
      ))}
    </>
  );
}
