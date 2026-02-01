"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type PoseLandmarker = any; // Type from MediaPipe, lazily loaded

interface PostureFeedback {
  shoulderAlignment: "good" | "raise_left" | "raise_right" | "unknown";
  hipAlignment: "good" | "level_left" | "level_right" | "unknown";
  overallPosture: "excellent" | "good" | "needs_adjustment" | "unknown";
  message: string;
}

interface CameraOverlayProps {
  enabled: boolean;
  onToggle: () => void;
  expandSide: "left" | "right";
}

export default function CameraOverlay({
  enabled,
  onToggle,
  expandSide,
}: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [status, setStatus] = useState<
    "disabled" | "requesting" | "loading" | "active" | "error"
  >("disabled");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [feedback, setFeedback] = useState<PostureFeedback>({
    shoulderAlignment: "unknown",
    hipAlignment: "unknown",
    overallPosture: "unknown",
    message: "Initializing...",
  });

  // Load MediaPipe lazily
  const loadPoseLandmarker = useCallback(async () => {
    try {
      setStatus("loading");

      // Dynamically import MediaPipe
      const { PoseLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        }
      );

      poseLandmarkerRef.current = poseLandmarker;
      return true;
    } catch (error) {
      console.error("Failed to load pose landmarker:", error);
      setErrorMessage("Failed to load pose detection model");
      setStatus("error");
      return false;
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Load pose landmarker
        const loaded = await loadPoseLandmarker();
        if (loaded) {
          setStatus("active");
          startDetection();
        }
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      if (error.name === "NotAllowedError") {
        setErrorMessage("Camera permission denied. Please allow camera access.");
      } else if (error.name === "NotFoundError") {
        setErrorMessage("No camera found on this device.");
      } else {
        setErrorMessage("Failed to access camera.");
      }
      setStatus("error");
    }
  }, [loadPoseLandmarker]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setStatus("disabled");
    setFeedback({
      shoulderAlignment: "unknown",
      hipAlignment: "unknown",
      overallPosture: "unknown",
      message: "Camera disabled",
    });
  }, []);

  // Analyze pose and provide feedback
  const analyzePose = useCallback(
    (landmarks: any[]) => {
      if (!landmarks || landmarks.length === 0) {
        setFeedback({
          ...feedback,
          message: "No pose detected - please stand in frame",
        });
        return;
      }

      const pose = landmarks[0];

      // Key landmarks indices (MediaPipe pose)
      const LEFT_SHOULDER = 11;
      const RIGHT_SHOULDER = 12;
      const LEFT_HIP = 23;
      const RIGHT_HIP = 24;

      const leftShoulder = pose[LEFT_SHOULDER];
      const rightShoulder = pose[RIGHT_SHOULDER];
      const leftHip = pose[LEFT_HIP];
      const rightHip = pose[RIGHT_HIP];

      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
        setFeedback({
          ...feedback,
          message: "Please make sure your upper body is visible",
        });
        return;
      }

      // Calculate alignment
      const shoulderDiff = rightShoulder.y - leftShoulder.y;
      const hipDiff = rightHip.y - leftHip.y;

      // Threshold for "good" alignment (normalized coordinates)
      const threshold = 0.03;

      let shoulderAlignment: PostureFeedback["shoulderAlignment"] = "good";
      let hipAlignment: PostureFeedback["hipAlignment"] = "good";
      let messages: string[] = [];

      // Shoulder analysis
      if (Math.abs(shoulderDiff) > threshold) {
        if (shoulderDiff > 0) {
          shoulderAlignment = "raise_right";
          if (expandSide === "left") {
            messages.push("Good - left side elevated for expansion");
          } else {
            messages.push("Try to raise your right shoulder slightly");
          }
        } else {
          shoulderAlignment = "raise_left";
          if (expandSide === "right") {
            messages.push("Good - right side elevated for expansion");
          } else {
            messages.push("Try to raise your left shoulder slightly");
          }
        }
      } else {
        messages.push("Shoulders are level");
      }

      // Hip analysis
      if (Math.abs(hipDiff) > threshold) {
        if (hipDiff > 0) {
          hipAlignment = "level_right";
        } else {
          hipAlignment = "level_left";
        }
        messages.push("Keep hips level");
      } else {
        messages.push("Hips are level");
      }

      // Overall assessment
      let overallPosture: PostureFeedback["overallPosture"] = "good";
      if (
        shoulderAlignment === "good" &&
        hipAlignment === "good"
      ) {
        overallPosture = "excellent";
      } else if (
        shoulderAlignment !== "good" &&
        hipAlignment !== "good"
      ) {
        overallPosture = "needs_adjustment";
      }

      setFeedback({
        shoulderAlignment,
        hipAlignment,
        overallPosture,
        message: messages[0] || "Good posture",
      });
    },
    [expandSide, feedback]
  );

  // Detection loop
  const startDetection = useCallback(() => {
    const detect = () => {
      if (
        videoRef.current &&
        canvasRef.current &&
        poseLandmarkerRef.current &&
        status === "active"
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState >= 2) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw video frame (mirrored)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          // Run pose detection
          const results = poseLandmarkerRef.current.detectForVideo(
            video,
            performance.now()
          );

          if (results?.landmarks) {
            analyzePose(results.landmarks);

            // Draw landmarks
            if (results.landmarks[0]) {
              drawLandmarks(ctx, results.landmarks[0], canvas.width);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [status, analyzePose]);

  // Draw pose landmarks
  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    canvasWidth: number
  ) => {
    // Key points to draw (shoulders, hips)
    const keyPoints = [11, 12, 23, 24]; // Left/right shoulder, left/right hip

    // Draw points
    landmarks.forEach((landmark, index) => {
      if (keyPoints.includes(index)) {
        // Mirror x coordinate
        const x = canvasWidth - landmark.x * canvasWidth;
        const y = landmark.y * ctx.canvas.height;

        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = index <= 12 ? "#3F9B61" : "#4CAF73"; // Shoulders green, hips lighter
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw connections
    const connections = [
      [11, 12], // Shoulders
      [23, 24], // Hips
      [11, 23], // Left side
      [12, 24], // Right side
    ];

    connections.forEach(([from, to]) => {
      const fromLandmark = landmarks[from];
      const toLandmark = landmarks[to];

      if (fromLandmark && toLandmark) {
        ctx.beginPath();
        ctx.moveTo(
          canvasWidth - fromLandmark.x * canvasWidth,
          fromLandmark.y * ctx.canvas.height
        );
        ctx.lineTo(
          canvasWidth - toLandmark.x * canvasWidth,
          toLandmark.y * ctx.canvas.height
        );
        ctx.strokeStyle = "rgba(63, 155, 97, 0.5)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  // Handle toggle
  useEffect(() => {
    if (enabled && status === "disabled") {
      startCamera();
    } else if (!enabled && status !== "disabled") {
      stopCamera();
    }
  }, [enabled, status, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, [stopCamera]);

  // Restart detection when status becomes active
  useEffect(() => {
    if (status === "active") {
      startDetection();
    }
  }, [status, startDetection]);

  return (
    <div className="relative w-full h-full min-h-[200px] rounded-[16px] overflow-hidden bg-dark/5">
      {/* Video element (hidden, used for capture) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Canvas for displaying processed video */}
      {status === "active" && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay states */}
      {status === "disabled" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark/5">
          <CameraOff size={32} className="text-muted" />
          <p className="text-sm text-muted">Camera disabled</p>
          <button
            onClick={onToggle}
            className="btn btn-secondary text-sm py-2 px-4"
          >
            <Camera size={16} />
            Enable Camera
          </button>
        </div>
      )}

      {(status === "requesting" || status === "loading") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark/5">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm text-muted">
            {status === "requesting"
              ? "Requesting camera access..."
              : "Loading pose detection..."}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark/5 p-4">
          <AlertCircle size={32} className="text-red-500" />
          <p className="text-sm text-muted text-center">{errorMessage}</p>
          <button
            onClick={() => {
              setStatus("disabled");
              setErrorMessage("");
            }}
            className="btn btn-ghost text-sm py-2 px-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active state controls */}
      {status === "active" && (
        <>
          {/* Toggle button */}
          <button
            onClick={onToggle}
            className="absolute top-3 right-3 p-2 rounded-[10px] bg-white/80 backdrop-blur-sm hover:bg-white transition-all"
          >
            <CameraOff size={16} className="text-dark" />
          </button>

          {/* Feedback indicator */}
          <div className="absolute bottom-3 left-3 right-3">
            <div
              className={`px-3 py-2 rounded-[12px] backdrop-blur-sm flex items-center gap-2 ${
                feedback.overallPosture === "excellent"
                  ? "bg-primary/80 text-white"
                  : feedback.overallPosture === "good"
                  ? "bg-primary/60 text-white"
                  : feedback.overallPosture === "needs_adjustment"
                  ? "bg-dark/60 text-white"
                  : "bg-dark/40 text-white"
              }`}
            >
              {feedback.overallPosture === "excellent" ? (
                <CheckCircle2 size={16} />
              ) : feedback.overallPosture === "needs_adjustment" ? (
                <XCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span className="text-sm">{feedback.message}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
