export type Plan = "free" | "pro";

export type AnimStyle = "emote" | "combat" | "idle" | "walk";

/** Clips always use R15; r6 kept only for legacy library entries. */
export type RigType = "r15" | "r6";

/** Studio preview: one fighter or two fighting. */
export type PreviewMode = "solo" | "duel";

/** Canonical joint names used in clips (R15). Legacy R6 names may appear in old clips. */
export type JointName =
  | "Root"
  | "LowerTorso"
  | "UpperTorso"
  | "Torso"
  | "Head"
  | "LeftUpperArm"
  | "LeftLowerArm"
  | "LeftHand"
  | "LeftArm"
  | "RightUpperArm"
  | "RightLowerArm"
  | "RightHand"
  | "RightArm"
  | "LeftUpperLeg"
  | "LeftLowerLeg"
  | "LeftFoot"
  | "LeftLeg"
  | "RightUpperLeg"
  | "RightLowerLeg"
  | "RightFoot"
  | "RightLeg";

export const R15_JOINTS: JointName[] = [
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

/** @deprecated R6 removed from maker; kept for legacy clip conversion. */
export const R6_JOINTS: JointName[] = [
  "Root",
  "Torso",
  "Head",
  "LeftArm",
  "RightArm",
  "LeftLeg",
  "RightLeg",
];

/** Map clip joint → glTF / Roblox bone name */
export const R15_BONE_MAP: Record<string, string> = {
  Root: "HumanoidRootPart",
  LowerTorso: "LowerTorso",
  UpperTorso: "UpperTorso",
  Head: "Head",
  LeftUpperArm: "LeftUpperArm",
  LeftLowerArm: "LeftLowerArm",
  LeftHand: "LeftHand",
  RightUpperArm: "RightUpperArm",
  RightLowerArm: "RightLowerArm",
  RightHand: "RightHand",
  LeftUpperLeg: "LeftUpperLeg",
  LeftLowerLeg: "LeftLowerLeg",
  LeftFoot: "LeftFoot",
  RightUpperLeg: "RightUpperLeg",
  RightLowerLeg: "RightLowerLeg",
  RightFoot: "RightFoot",
};

/** Hard cap for any generated / imported clip length (7 minutes). */
export const MAX_ANIMATION_SECONDS = 7 * 60;

export interface JointPose {
  joint: JointName;
  // Euler degrees relative to rest
  rx: number;
  ry: number;
  rz: number;
  /** Optional translation (used for Root hop / flip arc) */
  px?: number;
  py?: number;
  pz?: number;
}

export interface Keyframe {
  time: number;
  poses: JointPose[];
}

export interface AnimationClip {
  id: string;
  name: string;
  prompt: string;
  style: AnimStyle;
  rig: RigType;
  duration: number;
  quality: "standard" | "high";
  source: "text" | "video";
  createdAt: string;
  keyframes: Keyframe[];
  /** Parsed motion steps shown in UI after generate */
  parsedSteps?: string[];
  /** Duel: partner clip id (You ↔ Rival) */
  duelPartnerId?: string;
  duelSide?: "A" | "B";
  /** Nested rival clip for duel playback */
  rival?: AnimationClip;
  youtube?: { id: string; title?: string; thumbnail?: string };
}

export const FREE_MONTHLY_USAGE = 30;
export const PRO_MONTHLY_USAGE = 150;

export const PRO_MONTHLY_PRICE = 15.99;
export const PRO_YEARLY_PRICE = 179.99;

export const USAGE_PACKS = [
  { id: "pack_25", generations: 25, price: 4.99 },
  { id: "pack_75", generations: 75, price: 12.99 },
  { id: "pack_200", generations: 200, price: 29.99 },
] as const;
