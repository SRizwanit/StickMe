import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {loadFont} from "@remotion/google-fonts/PatrickHand";
import data from "./data.json";
import voice from "./voice.mp3";
import {SCENES} from "./Scenes";
import {INK, PAPER, RED, YELLOW, GRAY} from "./theme";

const {fontFamily} = loadFont();
const FONT = `${fontFamily}, "Comic Sans MS", "Segoe UI", sans-serif`;

type Chunk = {text: string; from: number; frames: number};
type SceneData = (typeof data.scenes)[number] & {chunks: Chunk[]};

const Caption: React.FC<{chunks: Chunk[]}> = ({chunks}) => {
  const f = useCurrentFrame();
  const chunk = chunks.find((c) => f >= c.from && f < c.from + c.frames) ?? chunks[chunks.length - 1];
  const words = chunk.text.split(" ");
  const p = clamp01((f - chunk.from) / chunk.frames);
  const spoken = Math.floor(p * words.length * 1.08);
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 46,
        minHeight: 150,
        padding: "22px 40px",
        borderRadius: 28,
        background: "rgba(255,253,246,0.94)",
        border: `5px solid ${INK}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontSize: 48,
        lineHeight: 1.25,
        fontWeight: 700,
      }}
    >
      <span>
        {words.map((w, i) => (
          <span key={i} style={{color: i <= spoken ? INK : "#b9b19e"}}>
            {w}{" "}
          </span>
        ))}
      </span>
    </div>
  );
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const Chips: React.FC<{scene: SceneData}> = ({scene}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: f, fps, config: {damping: 14}});
  const out = interpolate(f, [scene.frames - 10, scene.frames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {scene.label && (
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 50,
            padding: "6px 26px",
            background: YELLOW,
            border: `4px solid ${INK}`,
            borderRadius: 12,
            fontSize: 62,
            fontWeight: 700,
            transform: `rotate(-1.5deg) scale(${pop})`,
            transformOrigin: "left top",
            opacity: out,
          }}
        >
          {scene.label}
        </div>
      )}
      {scene.person && (
        <div
          style={{
            position: "absolute",
            left: 74,
            top: scene.label ? 156 : 56,
            fontSize: 46,
            color: GRAY,
            fontWeight: 700,
            opacity: pop * out,
          }}
        >
          {scene.person}
        </div>
      )}
      {scene.year && (
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 50,
            padding: "4px 28px",
            border: `5px solid ${RED}`,
            borderRadius: 16,
            color: RED,
            fontSize: 68,
            fontWeight: 700,
            background: "#fffdf6",
            transform: `rotate(3deg) scale(${pop})`,
            transformOrigin: "right top",
            opacity: out,
          }}
        >
          {scene.year}
        </div>
      )}
    </>
  );
};

const SceneView: React.FC<{scene: SceneData}> = ({scene}) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8], [0, 1], {extrapolateRight: "clamp"});
  const Comp = SCENES[scene.kind] ?? SCENES.phone;
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <svg width={data.width} height={data.height} viewBox="0 0 1920 1080" style={{position: "absolute", inset: 0}}>
        <Comp f={f} dur={scene.frames} variant={scene.variant} />
      </svg>
      <Chips scene={scene} />
      <Caption chunks={scene.chunks} />
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        background: PAPER,
        backgroundImage: "radial-gradient(#e5dfcf 2px, transparent 2px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* shared SVG defs (glow + arrow) used by scenes */}
      <svg width={0} height={0} style={{position: "absolute"}}>
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="#bfe6ff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#bfe6ff" stopOpacity={0} />
          </radialGradient>
          <marker id="arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={INK} />
          </marker>
        </defs>
      </svg>
      <Audio src={voice} />
      {(data.scenes as unknown as SceneData[]).map((s) => (
        <Sequence key={s.id} from={s.start} durationInFrames={s.frames}>
          <SceneView scene={s} />
        </Sequence>
      ))}
      <div style={{position: "absolute", left: 0, bottom: 0, height: 10, width: `${(f / data.totalFrames) * 100}%`, background: RED}} />
    </AbsoluteFill>
  );
};
