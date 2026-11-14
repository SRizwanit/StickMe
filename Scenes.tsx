import React from "react";
import {StickMan, reachHand} from "./StickMan";
import {INK, RED, BLUE, GREEN, YELLOW, GRAY, PINK, BROWN} from "./theme";

export type SceneProps = {f: number; dur: number; variant: string};
export const GROUND = 770;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);
const sin = Math.sin;
const cos = Math.cos;

type TProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
};
const T: React.FC<TProps> = ({x, y, children, size = 44, fill = INK, anchor = "middle", opacity = 1}) => (
  <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} opacity={opacity} fontWeight={700}>
    {children}
  </text>
);

const Ground: React.FC<{y?: number}> = ({y = GROUND}) => (
  <line x1={80} y1={y} x2={1840} y2={y} stroke={INK} strokeWidth={5} strokeLinecap="round" />
);

const Berry: React.FC<{x: number; y: number; r?: number; fill?: string}> = ({x, y, r = 9, fill = RED}) => (
  <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={2.5} />
);

const BERRY_SPOTS: [number, number][] = [
  [-60, -30], [-25, -55], [15, -62], [55, -35], [-45, -75], [30, -90], [-5, -30], [65, -70], [-75, -55], [10, -105], [45, -10], [-30, -100],
];

const Bush: React.FC<{x: number; y: number; s?: number; berries?: number}> = ({x, y, s = 1, berries = 12}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-45} rx={105} ry={62} fill="#8fcf80" stroke={INK} strokeWidth={5} />
    {BERRY_SPOTS.slice(0, Math.max(0, berries)).map(([a, b], i) => (
      <Berry key={i} x={a} y={b} />
    ))}
  </g>
);

const Tree: React.FC<{x: number; y: number; s?: number; fruit?: boolean}> = ({x, y, s = 1, fruit = false}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={0} y1={0} x2={0} y2={-150} stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <circle cx={0} cy={-205} r={85} fill="#9ad48a" stroke={INK} strokeWidth={6} />
    {fruit &&
      ([[-35, -215], [28, -190], [0, -250], [45, -235], [-50, -170]] as [number, number][]).map(([a, b], i) => (
        <Berry key={i} x={a} y={b} />
      ))}
  </g>
);

const Bird: React.FC<{x: number; y: number; s?: number; flip?: boolean; peck?: number}> = ({x, y, s = 1, flip = false, peck = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <line x1={-6} y1={0} x2={-6} y2={28} stroke={INK} strokeWidth={4} />
    <line x1={8} y1={0} x2={8} y2={28} stroke={INK} strokeWidth={4} />
    <ellipse cx={0} cy={-10} rx={34} ry={24} fill={BLUE} stroke={INK} strokeWidth={4} />
    <path d="M -30 -14 L -62 -34 L -34 0 Z" fill={BLUE} stroke={INK} strokeWidth={4} />
    <g transform={`rotate(${peck * 35} 24 -26)`}>
      <circle cx={30} cy={-30} r={14} fill={BLUE} stroke={INK} strokeWidth={4} />
      <path d="M 42 -32 L 62 -27 L 42 -24 Z" fill={YELLOW} stroke={INK} strokeWidth={3} />
      <circle cx={34} cy={-34} r={2.8} fill={INK} />
    </g>
  </g>
);

const Brain: React.FC<{x: number; y: number; s?: number; left?: string; right?: string}> = ({x, y, s = 1, left = PINK, right = PINK}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={-58} cy={0} rx={92} ry={72} fill={left} stroke={INK} strokeWidth={6} />
    <ellipse cx={58} cy={0} rx={92} ry={72} fill={right} stroke={INK} strokeWidth={6} />
    <path d="M -120 -15 q 20 -30 40 0 t 40 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <path d="M 40 -20 q 20 -30 40 0 t 40 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <path d="M -100 28 q 20 -28 40 0 t 40 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <path d="M 20 30 q 20 -28 40 0 t 40 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const DopamineDots: React.FC<{x: number; y: number; f: number; n?: number; spread?: number}> = ({x, y, f, n = 9, spread = 230}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const a = (i / n) * Math.PI * 2 + f * 0.03;
      const r = spread * (0.7 + 0.3 * sin(f * 0.07 + i));
      return <circle key={i} cx={x + cos(a) * r} cy={y + sin(a) * r * 0.55} r={11} fill={YELLOW} stroke={INK} strokeWidth={3} />;
    })}
  </g>
);

