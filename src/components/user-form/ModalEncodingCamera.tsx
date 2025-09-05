"use client";

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, {
  useEffect,
  useRef,
  useState,
  Fragment,
  useCallback,
} from "react";
import * as faceapi from "face-api.js";
import Button from "@/components/Button";

interface IModalEncodingCamera {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
}

type StatusField = [boolean, string];

interface StatusType {
  isLightingGood: StatusField;
  isFace: StatusField;
  isLookingForward: StatusField;
  isDistanceGood: StatusField;
  isExpressionNeutral: StatusField;
}

const defaultStatus: StatusType = {
  isLightingGood: [false, "❌ Lighting is too dim"],
  isFace: [false, "❌ No face detected"],
  isLookingForward: [false, "❌ Not facing the camera"],
  isDistanceGood: [false, "❌ Distance not ideal"],
  isExpressionNeutral: [false, "❌ Expression not neutral"],
};

const ModalEncodingCamera: React.FC<IModalEncodingCamera> = ({
  onCapture,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<StatusType>(defaultStatus);
  const detectionLoopRef = useRef<number>(null);
  const lightingCanvasRef = useRef<HTMLCanvasElement>(null);

  const setup = async () => {
    try {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
          setStatus((prev) => ({
            ...prev,
          }));
        };
      }
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        isCameraLoaded: [false, "❌ Failed to load models or access webcam"],
      }));
      console.error(err);
    }
  };

  const checkLightingCondition = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): StatusField => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return [false, "❌ Failed to load"];

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Read pixel data
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;

    let totalBrightness = 0;
    const numPixels = pixels.length / 4;

    // Loop through every pixel (RGBA)
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Basic perceived brightness formula
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / numPixels;
    // Threshold: 50 is low light, 150+ is good lighting
    if (avgBrightness < 100) {
      return [false, "❌ Lighting is too dim"];
    } else {
      return [true, "✅ Lighting is good"];
    }
  };

  const checkFaceCountStatus = (count: number): StatusField => {
    if (count === 0) return [false, "❌ No face detected"];
    if (count > 1) return [false, "❌ Multiple faces detected"];
    return [true, "✅ One face detected"];
  };

  const checkLookingForward = (
    leftEye: faceapi.Point[],
    rightEye: faceapi.Point[],
    nose: faceapi.Point[]
  ): boolean => {
    const getCenter = (points: faceapi.Point[]) => {
      const sum = points.reduce(
        (acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }),
        { x: 0, y: 0 }
      );
      return {
        x: sum.x / points.length,
        y: sum.y / points.length,
      };
    };

    const leftEyeCenter = getCenter(leftEye);
    const rightEyeCenter = getCenter(rightEye);
    const noseTip = nose[3];

    const eyeDiffY = Math.abs(leftEyeCenter.y - rightEyeCenter.y);
    const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const noseOffsetX = Math.abs(noseTip.x - eyeMidX);

    return eyeDiffY < 4 && noseOffsetX < 8;
  };

  const checkDistanceStatus = (boxWidth: number): StatusField => {
    const MIN_FACE_WIDTH = 300;
    const MAX_FACE_WIDTH = 400;

    if (boxWidth < MIN_FACE_WIDTH) return [false, "❌ Too far"];
    if (boxWidth > MAX_FACE_WIDTH) return [false, "❌ Too close"];
    return [true, "✅ Good distance"];
  };

  const checkExpressionNeutral = (
    expressions: faceapi.FaceExpressions
  ): StatusField => {
    const { neutral = 0 } = expressions;
    return neutral > 0.8
      ? [true, "✅ Neutral expression"]
      : [false, "❌ Expression not neutral"];
  };

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const lightingStatus = checkLightingCondition(
      videoRef.current,
      lightingCanvasRef.current!
    );

    const results = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (context) context.clearRect(0, 0, canvas.width, canvas.height);

    const faceCountStatus = checkFaceCountStatus(results.length);

    if (results.length === 1 && video.offsetWidth) {
      const resizedResult = faceapi.resizeResults(results[0], {
        width: video.offsetWidth,
        height: video.offsetHeight,
      });

      const { landmarks, detection } = resizedResult;

      const isLookingForward = checkLookingForward(
        landmarks.getLeftEye(),
        landmarks.getRightEye(),
        landmarks.getNose()
      );

      const distanceStatus = checkDistanceStatus(detection.box.width);

      const expressionStatus = checkExpressionNeutral(
        resizedResult.expressions
      );

      setStatus({
        isLightingGood: lightingStatus,
        isFace: faceCountStatus,
        isLookingForward: [
          isLookingForward,
          isLookingForward ? "✅ Looking forward" : "❌ Not facing the camera",
        ],
        isDistanceGood: distanceStatus,
        isExpressionNeutral: expressionStatus,
      });

      faceapi.draw.drawDetections(canvas, resizedResult);
      faceapi.draw.drawFaceLandmarks(canvas, resizedResult);
    } else {
      // If 0 or >1 face, reset other statuses too
      setStatus({
        isLightingGood: lightingStatus,
        isFace: faceCountStatus,
        isLookingForward: [false, "❌ Not facing the camera"],
        isDistanceGood: [false, "❌ Distance not ideal"],
        isExpressionNeutral: [false, "❌ Expression not neutral"],
      });
    }

    detectionLoopRef.current = requestAnimationFrame(runDetection);
  }, []);

  const stopVideo = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleCancel = () => {
    setIsReady(false);
    stopVideo();
    onCancel();
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
          stopVideo();
        }
      }, "image/jpeg");
    }
  };

  useEffect(() => {
    if (!isReady) return;

    const updateCanvasSize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.offsetWidth;
        canvasRef.current.height = videoRef.current.offsetHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    detectionLoopRef.current = requestAnimationFrame(runDetection);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
    };
  }, [isReady, runDetection]);

  useEffect(() => {
    setup();
  }, []);

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-4xl flex flex-col gap-2 transform overflow-hidden rounded-lg bg-background p-6 text-left align-middle shadow-xl transition-all">
              <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="absolute w-full h-full object-cover"
                />
                <canvas ref={lightingCanvasRef} style={{ display: "none" }} />

                <canvas ref={canvasRef} className="absolute top-0 left-0" />
                <div className="absolute bottom-2 left-2 right-2 hidden md:flex justify-between items-center px-4 py-2 bg-background/80 text-primary text-sm rounded">
                  <div className="hidden md:grid grid-cols-2 gap-x-8 gap-y-1 text-base text-primary">
                    {Object.entries(status).map(([key, [, message]]) => (
                      <p key={key}>{message}</p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      title="Cancel"
                      onClick={handleCancel}
                      className="px-4"
                      secondary
                    />
                    <Button
                      title="Capture"
                      onClick={handleCapture}
                      className="px-4"
                    />
                  </div>
                </div>
              </div>
              <div className="h-44 md:hidden flex flex-row justify-between">
                <div className="flex flex-col">
                  <h4 className="text-lg font-semibold text-primary">
                    Detection Status
                  </h4>
                  {Object.entries(status).map(([key, [, message]]) => (
                    <p className="text-sm text-primary" key={key}>
                      {message}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col gap-2 justify-end h-full">
                  <Button
                    title="Capture"
                    onClick={handleCapture}
                    className="w-24 py-1 text-base"
                  />
                  <Button
                    title="Cancel"
                    onClick={handleCancel}
                    className="w-24 py-1 text-base"
                    secondary
                  />
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalEncodingCamera;
