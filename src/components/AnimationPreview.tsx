"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AnimationClip, JointName, PreviewMode, RigType } from "@/lib/types";
import { R15_BONE_MAP, R6_BONE_MAP, R6_MESH_MAP } from "@/lib/types";
import { assetPath, r15PosesToR6 } from "@/lib/rigMap";

// Cache-bust so Pages clients pick up re-exported meshes
const R15_URL = `${assetPath("/rigs/r15.glb")}?v=5`;
const R6_URL = `${assetPath("/rigs/r6.glb")}?v=5`;

const DEFAULT_CAM: [number, number, number] = [2.6, 2.0, 3.4];
const DEFAULT_TARGET: [number, number, number] = [0, 1.2, 0];

type PoseSample = {
  euler: THREE.Euler;
  px: number;
  py: number;
  pz: number;
};

type PoseMap = Map<JointName, PoseSample>;

function samplePoses(clip: AnimationClip, time: number, out: PoseMap): PoseMap | null {
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

  out.clear();
  for (let j = 0; j < a.poses.length; j++) {
    const pa = a.poses[j];
    const pb = b.poses[j] || pa;
    let sample = out.get(pa.joint);
    if (!sample) {
      sample = { euler: new THREE.Euler(0, 0, 0, "XYZ"), px: 0, py: 0, pz: 0 };
    }
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

function collectDriveTargets(
  root: THREE.Object3D,
  boneMap: Record<string, string>,
  meshMap?: Record<string, string>,
): DriveTarget[] {
  const byName = new Map<string, THREE.Object3D>();
  root.traverse((obj) => {
    if (!obj.name) return;
    // Prefer bones when duplicate mesh/bone names exist (R15 hierarchy)
    const prev = byName.get(obj.name);
    if (!prev || (obj as THREE.Bone).isBone) {
      byName.set(obj.name, obj);
      // GLTFLoader turns spaces into underscores — index both forms
      const spaced = obj.name.replace(/_/g, " ");
      if (spaced !== obj.name) {
        const prevSpaced = byName.get(spaced);
        if (!prevSpaced || (obj as THREE.Bone).isBone) byName.set(spaced, obj);
      }
    }
  });

  const targets: DriveTarget[] = [];
  const used = new Set<THREE.Object3D>();

  const resolve = (name: string) => byName.get(name) || byName.get(name.replace(/ /g, "_"));

  for (const [joint, boneName] of Object.entries(boneMap)) {
    const obj = resolve(boneName);
    if (obj && !used.has(obj)) {
      targets.push({
        joint,
        obj,
        restRot: obj.rotation.clone(),
        restPos: obj.position.clone(),
      });
      used.add(obj);
    }
  }

  if (meshMap) {
    for (const [joint, meshName] of Object.entries(meshMap)) {
      if (targets.some((t) => t.joint === joint)) continue;
      const obj = resolve(meshName);
      if (obj && !used.has(obj)) {
        targets.push({
          joint,
          obj,
          restRot: obj.rotation.clone(),
          restPos: obj.position.clone(),
        });
        used.add(obj);
      }
    }
  }

  return targets;
}

function prepareScene(scene: THREE.Object3D) {
  // SkeletonUtils keeps bone↔mesh links intact (plain clone breaks skins)
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
        if ("envMapIntensity" in std) std.envMapIntensity = 0;
        return c;
      });
      mesh.material = cloned.length === 1 ? cloned[0] : cloned;
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
  meshMap,
  scale,
}: {
  url: string;
  clip: AnimationClip | null;
  playing: boolean;
  timeRef: React.MutableRefObject<number>;
  boneMap: Record<string, string>;
  meshMap?: Record<string, string>;
  scale: number;
}) {
  const { scene } = useGLTF(url);
  const root = useMemo(() => prepareScene(scene), [scene]);
  const targets = useMemo(
    () => collectDriveTargets(root, boneMap, meshMap),
    [root, boneMap, meshMap],
  );
  const poseScratch = useRef<PoseMap>(new Map());
  const targetIndex = useMemo(() => {
    const map = new Map<string, DriveTarget>();
    for (const t of targets) map.set(t.joint, t);
    return map;
  }, [targets]);

  useEffect(() => {
    return () => {
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
          for (const m of mats) m.dispose();
        }
      });
    };
  }, [root]);

  useFrame((_, delta) => {
    const applyRest = () => {
      for (const t of targets) {
        t.obj.rotation.order = "XYZ";
        t.obj.rotation.copy(t.restRot);
        t.obj.position.copy(t.restPos);
      }
    };

    if (!clip) {
      applyRest();
      return;
    }
    if (playing) timeRef.current += delta;
    const poseMap = samplePoses(clip, timeRef.current, poseScratch.current);
    if (!poseMap) return;

    for (const t of targets) {
      const sample = poseMap.get(t.joint as JointName);
      t.obj.rotation.order = "XYZ";
      if (sample) {
        t.obj.rotation.set(
          t.restRot.x + sample.euler.x,
          t.restRot.y + sample.euler.y,
          t.restRot.z + sample.euler.z,
        );
        // Root hop / flip arc
        if (t.joint === "Root") {
          t.obj.position.set(
            t.restPos.x + sample.px * 0.55,
            t.restPos.y + sample.py * 0.55,
            t.restPos.z + sample.pz * 0.55,
          );
        } else {
          t.obj.position.copy(t.restPos);
        }
      } else {
        t.obj.rotation.copy(t.restRot);
        t.obj.position.copy(t.restPos);
      }
    }

    if (poseMap.size < targetIndex.size) {
      for (const t of targets) {
        if (!poseMap.has(t.joint as JointName)) {
          t.obj.rotation.copy(t.restRot);
          t.obj.position.copy(t.restPos);
        }
      }
    }
  });

  return <primitive object={root} scale={scale} position={[0, 0, 0]} />;
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
  const meshMap = rig === "r6" ? R6_MESH_MAP : undefined;
  const scale = rig === "r6" ? 0.38 : 0.4;

  return (
    <SkinnedRigPlayer
      url={url}
      clip={clip}
      playing={playing}
      timeRef={timeRef}
      boneMap={boneMap}
      meshMap={meshMap}
      scale={scale}
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

/** Adapt clip poses to the currently displayed rig (toggle can differ from clip.rig). */
function clipForRig(clip: AnimationClip | null, rig: RigType): AnimationClip | null {
  if (!clip) return null;
  if (clip.rig === rig) return clip;
  if (rig === "r6" && clip.rig === "r15") {
    return {
      ...clip,
      rig: "r6",
      keyframes: clip.keyframes.map((kf) => ({
        time: kf.time,
        poses: r15PosesToR6(kf.poses),
      })),
    };
  }
  // R6 → R15: keep as-is (subset joints still drive matching body parts via maps)
  return { ...clip, rig };
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
    const cam = controls.object as THREE.PerspectiveCamera;
    cam.position.set(...DEFAULT_CAM);
    controls.target.set(...DEFAULT_TARGET);
    controls.update();
  }, [controlsRef, resetToken]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={2}
      maxDistance={8}
      target={DEFAULT_TARGET}
    />
  );
}