const BigPhone: React.FC<{x: number; y: number; f: number; w?: number; h?: number; speed?: number; hearts?: boolean; refresh?: boolean}> = ({
  x, y, f, w = 360, h = 680, speed = 5, hearts = false, refresh = false,
}) => {
  const cardH = 150;
  const gap = 20;
  const pitch = cardH + gap;
  const pull = refresh ? Math.max(0, sin(f * 0.08)) * 90 : 0;
  const off = (f * speed) % pitch;
  const base = Math.floor((f * speed) / pitch);
  const colors = ["#ffd9d2", "#d7ecff", "#e5f6d8", "#fff0bf", "#ecdcf9"];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={44} fill="#fff" stroke={INK} strokeWidth={8} />
      <clipPath id={`scr-${x}-${y}`}>
        <rect x={20} y={50} width={w - 40} height={h - 90} rx={14} />
      </clipPath>
      <rect x={20} y={50} width={w - 40} height={h - 90} rx={14} fill="#f4f8ff" />
      <g clipPath={`url(#scr-${x}-${y})`}>
        {Array.from({length: Math.ceil((h - 90) / pitch) + 2}).map((_, i) => {
          const idx = base - i;
          const cy = 50 + i * pitch - pitch + off + pull;
          const c = colors[((idx % 5) + 5) % 5];
          return (
            <g key={i}>
              <rect x={32} y={cy} width={w - 64} height={cardH} rx={16} fill={c} stroke={INK} strokeWidth={3} />
              <circle cx={32 + 38} cy={cy + 40} r={22} fill="#fff" stroke={INK} strokeWidth={3} />
              <rect x={32 + 76} y={cy + 24} width={120} height={12} rx={6} fill={INK} opacity={0.55} />
              <rect x={32 + 76} y={cy + 48} width={80} height={10} rx={5} fill={INK} opacity={0.3} />
              <rect x={44} y={cy + 92} width={w - 90} height={12} rx={6} fill={INK} opacity={0.25} />
              <rect x={44} y={cy + 116} width={w - 140} height={12} rx={6} fill={INK} opacity={0.25} />
              {hearts && idx % 3 === 0 && <path d={`M ${w - 90} ${cy + 40} q -14 -22 -26 -4 q -12 -18 -26 4 q 0 16 26 32 q 26 -16 26 -32 z`} fill={RED} stroke={INK} strokeWidth={2.5} />}
            </g>
          );
        })}
        {refresh && pull > 4 && (
          <g transform={`translate(${w / 2} ${60 + pull / 2}) rotate(${f * 14})`}>
            <path d="M -18 0 A 18 18 0 1 1 0 18" fill="none" stroke={BLUE} strokeWidth={6} strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ phone
const PhoneScene: React.FC<SceneProps> = ({f, dur, variant}) => {
  const reach = variant === "hand" ? clamp(f / (dur * 0.6), 0, 1) : 1;
  const sx = 700;
  const sc = 2.2;
  const scan = (f * 6) % 440;
  const hand = reachHand(sx, GROUND, sc);
  return (
    <g>
      <Ground />
      <StickMan
        x={sx}
        y={GROUND}
        scale={sc}
        fArm={[lerp(10, 95, reach), lerp(6, 92, reach)]}
        phone={reach > 0.7}
        lookX={3}
      />
      {[0, 1, 2].map((i) => (
        <T key={i} x={hand.x - 20 + i * 70} y={hand.y - 150 - sin(f * 0.08 + i * 2) * 14 - i * 22} size={70 - i * 10} fill={GRAY} opacity={reach > 0.7 ? 0.8 : 0}>
          ?
        </T>
      ))}
      <g transform="translate(1330 180)">
        <rect width={300} height={580} rx={38} fill="#fff" stroke={INK} strokeWidth={7} />
        <rect x={18} y={42} width={264} height={500} rx={14} fill="#e8f4ff" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={40} y={80 + i * 90} width={220 - (i % 2) * 60} height={14} rx={7} fill={INK} opacity={0.12} />
        ))}
        <rect x={18} y={42 + scan} width={264} height={16} fill={BLUE} opacity={0.45} />
        <T x={150} y={330} size={170} fill={GRAY} opacity={0.5}>?</T>
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ grass
const GrassScene: React.FC<SceneProps> = ({f, dur, variant}) => {
  const bush = variant === "bush";
  const p = f / dur;
  const manX = bush ? 900 : lerp(240, 1250, p);
  const full = bush ? p < 0.5 : true;
  const birdIn = bush && p >= 0.5;
  return (
    <g>
      <g transform={`translate(1640 190) rotate(${f * 0.5})`}>
        <circle r={60} fill={YELLOW} stroke={INK} strokeWidth={5} />
        {Array.from({length: 10}).map((_, i) => (
          <line key={i} x1={0} y1={-80} x2={0} y2={-105} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${i * 36})`} />
        ))}
      </g>
      <path d="M 0 690 Q 400 520 800 680 T 1600 620 T 1920 690 L 1920 1080 L 0 1080 Z" fill="#cfe8c4" stroke={INK} strokeWidth={5} />
      <Ground />
      <Tree x={300} y={GROUND} s={1} />
      <Tree x={1000} y={GROUND} s={0.8} />
      <Tree x={1560} y={GROUND} s={1.05} fruit={!bush} />
      {Array.from({length: 14}).map((_, i) => (
        <path key={i} d={`M ${140 + i * 120} ${GROUND + 24} l 6 -22 l 8 22 l 8 -22 l 6 22`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      ))}
      <Bush x={bush ? 1350 : 1400} y={GROUND} s={1.2} berries={full ? 12 : 0} />
      {birdIn && <Bird x={1300} y={GROUND - 120 - Math.max(0, 80 - (f - dur * 0.5) * 4)} s={1.1} peck={sin(f * 0.4)} />}
      <StickMan x={manX} y={GROUND + 10} scale={1.9} pose={bush ? "shrug" : "walk"} face={bush && !full ? "sad" : "neutral"} />
      {!bush && <T x={manX} y={GROUND - 420} size={60} fill={RED}>hungry</T>}
    </g>
  );
};

// ------------------------------------------------------------------ rat
const RatScene: React.FC<SceneProps> = ({f}) => {
  const press = Math.abs(sin(f * 0.25));
  const count = Math.floor(f / 2);
  const leverAng = press * 30;
  return (
    <g>
      <Ground />
      <StickMan x={430} y={GROUND} scale={1.8} pose="think" lookX={3} />
      <rect x={880} y={300} width={760} height={470} rx={10} fill="#fff" stroke={INK} strokeWidth={6} />
      <line x1={880} y1={740} x2={1640} y2={740} stroke={INK} strokeWidth={6} />
      {/* rat */}
      <g transform={`translate(1090 ${690 + press * 4})`}>
        <path d="M -70 20 q -60 30 -100 -30" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <ellipse cx={0} cy={0} rx={76} ry={42} fill="#cfc8bd" stroke={INK} strokeWidth={5} />
        <circle cx={78} cy={-14} r={30} fill="#cfc8bd" stroke={INK} strokeWidth={5} />
        <circle cx={66} cy={-42} r={13} fill={PINK} stroke={INK} strokeWidth={4} />
        <circle cx={88} cy={-20} r={3.5} fill={INK} />
        <circle cx={108} cy={-8} r={4} fill={INK} />
        <line x1={96} y1={-2} x2={130} y2={-10} stroke={INK} strokeWidth={2} />
        <line x1={96} y1={2} x2={130} y2={8} stroke={INK} strokeWidth={2} />
        <line x1={50} y1={30} x2={50 + 44} y2={30 - press * 20} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* electrode wire */}
      <path d="M 1175 640 L 1175 380 L 1560 380" fill="none" stroke={GRAY} strokeWidth={4} strokeDasharray="12 8" />
      <rect x={1520} y={340} width={90} height={80} rx={8} fill={YELLOW} stroke={INK} strokeWidth={5} />
      <T x={1565} y={455} size={34}>electrode</T>
      {press > 0.85 && (
        <path d="M 1170 640 l 14 -22 l -14 -4 l 18 -26" fill="none" stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
      )}
      {/* lever */}
      <g transform="translate(1520 730)">
        <rect x={-14} y={-10} width={28} height={20} fill={GRAY} stroke={INK} strokeWidth={4} />
        <line x1={0} y1={0} x2={-sin((leverAng * Math.PI) / 180) * 120 - 40} y2={-cos((leverAng * Math.PI) / 180) * 120} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      </g>
      <T x={1260} y={365} size={70} fill={RED}>presses: {count}</T>
    </g>
  );
};

// ------------------------------------------------------------------ brain
const BrainScene: React.FC<SceneProps> = ({f, variant}) => {
  if (variant === "pleasure") {
    const pulse = 1 + sin(f * 0.2) * 0.04;
    return (
      <g>
        <Brain x={640} y={430} s={1.5} />
        <T x={640} y={640} size={52}>dopamine = pleasure?</T>
        <g transform={`translate(1300 470) scale(${pulse})`}>
          <ellipse cx={0} cy={60} rx={150} ry={40} fill={GRAY} stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={20} r={110} fill={RED} stroke={INK} strokeWidth={8} />
          <T x={0} y={-150} size={80} fill={GRAY}>?</T>
        </g>
        <T x={1300} y={690} size={52}>a "pleasure button"</T>
      </g>
    );
  }
  if (variant === "wl") {
    return (
      <g>
        <Brain x={960} y={400} s={2} left={PINK} right="#ffe9a3" />
        <line x1={960} y1={270} x2={960} y2={530} stroke={INK} strokeWidth={4} strokeDasharray="10 8" />
        <T x={660} y={640} size={66}>LIKING</T>
        <T x={660} y={700} size={42} fill={GRAY}>the berry in your mouth</T>
        <T x={1260} y={640} size={66}>WANTING</T>
        <T x={1260} y={700} size={42} fill={GRAY}>the pull toward the next berry</T>
        <DopamineDots x={1260} y={400} f={f} n={7} spread={160} />
      </g>
    );
  }
  if (variant === "crave") {
    return (
      <g>
        <Ground />
        <StickMan x={620} y={GROUND} scale={2.1} pose="reach" phone face="sad" lookX={3} />
        <T x={620} y={250} size={64} fill={RED}>20 minutes later...</T>
        <Brain x={1330} y={400} s={1.3} right="#ffe9a3" />
        <DopamineDots x={1330} y={400} f={f} n={8} spread={230} />
        <T x={1330} y={620} size={52}>craving, not enjoying</T>
      </g>
    );
  }
  // dopamine
  return (
    <g>
      <Brain x={960} y={420} s={2.2} />
      <DopamineDots x={960} y={420} f={f} n={11} spread={400} />
      <T x={960} y={720} size={64}>DOPAMINE</T>
    </g>
  );
};

// ------------------------------------------------------------------ monkey
const Trace: React.FC<{x0: number; x1: number; y: number; ev: {x: number; k: "spike" | "dip"}[]; prog: number}> = ({x0, x1, y, ev, prog}) => {
  let d = `M ${x0} ${y}`;
  ev.forEach((e) => {
    if (e.k === "spike") d += ` L ${e.x - 8} ${y} L ${e.x} ${y - 170} L ${e.x + 8} ${y}`;
    else d += ` L ${e.x - 14} ${y} Q ${e.x} ${y + 70} ${e.x + 26} ${y}`;
  });
  d += ` L ${x1} ${y}`;
  return <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
};

const MonkeyScene: React.FC<SceneProps> = ({f, dur, variant}) => {
  const p = clamp(f / (dur * 0.85), 0, 1);
  const toneX = 1130;
  const juiceX = 1450;
  const hasTone = variant !== "juice";
  const hasJuice = variant === "juice" || variant === "tone" || variant === "error";
  let ev: {x: number; k: "spike" | "dip"}[] = [];
  if (variant === "juice") ev = [{x: juiceX, k: "spike"}];
  if (variant === "tone") ev = [{x: toneX, k: "spike"}];
  if (variant === "miss") ev = [{x: juiceX, k: "dip"}];
  if (variant === "error") ev = [{x: toneX, k: "spike"}, {x: juiceX + 40, k: "dip"}];
  const ring = Math.max(0, sin(f * 0.5)) * 14;
  if (variant === "surprise") {
    const sw = sin(f * 0.15) * 4;
    return (
      <g>
        <T x={960} y={330} size={110}>Certainty is boring.</T>
        <T x={960} y={480} size={110} fill={RED}>Uncertainty is magnetic.</T>
        <g transform={`translate(960 ${640 + sw}) `}>
          <path d="M -120 60 L -120 -40 A 120 120 0 0 1 120 -40 L 120 60 L 60 60 L 60 -40 A 60 60 0 0 0 -60 -40 L -60 60 Z" fill={RED} stroke={INK} strokeWidth={6} />
          <rect x={-120} y={30} width={60} height={30} fill="#fff" stroke={INK} strokeWidth={5} />
          <rect x={60} y={30} width={60} height={30} fill="#fff" stroke={INK} strokeWidth={5} />
        </g>
      </g>
    );
  }
  return (
    <g>
      <Ground />
      {/* monkey */}
      <g transform="translate(420 560)">
        <circle cx={-92} cy={-20} r={34} fill={BROWN} stroke={INK} strokeWidth={5} />
        <circle cx={92} cy={-20} r={34} fill={BROWN} stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={0} r={105} fill={BROWN} stroke={INK} strokeWidth={6} />
        <ellipse cx={0} cy={26} rx={62} ry={50} fill="#e9c9a3" stroke={INK} strokeWidth={4} />
        <circle cx={-34} cy={-22} r={8} fill={INK} />
        <circle cx={34} cy={-22} r={8} fill={INK} />
        {variant === "miss" ? (
          <path d="M -22 52 Q 0 34 22 52" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        ) : (
          <path d="M -22 40 Q 0 62 22 40" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        )}
      </g>
      {/* juice */}
      {hasJuice && (
        <g transform="translate(560 740)">
          <path d="M -36 -70 L 36 -70 L 28 0 L -28 0 Z" fill="#ffb347" stroke={INK} strokeWidth={5} />
          <T x={0} y={50} size={38}>juice</T>
        </g>
      )}
      {/* tone */}
      {hasTone && (
        <g transform="translate(250 330)">
          <path d="M -40 40 Q -40 -40 0 -50 Q 40 -40 40 40 Z" fill={YELLOW} stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={50} r={9} fill={INK} />
          <path d={`M ${55 + ring} -20 q 18 20 0 40`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d={`M ${80 + ring} -34 q 28 34 0 68`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <T x={0} y={100} size={38}>tone</T>
        </g>
      )}
      {/* neuron trace */}
      <rect x={880} y={200} width={900} height={500} rx={14} fill="#fff" stroke={INK} strokeWidth={5} />
      <T x={1330} y={260} size={44} fill={GRAY}>one dopamine neuron</T>
      <line x1={920} y1={560} x2={1740} y2={560} stroke={GRAY} strokeWidth={2} strokeDasharray="8 8" />
      <Trace x0={920} x1={1740} y={560} ev={ev} prog={p} />
      {hasTone && <T x={toneX} y={640} size={40}>tone</T>}
      {(hasJuice || variant === "miss") && <T x={juiceX} y={640} size={40} fill={variant === "miss" ? GRAY : INK}>{variant === "miss" ? "no juice" : "juice"}</T>}
      {variant === "error" && (
        <>
          <T x={toneX} y={350} size={40} fill={GREEN}>better than expected ↑</T>
          <T x={juiceX + 30} y={690} size={40} fill={RED}>worse ↓</T>
        </>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ slot
const REEL_COLORS = [RED, YELLOW, BLUE, GREEN, PINK];

const Pigeon: React.FC<{x: number; y: number; f: number; rate: number}> = ({x, y, f, rate}) => {
  const peck = Math.max(0, sin(f * rate)) * 0.9;
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={-8} y1={0} x2={-8} y2={36} stroke={INK} strokeWidth={5} />
      <line x1={12} y1={0} x2={12} y2={36} stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={-26} rx={52} ry={38} fill="#b8b3c4" stroke={INK} strokeWidth={5} />
      <path d="M -46 -30 L -92 -52 L -50 -2 Z" fill="#9f99ad" stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${peck * 40} 36 -48)`}>
        <circle cx={44} cy={-54} r={20} fill="#b8b3c4" stroke={INK} strokeWidth={5} />
        <path d="M 62 -56 L 90 -48 L 62 -44 Z" fill={YELLOW} stroke={INK} strokeWidth={4} />
        <circle cx={50} cy={-60} r={3.5} fill={INK} />
      </g>
    </g>
  );
};

const SlotMachine: React.FC<{x: number; y: number; f: number; s?: number; spinUntil?: number}> = ({x, y, f, s = 1, spinUntil = 60}) => {
  const lever = f % 120 < 14 ? 40 - Math.abs(f % 120 - 7) * 5 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-200} y={-520} width={400} height={520} rx={30} fill={RED} stroke={INK} strokeWidth={8} />
      <rect x={-160} y={-400} width={320} height={160} rx={12} fill="#fff" stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((i) => {
        const spinning = f < spinUntil + i * 16;
        const idx = spinning ? Math.floor(f / 3 + i * 2) % REEL_COLORS.length : (i * 2 + 1) % REEL_COLORS.length;
        return <circle key={i} cx={-100 + i * 100} cy={-320} r={36} fill={REEL_COLORS[idx]} stroke={INK} strokeWidth={5} />;
      })}
      <T x={0} y={-440} size={48} fill="#fff">JACKPOT</T>
      <rect x={-120} y={-200} width={240} height={50} rx={10} fill={INK} opacity={0.8} />
      <line x1={200} y1={-300} x2={250} y2={-300 + lever} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <circle cx={250} cy={-300 + lever} r={20} fill={YELLOW} stroke={INK} strokeWidth={5} />
    </g>
  );
};

