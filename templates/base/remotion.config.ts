import os from "node:os";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// WebGL (three.js) : angle utilise le GPU, swangle est le repli logiciel
Config.setChromiumOpenGlRenderer("angle");
Config.setConcurrency(Math.max(1, Math.min(4, os.cpus().length)));
Config.setStudioPort(3012);
