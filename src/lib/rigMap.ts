import type { JointName, JointPose, RigType } from "./types";
import { R6_JOINTS, R15_JOINTS } from "./types";

function getPose(poses: JointPose[], joint: JointName): JointPose {
  return poses.find((p) => p.joint === joint) || { joint, rx: 0, ry: 0, rz: 0 };
}

function mix(a: JointPose, b: JointPose, t: number, joint: JointName): JointPose {
  return {
    joint,
    rx: a.rx + (b.rx - a.rx) * t,
    ry: a.ry + (b.ry - a.ry) * t,
    rz: a.rz + (b.rz - a.rz) * t,
  };
}

/** Collapse R15 poses into classic R6 parts for preview + Studio export. */
export function r15PosesToR6(poses: JointPose[]): JointPose[] {
  const root = getPose(poses, "Root");
  const lower = getPose(poses, "LowerTorso");
  const upper = getPose(poses, "UpperTorso");
  const head = getPose(poses, "Head");
  const lua = getPose(poses, "LeftUpperArm");
  const lla = getPose(poses, "LeftLowerArm");
  const rua = getPose(poses, "RightUpperArm");
  const rla = getPose(poses, "RightLowerArm");
  const lul = getPose(poses, "LeftUpperLeg");
  const lll = getPose(poses, "LeftLowerLeg");
  const rul = getPose(poses, "RightUpperLeg");
  const rll = getPose(poses, "RightLowerLeg");

  return [
    { joint: "Root", rx: root.rx, ry: root.ry, rz: root.rz },
    mix(lower, upper, 0.55, "Torso"),
    { joint: "Head", rx: head.rx, ry: head.ry, rz: head.rz },
    mix(lua, lla, 0.35, "LeftArm"),
    mix(rua, rla, 0.35, "RightArm"),
    mix(lul, lll, 0.35, "LeftLeg"),
    mix(rul, rll, 0.35, "RightLeg"),
  ];
}

export function jointsForRig(rig: RigType): JointName[] {
  return rig === "r6" ? R6_JOINTS : R15_JOINTS;
}

export function assetPath(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path}`;
}
