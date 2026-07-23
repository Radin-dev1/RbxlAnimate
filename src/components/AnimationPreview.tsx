"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AnimationClip, JointName, PreviewMode } from "@/lib/types";
import { R15_BONE_MAP } from "@/lib/types";
import { assetPath } from "@/lib/rigMap";

const R15_URL = `${assetPath("/rigs/r15.glb")}?v=6`;
const DEFAULT_CAM: [number, number, number] = [3.2, 2.1, 4.2];
const DEFAULT_TARGET: [number, number, number] = [0, 1.1, 0];

type PoseSample = { euler: THREE.Euler; px: number; py: number; pz: number };
type PoseMap = Map<JointName, PoseSample>;

function samplePoses(clip: AnimationClip, time: number, out: PoseMap, reverse: boolean): PoseMap | null {
  const frames = clip.keyframes;
  if (!frames.length) return null;
  let t = ((time % clip.duration) + clip.duration) % clip.duration;
  if (reverse) t = clip.duration - t;
  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].time < t) i++;
  const a = frames[i];
  const b = frames[Math.min(i + 1, frames.length - 1)];
  const span = Math.max(b.time - a.time, 0.0001);
  const raw = THREE.MathUtils.clamp((t - a.time) / span, 0, 1);
  const alpha = raw * raw * (3 - 2 * raw);
  out.clear();
  for (let j = 0; j < a.poses.length; j++) {
    const pa = a.poses[j];
    const pb = b.poses[j] || pa;
    let sample = out.get(pa.joint);
    if (!sample) sample = { euler: new THREE.Euler(0, 0, 0, "XYZ"), px: 0, py: 0, pz: 0 };
    sample.euler.set(
      THREE.MathUtils.degToRad(pa.rx + (pb.rx - pa.rx) * alpha),
      THREE.MathUtils.degToRad(pa.ry + (pb.ry - pa.ry) * alpha),
      THREE.MathUtils.degToRad(pa.rz + (pb.rz - pa.rz) * alpha),
      "XYZ",
    );
    sample.px = (pa.px ?? 0) + ((pb.px ?? 0) - (pa.px ?? 0)) * alpha;
    sample.py = (pa.py ?? 0) + ((pb.py ?? 0) - (pa.py ?? 0)) * alpha;
    sample.pz = (pa.pz ?? 0) + ((pb.pz ?? 0) - (pa.pz ?? 0)) * alpha;
    out.set(pa.joint, sample);
  }
  return out;
}

type DriveTarget = {
  joint: string;
  obj: THREE.Object3D;
  restRot: THREE.Euler;
  restPos: THREE.Vector3;
};

function collectDriveTargets(root: THREE.Object3D, boneMap: Record<string, string>): DriveTarget[] {
  const byName = new Map<string, THREE.Object3D>();
  root.traverse((obj) => {
    if (!obj.name) return;
    const prev = byName.get(obj.name);
    if (!prev || (obj as THREE.Bone).isBone) byName.set(obj.name, obj);
  });
  const targets: DriveTarget[] = [];
  const used = new Set<THREE.Object3D>();
  for (const [joint, boneName] of Object.entries(boneMap)) {
    const obj = byName.get(boneName);
    if (obj && !used.has(obj)) {
      targets.push({ joint, obj, restRot: obj.rotation.clone(), restPos: obj.position.clone() });
      used.add(obj);
    }
  }
  return targets;
}

function prepareScene(scene: THREE.Object3D) {
  const root = cloneSkeleton(scene);
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      mesh.frustumCulled = true;
      const src = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      const cloned = src.map((m) => {
        const c = m.clone();
        const std = c as THREE.MeshStandardMaterial;
        if ("metalness" in std) std.metalness = 0.1;
        if ("roughness" in std) std.roughness = 0.6;
        return c;
      });
      mesh.material = cloned.length === 1 ? cloned[0] : cloned;
    }
  });
  return root;
}

