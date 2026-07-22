export type Plan = "free" | "pro";

export type AnimStyle = "emote" | "combat" | "idle" | "walk";

export type JointName =
  | "Root"
  | "LowerTorso"
  | "UpperTorso"
  | "Head"
  | "LeftUpperArm"
  | "LeftLowerArm"
  | "LeftHand"
  | "RightUpperArm"
  | "RightLowerArm"
  | "RightHand"
  | "LeftUpperLeg"
  | "LeftLowerLeg"
  | "LeftFoot"
  | "RightUpperLeg"
  | "RightLowerLeg"
  | "RightFoot";

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
