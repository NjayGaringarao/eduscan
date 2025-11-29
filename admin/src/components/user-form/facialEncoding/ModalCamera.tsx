"use client";

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { useEffect, useRef, useState, Fragment } from "react";
import * as faceapi from "face-api.js";
import Button from "@/components/Button";
import { useFaceDetection } from "./useFaceDetection";

interface IModalCamera {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
}

const ModalCamera = ({ onCapture, onCancel }: IModalCamera) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isReady, setIsReady] = useState(false);
  const { status, startDetection, stopDetection } = useFaceDetection(
    videoRef,
    canvasRef,
    lightingCanvasRef
  );

  const setup = async () => {
    try {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);

          // ensure canvas is sized immediately to avoid width=0 errors
          if (videoRef.current && canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      }
    } catch (err) {
      console.error("Failed to initialize camera:", err);
    }
  };

  const stopVideo = () => {
    stopDetection();
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
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
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        videoRef.current.width = width;
        videoRef.current.height = height;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    startDetection();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      stopDetection();
    };
  }, [isReady]);

  useEffect(() => {
    setup();
    return () => stopVideo();
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
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas ref={lightingCanvasRef} style={{ display: "none" }} />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />

                <div className="absolute bottom-4 left-4 right-4 hidden md:flex justify-between items-center px-4 py-2 bg-background/60 backdrop-blur-sm text-primary text-sm rounded-lg">
                  <div className="hidden md:grid grid-cols-2 gap-x-8 gap-y-1 text-base text-primary font-medium">
                    {Object.entries(status).map(([key, [, message]]) => (
                      <p key={key}>{message}</p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      title="Capture"
                      onClick={handleCapture}
                      className="w-32"
                    />
                    <Button
                      title="Cancel"
                      onClick={handleCancel}
                      className="w-32"
                      secondary
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

export default ModalCamera;
