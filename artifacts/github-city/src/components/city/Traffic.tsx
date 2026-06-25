import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Autonomous AI Vehicle ─────────────────────────────── */
interface MoverProps { radius: number; speed: number; startAngle: number; color: string }

function AIVehicle({ radius, speed, startAngle, color }: MoverProps) {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const angle = startAngle + t * speed;
    ref.current.position.set(Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius);
    ref.current.rotation.y = Math.PI / 2 - angle;
    if (glowRef.current) {
      glowRef.current.intensity = 0.6 + Math.sin(t * 3 + startAngle) * 0.2;
    }
  });

  return (
    <group ref={ref}>
      {/* Sleek low body */}
      <mesh position={[0, 0.10, 0]}>
        <boxGeometry args={[0.80, 0.10, 0.36]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.10} />
      </mesh>
      {/* Aerodynamic cabin */}
      <mesh position={[0.05, 0.19, 0]}>
        <boxGeometry args={[0.42, 0.09, 0.28]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Blue glass dome */}
      <mesh position={[0.05, 0.195, 0]}>
        <boxGeometry args={[0.44, 0.07, 0.30]} />
        <meshStandardMaterial color="#00D4FF" transparent opacity={0.35} metalness={0.95} roughness={0.02} />
      </mesh>
      {/* Wheels */}
      {([ [-0.28, 0.05, 0.20], [-0.28, 0.05, -0.20], [0.28, 0.05, 0.20], [0.28, 0.05, -0.20] ] as [number,number,number][]).map(([x,y,z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.062, 0.062, 0.055, 10]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
      {/* Cyan headlights */}
      <mesh position={[0.42, 0.11, 0.12]}>
        <boxGeometry args={[0.018, 0.042, 0.08]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={3.5} />
      </mesh>
      <mesh position={[0.42, 0.11, -0.12]}>
        <boxGeometry args={[0.018, 0.042, 0.08]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={3.5} />
      </mesh>
      {/* Red tail lights */}
      <mesh position={[-0.42, 0.11, 0.13]}>
        <boxGeometry args={[0.018, 0.035, 0.055]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[-0.42, 0.11, -0.13]}>
        <boxGeometry args={[0.018, 0.035, 0.055]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={2.0} />
      </mesh>
      {/* Undercarriage glow */}
      <pointLight ref={glowRef} position={[0, -0.05, 0]} color={color} intensity={0.6} distance={1.5} decay={2} />
    </group>
  );
}

/* ── AI Robot Agent (pedestrian) ────────────────────────── */
const ROBOT_COLORS = ['#00D4FF', '#A855F7', '#00FF88', '#F472B6', '#3B82F6', '#FBBF24'];

interface RobotProps { radius: number; speed: number; startAngle: number; idx: number }

function AIRobot({ radius, speed, startAngle, idx }: RobotProps) {
  const ref = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.MeshStandardMaterial>(null);
  const auraRef = useRef<THREE.MeshBasicMaterial>(null);
  const accentColor = ROBOT_COLORS[idx % ROBOT_COLORS.length];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const angle = startAngle + t * speed;
    const bob = Math.abs(Math.sin(t * Math.abs(speed) * 12)) * 0.014;
    ref.current.position.set(Math.cos(angle) * radius, bob, Math.sin(angle) * radius);
    ref.current.rotation.y = Math.PI / 2 - angle;
    if (eyeRef.current) {
      eyeRef.current.emissiveIntensity = 1.5 + Math.sin(t * 4 + idx) * 0.8;
    }
    if (auraRef.current) {
      auraRef.current.opacity = 0.12 + Math.sin(t * 2 + idx * 1.3) * 0.06;
    }
  });

  return (
    <group ref={ref}>
      {/* Aura ring */}
      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.065, 0.095, 12]} />
        <meshBasicMaterial ref={auraRef} color={accentColor} transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.115, 0]}>
        <boxGeometry args={[0.072, 0.085, 0.052]} />
        <meshStandardMaterial color="#1A2A3A" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Chest panel stripe */}
      <mesh position={[0, 0.115, 0.027]}>
        <boxGeometry args={[0.058, 0.018, 0.005]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.0} roughness={0.1} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.218, 0]}>
        <boxGeometry args={[0.058, 0.048, 0.048]} />
        <meshStandardMaterial color="#243040" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Eye visor */}
      <mesh position={[0, 0.218, 0.026]}>
        <boxGeometry args={[0.036, 0.010, 0.004]} />
        <meshStandardMaterial ref={eyeRef} color={accentColor} emissive={accentColor} emissiveIntensity={1.5} roughness={0.05} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.256, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.028, 4]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.272, 0]}>
        <sphereGeometry args={[0.006, 5, 5]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={3.0} />
      </mesh>
      {/* Legs */}
      <mesh position={[0.016, 0.052, 0]}>
        <boxGeometry args={[0.024, 0.050, 0.036]} />
        <meshStandardMaterial color="#1A2A3A" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.016, 0.052, 0]}>
        <boxGeometry args={[0.024, 0.050, 0.036]} />
        <meshStandardMaterial color="#1A2A3A" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ── Surveillance Drone (flying) ─────────────────────────── */
