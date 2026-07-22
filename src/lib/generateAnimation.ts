import type { AnimStyle, AnimationClip, JointName, Keyframe, JointPose, RigType } from "./types";
import { MAX_ANIMATION_SECONDS, R15_JOINTS } from "./types";
import { r15PosesToR6 } from "./rigMap";

const ALL_JOINTS: JointName[] = R15_JOINTS;

type MotionVerb =
  | "wave"
  | "spin"
  | "kick"
  | "punch"
  | "jump"
  | "crouch"
  | "point"
  | "flex"
  | "dance"
  | "bow"
  | "clap"
  | "victory"
  | "block"
  | "slash"
  | "stomp"
  | "look"
  | "idle"
  | "walk"
  | "run"
  | "hop"
  | "celebrate"
  | "shrug"
  | "salute"
  | "dodge";

type BodyFocus =
  | "arms"
  | "legs"
  | "torso"
  | "head"
  | "leftArm"
  | "rightArm"
  | "leftLeg"
  | "rightLeg"
  | "full";

type PhaseKind = "anticipation" | "action" | "follow" | "settle";

interface MotionStep {
  verb: MotionVerb;
  focus: BodyFocus;
  intensity: number;
  weight: number;
}

interface PhaseSpec {
  kind: PhaseKind;
  t0: number;
  t1: number;
  step: MotionStep;
  ease: EaseKind;
}

type EaseKind = "smooth" | "snap" | "bounce" | "overshoot" | "soft";

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

function clonePose(poses: JointPose[]): JointPose[] {
  return poses.map((p) => ({ ...p }));
}

function setJoint(poses: JointPose[], joint: JointName, rx: number, ry = 0, rz = 0) {
  const p = poses.find((x) => x.joint === joint)!;
  p.rx = rx;
  p.ry = ry;
  p.rz = rz;
}

function addJoint(poses: JointPose[], joint: JointName, rx: number, ry = 0, rz = 0) {
  const p = poses.find((x) => x.joint === joint)!;
  p.rx += rx;
  p.ry += ry;
  p.rz += rz;
}

