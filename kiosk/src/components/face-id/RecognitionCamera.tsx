"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import ModalUserStatus from "./ModalUserStatus";

const MODEL_URL = "/models";

type DistanceRating = "GOOD" | "TOO FAR" | "TOO CLOSE";

type DetectionBox = {
  box: faceapi.Box;
  id: string;
  distanceValidity: DistanceRating;
};

const FACE_DETECTION_OPTION = new faceapi.TinyFaceDetectorOptions({
  inputSize: 512,
  scoreThreshold: 0.5,
});

const FACE_DISTANCE_THRESHOLD = {
  MIN_RATIO: 0.3,
  MAX_RATIO: 0.6,
};

const DETECTION_INTERVAL_MS = 250;

const RecognitionCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detections, setDetections] = useState<DetectionBox[]>([]);
  const [capturedFace, setCapturedFace] = useState<Blob | null>(null);

  const animationFrameRef = useRef<number>(0);
  const lastDetectionTimeRef = useRef<number>(0);

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const getDistanceValidity = (
    faceWidth: number,
    videoWidth: number
  ): DistanceRating => {
    const min = videoWidth * FACE_DISTANCE_THRESHOLD.MIN_RATIO;
    const max = videoWidth * FACE_DISTANCE_THRESHOLD.MAX_RATIO;
    if (faceWidth < min) return "TOO FAR";
    if (faceWidth > max) return "TOO CLOSE";
    return "GOOD";
  };

  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const now = Date.now();
    if (now - lastDetectionTimeRef.current < DETECTION_INTERVAL_MS) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
      return;
    }
    lastDetectionTimeRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const detections = await faceapi.detectAllFaces(
      video,
      FACE_DETECTION_OPTION
    );
    const resized = faceapi.resizeResults(detections, {
      width: video.videoWidth,
      height: video.videoHeight,
    });

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const newBoxes: DetectionBox[] = [];

    resized.forEach((detection, index) => {
      const { width } = detection.box;
      const distanceValidity = getDistanceValidity(width, canvas.width);

      // Use custom styling per box
      const drawBox = new faceapi.draw.DrawBox(detection.box, {
        label:
          distanceValidity === "GOOD" ? "PRESS FOR OPTIONS" : distanceValidity,
        boxColor: distanceValidity === "GOOD" ? "green" : "orange",
        lineWidth: 2,
      });
      drawBox.draw(canvas);

      newBoxes.push({
        box: detection.box,
        id: `face-${index}`,
        distanceValidity,
      });
    });

    setDetections(newBoxes);
    animationFrameRef.current = requestAnimationFrame(detectFaces);
  }, []);

  const captureFace = (box: faceapi.Box) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const { x, y, width, height } = box;

    // Padding ratios
    const topPadRatio = 0.6;
    const bottomPadRatio = 0.1;
    const sidePadRatio = 0.15;
    // Calculate padding values
    const padTop = height * topPadRatio;
    const padBottom = height * bottomPadRatio;
    const padSide = width * sidePadRatio;

    // Final crop box with clamping
    const cropX = Math.max(0, x - padSide);
    const cropY = Math.max(0, y - padTop);
    const cropWidth = Math.min(video.videoWidth - cropX, width + padSide * 2);
    const cropHeight = Math.min(
      video.videoHeight - cropY,
      height + padTop + padBottom
    );

    // Create temporary canvas and draw the expanded region
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    canvas.toBlob((blob) => {
      if (blob) setCapturedFace(blob);
    }, "image/jpeg");
  };

  const handleBoxClick = (event: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Scaling factor based on rendered size vs actual canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Getting the clicked Bounding Box
    for (const { box, distanceValidity } of detections) {
      if (
        distanceValidity === "GOOD" &&
        clickX >= box.x &&
        clickX <= box.x + box.width &&
        clickY >= box.y &&
        clickY <= box.y + box.height
      ) {
        captureFace(box);
        break;
      }
    }
  };

  useEffect(() => {
    loadModels().then(() => {
      startCamera().then(() => {
        animationFrameRef.current = requestAnimationFrame(detectFaces);
      });
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detectFaces]);

  return (
    <div className="relative h-[80vh] aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-md">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className="absolute w-full h-full"
        onClick={handleBoxClick}
      />

      <ModalUserStatus
        capturedFace={capturedFace}
        onClose={() => setCapturedFace(null)}
      />
    </div>
  );
};

export default RecognitionCamera;