function SkinnedRigPlayer({
  clip,
  playing,
  timeRef,
  speed,
  reverse,
  mirror,
  position,
  yaw,
}: {
  clip: AnimationClip | null;
  playing: boolean;
  timeRef: React.MutableRefObject<number>;
  speed: number;
  reverse: boolean;
  mirror: boolean;
  position: [number, number, number];
  yaw: number;
}) {
  const { scene } = useGLTF(R15_URL);
  const root = useMemo(() => prepareScene(scene), [scene]);
  const targets = useMemo(() => collectDriveTargets(root, R15_BONE_MAP), [root]);
  const poseScratch = useRef<PoseMap>(new Map());

  useFrame((_, delta) => {
    if (!clip) {
      for (const t of targets) {
        t.obj.rotation.copy(t.restRot);
        t.obj.position.copy(t.restPos);
      }
      return;
    }
    if (playing) timeRef.current += delta * speed;
    const poseMap = samplePoses(clip, timeRef.current, poseScratch.current, reverse);
    if (!poseMap) return;
    for (const t of targets) {
      const sample = poseMap.get(t.joint as JointName);
      t.obj.rotation.order = "XYZ";
      if (sample) {
        const my = mirror ? -sample.euler.y : sample.euler.y;
        const mz = mirror ? -sample.euler.z : sample.euler.z;
        t.obj.rotation.set(t.restRot.x + sample.euler.x, t.restRot.y + my, t.restRot.z + mz);
        if (t.joint === "Root") {
          t.obj.position.set(
            t.restPos.x + (mirror ? -sample.px : sample.px) * 0.55,
            t.restPos.y + sample.py * 0.55,
            t.restPos.z + sample.pz * 0.55,
          );
        } else t.obj.position.copy(t.restPos);
      } else {
        t.obj.rotation.copy(t.restRot);
        t.obj.position.copy(t.restPos);
      }
    }
  });

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={mirror ? [-0.4, 0.4, 0.4] : 0.4}>
      <primitive object={root} />
    </group>
  );
}

function PreviewOrbitControls({
  controlsRef,
  resetToken,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  resetToken: number;
}) {
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || resetToken === 0) return;
    (controls.object as THREE.PerspectiveCamera).position.set(...DEFAULT_CAM);
    controls.target.set(...DEFAULT_TARGET);
    controls.update();
  }, [controlsRef, resetToken]);
  return (
    <OrbitControls ref={controlsRef} enablePan={false} minDistance={2} maxDistance={10} target={DEFAULT_TARGET} />
  );
}