function SurveillanceDrone({ orbitRadius, orbitHeight, speed, startAngle, color }: {
  orbitRadius: number; orbitHeight: number; speed: number; startAngle: number; color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const blinkRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = startAngle + t * speed;
    if (ref.current) {
      ref.current.position.set(
        Math.cos(angle) * orbitRadius,
        orbitHeight + Math.sin(t * 0.8 + startAngle) * 0.4,
        Math.sin(angle) * orbitRadius,
      );
      ref.current.rotation.y = Math.PI / 2 - angle;
    }
    if (blinkRef.current) {
      blinkRef.current.emissiveIntensity = ((t * 2.5 + startAngle) % 1) < 0.15 ? 5.0 : 0.2;
    }
  });

  return (
    <group ref={ref}>
      {/* Central body */}
      <mesh>
        <boxGeometry args={[0.14, 0.055, 0.14]} />
        <meshStandardMaterial color="#1A2A3A" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Camera pod */}
      <mesh position={[0, -0.042, 0]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#00D4FF" transparent opacity={0.7} metalness={0.9} roughness={0.05} />
      </mesh>
      {/* 4 arms */}
      {([0, 1, 2, 3] as number[]).map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.13, 0.012, 0.012]} />
              <meshStandardMaterial color="#243040" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Rotor */}
            <mesh position={[Math.cos(a) * 0.145, 0.010, Math.sin(a) * 0.145]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.006, 8]} />
              <meshStandardMaterial color={color} transparent opacity={0.55} metalness={0.5} />
            </mesh>
          </group>
        );
      })}
      {/* Status blink */}
      <mesh position={[0, 0.036, 0]}>
        <sphereGeometry args={[0.009, 5, 5]} />
        <meshStandardMaterial ref={blinkRef} color={color} emissive={color} emissiveIntensity={5.0} />
      </mesh>
      <pointLight position={[0, -0.05, 0]} color={color} intensity={0.4} distance={2.5} decay={2} />
    </group>
  );
}

