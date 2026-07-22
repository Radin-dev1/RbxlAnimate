"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { AnimationClip, JointName } from "@/lib/types";

const JOINT_MESH: Record<
  JointName,
  { size: [number, number, number]; color: string }
> = {
  Root: { size: [0.35, 0.12, 0.25], color: "#3a3a3a" },
  LowerTorso: { size: [0.55, 0.35, 0.3], color: "#c41e1e" },
  UpperTorso: { size: [0.62, 0.45, 0.32], color: "#e10600" },
  Head: { size: [0.32, 0.32, 0.32], color: "#f0f0f0" },
  LeftUpperArm: { size: [0.16, 0.38, 0.16], color: "#d4d4d4" },
  LeftLowerArm: { size: [0.14, 0.34, 0.14], color: "#bcbcbc" },
  LeftHand: { size: [0.12, 0.12, 0.12], color: "#f0f0f0" },
  RightUpperArm: { size: [0.16, 0.38, 0.16], color: "#d4d4d4" },
  RightLowerArm: { size: [0.14, 0.34, 0.14], color: "#bcbcbc" },
  RightHand: { size: [0.12, 0.12, 0.12], color: "#f0f0f0" },
  LeftUpperLeg: { size: [0.2, 0.42, 0.2], color: "#222" },
  LeftLowerLeg: { size: [0.18, 0.4, 0.18], color: "#1a1a1a" },
  LeftFoot: { size: [0.22, 0.1, 0.32], color: "#111" },
  RightUpperLeg: { size: [0.2, 0.42, 0.2], color: "#222" },
  RightLowerLeg: { size: [0.18, 0.4, 0.18], color: "#1a1a1a" },
  RightFoot: { size: [0.22, 0.1, 0.32], color: "#111" },
};

type JointNode = {
  name: JointName;
  position: [number, number, number];
  children?: JointNode[];
};

const RIG: JointNode = {
  name: "Root",
  position: [0, 0, 0],
  children: [
    {
      name: "LowerTorso",
      position: [0, 0.2, 0],
      children: [
        {
          name: "UpperTorso",
          position: [0, 0.35, 0],
          children: [
            { name: "Head", position: [0, 0.42, 0] },
            {
              name: "LeftUpperArm",
              position: [-0.42, 0.15, 0],
              children: [
                {
                  name: "LeftLowerArm",
                  position: [0, -0.38, 0],
                  children: [{ name: "LeftHand", position: [0, -0.34, 0] }],
                },
              ],
            },
            {
              name: "RightUpperArm",
              position: [0.42, 0.15, 0],
              children: [
                {
                  name: "RightLowerArm",
                  position: [0, -0.38, 0],
                  children: [{ name: "RightHand", position: [0, -0.34, 0] }],
                },
              ],
            },
          ],
        },
        {
          name: "LeftUpperLeg",
          position: [-0.16, -0.2, 0],
          children: [
            {
              name: "LeftLowerLeg",
              position: [0, -0.42, 0],
              children: [{ name: "LeftFoot", position: [0, -0.4, 0.05] }],
            },
          ],
        },
        {
          name: "RightUpperLeg",
          position: [0.16, -0.2, 0],
          children: [
            {
              name: "RightLowerLeg",
              position: [0, -0.42, 0],
              children: [{ name: "RightFoot", position: [0, -0.4, 0.05] }],
            },
          ],
        },
      ],
    },
  ],
};

function samplePoses(clip: AnimationClip, time: number) {
  const frames = clip.keyframes;
  if (!frames.length) return null;
  const t = ((time % clip.duration) + clip.duration) % clip.duration;
  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].time < t) i++;
  const a = frames[i];
  const b = frames[Math.min(i + 1, frames.length - 1)];
  const span = Math.max(b.time - a.time, 0.0001);
  const raw = THREE.MathUtils.clamp((t - a.time) / span, 0, 1);
  // Smoothstep between authored keyframes for softer preview playback
  const alpha = raw * raw * (3 - 2 * raw);
  const map = new Map<JointName, THREE.Euler>();
  for (let j = 0; j < a.poses.length; j++) {
    const pa = a.poses[j];
    const pb = b.poses[j];
    map.set(
      pa.joint,
      new THREE.Euler(
        THREE.MathUtils.degToRad(pa.rx + (pb.rx - pa.rx) * alpha),
        THREE.MathUtils.degToRad(pa.ry + (pb.ry - pa.ry) * alpha),
        THREE.MathUtils.degToRad(pa.rz + (pb.rz - pa.rz) * alpha),
        "XYZ",
      ),
    );
  }
  return map;
}

