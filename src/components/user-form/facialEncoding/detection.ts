import * as faceapi from "face-api.js";

export type StatusField = [boolean, string];

export interface StatusType {
  isLightingGood: StatusField;
  isFace: StatusField;
  isLookingForward: StatusField;
  isDistanceGood: StatusField;
  isExpressionNeutral: StatusField;
}

export const defaultStatus: StatusType = {
  isLightingGood: [false, "❌ Lighting is too dim"],
  isFace: [false, "❌ No face detected"],
  isLookingForward: [false, "❌ Not facing the camera"],
  isDistanceGood: [false, "❌ Distance not ideal"],
  isExpressionNeutral: [false, "❌ Expression not neutral"],
};

const MIN_FACE_WIDTH = 250;
const MAX_FACE_WIDTH = 350;
const AVG_BRIGHTNESS = 100;

export const checkLightingCondition = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): StatusField => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [false, "❌ Failed to check lighting"];

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = frame.data;
  let totalBrightness = 0;
  const numPixels = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i],
      g = pixels[i + 1],
      b = pixels[i + 2];
    totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const avgBrightness = totalBrightness / numPixels;
  return avgBrightness < AVG_BRIGHTNESS
    ? [false, "❌ Lighting might be dim"]
    : [true, "✅ Lighting is good"];
};

export const checkFaceCountStatus = (count: number): StatusField => {
  if (count === 0) return [false, "❌ No face detected"];
  if (count > 1) return [false, "❌ Multiple faces detected"];
  return [true, "✅ Single face detected"];
};

export const checkLookingForward = (
  leftEye: faceapi.Point[],
  rightEye: faceapi.Point[],
  nose: faceapi.Point[]
): boolean => {
  const getCenter = (points: faceapi.Point[]) => {
    const sum = points.reduce(
      (acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }),
      { x: 0, y: 0 }
    );
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const leftEyeCenter = getCenter(leftEye);
  const rightEyeCenter = getCenter(rightEye);
  const noseTip = nose[3];

  const eyeDiffY = Math.abs(leftEyeCenter.y - rightEyeCenter.y);
  const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
  const noseOffsetX = Math.abs(noseTip.x - eyeMidX);

  return eyeDiffY < 4 && noseOffsetX < 8;
};

export const checkDistanceStatus = (boxWidth: number): StatusField => {
  if (boxWidth < MIN_FACE_WIDTH) return [false, "❌ Too far"];
  if (boxWidth > MAX_FACE_WIDTH) return [false, "❌ Too close"];
  return [true, `✅ Good distance`];
};

export const checkExpressionNeutral = (
  expressions: faceapi.FaceExpressions
): StatusField => {
  return expressions.neutral && expressions.neutral > 0.8
    ? [true, "✅ Neutral expression"]
    : [false, "❌ Expression not neutral"];
};
