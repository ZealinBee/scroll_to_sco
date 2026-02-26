"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Bone,
  Ruler,
  MapPin,
  ArrowLeftRight,
  Target,
  Dumbbell,
  LucideIcon,
  Loader2,
  FlipHorizontal2,
  Check,
  AlertTriangle,
  ChevronLeft,
  Scan,
  Camera,
  Activity,
  ShieldCheck,
} from "lucide-react";
import PhotoGuidance from "./components/PhotoGuidance";

// Types for orientation
type ImageOrientation = "standard" | "flipped" | "unknown";
type AnalysisType = "xray" | "photo" | null;
type Step = "select" | "guidance" | "upload" | "confirm";

interface DetectedMarker {
  marker: string;
  position: string;
  confidence: number;
}

interface OrientationDetectionResult {
  detected_marker: DetectedMarker | null;
  suggested_orientation: ImageOrientation;
  confidence: number;
}

interface OrientationDetectionResponse {
  success: boolean;
  detection_result: OrientationDetectionResult;
  preview_image: string;
}

function FeatureItem({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <span className="text-sm text-dark">{text}</span>
    </div>
  );
}

function AnalysisTypeCard({
  icon: Icon,
  title,
  subtitle,
  description,
  features,
  onClick,
  recommended,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass p-6 text-left space-y-4 transition-all hover:shadow-lg hover:translate-y-[-2px] ${
        recommended ? "ring-2 ring-primary/30" : ""
      }`}
    >
      {recommended && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <ShieldCheck size={12} />
          Clinical Grade
        </div>
      )}
      <div className="w-12 h-12 rounded-[16px] bg-primary/10 flex items-center justify-center">
        <Icon size={24} className="text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-dark">{title}</h3>
        <p className="text-sm text-primary font-medium">{subtitle}</p>
      </div>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
      <div className="space-y-2 pt-2">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted">
            <Check size={14} className="text-primary" />
            {feature}
          </div>
        ))}
      </div>
    </button>
  );
}

function OrientationConfirmation({
  previewImage,
  detectionResult,
  isFlipped,
  onFlip,
  onConfirm,
  onBack,
  isLoading,
}: {
  previewImage: string;
  detectionResult: OrientationDetectionResult | null;
  isFlipped: boolean;
  onFlip: () => void;
  onConfirm: (orientation: ImageOrientation) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [selectedOrientation, setSelectedOrientation] =
    useState<ImageOrientation>(
      detectionResult?.suggested_orientation === "unknown"
        ? "standard"
        : detectionResult?.suggested_orientation || "standard"
    );

  const hasMarker = detectionResult?.detected_marker !== null;
  const confidence = detectionResult?.confidence || 0;

  return (
    <div className="glass p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-[16px] bg-primary/10 flex items-center justify-center">
          <ArrowLeftRight size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-dark">
          Confirm Image Orientation
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Correct orientation ensures accurate left/right curve detection
        </p>
      </div>

      {/* Image Preview with Flip Control */}
      <div className="space-y-4">
        <div className="relative rounded-[16px] overflow-hidden bg-dark/5">
          <img
            src={previewImage}
            alt="X-ray preview"
            className={`w-full h-64 object-contain transition-transform duration-300 ${
              isFlipped ? "scale-x-[-1]" : ""
            }`}
          />

          {/* Flip Button Overlay */}
          <button
            onClick={onFlip}
            className="absolute bottom-4 right-4 btn btn-secondary p-3"
            title="Flip image horizontally"
          >
            <FlipHorizontal2 size={20} />
          </button>

          {/* Orientation Labels */}
          <div className="absolute top-4 left-4 glass-subtle px-3 py-1.5 text-xs font-medium text-dark">
            {isFlipped ? "Patient R" : "Patient L"}
          </div>
          <div className="absolute top-4 right-4 glass-subtle px-3 py-1.5 text-xs font-medium text-dark">
            {isFlipped ? "Patient L" : "Patient R"}
          </div>
        </div>

        {/* Flip Status */}
        {isFlipped && (
          <div className="glass-subtle p-3 flex items-center gap-2 text-sm">
            <FlipHorizontal2 size={16} className="text-primary" />
            <span className="text-dark">Image has been flipped</span>
          </div>
        )}
      </div>

      {/* Detection Result */}
      {hasMarker ? (
        <div className="glass-subtle p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-primary" />
            <span className="font-medium text-dark">
              &quot;{detectionResult?.detected_marker?.marker}&quot; marker
              detected
            </span>
            <span className="text-xs text-muted">
              ({(confidence * 100).toFixed(0)}% confidence)
            </span>
          </div>
          <p className="text-sm text-muted">
            Based on the marker position, this appears to be a{" "}
            <span className="font-medium text-dark">
              {detectionResult?.suggested_orientation === "standard"
                ? "standard PA view"
                : "mirrored image"}
            </span>
          </p>
        </div>
      ) : (
        <div className="glass-subtle p-4 space-y-2 border border-yellow-200 bg-yellow-50/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-600" />
            <span className="font-medium text-dark">
              No L/R marker detected
            </span>
          </div>
          <p className="text-sm text-muted">
            Please verify the orientation manually. In a standard PA X-ray, the
            patient&apos;s left side appears on the right side of the image.
          </p>
        </div>
      )}

      {/* Confirmation Selection */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-dark">Confirm orientation:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedOrientation("standard")}
            className={`p-4 rounded-[16px] border-2 transition-all text-left ${
              selectedOrientation === "standard"
                ? "border-primary bg-primary/10"
                : "border-primary/20 hover:border-primary/40"
            }`}
          >
            <p className="font-medium text-dark">Standard View</p>
            <p className="text-xs text-muted">Patient&apos;s left on image right</p>
          </button>
          <button
            onClick={() => setSelectedOrientation("flipped")}
            className={`p-4 rounded-[16px] border-2 transition-all text-left ${
              selectedOrientation === "flipped"
                ? "border-primary bg-primary/10"
                : "border-primary/20 hover:border-primary/40"
            }`}
          >
            <p className="font-medium text-dark">Mirrored View</p>
            <p className="text-xs text-muted">Patient&apos;s left on image left</p>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="btn btn-secondary flex-1"
          disabled={isLoading}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={() => onConfirm(selectedOrientation)}
          className="btn btn-primary flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Confirm & Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Analysis type selection
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [step, setStep] = useState<Step>("select");

  // Orientation confirmation state (for X-ray)
  const [detectionResult, setDetectionResult] =
    useState<OrientationDetectionResult | null>(null);
  const [previewWithMarker, setPreviewWithMarker] = useState<string | null>(
    null
  );
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setDetectionResult(null);
    setPreviewWithMarker(null);
    setIsFlipped(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  // Select analysis type
  const handleSelectXray = () => {
    setAnalysisType("xray");
    setStep("upload");
  };

  const handleSelectPhoto = () => {
    setAnalysisType("photo");
    setStep("guidance");
  };

  const handleBackToSelect = () => {
    setStep("select");
    setAnalysisType(null);
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  const handleGuidanceReady = () => {
    setStep("upload");
  };

  const handleBackToGuidance = () => {
    setStep("guidance");
    setSelectedFile(null);
    setPreview(null);
  };

  // X-ray specific: Continue to orientation confirmation
  const handleContinueToConfirm = async () => {
    if (!preview) return;

    setIsDetecting(true);
    setError(null);

    try {
      const response = await fetch("/api/detect-orientation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });

      const data: OrientationDetectionResponse = await response.json();

      if (data.success) {
        setDetectionResult(data.detection_result);
        setPreviewWithMarker(data.preview_image);
      } else {
        setDetectionResult({
          detected_marker: null,
          suggested_orientation: "unknown",
          confidence: 0,
        });
        setPreviewWithMarker(null);
      }
    } catch (err) {
      console.error("Orientation detection error:", err);
      setDetectionResult({
        detected_marker: null,
        suggested_orientation: "unknown",
        confidence: 0,
      });
      setPreviewWithMarker(null);
    } finally {
      setIsDetecting(false);
      setStep("confirm");
    }
  };

  const handleBackToUpload = () => {
    setStep("upload");
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // X-ray: Confirm and analyze
  const handleConfirmAndAnalyze = async (
    confirmedOrientation: ImageOrientation
  ) => {
    if (!preview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: preview,
          confirmed_orientation: confirmedOrientation,
          image_flipped: isFlipped,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail?.error || "Analysis failed"
        );
      }

      // Store with type indicator
      sessionStorage.setItem("analysisResults", JSON.stringify({ ...data, type: "xray" }));
      router.push("/results");
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze image. Please try again."
      );
      setStep("upload");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Photo: Analyze directly (no orientation step)
  const handleAnalyzePhoto = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail?.error || "Analysis failed"
        );
      }

      // Store with type indicator
      sessionStorage.setItem("analysisResults", JSON.stringify({ ...data, type: "photo" }));
      router.push("/results");
    } catch (err) {
      console.error("Photo analysis error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze photo. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render analysis type selection
  if (step === "select") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <main className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles size={16} />
              AI-Powered Analysis
            </div>
            <h1 className="text-4xl font-semibold text-dark leading-tight">
              Let&apos;s take a look at your spine
            </h1>
            <p className="text-muted text-lg leading-relaxed max-w-md mx-auto">
              Choose how you&apos;d like to analyze your spinal health
            </p>
          </div>

          {/* Analysis Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalysisTypeCard
              icon={Scan}
              title="X-ray Analysis"
              subtitle="Clinical Diagnosis"
              description="Upload a spine X-ray for precise Cobb angle measurement and Schroth classification."
              features={[
                "Accurate vertebrae detection",
                "Cobb angle measurement",
                "Schroth type classification",
                "Personalized exercises",
              ]}
              onClick={handleSelectXray}
              recommended
            />
            <AnalysisTypeCard
              icon={Camera}
              title="Back Photo Screening"
              subtitle="At-home Check"
              description="Take a photo of your back to screen for posture asymmetries that may indicate scoliosis."
              features={[
                "Posture asymmetry detection",
                "Shoulder & hip alignment",
                "Risk assessment",
                "Screening guidance",
              ]}
              onClick={handleSelectPhoto}
            />
          </div>

          {/* Trust Note */}
          <p className="text-center text-xs text-muted">
            Your images are processed securely and never stored without your
            permission.
          </p>
        </main>
      </div>
    );
  }

  // Render photo guidance
  if (step === "guidance" && analysisType === "photo") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <main className="w-full max-w-lg space-y-8">
          <PhotoGuidance onReady={handleGuidanceReady} onBack={handleBackToSelect} />

          {/* Trust Note */}
          <p className="text-center text-xs text-muted">
            Your images are processed securely and never stored without your
            permission.
          </p>
        </main>
      </div>
    );
  }

  // Render X-ray orientation confirmation
  if (step === "confirm" && analysisType === "xray" && preview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <main className="w-full max-w-lg space-y-8">
          <OrientationConfirmation
            previewImage={previewWithMarker || preview || ""}
            detectionResult={detectionResult}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onConfirm={handleConfirmAndAnalyze}
            onBack={handleBackToUpload}
            isLoading={isAnalyzing}
          />

          {/* Error Message */}
          {error && (
            <div className="glass-subtle p-4 border border-red-200 bg-red-50/50">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Trust Note */}
          <p className="text-center text-xs text-muted">
            Your images are processed securely and never stored without your
            permission.
          </p>
        </main>
      </div>
    );
  }

  // Render upload step
  const isXray = analysisType === "xray";
  const isPhoto = analysisType === "photo";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <main className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {isXray ? <Scan size={16} /> : <Camera size={16} />}
            {isXray ? "X-ray Analysis" : "Back Photo Screening"}
          </div>
          <h1 className="text-4xl font-semibold text-dark leading-tight">
            {isXray ? "Upload Your X-ray" : "Upload Your Photo"}
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-md mx-auto">
            {isXray
              ? "Upload an X-ray image of your spine for clinical analysis."
              : "Upload a photo of your back for posture screening."}
          </p>
        </div>

        {/* Upload Card */}
        <div className="glass p-6 space-y-4">
          {!preview ? (
            <div
              className={`relative border-2 border-dashed rounded-[16px] p-8 text-center transition-all duration-200 ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-primary/20 hover:border-primary/40"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />

              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload size={28} className="text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-dark font-medium">
                    {isXray
                      ? "Drag and drop your X-ray here"
                      : "Drag and drop your back photo here"}
                  </p>
                  <p className="text-muted text-sm">or</p>
                </div>
                <button
                  onClick={handleButtonClick}
                  className="btn btn-secondary"
                >
                  <ImageIcon size={18} />
                  Choose from Gallery
                </button>
                <p className="text-xs text-muted">
                  {isXray
                    ? "Supports JPG, PNG, and DICOM files"
                    : "Supports JPG and PNG files"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-[16px] overflow-hidden bg-dark/5">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                    <ImageIcon size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark truncate max-w-[200px]">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-muted">
                      {selectedFile &&
                        (selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setError(null);
                    setDetectionResult(null);
                    setPreviewWithMarker(null);
                  }}
                  className="btn btn-ghost text-sm"
                  disabled={isDetecting || isAnalyzing}
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-subtle p-4 border border-red-200 bg-red-50/50">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* What We Analyze - X-ray specific */}
        {isXray && (
          <div className="glass-subtle p-5">
            <p className="text-sm font-medium text-dark mb-4">
              What we&apos;ll analyze for you
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FeatureItem icon={Bone} text="Vertebrae detection" />
              <FeatureItem icon={Ruler} text="Cobb angle measurement" />
              <FeatureItem icon={MapPin} text="Curve location (T/L/TL)" />
              <FeatureItem icon={ArrowLeftRight} text="Curve direction (L/R)" />
              <FeatureItem icon={Target} text="Schroth classification" />
              <FeatureItem icon={Dumbbell} text="Personalized exercises" />
            </div>
          </div>
        )}

        {/* What We Analyze - Photo specific */}
        {isPhoto && (
          <div className="glass-subtle p-5">
            <p className="text-sm font-medium text-dark mb-4">
              What we&apos;ll screen for
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FeatureItem icon={Activity} text="Shoulder alignment" />
              <FeatureItem icon={Activity} text="Hip alignment" />
              <FeatureItem icon={ArrowLeftRight} text="Trunk shift" />
              <FeatureItem icon={Target} text="Rotation detection" />
              <FeatureItem icon={AlertTriangle} text="Risk assessment" />
              <FeatureItem icon={Sparkles} text="Recommendations" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={isPhoto ? handleBackToGuidance : handleBackToSelect}
            className="btn btn-secondary"
            disabled={isDetecting || isAnalyzing}
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {preview && isXray && (
            <button
              onClick={handleContinueToConfirm}
              disabled={isDetecting}
              className="btn btn-primary flex-1 text-base py-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDetecting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Detecting Orientation...
                </>
              ) : (
                <>
                  <ArrowLeftRight size={20} />
                  Continue to Orientation Check
                </>
              )}
            </button>
          )}

          {preview && isPhoto && (
            <button
              onClick={handleAnalyzePhoto}
              disabled={isAnalyzing}
              className="btn btn-primary flex-1 text-base py-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analyze Photo
                </>
              )}
            </button>
          )}
        </div>

        {/* Trust Note */}
        <p className="text-center text-xs text-muted">
          Your images are processed securely and never stored without your
          permission.
        </p>
      </main>
    </div>
  );
}
