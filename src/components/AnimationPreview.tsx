"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { AnimationClip, JointName, RigType } from "@/lib/types";
import { R15_BONE_MAP, R6_BONE_MAP } from "@/lib/types";
import { assetPath } from "@/lib/rigMap";

const R15_URL = assetPath("/rigs/r15.glb");
const R6_URL = assetPath("/rigs/r6.glb");

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
  const alpha = raw * raw * (3 - 2 * raw);
  const map = new Map<JointName, THREE.Euler>();
  for (let j = 0; j < a.poses.length; j++) {
    const pa = a.poses[j];
    const pb = b.poses[j] || pa;
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

function collectBones(root: THREE.Object3D) {
  const map = new Map<string, THREE.Bone>();
  root.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      map.set(obj.name, obj as THREE.Bone);
    }
  });
  return map;
}

function prepareScene(scene: THREE.Object3D) {
  const root = scene.clone(true);
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const std = m as THREE.MeshStandardMaterial;
          if (std.color) std.metalness = 0.12;
          if ("roughness" in std) std.roughness = 0.55;
        }
      }
    }
  });
  return root;
}

function SkinnedRigPlayer({
  url,
  clip,
  playing,
  timeRef,
  boneMap,
  scale,
  position,
}: {
  url: string;
  clip: AnimationClip | null;
  playing: boolean;
  timeRef: React.MutableRefObject<number>;
  boneMap: Record<string, string>;
  scale: number;
  position: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const root = useMemo(() => prepareScene(scene), [scene]);
  const bones = useMemo(() => collectBones(root), [root]);
  const restRot = useMemo(() => {
    const map = new Map<string, THREE.Euler>();
    for (const [name, bone] of bones) {
      map.set(name, bone.rotation.clone());
    }
    return map;
  }, [bones]);

  useFrame((_, delta) => {
    if (!clip) {
      // Reset to rest when no clip
      for (const [name, bone] of bones) {
        const rest = restRot.get(name);
        if (rest) bone.rotation.copy(rest);
      }
      return;
    }
    if (playing) timeRef.current += delta;
    const poseMap = samplePoses(clip, timeRef.current);
    if (!poseMap) return;
    for (const [joint, euler] of poseMap) {
      const boneName = boneMap[joint];
      const bone = boneName ? bones.get(boneName) : undefined;
      const rest = boneName ? restRot.get(boneName) : undefined;
      if (bone && rest) {
        bone.rotation.order = "XYZ";
        bone.rotation.set(rest.x + euler.x, rest.y + euler.y, rest.z + euler.z);
      }
    }
  });

  return <primitive object={root} scale={scale} position={position} />;
}

function RigCanvas({
  clip,
  playing,
  timeRef,
  rig,
}: {
  clip: AnimationClip | null;
  playing: boolean;
  timeRef: React.MutableRefObject<number>;
  rig: RigType;
}) {
  const url = rig === "r6" ? R6_URL : R15_URL;
  const boneMap = rig === "r6" ? R6_BONE_MAP : R15_BONE_MAP;
  // R6 source is ~5 studs tall; R15 similar — fit in preview frame
  const scale = rig === "r6" ? 0.4 : 0.42;
  const position: [number, number, number] = rig === "r6" ? [0, 0, 0] : [0, 0, 0];

  return (
    <SkinnedRigPlayer
      url={url}
      clip={clip}
      playing={playing}
      timeRef={timeRef}
      boneMap={boneMap}
      scale={scale}
      position={position}
    />
  );
}

function PreviewFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div>
        <p className="font-[family-name:var(--font-display)] text-sm text-white">{label}</p>
        <p className="mt-2 text-xs text-muted">Loading real Roblox rig meshes…</p>
      </div>
    </div>
  );
}

function PreviewError({ rig, message }: { rig: RigType; message: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div className="max-w-sm rounded-2xl border border-brand/40 bg-brand/10 px-4 py-5">
        <p className="font-[family-name:var(--font-display)] text-sm text-white">
          {rig.toUpperCase()} rig failed to load
        </p>
        <p className="mt-2 text-xs text-muted">{message}</p>
        <p className="mt-3 text-[11px] text-muted">
          Expected asset: <code className="text-white/80">{rig === "r6" ? R6_URL : R15_URL}</code>
        </p>
      </div>
    </div>
  );
}

export function AnimationPreview({
  clip,
  rig = "r15",
  autoPlay = true,
  generating = false,
}: {
  clip: AnimationClip | null;
  rig?: RigType;
  autoPlay?: boolean;
  generating?: boolean;
}) {
  const [playing, setPlaying] = useState(autoPlay);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timeRef = useRef(0);
  const activeRig: RigType = clip?.rig || rig;

  useEffect(() => {
    setPlaying(autoPlay);
    timeRef.current = 0;
    setLoadError(null);
  }, [clip?.id, autoPlay, activeRig]);

  const label = useMemo(() => clip?.name || "No animation yet", [clip]);

  return (
    <div className="panel relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="animate-preview-glow absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/20 blur-[70px]" />
      </div>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {generating ? "Generating" : "Preview"} · {activeRig.toUpperCase()}
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
        className={`relative h-[440px] w-full transition ${generating ? "ring-1 ring-brand/40" : ""}`}
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in srgb, var(--red) 16%, var(--bg)) 0%, var(--bg) 72%)",
        }}
      >
        {loadError ? (
          <PreviewError rig={activeRig} message={loadError} />
        ) : (
          <Suspense fallback={<PreviewFallback label={`Loading ${activeRig.toUpperCase()}…`} />}>
            <Canvas
              key={activeRig}
              camera={{ position: [2.6, 2.0, 3.4], fov: 40 }}
              shadows
              onCreated={() => setLoadError(null)}
            >
              <color attach="background" args={["#070707"]} />
              <ambientLight intensity={0.6} />
              <directionalLight
                castShadow
                position={[4, 7, 3]}
                intensity={1.5}
                color="#ffffff"
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <spotLight position={[-3, 5, -2]} intensity={0.7} color="#ffffff" />
              <pointLight position={[0, 2.4, 1.6]} intensity={0.4} color="#ffffff" />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <circleGeometry args={[3.2, 64]} />
                <meshStandardMaterial color="#121212" metalness={0.45} roughness={0.75} />
              </mesh>
              <RigLoadGuard rig={activeRig} onError={setLoadError}>
                <RigCanvas clip={clip} playing={playing} timeRef={timeRef} rig={activeRig} />
              </RigLoadGuard>
              <ContactShadows opacity={0.55} scale={8} blur={2.6} far={4} color="#000000" />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={8} target={[0, 1.2, 0]} />
            </Canvas>
          </Suspense>
        )}
      </div>
    </div>
  );
}

/** Catches GLB parse / runtime errors without rendering a box placeholder. */
function RigLoadGuard({
  children,
  rig,
  onError,
}: {
  children: React.ReactNode;
  rig: RigType;
  onError: (msg: string) => void;
}) {
  return (
    <ErrorBoundary
      resetKey={rig}
      onError={(err) => onError(err.message || `Could not load ${rig.toUpperCase()} GLB.`)}
    >
      {children}
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (e: Error) => void; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

useGLTF.preload(R15_URL);
useGLTF.preload(R6_URL);
