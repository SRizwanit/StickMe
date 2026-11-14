import React from "react";
import {useCurrentFrame} from "remotion";
import {INK} from "./theme";

export type Pose = "stand" | "walk" | "think" | "reach" | "point" | "shrug" | "sit" | "cheer";
export type Face = "neutral" | "happy" | "sad" | "wow";
type Arm = [number, number];

type Props = {
  x: number; // feet position
  y: number;
  scale?: number;
  pose?: Pose;
  face?: Face;
  flip?: boolean;
  color?: string;
  phone?: boolean;
  lookX?: number;
  phase?: number;
  opacity?: number;
  fArm?: Arm; // override front arm angles (deg, 0 = hanging down, + = toward facing side)
  bArm?: Arm;
};

const rad = (d: number) => (d * Math.PI) / 180;
type Pt = [number, number];
const step = (p: Pt, len: number, deg: number): Pt => [
  p[0] + Math.sin(rad(deg)) * len,
  p[1] + Math.cos(rad(deg)) * len,
];
const chain = (from: Pt, upper: number, lower: number, a: Arm): [Pt, Pt] => {
  const k = step(from, upper, a[0]);
  return [k, step(k, lower, a[1])];
};
const pts = (...p: Pt[]) => p.map((q) => `${q[0]},${q[1]}`).join(" ");

// Hand position of the front arm in the "reach" pose, relative to the feet.
export const reachHand = (x: number, y: number, s: number, flip = false) => ({
  x: x + (flip ? -1 : 1) * 73.9 * s,
  y: y - 158.5 * s,
});

export const StickMan: React.FC<Props> = ({
  x,
  y,
  scale = 1,
  pose = "stand",
  face = "neutral",
  flip = false,
  color = INK,
  phone = false,
  lookX = 0,
  phase = 0,
  opacity = 1,
  fArm,
  bArm,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const s = Math.sin(t * 7 + phase);
  const breath = Math.sin(t * 2.5 + phase) * 2;

  let fA: Arm = [10 + breath, 6];
  let bA: Arm = [-10 - breath, -6];
  let fL: Arm = [6, 0];
  let bL: Arm = [-6, 0];
  let bob = 0;
  let hipH = 92;

  switch (pose) {
    case "walk":
      fA = [-s * 35, -s * 35 + 12];
      bA = [s * 35, s * 35 + 12];
      fL = [s * 30, s * 30 - Math.max(0, -s) * 45];
      bL = [-s * 30, -s * 30 - Math.max(0, s) * 45];
      bob = -Math.abs(s) * 5;
      break;
    case "think":
      fA = [35, 155];
      break;
    case "reach":
      fA = [95, 92];
      break;
    case "point":
      fA = [125, 125];
      break;
    case "shrug": {
      const u = Math.max(0, Math.sin(t * 4 + phase));
      fA = [40 + u * 10, 125];
      bA = [-40 - u * 10, -125];
      break;
    }
    case "sit":
      fL = [88, 2];
      bL = [82, -4];
      hipH = 48;
      break;
    case "cheer": {
      const w = Math.sin(t * 8 + phase) * 10;
      fA = [155 + w, 165 + w];
      bA = [-155 - w, -165 - w];
      bob = -Math.abs(Math.sin(t * 6 + phase)) * 8;
      break;
    }
    default:
      break;
  }
  if (fArm) fA = fArm;
  if (bArm) bA = bArm;

  const SH: Pt = [0, -62];
  const HIP: Pt = [0, 0];
  const [fk, fe] = chain(SH, 38, 36, fA);
  const [bk, be] = chain(SH, 38, 36, bA);
  const [flk, fle] = chain(HIP, 46, 46, fL);
  const [blk, ble] = chain(HIP, 46, 46, bL);

  const sw = 7;
  const line = {
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const hc: Pt = [0, -90];
  const eyeY = hc[1] - 4;
  let mouth: React.ReactNode;
  if (face === "happy") {
    mouth = <path d={`M ${-9} ${hc[1] + 8} Q 0 ${hc[1] + 20} 9 ${hc[1] + 8}`} {...line} strokeWidth={3.5} />;
  } else if (face === "sad") {
    mouth = <path d={`M ${-9} ${hc[1] + 16} Q 0 ${hc[1] + 6} 9 ${hc[1] + 16}`} {...line} strokeWidth={3.5} />;
  } else if (face === "wow") {
    mouth = <ellipse cx={0} cy={hc[1] + 13} rx={5} ry={7} fill={color} />;
  } else {
    mouth = <line x1={-7} y1={hc[1] + 12} x2={7} y2={hc[1] + 12} stroke={color} strokeWidth={3.5} strokeLinecap="round" />;
  }

  return (
    <g
      opacity={opacity}
      transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
    >
      <g transform={`translate(0 ${-hipH + bob})`}>
        {/* back limbs */}
        <polyline points={pts(SH, bk, be)} {...line} />
        <polyline points={pts(HIP, blk, ble)} {...line} />
        {/* torso */}
        <line x1={0} y1={-68} x2={0} y2={0} {...line} />
        {/* front limbs */}
        <polyline points={pts(HIP, flk, fle)} {...line} />
        <polyline points={pts(SH, fk, fe)} {...line} />
        {/* head */}
        <circle cx={hc[0]} cy={hc[1]} r={22} fill="#fffdf6" stroke={color} strokeWidth={sw} />
        <circle cx={-7 + lookX} cy={eyeY} r={2.8} fill={color} />
        <circle cx={8 + lookX} cy={eyeY} r={2.8} fill={color} />
        {mouth}
        {phone && (
          <g transform={`translate(${fe[0]} ${fe[1]}) rotate(-10)`}>
            <circle r={60} fill="url(#glow)" opacity={0.85} />
            <rect x={-13} y={-28} width={26} height={46} rx={5} fill="#2b2b2b" />
            <rect x={-10} y={-24} width={20} height={38} rx={3} fill="#8fd3ff" />
          </g>
        )}
      </g>
    </g>
  );
};
