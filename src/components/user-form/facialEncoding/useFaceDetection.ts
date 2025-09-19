import { useCallback, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import {
  StatusType,
  defaultStatus,
  checkLightingCondition,
  checkFaceCountStatus,
  checkLookingForward,
  checkDistanceStatus,
  checkExpressionNeutral,
} from "./detection";

export const useFaceDetection = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  lightingCanvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  const [status, setStatus] = useState<StatusType>(defaultStatus);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !lightingCanvasRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lightingCanvas = lightingCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // guard: skip detection if canvas not yet sized
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }

    const lightingStatus = checkLightingCondition(video, lightingCanvas);

    const results = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    context.clearRect(0, 0, canvas.width, canvas.height);
    const faceCountStatus = checkFaceCountStatus(results.length);

    if (results.length === 1) {
      const resized = faceapi.resizeResults(results[0], {
        width: canvas.width,
        height: canvas.height,
      });

      const { landmarks, detection, expressions } = resized;
      const isLookingForward = checkLookingForward(
        landmarks.getLeftEye(),
        landmarks.getRightEye(),
        landmarks.getNose()
      );

      const distanceStatus = checkDistanceStatus(detection.box.width);
      const expressionStatus = checkExpressionNeutral(expressions);

      const newStatus: StatusType = {
        isLightingGood: lightingStatus,
        isFace: faceCountStatus,
        isLookingForward: [
          isLookingForward,
          isLookingForward ? "✅ Face is not tilted" : "❌ Face is tilted",
        ],
        isDistanceGood: distanceStatus,
        isExpressionNeutral: expressionStatus,
      };

      setStatus((prev) =>
        JSON.stringify(prev) === JSON.stringify(newStatus) ? prev : newStatus
      );

      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);
    } else {
      setStatus((prev) => ({
        ...prev,
        isLightingGood: lightingStatus,
        isFace: faceCountStatus,
        isLookingForward: [false, "❌Face is tilted"],
        isDistanceGood: [false, "❌ Distance not ideal"],
        isExpressionNeutral: [false, "❌ Expression not neutral"],
      }));
    }
  }, [videoRef, canvasRef, lightingCanvasRef]);

  const startDetection = () => {
    if (!detectionIntervalRef.current) {
      detectionIntervalRef.current = setInterval(runDetection, 200);
    }
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  return { status, startDetection, stopDetection };
};