function blend(a: JointPose[], b: JointPose[], t: number): JointPose[] {
  const u = clamp01(t);
  return a.map((pose, i) => ({
    joint: pose.joint,
    rx: pose.rx + (b[i].rx - pose.rx) * u,
    ry: pose.ry + (b[i].ry - pose.ry) * u,
    rz: pose.rz + (b[i].rz - pose.rz) * u,
  }));
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Smoothstep / cinematic easings for keyframe spans */
function ease(kind: EaseKind, t: number): number {
  const x = clamp01(t);
  switch (kind) {
    case "snap":
      return x * x * (3 - 2 * x) * (0.35 + 0.65 * x);
    case "bounce": {
      if (x < 0.55) {
        const u = x / 0.55;
        return u * u;
      }
      const u = (x - 0.55) / 0.45;
      return 1 - Math.pow(1 - u, 2) * Math.cos(u * Math.PI * 2.2) * 0.18;
    }
    case "overshoot": {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }
    case "soft":
      return x * x * (3 - 2 * x);
    case "smooth":
    default:
      return x * x * x * (x * (x * 6 - 15) + 10);
  }
}

function detectStyle(prompt: string, fallback: AnimStyle): AnimStyle {
  const p = prompt.toLowerCase();
  if (/(walk|jog|stride|march)/.test(p)) return "walk";
  if (/(run|sprint|dash)/.test(p)) return "walk";
  if (/(punch|kick|fight|combat|slash|attack|block|dodge|stomp)/.test(p)) return "combat";
  if (/(idle|stand|breathe|wait|afk)/.test(p)) return "idle";
  if (/(dance|wave|emote|celebrate|spin|flex|victory|bow|clap|salute|shrug)/.test(p)) return "emote";
  return fallback;
}

const VERB_PATTERNS: Array<{ verb: MotionVerb; re: RegExp; focus?: BodyFocus }> = [
  { verb: "wave", re: /\b(wave|waving|hello|hi)\b/ },
  { verb: "spin", re: /\b(spin|twirl|whirl|rotate|360)\b/ },
  { verb: "kick", re: /\b(kick|kicking|roundhouse)\b/, focus: "rightLeg" },
  { verb: "punch", re: /\b(punch|jab|hook|uppercut)\b/, focus: "rightArm" },
  { verb: "jump", re: /\b(jump|leap|vault)\b/ },
  { verb: "hop", re: /\b(hop|bounce|skip)\b/ },
  { verb: "crouch", re: /\b(crouch|squat|duck)\b/ },
  { verb: "point", re: /\b(point|pointing|aim)\b/, focus: "rightArm" },
  { verb: "flex", re: /\b(flex|muscle|strong)\b/, focus: "arms" },
  { verb: "dance", re: /\b(dance|dancing|groove|boogie)\b/ },
  { verb: "bow", re: /\b(bow|curtsy|respect)\b/, focus: "torso" },
  { verb: "clap", re: /\b(clap|applaud)\b/, focus: "arms" },
  { verb: "victory", re: /\b(victory|win|champion|triumph|yes)\b/, focus: "arms" },
  { verb: "celebrate", re: /\b(celebrate|cheer|hype)\b/ },
  { verb: "block", re: /\b(block|guard|parry)\b/, focus: "arms" },
  { verb: "slash", re: /\b(slash|swing|sword|blade)\b/, focus: "rightArm" },
  { verb: "stomp", re: /\b(stomp|slam|pound)\b/, focus: "rightLeg" },
  { verb: "look", re: /\b(look|glance|turn head|peek)\b/, focus: "head" },
  { verb: "shrug", re: /\b(shrug|idk|dunno)\b/, focus: "arms" },
  { verb: "salute", re: /\b(salute|respect)\b/, focus: "rightArm" },
  { verb: "dodge", re: /\b(dodge|weave|sidestep)\b/ },
  { verb: "walk", re: /\b(walk|walking|stride)\b/ },
  { verb: "run", re: /\b(run|running|sprint|dash)\b/ },
  { verb: "idle", re: /\b(idle|stand|breathe|wait)\b/ },
];

function detectFocus(segment: string): BodyFocus {
  const s = segment.toLowerCase();
  if (/\b(both arms|arms|hands)\b/.test(s)) return "arms";
  if (/\b(both legs|legs|feet)\b/.test(s)) return "legs";
  if (/\b(left arm|left hand)\b/.test(s)) return "leftArm";
  if (/\b(right arm|right hand)\b/.test(s)) return "rightArm";
  if (/\b(left leg|left foot)\b/.test(s)) return "leftLeg";
  if (/\b(right leg|right foot)\b/.test(s)) return "rightLeg";
  if (/\b(head|face|look)\b/.test(s)) return "head";
  if (/\b(torso|body|spine|chest)\b/.test(s)) return "torso";
  return "full";
}

function splitSequence(prompt: string): string[] {
  const cleaned = prompt
    .toLowerCase()
    .replace(/[,;/|]+/g, " then ")
    .replace(/\b(and then|after that|followed by|next|afterwards)\b/g, " then ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned
    .split(/\bthen\b/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [cleaned || "idle"];
}

function parseStep(segment: string, style: AnimStyle, rand: () => number): MotionStep {
  const focus = detectFocus(segment);
  let verb: MotionVerb | null = null;
  for (const entry of VERB_PATTERNS) {
    if (entry.re.test(segment)) {
      verb = entry.verb;
      break;
    }
  }
  if (!verb) {
    const styleDefault: Record<AnimStyle, MotionVerb> = {
      emote: "dance",
      combat: "punch",
      idle: "idle",
      walk: "walk",
    };
    verb = styleDefault[style];
  }
  const intense = /\b(hard|heavy|powerful|fierce|epic|big|strong|fast)\b/.test(segment);
  const soft = /\b(soft|gentle|slow|subtle|light|chill)\b/.test(segment);
  const intensity = clamp01((intense ? 1.25 : soft ? 0.72 : 1) + (rand() - 0.5) * 0.08);
  return { verb, focus, intensity, weight: 1 };
}

function parseMotionGrammar(
  prompt: string,
  style: AnimStyle,
  rand: () => number,
): MotionStep[] {
  const segments = splitSequence(prompt);
  const steps = segments.map((seg) => parseStep(seg, style, rand));
  if (steps.length === 1 && style === "walk") {
    return [{ verb: /run|sprint/.test(prompt.toLowerCase()) ? "run" : "walk", focus: "full", intensity: 1, weight: 1 }];
  }
  if (steps.length === 1 && style === "idle") {
    return [{ verb: "idle", focus: "full", intensity: 0.85, weight: 1 }];
  }
  return steps;
}

function phaseEaseFor(verb: MotionVerb, kind: PhaseKind): EaseKind {
  if (kind === "anticipation") return "soft";
  if (kind === "settle") return "smooth";
  if (kind === "follow") return verb === "jump" || verb === "hop" || verb === "kick" ? "bounce" : "smooth";
  if (verb === "punch" || verb === "kick" || verb === "slash" || verb === "stomp") return "snap";
  if (verb === "jump" || verb === "hop" || verb === "celebrate" || verb === "victory") return "overshoot";
  return "smooth";
}

function buildPhases(steps: MotionStep[], loopable: boolean): PhaseSpec[] {
  const phases: PhaseSpec[] = [];
  const n = steps.length;
  const totalWeight = steps.reduce((s, x) => s + x.weight, 0) || 1;
  let cursor = 0;

  steps.forEach((step, idx) => {
    const span = step.weight / totalWeight;
    const a = cursor;
    const b = cursor + span;
    cursor = b;

    // Within each step: anticipation → action → follow → (settle only on last if not looping)
    const isLast = idx === n - 1;
    const ant = a;
    const act = lerp(a, b, 0.18);
    const fol = lerp(a, b, 0.55);
    const set = lerp(a, b, 0.82);

    phases.push({ kind: "anticipation", t0: ant, t1: act, step, ease: phaseEaseFor(step.verb, "anticipation") });
    phases.push({ kind: "action", t0: act, t1: fol, step, ease: phaseEaseFor(step.verb, "action") });
    phases.push({ kind: "follow", t0: fol, t1: isLast && !loopable ? set : b, step, ease: phaseEaseFor(step.verb, "follow") });
    if (isLast && !loopable) {
      phases.push({ kind: "settle", t0: set, t1: 1, step, ease: phaseEaseFor(step.verb, "settle") });
    }
  });

  return phases;
}

function applyFocusScale(focus: BodyFocus, joint: JointName): number {
  if (focus === "full") return 1;
  const armL = (joint.startsWith("Left") && joint.includes("Arm")) || joint === "LeftHand";
  const armR = (joint.startsWith("Right") && joint.includes("Arm")) || joint === "RightHand";
  const legL = joint.startsWith("Left") && (joint.includes("Leg") || joint === "LeftFoot");
  const legR = joint.startsWith("Right") && (joint.includes("Leg") || joint === "RightFoot");
  const torso = joint === "UpperTorso" || joint === "LowerTorso" || joint === "Root";
  const head = joint === "Head";

  switch (focus) {
    case "arms":
      return armL || armR ? 1 : torso || head ? 0.45 : 0.2;
    case "legs":
      return legL || legR ? 1 : torso ? 0.4 : 0.15;
    case "leftArm":
      return armL ? 1 : armR ? 0.25 : torso || head ? 0.35 : 0.15;
    case "rightArm":
      return armR ? 1 : armL ? 0.25 : torso || head ? 0.35 : 0.15;
    case "leftLeg":
      return legL ? 1 : legR ? 0.25 : torso ? 0.35 : 0.15;
    case "rightLeg":
      return legR ? 1 : legL ? 0.25 : torso ? 0.35 : 0.15;
    case "torso":
      return torso ? 1 : head ? 0.5 : 0.25;
    case "head":
      return head ? 1 : torso ? 0.35 : 0.1;
    default:
      return 1;
  }
}

function scalePose(poses: JointPose[], focus: BodyFocus, amount: number): JointPose[] {
  return poses.map((p) => {
    const s = applyFocusScale(focus, p.joint) * amount;
    return { joint: p.joint, rx: p.rx * s, ry: p.ry * s, rz: p.rz * s };
  });
}

/** Motion grammar: verb → extreme pose for the action beat */
function verbActionPose(verb: MotionVerb, intensity: number, side: number): JointPose[] {
  const poses = restPose();
  const i = intensity;
  const s = side >= 0 ? 1 : -1;

  switch (verb) {
    case "wave":
      setJoint(poses, "RightUpperArm", -150 * i, 20 * s, -40 * i);
      setJoint(poses, "RightLowerArm", -20 * i, 0, -25 * i);
      setJoint(poses, "RightHand", 0, 0, 20 * i);
      setJoint(poses, "LeftUpperArm", -15 * i, 0, 8);
      setJoint(poses, "UpperTorso", 0, 8 * s * i, 0);
      setJoint(poses, "Head", 0, 12 * s * i, 0);
      break;
    case "spin":
      setJoint(poses, "Root", 0, 160 * i, 0);
      setJoint(poses, "LowerTorso", 0, 40 * i, 0);
      setJoint(poses, "UpperTorso", 0, 30 * i, 8 * i);
      setJoint(poses, "LeftUpperArm", -70 * i, 0, 55 * i);
      setJoint(poses, "RightUpperArm", -70 * i, 0, -55 * i);
      setJoint(poses, "LeftUpperLeg", 18 * i);
      setJoint(poses, "RightUpperLeg", -12 * i);
      setJoint(poses, "Head", 0, -20 * i, 0);
      break;
    case "kick":
      setJoint(poses, "RightUpperLeg", -95 * i, 10, -5);
      setJoint(poses, "RightLowerLeg", -10 * i);
      setJoint(poses, "RightFoot", 20 * i);
      setJoint(poses, "LeftUpperLeg", 18 * i);
      setJoint(poses, "LeftLowerLeg", 25 * i);
      setJoint(poses, "UpperTorso", -12 * i, -25 * i, 0);
      setJoint(poses, "LowerTorso", 0, -12 * i, 0);
      setJoint(poses, "LeftUpperArm", -40 * i, 0, 35 * i);
      setJoint(poses, "RightUpperArm", -30 * i, 0, -20 * i);
      setJoint(poses, "Head", 8, -15 * i, 0);
      break;
    case "punch":
      setJoint(poses, "RightUpperArm", -90 * i, 25, -10);
      setJoint(poses, "RightLowerArm", -5 * i);
      setJoint(poses, "LeftUpperArm", -55 * i, -20, 40 * i);
      setJoint(poses, "LeftLowerArm", -70 * i);
      setJoint(poses, "UpperTorso", 10 * i, 28 * i, 0);
      setJoint(poses, "LowerTorso", 0, 12 * i, 0);
      setJoint(poses, "RightUpperLeg", -18 * i);
      setJoint(poses, "LeftUpperLeg", 12 * i);
      setJoint(poses, "Head", 5, 18 * i, 0);
      break;
    case "jump":
    case "hop":
      setJoint(poses, "Root", verb === "hop" ? -8 * i : -18 * i);
      setJoint(poses, "LeftUpperLeg", -55 * i);
      setJoint(poses, "RightUpperLeg", -55 * i);
      setJoint(poses, "LeftLowerLeg", 70 * i);
      setJoint(poses, "RightLowerLeg", 70 * i);
      setJoint(poses, "LeftUpperArm", -120 * i, 0, 25);
      setJoint(poses, "RightUpperArm", -120 * i, 0, -25);
      setJoint(poses, "UpperTorso", -8 * i);
      setJoint(poses, "Head", -10 * i);
      break;
    case "crouch":
      setJoint(poses, "Root", 12 * i);
      setJoint(poses, "LowerTorso", 18 * i);
      setJoint(poses, "UpperTorso", 12 * i);
      setJoint(poses, "LeftUpperLeg", -70 * i);
      setJoint(poses, "RightUpperLeg", -70 * i);
      setJoint(poses, "LeftLowerLeg", 95 * i);
      setJoint(poses, "RightLowerLeg", 95 * i);
      setJoint(poses, "LeftUpperArm", -40 * i, 0, 20);
      setJoint(poses, "RightUpperArm", -40 * i, 0, -20);
      break;
    case "point":
      setJoint(poses, "RightUpperArm", -85 * i, 35, 0);
      setJoint(poses, "RightLowerArm", -5);
      setJoint(poses, "RightHand", 0, 0, 10);
      setJoint(poses, "LeftUpperArm", -20 * i, 0, 12);
      setJoint(poses, "UpperTorso", 0, 18 * i, 0);
      setJoint(poses, "Head", 0, 22 * i, 0);
      break;
    case "flex":
      setJoint(poses, "LeftUpperArm", -90 * i, 0, 70 * i);
      setJoint(poses, "RightUpperArm", -90 * i, 0, -70 * i);
      setJoint(poses, "LeftLowerArm", -120 * i);
      setJoint(poses, "RightLowerArm", -120 * i);
      setJoint(poses, "UpperTorso", -8 * i);
      setJoint(poses, "Head", -5 * i);
      break;
    case "dance":
      setJoint(poses, "LeftUpperArm", -110 * i, 0, 45 * i);
      setJoint(poses, "RightUpperArm", -50 * i, 0, -55 * i);
      setJoint(poses, "LeftLowerArm", -40 * i);
      setJoint(poses, "RightLowerArm", -25 * i);
      setJoint(poses, "UpperTorso", 0, 0, 14 * i);
      setJoint(poses, "LowerTorso", 0, 18 * i, 0);
      setJoint(poses, "LeftUpperLeg", 25 * i);
      setJoint(poses, "RightUpperLeg", -10 * i);
      setJoint(poses, "Head", 0, -12 * i, 8 * i);
      break;
    case "bow":
      setJoint(poses, "UpperTorso", 55 * i);
      setJoint(poses, "LowerTorso", 25 * i);
      setJoint(poses, "Head", 30 * i);
      setJoint(poses, "LeftUpperArm", -15 * i, 0, 8);
      setJoint(poses, "RightUpperArm", -15 * i, 0, -8);
      setJoint(poses, "LeftUpperLeg", -8 * i);
      setJoint(poses, "RightUpperLeg", -8 * i);
      break;
    case "clap":
      setJoint(poses, "LeftUpperArm", -70 * i, 25, 40 * i);
      setJoint(poses, "RightUpperArm", -70 * i, -25, -40 * i);
      setJoint(poses, "LeftLowerArm", -50 * i);
      setJoint(poses, "RightLowerArm", -50 * i);
      setJoint(poses, "UpperTorso", 6 * i);
      break;
    case "victory":
    case "celebrate":
      setJoint(poses, "LeftUpperArm", -160 * i, 0, 35 * i);
      setJoint(poses, "RightUpperArm", -160 * i, 0, -35 * i);
      setJoint(poses, "LeftLowerArm", -15 * i);
      setJoint(poses, "RightLowerArm", -15 * i);
      setJoint(poses, "UpperTorso", -12 * i);
      setJoint(poses, "Head", -15 * i, 0, 0);
      setJoint(poses, "LeftUpperLeg", 8 * i);
      setJoint(poses, "RightUpperLeg", 8 * i);
      setJoint(poses, "Root", -6 * i);
      break;
    case "block":
      setJoint(poses, "LeftUpperArm", -90 * i, 20, 50 * i);
      setJoint(poses, "RightUpperArm", -90 * i, -20, -50 * i);
      setJoint(poses, "LeftLowerArm", -80 * i);
      setJoint(poses, "RightLowerArm", -80 * i);
      setJoint(poses, "UpperTorso", 12 * i);
      setJoint(poses, "LowerTorso", 8 * i);
      setJoint(poses, "LeftUpperLeg", -20 * i);
      setJoint(poses, "RightUpperLeg", 10 * i);
      setJoint(poses, "Head", 8 * i);
      break;
    case "slash":
      setJoint(poses, "RightUpperArm", -40 * i, 40, -70 * i);
      setJoint(poses, "RightLowerArm", -20 * i);
      setJoint(poses, "LeftUpperArm", -45 * i, 0, 30 * i);
      setJoint(poses, "UpperTorso", 5 * i, -35 * i, 0);
      setJoint(poses, "LowerTorso", 0, -15 * i, 0);
      setJoint(poses, "RightUpperLeg", -15 * i);
      setJoint(poses, "Head", 0, -20 * i, 0);
      break;
    case "stomp":
      setJoint(poses, "RightUpperLeg", -50 * i);
      setJoint(poses, "RightLowerLeg", 10 * i);
      setJoint(poses, "RightFoot", -15 * i);
      setJoint(poses, "LeftUpperLeg", 15 * i);
      setJoint(poses, "UpperTorso", 18 * i);
      setJoint(poses, "LowerTorso", 10 * i);
      setJoint(poses, "LeftUpperArm", -30 * i, 0, 20);
      setJoint(poses, "RightUpperArm", -30 * i, 0, -20);
      setJoint(poses, "Root", 8 * i);
      break;
    case "look":
      setJoint(poses, "Head", 8 * i, 45 * i, 5 * i);
      setJoint(poses, "UpperTorso", 0, 18 * i, 0);
      setJoint(poses, "LeftUpperArm", -12 * i);
      setJoint(poses, "RightUpperArm", -12 * i);
      break;
    case "shrug":
      setJoint(poses, "LeftUpperArm", -20 * i, 0, 55 * i);
      setJoint(poses, "RightUpperArm", -20 * i, 0, -55 * i);
      setJoint(poses, "LeftLowerArm", -40 * i);
      setJoint(poses, "RightLowerArm", -40 * i);
      setJoint(poses, "Head", 0, 0, 0);
      setJoint(poses, "UpperTorso", 5 * i);
      break;
    case "salute":
      setJoint(poses, "RightUpperArm", -140 * i, 20, -20 * i);
      setJoint(poses, "RightLowerArm", -70 * i);
      setJoint(poses, "RightHand", 0, 0, 15);
      setJoint(poses, "LeftUpperArm", -10 * i, 0, 6);
      setJoint(poses, "Head", 0, 0, 0);
      setJoint(poses, "UpperTorso", -4 * i);
      break;
    case "dodge":
      setJoint(poses, "Root", 0, 0, -18 * i);
      setJoint(poses, "LowerTorso", 0, -25 * i, -10 * i);
      setJoint(poses, "UpperTorso", 8 * i, -20 * i, -12 * i);
      setJoint(poses, "LeftUpperLeg", -25 * i);
      setJoint(poses, "RightUpperLeg", 20 * i);
      setJoint(poses, "LeftUpperArm", -60 * i, 0, 40 * i);
      setJoint(poses, "RightUpperArm", -40 * i, 0, -25 * i);
      setJoint(poses, "Head", 0, -15 * i, 0);
      break;
    case "walk":
    case "run": {
      const amp = verb === "run" ? 1.25 : 1;
      setJoint(poses, "LeftUpperLeg", 35 * i * amp);
      setJoint(poses, "RightUpperLeg", -35 * i * amp);
      setJoint(poses, "LeftLowerLeg", 20 * i * amp);
      setJoint(poses, "RightLowerLeg", 40 * i * amp);
      setJoint(poses, "LeftUpperArm", -28 * i * amp);
      setJoint(poses, "RightUpperArm", 28 * i * amp);
      setJoint(poses, "UpperTorso", verb === "run" ? 8 * i : 2 * i, 6 * i, 0);
      setJoint(poses, "Head", 0, -4 * i, 0);
      break;
    }
    case "idle":
    default:
      setJoint(poses, "UpperTorso", 2 * i);
      setJoint(poses, "Head", 3 * i, 4 * i, 0);
      setJoint(poses, "LeftUpperArm", -8 * i, 0, 6);
      setJoint(poses, "RightUpperArm", -8 * i, 0, -6);
      setJoint(poses, "LeftLowerArm", -12 * i);
      setJoint(poses, "RightLowerArm", -12 * i);
      break;
  }

  return poses;
}

function verbAnticipationPose(verb: MotionVerb, intensity: number): JointPose[] {
  const action = verbActionPose(verb, intensity, 1);
  const anti = restPose();

  // Wind-up: opposite / coiled version of the action
  switch (verb) {
    case "punch":
      setJoint(anti, "RightUpperArm", -40 * intensity, -30, 20);
      setJoint(anti, "RightLowerArm", -90 * intensity);
      setJoint(anti, "LeftUpperArm", -50 * intensity, 10, 30);
      setJoint(anti, "UpperTorso", 5, -18 * intensity, 0);
      setJoint(anti, "RightUpperLeg", 10 * intensity);
      setJoint(anti, "LeftUpperLeg", -12 * intensity);
      break;
    case "kick":
      setJoint(anti, "RightUpperLeg", -35 * intensity);
      setJoint(anti, "RightLowerLeg", 70 * intensity);
      setJoint(anti, "UpperTorso", 10 * intensity, 15 * intensity, 0);
      setJoint(anti, "LeftUpperArm", -30 * intensity, 0, 25);
      setJoint(anti, "Root", 6 * intensity);
      break;
    case "jump":
    case "hop":
      setJoint(anti, "Root", 14 * intensity);
      setJoint(anti, "LeftUpperLeg", -65 * intensity);
      setJoint(anti, "RightUpperLeg", -65 * intensity);
      setJoint(anti, "LeftLowerLeg", 100 * intensity);
      setJoint(anti, "RightLowerLeg", 100 * intensity);
      setJoint(anti, "LeftUpperArm", -30 * intensity, 0, 15);
      setJoint(anti, "RightUpperArm", -30 * intensity, 0, -15);
      setJoint(anti, "UpperTorso", 15 * intensity);
      break;
    case "slash":
      setJoint(anti, "RightUpperArm", -130 * intensity, -20, 40);
      setJoint(anti, "RightLowerArm", -40 * intensity);
      setJoint(anti, "UpperTorso", -5, 30 * intensity, 0);
      break;
    case "spin":
      setJoint(anti, "Root", 0, -25 * intensity, 0);
      setJoint(anti, "LeftUpperArm", -40 * intensity, 0, 30);
      setJoint(anti, "RightUpperArm", -40 * intensity, 0, -30);
      setJoint(anti, "UpperTorso", 0, -15 * intensity, 0);
      break;
    case "stomp":
      setJoint(anti, "RightUpperLeg", -80 * intensity);
      setJoint(anti, "RightLowerLeg", 40 * intensity);
      setJoint(anti, "Root", -4 * intensity);
      setJoint(anti, "UpperTorso", -8 * intensity);
      break;
    default:
      return blend(restPose(), action, 0.28);
  }

  return anti;
}

function verbFollowPose(verb: MotionVerb, intensity: number): JointPose[] {
  const action = verbActionPose(verb, intensity, 1);
  // Soften past the peak toward rest with a bit of residual motion
  const follow = blend(action, restPose(), 0.35);

  switch (verb) {
    case "punch":
      addJoint(follow, "RightUpperArm", 15, -8, 5);
      addJoint(follow, "UpperTorso", -4, 8, 0);
      break;
    case "kick":
      addJoint(follow, "RightUpperLeg", 20, 0, 0);
      addJoint(follow, "UpperTorso", 6, 5, 0);
      break;
    case "jump":
    case "hop":
      setJoint(follow, "Root", 4 * intensity);
      setJoint(follow, "LeftUpperLeg", -25 * intensity);
      setJoint(follow, "RightUpperLeg", -25 * intensity);
      setJoint(follow, "LeftLowerLeg", 35 * intensity);
      setJoint(follow, "RightLowerLeg", 35 * intensity);
      setJoint(follow, "LeftUpperArm", -50 * intensity, 0, 15);
      setJoint(follow, "RightUpperArm", -50 * intensity, 0, -15);
      break;
    case "wave":
      addJoint(follow, "RightUpperArm", 20, 0, 15);
      break;
    case "spin":
      addJoint(follow, "Root", 0, 40, 0);
      addJoint(follow, "UpperTorso", 0, 15, 0);
      break;
    default:
      break;
  }
  return follow;
}

function loopCyclePose(style: AnimStyle, phase: number, intensity: number, high: boolean): JointPose[] {
  const poses = restPose();
  // Roblox default walk: ~1 cycle / ~0.8–1.0s feeling — contralateral limbs, pelvis yaw, foot plant
  const swing = Math.sin(phase * Math.PI * 2);
  const swingQ = Math.sin(phase * Math.PI * 2 + Math.PI / 2);
  const swing2 = Math.sin(phase * Math.PI * 4);
  const breath = Math.sin(phase * Math.PI * 2);
  // Plant bias: knee bends more on trailing / recovery side
  const leftPlant = Math.max(0, -swing);
  const rightPlant = Math.max(0, swing);

  if (style === "walk") {
    const amp = intensity;
    const runny = amp > 1.05;
    const leg = (runny ? 48 : 36) * amp;
    const arm = (runny ? 36 : 26) * amp;
    setJoint(poses, "LeftUpperLeg", swing * leg, 0, swing * 3);
    setJoint(poses, "RightUpperLeg", -swing * leg, 0, -swing * 3);
    setJoint(poses, "LeftLowerLeg", leftPlant * 52 * amp + (high ? Math.max(0, swing2) * 6 : 0));
    setJoint(poses, "RightLowerLeg", rightPlant * 52 * amp + (high ? Math.max(0, -swing2) * 6 : 0));
    setJoint(poses, "LeftFoot", -rightPlant * 16 * amp + leftPlant * 6);
    setJoint(poses, "RightFoot", -leftPlant * 16 * amp + rightPlant * 6);
    // Arms counter-swing (classic Roblox / human gait)
    setJoint(poses, "LeftUpperArm", -swing * arm, 0, 8);
    setJoint(poses, "RightUpperArm", swing * arm, 0, -8);
    setJoint(poses, "LeftLowerArm", -18 * amp - rightPlant * 14);
    setJoint(poses, "RightLowerArm", -18 * amp - leftPlant * 14);
    setJoint(poses, "LeftHand", 0, 0, high ? swingQ * 4 : 0);
    setJoint(poses, "RightHand", 0, 0, high ? -swingQ * 4 : 0);
    // Hip / torso yaw toward lead leg; slight forward lean when faster
    setJoint(poses, "LowerTorso", 0, swing * 6 * amp, 0);
    setJoint(poses, "UpperTorso", (runny ? 10 : 3) * amp, swing * 8 * amp, high ? swing2 * 2 : 0);
    setJoint(poses, "Head", (runny ? 4 : 0) * amp, -swing * 6 * amp, 0);
    setJoint(poses, "Root", high ? -Math.abs(swing) * 1.5 * amp : 0, 0, 0);
    return poses;
  }

  if (style === "idle") {
    // Default Roblox idle: slow torso breathe + micro head look + soft shoulder drop
    setJoint(poses, "UpperTorso", breath * 2.2 * intensity, Math.sin(phase * Math.PI * 0.5) * 1.5, 0);
    setJoint(poses, "LowerTorso", breath * 1.1 * intensity);
    setJoint(
      poses,
      "Head",
      Math.sin(phase * Math.PI * 2 + 0.8) * 3.5 * intensity,
      Math.sin(phase * Math.PI * 1.15) * 8 * intensity,
      Math.cos(phase * Math.PI * 2) * 1.5,
    );
    setJoint(poses, "LeftUpperArm", -6 * intensity + breath * 2, 0, 5 + (high ? swing2 * 1.2 : 0));
    setJoint(poses, "RightUpperArm", -6 * intensity + breath * 2, 0, -5 - (high ? swing2 * 1.2 : 0));
    setJoint(poses, "LeftLowerArm", -12 * intensity);
    setJoint(poses, "RightLowerArm", -12 * intensity);
    if (high) {
      setJoint(poses, "LeftHand", 0, 0, breath * 3);
      setJoint(poses, "RightHand", 0, 0, -breath * 3);
      setJoint(poses, "LeftUpperLeg", breath * 1.5);
      setJoint(poses, "RightUpperLeg", -breath * 1.2);
    }
    return poses;
  }

  // combat / emote loopable fallbacks
  if (style === "combat") {
    setJoint(poses, "RightUpperArm", -100 * intensity + swing * 25, 18, -28);
    setJoint(poses, "RightLowerArm", -35 * intensity);
    setJoint(poses, "LeftUpperArm", -45 * intensity, -12, 28);
    setJoint(poses, "LeftLowerArm", -55 * intensity);
    setJoint(poses, "UpperTorso", 8 * intensity, swing * 16 * intensity, high ? swing2 * 3 : 0);
    setJoint(poses, "LowerTorso", 0, swing * 7 * intensity, 0);
    setJoint(poses, "RightUpperLeg", -18 * intensity);
    setJoint(poses, "LeftUpperLeg", 12 * intensity);
    setJoint(poses, "Head", 5, swing * 10, 0);
    return poses;
  }

  setJoint(poses, "LeftUpperArm", -130 * intensity + swing * 18, 0, 38);
  setJoint(poses, "RightUpperArm", -130 * intensity - swing * 18, 0, -38);
  setJoint(poses, "LeftLowerArm", -22 * intensity);
  setJoint(poses, "RightLowerArm", -22 * intensity);
  setJoint(poses, "UpperTorso", swing * 10 * intensity, 0, swing * 7);
  setJoint(poses, "LowerTorso", 0, swing * 12 * intensity, 0);
  setJoint(poses, "Head", -4 + Math.abs(swing) * 8, swing * 14, high ? swing2 * 3 : 0);
  setJoint(poses, "LeftUpperLeg", Math.abs(swing) * 10 * intensity);
  setJoint(poses, "RightUpperLeg", Math.abs(swing) * 10 * intensity);
  return poses;
}

function poseForPhase(phase: PhaseSpec, localT: number, globalT: number, high: boolean): JointPose[] {
  const e = ease(phase.ease, localT);
  const { verb, focus, intensity } = phase.step;
  const side = 1;

  let target: JointPose[];
  if (phase.kind === "anticipation") {
    target = verbAnticipationPose(verb, intensity);
  } else if (phase.kind === "action") {
    target = verbActionPose(verb, intensity, side);
  } else if (phase.kind === "follow") {
    target = verbFollowPose(verb, intensity);
  } else {
    target = blend(verbFollowPose(verb, intensity), restPose(), 0.75);
  }

  target = scalePose(target, focus, 1);

  const from =
    phase.kind === "anticipation"
      ? restPose()
      : phase.kind === "action"
        ? verbAnticipationPose(verb, intensity)
        : phase.kind === "follow"
          ? verbActionPose(verb, intensity, side)
          : verbFollowPose(verb, intensity);

  const poses = blend(scalePose(from, focus, 1), target, e);

  if (high) {
    // Smooth secondary motion (not random per-frame jitter)
    const micro = Math.sin(globalT * Math.PI * 4) * 2.8;
    const micro2 = Math.cos(globalT * Math.PI * 3.2) * 2.2;
    addJoint(poses, "Head", micro * 0.35, micro2 * 0.55, micro * 0.15);
    addJoint(poses, "UpperTorso", micro2 * 0.2, micro * 0.15, 0);
    addJoint(poses, "LeftHand", 0, 0, micro);
    addJoint(poses, "RightHand", 0, 0, -micro);
    addJoint(poses, "LeftFoot", micro2 * 0.25, 0, 0);
    addJoint(poses, "RightFoot", -micro2 * 0.25, 0, 0);
  }

  return poses;
}

function sampleTimeline(
  phases: PhaseSpec[],
  t: number,
  high: boolean,
  style: AnimStyle,
  loopable: boolean,
): JointPose[] {
  if (loopable && (style === "walk" || style === "idle")) {
    return loopCyclePose(style, t, high ? 1.12 : 0.92, high);
  }

  const phase = phases.find((p) => t >= p.t0 && t <= p.t1) || phases[phases.length - 1];
  if (!phase) return restPose();
  const span = Math.max(phase.t1 - phase.t0, 0.0001);
  const local = (t - phase.t0) / span;
  return poseForPhase(phase, local, t, high);
}

export function inferDurationSeconds(opts: {
  prompt: string;
  style: AnimStyle;
  stepCount: number;
  intensity?: number;
}): number {
  const p = opts.prompt.toLowerCase();
  const intensity = opts.intensity ?? 1;

  // Explicit time in prompt: "30s", "2 min", "for 10 seconds"
  const secMatch = p.match(/\b(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds)\b/);
  const minMatch = p.match(/\b(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)\b/);
  if (minMatch) {
    return clampDuration(Number(minMatch[1]) * 60);
  }
  if (secMatch) {
    return clampDuration(Number(secMatch[1]));
  }

  if (opts.style === "idle") return clampDuration(4.5 / Math.max(0.7, intensity));
  if (opts.style === "walk") {
    const cycles = /run|sprint|dash/.test(p) ? 3.2 : 2.6;
    return clampDuration(cycles);
  }

  // Emote / combat: ~0.85–1.15s per verb step (Roblox emotes are short; combos stack)
  const perStep = opts.style === "combat" ? 0.95 : 1.05;
  const base = Math.max(1.2, opts.stepCount * perStep);
  const slow = /\b(slow|gentle|soft|dramatic|long)\b/.test(p) ? 1.35 : 1;
  const fast = /\b(fast|quick|snap|rapid)\b/.test(p) ? 0.75 : 1;
  return clampDuration((base * slow * fast) / Math.max(0.75, Math.min(1.35, intensity)));
}

function clampDuration(seconds: number) {
  return Math.min(MAX_ANIMATION_SECONDS, Math.max(0.4, seconds));
}

export function generateAnimationFromPrompt(opts: {
  prompt: string;
  style: AnimStyle;
  /** Optional hint; ignored if omitted — duration is inferred from prompt/style. */
  duration?: number;
  quality: "standard" | "high";
  source?: "text" | "video";
  rig?: RigType;
  intensity?: number;
}): AnimationClip {
  const rig: RigType = opts.rig || "r15";
  const style = detectStyle(opts.prompt, opts.style);
  const seed = hashPrompt(`${opts.prompt}|${style}|${opts.quality}|${rig}|v3`);
  const rand = seeded(seed);
  const high = opts.quality === "high";
  const intensityBoost = (opts.intensity ?? 1) * (high ? 1.12 : 0.95);
  const frames = high ? 64 : 28;
  const loopable = style === "walk" || style === "idle";

  const steps = parseMotionGrammar(opts.prompt, style, rand).map((s) => ({
    ...s,
    intensity: s.intensity * intensityBoost,
  }));
  const phases = buildPhases(steps, loopable);

  const inferred = inferDurationSeconds({
    prompt: opts.prompt,
    style,
    stepCount: steps.length,
    intensity: opts.intensity ?? 1,
  });
  const duration = clampDuration(opts.duration != null ? opts.duration : inferred);

  const keyframes: Keyframe[] = [];
  for (let i = 0; i <= frames; i++) {
    const t = i / frames;
    // Slight arc bias for Pro: sample with eased temporal distribution
    const sampleT = high ? ease("smooth", t) * 0.15 + t * 0.85 : t;
    let poses = sampleTimeline(phases, sampleT, high, style, loopable);
    if (rig === "r6") poses = r15PosesToR6(poses);
    keyframes.push({ time: Number((t * duration).toFixed(4)), poses: clonePose(poses) });
  }

  // Ensure clean settle on non-looping clips
  if (!loopable) {
    const last = keyframes[keyframes.length - 1];
    const rest = rig === "r6" ? r15PosesToR6(restPose()) : restPose();
    keyframes[keyframes.length - 1] = {
      time: duration,
      poses: blend(last.poses, rest, high ? 0.92 : 0.8),
    };
  } else {
    // Close the loop: match first pose at end
    keyframes[keyframes.length - 1] = {
      time: duration,
      poses: clonePose(keyframes[0].poses),
    };
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
    rig,
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
    rig: clip.rig || "r15",
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
      rig: clip.rig || "r15",
      quality: clip.quality,
      source: clip.source,
      createdAt: clip.createdAt,
      id: clip.id,
    },
  };
}
