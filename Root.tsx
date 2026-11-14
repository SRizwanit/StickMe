import React from "react";
import {Composition} from "remotion";
import {Video} from "./Video";
import data from "./data.json";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="StickMan"
    component={Video}
    durationInFrames={data.totalFrames}
    fps={data.fps}
    width={data.width}
    height={data.height}
  />
);
