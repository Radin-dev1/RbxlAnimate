import type { AnimStyle, AnimationClip, JointName, Keyframe, JointPose } from "./types";

const ALL_JOINTS: JointName[] = [
  "Root",
  "LowerTorso",
  "UpperTorso",
  "Head",
  "LeftUpperArm",
  "LeftLowerArm",
  "LeftHand",
  "RightUpperArm",
  "RightLowerArm",
  "RightHand",
  "LeftUpperLeg",
  "LeftLowerLeg",
  "LeftFoot",
  "RightUpperLeg",
  "RightLowerLeg",
  "RightFoot",
];

function hashPrompt(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function restPose(): JointPose[] {
  return ALL_JOINTS.map((joint) => ({ joint, rx: 0, ry: 0, rz: 0 }));
}

function blend(a: JointPose[], b: JointPose[], t: number): JointPose[] {
  return a.map((pose, i) => ({
    joint: pose.joint,
    rx: pose.rx + (b[i].rx - pose.rx) * t,
    ry: pose.ry + (b[i].ry - pose.ry) * t,
    rz: pose.rz + (b[i].rz - pose.rz) * t,
  }));
}

function stylePose(style: AnimStyle, phase: number, intensity: number, rand: () => number): JointPose[] {
  const poses = restPose();
  const set = (joint: JointName, rx: number, ry = 0, rz = 0) => {
    const p = poses.find((x) => x.joint === joint)!;
    p.rx = rx;
    p.ry = ry;
    p.rz = rz;
  };

  const wobble = (rand() - 0.5) * 8 * intensity;
  const swing = Math.sin(phase * Math.PI * 2);

  switch (style) {
    case "walk":
      set("LeftUpperLeg", swing * 35 * intensity, 0, wobble);
      set("RightUpperLeg", -swing * 35 * intensity, 0, -wobble);
      set("LeftLowerLeg", Math.max(0, -swing) * 40 * intensity);
      set("RightLowerLeg", Math.max(0, swing) * 40 * intensity);
      set("LeftUpperArm", -swing * 25 * intensity);
      set("RightUpperArm", swing * 25 * intensity);
      set("UpperTorso", 0, swing * 6 * intensity, 0);
      set("Head", 0, -swing * 4 * intensity, 0);
      break;
    case "combat":
      set("RightUpperArm", -110 * intensity + swing * 20, 20, -30);
      set("RightLowerArm", -40 * intensity);
      set("LeftUpperArm", -40 * intensity, -15, 25);
      set("LeftLowerArm", -50 * intensity);
      set("UpperTorso", 8 * intensity, swing * 18 * intensity, 0);
      set("LowerTorso", 0, swing * 8 * intensity, 0);
      set("RightUpperLeg", -15 * intensity);
      set("LeftUpperLeg", 10 * intensity);
      set("Head", 5, swing * 10, 0);
      break;
    case "idle":
      set("UpperTorso", Math.sin(phase * Math.PI * 2) * 2 * intensity);
      set("Head", Math.sin(phase * Math.PI * 2 + 1) * 3 * intensity, Math.cos(phase * Math.PI * 2) * 4);
      set("LeftUpperArm", -8 * intensity, 0, 6);
      set("RightUpperArm", -8 * intensity, 0, -6);
      set("LeftLowerArm", -12 * intensity);
      set("RightLowerArm", -12 * intensity);
      break;
    case "emote":
    default:
      set("LeftUpperArm", -140 * intensity + swing * 15, 0, 35);
      set("RightUpperArm", -140 * intensity - swing * 15, 0, -35);
      set("LeftLowerArm", -20 * intensity);
      set("RightLowerArm", -20 * intensity);
      set("UpperTorso", swing * 12 * intensity, 0, swing * 8);
      set("LowerTorso", 0, swing * 10 * intensity, 0);
      set("Head", -5 + Math.abs(swing) * 10, swing * 15, 0);
      set("LeftUpperLeg", Math.abs(swing) * 8);
      set("RightUpperLeg", Math.abs(swing) * 8);
      break;
  }

  return poses;
}

function detectStyle(prompt: string, fallback: AnimStyle): AnimStyle {
  const p = prompt.toLowerCase();
  if (/(walk|run|jog|sprint)/.test(p)) return "walk";
  if (/(punch|kick|fight|combat|slash|attack)/.test(p)) return "combat";
  if (/(idle|stand|breathe|wait)/.test(p)) return "idle";
  if (/(dance|wave|emote|celebrate|spin|flex)/.test(p)) return "emote";
  return fallback;
}

export function generateAnimationFromPrompt(opts: {
  prompt: string;
  style: AnimStyle;
  duration: number;
  quality: "standard" | "high";
  source?: "text" | "video";
}): AnimationClip {
  const style = detectStyle(opts.prompt, opts.style);
  const seed = hashPrompt(`${opts.prompt}|${style}|${opts.quality}`);
  const rand = seeded(seed);
  const intensity = opts.quality === "high" ? 1.15 : 0.9;
  const frames = opts.quality === "high" ? 24 : 16;
  const duration = Math.min(Math.max(opts.duration, 0.6), 8);

  const keyframes: Keyframe[] = [];
  for (let i = 0; i <= frames; i++) {
    const t = i / frames;
    const poseA = stylePose(style, t, intensity, rand);
    const poseB = stylePose(style, (t + 0.08) % 1, intensity, rand);
    const poses = blend(poseA, poseB, 0.25);
    keyframes.push({ time: Number((t * duration).toFixed(4)), poses });
  }

  // Settle to rest at end for clean loops on emotes
  if (style === "emote" || style === "combat") {
    keyframes.push({
      time: duration,
      poses: blend(keyframes[keyframes.length - 1].poses, restPose(), 0.85),
    });
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anim_${Date.now()}_${seed.toString(16)}`;

  const short = opts.prompt.trim().slice(0, 42) || "Untitled motion";

  return {
    id,
    name: short,
    prompt: opts.prompt.trim(),
    style,
    duration,
    quality: opts.quality,
    source: opts.source || "text",
    createdAt: new Date().toISOString(),
    keyframes,
  };
}

export function clipToRobloxExport(clip: AnimationClip) {
  return {
    format: "rbxlAnimate.keyframesequence.v1",
    name: clip.name,
    looped: clip.style === "walk" || clip.style === "idle",
    priority: "Action",
    length: clip.duration,
    watermark: false,
    joints: clip.keyframes.map((kf) => ({
      time: kf.time,
      poses: kf.poses.map((p) => ({
        joint: p.joint,
        // Roblox uses CFrame; plugin converts Euler XYZ degrees → CFrame
        orientationDegrees: { x: p.rx, y: p.ry, z: p.rz },
      })),
    })),
    meta: {
      prompt: clip.prompt,
      style: clip.style,
      quality: clip.quality,
      source: clip.source,
      createdAt: clip.createdAt,
      id: clip.id,
    },
  };
}