/* ── Data Delivery Bot (ground, round) ──────────────────── */
function DeliveryBot({ radius, speed, startAngle }: { radius: number; speed: number; startAngle: number }) {
  const ref = useRef<THREE.Group>(null);
  const ledRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = startAngle + t * speed;
    if (ref.current) {
      ref.current.position.set(Math.cos(angle) * radius, 0.06, Math.sin(angle) * radius);
      ref.current.rotation.y = Math.PI / 2 - angle;
    }
    if (ledRef.current) {
      ledRef.current.emissiveIntensity = 1.2 + Math.sin(t * 6 + startAngle) * 0.7;
    }
  });

  return (
    <group ref={ref}>
      {/* Round body */}
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.065, 0.072, 0.11, 12]} />
        <meshStandardMaterial color="#1E3A4A" metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Dome top */}
      <mesh position={[0, 0.115, 0]}>
        <sphereGeometry args={[0.065, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0A1A2A" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* LED ring */}
      <mesh position={[0, 0.065, 0]}>
        <torusGeometry args={[0.065, 0.006, 6, 18]} />
        <meshStandardMaterial ref={ledRef} color="#00FF88" emissive="#00FF88" emissiveIntensity={1.2} roughness={0.1} />
      </mesh>
      {/* Wheels */}
      {([ [0.065, 0.018, 0], [-0.065, 0.018, 0] ] as [number,number,number][]).map(([x,y,z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.020, 0.020, 0.025, 8]} />
          <meshStandardMaterial color="#111" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Scene data ─────────────────────────────────────────── */
const AI_VEHICLES: MoverProps[] = [
  { radius: 12.5, speed:  0.26, startAngle: 0.00, color: '#00D4FF' },
  { radius: 12.5, speed:  0.26, startAngle: 3.14, color: '#A855F7' },
  { radius: 16.0, speed: -0.18, startAngle: 1.05, color: '#00FF88' },
  { radius: 16.0, speed: -0.18, startAngle: 4.20, color: '#F472B6' },
  { radius:  9.5, speed:  0.32, startAngle: 2.10, color: '#00D4FF' },
  { radius:  9.5, speed:  0.32, startAngle: 5.00, color: '#A855F7' },
  { radius: 20.0, speed:  0.14, startAngle: 0.80, color: '#00FF88' },
  { radius: 20.0, speed:  0.14, startAngle: 3.90, color: '#3B82F6' },
  { radius: 13.5, speed: -0.22, startAngle: 1.60, color: '#FBBF24' },
];

const ROBOTS: Array<{ radius: number; speed: number; startAngle: number }> = [
  { radius: 4.5,  speed:  0.20, startAngle: 0.00 },
  { radius: 4.5,  speed:  0.20, startAngle: 2.10 },
  { radius: 4.5,  speed:  0.20, startAngle: 4.20 },
  { radius: 7.0,  speed: -0.15, startAngle: 1.00 },
  { radius: 7.0,  speed: -0.15, startAngle: 3.50 },
  { radius: 7.0,  speed: -0.15, startAngle: 5.80 },
  { radius: 3.2,  speed:  0.28, startAngle: 0.50 },
  { radius: 3.2,  speed:  0.28, startAngle: 3.64 },
  { radius: 10.0, speed:  0.12, startAngle: 0.00 },
  { radius: 10.0, speed:  0.12, startAngle: 3.14 },
  { radius: 5.5,  speed: -0.22, startAngle: 0.70 },
  { radius: 5.5,  speed: -0.22, startAngle: 4.00 },
  { radius: 6.5,  speed:  0.17, startAngle: 1.80 },
  { radius: 8.5,  speed: -0.10, startAngle: 2.60 },
];

const DRONES: Array<{ orbitRadius: number; orbitHeight: number; speed: number; startAngle: number; color: string }> = [
  { orbitRadius: 8,  orbitHeight: 6.5,  speed:  0.35, startAngle: 0.00, color: '#00D4FF' },
  { orbitRadius: 12, orbitHeight: 9.0,  speed: -0.28, startAngle: 2.10, color: '#A855F7' },
  { orbitRadius: 5,  orbitHeight: 4.5,  speed:  0.50, startAngle: 4.20, color: '#00FF88' },
  { orbitRadius: 18, orbitHeight: 12.0, speed:  0.20, startAngle: 1.05, color: '#F472B6' },
  { orbitRadius: 15, orbitHeight: 7.0,  speed: -0.32, startAngle: 3.14, color: '#FBBF24' },
  { orbitRadius: 10, orbitHeight: 15.0, speed:  0.22, startAngle: 5.00, color: '#00D4FF' },
  { orbitRadius: 6,  orbitHeight: 5.5,  speed: -0.45, startAngle: 1.50, color: '#A855F7' },
  { orbitRadius: 22, orbitHeight: 10.0, speed:  0.16, startAngle: 2.80, color: '#00FF88' },
];

const DELIVERY_BOTS = [
  { radius: 2.8, speed:  0.40, startAngle: 0.0 },
  { radius: 2.8, speed:  0.40, startAngle: 3.1 },
  { radius: 4.2, speed: -0.30, startAngle: 1.5 },
];

export default function Traffic() {
  return (
    <>
      {AI_VEHICLES.map((v, i) => <AIVehicle key={`av-${i}`} {...v} />)}
      {ROBOTS.map((r, i) => <AIRobot key={`rb-${i}`} {...r} idx={i} />)}
      {DRONES.map((d, i) => <SurveillanceDrone key={`dr-${i}`} {...d} />)}
      {DELIVERY_BOTS.map((b, i) => <DeliveryBot key={`db-${i}`} {...b} />)}
    </>
  );
}