export function AnimationPreview({
  clip,
  rig = "r15",
  autoPlay = true,
  generating = false,
}: {
  clip: AnimationClip | null;
  rig?: PreviewMode;
  autoPlay?: boolean;
  generating?: boolean;
}) {
  if (rig === "dual") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <AnimationPreview clip={clip} rig="r15" autoPlay={autoPlay} generating={generating} />
        <AnimationPreview clip={clip} rig="r6" autoPlay={autoPlay} generating={generating} />
      </div>
    );
  }

  return <AnimationPreviewSingle clip={clip} rig={rig} autoPlay={autoPlay} generating={generating} />;
}

function AnimationPreviewSingle({
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
  const [viewResetToken, setViewResetToken] = useState(0);
  const timeRef = useRef(0);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const activeRig: RigType = rig || clip?.rig || "r15";
  const playClip = useMemo(() => clipForRig(clip, activeRig), [clip, activeRig]);

  useEffect(() => {
    setPlaying(autoPlay);
    timeRef.current = 0;
    setLoadError(null);
  }, [clip?.id, autoPlay, activeRig]);

  const label = useMemo(() => clip?.name || "No animation yet", [clip]);

  function resetView() {
    setViewResetToken((n) => n + 1);
  }

  function resetAnimation() {
    timeRef.current = 0;
  }

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
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-ghost text-xs" onClick={() => setPlaying((p) => !p)} disabled={!clip}>
            {playing ? "Pause" : "Play"}
          </button>
          <button className="btn-ghost text-xs" onClick={resetAnimation} disabled={!clip}>
            Restart
          </button>
          <button className="btn-ghost text-xs" onClick={resetView} type="button">
            Reset view
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
              <directionalLight
                castShadow
                position={[4, 7, 3]}
                intensity={1.35}
                color="#ffffff"
                shadow-mapSize-width={512}
                shadow-mapSize-height={512}
                shadow-camera-far={16}
                shadow-camera-left={-4}
                shadow-camera-right={4}
                shadow-camera-top={4}
                shadow-camera-bottom={-4}
              />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <circleGeometry args={[3.2, 32]} />
                <meshStandardMaterial color="#121212" metalness={0.35} roughness={0.8} />
              </mesh>
              <RigLoadGuard rig={activeRig} onError={setLoadError}>
                <RigCanvas clip={playClip} playing={playing} timeRef={timeRef} rig={activeRig} />
              </RigLoadGuard>
              <PreviewOrbitControls controlsRef={controlsRef} resetToken={viewResetToken} />
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