const SlotScene: React.FC<SceneProps> = ({f, dur, variant}) => {
  if (variant === "pigeons") {
    const half = Math.floor(dur * 0.5);
    const calm = f < half;
    const count = calm ? Math.floor(f / 20) : Math.floor(half / 20) + Math.floor((f - half) / 3);
    return (
      <g>
        <Ground />
        <Pigeon x={560} y={GROUND - 40} f={f} rate={calm ? 0.3 : 1.6} />
        <rect x={880} y={560} width={150} height={150} rx={20} fill={calm ? GREEN : RED} stroke={INK} strokeWidth={6} />
        <T x={955} y={655} size={44} fill="#fff">lever</T>
        <T x={1400} y={400} size={110} fill={calm ? INK : RED}>{count}</T>
        <T x={1400} y={470} size={46} fill={GRAY}>presses</T>
        <T x={1400} y={580} size={54}>{calm ? "food every time: calm" : "food at random: obsessed"}</T>
      </g>
    );
  }
  return (
    <g>
      <Ground />
      <SlotMachine x={variant === "ancestors" ? 1100 : 960} y={GROUND} f={f} s={1.2} />
      {variant === "ancestors" && <StickMan x={560} y={GROUND} scale={1.9} pose="reach" lookX={3} face="wow" />}
      {variant === "name" && <T x={960} y={170} size={70}>sometimes after 2 presses, sometimes after 20</T>}
    </g>
  );
};

