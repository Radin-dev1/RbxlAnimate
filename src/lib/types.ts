export type Plan = "free" | "pro";

export type AnimStyle = "emote" | "combat" | "idle" | "walk";

export type RigType = "r15" | "r6";

/** Canonical joint names used in clips. R15 uses full set; R6 uses a subset. */
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

/**
 * Matches R6 bones after GLTFLoader sanitizes spaces → underscores
 * (Blender "Left Arm" becomes Three.js "Left_Arm").
 */
export const R6_BONE_MAP: Record<string, string> = {
  Root: "HumanoidRootPart",
  Torso: "Torso",
  Head: "Head",
  LeftArm: "Left_Arm",
  RightArm: "Right_Arm",
  LeftLeg: "Left_Leg",
  RightLeg: "Right_Leg",
};

/** Fallback: drive mesh Object3Ds by sanitized glTF names */
export const R6_MESH_MAP: Record<string, string> = {
  Head: "Head_MBlocky",
  Torso: "Torso_MBlocky",
  LeftArm: "Left_Arm_MBlocky",
  RightArm: "Right_Arm_MBlocky",
  LeftLeg: "Left_Leg_MBlocky",
  RightLeg: "Right_Leg_MBlocky",
};

/** Hard cap for any generated / imported clip length (7 minutes). */
export const MAX_ANIMATION_SECONDS = 7 * 60;

export interface JointPose {
  joint: JointName;
  // Euler degrees relative to rest
  rx: number;
  ry: number;
  rz: number;
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
}

export const FREE_MONTHLY_USAGE = 10;
export const PRO_MONTHLY_USAGE = 150;

export const PRO_MONTHLY_PRICE = 15.99;
export const PRO_YEARLY_PRICE = 179.99;

export const USAGE_PACKS = [
  { id: "pack_25", generations: 25, price: 4.99 },
  { id: "pack_75", generations: 75, price: 12.99 },
  { id: "pack_200", generations: 200, price: 29.99 },
] as const;