function JointMesh({
  node,
  poseMap,
}: {
  node: JointNode;
  poseMap: Map<JointName, THREE.Euler> | null;
}) {
  const ref = useRef<THREE.Group>(null);
  const mesh = JOINT_MESH[node.name];

  useFrame(() => {
    if (!ref.current || !poseMap) return;
    const euler = poseMap.get(node.name);
    if (euler) ref.current.rotation.copy(euler);
  });

  return (
    <group ref={ref} position={node.position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={mesh.size} />
        <meshStandardMaterial color={mesh.color} metalness={0.25} roughness={0.45} />
      </mesh>
      {node.children?.map((child) => (
        <JointMesh key={child.name} node={child} poseMap={poseMap} />
      ))}
    </group>
  );
}

function RigPlayer({
  clip,
  playing,
  timeRef,
}: {
  clip: AnimationClip | null;
  playing: boolean;
  timeRef: React.MutableRefObject<number>;
}) {
  const [poseMap, setPoseMap] = useState<Map<JointName, THREE.Euler> | null>(null);

  useFrame((_, delta) => {
    if (!clip) return;
    if (playing) timeRef.current += delta;
    setPoseMap(samplePoses(clip, timeRef.current));
  });

  return (
    <group position={[0, 0.95, 0]}>
      <JointMesh node={RIG} poseMap={poseMap} />
    </group>
  );
}

export function AnimationPreview({
  clip,
  autoPlay = true,
  generating = false,
}: {
  clip: AnimationClip | null;
  autoPlay?: boolean;
  generating?: boolean;
}) {
  const [playing, setPlaying] = useState(autoPlay);
  const timeRef = useRef(0);

  useEffect(() => {
    setPlaying(autoPlay);
    timeRef.current = 0;
  }, [clip?.id, autoPlay]);

  const label = useMemo(() => clip?.name || "No animation yet", [clip]);

  return (
    <div className="panel relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="animate-preview-glow absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/20 blur-[70px]" />
      </div>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {generating ? "Generating" : "Preview"}
          </p>
          <p className="font-[family-name:var(--font-display)] text-sm text-white">{label}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs" onClick={() => setPlaying((p) => !p)} disabled={!clip}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              timeRef.current = 0;
            }}
            disabled={!clip}
          >
            Restart
          </button>
        </div>
      </div>
      <div
        className={`h-[440px] w-full bg-[radial-gradient(circle_at_center,#1f0606_0%,#050505_72%)] transition ${
          generating ? "ring-1 ring-brand/40" : ""
        }`}
      >
        <Canvas camera={{ position: [2.4, 1.8, 3.2], fov: 42 }} shadows>
          <color attach="background" args={["#070707"]} />
          <ambientLight intensity={0.55} />
          <directionalLight
            castShadow
            position={[4, 6, 3]}
            intensity={1.45}
            color="#ffb0b0"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <spotLight position={[-3, 4, -2]} intensity={0.95} color="#e10600" />
          <pointLight position={[0, 2.2, 1.5]} intensity={0.35} color="#ff3b3b" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <circleGeometry args={[3.2, 64]} />
            <meshStandardMaterial color="#121212" metalness={0.45} roughness={0.75} />
          </mesh>
          <RigPlayer clip={clip} playing={playing} timeRef={timeRef} />
          <ContactShadows opacity={0.5} scale={8} blur={2.6} far={4} color="#e10600" />
          <OrbitControls enablePan={false} minDistance={2} maxDistance={7} target={[0, 1.1, 0]} />
        </Canvas>
      </div>
    </div>
  );
}