// ------------------------------------------------------------------ feed
const FeedScene: React.FC<SceneProps> = ({f, variant}) => {
  const refresh = variant === "refresh";
  return (
    <g>
      <Ground y={GROUND + 40} />
      <StickMan x={420} y={GROUND + 40} scale={2} pose="stand" face={variant === "endless" ? "wow" : "neutral"} lookX={5} />
      <BigPhone x={780} y={90} f={f} refresh={refresh} hearts={refresh} speed={variant === "endless" ? 7 : 5} />
      {variant === "hunger" && (
        <g>
          <circle cx={1450} cy={330} r={80} fill={RED} stroke={INK} strokeWidth={6} />
          <path d="M 1450 252 q 20 -40 50 -30 q -10 30 -50 30" fill={GREEN} stroke={INK} strokeWidth={4} />
          <T x={1450} y={480} size={50}>oldest hunger</T>
          <path d="M 1350 560 L 1200 600" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          <T x={1450} y={640} size={50}>glass rectangle</T>
        </g>
      )}
      {variant === "endless" && (
        <g>
          <T x={1500} y={330} size={190}>∞</T>
          <T x={1500} y={430} size={54}>always one swipe away</T>
        </g>
      )}
      {refresh && <T x={1500} y={330} size={60}>nothing... or maybe something?</T>}
    </g>
  );
};