export function AnimationPreview({
  clip,
  rivalClip = null,
  mode = "solo",
  autoPlay = true,
  generating = false,
}: {
  clip: AnimationClip | null;
  rivalClip?: AnimationClip | null;
  mode?: PreviewMode;
  autoPlay?: boolean;
  generating?: boolean;
}) {
  const [playing, setPlaying] = useState(autoPlay);
  const [loop, setLoop] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [viewResetToken, setViewResetToken] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timeRef = useRef(0);
  const rivalTimeRef = useRef(0);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const duel = mode === "duel";
  const rival = rivalClip || clip?.rival || null;

  useEffect(() => {
    setPlaying(autoPlay);
    timeRef.current = 0;
    rivalTimeRef.current = 0.15;
    setLoadError(null);
  }, [clip?.id, rival?.id, autoPlay, mode]);

  // Stop at end if not looping
  useFrameSafeStop(playing, loop, clip, timeRef, setPlaying);

  const label = clip?.name || "No animation yet";

  return (
    <div className="panel relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="animate-preview-glow absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/20 blur-[70px]" />
      </div>
      <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {generating ? "Generating" : "Preview"} · {duel ? "DUEL" : "SOLO"} · R15
          </p>
          <p className="font-[family-name:var(--font-display)] text-sm text-white">{label}</p>
          {clip?.parsedSteps?.length ? (
            <p className="mt-1 text-[11px] text-brand/90">Parsed: {clip.parsedSteps.join(" → ")}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-ghost text-xs" onClick={() => setPlaying((p) => !p)} disabled={!clip}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              timeRef.current = 0;
              rivalTimeRef.current = 0.15;
            }}
            disabled={!clip}
          >
            Restart
          </button>
          <button className="btn-ghost text-xs" type="button" onClick={() => setViewResetToken((n) => n + 1)}>
            Reset view
          </button>
          <button className={`btn-ghost text-xs ${loop ? "border-brand/50" : ""}`} type="button" onClick={() => setLoop((v) => !v)}>
            Loop
          </button>
          <button className={`btn-ghost text-xs ${reverse ? "border-brand/50" : ""}`} type="button" onClick={() => setReverse((v) => !v)}>
            Reverse
          </button>
          <button className={`btn-ghost text-xs ${mirror ? "border-brand/50" : ""}`} type="button" onClick={() => setMirror((v) => !v)} disabled={duel}>
            Mirror
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
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">{loadError}</div>
        ) : (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted">Loading R15…</div>
            }
          >
            <Canvas
              key={duel ? "duel" : "solo"}
              camera={{ position: DEFAULT_CAM, fov: 40 }}
              shadows
              dpr={[1, 1.5]}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              onCreated={({ gl }) => {
                setLoadError(null);
                gl.shadowMap.type = THREE.BasicShadowMap;
              }}
            >
              <color attach="background" args={["#070707"]} />
              <ambientLight intensity={0.7} />
              <directionalLight castShadow position={[4, 7, 3]} intensity={1.35} shadow-mapSize-width={512} shadow-mapSize-height={512} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[4, 32]} />
                <meshStandardMaterial color="#121212" metalness={0.35} roughness={0.8} />
              </mesh>
              <ErrorBoundary resetKey={clip?.id || "x"} onError={(e) => setLoadError(e.message)}>
                {duel ? (
                  <>
                    <SkinnedRigPlayer
                      clip={clip}
                      playing={playing}
                      timeRef={timeRef}
                      speed={speed}
                      reverse={reverse}
                      mirror={false}
                      position={[-0.85, 0, 0]}
                      yaw={Math.PI / 2}
                    />
                    <SkinnedRigPlayer
                      clip={rival || clip}
                      playing={playing}
                      timeRef={rivalTimeRef}
                      speed={speed}
                      reverse={reverse}
                      mirror={false}
                      position={[0.85, 0, 0]}
                      yaw={-Math.PI / 2}
                    />
                  </>
                ) : (
                  <SkinnedRigPlayer
                    clip={clip}
                    playing={playing}
                    timeRef={timeRef}
                    speed={speed}
                    reverse={reverse}
                    mirror={mirror}
                    position={[0, 0, 0]}
                    yaw={0}
                  />
                )}
              </ErrorBoundary>
              <PreviewOrbitControls controlsRef={controlsRef} resetToken={viewResetToken} />
            </Canvas>
          </Suspense>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/80 px-4 py-2.5">
        <label className="flex items-center gap-2 text-xs text-muted">
          Speed {speed.toFixed(1)}x
          <input
            className="range w-28"
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
        {duel && <span className="text-[11px] text-muted">You (left) · Rival (right)</span>}
      </div>
    </div>
  );
}

function useFrameSafeStop(
  playing: boolean,
  loop: boolean,
  clip: AnimationClip | null,
  timeRef: React.MutableRefObject<number>,
  setPlaying: (v: boolean) => void,
) {
  useEffect(() => {
    if (!clip || loop || !playing) return;
    const id = window.setInterval(() => {
      if (timeRef.current >= clip.duration) {
        timeRef.current = clip.duration;
        setPlaying(false);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [playing, loop, clip, timeRef, setPlaying]);
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
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

useGLTF.preload(R15_URL);