// ------------------------------------------------------------------ forage
const Page: React.FC<{x: number; y: number; rich: boolean; label: string}> = ({x, y, rich, label}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={360} height={300} rx={12} fill="#fff" stroke={INK} strokeWidth={5} />
    <rect width={360} height={40} rx={12} fill="#e6e1d2" stroke={INK} strokeWidth={5} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={24} y={70 + i * 54} width={rich ? 312 - i * 20 : 100 - i * 10} height={14} rx={7} fill={rich ? GREEN : INK} opacity={rich ? 0.7 : 0.2} />
    ))}
    <T x={180} y={350} size={42} fill={rich ? GREEN : GRAY}>{label}</T>
  </g>
);

const ForageScene: React.FC<SceneProps> = ({f, dur, variant}) => {
  const p = f / dur;
  if (variant === "pages" || variant === "food") {
    const idx = clamp(p * 3, 0, 2.999);
    const stop = Math.floor(idx);
    const frac = idx - stop;
    const xs = [420 + 180, 860 + 180, 1300 + 180];
    const hop = frac > 0.7 && stop < 2;
    const mx = hop ? lerp(xs[stop], xs[stop + 1], (frac - 0.7) / 0.3) : xs[stop];
    const my = 250 - (hop ? sin(((frac - 0.7) / 0.3) * Math.PI) * 120 : 0);
    return (
      <g>
        <Page x={420} y={290} rich label={variant === "food" ? "information = food" : "rich: stay"} />
        <Page x={860} y={290} rich={false} label="thin: leave" />
        <Page x={1300} y={290} rich label="rich: stay" />
        <StickMan x={mx} y={my + 90} scale={0.9} pose="stand" face="happy" />
        {variant === "food" && [0, 1, 2].map((i) => <Berry key={i} x={600 + i * 440} y={720} r={24} />)}
      </g>
    );
  }
  // bird
  const eaten = Math.floor(clamp(p / 0.7, 0, 1) * 12);
  const left = 12 - eaten;
  const hopP = clamp((p - 0.7) / 0.3, 0, 1);
  const bx = lerp(600, 1300, hopP);
  const by = GROUND - 100 - (hopP > 0 && hopP < 1 ? sin(hopP * Math.PI) * 140 : 0);
  return (
    <g>
      <Ground />
      <Bush x={600} y={GROUND} s={1.5} berries={left} />
      <Bush x={1300} y={GROUND} s={1.5} berries={12} />
      <Bird x={bx} y={by} s={1.3} peck={hopP === 0 ? sin(f * 0.5) : 0} />
      <T x={600} y={GROUND + 70} size={44} fill={GRAY}>berries left: {left}</T>
      <T x={1300} y={GROUND + 70} size={44} fill={GRAY}>the next bush</T>
    </g>
  );
};

// ------------------------------------------------------------------ tribe
const Fire: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => {
  const k = 1 + sin(f * 0.4) * 0.12;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M 0 0 C -60 -20 -50 -90 0 -140 C 10 -90 60 -70 0 0 Z" fill={RED} stroke={INK} strokeWidth={5} />
      <path d="M 0 0 C -28 -10 -22 -50 0 -70 C 8 -40 28 -34 0 0 Z" fill={YELLOW} stroke={INK} strokeWidth={4} />
    </g>
  );
};

const TribeScene: React.FC<SceneProps> = ({f, dur, variant}) => {
  const p = f / dur;
  if (variant === "group") {
    return (
      <g>
        <Ground />
        <Fire x={960} y={GROUND} f={f} />
        {[560, 740, 1180, 1360].map((x, i) => (
          <StickMan key={i} x={x} y={GROUND} scale={1.4} phase={i} flip={x > 960} face="happy" lookX={x > 960 ? -2 : 2} />
        ))}
        <StickMan x={250} y={GROUND} scale={1.4} face="sad" pose="shrug" />
        <T x={250} y={GROUND - 340} size={46} fill={RED}>alone = dinner</T>
      </g>
    );
  }
  if (variant === "gossip") {
    const a = Math.floor(f / 40) % 2 === 0;
    return (
      <g>
        <Ground />
        <StickMan x={640} y={GROUND} scale={2} pose={a ? "point" : "stand"} face="happy" />
        <StickMan x={1280} y={GROUND} scale={2} flip pose={a ? "stand" : "point"} face="happy" />
        <g transform={`translate(${a ? 640 : 1280} 250)`}>
          <ellipse rx={150} ry={64} fill="#fff" stroke={INK} strokeWidth={5} />
          <T x={0} y={14} size={56}>{"...".slice(0, 1 + (Math.floor(f / 8) % 3))}</T>
        </g>
        <T x={960} y={160} size={52} fill={GRAY}>who is angry with me? who is allied with whom?</T>
      </g>
    );
  }
  if (variant === "ball") {
    const tp = (f % 60) / 60;
    const dir = Math.floor(f / 60) % 2 === 0;
    const bx = dir ? lerp(660, 1260, tp) : lerp(1260, 660, tp);
    const by = 520 - sin(tp * Math.PI) * 200;
    return (
      <g>
        <rect x={360} y={120} width={1200} height={680} rx={24} fill="#eef5ff" stroke={INK} strokeWidth={8} />
        <T x={960} y={190} size={46} fill={GRAY}>a simple virtual game · strangers · nothing at stake</T>
        <StickMan x={600} y={740} scale={1.3} face="happy" pose="reach" />
        <StickMan x={1320} y={740} scale={1.3} flip face="happy" pose="reach" />
        <StickMan x={960} y={740} scale={1.3} face={p > 0.5 ? "sad" : "neutral"} pose="reach" />
        <circle cx={bx} cy={by} r={20} fill={RED} stroke={INK} strokeWidth={4} />
      </g>
    );
  }
  if (variant === "hurt") {
    const k = 1 + sin(f * 0.3) * 0.08;
    return (
      <g>
        <Ground />
        <StickMan x={820} y={GROUND} scale={2.3} face="sad" pose="shrug" />
        <g transform={`translate(1230 380) scale(${k})`}>
          <Brain x={0} y={0} s={1} />
          <path d="M -40 -30 l 30 20 l -20 6 l 30 24" fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round" />
        </g>
        <T x={1230} y={540} size={50} fill={RED}>the distress of physical pain</T>
      </g>
    );
  }
  if (variant === "badge") {
    const buzz = f % 30 < 6 ? sin(f * 3) * 6 : 0;
    return (
      <g>
        <Ground />
        <StickMan x={680} y={GROUND} scale={2.1} pose="reach" phone face="happy" lookX={3} />
        <g transform={`translate(${1300 + buzz} 300)`}>
          <rect width={260} height={260} rx={52} fill="#7dd3a8" stroke={INK} strokeWidth={7} />
          <path d="M 60 80 h 140 a 14 14 0 0 1 14 14 v 60 a 14 14 0 0 1 -14 14 h -90 l -34 30 v -30 a 14 14 0 0 1 -30 -14 v -60 a 14 14 0 0 1 14 -14 z" fill="#fff" stroke={INK} strokeWidth={5} />
          <circle cx={240} cy={20} r={46} fill={RED} stroke={INK} strokeWidth={6} />
          <T x={240} y={38} size={56} fill="#fff">1</T>
        </g>
        <T x={1430} y={640} size={50}>someone noticed you</T>
      </g>
    );
  }
  // absence
  const away = lerp(1100, 1700, p);
  return (
    <g>
      <Ground />
      <StickMan x={520} y={GROUND} scale={2.1} pose="reach" phone face="sad" lookX={3} />
      <T x={520} y={230} size={70} fill={GRAY}>again. and again.</T>
      {[0, 1, 2].map((i) => (
        <StickMan key={i} x={away + i * 70} y={GROUND} scale={0.8} pose="walk" phase={i} flip={false} opacity={0.55} />
      ))}
      <T x={1400} y={260} size={46} fill={GRAY}>is the tribe still there?</T>
    </g>
  );
};

// ------------------------------------------------------------------ mismatch
const Gear: React.FC<{x: number; y: number; r: number; rot: number; fill?: string}> = ({x, y, r, rot, fill = "#cfc8bd"}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {Array.from({length: 8}).map((_, i) => (
      <rect key={i} x={-r * 0.14} y={-r * 1.28} width={r * 0.28} height={r * 0.36} fill={fill} stroke={INK} strokeWidth={4} transform={`rotate(${i * 45})`} />
    ))}
    <circle r={r} fill={fill} stroke={INK} strokeWidth={6} />
    <circle r={r * 0.35} fill="#fff" stroke={INK} strokeWidth={5} />
  </g>
);

const MismatchScene: React.FC<SceneProps> = ({f, variant}) => {
  if (variant === "machine") {
    return (
      <g>
        <T x={560} y={230} size={54}>then: sweet things were rare</T>
        <Berry x={560} y={360} r={34} />
        <T x={1360} y={230} size={54}>now: everywhere</T>
        {Array.from({length: 18}).map((_, i) => (
          <Berry key={i} x={1130 + (i % 6) * 90} y={330 + Math.floor(i / 6) * 90} r={28} />
        ))}
        <path d="M 760 360 L 1000 360" stroke={INK} strokeWidth={7} strokeLinecap="round" markerEnd="url(#arrow)" />
        <Gear x={560} y={640} r={60} rot={f * 2} />
        <Gear x={668} y={660} r={44} rot={-f * 2.7} fill="#ffe9a3" />
        <T x={1360} y={680} size={50}>a perfectly working machine</T>
      </g>
    );
  }
  if (variant === "drive") {
    const reach = clamp(f / 120, 0, 1);
    const mx = lerp(650, 960, reach);
    const my = lerp(GROUND, 330, reach);
    return (
      <g>
        <Ground />
        <path d="M 360 770 L 960 330 L 1560 770 Z" fill="#d9d4c7" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M 960 330 L 905 380 L 945 372 L 975 392 L 1010 372 Z" fill="#fff" stroke={INK} strokeWidth={4} />
        <StickMan x={mx} y={my} scale={1.4} pose={reach >= 1 ? "cheer" : "walk"} face="happy" />
        <line x1={1100} y1={250} x2={1100} y2={150} stroke={INK} strokeWidth={6} />
        <path d="M 1100 150 L 1200 175 L 1100 200 Z" fill={RED} stroke={INK} strokeWidth={4} />
        <T x={1480} y={300} size={50}>map · ship · telescope · library</T>
      </g>
    );
  }
  // broken
  return (
    <g>
      <Ground />
      <StickMan x={960} y={GROUND} scale={2.3} face="happy" pose="stand" />
      <Gear x={960} y={190} r={50} rot={f * 2} />
      <Gear x={1060} y={215} r={36} rot={-f * 2.7} fill="#ffe9a3" />
      <path d="M 1300 470 l 50 60 l 110 -140" fill="none" stroke={GREEN} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// ------------------------------------------------------------------ advice
const AdviceScene: React.FC<SceneProps> = ({f, dur, variant}) => {
  const p = f / dur;
  if (variant === "notice") {
    const items = ["Information?", "Connection?", "Relief?"];
    const shown = clamp(Math.floor(p * 4), 0, 3);
    return (
      <g>
        <Ground />
        <StickMan x={620} y={GROUND} scale={2.1} pose="think" lookX={3} />
        <ellipse cx={1250} cy={330} rx={330} ry={200} fill="#fff" stroke={INK} strokeWidth={6} />
        <circle cx={880} cy={520} r={16} fill="#fff" stroke={INK} strokeWidth={5} />
        <circle cx={830} cy={590} r={10} fill="#fff" stroke={INK} strokeWidth={5} />
        <T x={1250} y={250} size={46} fill={GRAY}>what am I foraging for?</T>
        {items.map((t, i) => (
          <T key={i} x={1250} y={330 + i * 62} size={54} opacity={i < shown ? 1 : 0.15}>{t}</T>
        ))}
      </g>
    );
  }
  if (variant === "boredom") {
    const words = ["walking", "building", "wandering", "talking"];
    const shown = clamp(Math.floor(p * 5), 0, 4);
    return (
      <g>
        <Ground />
        <StickMan x={lerp(300, 1300, p)} y={GROUND} scale={1.9} pose="walk" face="happy" />
        {words.map((w, i) => (
          <T key={w} x={300 + i * 440} y={250} size={64} fill={RED} opacity={i < shown ? 1 : 0.12}>{w}</T>
        ))}
        <T x={960} y={170} size={46} fill={GRAY}>"go and look for something"</T>
      </g>
    );
  }
  if (variant === "landscape") {
    const move = clamp((f - 30) / 60, 0, 1);
    return (
      <g>
        <rect x={400} y={200} width={1120} height={570} fill="#fff" stroke={INK} strokeWidth={7} />
        <line x1={960} y1={200} x2={960} y2={770} stroke={INK} strokeWidth={7} />
        <T x={680} y={260} size={44} fill={GRAY}>this room</T>
        <T x={1240} y={260} size={44} fill={GRAY}>the other room</T>
        <StickMan x={640} y={770} scale={1.7} face="happy" pose="stand" />
        <g transform={`translate(${lerp(760, 1300, move)} ${lerp(600, 690, move)}) rotate(${lerp(0, 90, move)})`}>
          <rect x={-18} y={-32} width={36} height={64} rx={6} fill="#2b2b2b" />
          <rect x={-14} y={-26} width={28} height={50} rx={3} fill="#8fd3ff" />
        </g>
        <path d="M 1260 380 l 24 -14 v 60 l -24 -14 h -26 v -32 z" fill={GRAY} stroke={INK} strokeWidth={4} opacity={move > 0.9 ? 1 : 0} />
        <line x1={1316} y1={370} x2={1370} y2={430} stroke={RED} strokeWidth={8} opacity={move > 0.9 ? 1 : 0} />
        <line x1={1370} y1={370} x2={1316} y2={430} stroke={RED} strokeWidth={8} opacity={move > 0.9 ? 1 : 0} />
      </g>
    );
  }
  if (variant === "noshame") {
    return (
      <g>
        <Ground />
        <StickMan x={960} y={GROUND} scale={2.3} pose="shrug" face="happy" />
        <T x={960} y={250} size={64}>a hungry forager is not guilty of anything</T>
        <Bush x={1500} y={GROUND} s={1.3} berries={12} />
      </g>
    );
  }
  // steer
  const hand = reachHand(760, GROUND, 2.2);
  return (
    <g>
      <Ground />
      <StickMan x={760} y={GROUND} scale={2.2} pose="reach" face="happy" lookX={3} />
      <g transform={`translate(${hand.x + 20} ${hand.y}) rotate(${sin(f * 0.04) * 40})`}>
        <circle r={95} fill="none" stroke={INK} strokeWidth={12} />
        <circle r={14} fill={INK} />
        {[0, 120, 240].map((a) => (
          <line key={a} x1={0} y1={0} x2={0} y2={-95} stroke={INK} strokeWidth={9} transform={`rotate(${a})`} />
        ))}
      </g>
      <Brain x={1400} y={420} s={1.3} />
      <T x={1400} y={600} size={50}>who is steering it?</T>
    </g>
  );
};

// ------------------------------------------------------------------ end
const EndScene: React.FC<SceneProps> = ({f}) => {
  return (
    <g>
      <Ground />
      {Array.from({length: 8}).map((_, i) => (
        <StickMan key={i} x={160 + i * 130} y={GROUND - 20} scale={0.9} pose="walk" phase={i * 0.7} color={GRAY} opacity={0.35 + i * 0.03} flip />
      ))}
      <StickMan x={1250} y={GROUND} scale={2.4} pose="reach" phone face="happy" lookX={3} />
      <T x={650} y={250 + sin(f * 0.1) * 6} size={54} fill={GRAY}>200,000 years of looking</T>
    </g>
  );
};

export const SCENES: Record<string, React.FC<SceneProps>> = {
  phone: PhoneScene,
  grass: GrassScene,
  rat: RatScene,
  brain: BrainScene,
  monkey: MonkeyScene,
  slot: SlotScene,
  feed: FeedScene,
  forage: ForageScene,
  tribe: TribeScene,
  mismatch: MismatchScene,
  advice: AdviceScene,
  end: EndScene,
};
